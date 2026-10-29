/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Never let the invitation wait on something optional (a song, a photo store, the network):
   resolves with the promise's value, or with `fallback` when it fails or takes longer than `ms`. */
export function withTimeout(promise,ms,fallback){let timer;return Promise.race([Promise.resolve(promise).catch(()=>fallback),new Promise(resolve=>{timer=setTimeout(()=>resolve(fallback),ms);})]).finally(()=>clearTimeout(timer));}
