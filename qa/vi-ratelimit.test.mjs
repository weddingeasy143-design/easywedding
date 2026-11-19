import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare} from 'miniflare';
import {readFile, readdir} from 'node:fs/promises';

/* /api/vi long-window rate limit (2026-11 follow-up to the live attack
   check): the beacon already had a per-minute burst limit (150/60), but
   nothing stopped a bot from flooding the visitor ledger at a slow,
   steady pace (~150/min forever). A second bucket now caps each IP at
   300 beacons per 10 minutes. A real visit sends a handful of beacons,
   so people never reach either limit. */

const UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36';

async function boot() {
 const mf = new Miniflare({modules: true, modulesRules: [{type: 'ESModule', include: ['**/*.js']}], scriptPath: 'server/worker.js', compatibilityDate: '2025-09-17', d1Databases: ['DB'], r2Buckets: ['BUCKET'],
  bindings: {ADMIN_EMAIL: 'Owner@Test.dev'}});
 const db = await mf.getD1Database('DB');
 for (const name of (await readdir('drizzle')).filter(x => x.endsWith('.sql')).sort()) for (const sql of (await readFile('drizzle/' + name, 'utf8')).split('--> statement-breakpoint').filter(x => x.trim())) await db.prepare(sql).run();
 const beacon = (payload = {t: 'pageview', p: '/', sess: 'sess0001'}) => mf.dispatchFetch('https://ew.test/api/vi', {method: 'POST', headers: {'Content-Type': 'application/json', Origin: 'https://ew.test', 'User-Agent': UA}, body: JSON.stringify(payload)});
 return {mf, db, beacon};
}

test('vi ratelimit: normal beacons all succeed and write visitor records', async () => {
 const {mf, db, beacon} = await boot();
 try {
  for (let i = 0; i < 20; i++) {
   const res = await beacon();
   assert.equal(res.status, 200, 'beacon ' + (i + 1) + ' succeeds');
   const data = await res.json();
   assert.ok(typeof data.vid === 'string' && data.vid.length >= 8, 'beacon ' + (i + 1) + ' returns a visitor id');
  }
  const visitors = await db.prepare('SELECT COUNT(*) AS n FROM vi_visitors').first();
  assert.ok(visitors.n >= 1, 'visitor records were written (' + visitors.n + ')');
  const events = await db.prepare('SELECT COUNT(*) AS n FROM vi_events').first();
  assert.ok(events.n >= 1, 'visitor events were written (' + events.n + ')');
 } finally { await mf.dispose(); }
});

test('vi ratelimit: the 301st beacon inside 10 minutes is refused with the standard 429', async () => {
 const {mf, db, beacon} = await boot();
 try {
  /* One normal beacon first: proves the door is open before the cap. */
  const first = await beacon();
  assert.equal(first.status, 200, 'first beacon succeeds');
  await first.json();
  const eventsBefore = (await db.prepare('SELECT COUNT(*) AS n FROM vi_events').first()).n;

  /* Stand this IP exactly at the 300-per-600s cap for the current
     window, the way 300 earlier beacons would have left it. (Miniflare
     presents every dispatched request as CF-Connecting-IP 127.0.0.1.) */
  const win = Math.floor(Date.now() / 1000 / 600);
  await db.prepare('INSERT INTO rate_limits(bucket,count,expires_at) VALUES(?,?,?) ON CONFLICT(bucket) DO UPDATE SET count=300')
   .bind('vi10:127.0.0.1:' + win, 300, (win + 1) * 600).run();

  const blocked = await beacon();
  assert.equal(blocked.status, 429, 'beacon past the 10-minute cap is refused');
  const body = await blocked.json();
  assert.ok(String(body.error || '').includes('Too many attempts'), 'refusal uses the standard rate-limit wording');

  /* The refused beacon wrote nothing: no new event was stored. */
  const eventsAfter = (await db.prepare('SELECT COUNT(*) AS n FROM vi_events').first()).n;
  assert.equal(eventsAfter, eventsBefore, 'refused beacon stored no event');
 } finally { await mf.dispose(); }
});

test('vi ratelimit: other methods on /api/vi behave as before (no beacon handling)', async () => {
 const {mf} = await boot();
 try {
  const res = await mf.dispatchFetch('https://ew.test/api/vi', {method: 'GET', headers: {'User-Agent': UA}});
  assert.notEqual(res.status, 200, 'GET /api/vi is not a beacon (falls through as before)');
  await res.text();
 } finally { await mf.dispose(); }
});
