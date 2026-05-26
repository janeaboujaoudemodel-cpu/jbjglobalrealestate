## What's broken (from your screenshot)

1. **Studio is clipped under the site header & sidebar** — it's rendering inside the page layout instead of as a true full-viewport overlay, so the JBJ site header + left nav still show on top of it. That's also why you see "JBJ GLOBAL REAL ESTATE" twice (once from the site header, once from the document letterhead).
2. **Letterhead looks raw** — too champagne-heavy, no monogram, body text too dark, NAP repeated in header and footer.
3. **Footer looks horrible** — white gap above it (empty A4 padding), wrong phone number, the "This document is issued by … and is confidential" line you want removed, and the text isn't gold.
4. **No way to go truly fullscreen** to hide the dev-shell chrome while drafting.

## Fix plan

### 1. True full-viewport overlay (no more cropping)

`DocumentStudio.tsx` already uses `createPortal(overlay, document.body)` with `fixed inset-0 z-[100]`, but the site header sits on z-index ≥ `z-[100]`. Raise the studio overlay to `z-[2147483000]` (top-of-stack, same tier we use for global modals) and add `isolation: isolate`. Also wrap the portal root in a `position:fixed; inset:0` div that bypasses any parent `transform` (which would otherwise break `fixed` positioning — that's the actual reason it's getting clipped under the header on this page).

Add a small **"Fullscreen / Exit fullscreen"** toggle button in the topbar (between Signature/Stamp and Hide AI):
- Default: current overlay (already covers everything once z-index is fixed).
- Fullscreen mode: calls `document.documentElement.requestFullscreen()` so the browser chrome also hides — true distraction-free editing. Toggle icon `Maximize2 / Minimize2`.

Even when not in fullscreen, the overlay must cover the site header + sidebar completely. This is the primary fix for the "going back under the header / cropped" report.

### 2. Redesign locked letterhead (`LockedLetterhead.tsx` + `jbjLockedChrome.ts`)

New header composition (left → right, single row, never wraps):

```text
[ JBJ monogram ]   JBJ GLOBAL REAL ESTATE                           (right) tagline in gold
                   L.L.C · S.O.C                                            small uppercase
```

- **Monogram**: reuse the existing JBJ champagne monogram tile (same one we use in the listing cards top-left fallback — `src/utils/champagneInitialsFallback.ts` / brand monogram asset). 44px square, gold hairline.
- **Wordmark**: "JBJ GLOBAL REAL ESTATE" in **black** `#1A1A1A`, Inter 18px, weight 600, tracking tight.
- **Legal suffix**: a separate line under the wordmark — "L.L.C · S.O.C" in **gold** `#B89555`, 10px, uppercase, tracking 0.22em, with the dot separator the user asked for.
- **Right side of header**: NO address / email / website. Just a thin gold tagline "Dubai · United Arab Emirates" in gold 10px uppercase (or empty — see Q1 below).
- Header background stays champagne `#F7F2EA` with the 1px gold hairline bottom. All non-wordmark text becomes gold `#B89555`.
- Remove the "Locked letterhead" lock chip from on-canvas (it's noise; we'll keep it in the studio UI chrome instead).

Update `JBJ_BRAND` constants:
- `legalName` → `"JBJ GLOBAL REAL ESTATE"` (drop the duplicated LLC SOC tail since it's now the gold suffix line).
- Drop the placeholder phone `+971 4 000 0000` everywhere (it was fake).
- Keep `email`, `website`, `address` for the footer only.

### 3. Redesign locked footer (and kill the white gap)

- **Remove the white gap**: today the A4 body is `min-h-[700px]` with `bg-[#FDFBF7]` and the footer sits below it as a separate band — when the body is short, you see a tall white block. Change to: footer is rendered **flush** at the bottom of the body block (no min-h spacer below the content) and uses the same champagne `#F7F2EA` as the header so the page reads as one continuous sheet. The A4 sheet keeps a fixed visual height (`min-h-[1056px]` for true 8.5×11 at 96dpi) but the white "blank" area belongs to the editable body, not a gap above the footer.
- **Footer content (all gold `#B89555`, Inter, centered)**:
  - Line 1: `JBJ GLOBAL REAL ESTATE · L.L.C · S.O.C` (10px uppercase, tracking 0.22em).
  - Line 2: `Dubai, United Arab Emirates · contact@jbj.ae · www.jbj.ae` (10px, gold).
  - **Remove** the "This document is issued by … and is confidential" line completely.
  - **Remove** the fake phone number.
- Top border = 1px gold hairline. Background champagne `#F7F2EA`. Padding 18px 40px.

### 4. Apply the same chrome to exports

Mirror the new HTML in `jbjLockedChrome.ts` (`jbjHeaderHtml`, `jbjFooterHtml`, `wrapWithJbjChrome`) so PDF, DOCX, Print, and Email exports use the exact same redesigned letterhead/footer — no drift between preview and export.

### 5. QA pass

- Verify in `/owner/careers-portal?section=contracts` that the studio fully covers the site header + left nav (not clipped).
- Verify fullscreen toggle hides the browser chrome.
- Verify only ONE "JBJ GLOBAL REAL ESTATE" wordmark is visible inside the document.
- Verify monogram renders top-left of the letterhead.
- Verify footer has no white gap above it, all text is gold, no confidentiality line, no fake phone.
- Export a PDF and a DOCX from a Job Offer template and confirm the new chrome carries through.

## Questions before I build

1. **Header right side** — do you want a small gold tagline there (e.g. "Dubai · United Arab Emirates") or completely empty so the wordmark + monogram float alone with whitespace on the right? I'd recommend empty for the most premium feel.
2. **Phone number** — I'm removing the fake `+971 4 000 0000`. Do you want me to leave phone out entirely, or plug in a real number you'll give me?

I can default to: empty right side + no phone, if you don't reply — just say "go" and I'll proceed.