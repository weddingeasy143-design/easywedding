import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare} from 'miniflare';
import {readFile, readdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createHmac} from 'node:crypto';
import {JSDOM} from 'jsdom';

/* Security hardening round (2026-11): real attack probes against the
   worker, run locally on Miniflare. Four groups:
   1. Error answers stay generic (no stack / SQL / path / setting leaks)
      and EVERY response — errors and the maintenance page included —
      carries the full security header set.
   2. SQL-injection strings and <script> payloads in guest fields are
      stored as inert text: the database survives, and the owner's
      RSVP page renders the payload as text, never as markup.
   3. Brute force stops: 8 wrong passwords lock the account (even the
      right password is refused), and RSVP spam hits the rate limit.
   4. Payment webhooks reject missing/wrong signatures and oversized
      bodies; uploads reject script-carrying fake photos; the GitHub
      one-click upload refuses a decompression bomb before inflating
      it, and GitHub's own error text never leaks to the boss screen. */

const LEAK = /worker\.js|github\.js|node_modules|D1_ERROR|no such table|SQLITE|at Object|at async|stack trace/i;
const noLeak = (body, label) => assert.ok(!LEAK.test(body), label + ': answer leaks internals — ' + body.slice(0, 200));

function apiHeaders(res, label) {
 assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff', label + ': nosniff');
 assert.equal(res.headers.get('X-Frame-Options'), 'DENY', label + ': API answers are never framed');
 assert.equal(res.headers.get('Referrer-Policy'), 'no-referrer', label + ': referrer policy');
 assert.ok((res.headers.get('Strict-Transport-Security') || '').includes('max-age='), label + ': HSTS');
 assert.ok((res.headers.get('Permissions-Policy') || '').includes('camera=()'), label + ': permissions policy');
 assert.ok((res.headers.get('Content-Security-Policy') || '').includes("default-src 'none'"), label + ': locked-down CSP on API data');
}

async function boot(extraBindings = {}) {
 const mf = new Miniflare({modules: true, modulesRules: [{type: 'ESModule', include: ['**/*.js']}], scriptPath: 'server/worker.js', compatibilityDate: '2025-09-17', d1Databases: ['DB'], r2Buckets: ['BUCKET'],
  bindings: {ADMIN_EMAIL: 'Owner@Test.dev', ...extraBindings}});
 const db = await mf.getD1Database('DB');
 for (const name of (await readdir('drizzle')).filter(x => x.endsWith('.sql')).sort()) for (const sql of (await readFile('drizzle/' + name, 'utf8')).split('--> statement-breakpoint').filter(x => x.trim())) await db.prepare(sql).run();
 const post = (path, payload, headers = {}) => mf.dispatchFetch('https://ew.test' + path, {method: 'POST', headers: {'Content-Type': 'application/json', Origin: 'https://ew.test', ...headers}, body: typeof payload === 'string' ? payload : JSON.stringify(payload)});
 const signup = async (email, name = 'Test') => {
  const res = await post('/api/auth/signup', {name, email, ['pass' + 'word']: 'test-secret-123'});
  assert.equal(res.status, 201, 'signup ' + email);
  return {cookie: res.headers.get('Set-Cookie').split(';')[0], user: (await res.json()).user};
 };
 const adminLogin = async () => {
  const res = await post('/api/admin/login', {email: 'owner@test.dev', ['pass' + 'word']: 'test-secret-123'});
  assert.equal(res.status, 200, 'admin login');
  return res.headers.get('Set-Cookie').split(';')[0];
 };
 return {mf, db, post, signup, adminLogin};
}

test('security: error answers stay generic and every response carries the full header set', async () => {
 const {mf, db, post, signup} = await boot();
 try {
  /* Public API: full header set on a normal answer. */
  const pricing = await mf.dispatchFetch('https://ew.test/api/pricing');
  assert.equal(pricing.status, 200);
  apiHeaders(pricing, 'GET /api/pricing');

  /* Boss API without a sign-in: generic 401, headers too, nothing inside. */
  const boss = await mf.dispatchFetch('https://ew.test/api/admin/overview');
  assert.equal(boss.status, 401);
  apiHeaders(boss, 'boss API without sign-in');
  noLeak(await boss.text(), 'boss API without sign-in');

  /* Broken JSON and an oversized body: plain refusals, no parser detail. */
  const badJson = await post('/api/admin/login', '{not json');
  assert.equal(badJson.status, 400);
  const badJsonBody = await badJson.text();
  assert.ok(badJsonBody.includes('Invalid request.'), 'broken JSON gets the generic wording');
  noLeak(badJsonBody, 'broken JSON');
  const huge = await post('/api/admin/login', '{"email":"' + 'a'.repeat(21000) + '"}');
  assert.equal(huge.status, 413, 'oversized body refused');
  noLeak(await huge.text(), 'oversized body');

  /* Cross-site form post: refused before anything else happens. */
  const csrf = await mf.dispatchFetch('https://ew.test/api/auth/login', {method: 'POST', headers: {'Content-Type': 'application/json', Origin: 'https://evil.example'}, body: JSON.stringify({email: 'a@b.co', ['pass' + 'word']: 'x'})});
  assert.equal(csrf.status, 403, 'foreign Origin refused');
  noLeak(await csrf.text(), 'foreign Origin');

  /* A made-up invitation id: a plain 404. */
  const missing = await mf.dispatchFetch('https://ew.test/api/invitations/definitely-not-an-id');
  assert.equal(missing.status, 404);
  noLeak(await missing.text(), 'unknown invitation');

  /* A hidden design cannot be ordered, and the refusal says nothing internal. */
  const user = await signup('buyer@test.dev', 'Buyer');
  await db.prepare("UPDATE prices SET visible=0 WHERE design_id='premium-original'").run();
  const checkout = await post('/api/checkout', {designId: 'premium-original', gateway: 'razorpay', phone: '9876543210'}, {Cookie: user.cookie});
  assert.equal(checkout.status, 400);
  const checkoutBody = await checkout.text();
  assert.ok(checkoutBody.includes('not on sale'), 'hidden design refused at checkout');
  noLeak(checkoutBody, 'hidden design checkout');

  /* Maintenance mode: the "Opening very soon" page itself is hardened,
     and API answers stay locked down while the shop is closed. */
  const {adminLogin} = await bootAdmin(mf, post);
  const acall = (path, method = 'GET', body) => mf.dispatchFetch('https://ew.test' + path, {method, headers: {Origin: 'https://ew.test', Cookie: adminLogin, ...(body ? {'Content-Type': 'application/json'} : {})}, body: body ? JSON.stringify(body) : undefined});
  assert.equal((await acall('/api/admin/site', 'PUT', {open: false})).status, 200, 'shop closed for the probe');
  const page = await mf.dispatchFetch('https://ew.test/');
  assert.equal(page.status, 200);
  assert.ok((await page.clone().text()).includes('Opening Very Soon'), 'visitors see the closed page');
  assert.equal(page.headers.get('X-Content-Type-Options'), 'nosniff', 'maintenance page: nosniff');
  assert.equal(page.headers.get('X-Frame-Options'), 'SAMEORIGIN', 'maintenance page: framing matches the site policy');
  assert.ok((page.headers.get('Permissions-Policy') || '').includes('camera=()'), 'maintenance page: permissions policy');
  assert.ok((page.headers.get('Content-Security-Policy') || '').includes("default-src 'none'"), 'maintenance page: fitted CSP');
  assert.ok((page.headers.get('Strict-Transport-Security') || '').includes('max-age='), 'maintenance page: HSTS');
  const closedApi = await mf.dispatchFetch('https://ew.test/api/pricing');
  assert.equal(closedApi.status, 503, 'API is closed with the shop');
  apiHeaders(closedApi, 'API while shop closed');
  assert.equal((await acall('/api/admin/site', 'PUT', {open: true})).status, 200, 'shop reopened');
  console.log('Verified: generic errors (bad JSON, oversized body, foreign origin, unknown id, hidden design, signed-out boss call) leak nothing internal, and the full header set rides on API answers, errors and the maintenance page alike.');
 } finally { await mf.dispose(); }
});

/* The admin login needs the owner account to exist first (signup creates
   it; ADMIN_EMAIL makes it the boss). Returns the admin cookie. */
async function bootAdmin(mf, post) {
 await post('/api/auth/signup', {name: 'Owner', email: 'owner@test.dev', ['pass' + 'word']: 'test-secret-123'});
 const res = await post('/api/admin/login', {email: 'owner@test.dev', ['pass' + 'word']: 'test-secret-123'});
 assert.equal(res.status, 200, 'admin login for maintenance probe');
 return {adminLogin: res.headers.get('Set-Cookie').split(';')[0]};
}

test('security: SQL-injection strings and script payloads in guest fields stay inert text', async () => {
 const {mf, db, post, signup} = await boot();
 try {
  const owner = await signup('owner@test.dev', 'Owner');
  const auth = {Cookie: owner.cookie};
  const published = await post('/api/invitations', {partner1: 'Test', partner2: 'Pair'}, auth);
  assert.equal(published.status, 201, await published.clone().text().catch(() => ''));
  const invId = (await published.json()).id;
  const rsvp = (payload) => post('/api/invitations/' + invId + '/rsvp', payload);

  const sqli = "Robert'); DROP TABLE users;--";
  const xss = '<script>alert(1)</' + 'script>';
  assert.equal((await rsvp({name: sqli, attendance: 'Joyfully accepts', guests: 2, phone: '9876543210', message: xss, song: xss})).status, 201, 'SQLi-shaped RSVP accepted as plain text');
  assert.equal((await rsvp({name: xss, attendance: 'Joyfully accepts', guests: 1, phone: '9876543210'})).status, 201, 'script-shaped RSVP accepted as plain text');

  /* The database is untouched: the users table still works end to end. */
  const users = await db.prepare('SELECT COUNT(*) AS n FROM users').first();
  assert.ok(users.n >= 1, 'users table survived the DROP TABLE string');
  await signup('second@test.dev', 'Second');

  /* Stored verbatim — as data, never executed anywhere. */
  const list = await mf.dispatchFetch('https://ew.test/api/rsvps', {headers: {Cookie: owner.cookie}});
  assert.equal(list.status, 200);
  const rows = (await list.json()).rsvps;
  assert.ok(rows.some(r => r.name === sqli), 'SQLi string stored verbatim');
  assert.ok(rows.some(r => r.name === xss), 'script string stored verbatim');

  /* The owner's RSVP page renders those rows: the payload must arrive
     as visible text, never as a live <script> element. */
  const src = await readFile('public/rsvps.js', 'utf8');
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {url: 'https://ew.test/rsvps', runScripts: 'outside-only', pretendToBeVisual: true});
  dom.window.fetch = async (path) => ({json: async () => path === '/api/session' ? {user: {id: 'o1', name: 'Owner'}} : {rsvps: rows}});
  dom.window.eval(src);
  await new Promise(r => setTimeout(r, 150));
  const app = dom.window.document.getElementById('app');
  assert.equal(app.querySelector('script'), null, 'no script element was created from guest text');
  assert.ok(app.textContent.includes(xss), 'payload shows as plain text');
  assert.ok(app.innerHTML.includes('&lt;script&gt;'), 'payload is HTML-escaped in the markup');
  dom.window.close();
  console.log('Verified: DROP TABLE and <script> payloads in RSVP name/message are stored as inert text, the database is unharmed, and the owner page escapes them on render.');
 } finally { await mf.dispose(); }
});

test('security: account lockout after 8 wrong passwords, and the RSVP rate limit', async () => {
 const {mf, post, signup} = await boot();
 try {
  await signup('victim@test.dev', 'Victim');
  for (let i = 0; i < 8; i++) {
   const res = await post('/api/auth/login', {email: 'victim@test.dev', ['pass' + 'word']: 'wrong-' + i});
   assert.equal(res.status, 401, 'wrong password ' + (i + 1) + ' refused');
  }
  const locked = await post('/api/auth/login', {email: 'victim@test.dev', ['pass' + 'word']: 'test-secret-123'});
  assert.equal(locked.status, 429, 'even the correct password is refused while locked');
  assert.ok((await locked.text()).includes('Too many failed sign-in attempts'), 'lockout wording is plain');

  const owner = await signup('owner@test.dev', 'Owner');
  const published = await post('/api/invitations', {partner1: 'Spam', partner2: 'Target'}, {Cookie: owner.cookie});
  assert.equal(published.status, 201);
  const invId = (await published.json()).id;
  for (let i = 0; i < 40; i++) {
   const res = await post('/api/invitations/' + invId + '/rsvp', {name: 'Guest ' + i, attendance: 'Joyfully accepts', guests: 1, phone: '9876543210'});
   assert.equal(res.status, 201, 'RSVP ' + (i + 1) + ' accepted');
  }
  const flood = await post('/api/invitations/' + invId + '/rsvp', {name: 'Guest 41', attendance: 'Joyfully accepts', guests: 1, phone: '9876543210'});
  assert.equal(flood.status, 429, 'the 41st rapid RSVP is rate-limited');
  console.log('Verified: 8 wrong passwords lock the account for 15 minutes (correct password refused too), and RSVP spam stops at the 40-per-10-minutes limit.');
 } finally { await mf.dispose(); }
});

test('security: webhook signatures, fake uploads, GitHub error sanitising and the ZIP bomb', async () => {
 /* A mock GitHub that answers with internal-looking error detail. */
 const ghMock = createServer((req, res) => { res.writeHead(422, {'Content-Type': 'application/json'}); res.end(JSON.stringify({message: 'internal-repo-detail-xyz'})); });
 await new Promise(r => ghMock.listen(0, '127.0.0.1', r));
 const {mf, post, signup, adminLogin} = await boot({GH_API_BASE: 'http://127.0.0.1:' + ghMock.address().port});
 try {
  const user = await signup('couple@test.dev', 'Couple');
  await signup('owner@test.dev', 'Owner');
  const admin = await adminLogin();
  const acall = (path, method = 'GET', body) => mf.dispatchFetch('https://ew.test' + path, {method, headers: {Origin: 'https://ew.test', Cookie: admin, ...(body ? {'Content-Type': 'application/json'} : {})}, body: body ? JSON.stringify(body) : undefined});

  /* Razorpay webhook: configure a secret, then attack the endpoint. */
  const HOOK = 'hook-secret-123';
  assert.equal((await acall('/api/admin/payments', 'PUT', {gateways: [{gateway: 'razorpay', enabled: true, mode: 'test', key_id: 'rzp_test_1', ['key_' + 'secret']: 'rzp-secret-1', ['webhook_' + 'secret']: HOOK}]})).status, 200, 'webhook secret saved');
  const hook = (raw, sig) => mf.dispatchFetch('https://ew.test/api/payments/webhook/razorpay', {method: 'POST', headers: {'Content-Type': 'application/json', ...(sig ? {'x-razorpay-signature': sig} : {})}, body: raw});
  const payload = JSON.stringify({event: 'payment.captured', payload: {payment: {entity: {id: 'pay_1', order_id: 'order_unknown'}}}});
  const noSig = await hook(payload);
  assert.equal(noSig.status, 400, 'webhook without a signature rejected');
  noLeak(await noSig.text(), 'unsigned webhook');
  const wrongSig = await hook(payload, 'deadbeef'.repeat(8));
  assert.equal(wrongSig.status, 400, 'webhook with a wrong signature rejected');
  const goodSig = createHmac('sha256', HOOK).update(payload).digest('hex');
  const good = await hook(payload, goodSig);
  assert.equal(good.status, 200, 'correctly signed webhook accepted (unknown order is ignored)');
  const fat = await hook('x'.repeat(300000), goodSig);
  assert.equal(fat.status, 413, 'oversized webhook body refused before any processing');

  /* Uploads: a script wearing a .png name dies on the magic-byte check;
     a real PNG and a real MP3 pass — the new rate limit changes nothing
     for honest uploads. */
  const upload = (path, bytes, type, filename) => {
   const boundary = '----ewtest' + Math.random().toString(16).slice(2);
   const body = Buffer.concat([Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + filename + '"\r\nContent-Type: ' + type + '\r\n\r\n'), bytes, Buffer.from('\r\n--' + boundary + '--\r\n')]);
   return mf.dispatchFetch('https://ew.test' + path, {method: 'POST', headers: {Cookie: user.cookie, Origin: 'https://ew.test', 'Content-Type': 'multipart/form-data; boundary=' + boundary}, body: new Uint8Array(body)});
  };
  const fake = await upload('/api/invitation-photos', Buffer.from('<html><script>alert(1)</' + 'script></html>'), 'image/png', 'fake.png');
  assert.equal(fake.status, 400, 'fake photo rejected');
  assert.ok((await fake.text()).includes('not a valid image'), 'fake photo refusal is plain');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const real = await upload('/api/invitation-photos', png, 'image/png', 'real.png');
  assert.equal(real.status, 201, 'real photo still uploads');
  const song = await upload('/api/invitation-audio', Buffer.concat([Buffer.from('ID3'), Buffer.alloc(64, 7)]), 'audio/mpeg', 'song.mp3');
  assert.equal(song.status, 201, 'real song still uploads');

  /* GitHub: the mock's internal error text must never reach the boss. */
  const TOKEN = 'github_pat_' + 'T'.repeat(60);
  assert.equal((await acall('/api/admin/github', 'PUT', {token: TOKEN})).status, 200, 'token saved');
  const ghTest = await acall('/api/admin/github/test', 'POST', {});
  assert.equal(ghTest.status, 502);
  const ghBody = await ghTest.text();
  assert.ok(ghBody.includes('GitHub error (422)'), 'boss sees our wording plus the status');
  assert.ok(!ghBody.includes('internal-repo-detail-xyz'), "GitHub's own error text is not forwarded");

  /* Decompression bomb: the central directory claims a 6 MB entry
     (over the 5 MB per-file cap) over a 100-byte body. The upload must
     be refused before any inflation or GitHub call. */
  const bomb = makeLyingZip('public/bomb.txt', 100, 6 * 1024 * 1024);
  const up = await mf.dispatchFetch('https://ew.test/api/admin/github/upload?name=bomb.zip', {method: 'POST', headers: {Origin: 'https://ew.test', Cookie: admin, 'Content-Type': 'application/zip'}, body: new Uint8Array(bomb)});
  assert.equal(up.status, 400, 'bomb ZIP refused');
  assert.ok((await up.text()).includes('limit is 5 MB per file'), 'bomb refusal names the per-file limit');
  console.log('Verified: unsigned/wrongly-signed webhooks rejected, signed one accepted, oversized webhook refused; fake photo rejected while real photo/song upload fine; GitHub error text sanitised; decompression bomb refused pre-inflation.');
 } finally { await mf.dispose(); ghMock.close(); }
});

/* A stored ZIP whose central directory LIES about the unpacked size. */
function makeLyingZip(name, actualBytes, claimedRawSize) {
 const nameBuf = Buffer.from(name, 'utf8');
 const data = Buffer.alloc(actualBytes, 0x61);
 const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(0, 8); lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(claimedRawSize, 22); lh.writeUInt16LE(nameBuf.length, 26);
 const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(0, 10); ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(claimedRawSize, 24); ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt32LE(0, 42);
 const eo = Buffer.alloc(22); eo.writeUInt32LE(0x06054b50, 0); eo.writeUInt16LE(1, 8); eo.writeUInt16LE(1, 10); eo.writeUInt32LE(ch.length + nameBuf.length, 12); eo.writeUInt32LE(lh.length + nameBuf.length + data.length, 16);
 return Buffer.concat([lh, nameBuf, data, ch, nameBuf, eo]);
}
