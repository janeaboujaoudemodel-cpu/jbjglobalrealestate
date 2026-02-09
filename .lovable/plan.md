

## Goal
Fix three issues:
1. "Select All" should select and approve ALL 1,809 pending imports (not just the 60 loaded on screen)
2. Projects remain editable/repairable after approval
3. Remove duplicate developer entries from the database

---

## Root Causes

### Issue 1: Select All only selects 60 items
- `PAGE_SIZE = 60` in `ProjectApprovalQueue.tsx` (line 108)
- `selectAll()` (line 727) only selects from `imports` array, which contains at most 60 loaded items
- The bulk approval then loops through only those 60 items one by one via `handleConfirmedApproval`

### Issue 2: Edge function also limited
- `bulk-approve-imports` edge function defaults to `limit = 200` per call
- Even if called directly, it only processes 200 at a time

### Issue 3: Duplicate developers in database
Found 4 developers with duplicate entries (same name, different slugs):
- "Adventz and East and West International Group" (2 rows)
- "Arabian Hills Investment and Real Estate Development" (2 rows)
- "PREDMET.CONSTRUCTION" (2 rows)
- "ZaZEN Properties" (2 rows)

---

## Implementation Plan

### A) Add "Approve ALL Pending" button that calls the edge function in a loop

**File:** `src/components/listing-admin/ProjectApprovalQueue.tsx`

Instead of trying to load all 1,809 items into the browser and process them one by one, the "Select All + Approve" flow should call the `bulk-approve-imports` edge function repeatedly in batches until all items are processed.

Changes:
1. Add a new **"Approve ALL (1,809)"** button alongside the existing "Select All" button that appears when there are more items than loaded
2. This button triggers a confirmation dialog (using the existing `ApprovalConfirmDialog` with the full count, requiring manual count typing since it exceeds 100)
3. On confirmation, call the `bulk-approve-imports` edge function in a loop:
   - Each call processes up to 500 items (pass `limit: 500`)
   - Loop continues until the function returns `approved: 0` (nothing left)
   - Progress bar updates after each batch
   - Final toast shows total approved count

New function `handleApproveAllPending`:
```text
async handleApproveAllPending():
  setConfirmDialogMode("all")
  setConfirmDialogCount(totalCount)  // 1,809
  setConfirmDialogOpen(true)
  
  // On confirm:
  setIsBulkProcessing(true)
  setBulkAction("approve")
  let totalApproved = 0
  
  loop:
    response = supabase.functions.invoke("bulk-approve-imports", {
      body: { limit: 500 }
    })
    totalApproved += response.stats.approved
    setBulkDone(totalApproved)
    if response.stats.approved === 0: break
  
  toast("All done: {totalApproved} approved")
  fetchPendingImports()
```

4. Update `handleConfirmedApproval` to detect when `confirmDialogMode === "all"` and call the edge-function loop instead of the item-by-item client loop

### B) Keep existing Select All for partial selections
The current "Select All" button will continue to work for the loaded page (for selective operations like delete). But the new "Approve ALL" button handles the full queue.

### C) Delete duplicate developers from database
**Action:** Data cleanup via SQL

Delete the duplicate developer rows, keeping the one with the cleaner slug (without "and-" articles):

```sql
-- Keep: adventz-east-west-international-group, delete: adventz-and-east-and-west-international-group
-- Keep: arabian-hills-investment-real-estate-development, delete: arabian-hills-investment-and-real-estate-development
-- Keep: predmet-construction, delete: predmetconstruction  
-- Keep: zazen-properties, delete: zzen-properties

DELETE FROM developers WHERE id IN (
  'ee71594f-835e-4d02-9f6b-afecc80353b1',
  'd34f01bd-e689-48c7-b0ff-1fc87056c6a3', 
  '16db3698-d395-42a6-a07b-6a21873865b1',
  '8d01fcdc-b875-4ce0-a21c-d55c6eabd9cd'
);
```

First reassign any projects pointing to the deleted developer IDs to the kept ones.

### D) Projects remain editable after approval
This already works -- approved projects go into the `projects` table and are fully editable from the Admin panel. The "repair" and "edit" functionality on the Admin listing pages operates on the `projects` table. No code changes needed for this.

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/listing-admin/ProjectApprovalQueue.tsx` | MODIFY | Add "Approve ALL Pending" button that calls edge function in a loop for the full 1,809 queue |
| Database | DATA DELETE | Remove 4 duplicate developer rows, reassign any linked projects |

---

## QA Checklist
1. Click "Approve ALL" -- confirmation dialog shows full count (1,809) and requires typing the number
2. After confirming, progress bar updates as batches complete
3. All 1,809 items get approved (pending queue becomes empty)
4. Developer directory shows no duplicate cards
5. Approved projects appear in the main listings and can be edited from Admin
