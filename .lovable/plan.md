
# Master Implementation Plan: Reelly × Provident Full Synchronization

## 1. Core Sync Engine Rebuild (Backend)

The synchronization pipeline will be hardened to ensure 100% data capture and persistence.

### A. Upgrade `reelly-api-sync` (The Fetcher)
- **Persistence**: Modify to update `sync_jobs` table with `current_cursor` and `next_cursor` after every batch.
- **Resumability**: On startup, check for `running` or `paused` jobs in `sync_jobs` and resume from the saved cursor instead of starting over.
- **Data Integrity**: Ensure it captures high-level metadata (price, location, developer) correctly into `pending_project_imports`.

### B. Upgrade `reelly-fetch-details` (The Enricher)
- **Deep Fetch**: Ensure it extracts and saves:
  - Floor Plans (PDFs & Images)
  - Brochures & Payment Plans
  - Full Amenities List
  - Unit Types & Inventory
- **Asset Logic**: Fix `reelly-fill-missing-assets` to correctly download/proxy external assets to Supabase Storage if needed, or validate external URLs.

### C. Upgrade `bulk-approve-imports` (The Publisher)
- **Parity Mapping**: rewrite mapping logic to ensure 1:1 transfer from `pending_project_imports` to `projects`:
  - `floor_plan_types` (JSONB) -> `projects.floor_plan_types`
  - `documents` -> `project_documents` table
  - `images` -> `project_images` table
  - `amenities` -> `projects.amenities`
  - `payment_plan` & `handover` details.
- **Overwrite Mode**: Enforce "Always Overwrite" logic as requested, ensuring Reelly data updates existing records.

### D. Fix `reelly-developers-sync`
- **Logo Extraction**: Ensure developer logos are extracted and saved to `developers` table.
- **Linkage**: Ensure projects are correctly linked to developers via `developer_id` foreign key.

## 2. AI Interior Design Generation (New Feature)

### A. New Edge Function: `batch-generate-interiors`
- **Logic**: Iterates through projects that are missing interior images.
- **AI Model**: Uses `google/gemini-3-pro-image-preview` (Nano banana pro) for high-quality visuals.
- **Prompt**: Generates "Luxury Dubai interior, [Project Style], photorealistic, 8k" based on project description.
- **Output**: Saves generated images to `project_images` with `is_generated=true` flag.
- **Integration**: Triggered automatically during the "Full Sync" process (Step 4 in Import Panel).

## 3. Developer Directory & UI Upgrade

### A. Developer Listing Page
- **Card Design**: Update `DeveloperCard.tsx` to match Provident's layout (Logo + Hero Image + Stats).
- **Data Source**: Use `developers` table enriched by Reelly data.

### B. Developer Detail Page
- **Map Integration**: Ensure `DeveloperProjectsMap` is visible and filters correctly for the specific developer.
- **Sections**: Add "About", "Stats", and "Active Projects" sections merging Reelly descriptions.

## 4. Project Detail Parity

### A. Layout Updates (`ProjectDetailLayout.tsx`)
- **Sections**: Verify and fix rendering of:
  - Floor Plan Gallery (Tabs for unit types)
  - Brochure Download (Premium Card)
  - Payment Plan Visualization
  - Construction Updates (from Reelly status)
- **Maps**: Ensure `ProjectLocationMap` uses precise coordinates from Reelly.

## 5. Admin Panel & Persistence

### A. Sync Dashboard
- **State Management**: Update `ReellyImportPanel.tsx` to read job status from DB on mount.
- **Resume Button**: Add explicit "Resume Sync" button if a job was interrupted.
- **Progress Tracking**: Real-time progress bars linked to DB rows processed.

## 6. Execution Sequence

1.  **Backend**: Deploy upgraded `reelly-api-sync` and `bulk-approve-imports`.
2.  **Backend**: Deploy `batch-generate-interiors`.
3.  **Frontend**: Update `ReellyImportPanel` to support new workflow.
4.  **Frontend**: Update `DeveloperDetail` and `ProjectDetail` layouts.
5.  **Data Fix**: Run a full sync to repair existing data.

