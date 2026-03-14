

## Plan: Developer Mode Project Upload — Duplicate Detection, Edit Restrictions, Approval Workflow & Session Summary

### Current State

- **DeveloperPortal.tsx** (1841 lines): Full developer portal with project upload (`handleSubmitProject`), session tracking (`sessionProjects` array), and an "End Session" button that currently just clears state and navigates to the projects tab.
- **ProjectDuplicateInspector.tsx**: Already exists in `listing-admin/` — searches `projects` and `pending_project_imports` for name/slug matches. Currently only used in `ListingAdmin.tsx` for admin project creation.
- **DeveloperProjectReview.tsx**: Already implements a change request workflow — developers can edit limited fields (description, location, handover_date, payment_plan, price_from, price_to) and submit as `project_change_requests` for admin approval. Does NOT allow editing AI analysis, scoring, or document descriptions.
- **ChangeRequestsQueue.tsx**: Admin component that reviews/approves/rejects change requests.
- **Database**: `project_change_requests` table exists with `changes` (JSON diff), `status`, `requested_by`, `review_notes`. `developer_launch_uploads` table tracks uploads with `status` and `auto_approved` fields.

### Implementation

#### Task 1: Duplicate File Detection on Upload

Reuse `ProjectDuplicateInspector` in the developer portal's "Submit New Project" tab. When the developer types a project name (≥3 chars), show the inspector below the name field.

**Changes:**
- **`DeveloperPortal.tsx`**: Import `ProjectDuplicateInspector`. Add it after the project name `Input` in the submit tab (around line 1011). Pass `projectName={currentProject.project_name}` and an `onAction` handler that:
  - `"stop"` → clears the form
  - `"merge"` → redirects to the existing project's review page
  - `"create_new"` → dismisses and allows submission
- Add state `duplicateBlocking` — when duplicates are found and not dismissed, disable the Submit button.
- Also check uploaded file names against `developer_launch_uploads` using `project_name` match before insert.

#### Task 2: Limited Edit Permissions

The existing `DeveloperProjectReview.tsx` already restricts edits to: description, location, handover_date, payment_plan, price_from, price_to. It does NOT expose AI analyzer results, scoring, or document descriptions in the edit form.

**Changes:**
- Add explicit read-only display sections for AI analysis score and document descriptions in `DeveloperProjectReview.tsx` with a lock icon and "Managed by JBJ" label, so developers can see but not edit these fields.
- Ensure the edit form fields list is hardcoded (not dynamic from project keys) to prevent scope creep.

#### Task 3: Approval Workflow (Never Overwrite Published)

The existing `submitChangeRequest` in `DeveloperProjectReview.tsx` already creates `project_change_requests` with `status: "pending"` and logs to `project_audit_logs`. The admin `ChangeRequestsQueue` handles approval/rejection. Published content is never directly modified by developers.

**Changes:**
- In `DeveloperPortal.tsx`, when a developer uploads a new project (`handleSubmitProject`), set `status: 'pending_review'` (already the default) and ensure `auto_approved` stays `false` for developer submissions (only owner can auto-approve).
- Add a banner on the submit tab: "All submissions require admin approval before going live."
- In `DeveloperProjectReview.tsx`, add a visible status indicator showing pending change requests for each project.

#### Task 4: Session Summary System

Replace the current "End Session" button behavior (which just clears state) with a proper session summary.

**Changes in `DeveloperPortal.tsx`:**
- Create `EndSessionDialog` component (inline or extracted) that shows:
  - Number of projects uploaded this session (`sessionProjects`)
  - List of project names submitted
  - Files uploaded count
  - Timestamp of session start/end
- On "Confirm End Session":
  1. Insert a `developer_session_logs` record (new table) with session summary data
  2. Send confirmation email via edge function (or create admin task for now)
  3. Clear session state and navigate to projects tab
  4. Show toast confirmation

**Database migration:**
- Create `developer_session_logs` table: `id`, `user_id`, `developer_name`, `developer_email`, `session_start`, `session_end`, `projects_submitted` (text[]), `files_uploaded_count` (int), `summary` (jsonb), `created_at`
- RLS: users can insert their own rows, owner can read all

### Files Summary

| File | Change |
|------|--------|
| `src/pages/DeveloperPortal.tsx` | Add `ProjectDuplicateInspector` to submit tab, add `duplicateBlocking` state, replace "End Session" with dialog, track session start time |
| `src/components/developer-portal/DeveloperProjectReview.tsx` | Add read-only display for AI analysis/scoring with lock icons, add pending CR status indicators |
| Database migration | Create `developer_session_logs` table with RLS |

### Implementation Order
1. Create `developer_session_logs` table (migration)
2. Add duplicate detection to developer upload form (Task 1)
3. Add read-only sections for restricted fields (Task 2)
4. Add approval workflow banner and safeguards (Task 3)
5. Build End Session dialog with summary (Task 4)

