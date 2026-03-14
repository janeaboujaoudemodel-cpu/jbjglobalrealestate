

## Plan: Developer Portal Security + Submission Moderation

### Current State

**Already implemented:**
- `developer_launch_uploads` table with `status` field (submissions go into review state)
- `ProjectDuplicateInspector` component — searches `projects` and `pending_project_imports` for name/slug matches
- `ExistingProjectsReview` component — shows developer's published projects
- `project_change_requests` table + `ChangeRequestsQueue` — before/after diff approval workflow
- Developer name locked after registration (cannot change)
- `developer_session_logs` table — session summaries
- File uploads go to `documents` bucket (now private from Session 11)

**Gaps:**
1. No file type/size validation on uploads — any file accepted
2. No filename sanitization beyond basic character replacement
3. No centralized developer activity log table
4. No moderation queue dashboard aggregating all developer submissions
5. No explicit protected-field enforcement (internal fields just not shown in UI, but no server-side guard)
6. Duplicate inspector exists but doesn't block — `duplicateBlocking` state exists but isn't enforced on submit

### Implementation

#### 1. Database Migration

**New table: `developer_activity_log`** — Unified activity tracking:
```
id (uuid PK), user_id (uuid), developer_name (text), developer_email (text),
activity_type (text: upload/edit/duplicate_attempt/failed_upload/session_end/approval),
entity_type (text: project/event/launch/file/profile),
entity_id (text), entity_name (text),
details (jsonb), risk_flags (text[]),
created_at (timestamptz default now())
```
RLS: Authenticated INSERT (own user_id), Owner-only SELECT.

**New table: `developer_file_validations`** — Track file validation results:
```
id (uuid PK), upload_id (text), file_name (text), file_type (text),
file_size_bytes (bigint), is_valid (bool), rejection_reason (text),
sanitized_name (text), created_at (timestamptz)
```

#### 2. File Security Validation (Task 4)

**New: `src/utils/developerFileValidation.ts`**
- Allowed file types whitelist: PDF, DOCX, XLSX, JPG, PNG, WEBP, MP4, ZIP
- Max file size: 50MB per file, 200MB per session
- Filename sanitization: strip path traversal (`../`), null bytes, unicode exploits, limit length to 200 chars
- Duplicate file detection: hash-based (SHA-256 of first 1MB chunk) comparison against session files
- Returns `{ isValid, sanitizedName, rejectionReason }`

#### 3. Protected Field Enforcement (Task 3)

**New: `src/config/developerFieldProtection.ts`**
- Defines `PROTECTED_FIELDS` constant: `ai_score`, `internal_tags`, `moderation_notes`, `internal_ranking`, `owner_notes`, `security_settings`, `ai_analysis`, `enrichment_data`, `quality_score`
- `sanitizeSubmissionData(data)` function that strips any protected fields from developer-submitted payloads before insert/update
- Applied in `DeveloperPortal.tsx` submission handlers

#### 4. Duplicate Detection Enforcement (Task 2)

Update `DeveloperPortal.tsx`:
- Wire `duplicateBlocking` state to actually block `handleSubmitProject` when duplicates found and not dismissed
- Add "Update Existing" flow that creates a `project_change_requests` entry instead of a new `developer_launch_uploads` row

#### 5. Activity Logging Integration (Task 6)

**New: `src/hooks/useDeveloperActivityLog.ts`**
- `logActivity(type, entityType, entityId, entityName, details, riskFlags)` — inserts into `developer_activity_log`
- Integrated into `DeveloperPortal.tsx` at every submission point: project upload, event submit, launch submit, file upload, duplicate attempt, session end

#### 6. Moderation Queue Dashboard (Task 5)

**New: `src/pages/owner/DeveloperModerationQueue.tsx`** — Owner-only at `/owner/developer-moderation`

**Layout — 3 sections:**
- **Pending Submissions**: Aggregated from `developer_launch_uploads` (pending) + `developer_submissions` (pending) + `project_change_requests` (pending). Shows: developer name, submission type, date, file count, risk flags, completeness indicator
- **Activity Feed**: From `developer_activity_log` — recent uploads, edits, duplicate attempts, failed uploads. Filterable by developer, date, activity type
- **Risk Flags**: Highlighted items — duplicate attempts, oversized files, suspicious filenames, incomplete submissions, rapid-fire uploads (>10 in 5min)

### Files Summary

| File | Change |
|------|--------|
| **Migration** | Create `developer_activity_log` + `developer_file_validations` with owner-only RLS |
| **New**: `src/utils/developerFileValidation.ts` | File type/size/name validation |
| **New**: `src/config/developerFieldProtection.ts` | Protected field definitions + sanitizer |
| **New**: `src/hooks/useDeveloperActivityLog.ts` | Activity logging hook |
| **New**: `src/pages/owner/DeveloperModerationQueue.tsx` | Moderation queue dashboard |
| **Update**: `src/pages/DeveloperPortal.tsx` | Add file validation, field protection, duplicate blocking enforcement, activity logging |
| **Update**: `src/routes/OwnerRoutes.tsx` | Add moderation route |

### Implementation Order
1. Database migration
2. File validation utility + field protection config
3. Activity logging hook
4. Update DeveloperPortal.tsx (validation + logging + duplicate enforcement)
5. Moderation queue dashboard
6. Route registration

