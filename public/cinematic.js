/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
/* Easy Wedding cinematic motion engine (self-hosted GSAP + ScrollTrigger + Lenis).
   No external requests. Called by planner.js after every render. Safe to load
   when the vendor scripts are missing: init() simply no-ops. */
(function () {
  'use strict';
  var heroPlayed = false;
  var lenis = null;
  var lastView = null;
  var paused = false, lenisTicker = null, desktopMedia = null, splits = [];

  function reduced() {
    return paused || !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function ready() {
    return !!(window.gsap && window.ScrollTrigger);
  }
  function inr(n) {
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }

  function heroIntro(gsap, hero) {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    var bg = hero.querySelector('.cine-hero-bg');
    if (bg) tl.fromTo(bg, { scale: 1.18 }, { scale: 1, duration: 8, ease: 'power1.out' }, 0);
    tl.from(hero.querySelector('.hero-eyebrow'), { y: 26, autoAlpha: 0, duration: 1 }, 0.25);
    var inners = hero.querySelectorAll('.hero-title .hl-inner');
    if (inners.length) tl.from(inners, { yPercent: 115, duration: 1.25, stagger: 0.13 }, 0.4);
    else tl.from(hero.querySelector('.hero-title'), { y: 40, autoAlpha: 0, duration: 1.2 }, 0.4);
    tl.from(hero.querySelector('.hero-sub'), { y: 24, autoAlpha: 0, duration: 0.9 }, 0.95);
    tl.from(hero.querySelectorAll('.hero-cta > *'), { y: 22, autoAlpha: 0, duration: 0.8, stagger: 0.1 }, 1.1);
    tl.from(hero.querySelector('.hero-count'), { y: 20, autoAlpha: 0, duration: 0.9 }, 1.2);
    tl.from(hero.querySelector('.hero-scroll-cue'), { autoAlpha: 0, duration: 0.9 }, 1.45);
  }

  function init(view) {
    if (!ready()) return;
    var gsap = window.gsap;
    try {
      if (window.SplitText) gsap.registerPlugin(window.ScrollTrigger, window.SplitText);
      else gsap.registerPlugin(window.ScrollTrigger);
    } catch (e) { /* plugin registration is best-effort */ }

    // The SPA re-renders #main-content: drop triggers bound to removed nodes.
    window.ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    desktopMedia?.revert();desktopMedia=null;
    splits.forEach(function(split){split.revert();});splits=[];

    var content = document.querySelector('#main-content');
    if (!content) return;

    // Scroll to top on view change.
    if (view !== lastView) {
      lastView = view;
      if (lenis) lenis.scrollTo(0, { immediate: true });
      else if (window.scrollTo) window.scrollTo(0, 0);
    }

    // Reduced motion: leave everything at its natural (visible) final state.
    if (reduced()) {
      if(lenis){lenis.destroy();lenis=null;window.__ewLenis=null;if(lenisTicker)gsap.ticker.remove(lenisTicker);lenisTicker=null;}
      gsap.killTweensOf(content.querySelectorAll('[data-reveal],[data-parallax],.cine-hero-bg,.hero-eyebrow,.hero-title .hl-inner,.hero-sub,.hero-cta > *,.hero-count,.hero-scroll-cue'));
      gsap.set(content.querySelectorAll('[data-reveal],.hero-eyebrow,.hero-title .hl-inner,.hero-sub,.hero-cta > *,.hero-count,.hero-scroll-cue'),
        { clearProps: 'all', opacity: 1, x: 0, y: 0 });
      return;
    }

    // Lenis smooth scroll, wired to GSAP's ticker (created once).
    if (window.Lenis && !lenis) {
      try {
        lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 });
        lenis.on('scroll', window.ScrollTrigger.update);
        lenisTicker=function(time){if(lenis)lenis.raf(time*1000);};
        window.__ewLenis=lenis;
        gsap.ticker.add(lenisTicker);
        gsap.ticker.lagSmoothing(0);
      } catch (e) { lenis = null; }
    }

    // Cinematic hero intro — once per session so re-renders never replay it.
    var hero = content.querySelector('.cine-hero');
    if (hero && !heroPlayed) {
      heroPlayed = true;
      heroIntro(gsap, hero);
    }

    // Scroll-triggered reveals. Initial hidden states are set via JS only,
    // so content stays fully visible when scripts fail or are disabled.
    if(!window.EWRoyalMotion)gsap.utils.toArray(content.querySelectorAll('[data-reveal]')).forEach(function (el) {
      var dir = el.getAttribute('data-reveal') || 'up';
      var from = { up: { y: 46 }, left: { x: -58 }, right: { x: 58 } }[dir] || { y: 46 };
      gsap.from(el, {
        x: from.x || 0, y: from.y || 0, autoAlpha: 0,
        duration: 1.05, ease: 'power3.out',
        delay: parseFloat(el.getAttribute('data-delay') || '0'),
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    // SplitText line reveals for section headings (progressive enhancement).
    if (window.SplitText) {
      gsap.utils.toArray(content.querySelectorAll('[data-split]')).forEach(function (el) {
        try {
          var split = new window.SplitText(el, { type: 'lines', linesClass: 'split-line' });splits.push(split);
          gsap.from(split.lines, {
            yPercent: 110, duration: 1, ease: 'power3.out', stagger: 0.09,
            scrollTrigger: { trigger: el, start: 'top 86%', once: true }
          });
        } catch (e) { /* fall back to the data-reveal on the same element */ }
      });
    }

    // Gentle parallax on desktop only; static on touch/small screens.
    var mm = gsap.matchMedia();desktopMedia=mm;
    mm.add('(min-width: 768px)', function () {
      gsap.utils.toArray(content.querySelectorAll('[data-parallax]')).forEach(function (el) {
        gsap.to(el, {
          yPercent: parseFloat(el.getAttribute('data-parallax') || '-12'),
          ease: 'none',
          scrollTrigger: {
            trigger: el.closest('[data-parallax-scope]') || el,
            start: 'top bottom', end: 'bottom top', scrub: true
          }
        });
      });
      if (hero) {
        var heroBg = hero.querySelector('.cine-hero-bg');
        if (heroBg) gsap.to(heroBg, {
          yPercent: 14, ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
        });
      }
    });

    // Animated counters (data-count="1500000" data-format="inr|int|pct").
    gsap.utils.toArray(content.querySelectorAll('[data-count]')).forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count') || '0');
      var format = el.getAttribute('data-format') || 'int';
      var obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.6, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: function () {
          el.textContent = format === 'inr' ? inr(obj.v)
            : format === 'pct' ? Math.round(obj.v) + '%'
            : Math.round(obj.v).toLocaleString('en-IN');
        }
      });
    });

    window.EWRoyalMotion?.refresh();
    window.ScrollTrigger.refresh();
  }

  window.EWCinematic = { init: init, setPaused:function(value){if(paused===value)return;paused=value;if(lastView!==null)init(lastView);} };
  window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',function(){if(lastView!==null)init(lastView);});
})();
