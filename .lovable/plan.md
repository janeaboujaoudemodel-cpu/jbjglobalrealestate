## Three remaining PAA tweaks + where to test

All edits in `src/templates/jbjPropertyAdvertisingAgreement.ts`. Bump `PAA_LAYOUT_VERSION` 17 → 18 so every open envelope re-renders.

### 1. Property Specs — collapse onto one line

Today each chip group (`Property Type`, `Furnishing`, `Status`) renders on its own visual row in the final PDF because each chip prints its **label + selected value as a full segment** with thin dividers between them. On a 794px page this wraps.

**Fix:**
- In **final** mode (`isFinal === true`), render Property Specs as a single inline sentence:
  `Apartment · Furnished · Vacant` (or `… · Tenanted (Vacating 12 Mar 2026)`).
  - Drop the per-row `flex` containers and chip labels, output only the **selected value** per group, separated by a thin gold middle dot.
  - Keep `Tenure · Usage` on a second compact line (same dot separator).
- In **edit** mode, keep today's chip row UI so the user can still toggle.

Net result: Property Specs takes one line in the PDF, freeing ~24–32px of vertical space.

### 2. Property Identifiers — explain + auto-hide when empty

The fields in this section are the legal identifiers of the unit:

- **Title Deed No. / Title Deed Date** — for ready secondary properties
- **Oqood No. / Oqood Date** — for off-plan units (DLD pre-registration)
- **Expected Handover** — off-plan only
- **DEWA Premise No.** — utility account anchor
- **Makani No.** — Dubai Municipality 10-digit address
- **RERA Permit No.** — required to advertise

It's empty because none of these were typed in for this envelope. Two improvements:

a. **Auto-prefill** from the linked admin listing (when the PAA is created from / synced to a listing): pull `title_deed`, `oqood`, `dewa_premise`, `makani`, `rera_permit` directly into `template_field_values` on first render.

b. **In final mode, hide the Property Identifiers section entirely if every field is blank** (`fuPh` is replaced by a "no identifiers on file" check). In edit mode it stays visible so the user can fill it.

### 3. Footer hugs the page bottom — close the bottom gap

Current page wrapper (line 452):
`padding:24px 36px; min-height:1123px; display:flex; flex-direction:column;`

The signature block already has `margin-top:auto`, so slack collapses **above** the signatures (between rules and signature). The visible "gap below the footer" is the wrapper's **24px bottom padding** plus the footer's own `margin-top:14px`.

**Fix:**
- Wrapper padding → `padding:24px 36px 0;` (keep top + sides, drop bottom).
- Footer wrapper gets its own `padding:10px 0 14px;` so the gold hairline + 3-column row sit ~14px from the page edge — clean, balanced, still inside A4 safe zone.
- Add `padding-bottom:18px` to the signature grid so signature names don't kiss the footer hairline.

Result: gold hairline + footer text now anchor to the bottom of the A4 page; the slack moves up between the T&C ordered list and the Landlord signature row, exactly as requested.

### 4. Where to test

The PAA template renders in two places. Both are reached from the **Owner side menu → E-Signatures**:

1. **Studio (create new):** `/owner/e-signature/studio` → choose **Property Advertising Agreement** → fill fields → preview iframe shows the live template.
2. **Existing envelope:** `/owner/e-signature/envelope/:id` (the same URL the user shared, e.g. `/e-signature/810df24a-…`).
   - Click **Edit document** → change values (e.g. clear "Firas" from Listing Consultant).
   - The right-hand iframe re-renders live from `editValues` as you type.
   - Click **Save** → cached PDF regenerates.
   - **Download PDF** now auto-saves first if there are unsaved edits (from the previous fix), so the downloaded file always matches the screen.

Quick QA checklist after deploy:
- Open the same `810df24a` envelope, hit Edit, clear `listing_consultant` to "Jane", hit Save, then Download PDF → verify "Jane" appears (no slash, no Firas).
- Confirm Property Specs prints as one line in the downloaded PDF.
- Confirm the footer's gold hairline sits ~14px from the bottom edge with no white band beneath it.

### Layout version bump

`PAA_LAYOUT_VERSION` 17 → 18, so the cache-bust URL param invalidates every previously rendered PDF and forces fresh regeneration for all open envelopes.

---

**Files touched:**
- `src/templates/jbjPropertyAdvertisingAgreement.ts` — items 1, 2b, 3, 4 (version bump).
- (Optional, item 2a only) `supabase/functions/paa-sync-listing/*` to backfill identifiers when a listing is linked. Skip if the user wants pure template work.

No DB migrations.