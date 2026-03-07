

# Fix: Admin Edit Audit Trail, Location Flyover Broken Animation, and Hover Artifacts

## 3 Issues to Fix

### 1. Admin Edit Audit Trail for Projects and Developers

**Current state**: Projects and developers have `updated_at` timestamps but no audit log tracking WHAT was changed. The admin project grid (`ListingAdmin.tsx` lines 777-818) and `ProjectPreviewModal` don't show last edit date or change details. No `admin_edit_log` table exists in the database.

**Plan**:

**A. Create `admin_edit_log` table** (SQL migration):
```sql
CREATE TABLE public.admin_edit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL, -- 'project' or 'developer'
  entity_id uuid NOT NULL,
  entity_name text,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL, -- 'update', 'create', 'delete', 'upload_image', 'upload_document', 'delete_document'
  changed_fields text[], -- array of field names that were changed
  summary text, -- human-readable summary like "Updated description, price_from, payment_plan"
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.admin_edit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read edit logs" ON public.admin_edit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert edit logs" ON public.admin_edit_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX idx_admin_edit_log_entity ON public.admin_edit_log(entity_type, entity_id);
```

**B. Log edits in `ListingAdmin.tsx`**:
- In `handleSaveProject`: Compare `formData` fields against `selectedProject` to detect which fields changed. Insert an `admin_edit_log` row with the list of changed field names and a summary.
- In `handleFileUpload`, `handleImageUpload`, `handleDeleteDocument`: Insert log entries for document/image operations.

**C. Show last edit info on project cards** (`ListingAdmin.tsx` lines 794-816):
- Below the developer name and price, add a line showing `updated_at` formatted as relative time (e.g., "Edited 2 days ago").
- Fetch latest `admin_edit_log` entry for each visible project to show what was last changed (e.g., "Last: description, images").

**D. Show last edit info in `ProjectPreviewModal`**:
- Add a "Last Edited" info section showing date + summary of changes from the audit log.

**E. Same for Developer Visibility Panel** (`DeveloperVisibilityPanel.tsx`):
- Show `updated_at` next to each developer name.
- Log visibility toggle changes to `admin_edit_log`.

### 2. Location Flyover Animation Stuck / Not Working

**Root cause**: The `FlyoverController` uses `setTimeout` to sequence `map.flyTo()` calls at fixed intervals (3s, 9s, 16s). The animation starts (step 1 "UAE Overview" shows), but `map.flyTo()` at step 2 doesn't visually animate. This is because:
1. The map has `dragging={false}` and `scrollWheelZoom={false}` — while `flyTo` should still work, some Leaflet builds require the map to be in a valid rendering state.
2. More critically: the `useEffect` in `FlyoverController` has `[playing, target, map, onStepChange, onComplete]` as deps. If `onStepChange` or `onComplete` change reference between renders (they're `useCallback` but with dependencies), the effect re-runs, clears timers, and resets `hasFlown.current = false` — but then immediately re-runs with `playing=true`, causing `hasFlown.current` to block re-execution.

**Fix in `ProjectLocationFlyover.tsx`**:
- Use `useRef` for the callback functions instead of passing them as effect dependencies, preventing re-renders from canceling timers.
- Add `map.invalidateSize()` before starting the flyover to ensure the map container is properly sized.
- Wait for Leaflet's `moveend` event instead of fixed timeouts for more reliable sequencing:
  ```
  Step 1: setView to UAE (instant) → wait 3s
  Step 2: flyTo regional → listen for 'moveend' event
  Step 3: flyTo project → listen for 'moveend' event  
  Step 4: Complete
  ```
- This ensures animations complete properly regardless of browser rendering speed.

### 3. White Divider/Artifact on Hover Over Flyover

**Root cause**: The Leaflet map tiles and the `.premium-location-pin` div icon may have default browser focus/hover outlines. The `premium-location-pin` class sets `background: none !important; border: none !important;` but doesn't suppress `:focus` or `:hover` styles. Additionally, Leaflet's default CSS adds borders to `.leaflet-container a` and various map control elements.

**Fix in `ProjectLocationFlyover.tsx`**:
- Add CSS to suppress all default outlines/borders on the flyover map:
  ```css
  .leaflet-container * { outline: none !important; }
  .leaflet-tile { border: none !important; }
  ```
- Add `pointer-events: none` to the overlay elements during animation to prevent hover interactions.

## Files to Modify

1. **Database migration**: Create `admin_edit_log` table
2. **`src/pages/ListingAdmin.tsx`**: Log edits, show `updated_at` + last edit summary on project cards and preview modal
3. **`src/components/listing-admin/ProjectPreviewModal.tsx`**: Add last edited info section
4. **`src/components/listing-admin/DeveloperVisibilityPanel.tsx`**: Show `updated_at`, log visibility changes
5. **`src/components/project-detail/ProjectLocationFlyover.tsx`**: Fix animation sequencing with `moveend` events, fix hover artifacts with CSS

