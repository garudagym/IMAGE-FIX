const router=require('express').Router();
const {Setting,Member}=require('../models');
const {requireAuth}=require('../middleware/auth');

function cleanMember(m){
  const x=m?.toObject?m.toObject():{...(m||{})};
  delete x.pinHash;
  x.id=x.memberCode;
  return x;
}

router.get('/',requireAuth,async(req,res,next)=>{
  try{
    const setting=await Setting.findOne({key:'clientDb'}).lean();
    const state={...(setting?.value||{})};
    const members=await Member.find({active:true}).sort({createdAt:-1}).lean();

    if(req.user.role==='member'){
      const own=members.find(m=>String(m.memberCode).toUpperCase()===String(req.user.memberCode).toUpperCase());
      state.members=own?[cleanMember(own)]:[];
    }else{
      state.members=members.map(cleanMember);
    }

    res.json(state);
  }catch(e){next(e)}
});

router.put('/',requireAuth,async(req,res,next)=>{
  try{
    const incoming=req.body||{};
    const current=(await Setting.findOne({key:'clientDb'}).lean())?.value||{};

    if(req.user.role==='member'){
      current.workouts=current.workouts||{};
      current.posts=Array.isArray(current.posts)?current.posts:[];
      if(incoming.workouts){
        for(const [k,v] of Object.entries(incoming.workouts)){
          if(String(k).startsWith(String(req.user.memberCode)+'_')) current.workouts[k]=v;
        }
      }
      if(Array.isArray(incoming.posts)){
        const own=incoming.posts.filter(p=>String(p.memberId)===String(req.user.memberCode));
        const others=current.posts.filter(p=>String(p.memberId)!==String(req.user.memberCode));
        current.posts=[...own,...others];
      }
      if(incoming.notifications)current.notifications=incoming.notifications;
      await Setting.findOneAndUpdate({key:'clientDb'},{key:'clientDb',value:current},{upsert:true});
      return res.json({ok:true});
    }

    const next={...current};
    if(incoming.workouts)next.workouts=incoming.workouts;
    if(Array.isArray(incoming.posts))next.posts=incoming.posts;
    if(Array.isArray(incoming.notifications))next.notifications=incoming.notifications;
    await Setting.findOneAndUpdate({key:'clientDb'},{key:'clientDb',value:next},{upsert:true});
    res.json({ok:true});
  }catch(e){next(e)}
});
module.exports=router;
