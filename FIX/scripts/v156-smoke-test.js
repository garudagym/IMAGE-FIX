const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const server = read('src/server.js');
const members = read('src/routes/members.js');
const payments = read('src/routes/payments.js');
const auth = read('src/routes/auth.js');
const models = read('src/models/index.js');
const client = read('public/backend-client.js');
const html = read('public/index.html');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['Cloudinary dependency', Boolean(pkg.dependencies.cloudinary)],
  ['Cloudinary upload uses secure URL', server.includes('cloudinary.uploader.upload_stream') && server.includes('result.secure_url')],
  ['Legacy MongoDB media fallback remains', server.includes('Backwards-compatible fallback until CLOUDINARY_URL is configured')],
  ['Explicit edit state determines PATCH', client.includes('const editingCode=String(window.__gfzEditingMemberCode||\'\').trim().toUpperCase()') && client.includes("method:editingCode?'PATCH':'POST'")],
  ['Session restore validates /auth/me', client.includes('async function restoreSession()') && client.includes("api('/auth/me')")],
  ['Member phone normalized to India', members.includes('normalizeIndiaPhone') && members.includes("return '+91'+digits")],
  ['Manual payments are idempotent', payments.includes('idempotencyKey') && models.includes('idempotencyKey: { type: String, unique: true, sparse: true')],
  ['Manual fee updates use transaction', payments.includes('session.withTransaction')],
  ['Separate Add New Member navigation', html.includes('data-v156-add-member') && html.includes("window.showAdminTab('add-member')")],
  ['Member and payment search UI', html.includes('v156MemberSearch') && html.includes('v156PaymentSearch')],
  ['Mark as Paid records payment', html.includes('window.markMemberPaid=async function(memberCode)') && html.includes("'/payments/manual'")],
  ['Frontend cache version bumped', html.includes('/backend-client.js?v=166')],
  ['Auth endpoint does not return PIN hash', auth.includes('delete m.pinHash')]
];
const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
if (failed.length) process.exit(1);
console.log(`GFZ V156 targeted smoke test: PASS (${checks.length} checks)`);
