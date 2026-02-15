

## Fix Developer Logos and Feature Photos -- Full Restoration Plan

### Problem Summary

The developer cards on `/developers` have multiple critical issues:
1. **AI-processed "fake" logos** are being used for 11 developers (Damac, Danube, Sobha, MAG, etc.) instead of the original Reelly logos
2. **Meraas** has Emaar's logo stored (wrong data from source) and needs its own logo
3. **234 developers** have no logo at all
4. **48 developers** have no feature photo (project/building image)
5. **Sobha Realty** card shows "Z-RO" text -- wrong logo entirely

### Root Cause

Previous cleanup operations replaced original Reelly S3 logos with AI-background-removed "processed" versions stored in Supabase storage. The originals still exist in the `uae_developers` table and in the Reelly S3 bucket URLs.

### Data Sources Available for Restoration

| Source | What it has | Count |
|--------|------------|-------|
| `uae_developers` table | Original Reelly logos for key developers | 5 restorable (Damac, Danube, MAG, Sobha, Binghatti) |
| `developers.logo_url` with `reelly-backend.s3` | Already correct original logos | 285 developers |
| `pending_project_imports` | Developer names matched to projects with S3 images | ~131 matchable |
| `projects` table | Cover images linked to developers | For feature photos |

### Implementation Plan

#### Step 1: Restore Original Logos from `uae_developers`
Replace all AI-processed logos with the original Reelly S3 URLs from `uae_developers`:
- **Damac**: Restore from `uae_developers` (currently using processed PNG)
- **Danube**: Restore from `uae_developers` (currently using processed PNG)
- **Sobha**: Restore from `uae_developers` (currently using processed PNG showing wrong content)
- **MAG Group**: Restore from `uae_developers` (currently using processed PNG)
- **Binghatti**: Restore from `uae_developers` original Reelly logo

#### Step 2: Fix Meraas Logo
Meraas has Emaar's logo URL stored in both `developers` and `uae_developers` (bad data from source). Since there is no correct Meraas logo in the database, the logo will be set to NULL so the card shows a clean placeholder icon instead of a wrong logo.

#### Step 3: Remove ALL AI-Processed Logos
Replace the remaining 6 AI-processed logos (Ade Bali, Ahmadyar, Arada, HSE, Laraix, PREDMET, Topero) with their original Reelly URLs where available, or NULL them to prevent fake logos from showing.

#### Step 4: Build and Deploy Bulk Logo Restoration Edge Function
Create a new edge function `restore-developer-logos` that:
- Cross-references `pending_project_imports` developer names with `developers` table
- Extracts original Reelly S3 developer logos from the import data where available
- Uses normalized name matching (same approach as the photo restoration function)
- Only sets logos from `reelly-backend.s3.amazonaws.com` URLs (guaranteed original)

#### Step 5: Restore Remaining Feature Photos
Run the existing `restore-developer-photos` edge function again to fill any remaining gaps in `feature_image_url` by matching developers to their project cover images.

#### Step 6: Update `logo_bg_color` Rules
Per existing brand policy:
- Danube: black (`#000000`)
- MAG: dark red (`#8B0000`)
- Binghatti, Azizi: white (`#FFFFFF`)
- All others: transparent (NULL) -- no background box

#### Step 7: Visual Verification
Take screenshots of the developers page to confirm:
- Each card shows the correct original logo (not AI-generated)
- Each card shows a representative project/building photo
- No "fake" or mismatched logos remain

### Technical Details

**Database updates (via insert tool):**
```sql
-- Step 1: Restore 5 key logos from uae_developers
UPDATE developers SET logo_url = (SELECT logo_url FROM uae_developers WHERE slug = 'damac') WHERE slug = 'damac';
UPDATE developers SET logo_url = (SELECT logo_url FROM uae_developers WHERE slug = 'danube') WHERE slug = 'danube';
UPDATE developers SET logo_url = (SELECT logo_url FROM uae_developers WHERE slug = 'sobha') WHERE slug = 'sobha';
UPDATE developers SET logo_url = (SELECT logo_url FROM uae_developers WHERE slug = 'mag') WHERE slug = 'mag';
UPDATE developers SET logo_url = (SELECT logo_url FROM uae_developers WHERE slug = 'binghatti') WHERE slug = 'binghatti';

-- Step 2: Fix Meraas (wrong logo)
UPDATE developers SET logo_url = NULL WHERE slug = 'meraas';

-- Step 3: Remove all remaining AI-processed logos
UPDATE developers SET logo_url = NULL WHERE logo_url LIKE '%processed%';
```

**New edge function: `restore-developer-logos/index.ts`**
- Scans `pending_project_imports` for developer logos stored in raw import data
- Cross-references with developers missing logos
- Only uses verified Reelly S3 URLs

**Existing edge function: `restore-developer-photos`**
- Re-run to fill remaining 48 missing feature photos

