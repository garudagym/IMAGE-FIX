(function(){
  'use strict';
  const API='/api';
  const tokenKey='gfz_api_token';
  const getToken=()=>localStorage.getItem(tokenKey)||'';
  const setToken=t=>t?localStorage.setItem(tokenKey,t):localStorage.removeItem(tokenKey);
  let busyCount=0,busyShownAt=0,busyHideTimer=null;
  (function installIOSLoader(){
    if(document.getElementById('gfz-ios-loader-style'))return;
    const style=document.createElement('style');style.id='gfz-ios-loader-style';style.textContent=`#gfz-ios-loader{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(244,245,248,0);backdrop-filter:blur(0);-webkit-backdrop-filter:blur(0);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .24s ease,visibility .24s ease,backdrop-filter .24s ease,background .24s ease}#gfz-ios-loader.visible{opacity:1;visibility:visible;pointer-events:auto;background:rgba(244,245,248,.34);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}#gfz-ios-loader .gfz-loader-card{min-width:152px;padding:22px 25px;border:1px solid rgba(255,255,255,.74);border-radius:28px;background:rgba(255,255,255,.78);box-shadow:0 18px 55px rgba(20,24,35,.12),inset 0 1px rgba(255,255,255,.8);text-align:center;color:#18181b;transform:translateY(8px) scale(.97);opacity:0;transition:transform .32s cubic-bezier(.2,.8,.2,1),opacity .22s ease;will-change:transform,opacity}#gfz-ios-loader.visible .gfz-loader-card{transform:translateY(0) scale(1);opacity:1}#gfz-ios-loader .gfz-spinner{position:relative;width:34px;height:34px;margin:0 auto 13px}#gfz-ios-loader .gfz-spinner i{position:absolute;left:15px;top:2px;width:4px;height:9px;border-radius:4px;background:#555;transform-origin:2px 15px;animation:gfz-ios-fade 1s linear infinite}#gfz-ios-loader .gfz-loader-title{display:block;font-size:13px;font-weight:650;letter-spacing:-.01em}#gfz-ios-loader .gfz-loader-sub{display:block;font-size:11px;color:#777;margin-top:5px}@keyframes gfz-ios-fade{0%,100%{opacity:.22}50%{opacity:1}}@media(prefers-color-scheme:dark){#gfz-ios-loader.visible{background:rgba(0,0,0,.28)}#gfz-ios-loader .gfz-loader-card{background:rgba(35,35,39,.84);color:#fff;border-color:rgba(255,255,255,.14);box-shadow:0 18px 55px rgba(0,0,0,.24)}#gfz-ios-loader .gfz-spinner i{background:#eee}#gfz-ios-loader .gfz-loader-sub{color:#aaa}}@media(prefers-reduced-motion:reduce){#gfz-ios-loader,#gfz-ios-loader .gfz-loader-card{transition:none}#gfz-ios-loader .gfz-spinner i{animation:none;opacity:.65}}`;
    document.head.appendChild(style);
    const el=document.createElement('div');el.id='gfz-ios-loader';el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.innerHTML='<div class="gfz-loader-card"><div class="gfz-spinner">'+Array.from({length:12},(_,i)=>'<i style="transform:rotate('+(i*30)+'deg);animation-delay:-'+(1-i/12)+'s"></i>').join('')+'</div><div class="gfz-loader-title">Loading</div><div class="gfz-loader-sub">Please wait a moment</div></div>';document.body.appendChild(el);
  })();
  window.gfzBusy=function(active,title,subtitle){const el=document.getElementById('gfz-ios-loader');if(!el)return;if(active){busyCount++;if(busyHideTimer){clearTimeout(busyHideTimer);busyHideTimer=null}busyShownAt=busyShownAt||Date.now();const t=el.querySelector('.gfz-loader-title'),sub=el.querySelector('.gfz-loader-sub');if(t&&title)t.textContent=title;if(sub&&subtitle)sub.textContent=subtitle;el.classList.add('visible');}else{busyCount=Math.max(0,busyCount-1);if(busyCount===0){const wait=Math.max(0,220-(Date.now()-(busyShownAt||Date.now())));busyHideTimer=setTimeout(()=>{if(busyCount===0){el.classList.remove('visible');busyShownAt=0}},wait)}}};
  async function api(path,options={}){const headers=Object.assign({'Content-Type':'application/json'},options.headers||{});const t=getToken();if(t)headers.Authorization='Bearer '+t;window.gfzBusy?.(true,'Working…','Saving your changes');try{const r=await fetch(API+path,Object.assign({},options,{headers}));let data=null;try{data=await r.json()}catch(e){}if(!r.ok)throw new Error(data?.error||('Request failed: '+r.status));return data}finally{window.gfzBusy?.(false)}}
  window.GFZBackend={api,token:getToken};
  async function loadState(){try{const state=await api('/state');if(state&&typeof state==='object'){/* State is for member/admin operational data. Catalog data (plans/products/facilities/coupons) must come from /bootstrap so stale clientDb snapshots cannot overwrite current catalog. */if(Array.isArray(state.members))db.members=state.members;if(Array.isArray(db.members)){db.members=db.members.filter(m=>String(m.name||'').trim().toLowerCase()!=='arjun rao');const demo=db.members.find(m=>String(m.id||m.memberCode).toUpperCase()==='GFZ-1001');if(demo)demo.name='Garuda Gym';else if(typeof seed!=='undefined'&&seed.members?.[0])db.members.push({...seed.members[0]});}if(state.workouts)db.workouts=state.workouts;if(state.posts)db.posts=state.posts;if(state.notifications)db.notifications=state.notifications;}if(getToken()&&typeof currentMember!=='undefined'&&currentMember){try{const ns=await api('/members/me/notifications');db.notifications=(ns||[]).map(n=>Object.assign({},n,{id:n._id||n.id,date:n.createdAt||n.date||new Date().toISOString()}));}catch(e){}}if(typeof save==='function'){try{localStorage.setItem('gfz_db',JSON.stringify(db))}catch(e){}}if(typeof renderFeaturedStore==='function')renderFeaturedStore();if(typeof renderStorePage==='function')renderStorePage();if(typeof renderPlans==='function')renderPlans();if(typeof renderMedia==='function')renderMedia();if(typeof updateNotificationDot==='function')updateNotificationDot();}catch(e){console.warn('Backend state unavailable:',e.message)}}
  function galleryUuid(value){return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value||''))||/^[0-9a-f]{24}$/i.test(String(value||''));}
  function galleryImageUrl(value){const v=String(value||'').trim();if(!v)return '';if(/^(https?:|\/|data:|blob:)/i.test(v))return v;if(galleryUuid(v))return '/api/media/'+v;return v;}
  function galleryDisplayName(g,i){const raw=String(g?.name||g?.filename||'').trim();if(raw&&!galleryUuid(raw))return raw;const url=String(g?.imageUrl||g?.img||'');const file=String(g?.filename||'').replace(/^.*[\\/]/,'').replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim();if(file&&!galleryUuid(file))return file;return 'Gym photo '+(i+1);}
  function normalizeGallery(g,i){return {id:g?._id||g?.id||('gallery_'+i),name:galleryDisplayName(g,i),desc:g?.description||g?.desc||'Garuda Fitness Zone gallery.',img:galleryImageUrl(g?.imageUrl||g?.img||g?.id||g?._id),sortOrder:g?.sortOrder??i};}
  async function loadCatalog(){try{const b=await api('/bootstrap');if(Array.isArray(b?.plans))db.plans=b.plans;
if(Array.isArray(b?.products))db.products=b.products;
if(Array.isArray(b?.gallery))db.facilities=b.gallery.map(normalizeGallery);
localStorage.setItem('gfz_db',JSON.stringify(db));if(typeof renderFeaturedStore==='function')renderFeaturedStore();if(typeof renderStorePage==='function')renderStorePage();if(typeof renderPlans==='function')renderPlans();if(typeof renderFacilities==='function')renderFacilities();}catch(e){console.info('Catalog API unavailable:',e.message)}}
  const originalSave=window.save;
  if(typeof originalSave==='function')window.save=function(){const ok=originalSave.apply(this,arguments);if(ok&&getToken())syncState().catch(()=>{});return ok;};
  async function syncState(){try{const safe=JSON.parse(JSON.stringify(db));delete safe.payments;delete safe.plans;delete safe.products;delete safe.facilities;delete safe.coupons;await api('/state',{method:'PUT',body:JSON.stringify(safe)});}catch(e){console.warn('Backend sync failed',e.message)}}
  async function loginMemberBackend(){
    const id=(document.getElementById('memberCode')?.value||'').trim().toUpperCase();
    const pin=document.getElementById('memberPin')?.value||'';
    try{
      const r=await api('/auth/member/login',{method:'POST',body:JSON.stringify({memberCode:id,pin})});
      setToken(r.token);
      const profile=await api('/members/me');
      const code=String(profile?.memberCode||r.user?.memberCode||id).toUpperCase();
      const clean=Object.assign({},profile,{id:code});
      delete clean.pinHash;
      db.members=Array.isArray(db.members)?db.members:[];
      const idx=db.members.findIndex(m=>String(m.id||m.memberCode).toUpperCase()===code);
      if(idx>=0)db.members[idx]=Object.assign(db.members[idx],clean);else db.members.push(clean);
      currentMember=clean;
      try{const state=await api('/state');if(state){if(state.workouts)db.workouts=state.workouts;if(state.posts)db.posts=state.posts;}}catch(e){}
      try{const ns=await api('/members/me/notifications');db.notifications=(ns||[]).map(n=>Object.assign({},n,{id:n._id||n.id,date:n.createdAt||n.date||new Date().toISOString()}));}catch(e){}
      localStorage.setItem('gfz_db',JSON.stringify(db));
      if(typeof closeAuth==='function')closeAuth();
      if(typeof updateHeaderProfile==='function')updateHeaderProfile();
      if(typeof updateNotificationDot==='function')updateNotificationDot();
      if(typeof openPortal==='function')openPortal('member');
      if(typeof renderMember==='function')renderMember();
      toast('Signed in');
    }catch(e){toast(e.message)}
  }
  async function loginAdminBackend(){
    const username=(document.getElementById('adminUser')?.value||'').trim();
    const pin=document.getElementById('adminPin')?.value||'';
    try{
      const r=await api('/auth/admin/login',{method:'POST',body:JSON.stringify({username,pin})});
      setToken(r.token);
      try{db.members=await api('/members')}catch(e){}
      try{db.payments=await api('/payments')}catch(e){}
      try{const state=await api('/state');if(state){if(state.workouts)db.workouts=state.workouts;if(state.posts)db.posts=state.posts;if(state.notifications)db.notifications=state.notifications;}}catch(e){}
      localStorage.setItem('gfz_db',JSON.stringify(db));
      if(typeof closeAuth==='function')closeAuth();
      if(typeof openPortal==='function')openPortal('admin');
      if(typeof renderAdmin==='function')renderAdmin();
      toast('Admin signed in');
    }catch(e){toast(e.message)}
  }
  window.loginMember=loginMemberBackend;window.loginAdmin=loginAdminBackend;
  window.GFZBackend.loginMember=loginMemberBackend;window.GFZBackend.loginAdmin=loginAdminBackend;window.GFZBackend.saveMember=saveMemberBackend;
  async function backendPay(orderPayload,method){try{const order=await api('/payments/create-order',{method:'POST',body:JSON.stringify(orderPayload)});if(order.demo){const verified=await api('/payments/verify',{method:'POST',body:JSON.stringify({orderId:order.orderId,method})});return verified;}if(!window.Razorpay){await loadRazorpay();}return await new Promise((resolve,reject)=>{const rzp=new Razorpay({key:order.keyId,amount:order.amount*100,currency:'INR',name:'Garuda Fitness Zone',description:orderPayload.type==='membership-renewal'?'Membership renewal':'Garuda Store order',order_id:order.razorpayOrderId,handler:async resp=>{try{resolve(await api('/payments/verify',{method:'POST',body:JSON.stringify(Object.assign({},resp,{orderId:order.orderId,method}))}))}catch(e){reject(e)}},modal:{ondismiss:()=>reject(new Error('Payment cancelled'))}});rzp.open();});}catch(e){throw e}}
  async function loadRazorpay(){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://checkout.razorpay.com/v1/checkout.js';s.onload=resolve;s.onerror=()=>reject(new Error('Could not load payment gateway'));document.head.appendChild(s)})}
  window.GFZBackendPay=backendPay;
  async function saveMemberBackend(){
    if(!getToken())return toast('Admin session required');
    const editingCode=String(window.__gfzEditingMemberCode||'').trim().toUpperCase();
    const id=(document.getElementById('mId')?.value||'').trim().toUpperCase();
    const name=(document.getElementById('mName')?.value||'').trim();
    const pin=(document.getElementById('mPin')?.value||'').trim();
    if(!id||!name)return toast('Member ID and name are required');
    if(editingCode && id!==editingCode)return toast('Member ID cannot be changed while editing.');
    if((!editingCode||pin)&&!/^\d{4}$/.test(pin))return toast('PIN must be exactly 4 digits when creating or changing it');
    const phone=(document.getElementById('mPhone')?.value||'').trim();
    const body={
      memberCode:id,name,phone,address:(document.getElementById('mAddress')?.value||'').trim(),
      age:Number(document.getElementById('mAge')?.value||0)||undefined,
      gender:document.getElementById('mGender')?.value,
      joiningWeight:Number(document.getElementById('mJoinWeight')?.value||0)||undefined,
      currentWeight:Number(document.getElementById('mCurrentWeight')?.value||0)||undefined,
      height:Number(document.getElementById('mHeight')?.value||0)||undefined,
      bodyType:document.getElementById('mBody')?.value,
      joiningDate:document.getElementById('mJoinDate')?.value,
      feeDueDate:document.getElementById('mDueDate')?.value,
      monthlyFee:Number(document.getElementById('mFee')?.value||1499)
    };
    const uploadFile=document.getElementById('mPhotoCapture')?.files?.[0]||document.getElementById('mPhotoUpload')?.files?.[0];
    const existingMember=(db.members||[]).find(m=>String(m.id||m.memberCode).trim().toUpperCase()===(editingCode||id));
    if(existingMember?.photo && !String(existingMember.photo).startsWith('idb:'))body.photo=existingMember.photo;
    try{
      if(uploadFile){const uploaded=await uploadImages([uploadFile]);if(!uploaded[0]?.url)throw new Error('The selected member photo was not saved by the server. Please try again.');body.photo=uploaded[0].url;}
      if(pin)body.pin=pin;
      const r=await api(editingCode?'/members/'+encodeURIComponent(editingCode):'/members',{
        method:editingCode?'PATCH':'POST',body:JSON.stringify(body)
      });
      const local=Object.assign({},r,{id:r.memberCode||id});delete local.pinHash;
      db.members=Array.isArray(db.members)?db.members:[];
      const code=String(local.memberCode||local.id).trim().toUpperCase();
      const idx=db.members.findIndex(m=>String(m.id||m.memberCode).trim().toUpperCase()===code);
      if(idx>=0)db.members[idx]=Object.assign({},db.members[idx],local);else db.members.push(local);
      // The server is authoritative; refresh the directory after either create or update.
      try{db.members=await api('/members');}catch(refreshError){console.warn('Member list refresh failed:',refreshError.message)}
      db.members=(db.members||[]).map(m=>Object.assign({},m,{id:m.id||m.memberCode}));
      localStorage.setItem('gfz_db',JSON.stringify(db));
      window.__gfzEditingMemberCode=null;
      if(typeof renderAdmin==='function')renderAdmin();
      if(typeof showAdminTab==='function')showAdminTab('members');
      toast(editingCode?'Member updated':'Member created');
    }catch(e){console.error(e);toast(e.message||'Could not save member');}
  }
  window.saveMember=saveMemberBackend;

  async function uploadImages(files){
    const list=[...(files||[])];if(!list.length)return [];
    const fd=new FormData();list.forEach(f=>fd.append('images',f));
    window.gfzBusy?.(true,'Uploading pictures…',list.length+' image'+(list.length===1?'':'s')+' selected');
    try{
      const r=await fetch('/api/uploads/image',{method:'POST',headers:{Authorization:'Bearer '+getToken()},body:fd});
      const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'Image upload failed');return data.files||[];
    }finally{window.gfzBusy?.(false)}
  }
  window.GFZBackendUpload=uploadImages;
  const originalAddGallery=window.addGalleryPictures;
  window.addGalleryPictures=async function(){
    try{
      if(!getToken())return toast('Admin session required');
      const input=document.getElementById('gUpload');const files=[...(input?.files||[])];if(!files.length)return toast('Choose at least one picture');
      const title=(document.getElementById('gTitle')?.value||'').trim();const desc=(document.getElementById('gDesc')?.value||'').trim();
      const uploaded=await uploadImages(files);let order=(db.facilities||[]).length;
      for(const f of uploaded){
        const safeName=String(title||f.name||'Gym photo').replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim()||'Gym photo';
        const safeUrl=galleryImageUrl(f.url||f.imageUrl||f.id);
        if(!safeUrl)throw new Error('The server returned no image URL');
        await api('/admin/gallery',{method:'POST',body:JSON.stringify({name:safeName,description:desc||'Garuda Fitness Zone gallery.',imageUrl:safeUrl,sortOrder:order++})});
      }
      await loadCatalog();
      if(input)input.value='';
      if(document.getElementById('gTitle'))document.getElementById('gTitle').value='';
      if(document.getElementById('gDesc'))document.getElementById('gDesc').value='';
      if(document.getElementById('gName'))document.getElementById('gName').textContent='No pictures selected';
      if(typeof renderAdmin==='function')renderAdmin();if(typeof showAdminTab==='function')showAdminTab('gallery');toast(uploaded.length+' picture'+(uploaded.length===1?'':'s')+' added to the public gallery');
    }catch(e){console.error(e);toast(e.message||'Could not upload gallery pictures');}
  };
  window.deleteGalleryPicture=async function(index){
    try{const f=db.facilities?.[index];if(!f)return;if(!confirm('Delete “'+f.name+'” from the gallery?'))return;if(!getToken())return toast('Admin session required');if(f.id)await api('/admin/gallery/'+encodeURIComponent(f.id),{method:'DELETE'});await loadCatalog();if(typeof renderAdmin==='function')renderAdmin();if(typeof showAdminTab==='function')showAdminTab('gallery');toast('Gallery picture deleted');}catch(e){toast(e.message||'Could not delete gallery picture');}
  };
  window.sendNotification=async function(){
    try{
      if(!getToken())return toast('Admin session required');
      const title=(document.getElementById('nTitle')?.value||'').trim(),message=((document.getElementById('nMessage')?.value||'').replace(/\r\n/g,'\n').trim());if(!title||!message)return toast('Add a title and message');
      const media=[];const url=(document.getElementById('nMediaUrl')?.value||'').trim();if(url)media.push(url);
      const files=[...(document.getElementById('nMediaUpload')?.files||[]),...(document.getElementById('nMediaCapture')?.files||[])];if(files.length){const uploaded=await uploadImages(files);media.push(...uploaded.map(x=>x.url));}
      const memberId=(document.getElementById('nMemberId')?.value||'').trim().toUpperCase()||undefined;
      await api('/admin/notifications',{method:'POST',body:JSON.stringify({memberId,title,message,type:'admin',media})});
      if(typeof loadState==='function')await loadState();document.getElementById('nTitle').value='';document.getElementById('nMessage').value='';if(document.getElementById('nMediaUrl'))document.getElementById('nMediaUrl').value='';if(document.getElementById('nMediaUpload'))document.getElementById('nMediaUpload').value='';if(document.getElementById('nMediaCapture'))document.getElementById('nMediaCapture').value='';toast('Notification sent');
    }catch(e){console.error(e);toast(e.message||'Could not send notification');}
  };

  /*
   * Persistent media + CRUD fixes.
   * All admin/member uploaded images now go through the Render API
   * and are stored as normal /uploads/... URLs, not browser IndexedDB IDs.
   */

  const PFP_PLACEHOLDER='/assets/garuda-logo.png';
  function cleanMemberPhotos(){
    if(!Array.isArray(db.members))return;
    for(const m of db.members){
      const p=String(m.photo||'');
      if(/images\.unsplash\.com|randomuser|pravatar|i\.ibb\.co/i.test(p))m.photo='';
    }
  }
  cleanMemberPhotos();

  function adminTabStay(tab){
    if(typeof renderAdmin==='function')renderAdmin();
    if(typeof showAdminTab==='function'){
      setTimeout(()=>showAdminTab(tab),0);
    }
  }

  window.saveProfileSocials=async function(){
    if(!getToken())return toast('Please sign in again');

    const memberId=String(currentMember?.id||currentMember?.memberCode||'').toUpperCase();
    if(!memberId)return toast('Member session not found');

    const file=document.getElementById('memberPfpUpload')?.files?.[0];

    const socials={
      instagram:(document.getElementById('socialInstagram')?.value||'').trim(),
      youtube:(document.getElementById('socialYoutube')?.value||'').trim(),
      facebook:(document.getElementById('socialFacebook')?.value||'').trim(),
      x:(document.getElementById('socialX')?.value||'').trim()
    };

    try{
      const patch={socials};

      if(file){
        const uploaded=await uploadImages([file]);
        if(!uploaded[0]?.url)throw new Error('Image upload failed');
        patch.photo=uploaded[0].url;
      }else if(currentMember.photo && !String(currentMember.photo).startsWith('idb:')){
        patch.photo=currentMember.photo;
      }

      const updated=await api('/members/me',{
        method:'PATCH',
        body:JSON.stringify(patch)
      });

      const clean=Object.assign({},updated);
      clean.id=clean.memberCode||memberId;
      delete clean.pinHash;

      const idx=(db.members||[]).findIndex(
        m=>String(m.id||m.memberCode).toUpperCase()===memberId
      );

      if(idx>=0)db.members[idx]=Object.assign(db.members[idx],clean);
      else db.members.push(clean);

      currentMember=db.members.find(
        m=>String(m.id||m.memberCode).toUpperCase()===memberId
      )||clean;

      localStorage.setItem('gfz_db',JSON.stringify(db));

      document.getElementById('profileEditModal')?.remove();
      document.getElementById('profileModal')?.remove();

      if(typeof updateHeaderProfile==='function')await updateHeaderProfile();
      if(typeof renderMember==='function')renderMember();
      if(typeof updateHeaderProfile==='function')await updateHeaderProfile();

      toast('Profile updated');

    }catch(e){
      console.error('Profile update failed:',e);
      toast(e.message||'Could not update profile');
    }
  };


  window.editProduct=async function(id){
    const p=(db.products||[]).find(x=>String(x.id)===String(id));
    if(!p)return;

    const c=document.getElementById('adminContent');
    if(!c)return;

    c.innerHTML=`
      <div class="flex justify-between items-center gap-3">
        <div>
          <p class="muted text-sm">Edit product</p>
          <h3 class="text-2xl font-black">${escapeHtml(p.name)}</h3>
        </div>
        <button class="btn btn-light" onclick="showAdminTab('store')">Back</button>
      </div>

      <div class="grid gap-3 mt-5">

        <div class="grid sm:grid-cols-2 gap-3">
          <input id="epName" value="${escapeHtml(p.name||'')}" placeholder="Product name">
          <input id="epPrice" type="number" value="${Number(p.price)||0}" placeholder="Price">
          <select id="epCategory">
            ${['Protein','Creatine','Mass Gainer','Supplements','Pre-workouts','Grocery']
              .map(x=>`<option ${x===p.category?'selected':''}>${x}</option>`).join('')}
          </select>
          <select id="epStock">
            <option value="in" ${p.inStock!==false?'selected':''}>In stock</option>
            <option value="out" ${p.inStock===false?'selected':''}>Out of stock</option>
          </select>
          <input id="epImage" value="${escapeHtml(String(p.img||''))}" placeholder="Main image URL">
        </div>

        <div class="glass rounded-3xl p-4">
          <p class="text-sm font-semibold text-center mb-2">Replace main product image</p>
          <div class="media-picker">
            <button type="button" class="media-btn" onclick="document.getElementById('epImageUpload').click()">Upload image</button>
            <button type="button" class="media-btn" onclick="document.getElementById('epImageCapture').click()">Capture picture</button>
            <span id="epImageName" class="media-name">Choose a new image or keep current</span>
            <input id="epImageUpload" type="file" accept="image/*">
            <input id="epImageCapture" type="file" accept="image/*" capture="environment">
          </div>
        </div>

        <input id="epImages" value="${escapeHtml((productImages(p)||[]).join(', '))}" placeholder="Additional product image URLs, comma separated">

        <div class="glass rounded-3xl p-4">
          <p class="text-sm font-semibold text-center mb-2">Add additional product images</p>
          <div class="media-picker">
            <button type="button" class="media-btn" onclick="document.getElementById('epImagesUpload').click()">Upload more images</button>
            <span id="epImagesName" class="media-name">No additional images selected</span>
            <input id="epImagesUpload" type="file" accept="image/*" multiple>
          </div>
        </div>

        <textarea id="epDescription" placeholder="Description">${escapeHtml(p.description||'')}</textarea>
        <textarea id="epUses" placeholder="How to use / uses">${escapeHtml(p.uses||'')}</textarea>
        <textarea id="epPrecautions" placeholder="Precautions">${escapeHtml(p.precautions||'')}</textarea>

        <button class="btn btn-dark" onclick="updateProduct('${escapeHtml(p.id)}')">Update product</button>
      </div>
    `;

    wireMediaPicker('epImageUpload','epImageCapture','epImageName');

    const more=document.getElementById('epImagesUpload');
    const moreName=document.getElementById('epImagesName');
    more?.addEventListener('change',()=>{
      const n=more.files?.length||0;
      if(moreName)moreName.textContent=n?`${n} additional image${n===1?'':'s'} selected`:'No additional images selected';
    });
  };


  window.saveProduct=async function(){
    if(!getToken())return toast('Admin session required');

    const name=(document.getElementById('pName')?.value||'').trim();
    if(!name)return toast('Product name required');

    const mainFile=
      document.getElementById('pImageCapture')?.files?.[0] ||
      document.getElementById('pImageUpload')?.files?.[0];

    const moreFiles=[
      ...(document.getElementById('pImagesUpload')?.files||[])
    ];

    try{
      let mainUrl=(document.getElementById('pImage')?.value||'').trim();

      const allFiles=[];
      if(mainFile)allFiles.push(mainFile);
      allFiles.push(...moreFiles);

      let uploaded=[];
      if(allFiles.length)uploaded=await uploadImages(allFiles);

      if(mainFile && !uploaded[0]?.url)throw new Error('The selected product image was not uploaded. Please try again.');
      if(uploaded[0]?.url)mainUrl=uploaded[0].url;

      if(!mainUrl)mainUrl=PFP_PLACEHOLDER;

      const extraUrls=[
        ...(document.getElementById('pImages')?.value||'')
          .split(',')
          .map(x=>x.trim())
          .filter(Boolean),
        ...uploaded.slice(mainFile?1:0).map(x=>x.url)
      ];

      const images=Array.from(new Set(
        (extraUrls.length?extraUrls:[mainUrl])
      ));

      const product={
        id:'p'+Date.now(),
        name,
        price:Number(document.getElementById('pPrice')?.value||0)||0,
        category:document.getElementById('pCategory')?.value||'Protein',
        inStock:document.getElementById('pStock')?.value!=='out',
        img:mainUrl,
        images,
        description:(document.getElementById('pDescription')?.value||'').trim()||'A quality Garuda training essential.',
        precautions:(document.getElementById('pPrecautions')?.value||'').trim()||'Use responsibly and follow the product label.',
        uses:(document.getElementById('pUses')?.value||'').trim()||'Use as directed as part of your training and nutrition routine.',
        reviews:[],
        customerImages:[]
      };

      const created=await api('/products',{
        method:'POST',
        body:JSON.stringify(product)
      });

      db.products.push(created||product);
      localStorage.setItem('gfz_db',JSON.stringify(db));

      await loadCatalog();

      adminTabStay('store');

      toast('Product added to store');

    }catch(e){
      console.error('Product creation failed:',e);
      toast(e.message||'Could not add product');
    }
  };


  window.updateProduct=async function(id){
    if(!getToken())return toast('Admin session required');

    const p=(db.products||[]).find(x=>String(x.id)===String(id));
    if(!p)return toast('Product not found');

    try{
      const mainFile=
        document.getElementById('epImageCapture')?.files?.[0] ||
        document.getElementById('epImageUpload')?.files?.[0];

      const moreFiles=[
        ...(document.getElementById('epImagesUpload')?.files||[])
      ];

      let mainUrl=(document.getElementById('epImage')?.value||'').trim()||p.img||PFP_PLACEHOLDER;

      const allFiles=[];
      if(mainFile)allFiles.push(mainFile);
      allFiles.push(...moreFiles);

      let uploaded=[];
      if(allFiles.length)uploaded=await uploadImages(allFiles);

      if(uploaded[0]?.url)mainUrl=uploaded[0].url;

      const typedExtra=(document.getElementById('epImages')?.value||'')
        .split(',')
        .map(x=>x.trim())
        .filter(Boolean);

      const newImages=Array.from(new Set([
        ...typedExtra,
        ...uploaded.slice(mainFile?1:0).map(x=>x.url)
      ]));

      const patch={
        name:(document.getElementById('epName')?.value||'').trim(),
        price:Number(document.getElementById('epPrice')?.value||0)||0,
        category:document.getElementById('epCategory')?.value||p.category,
        inStock:document.getElementById('epStock')?.value==='in',
        img:mainUrl,
        images:newImages.length?newImages:[mainUrl],
        description:(document.getElementById('epDescription')?.value||'').trim(),
        uses:(document.getElementById('epUses')?.value||'').trim(),
        precautions:(document.getElementById('epPrecautions')?.value||'').trim()
      };

      const updated=await api('/products/'+encodeURIComponent(id),{
        method:'PATCH',
        body:JSON.stringify(patch)
      });

      Object.assign(p,updated||patch);

      localStorage.setItem('gfz_db',JSON.stringify(db));

      await loadCatalog();

      adminTabStay('store');

      toast('Product updated');

    }catch(e){
      console.error('Product update failed:',e);
      toast(e.message||'Could not update product');
    }
  };


  window.deleteMember=async function(id){
    if(!getToken())return toast('Admin session required');
    const code=String(id||'').trim().toUpperCase();
    const member=(db.members||[]).find(m=>String(m.id||m.memberCode||'').trim().toUpperCase()===code);
    if(!member)return toast('Member not found');
    if(code==='GFZ-1001')return toast('The demo member is protected.');
    if(!confirm('Permanently delete '+(member.name||id)+' and linked attendance/notifications?'))return;
    try{
      await api('/members/'+encodeURIComponent(code),{method:'DELETE'});
      db.members=(db.members||[]).filter(m=>String(m.id||m.memberCode||'').trim().toUpperCase()!==code);
      if(db.workouts)for(const k of Object.keys(db.workouts))if(String(db.workouts[k]?.memberId||'').toUpperCase()===code||k.toUpperCase().startsWith(code+'_'))delete db.workouts[k];
      db.posts=(db.posts||[]).filter(p=>String(p.memberId||'').toUpperCase()!==code);
      localStorage.setItem('gfz_db',JSON.stringify(db));
      try{db.members=await api('/members');}catch(refreshError){console.warn('Member list refresh after delete failed:',refreshError.message)}
      localStorage.setItem('gfz_db',JSON.stringify(db));
      if(typeof renderAdmin==='function')renderAdmin();
      if(typeof showAdminTab==='function')showAdminTab('members');
      if(typeof renderMedia==='function')renderMedia();
      toast('Member deleted from server');
    }catch(e){toast(e.message||'Could not delete member');}
  };

  window.markMemberPaid=async function(memberCode){
    if(!getToken())return toast('Admin session required');
    const m=(db.members||[]).find(x=>String(x.id||x.memberCode).toUpperCase()===String(memberCode).toUpperCase());
    if(!m)return toast('Member not found');
    const raw=prompt('Fee amount in ₹',String(m.monthlyFee||1499));if(raw===null)return;
    const amount=Number(raw);if(!Number.isFinite(amount)||amount<=0)return toast('Enter a valid amount');
    const method=(prompt('Payment method: cash, upi, bank transfer, card','cash')||'cash').trim().toLowerCase();
    try{
      const result=await api('/payments/manual',{method:'POST',body:JSON.stringify({memberCode:m.id||m.memberCode,amount,method,idempotencyKey:(window.crypto&&crypto.randomUUID?crypto.randomUUID():'gfz-'+Date.now()+'-'+Math.random().toString(16).slice(2))})});
      db.payments=Array.isArray(db.payments)?db.payments:[];db.payments.unshift(result.payment);
      Object.assign(m,result.member||{});
      await loadState();await loadCatalog();
      if(typeof showAdminTab==='function')showAdminTab('payments');
      toast(result.communication?.sent?'Fee marked paid · confirmation sent':result.communication?.status==='failed'?'Fee recorded · message delivery failed':'Fee marked paid · notification not sent');
    }catch(e){toast(e.message||'Could not record payment');}
  };

  window.deleteProduct=async function(id){
    if(!getToken())return toast('Admin session required');

    if(!confirm('Delete this product from the store?'))return;

    try{
      await api('/products/'+encodeURIComponent(id),{
        method:'DELETE'
      });

      db.products=(db.products||[]).filter(
        p=>String(p.id)!==String(id)
      );

      cart=cart.filter(
        x=>String(x.id)!==String(id)
      );

      localStorage.setItem('gfz_db',JSON.stringify(db));

      await loadCatalog();

      adminTabStay('store');

      toast('Product deleted');

    }catch(e){
      console.error('Product deletion failed:',e);
      toast(e.message||'Could not delete product');
    }
  };


  /* Use a neutral Garuda logo instead of random remote people images. */
  if(typeof pfpSrc==='function'){
    const originalPfpSrc=pfpSrc;
    window.pfpSrc=function(m,fallback=PFP_PLACEHOLDER){
      const photo=String(m?.photo||'');
      if(!photo || photo.startsWith('idb:'))return PFP_PLACEHOLDER;
      return photo;
    };
  }

  async function restoreSession(){
    const token=getToken();
    if(!token){return;}
    try{
      const session=await api('/auth/me');
      const role=String(session?.role||session?.user?.role||'');
      if(role==='admin'){
        const results=await Promise.allSettled([api('/members'),api('/payments'),api('/state')]);
        if(results[0].status==='fulfilled')db.members=results[0].value.map(m=>Object.assign({},m,{id:m.id||m.memberCode}));
        if(results[1].status==='fulfilled')db.payments=results[1].value;
        if(results[2].status==='fulfilled'){
          const state=results[2].value||{};
          if(state.workouts)db.workouts=state.workouts;if(state.posts)db.posts=state.posts;if(state.notifications)db.notifications=state.notifications;
        }
        localStorage.setItem('gfz_db',JSON.stringify(db));
        if(typeof closeAuth==='function')closeAuth();
        if(typeof openPortal==='function')openPortal('admin');
        else if(typeof renderAdmin==='function')renderAdmin();
      }else if(role==='member'){
        const profile=await api('/members/me');
        const code=String(profile?.memberCode||session?.user?.memberCode||'').toUpperCase();
        if(!code)throw new Error('Member session could not be restored');
        const clean=Object.assign({},profile,{id:code});delete clean.pinHash;
        db.members=Array.isArray(db.members)?db.members:[];
        const idx=db.members.findIndex(m=>String(m.id||m.memberCode).toUpperCase()===code);
        if(idx>=0)db.members[idx]=Object.assign({},db.members[idx],clean);else db.members.push(clean);
        currentMember=clean;
        const state=await api('/state').catch(()=>null);
        if(state){if(state.workouts)db.workouts=state.workouts;if(state.posts)db.posts=state.posts;}
        const ns=await api('/members/me/notifications').catch(()=>[]);
        db.notifications=(ns||[]).map(n=>Object.assign({},n,{id:n._id||n.id,date:n.createdAt||n.date||new Date().toISOString()}));
        localStorage.setItem('gfz_db',JSON.stringify(db));
        if(typeof closeAuth==='function')closeAuth();
        if(typeof updateHeaderProfile==='function')updateHeaderProfile();
        if(typeof updateNotificationDot==='function')updateNotificationDot();
        if(typeof openPortal==='function')openPortal('member');
        else if(typeof renderMember==='function')renderMember();
      }else{
        setToken('');
      }
    }catch(e){
      const message=String(e?.message||'');
      if(/Authentication required|Invalid or expired session|inactive or no longer exists|Admin account no longer exists|Member session could not be restored/i.test(message)){
        setToken('');
      }else{
        console.warn('Session restore could not complete; token retained for retry:',message);
      }
    }
  }
  window.GFZBackendSaveProduct=window.saveProduct;
  window.GFZBackendDeleteMember=window.deleteMember;
  window.GFZBackend.restoreSession=restoreSession;
  const bootBackend=async()=>{await loadCatalog();if(getToken())await restoreSession();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootBackend,{once:true});else bootBackend();
})();
