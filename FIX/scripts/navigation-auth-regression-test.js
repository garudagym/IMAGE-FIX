'use strict';
const fs=require('fs');
const assert=require('assert');
const html=fs.readFileSync('public/index.html','utf8');
const backend=fs.readFileSync('public/backend-client.js','utf8');
const homeBody=(html.match(/function goHome\(\)\{([\s\S]*?)\n \}/)||[])[1]||'';
const checks=[
  ['Home handler does not clear member/admin identity', /closePublicSurfaces\(\)/.test(homeBody) && !/current(?:Member|Admin)\s*=\s*null/.test(homeBody)],
  ['Admin identity is declared', /let currentMember=null;let currentAdmin=null;/.test(html)],
  ['Admin login sets admin identity', /currentMember=null;currentAdmin=Object\.assign\(\{role:'admin'\},r\.user\|\|\{username\}\)/.test(backend)],
  ['Admin session restore sets admin identity', /if\(role==='admin'\)\{\s*currentMember=null;currentAdmin=Object\.assign\(\{role:'admin'\},session\?\.user\|\|\{role:'admin'\}\)/.test(backend)],
  ['Member login sets member identity and clears admin', /currentMember=clean;currentAdmin=null;/.test(backend)],
  ['Member sign-out clears shared backend token', /window\.gfzSignOut=function\(role\)[\s\S]*?localStorage\.removeItem\('gfz_api_token'\)/.test(html)],
  ['Profile click routes through own-profile function', /const ok=safeCall\('gfzOpenOwnProfile'\)/.test(html)],
  ['Back dispatcher closes media and auth surfaces', /function closeTop\(\)[\s\S]*?facilityLightbox[\s\S]*?const auth=\$\('#authModal'\)/.test(html)],
  ['Viewer lock covers media lightboxes', /const viewerSelectors=\['#postViewerModal','#gfzMediaZoom','#pfpLightbox','\.media-lightbox','\.mobile-gallery-lightbox'\]/.test(html)],
  ['Member portal has independent vertical scroll', /#portal\{position:fixed!important;inset:0!important;z-index:2147482000!important;overflow-x:hidden!important;overflow-y:auto!important/.test(html)],
  ['Admin sign-out is injected into admin portal', /function ensureAdminSignout\(\)[\s\S]*?host\.prepend\(wrap\)/.test(html)],
  ['Startup top reset respects user interaction', /function initialTop\(\)\{if\(userInteracted\|\|/.test(html)],
];
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);assert.ok(ok,name)}
console.log(`Navigation/auth regression source checks: ${checks.length}/${checks.length} passed. These are static source checks, not browser interaction tests.`);
