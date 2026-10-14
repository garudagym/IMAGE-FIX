'use strict';
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','public','index.html'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'..','package.json'),'utf8'));
const tests=[
 ['V182 package version',pkg.version==='1.0.182'],
 ['consolidated controller is after previous controller',html.lastIndexOf('gfz-v182-single-controller')>html.lastIndexOf('gfz-v179-consolidated-runtime')],
 ['Account route has member dashboard fallback',html.includes('function goAccount()')&&html.includes("window.openMemberDashboard==='function'")],
 ['Home route preserves auth',html.includes('Home navigation must never mutate authentication state')],
 ['legacy history listeners gated early',html.includes('gfz-v182-early-guards')&&html.includes('window.__GFZ_DISABLE_LEGACY_POPSTATE=true')],
 ['Profile event intercepted at Window capture',html.includes("closest('#portal #memberPortal button')")&&html.includes("safeCall('gfzOpenOwnProfile')")],
 ['portal has independent vertical scroll',html.includes('overflow-y:auto!important;-webkit-overflow-scrolling:touch!important')],
 ['viewer restores body styles and scroll',html.includes('bodyStyles={position:document.body.style.position')&&html.includes('window.scrollTo({top:scrollY,left:0,behavior:\'auto\'})')],
 ['admin sign-out button injected',html.includes('function ensureAdminSignout()')&&html.includes('data-gfz-admin-signout')],
 ['member sign-out clears local auth tokens',html.includes("localStorage.removeItem('gfz_api_token');localStorage.removeItem('gfz_admin_token');localStorage.removeItem('gfz_member_token');localStorage.removeItem('gfz_session')")],
];
let fails=0;for(const [name,ok] of tests){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)fails++;}if(fails)process.exit(1);console.log(`PASS ${tests.length} static source checks; not live browser tests.`);
