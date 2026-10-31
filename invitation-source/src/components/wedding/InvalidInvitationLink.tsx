// src/components/wedding/InvalidInvitationLink.tsx
// Shown instead of the invitation when a personal link (?to=..&invite=..)
// was revoked or deleted in Admin. On-brand maroon/gold, CSS-only.

export default function InvalidInvitationLink() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#2b120c] px-6 py-16">
      {/* soft golden ambience */}
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 50% 18%, rgba(201,154,61,0.16) 0%, transparent 70%)," +
            "radial-gradient(ellipse 45% 35% at 50% 85%, rgba(143,29,44,0.22) 0%, transparent 70%)",
        }}
      />
      <div className="relative w-full max-w-md rounded-2xl border-2 border-gold/70 bg-[#fffdf6] px-8 py-12 text-center shadow-[0_30px_80px_-30px_rgba(0,0,0,0.65)]">
        {/* diya glow */}
        <div
          className="mx-auto mb-7 h-14 w-14 rounded-full"
          aria-hidden
          style={{
            background:
              "radial-gradient(circle at 50% 62%, #ffd98a 0%, #e8a93d 42%, rgba(232,169,61,0) 72%)",
            boxShadow: "0 0 34px 10px rgba(232,169,61,0.45)",
          }}
        />
        <p className="font-script text-3xl text-[#8f1d2c]">With folded hands,</p>
        <h1 className="mt-3 font-display text-2xl font-semibold leading-snug text-bark sm:text-[1.7rem]">
          This invitation link is no longer valid
        </h1>
        <div className="mx-auto my-6 h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden />
        <p className="mx-auto max-w-sm text-[0.95rem] leading-relaxed text-bark/80">
          This personal link was revoked or replaced by the host. Please ask them
          for a fresh invitation link to view your personal invitation.
        </p>
        <p className="mt-8 text-xs uppercase tracking-[0.22em] text-bark/50">
          Easy Wedding
        </p>
      </div>
    </main>
  );
}
