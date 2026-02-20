
# Business Card Designer & Stamp Generator — Comprehensive Fix Plan

## Summary of All Issues Raised

The user raised ~10 distinct problems spanning two tools (Business Card Designer and Stamp Generator) plus a request for a "Stamp" shortcut in the main tools area. Here is the full analysis and targeted fix plan.

---

## Issue 1 — QR Code Generates as a Plain URL (Not a Real QR)

**Root cause diagnosed**: The QR is built using `https://api.qrserver.com/v1/create-qr-code/`. When the user enables QR type "URL" with content like `https://yourwebsite.com`, the API returns a proper QR image — **but if `qrCustomContent` is empty AND `data.website` is also empty, `buildQrData` returns `"https://"` which Google opens as a redirect to itself**. The QR image itself is correct — the issue is the user is scanning a QR that encodes a bare URL with no domain, so the phone opens `https://` which Google handles as a search.

**Fix**: Validate that QR data is non-empty and meaningful before showing the QR. Add a guard in `buildQrData`:

```typescript
case "url": {
  const url = custom || data.website || "";
  // Ensure it has a real domain — not just "https://"
  if (!url || url === "https://" || url === "http://") return "";
  return url.startsWith("http") ? url : `https://${url}`;
}
```

When `qrDataStr` is empty string, the QR overlay and the preview thumbnail both disappear — the user gets a clear signal nothing is set.

---

## Issue 2 — QR Visibility: "Show on Front / Back / Both"

**Current state**: QR always shows on both sides (hardcoded). The `CardCanvas` shows QR whenever `qrEnabled && qrUrl`. Back page PDF embed also always draws it.

**Fix**: Add a new state `qrSide: "front" | "back" | "both"` (default `"both"`). Add a 3-button toggle UI in the QR panel. Pass `qrSide` into `CardCanvas`, and add a condition:

```typescript
const showQrOnThisSide =
  qrEnabled && qrUrl &&
  (qrSide === "both" || qrSide === side);
```

In the PDF export, pass `qrSide` and conditionally draw on front/back pages.

---

## Issue 3 — Reset Button Appears Faded and Doesn't Work

**Root cause**: The Reset button calls `setFieldPositions({ ...DEFAULT_FIELD_POSITIONS })` and `setLogoPos({ ...DEFAULT_LOGO_POS })`. This should work — but visually the button is styled with `text-[hsl(var(--muted-foreground))]` which looks disabled. The spread `{ ...DEFAULT_FIELD_POSITIONS }` creates a shallow copy, which is fine for an object of `{ x, y }` primitives.

**Actual bug**: The draggable field overlays only show/move when `editLayout === true`. When `editLayout` is false (unlocked), resetting positions has no visible effect. Users click Reset without enabling Edit Layout first, see nothing change, and think it's broken.

**Fix**: Make Reset always work AND add a visual confirmation. Also fix the button styling so it doesn't look disabled:

- Remove the faded `text-muted-foreground` class from the Reset button — make it a proper outlined button
- Add a `toast.success("Layout reset to defaults")` call
- If `editLayout` is false, also auto-enable it briefly or show a tooltip hint

---

## Issue 4 — Lock Layout Confusion (Shows Default Labels on Preview)

**Root cause**: When `editLayout = true`, the `CardCanvas` shows draggable overlays with labels ("Your Name", "Job Title", "Company Name") **in addition** to the `CardFace` which also renders those same labels. This creates a double-render effect — the template shows the data AND the overlay labels appear on top. When the user types real names, the overlay shows the real value too, making it look duplicated or confusing.

**Fix**: The draggable overlay should show the field value in a clearly distinct chip style (dashed border, semi-transparent dark bg). The key change is making overlay labels show only in edit mode as positional markers — they already do this, but the default text "Your Name"/"Job Title" shown when fields are empty clashes with the CardFace placeholder text.

Change the overlay labels to show a move-icon + field name instead of the actual data value:

```tsx
// In edit mode, show "≡ Name" not the actual name
<span style={{ fontSize: "9px", color: "#fff", whiteSpace: "nowrap" }}>
  {editLayout ? `≡ ${f.key === "name" ? "Name" : f.key === "title" ? "Title" : "Company"}` : ""}
</span>
```

This makes overlays clearly distinguish themselves from card content.

---

## Issue 5 — Per-Field Individual Lock

**Request**: Each field (name, title, company, logo, QR) should have its own lock so some can be dragged while others stay fixed.

**Implementation**:

Add a `lockedFields` state:
```typescript
const [lockedFields, setLockedFields] = useState<Set<string>>(new Set());
```

In `CardCanvas`, before `startDrag` / `startTouchDrag`:
```typescript
if (lockedFields.has(field)) return; // don't drag if locked
```

In each overlay chip, add a small 🔒 / 🔓 button that toggles the lock for that field. This requires passing `lockedFields` and a toggle callback down to `CardCanvas`.

---

## Issue 6 — Click Elements on Preview to Edit / Add Dividers / Shapes

**Request**: Click name/title/company on the preview to change font, add a gold divider, rearrange. This is the canvas-edit UX.

**Implementation**: When `editLayout = true` and a user clicks an overlay chip, open a small inline popover/toolbar above that element with:
- Font size stepper (+/-)
- Bold / Italic toggles
- "Add divider below" button (inserts a horizontal gold line element)
- "Delete" button (hides that field)
- "Visibility" toggle

Add an `elements` array to state that holds extra decorative items (dividers, shapes). Each element has `{ id, type: "divider" | "text-block", x, y, color, thickness }`. These are rendered as absolutely-positioned overlays in `CardCanvas`.

For dividers specifically — a horizontal colored line between name/title or title/company is a common request. These render as `<div style={{ height: 1, background: primary, ...positionFromState }}>`.

---

## Issue 7 — Color Wheel / Gradient / Opacity for Every Element

**Request**: Each element (QR, logo, divider, field) should have color wheel, gradient, transparency options.

**Scope note**: Full per-element gradient + opacity is a large feature. The pragmatic implementation for this sprint:

- The existing `ColorPickerSection` already has a native color input (color wheel). 
- Add opacity/transparency to the QR background: currently only `#ffffff`, `#f5f5f5`, `#000000` — add a "Transparent" option.
- For dividers, add a color picker (native `<input type="color">`) and opacity slider in the per-element toolbar.
- For logo: add an opacity slider in the Brand Assets panel (0–100%).

Full gradient per-element can be a phase 2 item. This gives 80% of the value.

---

## Issue 8 — Stamp Arabic City Showing English Instead of Arabic

**Root cause**: In `StampProjectWizard.tsx` line 319:
```typescript
const arabicCity = data.arabic_city || (city ? `${city}, الإمارات العربية المتحدة` : '');
```

When the license uploader extracts `city = "Dubai"`, it constructs `arabicCity = "Dubai, الإمارات العربية المتحدة"` — the city name is still English ("Dubai"), only the country suffix is Arabic. The `stampTemplates.ts` then uses `arabicCity` verbatim and renders it in the Arabic arc with the English word "Dubai".

**Fix in `StampProjectWizard.tsx`**: Map English city names to their Arabic equivalents:

```typescript
const ARABIC_CITY_MAP: Record<string, string> = {
  'dubai': 'دبي',
  'abu dhabi': 'أبوظبي',
  'sharjah': 'الشارقة',
  'ajman': 'عجمان',
  'ras al khaimah': 'رأس الخيمة',
  'fujairah': 'الفجيرة',
  'umm al quwain': 'أم القيوين',
};

const arabicCityName = ARABIC_CITY_MAP[city.toLowerCase()] || data.arabic_city || city;
const arabicCity = data.arabic_city || `${arabicCityName}، الإمارات العربية المتحدة`;
```

Also fix the `StampLicenseUploader` edge function / AI extractor — when it extracts `city: "Dubai"`, it should also extract or generate `arabic_city: "دبي"` directly.

---

## Issue 9 — Stamp Shape: Oval Not True Oval, Rectangle Not Wide Enough

**Root cause**: In `ShapePreview` in `StampProjectWizard.tsx`:
- OVAL: `w-16 h-10` → ratio is 1.6:1, fine visually but actual stamp SVG viewBox may not be true oval
- RECTANGLE: `w-16 h-10` → same dimensions as oval

In `stampTemplates.ts`, the OVAL and RECTANGLE shapes share similar dimensions. Need to:
1. Make OVAL preview `w-20 h-12` (ratio 5:3) and update the SVG `W/H` to reflect a true 3:2 ellipse
2. Make RECTANGLE preview `w-24 h-10` (ratio ~2.4:1) — wider, more rectangular

These are purely cosmetic SVG dimension changes in the stamp template generator.

---

## Issue 10 — Stamp Font Size Slider Maximum of 16 — Should Be Higher

**Current**: `min={6} max={16}` in `StampGeneratorPage.tsx` line 617.

**Fix**: Change to `max={24}` to allow larger font sizes. Also expand the descriptive text from "Range: 6–16 pt" to "Range: 6–24 pt".

---

## Issue 11 — Stamp Tool Shortcut in Main Toolkit Page (Outside Corporate Suite)

**Request**: Add the Stamp Generator as a shortcut card outside the Corporate Suite, alongside other tools in the main toolkit/tools section.

**Where to add**: The `src/pages/AIHub.tsx` already lists the stamp generator. The request is likely about having a direct shortcut card somewhere more visible — possibly a featured tools bar or quick access widget. Looking at the existing `AllToolsSuite` and `AIHub` pages, the stamp generator is already listed in `AIHub.tsx`. The user may mean adding it as a card visible from the home/toolkit page without needing to enter Corporate Suite.

**Fix**: Add the Stamp Generator card to the main toolkit landing page / featured tools section. If a "shortcuts" or "quick access" section exists at the top of the Toolkit or Home page, add a stamp card there.

---

## Files to Change

| File | Changes |
|---|---|
| `BusinessCardDesigner.tsx` | QR validation fix; `qrSide` state + UI (Front/Back/Both toggle); Reset button fix + toast; Edit overlay labels → field markers not data values; per-field lock state + UI; element overlay system (divider support); logo opacity slider; QR transparent background option |
| `StampProjectWizard.tsx` | Arabic city map (`Dubai` → `دبي`); OVAL/RECTANGLE shape preview dimensions |
| `StampGeneratorPage.tsx` | Font size slider `max` from 16 → 24; update hint text |
| `src/pages/AIHub.tsx` or `src/pages/toolkit/*.tsx` | Add Stamp Generator as prominent shortcut card |

---

## Implementation Order

1. `StampProjectWizard.tsx` — Arabic city map fix (simplest, highest impact, 10-line change)
2. `StampGeneratorPage.tsx` — Font size slider range
3. `BusinessCardDesigner.tsx` — QR URL validation + `qrSide` toggle
4. `BusinessCardDesigner.tsx` — Reset button styling + toast
5. `BusinessCardDesigner.tsx` — Edit overlay label fix (field markers)
6. `BusinessCardDesigner.tsx` — Per-field lock state + small lock icons on overlay chips
7. `BusinessCardDesigner.tsx` — Click-to-toolbar for field editing (font size, bold/italic, divider add)
8. `BusinessCardDesigner.tsx` — Divider element system (add/delete/reposition dividers)
9. `BusinessCardDesigner.tsx` — Logo opacity + QR transparent bg
10. Toolkit shortcut card for Stamp Generator

---

## What This Does NOT Change (Deferred as Phase 2)

- Full per-element gradient picker (3-stop gradient on every element) — complex enough for a separate sprint
- "Sticky preview always centered with tools on edges" layout — this would require a full page layout rewrite (panels around the edges like Canva) — significant UX overhaul deferred
- PDF preview while selecting fonts/borders — the existing live preview already updates in real-time; what the user sees in the sidebar IS live
