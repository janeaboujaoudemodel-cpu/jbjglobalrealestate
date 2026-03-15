

# Session 7 — Save / Draft / Preset / Owner Asset System

## Current State Analysis

### What exists:
1. **Save Project** (`saveProjectState`): Persists layout_json + selected_design_id to `stamp_projects` table AND writes a localStorage draft key (`jbj_draft_stamp-generator_{projectId}`). Shows no post-save dialog — just a toast "Project saved".
2. **Save Asset** (`saveCurrentAsBrandAsset`): Inserts into `brand_assets` + `design_assets` tables via `useSaveBrandAsset()`. Works but no confirmation dialog or navigation prompt.
3. **Presets** (`StampLibraryPanel` in StampRightPanel): Stored in `localStorage('stamp-custom-presets')`. Anyone can save presets — no owner restriction. Presets store svgSource + templateKey but NOT the full config (colors, fonts, spacing).
4. **Drafts** (`StampLibraryPanel`): Reads localStorage keys `jbj_draft_stamp-generator_*`. Each draft stores only `{ name, savedAt, projectId }` — no actual design state. "Continue" just navigates to the project URL. Functionally identical to opening from Projects Dashboard.
5. **Projects Dashboard** (`StampProjectsDashboard`): Full CRUD with soft-delete, recover, duplicate, bulk operations. This IS the real "saved stamps library" but the Library tab in the right panel doesn't link to it.

### Problems:
- **Draft is fake**: Draft only stores a pointer (projectId) — no snapshot of design state. It's just a bookmark.
- **No post-save dialog**: After saving, user gets a toast but no "View Draft" / "Open Library" / "Continue Editing" options.
- **Presets not owner-restricted**: Any authenticated user can save presets. No server-side persistence.
- **Library tab is disconnected**: Shows localStorage presets + drafts but doesn't show real saved stamps from DB.
- **No clear separation** between Draft (work-in-progress), Preset (reusable config), and Asset (brand material).

## Implementation Plan

### 1. Real Save Draft with Post-Save Dialog

**In `StampGeneratorPage.tsx`**:
- After `saveProjectState` succeeds, show a modal/dialog with three options:
  - "View in Projects" → navigates to `/toolkit/stamp-generator/projects`
  - "Open Draft Library" → switches right panel to Library tab
  - "Continue Editing" → closes dialog
- The existing save already persists the full state (layout_json with colors, fonts, icon style, monogram colors + selected_design_id pointing to the standard model's DB row). This is a real draft.
- Remove the misleading localStorage draft write from `saveProjectState` since the DB persistence IS the draft. Keep localStorage only for session recovery (crash protection).

**New component `StampSaveDialog.tsx`**:
- Simple dialog with the 3 action buttons above
- Shows project name + timestamp + thumbnail of current standard

### 2. Saved Stamps Library in Right Panel

**In `StampRightPanel.tsx` — Library tab rewrite**:
- Replace `StampLibraryPanel` (localStorage-based) with a DB-backed panel that shows:
  - **My Stamps** section: Queries `stamp_projects` for user's projects with `selected_design_id` not null. Shows thumbnail (from the linked `stamp_designs.svg_source`), project name, date. Actions: Open, Duplicate, Rename, Delete.
  - **Presets** section: Shows saved presets (see Task 3 below).
  - **Brand Assets** section: Shows stamps from `brand_assets` table where `asset_type = 'stamp'`.
- Each section collapsible with counts.

### 3. Owner-Only Preset System

**Database**: Create a `stamp_presets` table:
```sql
CREATE TABLE public.stamp_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  config_json JSONB NOT NULL,
  svg_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.stamp_presets ENABLE ROW LEVEL SECURITY;
```

RLS: Only the owner (via `has_role(auth.uid(), 'owner')` or `has_role(auth.uid(), 'admin')`) can INSERT/UPDATE/DELETE. All authenticated users can SELECT (so presets are visible to team but only owner creates them).

**"Save as Preset" button** in the Library tab: Check `isOwner` from `useOwnerVerification()`. If not owner, hide the button or show disabled with tooltip "Owner only".

The preset's `config_json` stores the full rendering config: border style, separator style, circle gap, fonts, arc spreads, colors — everything needed to reproduce the stamp with different company data.

### 4. Save Asset Flow Enhancement

**In `StampGeneratorPage.tsx`**:
- When "Save Asset" is clicked, show a confirmation dialog:
  - Asset name (editable, defaults to company name + " Stamp")
  - Preview thumbnail
  - "Save to Brand Library" button
- After saving, toast with "View in Brand Library" action link.

### 5. Clear Terminology Separation

**In UI labels and toasts**:
- **Save (Project)**: "Save Project" — persists current editing state to DB. Reopenable from Projects Dashboard.
- **Save as Preset** (owner only): "Save as Preset" — saves the style configuration (not the company data) for reuse on other projects.
- **Save Asset**: "Save to Brand Library" — saves the final SVG as a permanent brand asset for use in documents, emails, etc.

**In Library tab**, show three clearly labeled sections with distinct icons:
1. 📁 My Projects (from `stamp_projects`)
2. 🎨 Style Presets (from `stamp_presets`, owner-managed)
3. 📦 Brand Assets (from `brand_assets`)

## Files Modified

| File | Changes |
|------|---------|
| **Migration** | Create `stamp_presets` table with RLS (owner INSERT/UPDATE/DELETE, authenticated SELECT) |
| `StampGeneratorPage.tsx` | Add post-save dialog state, remove localStorage draft write, add save-asset confirmation dialog, import `useOwnerVerification` |
| `StampRightPanel.tsx` | Rewrite Library tab with 3 DB-backed sections (Projects, Presets, Brand Assets). Add owner-gated "Save as Preset". Remove `StampLibraryPanel` localStorage component |
| `StampSaveDialog.tsx` (new) | Post-save dialog with View Projects / Open Library / Continue Editing |
| `StampProjectHeader.tsx` | No changes needed — already has Save and Save Asset buttons |

## What Will NOT Change
- StampLeftPanel (sidebar controls)
- StampInteractivePreview
- stampOfficialTemplate.ts (rendering engine)
- Edge functions
- Export flow
- StampProjectsDashboard (already works correctly as the projects list)

