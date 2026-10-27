// src/lib/ics.ts
// Generates a downloadable .ics calendar file for a wedding event.
import type { WeddingEvent } from "@/content/wedding";

/** "2026-11-24T20:00:00+05:30" -> "20261124T200000" (floating local time) */
function toIcsLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function downloadEventIcs(event: WeddingEvent): void {
  const start = new Date(event.dateISO);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000); // assume 3h
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .split(".")[0]! + "Z";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ChandanPinki//Wedding Invitation//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}-chandan-pinki-wedding@invitation`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toIcsLocal(event.dateISO)}`,
    `DTEND:${toIcsLocal(end.toISOString())}`,
    `SUMMARY:${escapeIcs(`${event.name} — Chandan weds Pinki`)}`,
    `DESCRIPTION:${escapeIcs(`${event.tagline}. ${event.description}`)}`,
    `LOCATION:${escapeIcs(event.address)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chandan-pinki-${event.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
