

## Fix Developer Duplicates and Data Quality

### Problem

The `developers` table has **14 duplicate pairs** -- the same developer appears twice with slightly different names (e.g., "Emaar" + "Emaar Properties", "DAMAC" + "Damac Properties"). One row typically comes from Reelly (short name, has logo/description) and the other from Provident (full name, has the projects linked). This causes:
- Duplicate cards in the developer directory
- Different logos/photos shown for the same developer
- Incorrect project counts (one card shows 0, the other shows the real count)

### Duplicate Pairs Found (14 total)

| Keep (has projects) | Delete (0 projects) | Projects to Reassign |
|---------------------|---------------------|----------------------|
| Emaar Properties (146 projects) | Emaar (0) | 0 |
| Damac Properties (70 projects) | DAMAC (0) | 0 |
| Sobha Realty (50 projects) | Sobha (0) | 0 |
| Ellington Properties (43 projects) | Ellington (6) | 6 |
| Samana Developers (36 projects) | Samana (0) | 0 |
| Arada Properties (33 projects) | Arada (0) | 0 |
| Nshama (33 projects) | Nshama Group (0) | 0 |
| Aldar Properties (29 projects) | ALDAR (0) | 0 |
| Danube Properties (21 projects) | Danube (0) | 0 |
| MAG Group (10 projects) | MAG (2) | 2 |
| Majid Al Futtaim Properties (7 projects) | Majid Al Futtaim (0) | 0 |
| Meraki (4 projects) | Meraki Developers (0) | 0 |
| AB Developers (3 projects) | AB Properties (1) | 1 |
| ZaZEN Properties/zazen-properties (1 project) | ZaZEN Properties/zzen-properties (0) | 0 |

### Solution

#### Step 1: Database Cleanup (SQL data operations)

For each of the 14 pairs:
1. **Copy best data** from the Reelly row (logo, description, feature image) to the kept row if it has better content
2. **Reassign projects** from the deleted row to the kept row (for Ellington: 6, MAG: 2, AB: 1)
3. **Reassign pending_project_imports** (480 records total)
4. **Delete** the duplicate rows

The kept row will use the **canonical name** (e.g., "Emaar Properties") with the **short slug** (e.g., "emaar") for clean URLs, and the **best logo** from Reelly since those tend to be higher quality.

#### Step 2: Update slug on kept rows

Update the slug on the kept rows to use the simpler slug (e.g., "emaar" instead of "emaar-properties") since the menu, routes, and tier-matching all reference the short slugs.

#### Step 3: Update `uae_developers` table

The `uae_developers` table also has entries for these developers but with no logos or feature images. Update them with the best available data from the `developers` table to keep both tables in sync.

#### Step 4: Update the developer detail page

Add a feature image/hero section to the `DeveloperDetail.tsx` page so when users click into a developer, they see a prominent project photo at the top (using the developer's `feature_image_url`).

### Files to Modify

| File | Change |
|------|--------|
| Database (data operations) | Merge 14 duplicate pairs: copy best logos/descriptions to kept row, reassign projects, delete duplicates, update slugs |
| `src/pages/DeveloperDetail.tsx` | Add hero/feature image section at top of developer detail page |

### Technical Details - Merge Logic

For each pair, the SQL will:

```text
-- 1. Copy best logo/description/feature_image from Reelly row to kept row (only if kept row is missing it)
UPDATE developers SET 
  logo_url = COALESCE(logo_url, [reelly_logo]),
  description = CASE WHEN LENGTH(description) < LENGTH([reelly_description]) THEN [reelly_description] ELSE description END,
  feature_image_url = COALESCE(feature_image_url, [reelly_feature])
WHERE id = [kept_id];

-- 2. Reassign any projects from deleted row
UPDATE projects SET developer_id = [kept_id] WHERE developer_id = [deleted_id];
UPDATE pending_project_imports SET developer_id = [kept_id] WHERE developer_id = [deleted_id];

-- 3. Update slug to short form
UPDATE developers SET slug = 'emaar' WHERE id = [kept_id];

-- 4. Delete duplicate
DELETE FROM developers WHERE id = [deleted_id];
```

This is repeated for all 14 pairs. The result: each developer appears exactly once with the best available logo, description, and feature image, plus all their projects correctly linked.

