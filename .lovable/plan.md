
# Company Profile Builder — Comprehensive Upgrade Plan

## What You're Asking For (Summarized)

1. **Logo placement control across all pages** — apply logo to all pages or selected pages in the PDF export, control its position (top-left, top-right, center, bottom), with a "Remove from all / selected pages" option.
2. **Full multi-page website crawl** — instead of scraping just the homepage, crawl multiple pages of the website to get richer content (About, Services, Team, Contact pages).
3. **Color palette sync** — extracted brand colors from Firecrawl's `branding` response must match what is shown in the palette swatches. Currently the palette swatches show default colors even when the live preview renders correctly.
4. **More templates** — add Canva-style professional templates (cover letter, copyright page, registration, etc.) — rich visual layouts, not just plain text.
5. **Full-size live preview** — the live preview should show the full A4 document with all pages rendered at a readable scale, not a tiny cramped single-card view.

---

## Root Cause Analysis

### Bug 1: Color palette not updating after extraction
Looking at line 392–404 of `CompanyProfileBuilder.tsx`, after Firecrawl scraping, the code correctly calls `setPalette(newPalette)` — but the Firecrawl `branding` field is sometimes nested as `data.data.branding.colors` (the Firecrawl v1 API wraps responses in a `data` envelope). The current code at line 343 tries both paths:
```typescript
const bc = scrapeData?.data?.branding?.colors || scrapeData?.branding?.colors;
```
However Firecrawl's branding endpoint returns `branding.colors` as named fields like `primary`, `secondary`, etc., while the scrape function sometimes returns them under different keys. The fix: log the raw response and use a smarter color-extraction fallback that parses any color-like hex values found in the response.

### Bug 2: Preview is too small and only 1 "card"
The `ProfilePreview` component (lines 134–219) renders a single scrollable div at `scale=0.55` — it is one continuous block, not paginated A4 pages. For a real "multi-page" look, we need to render multiple `A4Page` boxes, each at fixed 595×842 proportions, stacked vertically.

### Bug 3: Logo only goes to the PDF, not controlled per-page
The current PDF export (lines 530–548) places the logo only on the cover page. There is no UI for "apply to all pages" or "select which pages". This needs a `logoPages` state (Set of page indices or `"all"`) and a position picker.

---

## Plan

### Part 1: Fix Color Palette Sync

The `firecrawl-scrape` function already returns the `branding` object. The issue is the color field mapping. We will:
- Parse `scrapeData.data.branding` (the correct Firecrawl v1 path)
- Also extract dominant colors from `scrapeData.data.branding.colors` with fallback to CSS variables scraped from the page
- Map known field names: `primary`, `secondary`, `accent`, `background`, `textPrimary` → palette roles
- If Firecrawl branding colors aren't found, run a secondary AI call to infer colors from the markdown text (e.g., "gold, white, dark" → hex values)

**Code change**: `CompanyProfileBuilder.tsx` lines 341–404 — improve color extraction logic + add AI color inference fallback.

---

### Part 2: Multi-Page Website Crawl

Instead of one `firecrawl-scrape` call, we add a **"Deep Scan" toggle** in the URL panel:
- **Quick Scan** (default): scrapes only the provided URL — fast, good for single-page sites
- **Full Website Scan**: first calls `firecrawl-map` to discover all internal URLs, then scrapes up to 5 key pages (homepage, /about, /services, /team, /contact) and merges their markdown before sending to the AI

The `company-profile-ai` edge function already accepts `markdown` up to 8000 chars — we will increase the token limit to 800 and pass more comprehensive merged content.

**Code changes**:
- `CompanyProfileBuilder.tsx`: add `deepScan` boolean state, toggle in URL panel, update `extractFromUrl()` to conditionally call `firecrawl-map` then multiple `firecrawl-scrape` calls
- `supabase/functions/company-profile-ai/index.ts`: increase `max_tokens` from 400 to 800 for richer extraction

---

### Part 3: Logo Placement Controls (Per-Page)

Add a **Logo Placement** section inside the Brand Assets panel:

**New state:**
```typescript
type LogoPosition = "top-left" | "top-right" | "top-center" | "bottom-left" | "bottom-right";
type LogoPageMode = "all" | "cover-only" | "content-only" | "none";
const [logoPosition, setLogoPosition] = useState<LogoPosition>("top-right");
const [logoPageMode, setLogoPageMode] = useState<LogoPageMode>("all");
```

**UI inside the Brand Assets collapsible** (after logo size slider):
```
Logo Placement:
[Top-Left] [Top-Center] [Top-Right] [Bottom-Left] [Bottom-Right]  ← 5 position buttons

Apply Logo To:
[All Pages] [Cover Only] [Content Pages] [None]  ← 4 radio-style buttons
```

**PDF export update**: The `exportPDF` function will use `logoPosition` and `logoPageMode` to:
- On cover page: draw logo at `logoPosition` only if mode is `"all"` or `"cover-only"`
- On each content page (`ensureSpace` → new page): draw logo at `logoPosition` only if mode is `"all"` or `"content-only"`, using a smaller size (60% of `logoSize`)
- A helper `drawLogoOnPage(page, mode)` function handles the position math

**Live preview update**: `ProfilePreview` receives `logoPosition` and `logoPageMode` props and renders the logo accordingly in each page section.

---

### Part 4: Full Multi-Page Live Preview (A4 Pages)

Replace the current single-block `ProfilePreview` with a **paginated A4 preview** that renders each page as a separate white rectangle with correct proportions:

```
┌─────────────────────────┐
│   PAGE 1 — COVER        │  ← Dark or white cover
│   [Logo] [Company Name] │
│   [Tagline]             │
└─────────────────────────┘
┌─────────────────────────┐
│   PAGE 2 — ABOUT US     │  ← Content page
│   [Logo top-right]      │
│   About Us ─────────    │
│   Content text...       │
└─────────────────────────┘
┌─────────────────────────┐
│   PAGE 3 — SERVICES     │  ← Services grid
└─────────────────────────┘
```

Each "page" is a `div` with `aspect-ratio: 595/842`, rendered at a consistent scale. This replaces the current single-div approach.

**New structure for `ProfilePreview`:**
- `CoverPage` component — renders the cover
- `ContentPage` component — renders About Us + Services + Team + Contact, auto-splitting into multiple pages if content overflows (using estimated character counts)
- Both receive `logoUrl`, `logoPosition`, `logoPageMode`

---

### Part 5: More Templates (Canva-Style)

Add **6 new templates** to the `TEMPLATES` array, making it 9 total:

| ID | Name | Style |
|---|---|---|
| `premium` | Premium Gold | Dark cover, gold accents, serif (existing) |
| `executive` | Executive Blue | Navy cover, structured (existing) |
| `clean` | Clean White | Minimal (existing) |
| `corporate_red` | Corporate Red | Deep red cover, white content, bold headers |
| `modern_green` | Modern Green | Forest green, eco/sustainability feel |
| `luxury_black` | Luxury Black | All-black with silver accents |
| `cover_letter` | Cover Letter | Letter format, formal tone, signature line |
| `copyright` | Copyright / Legal | Official look, legal/IP document format |
| `magazine` | Magazine Style | Full-bleed hero image area, editorial columns |

Each template will define: `coverBg`, `contentBg`, `accent`, `headerFont`, `bodyFont`, `coverTextColor`, `sectionStyle` (`"card" | "list" | "underline"`).

The template picker will have a horizontal scroll gallery instead of a fixed 3-column grid.

---

## Files to Be Changed

| File | Change |
|---|---|
| `src/components/corporate-suite/CompanyProfileBuilder.tsx` | Full upgrade — multi-page preview, logo placement controls, deep scan toggle, color fix, new templates, improved URL crawl |
| `supabase/functions/company-profile-ai/index.ts` | Increase `max_tokens` to 800; add smarter color inference action |

No new edge functions needed — everything uses existing `firecrawl-scrape`, `firecrawl-map`, and `company-profile-ai`.

---

## Visual Summary of Changes

```text
BEFORE (current):
┌──────────────────────┐
│ URL Panel            │  → scrapes 1 page only
│ Colors: wrong/stale  │  → palette doesn't match preview
│ Preview: 1 tiny card │  → not paginated
│ Logo: cover only     │  → no placement control
│ 3 templates          │  → limited choices
└──────────────────────┘

AFTER (this plan):
┌──────────────────────────────────────────┐
│ URL Panel + Deep Scan toggle             │  → up to 5 pages crawled
│ Colors: matched from branding + AI       │  → palette = website colors
│ Preview: full A4 multi-page stack        │  → paginated, real document look
│ Logo: 5 positions × 4 page modes        │  → per-page control
│ 9 templates including Cover Letter       │  → Canva-level variety
└──────────────────────────────────────────┘
```

---

## Implementation Sequence

1. Fix color palette extraction (quick win, isolated to `extractFromUrl`)
2. Add `logoPosition` + `logoPageMode` state + UI controls in Brand Assets panel
3. Rebuild `ProfilePreview` into paginated A4 stack with `CoverPage` + `ContentPage`
4. Update `exportPDF` to use new logo placement logic + pass `logoPosition`/`logoPageMode`
5. Add deep scan toggle + multi-page crawl in `extractFromUrl`
6. Add 6 new templates to the `TEMPLATES` array + update template picker to scroll gallery
7. Increase `max_tokens` in `company-profile-ai` edge function
