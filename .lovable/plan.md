

# Global Vertical Navigation + Smart Recommendations Upgrade

This is a large-scope upgrade touching navigation architecture, AI tool wiring, and recommendation intelligence. I'll break it into **4 batches** for clean, incremental delivery.

---

## Batch 1: Global Vertical Navigation (replaces horizontal GlobalHeader)

**Current state:** `PropertiesVerticalNav` exists as a 200px sidebar used only on Properties, Areas, and Developer pages. The main site uses `GlobalHeader` (horizontal mega-menu header).

**Plan:**
- **Promote `PropertiesVerticalNav` to a global `GlobalVerticalNav`** — move it into `MainLayout.tsx` so it renders on ALL public routes (not back-office).
- **Remove `GlobalHeader` from MainLayout** for desktop. Keep it as a mobile hamburger fallback (responsive: vertical nav hidden on mobile, horizontal header shown).
- **Expand NAV_ITEMS** to include ALL missing pages:
  - **Hubs (always visible/highlighted):** AI Tools (`/ai-hub`), Careers (`/careers`), Listing Portal (`/listing-portal`), Buy Properties (`/properties`), Broker Hub (`/broker-hub`), Investor Hub (`/investor-hub`)
  - **AI Tools section** with collapsible sub-items listing every AI tool (stamp generator, business card, CV builder, logo maker, cover letter, video suite, photo suite, PDF suite, voice suite, property analyzer, price predictor, virtual staging, etc.)
  - All existing nav items preserved
- **Highlighted hubs**: AI Tools, Careers, Listing Portal, Buy will have a distinct gold accent/badge to stay visible.
- **Property/Developer/Area pages**: Show vertical nav (left) + `FilterShortcutBar` (horizontal top bar) simultaneously — same pattern already in Properties page.
- **Body class `jj-vertical-nav-active`** applied globally so all sections respect `lg:pl-[200px]` padding.
- **Remove per-page `PropertiesVerticalNav` imports** from Properties, PropertiesReelly, AreaDetail, AreaGuides — the global one covers them.

---

## Batch 2: Fix all AI Tool 404s — Wire missing routes

**Current state:** Many AI tool links in the hub/nav point to routes that don't exist (404). The `AIHub.tsx` lists ~40+ tools but many lack actual page routes.

**Plan:**
- **Audit all tool links** in `AIHub.tsx`, `MegaMenuToolkit.tsx`, `AI_TOOLS_CONFIG`, and the new vertical nav against `App.tsx` routes.
- **Create missing page wrappers** for tools that have Premium components but no route (e.g., `AICompetitorAnalysisPremium`, `AIFollowupSchedulerPremium`, etc.).
- **Add missing `<Route>` entries** in `App.tsx` for every AI tool.
- **Ensure consistent URL patterns**: `/ai-tools/{tool-slug}` for standalone AI tools, `/toolkit/{suite-name}` for suite tools.

---

## Batch 3: Smart Recommended Projects (behavior-based)

**Current state:** `RecommendedProjects` scores by developer match, location match, and emirate — static logic, no user behavior awareness. `ContinueSearching` shows recent views but doesn't deduplicate repeated visits to the same item.

**Plan:**
- **Upgrade `RecommendedProjects`** to use user search/browsing context:
  1. Read recent searches from `useRecentSearches` to detect user's interest area (e.g., Palm Jumeirah) and budget range.
  2. **Price-tier matching**: If user browses 10M-30M properties, filter recommendations to that range. Show 3 cards: high-ticket (top 33% of range), mid-ticket (middle), low-ticket (bottom 33%) — all within the user's browsed budget band.
  3. **Location matching**: If user searches Downtown, show Downtown projects unless they've also browsed other areas.
  4. Falls back to current scoring logic when no behavior data exists.

- **Fix `ContinueSearching` deduplication**:
  - In `useRecentSearches.ts` `trackView`: already deduplicates by `id + type` (line 111), moving the latest to the top. The display is correct — same project visited 5 times shows once.
  - **Verify**: The `trackView` function filters out existing entries before prepending. This is already correct. Will add a comment for clarity but no logic change needed here.

---

## Batch 4: Same behavior logic for Areas & Developers

- Apply the same behavior-aware recommendation logic to area detail pages and developer detail pages.
- "Recommended Areas" uses user's browsed locations/budgets.
- "Recommended Developers" uses user's browsed developer preferences.
- Deduplication already handled by the shared `useRecentSearches` hook.

---

## Technical Details

### MainLayout Changes
```
MainLayout
├── GlobalVerticalNav (desktop only, fixed left, 200px)
├── <main> with lg:pl-[200px]
│   ├── FilterShortcutBar (on property/developer/area pages, horizontal)
│   └── {children}
├── Footer (with lg:pl-[200px])
└── GlobalHeader (mobile only — hamburger menu)
```

### Files to Create/Edit
- `src/components/navigation/GlobalVerticalNav.tsx` — evolved from `PropertiesVerticalNav` with all pages + AI tools
- `src/components/MainLayout.tsx` — replace GlobalHeader with GlobalVerticalNav on desktop
- `src/App.tsx` — add missing AI tool routes
- `src/pages/` — create ~10-15 missing AI tool page wrappers
- `src/components/project-detail/RecommendedProjects.tsx` — behavior-aware scoring
- `src/hooks/useUserBrowsingContext.ts` — new hook to extract user's interest area + budget from recent searches
- `src/config/mainLayoutRoutes.ts` — update header spacing logic

### Recommendation Scoring (new algorithm)
```
1. Extract user context from localStorage recent searches
2. Determine dominant area (most viewed location)
3. Determine budget band (min/max price_from of viewed projects)
4. Filter candidates to same area + budget band
5. Sort into 3 tiers: high/mid/low within band
6. Pick 1 from each tier → 3 recommendations
7. Fallback to current scoring if insufficient data
```

---

## Implementation Order
1. Batch 1 first (global vertical nav) — biggest UX change
2. Batch 2 immediately after (fix 404s so nav links work)
3. Batch 3 (smart recommendations)
4. Batch 4 (areas + developers)

Shall I proceed with Batch 1?

