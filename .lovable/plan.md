# Fix Listing Stats Display & Implement Reelly-Only Data Strategy with Restore Functionality

## ✅ IMPLEMENTED - February 2026

## Problem Summary

| Issue | Root Cause |
|-------|------------|
| **Approvals queue shows "1,336 target" for Reelly** | The source filter logic in `ProjectApprovalQueue.tsx` is not correctly applying Reelly's target (1,803) when the Reelly filter is active |
| **Queue + Complete count doesn't equal target** | Only 778 Reelly projects are currently synced; the remaining 1,025 need to be imported via Full Sync |
| **Provident and Reelly data are being mixed** | Current workflow doesn't enforce Reelly as the primary source with Provident as optional enrichment only |
| **No way to restore projects to Reelly-only state** | Missing functionality to remove Provident-added content and revert to pure Reelly data |

## Solution Architecture

### Phase 1: Fix Target Display in Approvals Queue

Update `ProjectApprovalQueue.tsx` to show correct target based on source filter:

```text
When sourceFilter === "reelly" → Show "1,803"
When sourceFilter === "provident" → Show "1,336"
When sourceFilter === "all" → Show actual totalCount
```

Current issue location: Line 1015 in `ProjectApprovalQueue.tsx` - the conditional is already there but may not be applying correctly when the URL parameter `source=reelly` is used on page load.

### Phase 2: Provident as Suggest-Only Enrichment

Modify the sync strategy so:
1. Reelly is the **primary and only** full extraction source
2. Provident is used **only** to scan for projects that exist in both systems and propose missing sections
3. Provident suggestions go to a separate approval queue - never auto-applied

**Database tracking:**
- Add a `source` column to track where each field came from (`reelly`, `provident_enrichment`, `manual`)
- Add a `provident_enrichments` JSON column to store which fields were added by Provident
- This allows one-click restoration to Reelly-only state

### Phase 3: Restore to Reelly-Only Functionality

#### 3.1 Global Restore Button
Location: ReellyImportPanel.tsx - new section "Data Integrity"

```text
+--------------------------------------------------+
| 🔄 Restore to Reelly-Only                        |
+--------------------------------------------------+
| Remove all Provident enrichments and restore     |
| projects to their original Reelly-only state.    |
|                                                  |
| [Restore All Projects to Reelly-Only]            |
+--------------------------------------------------+
```

This will:
- Clear all fields that were added by Provident (tracked via `provident_enrichments`)
- Delete pending Provident suggestions from `listing_pending_updates`
- Remove images/documents that were added from Provident sources

#### 3.2 Per-Project Restore Button
Location: Project detail page and/or approval queue preview

```text
[↩️ Restore to Reelly-Only]
```

This removes Provident enrichments for just that one project.

### Phase 4: New Edge Function - restore-to-reelly

Create `supabase/functions/restore-to-reelly/index.ts`:

```typescript
// Modes:
// - "single": Restore a single project by ID
// - "global": Restore all projects that have Provident enrichments
// - "pending_only": Just clear pending Provident suggestions

// Actions:
// 1. Find projects with source="reelly" that have provident_enrichments
// 2. Reset enriched fields to their original Reelly values (or null)
// 3. Delete any images/documents added from Provident sources
// 4. Clear listing_pending_updates where source is Provident
// 5. Clear provident_enrichments JSON column
```

### Phase 5: UI Updates

#### 5.1 ReellyImportPanel.tsx Enhancements

Add new card section:

```text
+--------------------------------------------------+
| 📊 Data Integrity                                |
+--------------------------------------------------+
| • Projects from Reelly: 778 (of 1,803 available) |
| • With Provident enrichments: 0                  |
| • Pending Provident suggestions: 0               |
+--------------------------------------------------+
| [Restore All to Reelly-Only] [Clear Suggestions] |
+--------------------------------------------------+
```

#### 5.2 ProjectApprovalQueue.tsx Fixes

1. Fix the target display to correctly show 1,803 for Reelly filter
2. Add source indicator on each card showing "Reelly" or "Reelly + Provident"
3. Add per-item restore button for enriched projects

#### 5.3 SyncDashboard.tsx Updates

1. Remove Provident-specific "Full Sync" options from main workflow
2. Move Provident tools to a "Deprecated/Legacy" section
3. Update the "1,336" references to clarify they're Provident-specific
4. Add prominent messaging that Reelly is the primary source

### Phase 6: Database Schema Changes

Add columns to `projects` table:

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS provident_enrichments jsonb DEFAULT NULL;
-- Stores: {"fields_added": ["amenities", "faqs", "location_distances"], "images_added": ["url1", "url2"], "enriched_at": "timestamp"}
```

Add columns to `pending_project_imports` table (if not already present):

```sql
ALTER TABLE pending_project_imports ADD COLUMN IF NOT EXISTS enrichment_source text DEFAULT NULL;
-- Values: "reelly", "provident", "manual"
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/listing-admin/ProjectApprovalQueue.tsx` | Fix target display logic, add restore button per item, add source indicator |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Add Data Integrity section with global restore, stats on enrichments |
| `src/components/listing-admin/SyncDashboard.tsx` | Move Provident tools to deprecated section, update messaging |
| `supabase/functions/restore-to-reelly/index.ts` | **NEW** - Edge function to handle restoration logic |
| Database migration | Add `provident_enrichments` column to projects table |

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/restore-to-reelly/index.ts` | Edge function for single/global restore to Reelly-only state |
| `src/components/listing-admin/DataIntegrityPanel.tsx` | Optional: Dedicated component for restore controls |

## Technical Implementation Details

### Target Display Fix (ProjectApprovalQueue.tsx)

The issue is on line 1015. Current code:
```tsx
{sourceFilter === "provident" ? "1,336" : sourceFilter === "reelly" ? "1,803" : totalCount ?? "..."}
```

This should work, but the URL parameter may not be initializing `sourceFilter` correctly on first load. Need to verify:
1. URL param `source=reelly` is being read correctly
2. State is initialized before the first render
3. The component re-renders when filter changes

### Restore Edge Function Logic

```typescript
async function restoreToReelly(supabase, options) {
  const { mode, projectId } = options;
  
  if (mode === "single" && projectId) {
    // Get project's provident_enrichments
    const { data: project } = await supabase
      .from("projects")
      .select("provident_enrichments")
      .eq("id", projectId)
      .single();
    
    if (project?.provident_enrichments) {
      const enrichments = project.provident_enrichments;
      
      // Build update to null out enriched fields
      const updates = {};
      for (const field of enrichments.fields_added || []) {
        updates[field] = null;
      }
      
      // Clear enrichments tracking
      updates.provident_enrichments = null;
      
      await supabase.from("projects").update(updates).eq("id", projectId);
      
      // Remove added images
      if (enrichments.images_added?.length) {
        await supabase
          .from("project_images")
          .delete()
          .in("image_url", enrichments.images_added);
      }
      
      // Remove added documents
      if (enrichments.documents_added?.length) {
        await supabase
          .from("project_documents")
          .delete()
          .in("file_url", enrichments.documents_added);
      }
    }
  }
  
  if (mode === "global") {
    // Same logic but for all projects with provident_enrichments IS NOT NULL
  }
  
  if (mode === "pending_only") {
    // Clear listing_pending_updates where source is Provident
    await supabase
      .from("listing_pending_updates")
      .delete()
      .ilike("source.name", "%provident%");
  }
}
```

### Provident Enrichment Flow (Future)

After this fix, the Provident workflow becomes:
1. User runs Reelly Full Sync → 1,803 projects imported
2. User clicks "Scan Provident for Missing Data" (new button)
3. System scans Provident, finds matching projects by name/slug
4. Creates suggestions in `listing_pending_updates` table
5. User reviews and approves/rejects suggestions
6. Approved enrichments are applied AND tracked in `provident_enrichments`
7. User can click "Restore to Reelly-Only" at any time to undo

## Expected Results

After implementation:
- **Target display shows correct number**: 1,803 for Reelly, 1,336 for Provident
- **Queue math is correct**: In Queue + Complete = Target (after Full Sync)
- **Provident is suggest-only**: Never auto-applied, always requires approval
- **Global restore button**: One-click to remove all Provident enrichments
- **Per-project restore**: Undo enrichments on individual projects
- **Clear separation**: Reelly tab is primary, Provident tools moved to legacy section
- **Full audit trail**: Know exactly which fields came from Provident vs Reelly

## Implementation Priority

| Step | Priority | Complexity |
|------|----------|------------|
| 1. Fix target display in ProjectApprovalQueue | ✅ DONE | Low |
| 2. Add provident_enrichments column | ✅ DONE | Low |
| 3. Create restore-to-reelly edge function | ✅ DONE | Medium |
| 4. Add Data Integrity panel with restore buttons | ✅ DONE | Medium |
| 5. Move Provident tools to deprecated section | Medium | Low |
| 6. Add per-project restore buttons | Medium | Medium |
| 7. Implement Provident suggest-only workflow | Low | High |

## Implementation Summary

### Completed:
1. **Database Migration**: Added `provident_enrichments` column to projects, `enrichment_source` to pending_project_imports, `data_source` to project_images and project_documents
2. **Edge Function**: Created `restore-to-reelly` with modes: stats, single, global, pending_only
3. **ProjectApprovalQueue.tsx**: Fixed target display to show 1,803 for Reelly, 1,336 for Provident
4. **ReellyImportPanel.tsx**: Added Data Integrity section with:
   - Load Integrity Stats button
   - Stats display (Reelly projects, Provident enrichments, images, docs, pending suggestions)
   - Restore All to Reelly-Only button
   - Clear Pending Suggestions Only button

