## Honest audit of what's broken right now

I checked the database, the dashboard, the envelope page and the PAA template. You're right — several pieces never worked. Here's exactly what's wrong and what I'll fix.

### 1. Dashboard only shows "draft three" — Omar is missing visually

DB has 4 envelopes, including Omar's `JBJ-PAA-LEASING-0001` (draft). They all load, but `ESignatureDashboard.tsx` shows them as a flat list using only `envelope.name`. There is **no doc number badge, no client name, no template type, no thumbnail**. Two `JBJ-LA-SELLING-0001/0002` drafts have no field values, so they look identical and Omar's row blends in. Fix:

- Replace the flat list with a card grid: each card shows
  - **Doc number badge** (`JBJ-PAA-LEASING-0001`) — pulled from `metadata.doc_number`.
  - **Client name** (`Omar Allam Niazi Shadid`) — from `template_field_values.landlord_name` or first recipient.
  - **Template label** (Property Advertising Agreement — Leasing).
  - Status pill, last-updated, recipients chips.
  - A small **mini-preview thumbnail** rendered from the same HTML used inside (scaled-down iframe) so you instantly recognise the doc.
- Add filters: by template, by client name, by doc-number search.
- Remove the dark hero band so the page matches the rest of the suite (you said the homepage logo flashes — see #2).

### 2. Click on envelope flashes the homepage / logo, then opens

The `/e-signature/:id` route is wrapped behind a guard that briefly mounts the public landing while auth resolves, so you see the JBJ home logo for ~400 ms. Fix:

- Replace the loading state with the `EnvelopeDetail` skeleton directly (same layout, no re-mount of `App` shell).
- Use `<Suspense>` boundary around the page, not the layout.
- Pre-warm the envelope query on hover from the dashboard card so the click is instant.

### 3. "Copy signing link" still contains `*.lovable.app`

`buildSigningUrl()` in `EnvelopeDetail.tsx` uses `window.location.origin`. On the preview that's the `lovable.app` URL. Fix:

- Hard-route signing URLs to `https://jbj.ae/sign/<token>` using `PUBLIC_DOMAIN` from `src/config/backend.ts`.
- Apply the same to the WhatsApp share text and the email composer prefill.
- Add a copy button next to the doc number badge that copies `https://jbj.ae/sign/<token>` directly.

### 4. PAA fields don't match the Property Finder layout

Your reference uses **radio chips** (Villa / Apartment / Office / Warehouse, Furnished / Unfurnished, Vacant / Tenanted) **inline on one row**, then property fields in two columns, then T&Cs with **EXCLUSIVE / NON-EXCLUSIVE chips** and a row of **1 / 2 / 3 / 6 month** chips. My current template uses generic underlined fields. Fix without removing Omar's data:

- Rewrite `buildPAAHtml()` to mirror the Property Finder structure exactly:
  - **Section 1** Landlord / Owner Details (left col: Landlord's Name, Listing Consultant, Expiry date with DD/MM/YYYY split; right col: Passport Number, Property Reference No.).
  - **Section 2** Property Details — first row of **radio chips** for type (Villa/Apartment/Office/Warehouse) + **Furnished/Unfurnished** + **Vacant/Tenanted** + Vacating Date (DD/MM/YYYY), then 2-col fields exactly as in the PDF.
  - **Section 3** Terms & Conditions — sentence with the broker name underlined, then EXCLUSIVE/NON-EXCLUSIVE chips, then 1/2/3 Months chips with date slot, then **6 MONTHS (Residential Sale or Commercial only)** as its own chip; numbered clauses 2-4 verbatim.
  - **Landlord(s)** signature row with Name / Signature / Date columns plus DD/MM/YYYY.
- Keep all existing `template_field_values` keys so Omar's draft re-hydrates with no data loss.

### 5. Smart conditional fields & number formatting

In the **Edit fields** panel and the rendered HTML:

- If `status_vacant_tenanted === "Vacant"` → hide `vacating_date` from both form and PDF, and clear it on save.
- If `property_type !== "Villa"` and not "Other" → hide `plot_sqft`.
- If `listing_period !== "Until Date"` → hide `listing_period_until_date`.
- **Rental Amount / Sales Amount** inputs:
  - Format with thousand separators on blur ( `195000` → `195,000` ) using `Intl.NumberFormat('en-AE')`.
  - Show currency suffix as a non-editable trailing chip (`AED`) so "AED" never gets typed into the value.
  - In the PDF render: `AED 195,000` right-aligned.
- Phone formatted as `+971 50 363 4224`, Emirates ID as `784-1996-9538594-0` (display only — raw value preserved).

### 6. Premium customizable header / footer

- Build a **`<TemplateChromeStudio />`** panel inside the envelope page (collapsible, gold pill button "Customize header & footer"). It stores chrome settings in `esign_envelopes.metadata.chrome`.
- Settings:
  - Header style: **Monogram + Wordmark · Wordmark only · Crest + Address block · Minimal hairline** (4 presets, all champagne/gold compliant).
  - Footer style: **Three-column contact · Centered tagline · Compliance bar with TRN/license**.
  - Color overrides limited to 3 tokens: `accent` (defaults to `#B89555`), `ink` (`#1A1A1A`), `surface` (`#FFFFFF`). Other JBJ brand rules stay locked (no faded gold, no gold fills — per memory).
  - "Generate variations with AI" button → calls Lovable AI Gateway (`google/gemini-2.5-flash`) with the chrome JSON + brand guidelines and returns 4 alternative chrome configs you can preview live in the iframe and one-click apply.
- Footer copy is enforced uppercase per your rule:  
  `CONTACT@JBJ.AE  ·  WWW.JBJ.AE  ·  +971 54 716 7107`  
  Body text on the document stays sentence-case.

### 7. Auto signature + company stamp + elegant client signature block

- New table `owner_signature_assets` already exists (`useOwnerSignatureAssets` hook). Pre-load the **owner's signature image** and **company stamp PNG** on every PAA render and inject them into the JBJ side of the signature block with a faint "JBJ • Authorised" caption.
- Client side renders an **elegant placeholder**: dotted gold underline, italic "Awaiting signature — {{landlord_name}}" until signed; once signed, shows the captured signature image + printed name + ISO date in a small caption (`Signed on 9 May 2026 · IP: ###`).
- Both blocks render identically in the iframe preview, the printed PDF, and the email PDF — no more cropped name.

### 8. Cleanup — no removal

- Existing `voiceover`, `Smart-Fill`, `Adopt & Sign`, `audit log`, `realtime sync` features stay untouched.
- Omar's envelope (`810df24a…`) is migrated in-place: doc number stays `JBJ-PAA-LEASING-0001`, all field values preserved, just re-rendered with the new layout/header/footer when you next open it (auto-runs on first load if the layout version differs from `metadata.layout_version`).

## Files to change

- **edit** `src/pages/e-signature/ESignatureDashboard.tsx` — card grid, doc-number badge, client name, mini-preview, search/filters, remove dark hero band.
- **edit** `src/pages/e-signature/EnvelopeDetail.tsx` — `jbj.ae` signing URLs, smart conditionals on form, number formatters, mount `TemplateChromeStudio`, attach signature+stamp, fix loading skeleton (no homepage flash).
- **edit** `src/templates/jbjPropertyAdvertisingAgreement.ts` — restructure to Property Finder layout, radio chips, conditional rendering, AED suffix, signature/stamp slots, chrome injection.
- **new** `src/components/e-signature/TemplateChromeStudio.tsx` — header/footer presets + AI variations + color tokens.
- **new** `supabase/functions/template-chrome-ai/index.ts` — Lovable AI Gateway call returning 4 chrome variants (no API key needed).
- **edit** `src/hooks/useEsignTemplates.ts` — pass chrome + signature/stamp URLs into render, bump `layout_version`, re-render on open if stale.
- **edit** `src/components/e-signature/SmartFillDropzone.tsx` — only behaviour change: smart-cleared fields when conditional rules apply.
- **migration** — add `chrome jsonb` and `layout_version int` defaults to `esign_envelopes.metadata`; backfill nothing (read with fallbacks).

## Out of scope

- Listing Authorisation template restyle (next pass — same engine will apply once chrome is shared).
- Signing-page UX (`/sign/<token>`) — only the URL host changes.
- New auth/role logic.
