

## Plan: AI Stamp Variations, Favorites/Shortlist, History, Recently Deleted & Brand Assets

### Current State

The stamp generator already has:
- AI generation via `ai-stamp-generator` edge function (generate + refine actions)
- Concepts grid on the right panel with favorites
- Smart Designer floating chat panel for AI refinement
- `design_favorites` table for cross-tool favorites/shortlist
- `stamp_designs` table with `is_favorite` flag
- `design_history` table exists in DB
- Brand Assets pattern used across corporate suite (logo upload sections)
- `StampHistoryDashboard` for viewing past designs

### What Needs to Change

#### 1. AI Variations Side Panel (Tasks 1-2)

**Problem**: Currently, "Regenerate" replaces the concepts grid entirely. AI refinements from the Smart Designer replace the selected concept or add to the main grid.

**Solution**: Add a dedicated "AI Variations" panel that generates alternative designs WITHOUT touching the main preview or concepts grid.

- Add "Generate Variations" button in header (next to Regenerate)
- When clicked, calls `ai-stamp-generator` with `action: 'variations'` passing current selected SVG
- Results appear in a new slide-out panel on the right (overlays the concepts grid temporarily)
- Variation types: separator styles, ring weights, monogram placements, color schemes, corporate/legal/officer styles
- Each variation card has: Select (applies to main preview), Favorite, Shortlist, Delete
- Main preview remains untouched — standard model stays in center

**Files**: `StampGeneratorPage.tsx` (add variations state + panel), `ai-stamp-generator` edge function (add `variations` action)

#### 2. Favorite / Shortlist / Top Ranking (Task 3)

**Problem**: Current favorites are per-`stamp_designs` table with a simple boolean. No shortlist or Top 1/2/3 ranking.

**Solution**: Wire the existing `design_favorites` system + `useShortlistBadges` hook into the stamp concepts grid.

- Each concept card gets: Heart (favorite via `design_favorites`), ListPlus (shortlist via `design_favorites`), Top 1/2/3 badges via `useShortlistBadges`
- Add "Save Project" button (already exists as export), "Duplicate" (clone concept), "Delete" (soft-delete)
- Reuse `DesignFavoriteButton` component already built for this purpose
- Add Top 1/2/3 badge selector dropdown on each card

**Files**: `StampGeneratorPage.tsx` (ConceptCard enhancement), existing hooks `useDesignFavorites`, `useShortlistBadges`

#### 3. Recently Deleted Section (Task 4)

**Solution**: Add soft-delete to stamp designs with a "Recently Deleted" collapsible section in the concepts panel.

- New DB column: `deleted_at` (nullable timestamp) on `stamp_designs`
- Deleted designs hidden from main grid, shown in "Recently Deleted" section
- Actions: Recover, Permanent Delete, "Adapt & Save"
- Auto-purge after 30 days (matches platform standard)

**Migration**: `ALTER TABLE stamp_designs ADD COLUMN deleted_at timestamptz DEFAULT NULL;`

**Files**: `StampGeneratorPage.tsx` (add deleted section), new component `StampRecentlyDeleted.tsx`

#### 4. Brand Asset Integration (Tasks 5-6)

**Problem**: No way to save a stamp design as a reusable brand asset.

**Solution**: Create a `brand_assets` table and "Save as Brand Asset" action.

- New table: `brand_assets` (id, user_id, asset_type enum [stamp/logo/business_card/signature/letterhead/email_signature], name, svg_content, thumbnail_url, metadata jsonb, created_at)
- "Adapt & Save for Future Use" button on designs → saves to `brand_assets`
- Brand Assets dashboard section at `/owner/brand-assets` listing all saved assets grouped by type
- Other tools (document creator, business card, cover letter) can pull from `brand_assets` table via a shared picker component

**Migration**: Create `brand_assets` table with RLS policies.

**Files**: New `src/components/brand-assets/BrandAssetPicker.tsx`, new `src/pages/BrandAssets.tsx`, update `StampGeneratorPage.tsx`

#### 5. Previous Versions Selector (Task 7)

**Problem**: `StampHistoryDashboard` exists but is a separate page. No way to select from previous versions inline.

**Solution**: Add "Select from Previous" dropdown/modal in the stamp generator.

- New component `StampVersionSelector.tsx` — modal that loads all `stamp_designs` for the project ordered by `created_at`
- Actions per version: Select & Use, Duplicate, Save Both (keep current + add this one)
- "Upload New" button alongside "Select From Previous"
- Shows thumbnail grid of all previous designs with date stamps

**Files**: New `StampVersionSelector.tsx`, wire into `StampGeneratorPage.tsx` header

### Files Summary

| File | Change |
|------|--------|
| `StampGeneratorPage.tsx` | Add variations panel, enhanced ConceptCard with shortlist/badges/delete, recently deleted section, brand asset save, version selector trigger |
| New: `StampVariationsPanel.tsx` | AI variations side panel component |
| New: `StampRecentlyDeleted.tsx` | Recently deleted section with recover/delete/adapt |
| New: `StampVersionSelector.tsx` | Previous versions modal picker |
| New: `BrandAssetPicker.tsx` | Shared brand asset picker for all tools |
| New: `BrandAssets.tsx` | Brand assets dashboard page |
| `ai-stamp-generator` edge function | Add `variations` action |
| DB Migration | Add `deleted_at` to `stamp_designs`, create `brand_assets` table |

### Implementation Order

1. DB migrations (deleted_at column + brand_assets table)
2. StampVariationsPanel + wire to StampGeneratorPage
3. Enhanced ConceptCard (favorites/shortlist/badges/delete)
4. Recently Deleted section
5. Brand Asset save flow
6. Previous Version selector

