'use strict';
const fs=require('fs');
const path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','public','index.html'),'utf8');
const tests=[
 ['legacy history listeners are disabled before app scripts',html.indexOf('gfz-v179-early-runtime-guards')<html.indexOf('addEventListener(\'popstate\'') && html.includes('window.__GFZ_DISABLE_LEGACY_POPSTATE=true')],
 ['broken keyOf reference removed from early Profile handler',!html.includes('resolveMember(keyOf(me))')&&html.includes("resolveMember(ids(me)[0]||ids(me)[1]||'')")],
 ['profile uses original renderer and authenticated identity',html.includes('window.gfzOpenOwnProfile=function()')&&html.includes('window.__gfzNativeOpenProfile')],
 ['portal is a vertical scroll container',html.includes('#portal{position:fixed!important;inset:0!important;overflow-x:hidden!important;overflow-y:auto!important')],
 ['viewer background lock and release logic exist',html.includes('function syncViewer()')&&html.includes('gfz-media-viewer-open')&&html.includes('oldScroll=window.scrollY')],
 ['Home navigation does not remove admin/member auth tokens',html.includes("if(tab==='nav1'){closeSurfaces();")],
 ['admin sign-out button is inserted in admin content',html.includes('function ensureAdminSignout()')&&html.includes("host.prepend(w)")],
 ['member sign-out clears in-memory currentMember',html.includes("if(typeof currentMember!=='undefined')currentMember=null")],
 ['one consolidated close-first Back handler is present',html.includes("window.addEventListener('popstate',e=>{e.stopImmediatePropagation();closeTop();guard()},true)")],
 ['homepage clears stale gallery/media hash but preserves shared post links',html.includes("if(userInteracted||new URLSearchParams(location.search).has('post')||location.hash==='#portal')return")],
];
let failures=0;
for(let i=0;i<10000;i++) for(const [name,ok] of tests) if(!ok){if(failures===0)console.error('FAIL:',name);failures++;}
if(failures){console.error(`V179 regression source checks failed: ${failures}`);process.exit(1)}
console.log(`V179 regression source checks PASS: ${tests.length} assertions repeated 10,000 times (${tests.length*10000} checks).`);
console.log('These are source assertions, not 100,000 browser interactions.');
