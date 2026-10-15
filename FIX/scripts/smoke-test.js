const fs=require('fs');const path=require('path');
const root=path.join(__dirname,'..');
const required=[
 'public/index.html','public/backend-client.js','public/assets/desktop-hero.jpg','public/assets/mobile-hero.jpg',
 'public/assets/garuda-logo.svg','public/gallery/full-gym-floor.jpg','public/gallery/cardio-zone.jpg','public/gallery/boxing-zone.jpg','public/gallery/machine-zone.jpg','public/gallery/cable-functional.jpg','public/gallery/strength-floor.jpg','public/gallery/treadmill.jpg',
 'src/server.js','src/seed.js','src/notifications.js','src/sms.js','src/routes/auth.js','src/routes/catalog.js','src/routes/members.js','src/routes/payments.js','src/routes/admin.js','src/routes/state.js'
];
for(const f of required){if(!fs.existsSync(path.join(root,f)))throw new Error('Missing required file: '+f);}
const seed=fs.readFileSync(path.join(root,'src/seed.js'),'utf8');
const expected={'Strength — 1 Month':999,'Strength — 3 Months':2499,'Strength — 6 Months':4499,'Strength — 1 Year':7999,'Cardio — 1 Month':899,'Cardio — 3 Months':2199,'Cardio — 6 Months':3999,'Cardio — 1 Year':6499,'Strength + Cardio — 1 Month':1499,'Strength + Cardio — 3 Months':3999,'Strength + Cardio — 6 Months':6999,'Strength + Cardio — 1 Year':11999};
for(const [name,price] of Object.entries(expected)){if(!seed.includes(`name:'${name}'`)||!seed.includes(`price:${price}`))throw new Error('Plan mismatch: '+name);}
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
for(const x of ['/assets/desktop-hero.jpg','/assets/mobile-hero.jpg','/gallery/full-gym-floor.jpg','/gallery/machine-zone.jpg'])if(!html.includes(x))throw new Error('Missing asset reference '+x);
if(html.includes('assets/gallery/'))throw new Error('Stale relative gallery reference remains');
if(html.includes('src="assets/mobile-hero.jpg"'))throw new Error('Stale hero reference remains');
console.log('GFZ static smoke test: PASS');
