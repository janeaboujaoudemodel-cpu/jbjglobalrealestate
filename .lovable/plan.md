
# Fix Plan: AI Speed, DLD Data, Blocked CTAs, Border Styling, and Image Loading

## 1. Fix Blocked WhatsApp, Call, Email, and Google Maps Buttons

**Root Cause**: The `SecurityShield.tsx` injects a global CSS rule that sets `pointer-events: none` on ALL `img` elements. This cascades and interferes with clickable elements near images (map controls, CTA buttons inside cards with images). Additionally, `window.open()` is being used in many places which can be blocked by popup blockers.

**Fix**:
- In `SecurityShield.tsx`, remove the blanket `pointer-events: none` from the `img` CSS rule. Image dragging is already disabled via the `dragstart` event listener, so this CSS is redundant and harmful.
- Audit all map "Open in Google Maps" buttons and contact CTAs (WhatsApp, Call, Email) to use `<a href="..." target="_blank">` links instead of `window.open()` where possible, since anchor tags are never blocked by popup blockers.
- For `ProjectLocationMap.tsx` and `AreaMapSection.tsx`, change the external maps button from `window.open()` to a proper anchor tag.

**File**: `src/components/SecurityShield.tsx` (remove `pointer-events: none` from img rule), plus audit of map/CTA components.

## 2. Speed Up AI Analyzers (Developer, Project, Area)

**Current State**: The AI analyzers have 25-30 second timeouts and make full API calls each time. The DeveloperAIAnalyzer uses a 1-hour sessionStorage cache, the AIMarketAnalyzer uses sessionStorage with no TTL.

**Fix**:
- Reduce the client-side timeout from 25-30s to 15s for a snappier UX.
- Add a server-side database cache (use existing `project_ai_cache` table) for the `ai-developer-analyzer` and `ai-market-analyzer` edge functions with a 24-hour TTL, so repeat visits are instant.
- Show a skeleton/shimmer loader instead of a spinner for a more premium feel during loading.
- Pre-populate the analyzer with a brief "loading intelligence..." animation that feels intentional rather than slow.

**Files**: `src/components/AIMarketAnalyzer.tsx`, `src/components/developer/DeveloperAIAnalyzer.tsx`, edge functions.

## 3. Make DLD Market Data Live and Always Up-to-Date

**Current State**: All DLD data is hardcoded in `src/constants/dldMarketData.ts`. It never updates automatically -- someone must manually edit the file.

**Fix**:
- Create a `dld_market_data` database table to store the market stats (YTD values, top areas, top nationalities).
- Create a backend function `update-dld-market-data` that can be called to refresh the data (manually or via cron).
- Update `DLDMarketWidget.tsx` to fetch from the database first, falling back to the hardcoded constants if no database data exists.
- This ensures data freshness while maintaining a working fallback.

**Files**: New database table, new edge function, `src/components/shared/DLDMarketWidget.tsx`, `src/constants/dldMarketData.ts` (kept as fallback).

## 4. DLD Widget: Always Show Top 10 (Not Top 5)

**Current State**: The widget already slices to `topAreas2026.slice(0, 10)` and `topNationalities.slice(0, 10)`, and the data arrays have 10 entries each. This should already display 10 items. Will verify and ensure all pages consistently show Top 10 in both areas and nationalities sections.

**File**: `src/components/shared/DLDMarketWidget.tsx` -- verify and fix if any truncation exists.

## 5. Fix Sharp Borders on DLD Market Widget in Developer Detail Page

**Current State**: The DLDMarketWidget renders inside a `section` with its own inner container (`max-w-5xl mx-auto border-2 border-gold/40 rounded-2xl`). However, the outer `section` has no rounded corners, creating a sharp rectangular edge visible behind the rounded inner card.

**Fix**: Add `rounded-2xl overflow-hidden` to the outer section element of the DLDMarketWidget to ensure the champagne gradient background also has rounded borders matching the inner card.

**File**: `src/components/shared/DLDMarketWidget.tsx`

## 6. Fix Slow Image Loading on Nora Residence and Other Projects

**Fix**:
- Add `loading="eager"` and `fetchPriority="high"` to the hero/cover image on project detail pages.
- Add a `<link rel="preload">` for the cover image URL in the project detail page head.
- Ensure `optimizeStorageImageUrl` is used to serve appropriately sized images.

**File**: `src/components/project-detail/ProjectDetailLayout.tsx`

---

## Technical Summary

| Issue | Root Cause | Fix | Files |
|-------|-----------|-----|-------|
| Blocked CTAs (WhatsApp, Maps, etc.) | SecurityShield CSS `pointer-events: none` on all images + `window.open` popup blocking | Remove CSS rule, use `<a>` tags | `SecurityShield.tsx`, map/CTA components |
| Slow AI analyzers | No server-side caching, long timeouts | Add DB cache, reduce timeouts, skeleton loaders | `AIMarketAnalyzer.tsx`, `DeveloperAIAnalyzer.tsx` |
| Stale DLD data | Hardcoded constants file | Database table + fetch hook with fallback | New table, `DLDMarketWidget.tsx` |
| Sharp borders on DLD widget | Outer section lacks rounded corners | Add `rounded-2xl overflow-hidden` | `DLDMarketWidget.tsx` |
| Slow image loading | No eager loading or preloading | Add `loading="eager"` + preload | `ProjectDetailLayout.tsx` |
