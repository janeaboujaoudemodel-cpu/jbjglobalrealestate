

## Fix Missing Project Data: Clean Empty Shells and Fill Data Gaps

### The Problem

The database contains **683 completely empty "shell" project records** that are published and visible on the platform. These records have:
- No developer name (shows as blank or missing)
- No price (shows "Price on Request")
- No description, no images, no handover date, no status
- No `reelly_id` -- meaning they cannot be backfilled from the Reelly API
- They were created during a Provident bulk import but never got matched or enriched

Additionally, **7 manual projects** have a `developer_id` linked but the `developer_name` text field was never populated.

Among the 1,801 complete Reelly projects, **611 are missing prices** and **1,709 are missing payment plans** -- these are legitimate gaps from the Reelly API itself (not all projects have announced prices).

### The Fix (3 Steps)

**Step 1: Unpublish the 683 empty shell records**

These records have zero useful data and degrade the user experience. They should be unpublished (`is_published = false`) so they stop appearing in listings, search results, and on cards. This immediately eliminates "Price on Request" and missing developer cards for empty records.

A backend function will run:
```sql
UPDATE projects 
SET is_published = false 
WHERE reelly_id IS NULL 
  AND (developer_name IS NULL OR developer_name = '') 
  AND description IS NULL 
  AND source = 'reelly' 
  AND import_source = 'reelly';
```

**Step 2: Fix the 7 manual projects with missing developer_name**

These have a valid `developer_id` but the `developer_name` was never filled. A simple join-and-update resolves this:

```sql
UPDATE projects p 
SET developer_name = d.name 
FROM developers d 
WHERE p.developer_id = d.id 
  AND (p.developer_name IS NULL OR p.developer_name = '') 
  AND p.is_published = true;
```

**Step 3: Create a "data completeness repair" edge function**

A new `repair-project-data-gaps` edge function will scan all remaining published projects and fill gaps:

- **Developer name resolution**: For any project with `developer_id` but no `developer_name`, look up the developer table
- **Developer name from Reelly**: For projects with `reelly_developer_id`, match against the developers table
- **Sale status normalization**: Ensure `status_label` is populated from `sale_status` where missing
- **Handover formatting**: Ensure `expected_completion` is copied to `handover_date` where missing (or vice versa)

### What This Achieves

| Metric | Before | After |
|--------|--------|-------|
| Published projects | 2,484 | ~1,801 (real data only) |
| Missing developer name | 683 | 0 |
| Missing description | 676 | 0 |
| Missing images | 683 | 0 |
| Missing price | 1,287 | ~604 (legitimate API gaps) |

### Files Modified

- **New**: `supabase/functions/repair-project-data-gaps/index.ts` -- Edge function to clean empty shells and fill data gaps
- The function runs the SQL updates above and reports results

### Important Note

The 604 remaining projects without prices are legitimately missing from the Reelly API (prices not yet announced by developers). These will correctly show "Price on Request" which is the accurate state. This is different from the current situation where empty shell records with zero data are polluting the listings.
