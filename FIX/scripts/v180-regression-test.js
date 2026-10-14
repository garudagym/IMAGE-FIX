'use strict';
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','public','index.html'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'..','package.json'),'utf8'));
const tests=[
 ['V180 package version',pkg.version==='1.0.180'],
 ['first-running Profile handler resolves member against all IDs',html.includes('const same=(a,b)=>ids(a).some(x=>ids(b).some(y=>norm(x)===norm(y)))')],
 ['Profile handler rejects missing canonical ID safely',html.includes("if(!canonical){console.error('[GFZ] authenticated member has no usable ID',me);window.toast?.('Your member ID is missing. Please contact the gym.');return;}")],
 ['legacy popstate listeners are gated before the consolidated dispatcher',html.includes('gfz-v179-early-runtime-guards')&&html.includes('if(!window.__GFZ_DISABLE_LEGACY_POPSTATE)window.addEventListener(\'popstate\'')],
 ['final nav replaces old button nodes before binding',html.includes('const b=old.cloneNode(true)')&&html.includes('old.replaceWith(b)')],
 ['final nav binds exactly one new click listener per replacement button',html.includes("b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();window.gfzBottomNav(b.dataset.tab)},true)")],
 ['Home navigation preserves role tokens',html.includes("if(tab==='nav1'){closeSurfaces();if(inside)p.classList.add('hidden')")],
 ['viewer background scroll lock still exists',html.includes('function syncViewer()')&&html.includes('gfz-media-viewer-open')],
 ['admin sign-out insertion remains available',html.includes('function ensureAdminSignout()')&&html.includes('host.prepend(w)')],
 ['member sign-out clears member in-memory identity',html.includes("if(typeof currentMember!=='undefined')currentMember=null")],
];
let failures=0;for(const [name,ok] of tests){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failures++;}
if(failures)process.exit(1);console.log(`PASS ${tests.length} source-level regression checks; these are not live browser tests.`);
