'use strict';
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','public','index.html'),'utf8');
const tests=[
 ['early legacy-history guard exists',html.indexOf('gfz-v182-early-guards')<html.indexOf("addEventListener('popstate'")&&html.includes('window.__GFZ_DISABLE_LEGACY_POPSTATE=true')],
 ['window capture controller intercepts bottom nav',html.includes("window.addEventListener('click',function(e){")&&html.includes("closest('#gfzBottomSelector button[data-tab]')")],
 ['Account route explicitly opens member dashboard',html.includes('function goAccount()')&&html.includes("window.openMemberDashboard==='function'")],
 ['Profile is intercepted before document listeners',html.includes("closest('#portal #memberPortal button')")&&html.includes("safeCall('gfzOpenOwnProfile')")],
 ['Home route preserves auth and resets scroll',html.includes('Home navigation must never mutate authentication state')&&html.includes('document.documentElement.scrollTop=0')],
 ['portal is independently scrollable',html.includes('overflow-y:auto!important; -webkit-overflow-scrolling:touch!important')||html.includes('overflow-y:auto!important;-webkit-overflow-scrolling:touch!important')],
 ['viewer lock restores body styles and scroll',html.includes('function syncViewerLock()')&&html.includes("document.body.style.top=(-scrollY)+'px'")&&html.includes('window.scrollTo({top:scrollY,left:0,behavior:\'auto\'})')],
 ['admin sign-out button injected',html.includes('function ensureAdminSignout()')&&html.includes('data-gfz-admin-signout')],
 ['member sign-out intercepted early',html.includes("closest('.gfz-member-signout')")&&html.includes("safeCall('gfzSignOut','member')")],
 ['backend client cache query bumped',html.includes('/backend-client.js?v=182')],
];
let failures=0;for(let i=0;i<10000;i++)for(const [name,ok] of tests)if(!ok){if(!failures)console.error('FAIL',name);failures++;}
if(failures){console.error(`V182 source checks failed: ${failures}`);process.exit(1)}
console.log(`V182 source assertions PASS: ${tests.length} checks repeated 10,000 times. Static assertions are not browser interactions.`);
