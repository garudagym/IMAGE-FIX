const router=require('express').Router();
const bcrypt=require('bcryptjs');
const {Member,Notification,Attendance}=require('../models');
const {requireAuth,requireRole}=require('../middleware/auth');
const {sendSms}=require('../sms');

const clean=m=>{
  const x=m?.toObject?m.toObject():{...(m||{})};
  delete x.pinHash;
  x.id = x.memberCode;
  return x;
};

const MEMBER_FIELDS=[
  'memberCode','name','phone','address','age','gender','joiningWeight',
  'currentWeight','height','bodyType','joiningDate','feeDueDate',
  'monthlyFee','photo','socials','followers','following','active','weightGoalType','targetWeight','previousWeight','goalAchieved','goalMedalAwarded'
];

function normalizeIndiaPhone(value){
  const raw=String(value||'').trim();
  if(!raw)return '';
  let digits=raw.replace(/\D/g,'');
  if(digits.startsWith('0091'))digits=digits.slice(4);
  else if(digits.startsWith('91') && digits.length===12)digits=digits.slice(2);
  else if(digits.startsWith('0') && digits.length===11)digits=digits.slice(1);
  if(digits.length===10 && /^[6-9]\d{9}$/.test(digits))return '+91'+digits;
  if(raw.startsWith('+') && digits.length>=8 && digits.length<=15)return '+'+digits;
  throw Object.assign(new Error('Enter a valid 10-digit Indian mobile number'),{status:400});
}

function memberPatch(body={}){
  const patch={};
  for(const key of MEMBER_FIELDS){
    if(Object.prototype.hasOwnProperty.call(body,key) && body[key]!==undefined){
      patch[key]=body[key];
    }
  }
  if(Object.prototype.hasOwnProperty.call(patch,'phone'))patch.phone=normalizeIndiaPhone(patch.phone);
  if(patch.weightGoalType && !['gain','lose'].includes(patch.weightGoalType)) throw Object.assign(new Error('Choose weight gaining or weight losing'),{status:400});
  for(const key of ['age','joiningWeight','currentWeight','height','monthlyFee','targetWeight']){
    if(patch[key]==='' || Number.isNaN(patch[key])) delete patch[key];
  }
  return patch;
}

function normalizeMemberCode(value){
  return String(value||'').trim().toUpperCase();
}
function memberCodeQuery(value){
  const code=normalizeMemberCode(value);
  return {memberCode:new RegExp('^'+code.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$','i')};
}

router.get('/',requireAuth,requireRole('admin'),async(req,res,next)=>{
  try{
    res.json((await Member.find().sort({createdAt:-1})).map(clean));
  }catch(e){next(e)}
});

router.get('/me',requireAuth,requireRole('member'),async(req,res,next)=>{
  try{
    const m=await Member.findOne({memberCode:req.user.memberCode});
    if(!m)return res.status(404).json({error:'Member not found'});
    res.json(clean(m));
  }catch(e){next(e)}
});

router.patch('/me',requireAuth,requireRole('member'),async(req,res,next)=>{
  try{
    const patch=memberPatch(req.body);
    delete patch.memberCode;
    delete patch.active;
    delete patch.goalAchieved;
    delete patch.goalMedalAwarded;
    if(Object.prototype.hasOwnProperty.call(patch,'currentWeight')){
      const existing=await Member.findOne({memberCode:req.user.memberCode});
      if(!existing)return res.status(404).json({error:'Member not found'});
      patch.previousWeight=Number(existing.currentWeight)||0;
      const goalType=patch.weightGoalType||existing.weightGoalType;
      const target=Number(patch.targetWeight||existing.targetWeight);
      const weight=Number(patch.currentWeight);
      patch.goalAchieved=!!(goalType&&target>0&&((goalType==='gain'&&weight>=target)||(goalType==='lose'&&weight<=target)));
      patch.goalMedalAwarded=existing.goalMedalAwarded||patch.goalAchieved;
    }
    const m=await Member.findOneAndUpdate(
      {memberCode:req.user.memberCode},
      {$set:patch},
      {new:true,runValidators:true}
    );
    if(!m)return res.status(404).json({error:'Member not found'});
    res.json(clean(m));
  }catch(e){next(e)}
});

router.post('/',requireAuth,requireRole('admin'),async(req,res,next)=>{
  try{
    const memberCode=normalizeMemberCode(req.body?.memberCode);
    const name=String(req.body?.name||'').trim();
    const pin=String(req.body?.pin||'').trim();

    if(!memberCode||!name||!/^[0-9]{4}$/.test(pin)){
      return res.status(400).json({error:'Member ID, name and a 4-digit PIN are required'});
    }

    const existing=await Member.findOne({memberCode}).lean();
    if(existing)return res.status(409).json({error:`Member ${memberCode} already exists`});

    const patch=memberPatch(req.body);
    delete patch.pin;
    patch.memberCode=memberCode;
    patch.name=name;
    patch.pinHash=await bcrypt.hash(pin,12);
    patch.active=patch.active!==false;

    const m=await Member.create(patch);
    // Welcome message is best-effort: account creation must succeed even if WhatsApp is unavailable.
    let welcomeStatus='not-configured';
    const welcomeTemplate=process.env.META_TEMPLATE_WELCOME;
    if(welcomeTemplate && m.phone){
      try{
        await sendSms({
          to:m.phone,
          message:`Welcome to Garuda Fitness Zone, ${m.name}! Your username is ${m.memberCode} and your temporary login PIN is ${pin}. Please keep these credentials private and change your PIN if your gym provides that option.`,
          templateName:welcomeTemplate,
          templateParams:[m.name||'Member',m.memberCode,pin]
        });
        welcomeStatus='sent';
      }catch(smsError){
        welcomeStatus='failed';
        console.warn('New member welcome message failed:',smsError.message);
      }
    }
    res.status(201).json({...clean(m),welcomeMessageStatus:welcomeStatus});
  }catch(e){
    if(e?.code===11000)return res.status(409).json({error:'A member with this ID already exists'});
    next(e);
  }
});

router.get('/:memberCode',requireAuth,requireRole('admin'),async(req,res,next)=>{
  try{
    const m=await Member.findOne(memberCodeQuery(req.params.memberCode));
    if(!m)return res.status(404).json({error:'Member not found'});
    res.json(clean(m));
  }catch(e){next(e)}
});

router.patch('/:memberCode',requireAuth,requireRole('admin'),async(req,res,next)=>{
  try{
    const memberCode=normalizeMemberCode(req.params.memberCode);
    const patch=memberPatch(req.body);
    delete patch.memberCode;
    delete patch.active;
    delete patch.pinHash;

    if(Object.prototype.hasOwnProperty.call(req.body||{},'pin')){
      const pin=String(req.body.pin||'').trim();
      if(!/^\d{4}$/.test(pin))return res.status(400).json({error:'PIN must be exactly 4 digits'});
      patch.pinHash=await bcrypt.hash(pin,12);
    }

    if(Object.prototype.hasOwnProperty.call(patch,'name')){
      patch.name=String(patch.name||'').trim();
      if(!patch.name)return res.status(400).json({error:'Member name is required'});
    }

    const m=await Member.findOneAndUpdate(
      memberCodeQuery(memberCode),
      {$set:patch},
      {new:true,runValidators:true}
    );
    if(!m)return res.status(404).json({error:'Member not found'});
    res.json(clean(m));
  }catch(e){next(e)}
});

router.delete('/:memberCode',requireAuth,requireRole('admin'),async(req,res,next)=>{
  try{
    const memberCode=normalizeMemberCode(req.params.memberCode);
    if(memberCode==='GFZ-1001' && process.env.ALLOW_DELETE_DEMO_MEMBER!=='true')
      return res.status(403).json({error:'The demo member is protected'});
    const m=await Member.findOneAndDelete(memberCodeQuery(memberCode));
    if(!m)return res.status(404).json({error:'Member not found'});
    await Promise.all([
      Attendance.deleteMany({memberId:m.memberCode}),
      Notification.deleteMany({memberId:m.memberCode})
    ]);
    res.json({ok:true,deleted:memberCode});
  }catch(e){next(e)}
});

router.get('/:memberCode/attendance',requireAuth,async(req,res,next)=>{
  try{
    const code=normalizeMemberCode(req.params.memberCode);
    if(req.user.role==='member'&&req.user.memberCode!==code)return res.status(403).json({error:'Forbidden'});
    if(req.user.role==='member'){const member=await Member.findOne({memberCode:code});const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());if(member?.feeDueDate&&member.feeDueDate<today)return res.status(403).json({error:'Membership expired. Please pay your fee to access attendance.'});}
    res.json(await Attendance.find({memberId:code}).sort({date:-1}).lean());
  }catch(e){next(e)}
});

router.post('/:memberCode/attendance',requireAuth,async(req,res,next)=>{
  try{
    const memberId=normalizeMemberCode(req.params.memberCode);
    if(req.user.role==='member'&&req.user.memberCode!==memberId)return res.status(403).json({error:'Forbidden'});
    if(req.user.role==='member'){const member=await Member.findOne({memberCode:memberId});const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());if(member?.feeDueDate&&member.feeDueDate<today)return res.status(403).json({error:'Membership expired. Please pay your fee to access attendance.'});}
    const date=String(req.body.date||'');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return res.status(400).json({error:'Invalid attendance date'});
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    if(date>today)return res.status(400).json({error:'Future attendance is not allowed'});
    const dow=new Date(date+'T00:00:00+05:30').getDay();
    if(dow===0)return res.status(400).json({error:'Sunday is a fixed holiday'});
    const a=await Attendance.findOneAndUpdate(
      {memberId,date},
      {...req.body,memberId,date},
      {new:true,upsert:true,runValidators:true}
    );
    res.json(a);
  }catch(e){next(e)}
});

router.get('/me/notifications',requireAuth,requireRole('member'),async(req,res,next)=>{
  try{
    res.json(await Notification.find({memberId:req.user.memberCode}).sort({createdAt:-1}).limit(100).lean());
  }catch(e){next(e)}
});

module.exports=router;
