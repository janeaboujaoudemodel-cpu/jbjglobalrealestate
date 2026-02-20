
# Brand Asset Library — End-to-End Fix Plan

## What Was Tested & What Was Found

### Test: Upload monogram PNG in Business Card → save → open CV Builder → verify logo appears in header with working size slider

### Result: FAIL — 2 critical bugs found

---

## Bug 1 (CRITICAL): Logo never renders in the CV Preview

The `CVPreview` component (line 133–138 of `CVResumeBuilder.tsx`) accepts these props:
```
data, template, scale, fontFamily, fontWeight, fontStyle, fontSizeOverride
```

`logoUrl` and `logoSize` are **completely absent** from the props. The state variables are declared (lines 765–766), and the `BrandAssetLibrary` correctly writes to `setLogoUrl` and `setLogoSize`. But when `CVPreview` is called (lines 1304–1310 and 1325–1330), **neither `logoUrl` nor `logoSize` is ever passed in**. The logo is uploaded, saved, even selected — but never shown anywhere in the preview or the PDF export.

The fix requires:
1. Add `logoUrl?: string` and `logoSize?: number` to the `CVPreview` props interface
2. Inside each of the 12 template render blocks, add a small logo `<img>` positioned in the header area
3. Pass `logoUrl={logoUrl}` and `logoSize={logoSize}` at both `CVPreview` call sites (lines 1304 and 1325)

---

## Bug 2 (MINOR): RLS SELECT policy on storage missing `UPDATE`

The `brand-assets` storage bucket is `public: true` (confirmed in DB), meaning uploaded files are accessible via their public URL without auth. The SELECT RLS policy restricts reads to the owner's folder but since files are public, this is fine — uploaded monograms **will** be accessible cross-tool by URL. No fix needed here.

---

## Bug 3 (UX): Size slider in CV Builder shows `%` label but `sizeMin=30, sizeMax=120`

The slider label reads `"Logo Size"` with a `%` suffix (from `BrandAssetLibrary` line 287: `{sizeValue}%`). But the range is `30–120` — which is actually a pixel-based width. The label should say `px` not `%`, or the range should be `50–200%`. This is confusing to users. Fix: change `sizeLabel` to `"Logo Width (px)"` in the CV Builder call.

---

## Implementation Plan

### File: `src/components/corporate-suite/CVResumeBuilder.tsx`

**Change 1 — Add `logoUrl` and `logoSize` to `CVPreview` props** (lines 133–138):
```typescript
function CVPreview({
  data, template, scale = 1,
  fontFamily, fontWeight: fwProp, fontStyle: fsProp, fontSizeOverride,
  logoUrl, logoSize = 80,
}: {
  data: CVData; template: Template; scale?: number;
  fontFamily?: string; fontWeight?: string; fontStyle?: string; fontSizeOverride?: number | null;
  logoUrl?: string; logoSize?: number;
}) {
```

**Change 2 — Render logo in each template's header block**

A `LogoBadge` helper renders the logo consistently across templates:
```typescript
const LogoBadge = logoUrl ? (
  <img 
    src={logoUrl} 
    alt="Logo"
    style={{ 
      height: (logoSize / 100) * 48 * scale,  // scale relative to base 48px
      maxWidth: 120 * scale, 
      objectFit: "contain",
      flexShrink: 0
    }} 
  />
) : null;
```

Each template's header gets the logo in an appropriate corner position:
- **Executive**: top-right of the white content area header (alongside name)
- **Modern/Bold/TwoCol**: inside the colored header bar, right-aligned
- **Classic/Harvard/ATS/Minimal/etc.**: above the centered name block, right-aligned

**Change 3 — Pass logo props at both render sites** (lines 1304 and 1325):
```typescript
<CVPreview
  data={data} template={template} scale={0.85}
  fontFamily={cvFontFamily || undefined}
  fontWeight={cvFontBold   ? "bold"   : undefined}
  fontStyle ={cvFontItalic ? "italic" : undefined}
  fontSizeOverride={cvFontSize}
  logoUrl={logoUrl || undefined}
  logoSize={logoSize}
/>
```

**Change 4 — Fix size slider label** (line 965):
```
sizeLabel="Logo Width (px)"
```
(instead of `"Logo Size"` which displays with `%`)

---

## How It Works After the Fix

```text
User in Business Card Designer:
  1. Opens Brand Assets panel
  2. Uploads "JBJ_monogram.png" → saved to brand-assets bucket + design_assets table
  3. Clicks "Use" → gold checkmark appears, logo renders on card

User switches to CV Builder:
  1. Opens Brand Assets panel
  2. The SAME "JBJ_monogram.png" appears in the grid (shared DB/storage by user_id)
  3. Clicks it → logoUrl state set
  4. Live preview updates — logo appears in CV header at correct position for template
  5. Size slider (30–120 px) controls the logo width in real time
  6. Export PDF includes the logo in the header
```

---

## Files to Change

| File | Lines Changed | What |
|---|---|---|
| `src/components/corporate-suite/CVResumeBuilder.tsx` | ~133–138, ~1304–1310, ~1325–1330, ~965 | Add `logoUrl`/`logoSize` props to `CVPreview`, render logo in all 12 templates, pass props at call sites, fix size label |

No database changes, no edge function changes, no new dependencies.

---

## Template-by-Template Logo Placement

| Template | Logo Position |
|---|---|
| Executive | Top-right of white content area, aligned with name |
| Modern, Bold, TwoCol | Inside colored header bar, far right |
| Classic, Harvard, ATS, Minimal, Europass, Academic, Creative, Timeline | Top-right corner, above the name block |
