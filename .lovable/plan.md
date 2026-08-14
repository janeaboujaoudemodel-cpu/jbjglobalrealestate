# Client-data leak fix + sidebar/header rebuild (Resend spacing, Zoho white header)

## 1. Security first: no client/lead data outside the owner back end

Confirmed in code: `OwnerLeadNotificationListener` already refuses to subscribe or poll unless the visitor is a signed-in owner **and** is on an `/owner`, `/crm` or `/admin` route. What it does not do is clear a toast that was already opened. Sonner toasts are global and this one is created with `duration: Infinity`, so a lead card raised while you were inside the CRM stays on screen after you navigate to `/access` or any public page — which is exactly what the screenshot shows.

Fix:
- Dismiss the lead toast (and clear the seen-set) whenever the listener's guard turns false: signed out, not owner, or route left the owner back end.
- Dismiss on component unmount as well, so a route change that unmounts the listener cannot leave client names, phone numbers or emails on a public screen.
- Sweep for any other surface that can render lead/client text outside the back end and apply the same rule.
- Remove the hardcoded fake unread badge (`unreadCount = 3`) in the CRM header and drive it from real unread notifications.

Nothing here loosens database access; leads stay owner-only.

## 2. Vertical sidebar: Resend geometry, white monogram, no gold

Applies to front end and back end, both Sun and Moon (geometry and animation are shared; only the header colour differs by skin):
- Monogram: pure white only, no gold, no glow, no highlight ring, no vertical accent line.
- Remove the divider under the company wordmark/logo entirely, so the rail no longer looks welded to the horizontal header.
- Replace every gold border/accent in the rail with one thin, low-opacity white rule where a separator is genuinely needed.
- Adopt Resend's rail rhythm: matched rail width, equal left/right padding, one row height, one row gap, and a single larger gap between sections.
- Icon micro-animation on hover for every row (same easing/duration front and back end).
- Keep the Moon rail on the locked emerald-to-black gradient with pure white ink; keep the Sun rail on champagne with black ink.

## 3. Horizontal header

- Increase header height to match Resend's taller bar; align its vertical padding to the new rail rhythm.
- Moon only: the horizontal header becomes the white Zoho-style bar (dark ink on white), while the vertical rail stays emerald. Sun keeps its current champagne treatment.
- No seam, no gap and no leftover divider between rail and header.

## 4. Gated portal untouched

The gated portal keeps its existing look exactly as it was — no emerald restyle, and the carrier hole is left alone.

## 5. Verification

- Playwright screenshots via the existing QA capture script at desktop and phone widths: signed-out `/access`, a public page, the owner back end, and CRM — proving no client data appears outside the back end.
- Screenshots of the rail collapsed and open, in Sun and Moon, front end and back end, to confirm white monogram, no gold, no highlight, no wordmark divider, and matched spacing.
- End-to-end pass: sign in as owner, trigger a real lead notification, open CRM from the toast, navigate to a public route, confirm the toast is gone.

## Carried-over open items from the previous prompt

Anything conflicting with the confirmed Moon standard (emerald back end + pure white ink, now the reference for every site surface) is dropped:
- Dropped: earlier gold-accent and gold-border rail instructions; earlier "emerald gated portal" direction.
- Still open and included above: rail spacing/gap parity, monogram sizing/colour, removal of highlight effects, header height, header/rail seam.
- Still open, tracked separately: CRM inbox and calendar polish in the new back end shell (routes are wired to the real inbox and calendar; visual pass pending).

## Technical notes

- `src/components/OwnerLeadNotificationListener.tsx` — add guard-transition and unmount dismissal.
- `src/pages/owner/crm/shell/CrmHeader.tsx` — real unread count, taller header.
- `src/components/navigation/GlobalVerticalNav.tsx` and `src/components/navigation/vertical-nav-refined.css` — monogram, gold removal, spacing, hover animation.
- Styling stays scoped to these components/CSS module; no new global rules or `!important` added to `src/index.css`.
