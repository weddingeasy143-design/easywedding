/* Easy Wedding (easywedding.in) — original design & code © 2026 Chandan Kumar Mahato. All rights reserved. Origin fingerprint: EW-ORIGIN-2026-369eafc22a98. Unauthorised copying is prohibited. */
// Photo snapshots can be much larger than a QR code can hold. Check before
// calling the encoder, whose segmentation step is expensive for long input.
export async function invitationQRCode(value, options, encode) {
  if (typeof value !== 'string' || new TextEncoder().encode(value).byteLength > 1800) return '';
  try { return await encode(value, options); } catch { return ''; }
}
