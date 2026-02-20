
# Verification Report & Fix Plan — Corporate Suite

## Findings Summary

### Issues Found (4 bugs to fix)

---

### Bug 1 — Company Profile route is missing (Critical)

`CompanyProfileBuilder` is imported in `App.tsx` (line 42) but has **no registered route**. The Corporate Suite hub card points to `/toolkit/corporate-suite/company-profile`, but navigating there shows a blank page.

**Fix:** Add one route line in `App.tsx`.

---

### Bug 2 — Logo Creator "Save to Brand Assets" will fail at runtime (Critical)

The `design_assets` table schema (from the live database) has:

```
file_url: string  ← REQUIRED (not nullable)
```

There is **no `svg_content` column**. `LogoCreator.tsx` line 204–209 does:
```typescript
await supabase.from("design_assets").insert({
  svg_content: logo.svgContent,   // column doesn't exist
  // file_url is missing entirely — required field!
} as ... never);                  // TypeScript cast hack to hide the error
```

This will throw a Supabase error every time. The SVG content needs to be stored differently — either as a data URL in `file_url`, or uploaded to storage as a `.svg` file.

**Fix:** Store the SVG as a data URI in `file_url` (e.g., `data:image/svg+xml;base64,...`) which is a valid URL string and fits the column. Remove the broken `as never` cast.

---

### Bug 3 — Stamp Bold/Italic/FontSize controls have no effect on the stamp grid (Critical)

The UI for Bold, Italic, and Font Size exists and the state variables (`fontBold`, `fontItalic`, `manualFontSize`) update correctly — but they are **never applied to the SVG renderer**:

- `StampSVGRenderer` only has one typography prop: `fontFamily`. It has no `fontWeight`, `fontStyle`, or `fontSize` props.
- The concept grid's `ConceptCard` (line 1012) only passes `fontFamily` — never passes bold/italic/size.
- The "Selected Preview" panel (line 668) does a broken workaround: it concatenates CSS properties into the fontFamily string (`font-weight:bold;Arial`), which won't work because `StampSVGRenderer` replaces `font-family="..."` attribute values, not inline style properties.

**Fix (three-part):**
1. Add `fontWeight`, `fontStyle`, `fontSize` props to `StampSVGRenderer` — apply them via regex replacements on the SVG source (replacing `font-weight="..."`, `font-style="..."`, and `font-size="..."` attributes).
2. Pass `fontBold`, `fontItalic`, `manualFontSize` through `ConceptCard` to `StampSVGRenderer`.
3. Fix the "Selected Preview" rendering call to pass them separately.

---

### Bug 4 — "Company Profile" hub card exists but tool has no dedicated builder route

The Corporate Suite hub shows 12 tools including "Company Profile" pointing to `/toolkit/corporate-suite/company-profile`. The `CompanyProfileBuilder` component exists at `src/components/corporate-suite/CompanyProfileBuilder.tsx` but is unused — no route is registered.

This is the same as Bug 1 (missing route for `CompanyProfileBuilder`).

---

## What is NOT broken

- Logo Creator page itself loads correctly (route is registered at line 716).
- Logo generation via `ai-logo-generator` edge function is wired up properly.
- Stamp color system, font family selector, text editor, and favorites all work.
- Bold/Italic/FontSize **UI controls** render correctly and toggle state — only the SVG rendering doesn't respond.
- All other Corporate Suite tools have valid routes.

---

## Technical Implementation Plan

### File 1: `src/App.tsx`
Add missing route:
```tsx
<Route path="/toolkit/corporate-suite/company-profile" element={<CompanyProfileBuilder />} />
```

### File 2: `src/components/corporate-suite/LogoCreator.tsx`
Fix `handleSaveToAssets` to store SVG as a base64 data URI in `file_url`:
```typescript
const svgBase64 = btoa(unescape(encodeURIComponent(logo.svgContent)));
const dataUri = `data:image/svg+xml;base64,${svgBase64}`;

await supabase.from("design_assets").insert({
  user_id: session.user.id,
  asset_type: "logo",
  name: `${name} Logo`,
  file_url: dataUri,        // required field — store SVG as data URI
});
```

### File 3: `src/components/stamp-generator/StampSVGRenderer.tsx`
Add 3 new props and apply them via regex on the SVG source:
```typescript
interface Props {
  // ... existing ...
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  fontSize?: number | null;  // pt value, null = no override
}

// Inside the component, after fontFamily replacement:
if (fontWeight) {
  tinted = tinted.replace(/font-weight="[^"]*"/gi, `font-weight="${fontWeight}"`);
  tinted = tinted.replace(/font-weight:\s*[^;'"]+/gi, `font-weight:${fontWeight}`);
}
if (fontStyle) {
  tinted = tinted.replace(/font-style="[^"]*"/gi, `font-style="${fontStyle}"`);
  tinted = tinted.replace(/font-style:\s*[^;'"]+/gi, `font-style:${fontStyle}`);
}
if (fontSize != null) {
  // SVG font-size is in px; 10pt ≈ 13.3px but stamps use relative px values
  // We scale: replace existing font-size values proportionally
  // Simpler: override all non-tiny font-size attrs (> 4px)
  tinted = tinted.replace(/font-size="(\d+(?:\.\d+)?)"/gi, (_, px) => {
    const orig = parseFloat(px);
    if (orig < 4) return `font-size="${px}"`;
    return `font-size="${fontSize}"`;
  });
}
```

### File 4: `src/components/stamp-generator/StampGeneratorPage.tsx`
Pass bold/italic/size from state through to `ConceptCard` and the Selected Preview renderer:
```tsx
// ConceptCard interface — add 3 new props:
fontBold?: boolean;
fontItalic?: boolean;
manualFontSize?: number | null;

// In ConceptCard's StampSVGRenderer call:
<StampSVGRenderer
  fontFamily={fontFamily}
  fontWeight={fontBold ? "bold" : "normal"}
  fontStyle={fontItalic ? "italic" : "normal"}
  fontSize={manualFontSize}
  ...
/>

// In "Selected Preview" panel (line 668) — fix broken string concatenation:
<StampSVGRenderer
  fontFamily={fontFamily}
  fontWeight={fontBold ? "bold" : "normal"}
  fontStyle={fontItalic ? "italic" : "normal"}
  fontSize={manualFontSize}
  ...
/>
```

---

## Files Changed

| File | Change | Scope |
|---|---|---|
| `src/App.tsx` | Add `CompanyProfileBuilder` route | 1 line |
| `src/components/corporate-suite/LogoCreator.tsx` | Fix `handleSaveToAssets` to use `file_url` | ~8 lines |
| `src/components/stamp-generator/StampSVGRenderer.tsx` | Add `fontWeight`, `fontStyle`, `fontSize` props + regex replacements | ~20 lines |
| `src/components/stamp-generator/StampGeneratorPage.tsx` | Pass bold/italic/size to `ConceptCard` and both `StampSVGRenderer` calls | ~15 lines |

No database migrations needed. No new edge functions needed.
