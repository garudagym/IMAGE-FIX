const {Member,Notification}=require('./models');
const {sendSms}=require('./sms');
function indiaToday(){const s=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());return s;}
function diffDays(a,b){const A=new Date(a+'T00:00:00+05:30').getTime(),B=new Date(b+'T00:00:00+05:30').getTime();return Math.round((A-B)/86400000)}
async function notifyMember(member,{title,message,type='membership',smsMessage=message,dedupeKey}){
 const filter=dedupeKey?{memberId:member.memberCode,dedupeKey}:{_id:null};
 if(dedupeKey&&await Notification.exists(filter))return {duplicate:true};
 await Notification.create({memberId:member.memberCode,title,message,type,channel:'in-app',dedupeKey});
 let sms={sent:false,reason:'not configured'};
 try{sms=await sendSms({to:member.phone,message:smsMessage})}catch(e){console.warn('[GFZ SMS]',member.memberCode,e.message)}
 return {duplicate:false,sms};
}
async function runRenewalReminders(){
 const today=indiaToday();
 const members=await Member.find({active:true,feeDueDate:{$exists:true,$ne:''}}).lean();
 const targets=new Set([7,3,1,0]); let sent=0;
 for(const m of members){
   const days=diffDays(m.feeDueDate,today); if(!targets.has(days))continue;
   const label=days===0?'today':`in ${days} day${days===1?'':'s'}`;
   const title=days===0?'Membership renewal due today':`Membership renewal due ${label}`;
   const message=`Hi ${m.name}, your Garuda Fitness Zone membership is due ${label} (${m.feeDueDate}). Please renew to keep your membership active.`;
   const r=await notifyMember(m,{title,message,type:'renewal-reminder',smsMessage:`Garuda Fitness Zone: Hi ${m.name}, your membership is due ${label} (${m.feeDueDate}). Please renew to keep your membership active.`,dedupeKey:`renewal:${m.feeDueDate}:${days}`});
   if(!r.duplicate)sent++;
 }
 return {today,checked:members.length,sent};
}
function startRenewalScheduler(){
 const run=()=>runRenewalReminders().catch(e=>console.error('[GFZ renewal scheduler]',e));
 setTimeout(run,15000);setInterval(run,60*60*1000);
 return run;
}
module.exports={notifyMember,runRenewalReminders,startRenewalScheduler};
