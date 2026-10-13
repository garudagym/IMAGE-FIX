const https=require('https');
const http=require('http');
function postJson(url,headers,body){return new Promise((resolve,reject)=>{const u=new URL(url);const lib=u.protocol==='https:'?https:http;const req=lib.request({method:'POST',hostname:u.hostname,port:u.port||undefined,path:u.pathname+u.search,headers:Object.assign({'Content-Type':'application/json'},headers||{})},res=>{let data='';res.on('data',c=>data+=c);res.on('end',()=>{if(res.statusCode>=200&&res.statusCode<300)resolve(data);else reject(new Error('SMS provider returned '+res.statusCode+': '+data.slice(0,300)))})});req.on('error',reject);req.write(JSON.stringify(body));req.end()})}
async function sendSms({to,message,templateName,templateParams=[]}){
 if(!to)return {sent:false,reason:'No phone number'};
 const provider=(process.env.SMS_PROVIDER||'none').toLowerCase();
 if(provider==='none')return {sent:false,reason:'SMS provider not configured'};
 if(provider==='generic'){
   if(!process.env.SMS_API_URL)return {sent:false,reason:'SMS_API_URL missing'};
   const headers={};if(process.env.SMS_API_KEY)headers.Authorization='Bearer '+process.env.SMS_API_KEY;
   await postJson(process.env.SMS_API_URL,headers,{to,message,from:process.env.SMS_FROM||'Garuda Fitness Zone'});return {sent:true};
 }
 if(provider==='meta-whatsapp'){
   const token=process.env.META_ACCESS_TOKEN;
   const phoneId=process.env.META_PHONE_NUMBER_ID;
   const version=String(process.env.META_API_VERSION||'v23.0').replace(/^\//,'');
   if(!token||!phoneId)throw new Error('Meta WhatsApp requires META_ACCESS_TOKEN and META_PHONE_NUMBER_ID');
   const template=templateName || process.env.META_TEMPLATE_GENERIC;
   if(!template)throw new Error('Set an approved WhatsApp template name for this message');
   let toDigits=String(to).replace(/[^0-9]/g,'');
   if(toDigits.length===10)toDigits='91'+toDigits;
   if(!toDigits)throw new Error('Member phone number is invalid');
   const params=(Array.isArray(templateParams)&&templateParams.length?templateParams:[message]).map(text=>({type:'text',text:String(text??'')}));
   const body={messaging_product:'whatsapp',to:toDigits,type:'template',template:{name:template,language:{code:process.env.META_TEMPLATE_LANGUAGE||process.env.META_DEFAULT_LANGUAGE||'en_US'},components:[{type:'body',parameters:params}]}};
   const response=await fetch('https://graph.facebook.com/'+version+'/'+phoneId+'/messages',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error('Meta WhatsApp returned '+response.status+': '+JSON.stringify(data).slice(0,500));
   return {sent:true,provider:'meta-whatsapp',messageId:data.messages?.[0]?.id};
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
