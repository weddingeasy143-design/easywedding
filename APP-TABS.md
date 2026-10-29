# Android app — Overview / Upload / Bookings tabs

Owner's request (30 Oct 2026): the Overview screen's invitation details take half the
screen and squeeze the editor. Make the details small (tick style + a thin percent bar),
give the invitation editor its own **Upload** tab, and give bookings their own tab.
Saving in the editor must raise the percent shown on Overview.

## What the website already provides (done, in this repo)

- **Progress data** — `GET /api/invitation-progress` (signed-in) returns
  `{percent, complete, items: [{key, label, done, step}], message}`.
  It is computed from the cloud-saved studio draft, so every save in the studio
  (auto-save included) updates the percent everywhere. Keep using this endpoint;
  its shape is stable.
- **Overview (website)** — the dashboard's invitation card is now compact:
  one-line "NN% complete" head, a 5px thin bar, and one small pill per item —
  green with a ✓ when done, a tappable pill linking to that studio step when not.
- **Upload tab content** — the Invitation Studio is the upload/editor screen:
  names & details (steps 1–2, 5–7), photos (step 3), wedding song (step 4) and the
  invitation film link (step 7, "Invitation film link"). Point the tab at
  `https://easywedding.in/studio`.
  Inside the app (when `window.EWApp` is present) the studio page now hides the
  website header, the big intro heading, its own duplicate percent box, the
  bookings section and the side preview column, so the editor steps get the full
  height of the WebView.
- **Bookings tab content** — bookings have their own page:
  `https://easywedding.in/bookings` (same "My bookings" module that used to sit at
  the bottom of the studio page: add booking, payments, balances, PDF).
  Point the new tab at that URL. On the website the studio still shows the section
  as before; inside the app it is hidden there because the tab replaces it.

## What only the Android app can do (native shell)

The top progress card and the bottom tab bar in the app are native UI — they are
not served from this website, so they cannot be changed from this repo. In the app:

1. Shrink the Overview progress card: one row "Your invitation · NN% complete",
   a thin progress bar under it, then the items as small pills in one wrapping row —
   done items with a ✓, missing items plain (the API's `items` array gives both,
   in order). No large card, no separate "Still to add" block.
2. Add an **Upload** tab that opens `https://easywedding.in/studio` in the WebView
   (the page detects the app and compacts itself as described above).
3. Add a **Bookings** tab that opens `https://easywedding.in/bookings`.
4. Refresh `GET /api/invitation-progress` when the Overview tab becomes visible
   (and on the existing refresh button), so the percent rises right after a save
   in the Upload tab.
