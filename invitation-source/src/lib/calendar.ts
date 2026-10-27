// src/lib/calendar.ts
// Generate "Add to Calendar" URLs (Google Calendar).

/** Format a Date as Google Calendar UTC timestamp: 20261124T143000Z */
function toGCalUTC(d: Date): string {
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}

export interface CalendarEventInput {
  title: string;
  description?: string;
  location?: string;
  /** ISO string with timezone, e.g. "2026-11-24T20:00:00+05:30" */
  startISO: string;
  /** duration in hours (default 3) */
  durationHours?: number;
}

/** Build a Google Calendar "add event" URL. */
export function googleCalendarUrl(ev: CalendarEventInput): string {
  const start = new Date(ev.startISO);
  const end = new Date(start.getTime() + (ev.durationHours ?? 3) * 3_600_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${toGCalUTC(start)}/${toGCalUTC(end)}`,
    details: ev.description ?? "",
    location: ev.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
