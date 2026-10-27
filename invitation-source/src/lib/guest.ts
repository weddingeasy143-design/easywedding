// src/lib/guest.ts
// Personalized guest links: ?to=Name&invite=token in the URL shows a personal greeting.
// Only Admin-generated links (with a valid invite token) personalize the invitation.
"use client";

import { useEffect, useState } from "react";

/** Read ?to=GuestName and ?invite=token from the URL. */
function readGuestParams(): { name: string | null; token: string | null } {
  if (typeof window === "undefined") return { name: null, token: null };
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("to")?.trim();
    const token = params.get("invite")?.trim() || null;
    let name: string | null = null;
    if (raw && raw.length > 0 && raw.length <= 60) {
      const clean = raw.replace(/<[^>]*>/g, "").trim();
      name = clean || null;
    }
    return { name, token };
  } catch {
    return { name: null, token: null };
  }
}

export type GuestLinkStatus = "none" | "checking" | "valid" | "invalid" | "unreachable";

type Validation = { ok: boolean; name: string | null; unreachable: boolean };

// One shared in-flight validation per token per page load. Three components
// (RoyalOpening, Hero, InvitationMessage) each call useGuestName, but only a
// single POST reaches /api/invitation/track — so viewCount increments exactly
// once per visit and the admin "viewed" stats stay truthful.
const validationCache = new Map<string, Promise<Validation>>();

function validateToken(token: string): Promise<Validation> {
  const cached = validationCache.get(token);
  if (cached) return cached;
  const p: Promise<Validation> = fetch("/api/invitation/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  })
    .then((r) => r.json())
    .then((data) =>
      data && data.valid
        ? { ok: true, name: (data.name as string) ?? null, unreachable: false }
        : { ok: false, name: null, unreachable: false }
    )
    .catch(() => ({ ok: false, name: null, unreachable: true }));
  validationCache.set(token, p);
  return p;
}

/**
 * Personalized greeting with server validation + view tracking.
 * - No token (?to=Name only, or plain site): no greeting — personalization
 *   requires an Admin-generated link with an invite token.
 * - Valid token: the name stored in the database (authoritative).
 * - Revoked/deleted token: no greeting.
 * - Token present but API unreachable: fall back to the URL name so a flaky
 *   network never breaks the guest's experience.
 */
export function useGuestName(): string | null {
  const [params] = useState(readGuestParams);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!params.token) return; // no token → never personalized
    let alive = true;
    validateToken(params.token).then((v) => {
      if (!alive) return;
      if (v.ok) setName(v.name);
      else if (v.unreachable) setName(params.name);
      else setName(null); // revoked/deleted → no greeting
    });
    return () => {
      alive = false;
    };
  }, [params.token, params.name]);

  return name;
}

/**
 * Status of the personal invitation link in the URL.
 * The public site (no token) is unaffected: status "none".
 */
export function useInvitationLinkStatus(): {
  hasToken: boolean;
  status: GuestLinkStatus;
} {
  const [params] = useState(readGuestParams);
  const [status, setStatus] = useState<GuestLinkStatus>(params.token ? "checking" : "none");

  useEffect(() => {
    if (!params.token) return;
    let alive = true;
    validateToken(params.token).then((v) => {
      if (!alive) return;
      setStatus(v.ok ? "valid" : v.unreachable ? "unreachable" : "invalid");
    });
    return () => {
      alive = false;
    };
  }, [params.token]);

  return { hasToken: !!params.token, status };
}
