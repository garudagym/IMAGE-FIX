const {Member,Notification}=require('./models');
const {sendSms}=require('./sms');
function indiaToday(){const s=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());return s;}
function diffDays(a,b){const A=new Date(a+'T00:00:00+05:30').getTime(),B=new Date(b+'T00:00:00+05:30').getTime();return Math.round((A-B)/86400000)}
async function notifyMember(member,{title,message,type='membership',smsMessage=message,dedupeKey,templateParams}){
 let notification=null;
 if(dedupeKey){
   notification=await Notification.findOne({memberId:member.memberCode,dedupeKey});
   if(notification && ['sent','pending','skipped'].includes(notification.smsStatus))return {duplicate:true,sms:{sent:notification.smsStatus==='sent'}};
 }
 if(!notification){
   notification=await Notification.create({memberId:member.memberCode,title,message,type,channel:'in-app',dedupeKey,smsStatus:'pending'});
 }else{
   notification.title=title;notification.message=message;notification.smsStatus='pending';notification.smsError=undefined;await notification.save();
 }
 let sms={sent:false,reason:'not configured'};
 try{
   sms=await sendSms({to:member.phone,message:smsMessage,templateName:type==='renewal-reminder'?process.env.META_TEMPLATE_RENEWAL:process.env.META_TEMPLATE_GENERIC,templateParams:Array.isArray(templateParams)?templateParams:[member.name||'Member',smsMessage]});
   if(sms.sent){notification.smsStatus='sent';notification.smsMessageId=sms.messageId||undefined;notification.smsError=undefined;}
   else {notification.smsStatus='skipped';notification.smsError=sms.reason||'Message not sent';}
   await notification.save();
 }catch(e){
   notification.smsStatus='failed';notification.smsError=String(e.message||e).slice(0,500);await notification.save().catch(()=>{});console.warn('[GFZ WhatsApp]',member.memberCode,e.message);sms={sent:false,reason:e.message};
 }
 return {duplicate:false,sms};
}
async function runRenewalReminders(){
 const today=indiaToday();
 const members=await Member.find({active:true,feeDueDate:{$exists:true,$ne:''}}).lean();
 const targets=new Set([7,3,1,0,-3]);let processed=0,eligible=0;
 for(const m of members){
   const days=diffDays(m.feeDueDate,today);if(!targets.has(days))continue;
   eligible++;
   const overdue=days<0;
   const label=days===0?'today':days>0?`in ${days} day${days===1?'':'s'}`:`${Math.abs(days)} days ago`;
   const title=overdue?'Membership fee pending':days===0?'Membership renewal due today':`Membership renewal due ${label}`;
   const amount=String(Number(m.monthlyFee||0));
   const message=overdue
     ? `Hi ${m.name}, your Garuda Fitness Zone membership fee of ₹${amount} is still pending. Your due date was ${m.feeDueDate}. Please contact the gym if you have already paid.`
     : `Hi ${m.name}, your Garuda Fitness Zone membership fee of ₹${amount} is due ${label} (${m.feeDueDate}). Please renew on time. If you have already paid, please ignore this reminder.`;
   const r=await notifyMember(m,{
     title,message,type:'renewal-reminder',smsMessage:message,
     templateParams:[m.name||'Member',amount,String(m.feeDueDate)],
     dedupeKey:`renewal:${m.feeDueDate}:${days}`
   });
   if(!r.duplicate)processed++;
 }
 return {today,checked:members.length,eligible,processed};
}
function startRenewalScheduler(){
 let lastRunDate='';
 const tick=()=>{
   const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
   const v=Object.fromEntries(parts.map(p=>[p.type,p.value]));
   const day=`${v.year}-${v.month}-${v.day}`;
   if(v.hour==='09' && Number(v.minute)>=0 && Number(v.minute)<=4 && lastRunDate!==day){
     lastRunDate=day;
     runRenewalReminders().then(r=>console.log('[GFZ renewal reminders]',JSON.stringify(r))).catch(e=>{lastRunDate='';console.error('[GFZ renewal scheduler]',e)});
   }
 };
 tick();
 const timer=setInterval(tick,60*1000);
 if(typeof timer.unref==='function')timer.unref();
 return ()=>clearInterval(timer);
}
module.exports={notifyMember,runRenewalReminders,startRenewalScheduler};
