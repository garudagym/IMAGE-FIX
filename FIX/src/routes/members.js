const router=require('express').Router();
const bcrypt=require('bcryptjs');
const {Member,Notification,Attendance}=require('../models');
const {requireAuth,requireRole}=require('../middleware/auth');

const clean=m=>{
  const x=m?.toObject?m.toObject():{...(m||{})};
  delete x.pinHash;
  return x;
};

const MEMBER_FIELDS=[
  'memberCode','name','phone','address','age','gender','joiningWeight',
  'currentWeight','height','bodyType','joiningDate','feeDueDate',
  'monthlyFee','photo','socials','followers','following','active'
];

function memberPatch(body={}){
  const patch={};
  for(const key of MEMBER_FIELDS){
    if(Object.prototype.hasOwnProperty.call(body,key) && body[key]!==undefined){
      patch[key]=body[key];
    }
  }
  for(const key of ['age','joiningWeight','currentWeight','height','monthlyFee']){
    if(patch[key]==='' || Number.isNaN(patch[key])) delete patch[key];
  }
  return patch;
}

function normalizeMemberCode(value){
  return String(value||'').trim().toUpperCase();
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
    res.status(201).json(clean(m));
  }catch(e){
    if(e?.code===11000)return res.status(409).json({error:'A member with this ID already exists'});
    next(e);
  }
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
      {memberCode},
      {$set:patch},
      {new:true,runValidators:true}
    );
    if(!m)return res.status(404).json({error:'Member not found'});
    res.json(clean(m));
  }catch(e){next(e)}
});

router.delete('/:memberCode',requireAuth,requireRole('admin'),async(req,res,next)=>{
  try{
    const m=await Member.findOneAndUpdate(
      {memberCode:normalizeMemberCode(req.params.memberCode)},
      {$set:{active:false}},
      {new:true,runValidators:true}
    );
    if(!m)return res.status(404).json({error:'Member not found'});
    res.json({ok:true});
  }catch(e){next(e)}
});

router.get('/:memberCode/attendance',requireAuth,async(req,res,next)=>{
  try{
    const code=normalizeMemberCode(req.params.memberCode);
    if(req.user.role==='member'&&req.user.memberCode!==code)return res.status(403).json({error:'Forbidden'});
    res.json(await Attendance.find({memberId:code}).sort({date:-1}).lean());
  }catch(e){next(e)}
});

router.post('/:memberCode/attendance',requireAuth,async(req,res,next)=>{
  try{
    const memberId=normalizeMemberCode(req.params.memberCode);
    if(req.user.role==='member'&&req.user.memberCode!==memberId)return res.status(403).json({error:'Forbidden'});
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
