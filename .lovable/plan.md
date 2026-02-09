

# Fix Project Approval - Both Individual and Bulk

## Root Causes

### Bulk Approve: Edge function not registered
The `bulk-approve-imports` function is missing from `supabase/config.toml`, so it defaults to `verify_jwt = true` which blocks all requests before the code runs.

### Individual Approve: Duplicate slug insert error
`PendingImportCard.tsx` does a direct INSERT into `projects`, but projects with the same slug already exist, causing a unique constraint violation.

### Bulk Approve: Deprecated import + duplicate field
The edge function uses `esm.sh` import (causes deployment failures) and has a duplicate `area_id` assignment on lines 251-252.

---

## Changes

### 1. Register missing edge functions in config.toml
**File:** `supabase/config.toml`

Add after the last entry:
```toml
[functions.bulk-approve-imports]
verify_jwt = false

[functions.repair-project-images]
verify_jwt = false

[functions.repair-project-extraction]
verify_jwt = false
```

### 2. Fix bulk-approve-imports edge function
**File:** `supabase/functions/bulk-approve-imports/index.ts`

- Line 2: Change `import { createClient } from "https://esm.sh/@supabase/supabase-js@2"` to `import { createClient } from "npm:@supabase/supabase-js@2"`
- Lines 251-252: Remove the duplicate `area_id` line (keep only one)

### 3. Fix individual approval with upsert logic
**File:** `src/components/listing-admin/PendingImportCard.tsx`

Update `handleApprove` (lines 131-201) to:
1. First check if a project with the same slug already exists
2. If exists: UPDATE the existing project, delete old images/documents, re-insert new ones
3. If not exists: INSERT new project (current behavior)
4. Mark import as approved

```text
Updated flow:
  const slug = item.slug || item.name.toLowerCase().replace(/\s+/g, '-');
  
  // Check for existing project
  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  let projectId: string;

  if (existing) {
    // UPDATE existing project
    await supabase.from("projects").update(projectData).eq("id", existing.id);
    projectId = existing.id;
    // Delete old images/documents before re-inserting
    await supabase.from("project_images").delete().eq("project_id", projectId);
    await supabase.from("project_documents").delete().eq("project_id", projectId);
  } else {
    // INSERT new project
    const { data: newProject } = await supabase
      .from("projects").insert(projectData).select().single();
    projectId = newProject.id;
  }

  // Then insert images, documents, and mark as approved
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/config.toml` | Add 3 function entries with `verify_jwt = false` |
| `supabase/functions/bulk-approve-imports/index.ts` | Fix import to `npm:`, remove duplicate `area_id` |
| `src/components/listing-admin/PendingImportCard.tsx` | Add upsert logic for individual approval |

