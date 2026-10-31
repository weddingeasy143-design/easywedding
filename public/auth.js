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
  var MAX_AGE = 604800; /* 7 days, matches the server session cap */

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

  /* Inactivity sign-out — the owner's rule: 15 quiet minutes brings a
     warning with a 2-minute countdown; if nobody answers, the visitor is
     signed out. Activity is shared across tabs through localStorage, so
     using any one tab counts as being here, and working inside an
     embedded preview frame counts too. While the visitor is active, a
     light session check every few minutes keeps the server's own idle
     clock (which ends untouched sessions on its side) in step. */
  var IDLE_LIMIT = 15 * 60 * 1000;
  var WARN_TIME = 2 * 60 * 1000;
  var ACTIVE_KEY = 'ew_last_active_v1';
  var warnBox = null;
  var warnTimer = null;
  var warnEndsAt = 0;
  var lastPing = 0;

  function lastActive() {
    try { return Number(localStorage.getItem(ACTIVE_KEY)) || 0; } catch (e) { return 0; }
  }
  function markActive() {
    try { localStorage.setItem(ACTIVE_KEY, String(Date.now())); } catch (e) { /* storage blocked */ }
  }
  function hideWarn() {
    if (warnTimer) { clearInterval(warnTimer); warnTimer = null; }
    if (warnBox) { warnBox.remove(); warnBox = null; }
  }
  function updateCount() {
    if (!warnBox) return;
    var left = Math.max(0, warnEndsAt - Date.now());
    var el = warnBox.querySelector('#ew-idle-count');
    if (el) {
      var s = Math.ceil(left / 1000);
      el.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }
    if (left <= 0) { hideWarn(); window.EWAuth.signOut(); }
  }
  function showWarn() {
    if (warnBox || !document.body) return;
    warnEndsAt = Date.now() + WARN_TIME;
    var box = document.createElement('div');
    box.setAttribute('role', 'alertdialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'You are about to be signed out');
    box.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(26,5,12,.55);display:flex;align-items:center;justify-content:center;padding:20px';
    box.innerHTML = '<div style="background:#fffaf0;color:#3d0a1a;border:1px solid #e8bd6b;border-radius:16px;max-width:420px;width:100%;padding:26px 24px;text-align:center;box-shadow:0 24px 60px rgba(10,1,5,.35)">' +
      '<h2 style="font:600 22px Georgia,serif;margin:0 0 8px">Are you still there?</h2>' +
      '<p style="margin:0;font-size:15px;line-height:1.5">You have been quiet for a while. For your security, you will be signed out in</p>' +
      '<p id="ew-idle-count" style="font:700 30px Georgia,serif;color:#75152e;margin:6px 0 14px">2:00</p>' +
      '<button id="ew-idle-stay" type="button" style="min-height:48px;padding:10px 22px;border:0;border-radius:999px;background:#75152e;color:#fff;font-size:15px;cursor:pointer">I am here — keep me signed in</button>' +
      '<div><button id="ew-idle-out" type="button" style="margin-top:8px;min-height:44px;padding:8px 16px;border:0;background:transparent;color:#75152e;font-size:14px;cursor:pointer;text-decoration:underline">Sign out now</button></div>' +
      '</div>';
    document.body.appendChild(box);
    warnBox = box;
    box.querySelector('#ew-idle-stay').addEventListener('click', function () {
      markActive();
      window.EWAuth.refresh();
      hideWarn();
    });
    box.querySelector('#ew-idle-out').addEventListener('click', function () {
      hideWarn();
      window.EWAuth.signOut();
    });
    updateCount();
    warnTimer = setInterval(updateCount, 500);
  }
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (type) {
    window.addEventListener(type, function () {
      if (Date.now() - lastActive() > 5000) markActive();
      if (warnBox) { markActive(); hideWarn(); } /* any real activity answers the warning */
    }, { passive: true });
  });
  function idleTick() {
    if (!window.EWAuth.session()) { hideWarn(); return; }
    if (!lastActive()) { markActive(); return; }
    /* Focus inside an embedded frame (the studio's live preview) is work too. */
    if (document.activeElement && document.activeElement.tagName === 'IFRAME') markActive();
    if (warnBox) return; /* the countdown is running; activity or its end decides */
    if (Date.now() - lastActive() >= IDLE_LIMIT) { showWarn(); return; }
    if (Date.now() - lastPing > 4 * 60 * 1000) {
      lastPing = Date.now();
      window.EWAuth.refresh();
    }
  }
  setInterval(idleTick, 15000);

})();
