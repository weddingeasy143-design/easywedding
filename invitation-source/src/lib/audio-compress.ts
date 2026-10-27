// src/lib/audio-compress.ts
// Client-side audio compression for admin uploads.
// Large MP3s (full songs) are re-encoded to Opus @ ~96kbps via MediaRecorder —
// typically 3-4x smaller with no audible difference on phone speakers.
// Small files (< 4 MB) skip compression entirely.

const COMPRESS_THRESHOLD = 4 * 1024 * 1024; // 4 MB
const TARGET_BITRATE = 96000; // 96 kbps Opus — sweet spot for background music

export function needsCompression(file: File): boolean {
  return file.type.startsWith("audio/") && file.size > COMPRESS_THRESHOLD;
}

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus"))
    return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "";
}

/**
 * Re-encode an audio file to a compact Opus/WebM.
 * onProgress receives 0-100. Resolves with the compressed File.
 */
export async function compressAudio(
  file: File,
  onProgress?: (pct: number) => void
): Promise<File> {
  const mime = pickMime();
  if (!mime) return file; // no recorder support — upload original

  // 1. Decode
  onProgress?.(2);
  const decodeCtx = new AudioContext();
  let buffer: AudioBuffer;
  try {
    buffer = await decodeCtx.decodeAudioData(await file.arrayBuffer());
  } finally {
    void decodeCtx.close().catch(() => {});
  }

  // 2. Play through a MediaStreamDestination while recording
  const recCtx = new AudioContext();
  await recCtx.resume().catch(() => {});
  const dest = recCtx.createMediaStreamDestination();
  const src = recCtx.createBufferSource();
  src.buffer = buffer;
  src.connect(dest);

  const rec = new MediaRecorder(dest.stream, {
    mimeType: mime,
    audioBitsPerSecond: TARGET_BITRATE,
  });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  const stopped = new Promise<void>((resolve) => {
    rec.onstop = () => resolve();
  });

  const duration = buffer.duration;
  src.start();
  rec.start(500);

  // 3. Progress ticker (real-time encode)
  const t0 = Date.now();
  await new Promise<void>((resolve) => {
    const tick = () => {
      const elapsed = (Date.now() - t0) / 1000;
      onProgress?.(Math.min(96, 4 + (elapsed / duration) * 92));
      if (elapsed < duration + 0.4) requestAnimationFrame(tick);
      else resolve();
    };
    tick();
  });

  rec.stop();
  await stopped;
  try {
    src.stop();
  } catch {
    /* already stopped */
  }
  void recCtx.close().catch(() => {});
  onProgress?.(100);

  const blob = new Blob(chunks, { type: "audio/webm" });
  // Safety: if compression didn't help, keep the original
  if (blob.size >= file.size || blob.size === 0) return file;
  const base = file.name.replace(/\.[^.]+$/, "") || "audio";
  return new File([blob], `${base}-compressed.webm`, { type: "audio/webm" });
}

export function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
