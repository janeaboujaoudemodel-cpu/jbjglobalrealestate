
# Fix: Selected Bulk Approve Fails Due to Duplicate Check

## Root Cause

When you select items and click "Approve", the code calls `approveImportInDb(item)` for each one (line 592 in ProjectApprovalQueue.tsx). This function checks if a project with the same name already exists in the `projects` table (line 332-354). Since these projects were already synced/updated by previous operations, they all exist -- so all 60 get rejected with a "DUPLICATE" error.

The "Approve ALL" button uses the edge function which does upsert (update-or-insert). But the "selected items" approve path uses a client-side insert that blocks on duplicates.

## Fix

**File: `src/components/listing-admin/ProjectApprovalQueue.tsx` (line 592-594)**

In the selected bulk approve loop, change `approveImportInDb(item)` to `approveImportInDb(item, true)` — passing `skipDuplicateCheck = true`. The user explicitly selected these items, so they intend to approve them. If a project already exists, the function should upsert (update) instead of blocking.

Additionally, update `approveImportInDb` itself: when a duplicate IS found and `skipDuplicateCheck` is false, instead of throwing, it should **update the existing project** with the new data (same upsert behavior the edge function uses).

### Change 1: Skip duplicate check in bulk selected mode (line 594)
```typescript
// Current:
await approveImportInDb(item);

// Fixed:
await approveImportInDb(item, true);
```

### Change 2: Make approveImportInDb use upsert instead of insert-only (lines 401-407)

Replace the insert with an upsert using `.upsert()` on the `slug` column, so if the project already exists it gets updated rather than failing:

```typescript
// Current (line 401-405):
const { data: newProject, error: projectError } = await supabase
  .from("projects")
  .insert(projectData)
  .select()
  .single();

// Fixed:
const { data: newProject, error: projectError } = await supabase
  .from("projects")
  .upsert(projectData, { onConflict: 'slug' })
  .select()
  .single();
```

This way even if a project with that slug exists, it updates the record instead of failing.

### Change 3: Handle images for existing projects (lines 409-423)

Before inserting images, delete old ones for the project to avoid duplicates:

```typescript
if (importData.images.length > 0 && newProject) {
  // Delete old images first
  await supabase.from("project_images").delete().eq("project_id", newProject.id);
  
  // Then insert new ones
  const imageInserts = ...
}
```

Same for documents (lines 426-439).

## Files to Modify

| File | Change |
|---|---|
| `src/components/listing-admin/ProjectApprovalQueue.tsx` | 1. Use upsert instead of insert in `approveImportInDb` 2. Delete old images/docs before inserting 3. Pass `skipDuplicateCheck=true` in bulk loop |
