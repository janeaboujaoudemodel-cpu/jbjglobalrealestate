## PAA Print + Template Overhaul (Property Advertising Agreement)

Fix every issue raised about the printed PAA: remove the blob/`.lovable.app` chrome, fix the broken monogram in print, rebuild the header/footer in true champagne premium style with gold contact links, pin the office address to the trade license, fit the document to one A4 page (Property Finder style), pre-fill Tenanted + vacating date, and finalise the signature flow so the date auto-fills the moment the client signs.

---

### 1. Kill the "blob:…/lovable.app" header & footer in printed output

**Problem:** `handlePrint` in `src/pages/e-signature/EnvelopeDetail.tsx` opens a `Blob` URL in a new tab and triggers `window.print()`. Chrome/Safari print chrome then injects the page **URL** (the blob URL with `lovable.app` host) and a tab title into the printed page header/footer — this is what the user sees at the bottom.

**Fix:** Switch Print to a **real PDF** path, identical to Download:
- Build the HTML with `renderTemplateHtml(...)` (same call as preview).
- Pipe through the existing `renderHtmlToPdfBlob()` helper used by `handleDownloadBlank`.
- Open the resulting `application/pdf` blob in a new tab. Browsers print PDFs **without injecting URL/date headers**, so the unwanted "blob:… lovable.app" line disappears entirely.
- Remove the `window.print()` HTML wrapper path completely.

This single change also eliminates every reference to `lovable.app` from anything the user sees, front-end or printed.

---

### 2. Fix the broken monogram in the printed PDF

**Problem:** `JBJ_BRAND.monogram` is imported as a Vite asset URL (`@/assets/jbj-monogram-nobuffer.png`). When the HTML is rendered into a sandboxed PDF/print window, the relative URL fails to resolve → broken-image icon.

**Fix:**
- At build time, embed the monogram as a **base64 data URI** so it travels with the HTML and renders identically in preview, PDF and print.
- Add `crossorigin="anonymous"` is already there but the data URI removes the network entirely.
- Same treatment in the footer if/when re-introduced.

---

### 3. Premium champagne header — final layout

Rebuild `headerHtml(monogram-wordmark)` so it matches the screenshot the user pinned but with everything corrected:

```text
┌──────────────────────────────────────────────────────────────────────┐
│  [JBJ monogram]   JBJ GLOBAL REAL ESTATE              JBJ-PAA-…-0001 │
│       (54px)      Office SM1-195, Port Saeed,         +971 54 716 7107│
│                   Deira, Dubai, UAE                   CONTACT@JBJ.AE  │ ← gold
│                                                       WWW.JBJ.AE      │ ← gold
│  ───── 2px champagne→gold gradient hairline ─────                     │
│                  PROPERTY ADVERTISING AGREEMENT                       │
│                  ── short gold underline ──                           │
└──────────────────────────────────────────────────────────────────────┘
```

Specifics:
- **Office line** sourced from `TRADE_LICENSE_OFFICE` (`Office SM1-195, Port Saeed, Deira, Dubai, UAE`). Never "Downtown Dubai", never "private office".
- **Phone** in ink, **email + website** in gold (`#B89555`), `letter-spacing` and 4px row gap so they don't visually collide.
- **Doc number** badge top-right, slightly smaller, ink.
- **Background tint:** subtle champagne (`#FBF7EE`) wash behind the header band so it differentiates from the white body, but stays print-safe.
- Tighten vertical paddings (8px top, 10px below hairline) so the header is shorter and the doc fits one page.

---

### 4. Premium champagne footer — final layout

Rebuild `footerHtml("three-column")`:

```text
─── 2px champagne→gold gradient hairline ───
JBJ GLOBAL REAL ESTATE     Office SM1-195, Port Saeed,        CONTACT@JBJ.AE   ← gold
+971 54 716 7107           Deira, Dubai, UAE                  WWW.JBJ.AE       ← gold
```

- Same champagne `#FBF7EE` band as the header for symmetry.
- No monogram in the footer (already removed in v13, keep it that way).
- Three text columns; phone/ink left, office centre, email/website gold right.
- 9.5px font, 1.45 line-height, 6px column gutter — fits in a single 18mm bottom margin.
- All three contact items are real anchors (`tel:` / `mailto:` / `https://`).

---

### 5. Fit everything on **one A4 page** (Property Finder style)

- Template body density audit: collapse Section 3 (T&Cs) into a tight 9.5px / 1.4 line-height block; reduce inter-section spacing from 18px → 10px; signature row height 60px → 48px.
- Header + footer trimmed per §3/§4 above.
- After Approve (`renderMode: "final"`), drop all chip placeholders, dashed-underline empty fields, and "OR UNTIL" hints — already partially done; extend to T&Cs bullet whitespace.
- QA: render via `renderHtmlToPdfBlob` → `pdftoppm` and confirm exactly **1 page** for a typical leasing PAA.

---

### 6. Pre-fill Tenanted + Vacating Date defaults

Owner already supplied "tenanted, vacant on YYYY-MM-DD". Update the PAA defaults pipeline in `EnvelopeDetail.tsx` (and the create-envelope path in `useEsignTemplates.ts` if needed) so when category is `leasing`:
- `status_vacant_tenanted` defaults to `"Tenanted"`.
- `vacating_date` defaults to the date supplied by the owner (kept editable).

These remain fully editable in the inline form; they're just no longer blank on first render.

---

### 7. Approve = lock single-choice options

Already partially implemented via `renderMode:"final"` + `cleanFinalLabel`. Tighten so that after Approve:
- Every chip row collapses to **only the selected value**, rendered as plain ink text (no chip outlines, no separators, no "OR / UNTIL").
- Empty optional rows disappear instead of showing dashed placeholders.

This is the "I approve, you remove the rest of the options" rule the user asked for.

---

### 8. Signature flow (client side, on the sign page)

In the public sign page used by the recipient (already wired through DocuSign/`/sign/:token`):
- Keep the date in **DD / MM / YYYY** boxed style (matches the header dateBox).
- The moment the client adds their signature (draws/types/uploads):
  1. Auto-fill `landlord_signature_date` with `today`, formatted DD / MM / YYYY.
  2. Show a small inline confirmation: *"Date filled automatically — DD/MM/YYYY"*.
  3. Reveal **Finish** button.
- On **Finish**: submit signature + date, mark recipient `signed`, fire the existing completion pipeline (envelope → completed → owner notification + signed PDF stored).
- The template stays editable up to Approve; once Approved (`locked_at`), the recipient can only sign — never edit fields.

---

### 9. Compliance sweep

- Grep the entire repo for `lovable.app`, `lovable\.dev`, `from Lovable` references inside any document/email/PDF template; remove any user-facing occurrences. Internal build tooling stays untouched.
- Add a unit test in `src/templates/__tests__` asserting that `buildPAAHtml` output never contains the string `lovable`.

---

### Technical change list (files)

| File | Change |
|---|---|
| `src/pages/e-signature/EnvelopeDetail.tsx` | Replace `handlePrint` with PDF-blob open; pre-fill Tenanted/vacating defaults on first hydrate. |
| `src/templates/jbjPropertyAdvertisingAgreement.ts` | Header + footer redesign, base64 monogram, density tightening, gold links, final-mode chip cleanup, office line from `TRADE_LICENSE_OFFICE`. |
| `src/lib/email/...` or new `src/templates/_assets/monogramDataUri.ts` | Inline base64 monogram. |
| `src/pages/sign/...` (recipient signing page) | Auto-fill DD/MM/YYYY date on signature add; confirmation toast; Finish button gating. |
| `src/templates/__tests__/paa.test.ts` | New regression test: no `lovable` substring; office line == trade-license value. |
| Repo-wide grep | Remove any `lovable.app` strings from user-facing templates/emails. |

---

### Out of scope (will not touch unless asked)

- DocuSign integration / envelope routing (already wired).
- Email shell template (separately governed by Locked-Send Outreach Standard).
- Any non-PAA document template.
