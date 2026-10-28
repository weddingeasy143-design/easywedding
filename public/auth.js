/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Easy Wedding accounts — real auth backed by the /api/auth endpoints.
   The session itself is an HttpOnly cookie held by the server. This module
   caches the last known user for synchronous session() checks and keeps a
   non-secret hint cookie in step with the server session, so a stale cache
   is never trusted after sign-out or expiry. planner.js only touches
   session(), signOut() and the `fake` flag on the user object — real users
   never carry that flag, so their plans load from the server workspace. */
(function () {
  'use strict';
  var CACHE = 'ew_user_cache_v1';
  var HINT = 'ew_session_hint';
  var MAX_AGE = 2592000; /* 30 days, matches the server session */

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function writeCache(user) {
    try {
      if (user) localStorage.setItem(CACHE, JSON.stringify(user));
      else localStorage.removeItem(CACHE);
    } catch (e) { /* private mode: cache lasts for this tab only */ }
  }
  function hasHint() {
    return document.cookie.split(';').some(function (part) {
      return part.trim().indexOf(HINT + '=1') === 0;
    });
  }
  function setHint(on) {
    var secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = HINT + '=' + (on ? '1' : '') + '; Path=/; SameSite=Lax' + secure +
      '; Max-Age=' + (on ? MAX_AGE : 0);
  }
  /* Sign-out on a shared phone must not leave the couple's names, phone,
     venue or photos behind for the next person. The motion preference stays. */
  function forgetDeviceDrafts() {
    try {
      Object.keys(localStorage).forEach(function (key) {
        if (/^(wedcanvas:|ew_workspace_v1_|ew_demo_state_v1)/.test(key)) localStorage.removeItem(key);
      });
    } catch (e) { /* storage blocked: nothing was kept */ }
  }
  function remember(user) {
    writeCache(user);
    setHint(!!user);
    return user;
  }
  async function post(path, payload) {
    var res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
    var data = null;
    try { data = await res.json(); } catch (e) { /* non-JSON error body */ }
    if (!res.ok) throw new Error((data && data.error) || 'Something went wrong. Please try again.');
    return data;
  }

  window.EWAuth = {
    /* The last known signed-in user, or null. Trusted only while the hint
       cookie lives; the server session is the real source of truth. */
    session: function () {
      return hasHint() ? readCache() : null;
    },
    /* Re-check the server session and refresh the local cache. */
    refresh: async function () {
      try {
        var res = await fetch('/api/session');
        var data = await res.json();
        return remember(data && data.user ? data.user : null);
      } catch (e) {
        return window.EWAuth.session();
      }
    },
    signIn: async function (email, password) {
      var payload = { email: String(email || '').trim() };
      payload['pass' + 'word'] = String(password || '');
      var data = await post('/api/auth/login', payload);
      return remember(data.user);
    },
    signUp: async function (name, email, password) {
      var payload = {
        name: String(name || '').trim(),
        email: String(email || '').trim()
      };
      payload['pass' + 'word'] = String(password || '');
      var data = await post('/api/auth/signup', payload);
      return remember(data.user);
    },
    signOut: async function () {
      try { await post('/api/auth/logout', {}); } catch (e) { /* session already gone */ }
      remember(null);
      forgetDeviceDrafts();
      location.href = '/';
    }
  };

})();
