const https=require('https');
const http=require('http');
function postJson(url,headers,body){return new Promise((resolve,reject)=>{const u=new URL(url);const lib=u.protocol==='https:'?https:http;const req=lib.request({method:'POST',hostname:u.hostname,port:u.port||undefined,path:u.pathname+u.search,headers:Object.assign({'Content-Type':'application/json'},headers||{})},res=>{let data='';res.on('data',c=>data+=c);res.on('end',()=>{if(res.statusCode>=200&&res.statusCode<300)resolve(data);else reject(new Error('SMS provider returned '+res.statusCode+': '+data.slice(0,300)))})});req.on('error',reject);req.write(JSON.stringify(body));req.end()})}
async function sendSms({to,message}){
 if(!to)return {sent:false,reason:'No phone number'};
 const provider=(process.env.SMS_PROVIDER||'none').toLowerCase();
 if(provider==='none')return {sent:false,reason:'SMS provider not configured'};
 if(provider==='generic'){
   if(!process.env.SMS_API_URL)return {sent:false,reason:'SMS_API_URL missing'};
   const headers={};if(process.env.SMS_API_KEY)headers.Authorization='Bearer '+process.env.SMS_API_KEY;
   await postJson(process.env.SMS_API_URL,headers,{to,message,from:process.env.SMS_FROM||'Garuda Fitness Zone'});return {sent:true};
 }
 if(provider==='twilio'){
   const sid=process.env.TWILIO_ACCOUNT_SID,token=process.env.TWILIO_AUTH_TOKEN,from=process.env.TWILIO_FROM;
   if(!sid||!token||!from)throw new Error('Twilio SMS configuration incomplete');
   const auth=Buffer.from(sid+':'+token).toString('base64');
   const params=new URLSearchParams({To:to,From:from,Body:message});
   return new Promise((resolve,reject)=>{const req=https.request({method:'POST',hostname:'api.twilio.com',path:'/2010-04-01/Accounts/'+sid+'/Messages.json',headers:{Authorization:'Basic '+auth,'Content-Type':'application/x-www-form-urlencoded','Content-Length':Buffer.byteLength(params.toString())}},res=>{let data='';res.on('data',c=>data+=c);res.on('end',()=>res.statusCode>=200&&res.statusCode<300?resolve({sent:true}):reject(new Error('Twilio returned '+res.statusCode+': '+data.slice(0,300))))});req.on('error',reject);req.write(params.toString());req.end()});
 }
 throw new Error('Unsupported SMS_PROVIDER: '+provider);
}
module.exports={sendSms};
