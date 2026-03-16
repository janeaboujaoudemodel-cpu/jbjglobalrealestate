

## Plan: Replace All Black Backgrounds with Champagne Gold Across Entire Website

### Scope

The target champagne color is the gradient used throughout the platform:
```
bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]
```
Or simplified as a single solid: `bg-[#E8DCC8]` for simpler containers.

This affects **105+ page files** and **50+ component files** that currently use `bg-black` as their background layer. The change is strictly cosmetic — replacing background colors only, not touching layout, logic, or content.

### What Changes

**Category 1: Page-level wrappers** (~105 files in `src/pages/`)
Every `min-h-screen bg-black` outer div gets replaced with `min-h-screen bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]`.

Examples: Index.tsx, Contact.tsx, Awards.tsx, Philanthropy.tsx, CompanyProfile.tsx, MarketReport.tsx, all toolkit pages, all service pages, all market-intelligence pages, all executive pages, all broker pages, all FAQ pages, etc.

**Category 2: Section-level `bg-black`** (~200+ instances)
Inner sections like `<section className="py-16 bg-black">` get the same champagne gradient replacement.

**Category 3: Footer** (`src/components/Footer.tsx`)
All `bg-black` instances (lines 436, 438, 450, 452, 454, 516, 687, 703, 711, 897, 905) replaced with the champagne gradient. Text colors that were `text-white` will need to become `text-black` or `text-zinc-800` for contrast. Links that were `text-zinc-400` become `text-zinc-600`. Gold accents remain gold.

**Category 4: NewsletterBand** (`src/components/NewsletterBand.tsx`)
Line 14: `bg-black` → champagne gradient.

**Category 5: Dashboard components**
- `VisitorDashboard.tsx`, `StandardUserDashboard.tsx` — `bg-black text-white` → champagne + dark text.

**Category 6: Loading states**
Multiple files have `bg-black flex items-center justify-center` for loading spinners — all get champagne.

### What Does NOT Change
- Video hero overlays (`bg-black/60`, `bg-black/40`) — these are transparency layers on video, not page backgrounds.
- Modal overlays (`bg-black/80`) — standard backdrop behavior.
- Small UI elements like icon containers (`bg-black` on a 16x16 circle) — contextual, not page backgrounds.
- Tool-specific dark UIs (Video Studio, Voice Studio, AI tools with dark editor interfaces) — these are functional dark UIs, not page backgrounds. However, their outer wrapper will change.
- `bg-zinc-900/90` badge in footer — becomes champagne-tinted.

### Text Color Adaptation
When background changes from black to champagne, all text must adapt:
- `text-white` → `text-black` or `text-zinc-900`
- `text-zinc-300/400` → `text-zinc-600/700`
- `text-gold` → stays `text-gold` (works on both)
- `border-zinc-800` → `border-gold/30` or `border-zinc-300`

### Implementation Approach
Due to the massive file count (150+ files), this will be executed in batches:
1. **Batch 1**: Core layout files — Footer.tsx, NewsletterBand.tsx, Index.tsx, MainLayout.tsx
2. **Batch 2**: High-traffic pages — Contact, Communities, AreaGuides, Properties, Services
3. **Batch 3**: All remaining pages (alphabetical sweep through src/pages/)
4. **Batch 4**: Components with standalone bg-black (dashboards, business suites, FAQs)

### Files Summary
- ~105 files in `src/pages/` (page wrappers)
- ~15 files in `src/components/` (Footer, NewsletterBand, dashboards, business suite cards, FAQ hero, etc.)
- Total: ~120 files modified

