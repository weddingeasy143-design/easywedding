// src/lib/phone.ts — client-safe Indian mobile number helpers.
//
// Accepts everyday inputs ("98765 43210", "+91-9876543210", "09876543210")
// and normalizes to the canonical 10-digit form. Indian mobile numbers start
// with 6–9.

/** Strip to digits, drop country code / trunk prefix. Returns "" when empty. */
export function digitsOnly(input: string): string {
  return (input || "").replace(/\D/g, "");
}

/**
 * Normalize to a 10-digit Indian mobile number.
 * Returns the 10 digits, or null when the input isn't a valid Indian mobile.
 */
export function normalizeIndianPhone(input: string): string | null {
  let d = digitsOnly(input);
  // +91XXXXXXXXXX
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  // 0XXXXXXXXXX (trunk prefix)
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

/** True when the input is a genuine 10-digit Indian mobile number. */
export function isValidIndianPhone(input: string): boolean {
  return normalizeIndianPhone(input) !== null;
}
