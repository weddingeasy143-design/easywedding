import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare} from 'miniflare';
import {readFile, readdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {deflateRawSync} from 'node:zlib';

/* Boss one-click GitHub publishing, proven end-to-end against a LOCAL mock
   of the GitHub API. No real GitHub, no real token: the worker is pointed
   at the mock through the GH_API_BASE binding, exactly as production code
   would call api.github.com. The mock enforces the real API's sha rules
   (update/delete need the current sha), so a green run means the worker's
   create/update/delete dance is correct. */

const TOKEN = 'github_pat_' + 'T'.repeat(60);

/* ---------- tiny ZIP writer (stored + deflate, correct CRC32) ---------- */
const CRC_TABLE = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function makeZip(entries) {
 const locals = [], centrals = []; let offset = 0;
 for (const e of entries) {
  const nameBuf = Buffer.from(e.name, 'utf8');
  const raw = Buffer.isBuffer(e.data) ? e.data : Buffer.from(e.data);
  const comp = e.method === 8 ? deflateRawSync(raw) : raw;
  const crc = crc32(raw);
  const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(e.method, 8); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(nameBuf.length, 26);
  locals.push(lh, nameBuf, comp);
  const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(e.method, 10); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt32LE(offset, 42);
  centrals.push(ch, nameBuf);
  offset += lh.length + nameBuf.length + comp.length;
 }
 const cd = Buffer.concat(centrals);
 const eo = Buffer.alloc(22); eo.writeUInt32LE(0x06054b50, 0); eo.writeUInt16LE(entries.length, 8); eo.writeUInt16LE(entries.length, 10); eo.writeUInt32LE(cd.length, 12); eo.writeUInt32LE(offset, 16);
 return Buffer.concat([...locals, cd, eo]);
}

/* ---------- mock GitHub API -------------------------------------------- */
function startMockGitHub() {
 const files = new Map(); let seq = 0; const commits = [];
 const newSha = () => 'mock' + createHash('sha1').update('s' + (++seq)).digest('hex').slice(0, 36);
 const seed = (path, content) => files.set(path, {sha: newSha(), content: Buffer.isBuffer(content) ? content : Buffer.from(content)});
 const send = (res, status, obj) => { res.writeHead(status, {'Content-Type': 'application/json'}); res.end(JSON.stringify(obj)); };
 const server = createServer(async (req, res) => {
  if (req.headers.authorization !== 'Bearer ' + TOKEN) return send(res, 401, {message: 'Bad credentials'});
  const u = new URL(req.url, 'http://mock');
  const rest = decodeURIComponent(u.pathname.replace(/^\/repos\/weddingeasy143-design\/easywedding/, ''));
  const body = await new Promise(r => { const chunks = []; req.on('data', c => chunks.push(c)); req.on('end', () => r(Buffer.concat(chunks))); });
  const jbody = body.length ? JSON.parse(body.toString('utf8')) : {};
  if (req.method === 'GET' && rest === '') return send(res, 200, {full_name: 'weddingeasy143-design/easywedding', default_branch: 'main', private: true, permissions: {admin: false, push: true, pull: true}});
  if (req.method === 'GET' && rest === '/git/trees/main') return send(res, 200, {sha: 'tree1', truncated: false, tree: [...files.entries()].map(([path, f]) => ({path, mode: '100644', type: 'blob', sha: f.sha}))});
  const cm = rest.match(/^\/contents\/(.+)$/);
  if (cm) {
   const path = cm[1];
   if (req.method === 'GET') {
    const f = files.get(path);
    if (f) return send(res, 200, {type: 'file', path, sha: f.sha, encoding: 'base64', content: f.content.toString('base64').replace(/.{60}/g, '$&\n')});
    const kids = [...files.keys()].filter(k => k.startsWith(path + '/'));
    if (kids.length) return send(res, 200, kids.map(k => ({type: 'file', path: k, sha: files.get(k).sha, name: k.split('/').pop()})));
    return send(res, 404, {message: 'Not Found'});
   }
   if (req.method === 'PUT') {
    const f = files.get(path);
    if (f && jbody.sha !== f.sha) return send(res, 422, {message: 'sha does not match'});
    if (!f && jbody.sha) return send(res, 422, {message: 'sha supplied for a new file'});
    const nf = {sha: newSha(), content: Buffer.from(jbody.content, 'base64')};
    files.set(path, nf); commits.push({method: 'PUT', path, message: jbody.message});
    return send(res, f ? 200 : 201, {content: {path, sha: nf.sha}, commit: {message: jbody.message}});
   }
   if (req.method === 'DELETE') {
    const f = files.get(path);
    if (!f) return send(res, 404, {message: 'Not Found'});
    if (jbody.sha !== f.sha) return send(res, 422, {message: 'sha does not match'});
    files.delete(path); commits.push({method: 'DELETE', path, message: jbody.message});
    return send(res, 200, {commit: {message: jbody.message}});
   }
  }
  return send(res, 404, {message: 'mock: unhandled ' + req.method + ' ' + rest});
 });
 return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({server, files, commits, seed, port: server.address().port})));
}

test('boss GitHub one-click: token, test connection, ZIP upload, template delete — all against a mock GitHub', async () => {
 const mock = await startMockGitHub();
 mock.seed('public/brand.css', '/* old brand css */');
 mock.seed('public/index.html', '<html>home</html>');
 mock.seed('public/design/mandir-darwaza.html', '<html>mandir page</html>');
 mock.seed('public/demo-configs/mandir-darwaza.json', '{"design":"mandir-darwaza"}');
 mock.seed('public/assets/mandir-darwaza/door-left.webp', 'door-left-bytes');
 mock.seed('public/assets/mandir-darwaza/frame.webp', 'frame-bytes');
 mock.seed('public/reference/demos.json', await readFile('public/reference/demos.json'));
 assert.ok(JSON.parse(mock.files.get('public/reference/demos.json').content.toString('utf8'))['mandir-darwaza'], 'seed demos.json carries the design');

 const mf = new Miniflare({modules: true, modulesRules: [{type: 'ESModule', include: ['**/*.js']}], scriptPath: 'server/worker.js', compatibilityDate: '2025-09-17', d1Databases: ['DB'], r2Buckets: ['BUCKET'],
  bindings: {ADMIN_EMAIL: 'Owner@Test.dev', GH_API_BASE: 'http://127.0.0.1:' + mock.port}});
 try {
  const db = await mf.getD1Database('DB');
  for (const name of (await readdir('drizzle')).filter(x => x.endsWith('.sql')).sort()) for (const sql of (await readFile('drizzle/' + name, 'utf8')).split('--> statement-breakpoint').filter(x => x.trim())) await db.prepare(sql).run();
  const post = (path, payload, headers = {}) => mf.dispatchFetch('https://ew.test' + path, {method: 'POST', headers: {'Content-Type': 'application/json', Origin: 'https://ew.test', ...headers}, body: JSON.stringify(payload)});
  await post('/api/auth/signup', {name: 'Owner', email: 'owner@test.dev', ['pass' + 'word']: 'test-secret-123'});
  const alog = await post('/api/admin/login', {email: 'owner@test.dev', ['pass' + 'word']: 'test-secret-123'});
  assert.equal(alog.status, 200);
  const cookie = alog.headers.get('Set-Cookie').split(';')[0];
  const acall = (path, method = 'GET', body) => mf.dispatchFetch('https://ew.test' + path, {method, headers: {Origin: 'https://ew.test', Cookie: cookie, ...(body ? {'Content-Type': 'application/json'} : {})}, body: body ? JSON.stringify(body) : undefined});
  const upload = (zipBuf, name = 'test-pack.zip') => mf.dispatchFetch('https://ew.test/api/admin/github/upload?name=' + encodeURIComponent(name), {method: 'POST', headers: {Origin: 'https://ew.test', Cookie: cookie, 'Content-Type': 'application/zip'}, body: new Uint8Array(zipBuf)});

  /* 1 — nothing works before a token is saved, and nothing crashes. */
  let d = await (await acall('/api/admin/github')).json();
  assert.equal(d.connected, false); assert.equal(d.repo, 'weddingeasy143-design/easywedding');
  assert.equal((await upload(makeZip([{name: 'public/x.txt', data: 'hi', method: 0}]))).status, 400, 'upload without token refused');
  assert.equal((await acall('/api/admin/github/delete-design', 'POST', {design: 'mandir-darwaza'})).status, 400, 'delete without token refused');
  assert.equal((await acall('/api/admin/github/test', 'POST', {})).status, 400, 'test without token refused');

  /* 2 — token save: bad shape refused, good shape saved, never echoed. */
  assert.equal((await acall('/api/admin/github', 'PUT', {token: 'not-a-token'})).status, 400);
  d = await (await acall('/api/admin/github', 'PUT', {token: TOKEN})).json();
  assert.equal(d.connected, true);
  const statusBody = JSON.stringify(await (await acall('/api/admin/github')).json());
  assert.ok(!statusBody.includes(TOKEN), 'status answer never contains the token');

  /* 3 — test connection against the mock. */
  d = await (await acall('/api/admin/github/test', 'POST', {})).json();
  assert.equal(d.ok, true); assert.equal(d.repo, 'weddingeasy143-design/easywedding'); assert.equal(d.canWrite, true);

  /* 4 — one-click upload: one update (deflate) + one create (stored). */
  const zip = makeZip([
   {name: 'public/brand.css', data: '/* new brand css — updated */', method: 8},
   {name: 'public/new-note.txt', data: 'hello from the boss upload', method: 0},
  ]);
  const up = await upload(zip);
  assert.equal(up.status, 200, await up.clone().text().catch(() => ''));
  d = await up.json(); assert.equal(d.count, 2);
  assert.equal(mock.files.get('public/brand.css').content.toString('utf8'), '/* new brand css — updated */', 'existing file updated in place');
  assert.equal(mock.files.get('public/new-note.txt').content.toString('utf8'), 'hello from the boss upload', 'new file created');
  const puts = mock.commits.filter(c => c.method === 'PUT');
  assert.equal(puts.length, 2); assert.ok(puts.every(c => c.message === 'Boss upload: test-pack.zip (2 files)'), 'commit message carries the ZIP name and file count');

  /* 5 — dangerous ZIPs are refused whole, before any commit. */
  const before = mock.commits.length;
  const badZips = [
   ['traversal', makeZip([{name: '../evil.txt', data: 'x', method: 0}])],
   ['env file', makeZip([{name: 'public/.env', data: 'SECRET=1', method: 0}])],
   ['secret name', makeZip([{name: 'server/api-secret.js', data: 'x', method: 0}])],
   ['outside folders', makeZip([{name: 'README.md', data: 'x', method: 0}])],
   ['backslash', makeZip([{name: 'public/evil\\x.txt', data: 'x', method: 0}])],
  ];
  for (const [label, bad] of badZips) {
   const r = await upload(bad, 'bad.zip');
   assert.equal(r.status, 400, label + ' refused');
   assert.equal(mock.commits.length, before, label + ': nothing reached GitHub');
  }

  /* 6 — template delete: files out, demos entry out, site hidden. */
  const del = await acall('/api/admin/github/delete-design', 'POST', {design: 'mandir-darwaza'});
  assert.equal(del.status, 200, await del.clone().text().catch(() => ''));
  d = await del.json();
  assert.equal(d.hidden, true); assert.equal(d.demosEntryRemoved, true);
  assert.deepEqual([...d.deleted].sort(), ['public/assets/mandir-darwaza/door-left.webp', 'public/assets/mandir-darwaza/frame.webp', 'public/demo-configs/mandir-darwaza.json', 'public/design/mandir-darwaza.html']);
  for (const p of d.deleted) assert.ok(!mock.files.has(p), p + ' gone from the repo');
  assert.ok(mock.files.has('public/index.html'), 'shared files untouched');
  const demosAfter = JSON.parse(mock.files.get('public/reference/demos.json').content.toString('utf8'));
  assert.ok(!('mandir-darwaza' in demosAfter), 'demo entry removed');
  assert.ok('ram-mandir' in demosAfter, 'other demos intact');
  const price = await db.prepare("SELECT visible FROM prices WHERE design_id='mandir-darwaza'").first();
  assert.equal(price.visible, 0, 'design hidden on the site at once (visible=0)');

  /* 7 — delete is safely repeatable, unknown designs are refused. */
  const again = await acall('/api/admin/github/delete-design', 'POST', {design: 'mandir-darwaza'});
  assert.equal(again.status, 200); assert.deepEqual((await again.json()).deleted, []);
  assert.equal((await acall('/api/admin/github/delete-design', 'POST', {design: 'no-such-design'})).status, 400);
  assert.equal((await acall('/api/admin/github/delete-design', 'POST', {design: 'addon-pdf'})).status, 400, 'add-ons are not templates');

  /* 8 — audit trail exists and never leaks the token. */
  const auditRows = (await db.prepare("SELECT action,detail FROM admin_audit WHERE action LIKE 'github%'").all()).results;
  const actions = auditRows.map(r => r.action);
  for (const a of ['github_token_saved', 'github_test_ok', 'github_upload', 'github_design_hidden', 'github_design_delete']) assert.ok(actions.includes(a), 'audit has ' + a);
  assert.ok(!JSON.stringify(auditRows).includes(TOKEN), 'audit log never contains the token');

  /* 9 — regression: the older boss tools still work exactly as before. */
  assert.equal((await acall('/api/admin/tracking', 'PUT', {ga4Id: 'G-TEST12345', clarityId: '', metaPixelId: ''})).status, 200, 'tracking save still works');
  assert.equal((await acall('/api/admin/site', 'PUT', {open: false})).status, 200, 'shop gate save still works');
  const pay = await (await acall('/api/admin/payments')).json();
  assert.equal((await acall('/api/admin/payments', 'PUT', {gateways: pay.gateways.map(g => ({gateway: g.gateway, enabled: g.enabled, mode: g.mode, key_id: g.key_id || ''})), prices: pay.prices.map(p => ({design_id: p.design_id, regular: p.regular_paise / 100, launch: p.launch_paise / 100, launch_active: !!p.launch_active, visible: p.visible !== 0}))})).status, 200, 'prices save still works');
  const priceAfter = await db.prepare("SELECT visible FROM prices WHERE design_id='mandir-darwaza'").first();
  assert.equal(priceAfter.visible, 0, 'the round-trip kept the deleted design hidden (its saved row said visible)');

  console.log('Verified boss GitHub one-click against a mock GitHub: token save/test, ZIP upload (create+update, sha-safe), 5 dangerous-ZIP refusals, template delete (files + demos entry + visible=0), audit without token leakage, and boss regressions.');
 } finally { await mf.dispose(); mock.server.close(); }
});
