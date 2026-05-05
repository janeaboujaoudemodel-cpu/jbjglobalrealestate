## Goal

1. Make every contact pill on a brokerage card actually click-through (Email, Phone, WhatsApp, Office address/Map, Website, Instagram) — no swallowed clicks, no malformed URLs, no popup-blocker triggers.
2. Guarantee that the brokerages we seed/enrich are **real-estate brokerages only** — never banks, mortgage brokers, insurance brokers, law firms, freight brokers, property-management-only firms, etc.

## Why links currently feel "blocked"

`src/pages/CRMRelationships.tsx` → `BrokerageContactLinks` (lines 283-316):

- Instagram value can come in three shapes — `@handle`, `instagram.com/handle`, or `https://instagram.com/handle` — but the current normalizer only handles `@handle` vs full URL. A bare `instagram.com/x` falls through and produces `https://instagram.com/instagram.com/x`, which Instagram rejects → looks "blocked".
- Map URL is built from `office_address + emirate` but the address can be `null` while `mapUrl` is still computed; `encodeURIComponent` of `"null, Dubai"` makes a non-useful Google Maps query.
- Phone number stripping (`replace(/\s+/g, "")`) keeps `()` and `-`, which some `tel:` handlers reject.
- WhatsApp uses `wa.me/<digits>` but if the saved number was just `0501234567` (local) the leading zero is preserved → wa.me rejects → tab opens then closes.
- Anchors don't `stopPropagation`, and the parent card has clickable children; on touch / certain pointer events the wrapping flex row can intercept the up-event before the anchor's default fires (this is the "looks broken" symptom on tap targets next to the company-name button).
- The pills also lack `rel="noopener noreferrer"` consistently and don't set `referrerPolicy`, which a few corporate browsers treat as suspicious for `target="_blank"` and silently swallow.

There is **no global JS blocker** — `useAntiCapture` only runs for auditors, `AntiBot` is dev-mode-skipped on lovable.app, and `GlobalVisitorTracking`'s click listener is passive. So the fix is purely in the link builder.

## Why brokerages can include banks / unrelated firms

`supabase/functions/seed-uae-brokerage-directory/index.ts` (Perplexity prompt, lines 96-103) and `enrich-uae-brokerage-directory/index.ts` (lines 70-78) say "real estate brokerage" but Perplexity Sonar still occasionally returns:
- Mortgage brokers (e.g. "Holo Mortgage Brokers")
- Insurance brokers
- Banks with property arms
- Law/consulting firms with "Real Estate" in their name
- Pure property-management companies (no DLD broker license)

There's no server-side keyword reject after the model returns, so they get inserted into `crm_brokerages`.

## Changes

### 1. `src/pages/CRMRelationships.tsx` — `BrokerageContactLinks`

Rewrite the link builder so every pill is robust + always clickable:

- Add a tiny utility `buildContactLinks(r)` that returns `{href, label, icon, key}` only when href is valid. Skip empties up-front so we never render dead pills.
- **Phone**: strip everything except digits and leading `+` for the `tel:` href; display the original.
- **WhatsApp**: digits only, drop a single leading `0`, and if it's a 9-digit UAE local number prepend `971`. `https://wa.me/<digits>`.
- **Email**: trim, lower-case, validate with a simple regex; skip if invalid.
- **Map**: only render when `office_address` (or `office_location`) is a non-empty string. Build `https://www.google.com/maps/search/?api=1&query=...` with `encodeURIComponent` over the trimmed combined string.
- **Website**: ensure scheme, strip whitespace, no trailing fragments.
- **Instagram**: normalize via:
  ```
  if starts with http   → use as-is
  else strip leading @, strip 'instagram.com/' if present, strip leading '/'
  → 'https://www.instagram.com/<handle>'
  ```
- All external `<a>`s get `target="_blank"`, `rel="noopener noreferrer"`, `referrerPolicy="no-referrer"`, and an `onClick={(e) => e.stopPropagation()}` so no parent handler can swallow the click.
- Add `data-no-contrast-guard` so the runtime contrast guard never repaints these pills mid-click.
- Render pills as real anchors (not buttons) wrapped in their own `<span className="contents">` so flex layout never overlaps tap targets.

### 2. `supabase/functions/seed-uae-brokerage-directory/index.ts`

- Tighten the Perplexity user prompt to: "List up to N **real-estate sales brokerage offices licensed by [authority]** in [emirate]. Do **NOT** include banks, mortgage brokers, insurance brokers, financial advisors, law firms, consultancies, freight/logistics brokers, or property-management-only companies. Every entry must hold a current DLD/RERA broker registration (Trakheesi number) or DMT/municipality real-estate brokerage permit."
- After the model returns, run a server-side reject filter: drop any row whose `company_name` matches `/(bank|mortgage|insurance|takaful|finance|capital partners|law\b|legal|consult|advisory|freight|logistics|management services)\b/i` **unless** `rera_license` is present and matches the DLD broker number format. Increment `stat.skipped` for each dropped row.
- Also drop rows where `rera_license` is null AND `email`+`phone`+`website` are all null (no signal at all that this is a real licensed firm).

### 3. `supabase/functions/enrich-uae-brokerage-directory/index.ts`

- Add the same keyword guard before the per-row patch is applied. If the brokerage's existing `company_name` matches the bank/mortgage/insurance/etc. regex AND lacks a `rera_license`, mark it `entry_source='owner'` is preserved but flag `confidence='low'` and skip enrichment (so we don't keep enriching junk).
- Tighten the system prompt the same way.

### 4. (Optional cleanup migration)

A small migration that flags-but-does-not-delete the existing junk rows so the user can review:
- `update crm_brokerages set status='archived' where entry_source='directory' and rera_license is null and company_name ~* '(bank|mortgage|insurance|takaful|finance|law|legal|consult|advisory|freight|logistics|management services)';`
- We'll **archive**, not delete, to preserve the No-Removal policy.

## Out of scope

- No changes to the Card layout, KPI strip, AI buttons, or ledger flow.
- No CSP changes (Instagram links are plain top-level navigations, not subject to `connect-src`).
- No changes to `useAntiCapture`, `AntiBot`, `GlobalVisitorTracking`, or the print blocker engine — they don't block these clicks.

## Acceptance

- Clicking Email/Phone/WhatsApp/Map/Website/Instagram on any brokerage card opens the correct app or new tab on first click; no Instagram URL ever has `instagram.com/instagram.com/...`; no `tel:null`, `mailto:null`, or empty-query Map link is ever rendered.
- Newly seeded brokerages are exclusively DLD/RERA/DMT-licensed real-estate brokerages; bank / mortgage / insurance / law / consultancy names get rejected at insert time.
- Existing junk directory rows that have no RERA license get auto-archived (still visible if the user filters for archived) so the live view is real-estate-only.
