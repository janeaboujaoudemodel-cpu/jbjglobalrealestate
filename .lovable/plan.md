

# Fix Developer Logos, Project Data Quality, and Gallery Extraction

## Issues Found

### 1. Logo Styling -- `object-cover` Crops Logos
The previous fix changed logos from `object-contain` to `object-cover`, which crops rectangular logos instead of fitting them. The correct approach is `object-contain` WITHOUT padding -- this fills the container while showing the full logo. The Imtiaz example works because their logo happens to be square.

**Fix**: Change all three files back to `object-contain` (no padding) so logos display fully without cropping:
- `DeveloperCard.tsx` line 97: `"w-full h-full object-contain"` 
- `DeveloperDetail.tsx` line 160: `"w-full h-full object-contain"`
- `DeveloperInfoCard.tsx` line 68: `"w-full h-full object-contain"`

### 2. "Ellington and RAK Properties" -- Already Fixed
The database query confirms this combined entry has already been deleted. Ellington Properties has 49 projects and RAK Properties has 19 projects, each as separate entries. No further action needed.

### 3. Imtiaz Duplicate -- Already Fixed
Only one "Imtiaz Developments" record exists with 36 projects. The duplicate "Imtiaz Development" was already deleted. No further action needed.

### 4. Project "Sunset Bay Grand" -- Data Issues

**Problem A: "1 Floor" showing**
The `floors` field is `1` (from Reelly's `building_count`). The QuickFactsBar guard (`> 3`) was already added, but the `HouseDetailsSection` still shows "Building 1" for `floors <= 3`. Since `building_count` is NULL, the `floors=1` value is being misinterpreted. Fix: Also guard HouseDetailsSection to skip `floors=1`.

**Problem B: Description has hashtags and `#####` headers**
The raw description starts with `##### Project general facts` and contains hashtag-style content. The markdown renderer was updated to convert `#####` to `h4` headings, which is correct. But `cleanRawText()` in `markdownUtils.ts` strips hashtags BEFORE the header conversion, breaking `#####` headers. The hashtag stripper `/#\w+/gi` matches `##### Project` and strips the `#####`. Fix: Update `cleanRawText` to not strip lines that start with markdown headers (`#` followed by a space after the hashes).

**Problem C: Gallery only has 1 photo**
The Reelly API list endpoint only returns `cover_image` -- not the full gallery. The `extractGalleryImages` function relies on `project.images` or `project.gallery` arrays, but those are only available from the Reelly DETAIL endpoint (`/projects/{id}`), not the list endpoint used by the sync. The detail endpoint needs to be called per-project to get full galleries, floor plans, payment plans, amenities, and documents. This is what the `repair-project-extraction` function does, but it wasn't run for all Reelly projects.

**Fix**: Update the sync function to also call the detail endpoint for each project to extract full gallery, or create a batch backfill function that fetches details for projects with only 1 image.

**Problem D: Payment plan not extracted**
Same root cause -- the list API doesn't include payment plan data. The detail endpoint does.

### 5. Description Section -- Remove Hashtags but Keep Markdown Headers

**Fix in `markdownUtils.ts`**: Update `cleanRawText` so the `/#\w+/gi` pattern doesn't match markdown headers. Change it to only strip hashtags that are NOT at the start of a line (inline hashtags like `#DubaiRealEstate`).

### 6. Developer Info Card Description -- Gap After "..."

The description is truncated at 250 chars with "..." but the layout has a gap. The `DESCRIPTION_PREVIEW_LENGTH` is too short and the "Read More" button is too far away. Increase to 500 chars and make the "Read More" link inline or closer.

### 7. HouseDetailsSection -- "Building 1, Total Unit 27"

The `floors=1` is being shown as "Building 1" due to the `<= 3` logic. Since `building_count` is NULL/not stored on the project, `floors=1` is a misinterpreted value. Fix: Don't show building count when it's 1 -- it's not meaningful.

## Plan

### Step 1: Fix Logo Styling (3 files)

| File | Line | Change |
|------|------|--------|
| `src/components/DeveloperCard.tsx` | 97 | `object-cover` to `object-contain` |
| `src/pages/DeveloperDetail.tsx` | 160 | `object-cover` to `object-contain` |
| `src/components/project-detail/DeveloperInfoCard.tsx` | 68 | `object-cover` to `object-contain` |

### Step 2: Fix Markdown Hashtag Stripping

**File**: `src/lib/markdownUtils.ts`

Change the hashtag stripper in `cleanRawText` from:
```
.replace(/#\w+/gi, '')
```
to only strip inline hashtags (not at line start):
```
.replace(/(?<=\s)#\w+/g, '')
.replace(/^#\w+$/gm, '')  // standalone hashtag lines
```
This preserves `##### Header` markdown while still stripping `#DubaiRealEstate` style hashtags.

### Step 3: Fix HouseDetailsSection Floor Guard

**File**: `src/components/project-detail/HouseDetailsSection.tsx`

Change the condition at line 63 from `floors > 0` to `floors > 1` so that `floors=1` (meaningless building_count) is never displayed.

### Step 4: Fix Developer Description Truncation

**File**: `src/components/project-detail/DeveloperInfoCard.tsx`

Increase `DESCRIPTION_PREVIEW_LENGTH` from 250 to 500, and make the "Read More" button more prominent and closer to the truncated text.

### Step 5: Create Reelly Detail Backfill Function

**New Edge Function**: `reelly-backfill-details`

This function will:
1. Query `projects` for Reelly-sourced entries with only 1 image (or no payment plan)
2. Fetch the full detail from `REELLY_API_BASE/{id}` for each
3. Insert all gallery images into `project_images`
4. Update `payment_plan`, `payment_breakdown`, `documents`, `floor_plan_types`, `amenities` on the project
5. Process in batches of 10 to avoid timeouts

### Step 6: Fix Sunset Bay Grand `floors` value

**Database**: Update the project to set `floors = NULL` since `1` is not meaningful.

```sql
UPDATE projects SET floors = NULL WHERE id = 'f0483cf4-716d-4d96-9bd9-15b04c61e1fd' AND floors = 1;
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/DeveloperCard.tsx` | Logo: `object-contain` (no padding) |
| `src/pages/DeveloperDetail.tsx` | Logo: `object-contain` |
| `src/components/project-detail/DeveloperInfoCard.tsx` | Logo: `object-contain`; increase description preview length |
| `src/lib/markdownUtils.ts` | Fix hashtag stripping to preserve markdown headers |
| `src/components/project-detail/HouseDetailsSection.tsx` | Skip floors=1 |
| `supabase/functions/reelly-backfill-details/index.ts` | New function to fetch full project details from Reelly API |
| Database | Fix Sunset Bay Grand floors value |

