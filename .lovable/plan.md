## Three fixes to the PAA template (`src/templates/jbjPropertyAdvertisingAgreement.ts`)

### 1. Property Specs — single compact row

Today section 3 renders three separate chip rows (type, status, tenure). Collapse the first row so **Property Type + Furnishing + Vacant/Tenanted** all sit on one wrap-friendly line, with thin `|` separators. Tenure + Usage stay on the second line. Vacating-date chip moves inline at the end of row 1 only when Tenanted+date present.

Result: ~40% less vertical space, mirrors Form A density.

### 2. Property Identifiers — why it looks empty + fix

It is empty because every `fu()` call has `force: !!value`, so a field renders **only when the user has typed something**. With a fresh draft, none of Title Deed / Oqood / DEWA / Makani / RERA Permit have values → the section title shows but the row is blank.

Fix: in **edit mode** (`!isFinal`) render a faint "—" placeholder underline for every identifier so the section visibly lists what is expected (Title Deed No., Title Deed Date, Oqood No., Oqood Date, Expected Handover, DEWA Premise No., Makani No., RERA Permit No.). In **final mode** keep current behaviour (only filled values render) so the locked PDF stays clean.

This also confirms to you exactly which 8 fields belong in that section.

### 3. Footer flush to A4 bottom — no blank gap below divider

Current wrapper is `min-height:1123px` flex column. The body region (`flex:1 1 auto`) does expand, but the signature row sits at the *top* of that body region, leaving the slack between footer divider and page bottom rather than between signatures and footer.

Fix:
- Add `margin-top:auto` to the `Landlord` signature section so it is pushed to the **bottom of the body region** (just above the footer).
- Tighten footer top spacing (`margin-top:14px → 10px`) and ensure footer is `flex:0 0 auto` with no trailing padding.
- Body wrapper already `display:flex; flex-direction:column; flex:1 1 auto` — keep.
- Bump `PAA_LAYOUT_VERSION` 15 → 16 so existing previews re-render.

Net effect: the empty space relocates to *between landlord signatures and the footer divider*, the footer hairline + 3-column row sit flush at the A4 bottom, and the page does not overflow to a 2nd page.

### About your other question — "where can I check what was built?"

The Approve & Lock + AI Co-Pilot from the previous turn live on the **same envelope page you are on now** (`/e-signature/810df24a-...`):

- **AI Co-Pilot** → "AI Co-Pilot" button in the action bar above the document → opens a side drawer with a chat box. Type e.g. "set rent to 180k AED, 4 cheques" and click Apply.
- **Approve & Lock** → "Approve & Lock" button next to it → freezes fields, regenerates the PDF in `final` mode, and replaces "Edit" with "Unlock".
- **Listing Draft card** → appears above the Details card on this same page once the envelope is a PAA, with image uploader and "Approve & Publish Listing".

I'll do the 3 template fixes above on approval; no DB or edge-function changes needed.
