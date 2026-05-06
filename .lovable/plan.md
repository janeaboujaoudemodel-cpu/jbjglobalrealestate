## Brokerage Outreach — Copy + AMRA CTA + Booking CTA Fixes

Targeted, frontend/template-only fixes against the issues you raised. No feature removed.

### 1. Rewrite the registration sentence (both templates + edge fallback)

Replace the current line everywhere it appears:

> "...if not, reply with the email address where the registration documents should be sent."

with:

> "Kindly share your email address so our **Channel Partner Department** can send the registration documents and onboard {{brokerage_name}} directly."

Files:
- `crm_email_templates` rows: `brokerage_partnership_intro`, `brokerage_breakfast_invite` (data update on the `html` column)
- `supabase/functions/crm-send-brokerage-outreach/index.ts` line ~466 (legacy fallback string) — same rewrite, using `${varsMap.brokerage_name}`

### 2. "your brokerage" → live brokerage name

Both templates and the edge fallback use `{{brokerage_name}}` already, but the edge function sets `brokerageNameResolved = brk.company_name || "your brokerage"` (line 397). Change the fallback to `"your team"` so it never literally reads "your brokerage". Bulk sends already synchronize the real `company_name` per recipient — confirm with a quick `read_query` on `crm_brokerages` that all targeted rows have `company_name`.

### 3. AMRA e-Catalogue button — clickable + champagne

Current button uses `background:#1A1A1A;color:#FDFBF7` (black fill). Per your direction: light champagne, clean, clickable, gold hairline.

Replace the `<a>` styling for `Open {{project_name}} e-Catalogue →` in both DB templates and the edge-function fallback (`goldCta` helper, line ~454) with:

```
background:#F7F2EA;color:#1A1A1A;border:1px solid #B89555;
padding:14px 28px;border-radius:10px;font-weight:600;
text-decoration:none;display:inline-block;letter-spacing:0.3px;
```

Confirm `href="{{project_url}}"` resolves (varsMap maps to `project.url` from `src/config/citi-projects.ts`) — verify it's an absolute `https://` URL so Gmail makes it clickable. If any project entry is relative, prefix with `https://www.citidevelopers.com`.

Also ensure the **TemplateEditorDialog preview pane** renders the same HTML (it already injects sample vars; just verify `project_url` is in the sample map so the preview link is live, not a dead `{{project_url}}` string).

### 4. Replace the 📅 emoji with a clean SVG icon

In both templates, the breakfast tile currently shows `<div style="font-size:30px">📅</div>`. Replace with an inline gold-stroke calendar SVG (email-safe, no JS):

```html
<div style="margin:6px 0 4px">
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
       fill="none" stroke="#B89555" stroke-width="1.5"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="3" y="4.5" width="18" height="16" rx="2"/>
    <path d="M3 9h18M8 3v3M16 3v3"/>
  </svg>
</div>
```

### 5. "Pick any weekday slot" — make it a real CTA, not static text

Currently the line `Pick any weekday slot` sits inside a static tile and isn't actionable on its own. Wrap the entire mini-calendar tile in `<a href="{{booking_url}}" target="_blank" rel="noopener">` so the whole card is clickable, and add an explicit pill button under it:

```
[ Reserve a weekday slot → ]
```

styled identical to the new champagne AMRA CTA (cream fill, gold hairline, ink text). The existing standalone "Book your slot on the calendar →" button below stays — both routes lead to `{{booking_url}}`.

### 6. Booking page redirects to relationship hub + slow

Reproduce on `/breakfast-booking?token=…`:
- Investigate `src/pages/BreakfastBooking.tsx` initial fetch path (`breakfast-booking-lookup` edge fn). The slow redirect to `/owner/crm/relationships` is almost certainly: missing/expired token → catch block → `<Navigate to="/owner/crm/relationships">` or similar fallback. Replace any hard redirect with a friendly inline error state ("This invite link is no longer valid — request a new one") and a single clear CTA back to the homepage. Never bounce to an owner-only route.
- Eliminate the perceived slowness: render the page chrome immediately, only the slot grid behind a small skeleton; lazy-load `html2canvas` (currently imported eagerly at the top, ~200KB). Move it inside the `downloadConfirmation` handler with `await import("html2canvas")`.
- Verify `crm-create-breakfast-invite-token` is being invoked from the **owner** session when generating booking_url (it requires owner auth). For test sends, ensure `isTest:true` mints a preview token that the public lookup function accepts (check `breakfast-booking-lookup` for an `isTest`/preview path; if missing, add a preview branch returning sample slots so the test email link doesn't dead-end).

### 7. Verify in preview + send a real test

- Open `TemplateEditorDialog` for both variants → confirm: new copy, gold-hairline calendar SVG, champagne AMRA button, brokerage name interpolated, booking CTA visible.
- Send a test to `jane@citidevelopers.com` from the Brokerages tab → click each link in Gmail → AMRA button opens the catalogue, "Reserve a weekday slot" opens `/breakfast-booking?token=…` and shows real slots, not the relationship hub.

### Files expected to change

- `supabase/functions/crm-send-brokerage-outreach/index.ts` — copy rewrite, fallback brokerage name, champagne `goldCta` style
- `crm_email_templates` rows (`brokerage_partnership_intro`, `brokerage_breakfast_invite`) — copy, SVG icon, AMRA button, wrap booking tile in `<a>`, add explicit "Reserve a weekday slot" pill
- `src/pages/BreakfastBooking.tsx` — remove hard redirect to `/owner/crm/relationships`, lazy-load `html2canvas`, friendly invalid-token state
- `supabase/functions/breakfast-booking-lookup/index.ts` — add `isTest` preview branch (only if missing) so test-mode booking_url renders sample slots
- `src/components/crm/TemplateEditorDialog.tsx` — ensure preview sample vars include `project_url` and `booking_url` so preview links are live

No business-logic changes beyond the booking page redirect fix and lookup preview-mode branch.
