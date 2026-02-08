
# Fixing Listing Admin: Sync Skipping, Navigation, and Full Extraction

## Issues Identified

### Issue 1: "Skipped (Already Approved): 268" When All 1,804 Are Pending
**Root Cause Analysis:**
- The edge function `reelly-api-sync` correctly skips projects with `status='approved'`
- BUT the database shows **all 1,804 projects are in "pending" status** - none are approved
- The skip count is actually coming from **duplicate detection** (line 186: `error?.code === "23505"`) and **re-sync of existing pending records**
- When you run sync again on projects that already exist as "pending", it UPDATES them (counts as "updated") rather than inserting new ones
- **Confusion**: The 268 skipped are likely from the in-memory existMap matching `approved` from a previous batch, OR duplicate records
- **Real Problem**: The user expects a FRESH full extraction but is getting incremental updates

### Issue 2: "Open Approval Queue" Button Not Working
**Root Cause:**
```typescript
// Line 387 in ReellyImportPanel.tsx
navigate("/listing-admin?view=sync&syncTab=approvals&source=reelly", { replace: true });
```
- This navigates to `view=sync` but the new unified system maps this to `data-ops`
- **BUT** the Tabs component uses `defaultValue="reelly"` (uncontrolled)
- Even if the URL has `syncTab=approvals`, the Tabs don't respond to URL params
- The `window.dispatchEvent(new PopStateEvent('popstate'))` is a hacky workaround that doesn't work

### Issue 3: Full Extraction Not Actually Doing "Full" Extract
**Root Cause:**
- The sync respects approved status and skips approved records by design
- User wants an **ALWAYS OVERWRITE** mode that updates ALL records regardless of status
- Current logic at line 175: `if (existMap.get(extId) === 'approved') { skipped++; continue; }`

---

## Implementation Plan

### Phase 1: Fix Edge Function - Add "force_overwrite" Mode

**File: `supabase/functions/reelly-api-sync/index.ts`**

Add a new parameter `force_overwrite` that bypasses the approved-skip logic:

```typescript
// Line ~116
const forceOverwrite = body.force_overwrite === true;

// Line ~175 - modify skip logic
for (const p of page.results) {
  try {
    const extId = `reelly_${p.id}`;
    // Only skip approved if NOT in force mode
    if (!forceOverwrite && existMap.get(extId) === 'approved') { 
      skipped++; 
      continue; 
    }
    // ... rest of sync logic
    
    // Line ~181 - also update approved records in force mode
    if (ex) {
      if (!forceOverwrite && ex.status === 'approved') { skipped++; continue; }
      await supabase.from("pending_project_imports").update({ 
        ...mapped, 
        // In force mode, keep approved status; otherwise use pending
        status: forceOverwrite ? ex.status : 'pending',
        updated_at: new Date().toISOString() 
      }).eq("id", ex.id);
      updated++;
    }
  }
}
```

### Phase 2: Fix ReellyImportPanel - Add Force Overwrite to Full Sync

**File: `src/components/listing-admin/ReellyImportPanel.tsx`**

Update `handleSyncProjects` to pass `force_overwrite: true` for full sync:

```typescript
// Around line 885-893
const { data, error } = await supabase.functions.invoke("reelly-api-sync", {
  body: {
    action: "sync",
    limit: pageSize,
    cursor,
    fullSync,
    job_id: currentJobId,
    resume_cursor: cursor,
    force_overwrite: fullSync, // ADD THIS - always overwrite on full sync
  },
});
```

### Phase 3: Fix "Open Approval Queue" Navigation

**Problem:** The Tabs component is uncontrolled and doesn't respond to URL params.

**Solution A - Use Controlled Tabs in ListingAdmin.tsx:**

The parent `ListingAdmin.tsx` needs to:
1. Read `syncTab` from URL params
2. Pass it as controlled `value` to the Tabs component
3. Export a way for children to change the tab

**File: `src/pages/ListingAdmin.tsx`**

```typescript
// Add state for controlled Data Ops tab
const [dataOpsTab, setDataOpsTab] = useState<string>("reelly");

// In useEffect that reads URL params, also read syncTab
useEffect(() => {
  const params = new URLSearchParams(location.search);
  const view = params.get("view");
  const syncTab = params.get("syncTab");
  
  // Map legacy views to data-ops
  const legacyToNew = { 'sync': 'data-ops', 'reelly': 'data-ops', 'data-sources': 'data-ops' };
  const mappedView = legacyToNew[view || ''] || view;
  
  if (mappedView && allowed.has(mappedView) && mappedView !== activeView) {
    setActiveView(mappedView);
    // Also set the sub-tab if provided
    if (syncTab && ['reelly', 'provident', 'approvals', 'external'].includes(syncTab)) {
      setDataOpsTab(syncTab);
    }
  }
}, [location.search]);

// Make Tabs controlled
<Tabs value={dataOpsTab} onValueChange={setDataOpsTab} className="space-y-6">
```

**Solution B - Fix goToApprovalQueue in ReellyImportPanel:**

Update the navigation to use the new URL format:

```typescript
const goToApprovalQueue = () => {
  // Navigate to Data Ops view with approvals tab
  navigate("/listing-admin?view=data-ops&syncTab=approvals", { replace: true });
};
```

### Phase 4: Fix Full Extraction Button Confirmation Text

**File: `src/components/listing-admin/ReellyImportPanel.tsx`**

Update the confirmation dialog to clarify OVERWRITE behavior:

```typescript
// Around line 686
const handleFullExtraction = async () => {
  if (!confirm(
    "🚀 FULL EXTRACTION (OVERWRITE MODE)\n\n" +
    "This will:\n" +
    "1. Fetch ALL 1,805 projects from Reelly API\n" +
    "2. OVERWRITE all existing pending records with fresh data\n" +
    "3. Sync all 549 developers\n" +
    "4. Backfill floor plans, amenities, documents\n" +
    "5. Extract areas from projects\n\n" +
    "⚠️ This will take 15-30 minutes. All data will be refreshed.\n\n" +
    "Continue?"
  )) {
    return;
  }
  // ... rest of function
};
```

---

## Technical Summary

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Sync skipping 268 records | Edge function skips approved; user wants full overwrite | Add `force_overwrite` param to edge function |
| Open Approval Queue not clicking | Tabs are uncontrolled; URL params ignored | Make Tabs controlled + update navigation URL |
| Full extraction not extracting all | Same skip logic applies | Pass `force_overwrite: true` on full sync |

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/reelly-api-sync/index.ts` | Add `force_overwrite` param to bypass approved-skip logic |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Pass `force_overwrite: true` on full sync; fix `goToApprovalQueue` URL |
| `src/pages/ListingAdmin.tsx` | Make Data Ops Tabs controlled; read `syncTab` from URL |

---

## Expected Behavior After Fix

1. **Full Sync Button**: Will now overwrite ALL 1,804 projects with fresh Reelly data
2. **"Open Approval Queue" Button**: Will switch to the Approvals tab within Data Ops
3. **Progress Persistence**: Sync progress remains in `sync_jobs` table (already fixed in previous update)
4. **Stats Display**: Will show accurate counts:
   - `Inserted`: New projects not previously in queue
   - `Updated`: Existing projects with fresh data
   - `Skipped`: Only truly duplicate entries (rare)

---

## Database State Clarification

Currently:
- **1,804 projects** in `pending_project_imports` with `status='pending'`
- **0 projects** with `status='approved'`

After fix:
- Full sync will UPDATE all 1,804 records with latest Reelly data
- Stats will correctly show `Updated: 1804` instead of confusing `Skipped: 268`
