
# Stamp Generator — Full Bug Fix Plan

## All Issues Found (Root Cause Analysis)

### Bug 1 — Text Overflows the Circle / Touches Border

**Root cause in `stampTemplates.ts` T12 (Bilingual Logo Center):**
The arc text paths use `arcR = R - 11` (radius 105) while the outer circle is `R = 116` with a 2.4px stroke. The text sits directly inside the outermost ring with zero safe-zone buffer. For long company names the text will physically overlap the outer circle stroke.

**Root cause in `LiveStampPreview.tsx`:**
The arc radius is `innerRx - 6` which can still cause text to touch the visible ring. No clipping guard is applied to the text content in round stamps.

**Fix:**
- In `stampTemplates.ts` T12: reduce arcR by an additional 6px → `arcR = R - 17` (from R-11). This gives text a guaranteed 6px clearance from the inner ring.
- In all other templates (T1, T3, T5, T9, T10) where `ringTextR = R - 7` (text sits inside the filled band): this is correct — the filled band is a solid color so the text is white and contained. No change needed.
- In `LiveStampPreview.tsx`: add a `clipPath` on the text group using `innerRx - 4` radius to hard-clip text within the stamp boundary.
- For the city/country line below the center logo in T12: the `divBot + 17` and `divBot + 28` vertical positions must be clamped to `cy + innerR - 10` max. Currently `divBot = cy + logoSize/2 + 14 = cy + 46`. For a circle of `innerR = 100`, this puts city text at `cy + 63` which is inside the circle. But if density includes regNo, `divBot + 28 = cy + 74` which can be too close to `innerR = 100`. Add a max clamp: only show regNo if `divBot + 28 < cy + innerR - 8`.

---

### Bug 2 — Monogram Disappears After Generate (in StampGeneratorPage)

**Root cause:**
In `StampGeneratorPage.tsx`, when concepts are generated, the project data stored in state comes from the initial DB load (`loadProject()`). The `monogram_text` and `icon_style` fields are saved to the DB during `handleCreate()` in `StampProjectWizard.tsx`. However the `generateConcepts()` function uses `latestProject = { ...p, ...project }` where `p` is the argument and `project` is state.

The critical issue: **`icon_style` in the DB and in `stampTemplates.ts` is checked via `project.icon_style === 'MONOGRAM'`** and **`project.monogram_text`**, but when `generateStampConcepts()` is called client-side, it receives the project object. If the DB saved `icon_style: 'MONOGRAM'` but `monogram_text: null`, the template correctly falls back to `name.slice(0, 2)`. This should work.

**The real bug:** Looking at line 145-146 in `stampTemplates.ts`:
```typescript
const mono = (project.monogram_text || name.slice(0, 2)).toUpperCase().slice(0, 3);
const hasMono = project.icon_style === 'MONOGRAM';
```
And in T12 (lines 715-716):
```typescript
const hasLogo = project.icon_style === 'UPLOADED_LOGO' && (project as any).uploaded_logo_url;
```
The `centerArt` block only shows the monogram disc when `!hasLogo`. So if `icon_style === 'MONOGRAM'`, `hasLogo` is `false`, and the monogram disc IS rendered. This should show the monogram.

**Actual root cause — found:** The wizard's `handleCreate()` at line 243 sets:
```typescript
monogram_text: form.monogram_text || null,
```
And the `StampLicenseUploader` in the wizard page (lines 310-344 of StampProjectWizard.tsx) extracts company data and calls `set('company_name', ...)` but **never sets `icon_style` or `monogram_text`**. The default `icon_style` is `'MONOGRAM'` but `monogram_text` is blank. So the auto-filled monogram is `name.slice(0, 2)` — that part is correct.

**Real root cause of the disappearing monogram** — in `StampGeneratorPage.tsx` line 723-731 when the license uploader fires `onExtracted`:
```typescript
const updatedProject = {
  ...project,
  ...(data.company_name && { company_name: data.company_name }),
  // ...
};
setProject(updatedProject);
setTimeout(() => generateConcepts(updatedProject), 300);
```
The `updatedProject` correctly carries `icon_style` from the DB project. So the monogram should appear.

**The real bug is a different one**: After clicking "Generate One" (which navigates from wizard to the generate page), if the user set `icon_style = 'MONOGRAM'` but there are already saved designs in the DB from a previous generation (with `icon_style = 'NONE'`), `loadProject()` loads those old designs from DB and the new icon_style change is NOT re-generated.

**Fix:** In `StampGeneratorPage.tsx` `loadProject()`, after loading the project, always call `generateConcepts(data)` fresh when the URL includes a `?fresh=1` param OR when `project.icon_style` changed since last generation. Simpler fix: add a "Regenerate" auto-trigger when `project.icon_style === 'MONOGRAM'` and the loaded concepts don't show a monogram. Even simpler: **remove the early return on existing designs** — always regenerate after wizard navigation. The existing designs check at lines 146-161 that reuses old SVGs from DB is the root cause:

```typescript
if (existing && existing.length > 0) {
  // ... loads OLD designs — skips regeneration
  setFavoriteConcepts(favs);
  setConcepts(regular);
} else {
  generateConcepts(data); // only generates when no prior designs
}
```

**Fix:** After the wizard creates a project, add a `?fresh=1` query param on the navigate URL. In `StampGeneratorPage.tsx`, check for `?fresh=1` and always call `generateConcepts(data)` regardless of existing designs.

---

### Bug 3 — Monogram Cannot Be Added from the Generate/Edit Screen

**Root cause:** There is no monogram input field in `StampGeneratorPage.tsx`. The user can only set it in the wizard (Step 2). Once they're on the generate page, there's no way to add or change the monogram.

**Fix:** Add a "Monogram" section to the left panel's existing "Text" tab in `StampGeneratorPage.tsx`. Add a small input field + icon_style selector (None / Monogram) that updates `project` state locally and auto-calls `generateConcepts()` with the updated project.

---

### Bug 4 — Secondary/Accent Color Not Applying (Color Picker Has No Effect)

**Root cause in `StampSVGRenderer.tsx`:**
```typescript
if (secondaryColor) {
  tinted = tinted.replace(/#2a3a5c/gi, secondaryColor);
}
```
The templates in `stampTemplates.ts` use `COLOR = '#1a2744'` for ALL elements. **No element uses `#2a3a5c`** in any template. The secondary color replacement targets `#2a3a5c` which is never present in the generated SVG — so clicking "Secondary" and changing the color does absolutely nothing visible.

The accent color targets `dominant-baseline="central"` elements — this only affects monogram text elements. If there's no monogram showing, it also has no visible effect.

**Fix in `StampSVGRenderer.tsx`:**
1. Change secondary color replacement to target a real color that exists in the SVGs. The inner ring strokes and decorative elements are all `COLOR = '#1a2744'`. A better approach: have the templates mark secondary elements with a distinct placeholder color `#2d4a7a` on inner rings/bands, and then `StampSVGRenderer` replaces `#2d4a7a` with `secondaryColor`. **OR** — simpler approach: change the secondary replacement to target the **`#ffffff`** fill on the band overlays (the white circles that create the ring gap). This lets the user change the band background color.
2. **Better approach**: Add a `data-role` approach in the SVG templates — mark specific elements with a secondary color `#2a3a5c` on some elements (the inner ring stroke, the inner band fill in multi-ring templates). We update `stampTemplates.ts` to use `#2a3a5c` on inner rings, so secondary color replacement has a real target.

**The fix:** In `stampTemplates.ts`, change the inner accent ring circles from `stroke="${COLOR}"` to `stroke="#2a3a5c"` in T1, T2, T3, T6, T7, T10, T12. This gives the secondary color picker a real target (inner rings become a different color from the outer border). This is how professional stamp software works — outer border is primary, inner rings/accents are secondary.

---

### Bug 5 — Uploaded Logo Not Showing in Generated Concepts

**Root cause:** In `StampProjectWizard.tsx`, the logo is stored as a base64 dataUrl in `form.uploaded_logo_url`. When the project is saved to DB via `handleCreate()`, `uploaded_logo_url: form.uploaded_logo_url || null` saves the full base64 string. When `generateStampConcepts()` runs T12, it checks:
```typescript
const hasLogo = project.icon_style === 'UPLOADED_LOGO' && (project as any).uploaded_logo_url;
const logoUrl = hasLogo ? (project as any).uploaded_logo_url : null;
```
This should work IF `uploaded_logo_url` is in the project object. BUT `stamp_projects` DB table may not have an `uploaded_logo_url` column — it depends on whether the migration included it.

**Fix:** Check if `uploaded_logo_url` is in the DB schema. Also ensure the `<image>` tag in the SVG is preserved by DOMPurify. Currently `StampSVGRenderer.tsx` uses:
```typescript
ADD_ATTR: ['clip-path', 'dominant-baseline', ...]
```
**`href` is not in `ADD_ATTR`!** DOMPurify strips `href` from `<image>` elements by default (it treats href as a potential XSS vector). The `<image href="${logoUrl}">` in T12 will be sanitized to `<image>` with no href, producing a blank image.

**Fix in `StampSVGRenderer.tsx`:** Add `'href', 'preserveAspectRatio', 'xlink:href'` to `ADD_ATTR`, AND add `ADD_TAGS: ['image']` to DOMPurify config.

---

### Bug 6 — Monogram Input Missing from the Edit/Generate Screen

**Fix (same as Bug 3):** Add a dedicated "Center Art" section in the left panel of `StampGeneratorPage.tsx` that allows:
- Selecting icon style (None / Monogram / Upload Logo)
- Typing monogram letters (1-3 chars)
- Uploading a logo image
- Clicking "Apply to Stamp" which calls `generateConcepts()` with the updated local project settings

---

## Files to Change

| File | Changes |
|---|---|
| `src/lib/stampTemplates.ts` | (1) T12: reduce `arcR` to `R-17` for safe text zone. (2) Add safe clamp for city/regNo y-positions in T12. (3) Change inner ring `stroke` in T1, T2, T3, T6, T7, T10, T12 from `COLOR` to `#2a3a5c` so secondary color targeting works. |
| `src/components/stamp-generator/StampSVGRenderer.tsx` | Add `href`, `xlink:href`, `preserveAspectRatio` to DOMPurify `ADD_ATTR`; add `ADD_TAGS: ['image']` so uploaded logos render. |
| `src/components/stamp-generator/StampGeneratorPage.tsx` | (1) Check for `?fresh=1` URL param and always regenerate when present. (2) Add "Center Art" section to left panel (icon style, monogram input, logo upload). (3) Pass `monogram_text` and `icon_style` updates to `generateConcepts()`. |
| `src/components/stamp-generator/StampProjectWizard.tsx` | On `handleCreate()` navigate to `.../${data.id}/generate?fresh=1` instead of `.../${data.id}/generate`. |
| `src/components/stamp-generator/LiveStampPreview.tsx` | Add a clipPath wrapper around all text content in round stamps to prevent overflow beyond the inner ring boundary. |

## Implementation Order

1. `StampSVGRenderer.tsx` — fix DOMPurify so image href is preserved (1 line change, highest impact — unblocks logo rendering)
2. `stampTemplates.ts` — fix T12 arc radius safe zone + inner ring colors for secondary color
3. `StampProjectWizard.tsx` — add `?fresh=1` to navigate URL
4. `StampGeneratorPage.tsx` — handle `?fresh=1`, add Center Art panel
5. `LiveStampPreview.tsx` — add clipPath guard in round stamps

## What This Fixes (Summary)

- Text will no longer touch or overflow the outer circle/border in any template
- Monogram selected in wizard will now correctly appear on first generate (fresh=1 forces regeneration)
- User can add/change monogram directly from the generate/edit screen without going back to wizard
- Secondary color picker will visibly change the inner ring color of all templates
- Accent color picker will change the monogram disc/center text color
- Uploaded logo will now correctly render inside T12's center circle
- Uploaded logo in LiveStampPreview (wizard sidebar) already works, now it also works post-generate
