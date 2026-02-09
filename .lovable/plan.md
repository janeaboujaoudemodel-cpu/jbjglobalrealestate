

# Fix Project Approval - Both Individual and Bulk

## Root Causes Found

### Problem 1: Bulk Approve button fails with edge function error
The `bulk-approve-imports` edge function is **not registered** in `supabase/config.toml`. Without an entry, it defaults to `verify_jwt = true`, which is incompatible with the signing-keys system and causes the browser request to be rejected at the gateway level before your code even runs.

### Problem 2: Individual card approve fails with duplicate slug error
When you click the approve button on a single project card, the code tries to INSERT into the `projects` table. However, many projects already exist there (from previous syncs), and the `slug` column has a **unique constraint**. The insert fails because a project with the same slug already exists.

---

## Fix Plan

### A) Register edge functions in config.toml
**File:** `supabase/config.toml`

Add the missing entries:

```toml
[functions.bulk-approve-imports]
verify_jwt = false

[functions.repair-project-images]
verify_jwt = false

[functions.repair-project-extraction]
verify_jwt = false
```

This will allow the browser to call these functions successfully.

### B) Fix the bulk-approve-imports edge function import
**File:** `supabase/functions/bulk-approve-imports/index.ts`

Change the deprecated import:
- FROM: `import { createClient } from "https://esm.sh/@supabase/supabase-js@2";`
- TO: `import { createClient } from "npm:@supabase/supabase-js@2";`

Also fix the duplicate `area_id` assignment on lines 251-252 (currently set twice).

### C) Fix individual card approval to handle existing projects
**File:** `src/components/listing-admin/PendingImportCard.tsx`

Update `handleApprove` to check if a project with the same slug already exists before inserting. If it exists, update it instead of inserting a new one. This mirrors what the bulk-approve edge function already does (upsert logic).

The updated flow:
1. Check if a project with the same slug already exists
2. If yes: UPDATE the existing project and use its ID for images/documents
3. If no: INSERT a new project
4. Then proceed with images, documents, and marking the import as approved

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/config.toml` | MODIFY | Add 3 missing function entries with `verify_jwt = false` |
| `supabase/functions/bulk-approve-imports/index.ts` | MODIFY | Fix `esm.sh` import to `npm:` specifier; fix duplicate `area_id` line |
| `src/components/listing-admin/PendingImportCard.tsx` | MODIFY | Add upsert logic to handle duplicate slugs on individual approval |

---

## Technical Details

### PendingImportCard.tsx - Updated handleApprove logic

```text
1. Query: SELECT id FROM projects WHERE slug = item.slug
2. If existing project found:
   - UPDATE projects SET ... WHERE id = existing.id
   - DELETE old images/documents for that project
   - INSERT new images/documents
3. If no existing project:
   - INSERT new project (current behavior)
4. Mark pending_project_imports status = "approved"
```

### config.toml additions
Three functions need `verify_jwt = false` to work with the signing-keys gateway:
- `bulk-approve-imports` (bulk approval)
- `repair-project-images` (image repair button)
- `repair-project-extraction` (repair button on individual cards)

