## Three fixes to the PAA template + envelope page

All edits in `src/templates/jbjPropertyAdvertisingAgreement.ts` and `src/pages/e-signature/EnvelopeDetail.tsx`. Bump `PAA_LAYOUT_VERSION` 16 → 17.

### 1. T&C #1 — gold line cuts through the company name → use a real underline

Today (line 532) the appointee company name is wrapped in:

```
<span style="border-bottom:1px solid #B89555; padding:0 6px; font-weight:600;">
  J B J GLOBAL REAL ESTATE L.L.C S.O.C
</span>
```

When the line wraps inside flowing T&C text, the inline `border-bottom` lands at the line baseline and visually cuts through descenders/dots in the legal name (it reads as a strikethrough on the company name).

**Fix:** drop `border-bottom`, switch to a real text underline with offset so the gold line sits clearly **below** the text and never overlaps:

```
text-decoration: underline;
text-decoration-color: #B89555;
text-decoration-thickness: 1px;
text-underline-offset: 4px;
padding: 0 4px;
```

Result: the legal name reads cleanly with a gold hairline underneath, even when it wraps. No padding-induced offset, no overlap.

### 2. Listing Consultant "Jane / Firas" not updating in the downloaded PDF

Root cause: the **Download PDF** button on the envelope page (`EnvelopeDetail.tsx` line 731) downloads `envelope.document_url`, which is the **last-rendered cached PDF**. If you edit Listing Consultant from "Jane / Firas" → "Jane" but don't click **Save** (or click Save but the regenerate hasn't completed before you click Download), the cached PDF still contains the old value. The on-screen preview always reflects `editValues`, so the screen looks right while the download is stale.

**Three-part fix:**

a. **Track unsaved edits.** Add a `dirty` flag (`true` when `editValues` ≠ persisted `template_field_values`). 

b. **Block stale downloads.** When `dirty === true`, the Download PDF / Download blank PDF / Export buttons either:
   - show an inline warning chip "Unsaved changes — save first" and become disabled, OR
   - automatically run Save → wait for regenerate → then download (preferred; one click).

c. **Force fresh PDF.** After every Save, append a cache-busting query param (`?v=<PAA_LAYOUT_VERSION>-<updated_at>`) to the download URL so even CDN-cached PDFs are bypassed.

d. **Strip stale separators.** When rendering `listing_consultant` (line 442), defensively `.split(/\s*\/\s*/).filter(Boolean).join(", ")` so any old "/" left in the DB value renders as a clean comma list — not "Jane / Firas". (User-typed value with no slash is unaffected.)

### 3. Header — add classy clickable contact block under the doc number

The `monogram-wordmark` header already has the structure the user described:
- monogram → vertical gold divider → legal company name (+ RERA permit) → doc number on the right
- gold gradient bar → centered "PROPERTY ADVERTISING AGREEMENT — LEASING/SELLING" title

What's missing: under the doc number on the right, the user wants **phone · email · website**, premium gold/ink mix, all clickable.

**Fix:** in the right-hand column of the header (after `docBadge`), add:

```
+971 54 716 7107      ← <a href="tel:+971547167107">, ink color, weight 600
Contact@JBJ.AE        ← <a href="mailto:Contact@JBJ.AE">, gold #B89555
www.jbj.ae            ← <a href="https://www.jbj.ae">, gold #B89555, letter-spacing
```

All three: `text-decoration: none`, `font-size: 9.5px`, right-aligned, 2px line spacing, no underline by default — gold pops as the accent.

### 4. Make every contact in the FOOTER clickable too

In `footerHtml` (the `three-column` style at line 254), the phone, email, website are currently plain text. Wrap each in the same `<a>` tags as the header (same `tel:` / `mailto:` / `https:` pattern). Same colour scheme, no visible underline so the footer stays clean.

This satisfies the user's rule: "Anytime you put the email, number, or website, it has to be clickable — header or footer or anywhere."

### 5. Bump layout version

`PAA_LAYOUT_VERSION` 16 → 17 so all open envelope previews pick up the new chrome and the underline fix immediately, and so the cache-bust in step 2c uses the new value.

---

**Files touched:**
- `src/templates/jbjPropertyAdvertisingAgreement.ts` — items 1, 3, 4, 5 + listing_consultant `.split('/')` cleanup in item 2d.
- `src/pages/e-signature/EnvelopeDetail.tsx` — items 2a, 2b, 2c (dirty flag + auto-save-on-download + cache-busted URL).

No DB or edge-function changes.
