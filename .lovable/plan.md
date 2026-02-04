

# Clean Database & Extract Fresh from Reelly Only

## Current State Analysis

Your database currently has:

| Table | Total Records | From Reelly | Fake/Old Data |
|-------|---------------|-------------|---------------|
| **Projects** | 0 | 0 | Already clean |
| **Pending Queue** | 794 | 778 | 16 Provident entries |
| **Areas** | 170 | 138 | 32 manually created |

The projects table is already empty. We need to clean the areas and pending queue, then sync fresh data from Reelly.

---

## Cleanup Plan

### Step 1: Delete Non-Reelly Areas (32 records)

Delete areas that were manually created (no `reelly_id`):
- JBR, Emaar Beachfront, Blue Waters Island
- Meydan, Dubailand, JLT, Sports City
- JVC, MBR City, Motor City, etc.

Keep the 138 areas that have valid `reelly_id` from Reelly API.

### Step 2: Delete Non-Reelly Queue Items (16 records)

Remove the 16 Provident-sourced entries from `pending_project_imports`:
- Palmiera Collective, Salva, Capeside Marina Residences
- The Grove, Grove Ridge, Mercedes-Benz Places, etc.

Keep the 778 Reelly queue items.

### Step 3: Fresh Reelly Sync (1803 projects)

After cleanup, trigger a full Reelly sync to:
1. Import all 1803 projects from Reelly API
2. Link developers automatically
3. Extract all areas from project locations
4. Auto-approve complete listings

---

## Implementation

### Update `wipe-and-rebuild` Edge Function

Add new options to support selective cleanup:

```typescript
// New parameters:
{
  confirm: true,
  mode: "reelly_only"  // New mode for Reelly-only cleanup
}
```

**Mode: "reelly_only"** will:
1. Delete all areas WITHOUT `reelly_id` (32 records)
2. Delete all queue items NOT from Reelly (16 records)  
3. Delete all projects (already 0)
4. Keep Reelly-sourced data intact

### Add Admin UI Button

Add a "Clean & Sync Reelly Only" button to the Listing Admin that:
1. Calls `wipe-and-rebuild` with `mode: "reelly_only"`
2. Automatically triggers `reelly-api-sync` for full 1803 projects
3. Triggers `reelly-areas-sync` to refresh areas

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/wipe-and-rebuild/index.ts` | Add `reelly_only` mode for selective cleanup |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Add "Clean & Sync Fresh" button |

---

## Expected Result After Cleanup

| Table | Before | After |
|-------|--------|-------|
| Projects | 0 | 1803 (all from Reelly) |
| Pending Queue | 794 | 1803 (all from Reelly) |
| Areas | 170 | ~138+ (all with reelly_id) |
| Developers | current | 547 (linked from Reelly) |

All data will be clean, consistent, and sourced exclusively from the Reelly API.

