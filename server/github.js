/* GitHub publishing for the /boss console (owner's one-click rule, 2026-11):
   the owner uploads a ZIP in /boss and the Worker commits its files to the
   site's GitHub repo; GitHub then auto-deploys, exactly like the owner's
   manual web-UI uploads. A template can likewise be deleted from GitHub
   from /boss. The token lives in site_settings (same pattern as the
   payment gateway keys) and is NEVER returned by any API, written to the
   audit log, or included in an error message.
   This module is transport + ZIP only; all authorisation and safety
   policy lives in worker.js next to the other admin endpoints. */

export const GH_OWNER = 'weddingeasy143-design';
export const GH_REPO = 'easywedding';
export const GH_BRANCH = 'main';
export const GH_LABEL = GH_OWNER + '/' + GH_REPO;

export class GhError extends Error {
 constructor(status, message) { super(message); this.status = status; this.gh = true; }
}

/* ---------- base64 (chunked, so multi-MB files never blow the stack) ---- */
export function bytesToB64(bytes) {
 let s = ''; const CH = 0x8000;
 for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode(...bytes.subarray(i, i + CH));
 return btoa(s);
}
export function b64ToBytes(b64) {
 const clean = String(b64 || '').replace(/\s+/g, '');
 const bin = atob(clean);
 const out = new Uint8Array(bin.length);
 for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
 return out;
}

/* ---------- minimal ZIP reader (stored + deflate entries) ---------------
   Reads the central directory only, so data-descriptor entries and
   prepended junk are harmless. ZIP64, multi-disk and encrypted entries
   are rejected — boss packages are ordinary small ZIPs. */
async function inflateRaw(bytes) {
 const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
 return new Uint8Array(await new Response(stream).arrayBuffer());
}
export async function unzipZip(input) {
 const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
 const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
 const td = new TextDecoder();
 /* End Of Central Directory: scan the tail (comment can be up to 64 KB). */
 let eocd = -1;
 const tailStart = Math.max(0, bytes.length - 65558);
 for (let i = bytes.length - 22; i >= tailStart; i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
 if (eocd < 0) throw new Error('This file is not a ZIP archive (no end-of-directory record).');
 if (dv.getUint16(eocd + 4, true) !== 0 || dv.getUint16(eocd + 6, true) !== 0) throw new Error('Multi-disk ZIP archives are not supported.');
 const count = dv.getUint16(eocd + 10, true);
 const cdSize = dv.getUint32(eocd + 12, true), cdOff = dv.getUint32(eocd + 16, true);
 if (count === 0xffff || cdSize === 0xffffffff || cdOff === 0xffffffff) throw new Error('ZIP64 archives are not supported — re-zip the files normally.');
 const out = [];
 let p = cdOff;
 for (let n = 0; n < count; n++) {
  if (p + 46 > bytes.length || dv.getUint32(p, true) !== 0x02014b50) throw new Error('The ZIP archive is damaged (bad central directory).');
  const flags = dv.getUint16(p + 8, true), method = dv.getUint16(p + 10, true);
  const compSize = dv.getUint32(p + 20, true), rawSize = dv.getUint32(p + 24, true);
  const nameLen = dv.getUint16(p + 28, true), extraLen = dv.getUint16(p + 30, true), commentLen = dv.getUint16(p + 32, true);
  const localOff = dv.getUint32(p + 42, true);
  if (compSize === 0xffffffff || rawSize === 0xffffffff || localOff === 0xffffffff) throw new Error('ZIP64 archives are not supported — re-zip the files normally.');
  const name = td.decode(bytes.subarray(p + 46, p + 46 + nameLen));
  p += 46 + nameLen + extraLen + commentLen;
  if (flags & 1) throw new Error('Encrypted ZIP entries are not supported ("' + name + '").');
  if (name.endsWith('/')) { out.push({ path: name, dir: true, data: new Uint8Array(0) }); continue; }
  if (localOff + 30 > bytes.length || dv.getUint32(localOff, true) !== 0x04034b50) throw new Error('The ZIP archive is damaged (bad local header for "' + name + '").');
  const lNameLen = dv.getUint16(localOff + 26, true), lExtraLen = dv.getUint16(localOff + 28, true);
  const dataStart = localOff + 30 + lNameLen + lExtraLen;
  const comp = bytes.subarray(dataStart, dataStart + compSize);
  if (comp.length !== compSize) throw new Error('The ZIP archive is damaged (truncated entry "' + name + '").');
  let data;
  if (method === 0) data = new Uint8Array(comp);
  else if (method === 8) { try { data = await inflateRaw(comp); } catch { throw new Error('Could not unpack "' + name + '" — the ZIP entry is damaged.'); } }
  else throw new Error('Unsupported ZIP compression (method ' + method + ') for "' + name + '".');
  if (data.length !== rawSize) throw new Error('The ZIP archive is damaged ("' + name + '" unpacked to the wrong size).');
  out.push({ path: name, dir: false, data });
 }
 return out;
}

/* ---------- GitHub REST client (Contents + Git trees) ------------------- */
function ghHeaders(token) {
 return { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'EasyWedding-Boss', 'Content-Type': 'application/json' };
}
async function gh(cfg, method, path, payload) {
 let res;
 try {
  res = await fetch(cfg.base + '/repos/' + GH_OWNER + '/' + GH_REPO + path, { method, headers: ghHeaders(cfg.token), body: payload ? JSON.stringify(payload) : undefined });
 } catch { throw new GhError(0, 'Could not reach GitHub (network error). Please try again in a little while.'); }
 const data = await res.json().catch(() => null);
 if (!res.ok) {
  const hint = res.status === 401 ? ' The token looks wrong or has expired — create a fresh token and save it again.'
   : res.status === 404 ? ' The repo or file was not found — the token must have access to this repo (' + GH_LABEL + ').'
   : res.status === 403 || res.status === 429 ? ' GitHub refused just now (permission or rate limit). Check that the token has Contents: Read and write.'
   : '';
  throw new GhError(res.status, 'GitHub error (' + res.status + ')' + (data && data.message ? ': ' + String(data.message).slice(0, 160) : '') + '.' + hint);
 }
 return data;
}
const encPath = p => p.split('/').map(encodeURIComponent).join('/');

export async function ghGetRepo(cfg) { return gh(cfg, 'GET', ''); }

/* One file's current state, or null when it is not in the repo. */
export async function ghGetFile(cfg, path) {
 let res;
 try { res = await fetch(cfg.base + '/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/' + encPath(path) + '?ref=' + GH_BRANCH, { headers: ghHeaders(cfg.token) }); }
 catch { throw new GhError(0, 'Could not reach GitHub (network error).'); }
 if (res.status === 404) return null;
 const data = await res.json().catch(() => null);
 if (!res.ok) throw new GhError(res.status, 'GitHub error (' + res.status + ') while reading "' + path + '".');
 if (!data || Array.isArray(data) || data.type !== 'file') return null;
 return { sha: data.sha, bytes: data.content ? b64ToBytes(data.content) : new Uint8Array(0) };
}
export async function ghPutFile(cfg, path, bytes, message, sha) {
 const payload = { message, content: bytesToB64(bytes), branch: GH_BRANCH };
 if (sha) payload.sha = sha;
 return gh(cfg, 'PUT', '/contents/' + encPath(path), payload);
}
export async function ghDeleteFile(cfg, path, sha, message) {
 return gh(cfg, 'DELETE', '/contents/' + encPath(path), { message, sha, branch: GH_BRANCH });
}
/* Every file (blob) in the repo on the publish branch. Falls back to a
   Contents-API walk when the recursive tree answer is truncated. */
export async function ghListFiles(cfg) {
 const data = await gh(cfg, 'GET', '/git/trees/' + GH_BRANCH + '?recursive=1');
 if (data && Array.isArray(data.tree) && !data.truncated) return data.tree.filter(x => x.type === 'blob').map(x => ({ path: x.path, sha: x.sha }));
 const out = [];
 const walk = async (dir, depth) => {
  if (depth > 6) return;
  const res = await fetch(cfg.base + '/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/' + encPath(dir) + '?ref=' + GH_BRANCH, { headers: ghHeaders(cfg.token) });
  if (!res.ok) return;
  const items = await res.json().catch(() => null);
  if (!Array.isArray(items)) return;
  for (const it of items) { if (it.type === 'file') out.push({ path: it.path, sha: it.sha }); else if (it.type === 'dir') await walk(it.path, depth + 1); }
 };
 await walk('', 0);
 return out;
}
