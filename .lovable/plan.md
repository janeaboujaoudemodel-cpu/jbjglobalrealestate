

# Critical Fixes: Listing Admin Access, Sync Progress, and UI Unification

## Issues Identified

### 1. Access Denied (/403) on Listing Admin - Race Condition
**Root Cause:** The `/listing-admin` route is wrapped with **BOTH** `OwnerGuard` and `ListingAdminGuard`:
```tsx
// App.tsx line 572
<Route path="/listing-admin" element={<OwnerGuard><ListingAdminGuard><ListingAdmin /></ListingAdminGuard></OwnerGuard>} />
```

The network logs show that `verify-owner` is returning `{"isOwner":true}` correctly, but there's a timing issue:
- `OwnerGuard` waits for owner verification
- **BUT** `ListingAdminGuard` **also** makes its own owner check and role checks separately
- When the page refreshes or navigates quickly, one guard may resolve before the other, causing a brief redirect to `/403`

Additionally, `ListingAdminGuard.tsx` duplicates owner verification logic instead of consuming `isOwner` from AuthContext.

### 2. Reelly Sync Progress Loss After Refresh
**Root Cause:** The `ReellyImportPanel.tsx` stores progress in local React state, not in the database:
- `syncProgress` and `syncResult` are React useState values
- When page refreshes, these are lost
- The `check_resume` action checks `sync_jobs` table for jobs with `source='reelly'`, but `createJob()` in `useSyncJobs.ts` never sets the `source` column!

```typescript
// useSyncJobs.ts line 146-161 - MISSING: source column
const { data, error } = await supabase
  .from("sync_jobs")
  .insert({
    job_type: jobType,  // "reelly_quick" or "reelly_full"
    status: "running",
    // ...
    // source: "reelly" ← NOT SET!
  })
```

### 3. UI Styling Inconsistency (Mixed White/Black Backgrounds)
**Root Cause:** The Listing Admin page has a champagne gradient shell, but child components (`SyncDashboard`, `ReellyImportPanel`, `ExtractionJobsPanel`, `PendingUpdatesQueue`) use their own styling:
- `SyncDashboard` uses mixed backgrounds
- `ReellyImportPanel` uses champagne properly
- `ExtractionJobsPanel` uses default shadcn Card styling
- `PendingUpdatesQueue` uses `bg-white`

### 4. Duplicate Extraction Areas
**Current Structure:**
- **Sync Dashboard** tab → Provident sync + test extraction
- **Reelly Import** tab → Reelly API sync
- **Data Sources** tab → `ExtractionJobsPanel` + `PendingUpdatesQueue`

User wants: **Unified into one "Data Ops" area with tabs**

---

## Implementation Plan

### Phase 1: Fix Access Denied Race Condition

**File: `src/components/ListingAdminGuard.tsx`**
- Remove the duplicate `verify-owner` call
- Consume `isOwner` directly from `AuthContext` (already passed in)
- Simplify logic: If `isOwner === true`, allow immediately without DB role checks

```tsx
// BEFORE: Makes separate role checks even when isOwner=true
if (isOwner) {
  if (!cancelled) setStatus("allowed");
  return;
}
// Then proceeds to check has_role, listing_admins table...

// AFTER: Same logic, but ensure we wait for ownerLoading
useEffect(() => {
  if (authLoading || ownerLoading) return; // Wait for both
  if (!user) { setStatus("unauthenticated"); return; }
  if (isOwner) { setStatus("allowed"); return; } // Owner override
  // Only check DB roles for non-owners...
}, [user, authLoading, isOwner, ownerLoading]);
```

**File: `src/App.tsx` line 572**
- Consider removing redundant `OwnerGuard` wrapper since `ListingAdminGuard` already handles Owner override
- OR ensure both guards wait for the same ownerLoading state

### Phase 2: Fix Reelly Sync Progress Persistence

**File: `src/hooks/useSyncJobs.ts`**
- Add `source` column to `createJob()`:
```typescript
const { data, error } = await supabase
  .from("sync_jobs")
  .insert({
    job_type: jobType,
    source: jobType.startsWith('reelly') ? 'reelly' : 'provident', // ADD THIS
    status: "running",
    // ...
  })
```

**File: `src/components/listing-admin/ReellyImportPanel.tsx`**
- When starting sync, call `createJob('reelly_full', totalProjects)` BEFORE looping
- Pass `job_id` to each `reelly-api-sync` call
- On mount, check for existing job and restore UI state from `activeJob`

```typescript
// On mount, restore from active job
useEffect(() => {
  if (activeJob?.job_type?.startsWith('reelly')) {
    setIsSyncing(activeJob.status === 'running');
    setSyncProgress({
      fetched: activeJob.stats_created + activeJob.stats_updated + activeJob.stats_skipped,
      total: activeJob.total_pages
    });
  }
}, [activeJob]);
```

### Phase 3: Unify UI Styling

**Files to Update:**
- `ExtractionJobsPanel.tsx` - Replace default Card with champagne gradient:
```tsx
<Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30">
```

- `PendingUpdatesQueue.tsx` - Replace `bg-white` with champagne:
```tsx
<Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30">
```

- `SyncDashboard.tsx` - Apply consistent champagne styling to all inner cards

### Phase 4: Consolidate into Single "Data Ops" Area

**File: `src/pages/ListingAdmin.tsx`**
- Replace three separate views (`data-sources`, `sync`, `reelly`) with ONE unified view
- Add internal Tabs inside the Data Ops view:

```tsx
{activeView === 'data-ops' && (
  <div className="container mx-auto px-4 py-6">
    <Tabs defaultValue="reelly" className="space-y-6">
      <TabsList className="bg-zinc-100 border border-zinc-200">
        <TabsTrigger value="reelly" className="data-[state=active]:bg-gradient-to-r ...">
          Reelly Sync
        </TabsTrigger>
        <TabsTrigger value="provident" className="data-[state=active]:bg-gradient-to-r ...">
          Provident Sync
        </TabsTrigger>
        <TabsTrigger value="approvals" className="data-[state=active]:bg-gradient-to-r ...">
          Approval Queue
        </TabsTrigger>
        <TabsTrigger value="external" className="data-[state=active]:bg-gradient-to-r ...">
          External Sources
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="reelly">
        <ReellyImportPanel />
      </TabsContent>
      <TabsContent value="provident">
        <SyncDashboard />
      </TabsContent>
      <TabsContent value="approvals">
        <PendingUpdatesQueue onRefresh={refetchProjects} />
      </TabsContent>
      <TabsContent value="external">
        <ExtractionJobsPanel />
      </TabsContent>
    </Tabs>
  </div>
)}
```

- Update navigation buttons to show single "Data Ops" button instead of 3 separate buttons

---

## Technical Summary

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Access Denied (/403) | Race between OwnerGuard and ListingAdminGuard | Simplify guard chain; consume isOwner from context directly |
| Sync progress lost | `source` column not set; UI state not restored from DB | Set `source='reelly'` in createJob; restore UI from activeJob |
| Mixed backgrounds | Components use inconsistent styling | Apply champagne gradient to all cards |
| Duplicate areas | 3 separate tabs for sync/extraction | Consolidate into single "Data Ops" tabbed view |

---

## Database Changes Required

Add `source` default and constraint if not already present:
```sql
-- Verify sync_jobs has source column with 'reelly' as valid value
-- (Column already exists per schema query)
-- Just need to ensure frontend sets it correctly
```

No schema migration needed - the `source` column already exists with default `'reelly'`.

---

## Files Changed

| File | Changes |
|------|---------|
| `src/components/ListingAdminGuard.tsx` | Consume isOwner from context; remove redundant checks |
| `src/hooks/useSyncJobs.ts` | Add `source` column to createJob |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Persist job to DB; restore state on mount |
| `src/components/listing-admin/ExtractionJobsPanel.tsx` | Apply champagne styling |
| `src/components/listing-admin/PendingUpdatesQueue.tsx` | Apply champagne styling |
| `src/components/listing-admin/SyncDashboard.tsx` | Consistent champagne styling |
| `src/pages/ListingAdmin.tsx` | Consolidate 3 views into 1 "Data Ops" with internal tabs |

