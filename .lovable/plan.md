

## Plan: Unify Brand Asset Systems & Cross-Tool Integration

### Problem

There are **two separate, disconnected brand asset systems**:

1. **`BrandAssetLibrary`** — uses the `design_assets` table + `brand-assets` storage bucket. Already integrated into: Business Card, CV/Resume, Cover Letter, Company Profile.
2. **`BrandAssetPicker`** — uses the `brand_assets` table. Only used by the Stamp Generator.

These don't talk to each other. A stamp saved via `useSaveBrandAsset` (→ `brand_assets` table) never appears in the `BrandAssetLibrary` that other tools use (→ `design_assets` table). There is also no dedicated Brand Assets dashboard page.

Additionally, several tools have **no brand asset integration at all**: AI Document Generator, InlineStampGenerator, and the Letterhead/Email Signature flows.

### Solution

#### 1. Bridge the Two Tables

Update `BrandAssetLibrary` to query **both** `design_assets` AND `brand_assets` tables, merging results into a unified list. This way stamps saved from the generator automatically appear in every tool that uses `BrandAssetLibrary`.

Update `useSaveBrandAsset` to **also insert into `design_assets`** when the asset has an SVG (converting to a data URI for `file_url`), ensuring bidirectional visibility.

**File**: `src/components/corporate-suite/BrandAssetLibrary.tsx` (add secondary query to `brand_assets`), `src/components/brand-assets/BrandAssetPicker.tsx` (dual-insert in `useSaveBrandAsset`)

#### 2. Brand Assets Dashboard Page

Create `/owner/brand-assets` — a full-page dashboard showing all saved brand assets grouped by type (stamps, logos, business cards, signatures, letterheads, email signatures). Actions per asset: Use in Tool, Duplicate, Delete.

**Files**: New `src/pages/owner/BrandAssetsDashboard.tsx`, add route in `AdminRoutes.tsx`, add nav link in `GlobalVerticalNav.tsx`

#### 3. Add Brand Asset Picker to Missing Tools

- **AI Document Generator** (`AIDocumentGeneratorPremium.tsx`): Add a "Brand Assets" collapsible section for logo/stamp/signature insertion into generated documents.
- **InlineStampGenerator** (`InlineStampGenerator.tsx`): Add a "Select from Brand Library" tab so users can pick a previously saved stamp instead of generating a new one.

**Files**: `AIDocumentGeneratorPremium.tsx`, `InlineStampGenerator.tsx`

#### 4. "Save as Brand Asset" Actions Across Tools

Ensure every tool that produces a visual output has a "Save as Brand Asset" button. Currently only the stamp generator has this. Add to:
- Logo Creator (already saves to `design_assets` — add `brand_assets` dual-insert)
- InlineStampGenerator (add save action after generation)

**Files**: `LogoCreator.tsx` (add `brand_assets` insert alongside existing `design_assets` insert)

#### 5. Duplicate / Save Both / Select Previous in BrandAssetLibrary

Add to the `BrandAssetLibrary` grid:
- **Duplicate** button (clone asset with "Copy of" prefix)
- **"Use Previous"** indicator showing version count per asset type

**File**: `BrandAssetLibrary.tsx`

### Files Summary

| File | Change |
|------|--------|
| `BrandAssetLibrary.tsx` | Query both `design_assets` + `brand_assets`, add Duplicate action |
| `BrandAssetPicker.tsx` | `useSaveBrandAsset` dual-inserts into both tables |
| `LogoCreator.tsx` | Add `brand_assets` insert alongside `design_assets` |
| `InlineStampGenerator.tsx` | Add "Select from Library" tab using `BrandAssetLibrary` |
| `AIDocumentGeneratorPremium.tsx` | Add Brand Assets collapsible for logo/stamp/signature |
| New: `BrandAssetsDashboard.tsx` | Full-page brand assets dashboard at `/owner/brand-assets` |
| `AdminRoutes.tsx` | Add `/owner/brand-assets` route |
| `GlobalVerticalNav.tsx` | Add "Brand Assets" nav link |

### Implementation Order

1. Bridge tables in `BrandAssetLibrary` + `useSaveBrandAsset`
2. Create Brand Assets Dashboard page + route
3. Add brand asset picker to AI Document Generator
4. Add "Select from Library" to InlineStampGenerator
5. Add dual-insert to LogoCreator

