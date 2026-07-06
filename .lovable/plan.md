## Plan

### 1) Rebuild the brochure extraction backend so it stops crashing
- Replace the current memory-heavy approach that downloads every PDF and converts each file to base64 in parallel.
- Process uploaded files in safe batches/sequentially with per-file size checks and no unbounded in-memory base64 loops.
- Return a clean structured response every time:
  - `extracted` fields only when confidently found
  - `files_read`, `files_skipped`, and readable per-file reasons
  - no `N/A`, no `unknown`, no fabricated values
- Improve client error handling so the toast shows the real extraction failure instead of generic “Edge Function returned a non-2xx status code”.
- Deploy/test the function directly with backend function curl/log checks before UI validation.

### 2) Wire Add Project publish to show the real project URL and clickable preview
- Update the auto-publish function response to return the published project `slug` and public path, not only the id.
- After publish, keep the user on a success/confirmation state instead of immediately navigating away.
- Show:
  - direct URL like `/project/project-slug`
  - copy/open buttons
  - clickable listing preview card
- Clicking the preview card must open the actual public project detail page created from that upload.

### 3) Fix backend emerald contrast at the source, not only global CSS
- Patch the visible backend components in the screenshots:
  - Owner overview lead “Open” buttons
  - “View All” button
  - follow-up arrow/open/new pills
  - Add Project wizard Back / Keep as full text / Apply text buttons
  - backend icon tiles and active pills
- Add/adjust `data-surface="emerald"` or existing emerald primitives on the actual emerald controls so the existing white-ink lock applies reliably.
- Keep the button backgrounds/filters/layout unchanged; only force pure white text/icons on emerald surfaces.

### 4) Add a targeted rendered audit so regressions are caught
- Add or update a Playwright/audit script that scans owner/backend routes for visible dark text/icons inside emerald surfaces.
- Include `/owner`, `/owner/developers/new-project`, and CRM/lead-related backend views.
- Fail/report if any visible emerald surface has non-white text or icons.

### 5) Validate before reporting done
- Run backend function test for `ai-project-brochure-extract` and check logs for no memory-limit crash.
- Run an end-to-end owner flow:
  - open Add Project
  - upload/extract sample brochure if available or test the function with a controlled document URL
  - fill remaining required fields
  - publish
  - verify the success preview URL appears
  - open the public project page
- Capture screenshots proving:
  - extraction no longer returns the invalid non-2xx/unknown error
  - backend emerald buttons/pills have white text/icons
  - published project preview URL/card works

## Technical notes
- Root cause confirmed from backend logs: `ai-project-brochure-extract` hit `Memory limit exceeded` during file processing.
- Current function base64-loads fetched files in parallel, which is unsafe for multiple PDFs.
- Current publish flow already creates a project id but does not return slug/path to the wizard UI, so the direct link/preview cannot be shown yet.