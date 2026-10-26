const crypto=require('crypto');const router=require('express').Router();const Razorpay=require('razorpay');const {Order,Payment,Member,Notification,Coupon,Plan}=require('../models');const {requireAuth,requireRole}=require('../middleware/auth');const {sendSms}=require('../sms');
const {getMembershipBalance, addDaysISO, normalizeDate}=require('../membership-balance');
function rp(){if(!process.env.RAZORPAY_KEY_ID||!process.env.RAZORPAY_KEY_SECRET)return null;return new Razorpay({key_id:process.env.RAZORPAY_KEY_ID,key_secret:process.env.RAZORPAY_KEY_SECRET});}
function addDays(base,days){const d=new Date(base);d.setHours(0,0,0,0);d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}
function normalizePaymentMethod(value){const method=String(value||'cash').trim().toLowerCase();const allowed=['cash','upi','bank transfer','card','online','other'];if(!allowed.includes(method))throw Object.assign(new Error('Choose cash, UPI, bank transfer, card, online, or other'),{status:400});return method;}
router.post('/manual',requireAuth,requireRole('admin'),async(req,res,next)=>{
 let session;
 try{
  const memberCode=String(req.body?.memberCode||'').trim().toUpperCase();
  const amount=Number(req.body?.amount);
  const idempotencyKey=String(req.body?.idempotencyKey||'').trim().slice(0,160);
  const method=normalizePaymentMethod(req.body?.method);
  if(!memberCode||!Number.isFinite(amount)||amount<=0)return res.status(400).json({error:'Member and a valid amount are required'});
  if(!idempotencyKey)return res.status(400).json({error:'Payment request ID is required; please retry from the website'});
  const existingPayment=await Payment.findOne({idempotencyKey}).lean();
  if(existingPayment){
   const member=await Member.findOne({memberCode:existingPayment.memberId}).lean();
   const notification=await Notification.findOne({dedupeKey:'payment:'+idempotencyKey}).lean();
   return res.json({ok:true,alreadyRecorded:true,payment:existingPayment,member:member?{memberCode:member.memberCode,feeDueDate:member.feeDueDate}:null,communication:{sent:notification?.smsStatus==='sent',status:notification?.smsStatus||'unknown',reason:'Payment was already recorded; message was not resent.'}});
  }
  const paymentId='MANUAL-'+Date.now().toString(36).toUpperCase()+'-'+crypto.randomBytes(4).toString('hex').toUpperCase();
  const notificationIdempotency='payment:'+idempotencyKey;
  let memberSnapshot,payment,notification;
  // Atlas supports transactions; the fee date and payment record must commit together.
  session=await require('mongoose').startSession();
  await session.withTransaction(async()=>{
   const m=await Member.findOne({memberCode,active:true}).session(session);
   if(!m)throw Object.assign(new Error('Active member not found'),{status:404});
   const billingPeriodDueDate=normalizeDate(m.feeDueDate)||new Date().toISOString().slice(0,10);
   const balanceBefore=await getMembershipBalance(m,billingPeriodDueDate,session);
   const paidInPeriod=balanceBefore.paid+amount;
   if(paidInPeriod+0.00001>=balanceBefore.fee){
    const baseDate=normalizeDate(m.feeDueDate)||new Date().toISOString().slice(0,10);
    const today=new Date().toISOString().slice(0,10);
    m.feeDueDate=addDaysISO(baseDate>today?baseDate:today,30);
   }
   await m.save({session});
   const docs=await Payment.create([{
    paymentId,idempotencyKey,orderId:paymentId,memberId:m.memberCode,memberName:m.name,phone:m.phone,
    amount,method,mode:'membership-renewal',status:'Paid',billingPeriodDueDate,provider:'manual',date:new Date()
   }],{session});
   payment=docs[0].toObject();
   const nDocs=await Notification.create([{
    memberId:m.memberCode,title:'Membership fee marked paid',
    message:`Hi ${m.name}, Garuda Fitness Zone received your membership fee of ₹${amount}. Your next due date is ${m.feeDueDate}.`,
    type:'payment-confirmation',channel:(process.env.SMS_PROVIDER||'none').toLowerCase()==='meta-whatsapp'?'whatsapp':'sms',dedupeKey:notificationIdempotency,smsStatus:'pending'
   }],{session});
   notification=nDocs[0].toObject();
   memberSnapshot={memberCode:m.memberCode,feeDueDate:m.feeDueDate,name:m.name,phone:m.phone};
  });
  await session.endSession();session=null;
  let communication={sent:false,status:'skipped',reason:'Notification provider is not configured'};
  try{
   const message=`Hi ${memberSnapshot.name}, Garuda Fitness Zone received your membership fee of ₹${amount}. Your next due date is ${memberSnapshot.feeDueDate}.`;
   const result=await sendSms({to:memberSnapshot.phone,message,templateName:process.env.META_TEMPLATE_PAYMENT,templateParams:[memberSnapshot.name||'Member',String(amount),memberSnapshot.feeDueDate]});
   communication={...result,status:result.sent?'sent':'skipped'};
   await Notification.updateOne({_id:notification._id},{$set:{smsStatus:result.sent?'sent':'skipped',smsMessageId:result.messageId||null,smsError:result.sent?null:(result.reason||'Provider did not send')}});
  }catch(error){
   communication={sent:false,status:'failed',reason:error.message};
   await Notification.updateOne({_id:notification._id},{$set:{smsStatus:'failed',smsError:error.message}}).catch(()=>{});
   console.warn('[GFZ payment confirmation delivery failed]',error.message);
  }
  res.status(201).json({ok:true,payment,member:{memberCode:memberSnapshot.memberCode,feeDueDate:memberSnapshot.feeDueDate},communication,whatsapp:communication});
 }catch(e){
  if(session)await session.endSession().catch(()=>{});
  if(e?.code===11000&&req.body?.idempotencyKey){
   try{const payment=await Payment.findOne({idempotencyKey:String(req.body.idempotencyKey)}).lean();if(payment)return res.json({ok:true,alreadyRecorded:true,payment,communication:{sent:false,status:'skipped',reason:'Payment was already recorded; message was not resent.'}})}catch(_){}
  }
  next(e);
 }
});
router.post('/create-order',requireAuth,async(req,res,next)=>{try{
 const {items=[],type='store',customer={},memberId,couponCode,planName}=req.body||{};
 let pricedItems=[],subtotal=0,renewalPlan=null;
 if(type==='membership-renewal'){
   if(req.user.role!=='member'||req.user.memberCode!==String(memberId||req.user.memberCode).toUpperCase())return res.status(403).json({error:'Invalid membership renewal'});
   const m=await Member.findOne({memberCode:req.user.memberCode,active:true});if(!m)return res.status(404).json({error:'Member not found'});
   if(planName){renewalPlan=await Plan.findOne({name:planName});if(!renewalPlan)return res.status(400).json({error:'Membership plan not found'});}
   const amount=renewalPlan?Number(renewalPlan.price):Number(m.monthlyFee||0);if(amount<=0)return res.status(400).json({error:'Membership price is not configured'});
   pricedItems=[{id:renewalPlan?renewalPlan.name:'membership-renewal',name:renewalPlan?.name||'Membership renewal',price:amount,qty:1,type:'plan'}];subtotal=amount;
 } else {
   if(!Array.isArray(items)||!items.length)return res.status(400).json({error:'Cart is empty'});
   for(const raw of items){const qty=Math.max(1,Math.min(99,Number(raw.qty)||1));if(raw.type==='plan'||String(raw.id||'').startsWith('plan:')){const name=String(raw.name||raw.id||'').replace(/^plan:/,'');const p=await Plan.findOne({name});if(!p||p.enquiryOnly||Number(p.price)<=0)return res.status(400).json({error:'Invalid membership item'});pricedItems.push({id:'plan:'+p.name,name:p.name,price:p.price,qty,type:'plan'});subtotal+=p.price*qty;}else{const p=await Product.findOne({id:String(raw.id)});if(!p||p.inStock===false)return res.status(400).json({error:'Product unavailable: '+raw.id});pricedItems.push({id:p.id,name:p.name,price:p.price,qty,type:'product'});subtotal+=p.price*qty;}}
 }
 let discount=0,coupon=null;
 if(couponCode){coupon=await Coupon.findOne({code:String(couponCode).trim().toUpperCase(),active:true});if(!coupon)return res.status(400).json({error:'Coupon not found'});if(coupon.expiresAt&&coupon.expiresAt<new Date())return res.status(400).json({error:'Coupon expired'});if(coupon.usageLimit&&coupon.usedCount>=coupon.usageLimit)return res.status(400).json({error:'Coupon limit reached'});if(subtotal<coupon.minOrder)return res.status(400).json({error:`Minimum order is ₹${coupon.minOrder}`});discount=coupon.type==='percent'?Math.min(subtotal,subtotal*coupon.value/100):Math.min(subtotal,coupon.value);}
 const total=Math.max(0,Math.round(subtotal-discount));if(total<=0)return res.status(400).json({error:'Invalid payable amount'});
 const orderId='GFZ-'+Date.now().toString(36).toUpperCase();let razorpayOrderId=null;const client=rp();if(client){const ro=await client.orders.create({amount:total*100,currency:'INR',receipt:orderId,notes:{memberId:String(memberId||''),type}});razorpayOrderId=ro.id;}else if(process.env.NODE_ENV==='production'&&process.env.ALLOW_DEMO_PAYMENTS!=='true'){return res.status(503).json({error:'Payment gateway is not configured'});}
 const order=await Order.create({orderId,memberId:memberId||null,customer,items:pricedItems,subtotal,discount,total,couponCode:coupon?.code||null,type,status:'created',razorpayOrderId});
 res.json({orderId,amount:total,currency:'INR',razorpayOrderId,keyId:process.env.RAZORPAY_KEY_ID||null,demo:!client});
}catch(e){next(e)}});
router.post('/verify',requireAuth,async(req,res,next)=>{
 try{
  const {orderId,razorpay_order_id,razorpay_payment_id,razorpay_signature,method}=req.body||{};
  const order=await Order.findOne({orderId});
  if(!order)return res.status(404).json({error:'Order not found'});
  if(order.status==='paid')return res.json({ok:true,alreadyPaid:true,order,memberId:order.memberId});
  if(order.memberId&&req.user.role==='member'&&order.memberId!==req.user.memberCode)return res.status(403).json({error:'Forbidden'});
  if(process.env.RAZORPAY_KEY_SECRET&&order.razorpayOrderId){
   const expected=crypto.createHmac('sha256',process.env.RAZORPAY_KEY_SECRET).update(order.razorpayOrderId+'|'+String(razorpay_payment_id||'')).digest('hex');
   if(expected!==razorpay_signature)return res.status(400).json({error:'Payment signature verification failed'});
  }

  let member=null, billingPeriodDueDate=null, balanceBefore=null;
  if(order.type==='membership-renewal'&&order.memberId){
   member=await Member.findOne({memberCode:order.memberId,active:true});
   if(!member)return res.status(404).json({error:'Membership owner not found'});
   billingPeriodDueDate=normalizeDate(member.feeDueDate)||new Date().toISOString().slice(0,10);
   balanceBefore=await getMembershipBalance(member,billingPeriodDueDate);
  }

  const paymentId=razorpay_payment_id||'DEMO-'+Date.now();
  const p=await Payment.create({
   paymentId,orderId:order.orderId,memberId:order.memberId,memberName:order.customer?.name,
   phone:order.customer?.phone,address:order.customer?.address,amount:order.total,method:method||'razorpay',
   mode:order.type,status:'Paid',billingPeriodDueDate:billingPeriodDueDate||undefined,
   provider:'razorpay',providerPaymentId:razorpay_payment_id,providerOrderId:razorpay_order_id||order.razorpayOrderId
  });
  order.status='paid';order.paymentId=paymentId;await order.save();
  if(order.couponCode)await Coupon.updateOne({code:order.couponCode.toUpperCase()},{$inc:{usedCount:1}});

  if(order.type==='membership-renewal'&&member){
   member.phone=order.customer?.phone||member.phone;member.address=order.customer?.address||member.address;
   const paidAfter=(balanceBefore?.paid||0)+Number(order.total||0);
   if(balanceBefore&&paidAfter+0.00001>=balanceBefore.fee){
    const today=new Date().toISOString().slice(0,10);
    const baseDate=billingPeriodDueDate>today?billingPeriodDueDate:today;
    member.feeDueDate=addDaysISO(baseDate,30);
   }
   await member.save();
   await Notification.create({memberId:member.memberCode,title:'Payment received',message:`Your membership payment of ₹${Number(order.total).toLocaleString('en-IN')} was received. ${member.feeDueDate}`,type:'payment-sms'});
   try{
    await sendSms({to:member.phone,message:`Garuda Fitness Zone: Payment ₹${Number(order.total).toLocaleString('en-IN')} received.`,templateName:process.env.META_TEMPLATE_PAYMENT,templateParams:[member.name||'Member',String(order.total),member.feeDueDate]});
   }catch(e){console.warn('WhatsApp payment confirmation failed:',e.message)}
  }else if(order.memberId){
   await Notification.create({memberId:order.memberId,title:'Payment received',message:`Your payment of ₹${Number(order.total).toLocaleString('en-IN')} was received successfully. Order ${order.orderId}.`,type:'payment-sms'});
   try{await sendSms({to:order.customer?.phone,message:`Garuda Fitness Zone: Payment ₹${Number(order.total).toLocaleString('en-IN')} received.`,templateName:process.env.META_TEMPLATE_PAYMENT,templateParams:[order.customer?.name||'Member',String(order.total),order.orderId]})}catch(e){console.warn('WhatsApp payment confirmation failed:',e.message)}
  }
  res.json({ok:true,payment:p,order,memberId:order.memberId});
 }catch(e){next(e)}
});
router.get('/',requireAuth,requireRole('admin'),async(req,res,next)=>{try{res.json(await Payment.find().sort({date:-1}).lean())}catch(e){next(e)}});
router.get('/orders',requireAuth,requireRole('admin'),async(req,res,next)=>{try{res.json(await Order.find().sort({createdAt:-1}).lean())}catch(e){next(e)}});
module.exports=router;
