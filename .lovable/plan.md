
# Fix: 5 Issues — Scroll-to-Top After Wizard, Header Padding, Typography/Density/Shape Previews, Dubai Arabic Label & "Ready to Get Started" Suppression

## Issues Identified

### Issue 1 — Clicking "Next" in Wizard Scrolls to "Ready to Get Started"
**Root Cause:** The stamp generator wizard pages (`/toolkit/stamp-generator/new`, `/projects`, `/generate`) are rendered inside `MainLayout.tsx`. `MainLayout` renders `CombinedContactNewsletter` (the "Ready to Get Started" section) and `Footer` for every non-back-office route. The stamp generator routes are NOT in `isBackOfficeRoute`, so the section renders below the page content. When the wizard creates a project and calls `navigate(...)`, the browser stays at its current scroll position. If the user had scrolled down or if the layout pushed scroll position downward, the "Ready to Get Started" section is visible. Additionally, `window.scrollTo(0,0)` is never called after navigation.

**Fix (two parts):**

**Part A — Suppress "Ready to Get Started" and Footer on all toolkit/stamp-generator routes:**
In `MainLayout.tsx`, expand the `isBackOfficeRoute` (or add a parallel `isToolkitRoute`) check to also exclude toolkit generator pages from rendering `CombinedContactNewsletter` and `Footer`:
```tsx
const isToolkitGeneratorRoute =
  location.pathname.startsWith('/toolkit/stamp-generator/') &&
  (location.pathname.includes('/new') ||
   location.pathname.includes('/generate') ||
   location.pathname.includes('/export') ||
   location.pathname.includes('/projects'));
```
Then:
```tsx
{!isBackOfficeRoute && !isToolkitGeneratorRoute && <CombinedContactNewsletter />}
{!isBackOfficeRoute && !isToolkitGeneratorRoute && <Footer />}
```

This ensures the "Ready to Get Started" section is completely absent from all stamp generator tool pages.

**Part B — Scroll to top on step advancement and on navigation:**
In `StampProjectWizard.tsx`, after calling `setStep(s => s + 1)`, immediately `window.scrollTo({ top: 0, behavior: 'auto' })`. Also in `handleCreate`, before `navigate(...)`, scroll to top.

---

### Issue 2 — Sticky Inner Header Still Touches the Global Header
**Root Cause:** The global header is `h-24 sm:h-28 lg:h-32`. `MainLayout` applies `pt-16 sm:pt-20 md:pt-24 lg:pt-28` to the `<main>` element for non-hero pages. However, the sticky inner header in `StampProjectWizard.tsx` uses `sticky top-24 sm:top-28 lg:top-32` — but the `<main>` pt already accounts for the global header at the top of the page scroll. When the page is at the top, the inner sticky header is at position `pt-value` from page top, then tries to stick at `top-24+`. The inner sticky bar uses `z-10` which is fine but its `top` offset should match the GlobalHeader exactly.

The real issue is that `MainLayout` adds only `pt-16 sm:pt-20 md:pt-24 lg:pt-28` (max 112px on lg) while the GlobalHeader is `h-32` (128px on lg). The sticky offset of `top-32` (128px) is correct. However, the `<main>` padding-top max is `lg:pt-28` = 112px, which is less than the header (128px). So the page content starts at 112px, but the GlobalHeader is 128px tall — the top 16px of content is hidden behind the header.

**Fix:**
Update `MainLayout.tsx` to use `pt-24 sm:pt-28 lg:pt-32` to perfectly match the GlobalHeader height (currently `h-24 sm:h-28 lg:h-32`). This single change fixes the overlap for ALL non-hero tool pages — not just the stamp generator.

Then the inner sticky headers in wizard/dashboard/generator/export can stay at `sticky top-24 sm:top-28 lg:top-32` (already set in previous fix) and they will correctly appear immediately below the global header.

---

### Issue 3 — Style Options (Typography, Density, Theme, Shape) Have No Visual Examples
**Root Cause:** All style options in Step 1 of the wizard are plain text `<OptionButton>` labels with no visual preview. Users cannot understand what "Serif" vs "Calligraphy" or "Classic" vs "Luxury" mean without examples.

**Fix — Add mini stamp SVG previews for each option:**

For each selector, render a small visual preview stamp SVG alongside the label. These are static CSS-only examples (no real SVG templates needed) that visually communicate the concept:

**Shape previews:** Show the actual geometric outline — a circle for ROUND, a horizontal oval for OVAL, a rectangle for RECTANGLE, a square for SQUARE. Each shape contains "JBJ" text so the user can see the layout:
```tsx
// Small shape preview component
function ShapePreview({ type }: { type: StampType }) {
  const shapeClass = {
    ROUND: 'rounded-full w-14 h-14',
    OVAL: 'rounded-full w-20 h-12',
    RECTANGLE: 'rounded-md w-20 h-12',
    SQUARE: 'rounded-md w-14 h-14',
  }[type];
  return (
    <div className={`border-2 border-current flex items-center justify-center text-[9px] font-bold tracking-widest ${shapeClass}`}>
      JBJ
    </div>
  );
}
```

**Theme previews:** Each theme button gets a small descriptive visual tag showing the aesthetic feel (colors + border weight):

| Theme | Visual cue |
|---|---|
| Classic | Double border, traditional serif layout |
| Modern | Clean single line, geometric monogram |
| Minimal | Single hairline border, sparse text |
| Luxury | Gold fill ring, ornate center |
| Bold | Thick border, heavy font weight |
| Vintage | Scalloped border, distressed look |

These are rendered as a small `24×24px` mini-stamp illustration with tailwind classes — no SVG needed.

**Typography previews:** Show the font name rendered in its own style using inline CSS `fontFamily`:

```tsx
const FONT_STYLES: Record<TypographyStyle, { fontFamily: string; label: string; sample: string }> = {
  SERIF: { fontFamily: 'Georgia, serif', label: 'Serif', sample: 'ABC' },
  SANS: { fontFamily: 'Inter, sans-serif', label: 'Sans-Serif', sample: 'ABC' },
  MONOSPACE: { fontFamily: 'Courier New, monospace', label: 'Monospace', sample: 'ABC' },
  CALLIGRAPHY: { fontFamily: 'Dancing Script, cursive', label: 'Calligraphy', sample: 'ABC' },
  GOTHIC: { fontFamily: 'Cinzel, serif', label: 'Gothic', sample: 'ABC' },
  ARABIC_MODERN: { fontFamily: 'Noto Naskh Arabic, serif', label: 'Arabic Modern', sample: 'أبج' },
};
```

Each button renders a large font sample on top and the label below, giving users an immediate feel for the typeface.

**More typography options to add:**
Currently only 4 options (SERIF, SANS, MONOSPACE, CALLIGRAPHY). Add:
- `GOTHIC` — cinzel/engraved style
- `ARABIC_MODERN` — Noto Naskh Arabic (for bilingual stamps)
- `CONDENSED` — tight tracking, industrial feel
- `DISPLAY` — large decorative capitals

**Density previews:** Instead of just 1–5 numbers, show a visual representation of how crowded the stamp looks. Each density button renders a tiny stamp outline with varying numbers of text lines:

```
Density 1: ○ (just company name)
Density 2: ○ (name + city)
Density 3: ○ (name + reg + city)
Density 4: ○ (name + reg + city + phone)
Density 5: ○ (all fields packed)
```

Render each as a tiny `48×48px` circle containing 1–5 horizontal lines of varying widths to represent text density.

**Border Style previews:** For each border type, render a small `40×40px` circle showing the actual border pattern:
- SINGLE: one thin circle border
- DOUBLE: two concentric circle borders  
- RING: thick filled ring
- DOTTED: dotted circle border
- ROPE: dashed/alternating border
- CUSTOM: ornate double line

---

### Issue 4 — "Dubai, الإمارات العربية المتحدة" — Arabic City/Country Standard
**Root Cause:** When the AI extracts a UAE city and the user is in bilingual mode, the `arabic_city` field placeholder says `دبي، الإمارات` but the user wants the standard format to be `Dubai, الإمارات العربية المتحدة` (English city name + Arabic country name).

**Fix:**
1. Update the placeholder text in the Arabic city field:
   - Placeholder: `دبي، الإمارات العربية المتحدة`
2. When the AI extracts city="Dubai" and arabic_city is empty, auto-populate arabic_city with `Dubai, الإمارات العربية المتحدة`
3. In the `ai-stamp-extract` edge function, update the prompt to specify: "For the arabic_city field, use the format: [English city name], [Arabic country name], e.g. 'Dubai, الإمارات العربية المتحدة'"
4. Client-side fallback in `StampProjectWizard.tsx`: if `city_optional` is filled but `arabic_city` is empty and language mode is bilingual, auto-fill `arabic_city` as `${city}, الإمارات العربية المتحدة`

---

### Issue 5 — "Ready to Get Started" visible on ALL pages (Global scope issue)
This is addressed in Issue 1 above. The key behavior change is: toolkit generator routes (wizard, projects dashboard, generate, export) should NOT render the global `CombinedContactNewsletter` and `Footer` sections since these are full-screen app-like experiences, not informational pages.

---

## Files to Change

| File | Changes |
|---|---|
| `src/components/MainLayout.tsx` | 1) Fix `pt` to `pt-24 sm:pt-28 lg:pt-32` to match GlobalHeader height exactly; 2) Add `isToolkitGeneratorRoute` check to suppress `CombinedContactNewsletter` and `Footer` on stamp generator tool pages |
| `src/components/stamp-generator/StampProjectWizard.tsx` | 1) Scroll to top on `setStep` and `navigate`; 2) Expand typography options to 6–8 fonts; 3) Replace plain text option buttons with visual preview buttons for Shape, Theme, Border, Typography, Density; 4) Auto-fill `arabic_city` with `Dubai, الإمارات العربية المتحدة` format; 5) Update placeholder text |
| `supabase/functions/ai-stamp-extract/index.ts` | Update arabic_city prompt to return format `City, الإمارات العربية المتحدة` |

## What Does NOT Change
- GlobalHeader component itself — no changes
- Auth/database/RLS — no changes  
- Any non-toolkit pages — Footer and CombinedContactNewsletter remain on all other public pages
- Stamp SVG templates, color wheel, text editor, export engine — untouched
- StampGeneratorPage (the generate page) — untouched
- StampExportPage — untouched
- StampProjectsDashboard — untouched (projects list page can keep Footer since it's more of a landing page)
