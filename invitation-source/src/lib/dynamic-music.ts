// src/lib/dynamic-music.ts
// Dynamic section-wise wedding music engine.
//
// - Starts only after a user gesture (browser autoplay policy).
// - "opening" zone plays during the pre-scroll opening sequence.
// - After the doors open, an IntersectionObserver tracks the visible section;
//   each section maps to a music zone (see src/lib/music-zones.ts).
// - Zone changes use a seamless crossfade: the old track fades out while the
//   new track fades in simultaneously (configurable 0.5–10s, default 2.5s).
// - The next zone's audio is preloaded before the transition — no gaps.
// - Same audio URL in consecutive zones keeps playing (never restarts).
// - A zone with no audio (or disabled) keeps the current track playing.
// - Fast scrolling is debounced: the candidate zone must be stable ~700ms.
// - Video playback ducks music to 12% and restores it afterwards.
// - One global Music ON/OFF control; Replay Invitation resets all state.

import {
  BUILTIN_FALLBACKS,
  DEFAULT_ZONE_CONFIG,
  MUSIC_ZONES,
  type SectionMusicConfig,
} from "./music-zones";

const MUSIC_KEY = "chandan-pinki-music";
const STABILITY_MS = 700;
const DUCK_LEVEL = 0.12;

// In-memory copy: an Android WebView without DOM storage (sessionStorage is null) or a
// private window must still remember "music on", or the first tap would never start it.
const memorySession = new Map<string, string>();
function safeSessionSet(key: string, value: string) {
  memorySession.set(key, value);
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* private mode, WebView without DOM storage etc. */
  }
}
function safeSessionGet(key: string): string | null {
  try {
    const v = sessionStorage.getItem(key);
    if (v !== null) return v;
  } catch {
    /* fall through to the in-memory copy */
  }
  return memorySession.has(key) ? memorySession.get(key)! : null;
}

interface ResolvedZone {
  url: string;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  loop: boolean;
  trimStart: number;
  trimEnd: number;
}

interface UniversalCfg {
  url: string;
  enabled: boolean;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  trimStart: number;
  trimEnd: number;
}

const DEFAULT_UNIVERSAL: UniversalCfg = {
  url: "",
  enabled: false,
  volume: 0.7,
  fadeIn: 2.5,
  fadeOut: 2.5,
  trimStart: 0,
  trimEnd: 0,
};

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function readUniversal(): UniversalCfg {
  if (typeof document === "undefined") return { ...DEFAULT_UNIVERSAL };
  try {
    const el = document.getElementById("__SITE_CONFIG__");
    const parsed = el?.textContent ? JSON.parse(el.textContent) : null;
    const m = parsed?.music;
    if (m && typeof m === "object") {
      const url = typeof m.universalUrl === "string" ? m.universalUrl.trim() : "";
      return {
        url,
        enabled: m.universalEnabled === true && url.length > 0,
        volume: num(m.universalVolume, 0.7),
        fadeIn: num(m.universalFadeIn, 2.5),
        fadeOut: num(m.universalFadeOut, 2.5),
        trimStart: num(m.universalTrimStart, 0),
        trimEnd: num(m.universalTrimEnd, 0),
      };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_UNIVERSAL };
}

function readZoneConfigs(): Record<string, SectionMusicConfig> {
  const out: Record<string, SectionMusicConfig> = {};
  if (typeof document === "undefined") return out;
  try {
    const el = document.getElementById("__SITE_CONFIG__");
    const parsed = el?.textContent ? JSON.parse(el.textContent) : null;
    const sm = parsed?.sectionMusic;
    const music = parsed?.music;
    if (sm && typeof sm === "object") {
      for (const z of MUSIC_ZONES) {
        const v = (sm as Record<string, unknown>)[z.id];
        if (v && typeof v === "object")
          out[z.id] = { ...DEFAULT_ZONE_CONFIG, ...(v as object) };
      }
    }
    // Back-compat: old 2-URL admin (aartiUrl/weddingUrl) feeds zones that
    // have no explicit upload yet.
    if (music && typeof music === "object") {
      const m = music as Record<string, unknown>;
      const aarti =
        typeof m.aartiUrl === "string" && m.aartiUrl.trim() ? m.aartiUrl.trim() : "";
      const wedding =
        typeof m.weddingUrl === "string" && m.weddingUrl.trim()
          ? m.weddingUrl.trim()
          : "";
      if (aarti && !out.opening?.audioUrl)
        out.opening = { ...DEFAULT_ZONE_CONFIG, ...out.opening, audioUrl: aarti };
      if (wedding) {
        for (const z of MUSIC_ZONES) {
          if (z.id !== "opening" && !out[z.id]?.audioUrl)
            out[z.id] = {
              ...DEFAULT_ZONE_CONFIG,
              ...out[z.id],
              audioUrl: wedding,
            };
        }
      }
    }
  } catch {
    /* use empty */
  }
  return out;
}

function resolveZone(zoneId: string, cfgs: Record<string, SectionMusicConfig>): ResolvedZone | null {
  const cfg = cfgs[zoneId];
  if (cfg && cfg.enabled && cfg.audioUrl.trim()) {
    return {
      url: cfg.audioUrl.trim(),
      volume: cfg.volume,
      fadeIn: cfg.fadeIn,
      fadeOut: cfg.fadeOut,
      loop: cfg.loop,
      trimStart: cfg.trimStart ?? 0,
      trimEnd: cfg.trimEnd ?? 0,
    };
  }
  // Fallback to built-in royalty-free tracks so the site never goes silent.
  const fallback = BUILTIN_FALLBACKS[zoneId];
  if (fallback) {
    return {
      url: fallback,
      volume: cfg?.volume ?? 0.7,
      fadeIn: cfg?.fadeIn ?? 2.5,
      fadeOut: cfg?.fadeOut ?? 2.5,
      loop: true,
      trimStart: 0,
      trimEnd: 0,
    };
  }
  return null;
}

// ── A/B deck player ──────────────────────────────────────────────

class DeckPlayer {
  private decks: HTMLAudioElement[] = [];
  private activeIdx = 0;
  private fadeTimers = new Map<HTMLAudioElement, number>();
  private currentUrl: string | null = null;
  private currentVolume = 0.7;
  private ducked = false;
  private preloaded = new Set<string>();
  private trimStart = 0;
  private trimEnd = 0; // 0 = play till the end
  private trimLoop = true;

  private makeDeck(): HTMLAudioElement {
    const el = new Audio();
    el.preload = "auto";
    el.volume = 0;
    el.addEventListener("error", () => {
      // Poisoned element — drop it so the next attempt rebuilds fresh.
      const i = this.decks.indexOf(el);
      if (i >= 0) this.decks.splice(i, 1);
      if (this.currentUrl && this.decks[this.activeIdx]?.src !== this.currentUrl) {
        this.currentUrl = null;
      }
    });
    // Trim guard: keep playback inside [trimStart, trimEnd].
    el.addEventListener("timeupdate", () => {
      if (this.decks[this.activeIdx] !== el) return;
      const te = this.trimEnd;
      if (te > 0 && el.currentTime >= te) {
        if (this.trimLoop) {
          try {
            el.currentTime = this.trimStart;
          } catch {
            /* noop */
          }
        } else {
          try {
            el.pause();
          } catch {
            /* noop */
          }
        }
      }
    });
    this.decks.push(el);
    return el;
  }

  private deck(): HTMLAudioElement {
    return this.decks[this.activeIdx] ?? this.makeDeck();
  }

  private standby(): HTMLAudioElement {
    const other = this.decks.find((d) => d !== this.deck());
    return other ?? this.makeDeck();
  }

  /** Configure trim for the incoming zone. Manual looping when trimmed. */
  private applyTrim(zone: ResolvedZone, el: HTMLAudioElement) {
    this.trimStart = Math.max(0, zone.trimStart);
    this.trimEnd = Math.max(0, zone.trimEnd);
    this.trimLoop = zone.loop;
    // With a trim, loop manually inside the slice (native loop would
    // restart the whole file). Without trim, native loop is fine.
    el.loop = this.trimEnd > 0 ? false : zone.loop;
  }

  private seekToTrimStart(zone: ResolvedZone, el: HTMLAudioElement) {
    if (zone.trimStart > 0) {
      try {
        el.currentTime = Math.min(zone.trimStart, Math.max(0, (el.duration || 0) - 0.2));
      } catch {
        /* metadata not ready — plays from 0, trim guard still applies */
      }
    }
  }

  get url(): string | null {
    return this.currentUrl;
  }

  get playing(): boolean {
    return this.decks.some((d) => !d.paused && !d.ended);
  }

  /** Preload without playing. */
  preload(url: string) {
    if (!url || this.preloaded.has(url)) return;
    this.preloaded.add(url);
    const el = this.standby();
    if (el.src !== url) {
      try {
        el.src = url;
        el.load();
      } catch {
        /* noop */
      }
    }
  }

  private fade(
    el: HTMLAudioElement,
    to: number,
    ms: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const prev = this.fadeTimers.get(el);
      if (prev !== undefined) {
        clearInterval(prev);
        this.fadeTimers.delete(el);
      }
      const from = el.volume;
      if (Math.abs(from - to) < 0.01 || ms <= 0) {
        el.volume = to;
        return resolve();
      }
      const steps = Math.max(1, Math.round(ms / 50));
      let i = 0;
      const timer = window.setInterval(() => {
        i++;
        el.volume = Math.min(1, Math.max(0, from + (to - from) * (i / steps)));
        if (i >= steps) {
          clearInterval(timer);
          this.fadeTimers.delete(el);
          el.volume = to;
          resolve();
        }
      }, 50);
      this.fadeTimers.set(el, timer);
    });
  }

  /** Crossfade to a new URL. Same URL = keep playing untouched. */
  async crossfade(zone: ResolvedZone): Promise<void> {
    if (this.currentUrl === zone.url && this.playing) return; // keep playing
    const active = this.deck();
    const next = this.standby();

    // Prepare the incoming deck
    try {
      if (next.src !== zone.url) next.src = zone.url;
    } catch {
      return;
    }
    this.applyTrim(zone, next);
    next.volume = 0;
    this.preloaded.add(zone.url);
    try {
      await next.play();
    } catch {
      return; // autoplay blocked — gesture retry layer handles it
    }
    this.seekToTrimStart(zone, next);

    const outMs = zone.fadeOut * 1000;
    const inMs = zone.fadeIn * 1000;
    const targetVol = this.ducked ? zone.volume * DUCK_LEVEL : zone.volume;

    // Simultaneous crossfade
    await Promise.all([
      this.fade(active, 0, outMs).then(() => {
        try {
          active.pause();
        } catch {
          /* noop */
        }
      }),
      this.fade(next, targetVol, inMs),
    ]);

    this.activeIdx = this.decks.indexOf(next);
    this.currentUrl = zone.url;
    this.currentVolume = zone.volume;
  }

  /** Start a zone from silence (first play). */
  async start(zone: ResolvedZone): Promise<boolean> {
    const el = this.deck();
    try {
      if (el.src !== zone.url) el.src = zone.url;
    } catch {
      return false;
    }
    this.applyTrim(zone, el);
    el.volume = 0;
    this.preloaded.add(zone.url);
    try {
      await el.play();
    } catch {
      return false;
    }
    this.seekToTrimStart(zone, el);
    const targetVol = this.ducked ? zone.volume * DUCK_LEVEL : zone.volume;
    await this.fade(el, targetVol, zone.fadeIn * 1000);
    this.currentUrl = zone.url;
    this.currentVolume = zone.volume;
    return true;
  }

  async duck() {
    if (this.ducked) return;
    this.ducked = true;
    const el = this.deck();
    if (this.playing) await this.fade(el, this.currentVolume * DUCK_LEVEL, 900);
  }

  async unduck() {
    if (!this.ducked) return;
    this.ducked = false;
    const el = this.deck();
    if (this.playing) await this.fade(el, this.currentVolume, 1200);
  }

  pauseAll() {
    for (const [, t] of this.fadeTimers) clearInterval(t);
    this.fadeTimers.clear();
    for (const d of this.decks) {
      try {
        d.pause();
      } catch {
        /* noop */
      }
    }
  }

  /** Resume the active deck if it has a URL and is paused (unmute). */
  resume(): boolean {
    const el = this.decks[this.activeIdx];
    if (!el || !this.currentUrl) return false;
    // Make sure the deck still points at the current URL
    if (el.src !== this.currentUrl) {
      try {
        el.src = this.currentUrl;
      } catch {
        return false;
      }
    }
    // Restore volume (was faded to 0 on pause path via pauseAll? no — just play)
    el.volume = this.currentVolume;
    const pr = el.play();
    if (pr && typeof pr.catch === "function") pr.catch(() => {});
    return true;
  }

  reset() {
    this.pauseAll();
    this.decks = [];
    this.activeIdx = 0;
    this.currentUrl = null;
    this.ducked = false;
    this.preloaded.clear();
    this.trimStart = 0;
    this.trimEnd = 0;
    this.trimLoop = true;
  }
}

// ── Engine singleton ─────────────────────────────────────────────

class DynamicMusicEngine {
  private player = new DeckPlayer();
  private zoneCfgs: Record<string, SectionMusicConfig> = {};
  private observer: IntersectionObserver | null = null;
  private preloadObserver: IntersectionObserver | null = null;
  private candidateZone: string | null = null;
  private activeZone: string | null = null;
  private stabilityTimer: number | null = null;
  private scrollMode = false;
  private gestureHooked = false;
  private videoHooked = false;
  private started = false;
  private universal: UniversalCfg = { ...DEFAULT_UNIVERSAL };
  private listeners = new Set<(on: boolean) => void>();

  private isUniversal(): boolean {
    return this.universal.enabled && this.universal.url.length > 0;
  }

  private notify(on: boolean) {
    this.listeners.forEach((fn) => fn(on));
  }

  subscribe(fn: (on: boolean) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  isOn(): boolean {
    if (typeof window === "undefined") return false;
    return safeSessionGet(MUSIC_KEY) === "on";
  }

  isPlaying(): boolean {
    return this.player.playing;
  }

  private hookGestureRetry() {
    if (this.gestureHooked || typeof window === "undefined") return;
    this.gestureHooked = true;
    // On phones a touch only counts as a user gesture at pointerup / touchend / click
    // (pointerdown is too early for touch), so listen to all of them: the very first
    // tap ("Tap to reveal") starts the song.
    const events = ["pointerdown", "pointerup", "touchend", "click", "keydown"];
    const disarm = () => {
      this.gestureHooked = false;
      for (const name of events) window.removeEventListener(name, retry, true);
    };
    const retry = () => {
      if (!this.isOn()) {
        disarm();
        return;
      }
      if (this.player.playing) disarm();
      else void this.playActive();
    };
    for (const name of events) window.addEventListener(name, retry, true);
  }

  private hookVideos() {
    if (this.videoHooked || typeof document === "undefined") return;
    this.videoHooked = true;
    const bind = (v: HTMLVideoElement) => {
      v.addEventListener("play", () => void this.player.duck());
      v.addEventListener("pause", () => void this.player.unduck());
      v.addEventListener("ended", () => void this.player.unduck());
    };
    document.querySelectorAll("video").forEach(bind);
    // Videos added later (lazy sections)
    new MutationObserver((muts) => {
      for (const m of muts)
        m.addedNodes.forEach((n) => {
          if (n instanceof HTMLVideoElement) bind(n);
          else if (n instanceof HTMLElement)
            n.querySelectorAll("video").forEach(bind);
        });
    }).observe(document.body, { childList: true, subtree: true });
  }

  private zoneForSection(sectionId: string): string | null {
    for (const z of MUSIC_ZONES) {
      if (z.sectionIds.includes(sectionId)) return z.id;
    }
    return null;
  }

  private async playActive() {
    if (!this.activeZone) return;
    if (this.isUniversal()) {
      if (this.player.url) return; // already playing the universal track
      const u = this.universal;
      await this.player.start({
        url: u.url,
        volume: u.volume,
        fadeIn: u.fadeIn,
        fadeOut: u.fadeOut,
        loop: true,
        trimStart: u.trimStart,
        trimEnd: u.trimEnd,
      });
      this.notify(this.player.playing);
      return;
    }
    const zone = resolveZone(this.activeZone, this.zoneCfgs);
    if (!zone) return; // no audio → keep current
    if (this.player.url) await this.player.crossfade(zone);
    else await this.player.start(zone);
    this.notify(this.player.playing);
  }

  private onCandidate(zoneId: string | null) {
    if (zoneId === this.candidateZone) return;
    this.candidateZone = zoneId;
    if (this.stabilityTimer !== null) {
      clearTimeout(this.stabilityTimer);
      this.stabilityTimer = null;
    }
    if (!zoneId) return;
    // Debounce: zone must be stable before we switch (fast scroll guard)
    this.stabilityTimer = window.setTimeout(() => {
      this.stabilityTimer = null;
      if (this.candidateZone !== zoneId || !this.scrollMode) return;
      if (this.isUniversal()) return; // one track for the whole site
      if (zoneId === this.activeZone) return;
      const zone = resolveZone(zoneId, this.zoneCfgs);
      if (!zone) return; // no audio → keep current track playing
      if (zone.url === this.player.url) {
        this.activeZone = zoneId; // same track — adopt zone, don't restart
        return;
      }
      this.activeZone = zoneId;
      if (this.isOn()) void this.playActive();
    }, STABILITY_MS);
  }

  private startObservers() {
    if (typeof document === "undefined" || this.observer) return;
    const els: { el: HTMLElement; zone: string }[] = [];
    for (const z of MUSIC_ZONES) {
      for (const sid of z.sectionIds) {
        const el = document.getElementById(sid);
        if (el) els.push({ el, zone: z.id });
      }
    }
    if (els.length === 0) return;

    // Active detection: center band of the viewport.
    // Track ALL currently-intersecting sections so rapid scroll batches
    // can't leave us with a stale "best" from a partial batch.
    const intersecting = new Map<HTMLElement, number>();
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) intersecting.set(e.target as HTMLElement, e.intersectionRatio);
          else intersecting.delete(e.target as HTMLElement);
        }
        let best: { zone: string; ratio: number } | null = null;
        for (const [el, ratio] of intersecting) {
          const found = els.find((x) => x.el === el);
          if (!found) continue;
          if (!best || ratio > best.ratio) best = { zone: found.zone, ratio };
        }
        if (best) this.onCandidate(best.zone);
      },
      { rootMargin: "-35% 0px -35% 0px", threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
    );
    els.forEach(({ el }) => this.observer!.observe(el));

    // Preload: start fetching audio well before the section is visible
    this.preloadObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const found = els.find((x) => x.el === e.target);
          if (!found) continue;
          const zone = resolveZone(found.zone, this.zoneCfgs);
          if (zone && zone.url !== this.player.url) this.player.preload(zone.url);
        }
      },
      { rootMargin: "1200px 0px 1200px 0px", threshold: 0 }
    );
    els.forEach(({ el }) => this.preloadObserver!.observe(el));
  }

  private stopObservers() {
    this.observer?.disconnect();
    this.observer = null;
    this.preloadObserver?.disconnect();
    this.preloadObserver = null;
    if (this.stabilityTimer !== null) {
      clearTimeout(this.stabilityTimer);
      this.stabilityTimer = null;
    }
    this.candidateZone = null;
  }

  /** Called on the first user gesture (Open Invitation tap chain). */
  async begin(): Promise<void> {
    this.zoneCfgs = readZoneConfigs();
    this.universal = readUniversal();
    this.hookVideos();
    safeSessionSet(MUSIC_KEY, "on");
    this.scrollMode = false;
    this.started = true;
    // Universal mode: one track for the whole site, no zone switching.
    if (this.isUniversal()) {
      this.activeZone = "__universal__";
      const u = this.universal;
      const ok = await this.player.start({
        url: u.url,
        volume: u.volume,
        fadeIn: u.fadeIn,
        fadeOut: u.fadeOut,
        loop: true,
        trimStart: u.trimStart,
        trimEnd: u.trimEnd,
      });
      if (!ok) this.hookGestureRetry();
      this.notify(this.player.playing);
      return;
    }
    this.activeZone = "opening";
    const zone = resolveZone("opening", this.zoneCfgs);
    if (!zone) {
      this.notify(false);
      return;
    }
    const ok = await this.player.start(zone);
    if (!ok) this.hookGestureRetry();
    this.notify(this.player.playing);
  }

  /** Doors opened — switch to scroll-driven section music. */
  enterScrollMode() {
    if (!this.started) return;
    this.scrollMode = true;
    // Prime with the topmost visible section immediately
    this.startObservers();
    // Fallback: if nothing observed yet, hero zone keeps music going
    if (!this.activeZone || this.activeZone === "opening") {
      const heroEl =
        document.getElementById("home") ?? document.getElementById("family");
      if (heroEl) {
        const zoneId = this.zoneForSection(heroEl.id) ?? "hero";
        this.activeZone = zoneId;
        if (this.isOn()) void this.playActive();
      }
    }
  }

  /** Global toggle from the floating control. */
  async toggle(): Promise<boolean> {
    if (this.player.playing) {
      this.player.pauseAll();
      safeSessionSet(MUSIC_KEY, "off");
      this.notify(false);
      return false;
    }
    safeSessionSet(MUSIC_KEY, "on");
    this.zoneCfgs = readZoneConfigs();
    this.universal = readUniversal();
    // Unmute: if a track was paused (URL still set), just resume it.
    // playActive() would early-return thinking it's "already playing".
    if (this.player.url && this.player.resume()) {
      this.notify(this.player.playing);
      return this.player.playing;
    }
    await this.playActive();
    if (!this.player.playing) this.hookGestureRetry();
    this.notify(this.player.playing);
    return this.player.playing;
  }

  /** Replay Invitation — full reset. */
  reset() {
    this.player.reset();
    this.stopObservers();
    this.scrollMode = false;
    this.activeZone = null;
    this.started = false;
    safeSessionSet(MUSIC_KEY, "off");
    this.notify(false);
  }

  /** Direct zone play (compat for old setTrack calls). */
  async playZone(zoneId: string) {
    this.zoneCfgs = readZoneConfigs();
    const zone = resolveZone(zoneId, this.zoneCfgs);
    if (!zone) return;
    this.activeZone = zoneId;
    if (this.isOn()) await this.playActive();
  }
}

export const dynamicMusic = new DynamicMusicEngine();
