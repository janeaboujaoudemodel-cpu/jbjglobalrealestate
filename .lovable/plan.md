

## Auto-Link 108 Projects to Their Developer Records

### Problem
108 published projects have a `developer_name` text field but no `developer_id` foreign key. Without the link, the join to the `developers` table returns null and no logo renders.

### Fix
Run a single SQL UPDATE to match `projects.developer_name` to `developers.name` and populate the missing `developer_id`.

### Steps

1. **Data update via insert tool** — Execute:
```sql
UPDATE projects p
SET developer_id = d.id
FROM developers d
WHERE p.developer_id IS NULL
  AND p.developer_name IS NOT NULL
  AND LOWER(TRIM(p.developer_name)) = LOWER(TRIM(d.name));
```

2. **Check for unmatched remainders** — Query any projects still missing `developer_id` after the update to see if fuzzy matching or manual mapping is needed (e.g. "Developed by Meraas" vs "Meraas").

3. **Handle edge cases** — If some `developer_name` values don't exactly match any `developers.name`, run additional updates with known aliases (e.g. `LIKE '%Meraas%'` → Meraas developer record).

### What stays untouched
- No code changes — the join logic already works correctly
- No schema changes — `developer_id` column already exists
- No logo URLs — locked per previous rule
- No UI components — rendering is correct once data is linked

