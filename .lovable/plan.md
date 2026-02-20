
# AI Home Finder — Complete UI Overhaul & Reelly Full Offline Mirror

## Problems Identified (Complete Audit)

### UI Issues in QuizResults.tsx

**1. "Download Report" button is faded / invisible**
The button uses `bg-white/10 border border-white/30 text-white` on a dark purple background — low contrast. Needs a solid, visible style.

**2. "Price from 0.0 million" showing**
The #1 Best Match card shows `AED ${(price/1000000).toFixed(1)}M` — when `price_from` is null, the display should show "Price on Request". The DB confirms Al Tay Hills and Arabian Hills Estate have `price_from = null` and `bedrooms_min = null`, confirming broken data is reaching the results.

**3. "No bedroom" showing as "To be announced"**
Same root cause — `bedrooms_min = null` for Al Tay Hills (Sharjah), Arabian Ranches 3, etc. The quiz filtering already skips projects WITH bedroom data that don't match. But when `bedrooms_min = null`, it passes the filter (soft exclusion). Projects with **both** no image AND no bedroom data AND no price should be fully excluded.

**4. "Media pending verification" text on cards**
`ProjectCard.tsx` line 219-224 uses `<VerifiedMedia>` which displays this text when the image array is empty. In QuizResults, the `ProjectCard` is given a `project` from the DB query. If the DB has no `images` and no `cover_image_url`, VerifiedMedia shows "Media pending verification". The quiz result query only filters on `cover_image_url || images.length > 0` at the React level — but `ProjectCard` renders `images[currentImageIndex]?.image_url` which maps to `project_images` rows, not `cover_image_url`. So if a project has a `cover_image_url` but no `project_images` rows, the card shows "Media pending verification".

**Fix needed:** Pass `cover_image_url` as fallback into `images[0]` inside the card when `images` is empty.

**5. "Sold Out" projects being recommended (Arabian Ranches 3)**
DB shows 873 sold-out projects. The quiz `getRecommendations()` already filters `is_sold_out` and sale_status. But QuizResults fetches from DB with `.neq("sale_status", "sold_out")` — this only catches the exact string "sold_out". The actual DB values are "Sold Out" (capitalized) or null for old projects with `is_sold_out = true`. The hard filter needs to also catch `is_sold_out = true`.

**6. "More Great Options" — 4 cards in one row, different sizes**
Line 360: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6` — but `ProjectCard` is a mixed-height flex card. 5 results total → 1 hero + 4 remaining → 4 cards in `lg:grid-cols-3` means 3 on first row + 1 on second row (not 4 per row). The "different sizes" comes from `ProjectCard` being `flex-1 flex flex-col` but the grid cells have different content heights. Fix: wrap each card in a `h-full` container.

**7. "Add Badge" button is faded with background**
Line 382: `border-purple-400/60 text-purple-200` on a dark purple card (`bg-zinc-900/80`) — `text-purple-200` is nearly invisible. Needs solid `text-white` or `bg-white text-zinc-900`.

**8. "Regenerate VIP" button is faded**
The Regenerate button at line 467: `bg-purple-700 hover:bg-purple-600 text-white` — this is actually ok, but it may be hidden because there's a "You've used your free property match. Upgrade to VIP for unlimited" message appearing somewhere from `useQuizUsage` or the PaymentModal. The VIP gate text needs to be hidden since the feature is free.

**9. AI Comparison / Property Consultant / "Want More AI Power" section**
Currently at line 414: a single `border border-purple-500/40 rounded-2xl p-6` wrapper already exists around the grid. But "Want More AI Power" (a third card) appears to be missing — only 2 cards render. User wants all AI tool cards inside one bordered container.

**10. Upgrade to VIP $100/year — hide it**
The `PaymentModal` is imported and a `showVipModal` state exists but `needsPayment = false` means it should never show. However, `useQuizUsage.markFreeUsed()` is being called which may trigger some "used free match" message. The VIP Upgrade messaging needs to be entirely hidden.

---

### Data Issues — Reelly Offline Mirror

The DB confirms:
- **1,660 projects** have `bedrooms_min = null` (out of 1,845)
- **611 projects** have `price_from = null`
- **10 projects** have `cover_image_url = null`
- **873 projects** are sold-out

The `reelly-complete-offline-save` function exists and correctly extracts all data from Reelly API. The `reelly-offline-orchestrator` fires it in batches. The daily sync already runs this at Step 8 with `mirror_images: false`.

**The problem:** The daily sync uses `mirror_images: false` (skipping image storage to Supabase) and only runs 30 projects per cycle. With 1,660 projects needing bedroom data, this would take 55+ days. We need to trigger a **full emergency sync** immediately with `force_all: true` and `mirror_images: true` to capture all Reelly data before the API key is disconnected.

We need a new dedicated **full-extraction orchestrator** that will:
1. Pull all projects with missing bedroom/price data in batches of 50
2. Mirror all images to Supabase storage
3. Extract and store payment plans, floor plans, documents, amenities, unit types
4. Run in a tight loop until complete

---

## Complete Fix Plan

### Part 1 — QuizResults.tsx UI Fixes (6 targeted changes)

**Change 1 — Fix sold-out filter in DB query**
```tsx
// Before (line 56)
.neq("sale_status", "sold_out")

// After — catch all sold-out variants
.not("is_sold_out", "eq", true)
.not("sale_status", "ilike", "%sold%")
```

**Change 2 — Fix "More Great Options" grid and card sizing**
```tsx
// Change grid from 4 potential cols to strict 3-col, uniform height
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {projects.slice(1).map((project, index) => (
    <div key={project.id} className="relative group flex flex-col h-full">
      <ProjectCard project={project} currency="AED" sizeUnit="sqft" />
    </div>
  ))}
</div>
```

**Change 3 — Fix "Add Badge" button visibility**
```tsx
// Change from invisible text-purple-200 to visible white
<Button variant="outline" size="sm" 
  className="w-full border-white/30 text-white hover:bg-white/20 text-xs bg-white/10">
```

**Change 4 — Fix "Download Report" button**
```tsx
// Make it solid visible
<Button onClick={handleDownloadReport}
  className="bg-white text-zinc-900 hover:bg-zinc-100 font-semibold">
```

**Change 5 — Fix ProjectCard image fallback in QuizResults**
The quiz results query gives `project_images` rows but `ProjectCard` uses only `images[currentImageIndex]?.image_url`. When `images` is empty but `cover_image_url` exists, the card shows "Media pending verification". Fix: normalize the project before passing to `ProjectCard`:
```tsx
// Before passing project to ProjectCard, inject cover as first image if images is empty
const normalizeForCard = (p: any) => ({
  ...p,
  images: p.images?.length > 0 
    ? p.images 
    : p.cover_image_url 
      ? [{ image_url: p.cover_image_url, alt_text: p.name }]
      : []
});
```

**Change 6 — Hide VIP/upgrade messaging entirely**
Remove or hide any text about "You've used your free property match. Upgrade to VIP" — leave the structure but remove the upsell copy. Keep the `PaymentModal` import in place (so code doesn't break) but make sure `showVipModal` never triggers.

**Change 7 — Add "AI Power" third card to the action section**
Add a third card for "AI Home Finder Power" inside the existing purple bordered container, completing the trio the user expects.

**Change 8 — Fix hard exclusion in getRecommendations on Quiz.tsx**
The current filter passes projects with null price+bedrooms but no image through to results. Add stricter exclusion: if a project has no `cover_image_url` AND no `images` rows, exclude it:
```tsx
// Already correct in current code (line 250-251):
if (!project.cover_image_url) return false;
// But quiz query also needs to join images — current query joins images but
// doesn't check if the joined images have content
```

---

### Part 2 — Emergency Full Reelly Offline Mirror

Create a new edge function `reelly-emergency-mirror` that:

1. Fetches ALL published projects with missing data (`bedrooms_min IS NULL OR price_from IS NULL`) in batches
2. For each project, calls the Reelly API detail endpoint
3. Extracts ALL fields: unit types, amenities, payment plans, floor plans, documents, video URLs, images
4. Mirrors all images to Supabase storage bucket `project-media`
5. Upserts all extracted data to `projects` table + `project_images` + `project_documents` tables
6. Reports progress back

This function mirrors the existing `reelly-complete-offline-save` but with:
- `mirror_images: true` always (never skip)
- `batch_size: 50` maximum
- Exhaustive retry logic
- Payment plan data extraction (currently only partially saved)
- Floor plan data stored in `project_documents` with `document_type = 'floor_plan'`

The function will be called from the Listing Admin page to allow manual triggering with a progress indicator.

---

### Part 3 — Add Emergency Mirror Trigger to Listing Admin

The existing `/listing-admin` already has sync tabs. We need a prominent "Emergency Full Mirror" button that:
- Calls `reelly-emergency-mirror` with `mode: "status"` first to show how many projects need enrichment
- Then calls with `mode: "start"` to begin the batched process
- Shows a progress counter: "X of Y projects enriched, Z images stored"

---

## Files to Change

| File | Change |
|---|---|
| `src/pages/QuizResults.tsx` | 8 fixes: sold-out filter, grid sizing, button visibility, ProjectCard image fallback, hide VIP upsell, add third action card |
| `supabase/functions/reelly-emergency-mirror/index.ts` | New edge function for full offline mirror |

## Implementation Sequence

1. Fix `QuizResults.tsx` (immediate UI fixes — no data dependency)
2. Deploy `reelly-emergency-mirror` edge function
3. Trigger the emergency mirror from admin panel to start backfilling all 1,660 projects with missing bedroom/price data
