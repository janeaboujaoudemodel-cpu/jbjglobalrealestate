

## Plan: Fix Developer View Toggle, Separate Launch/Event Tabs, File Uploads, Owner Management

### Issues to Fix

**1. Developer View toggle not working**
Currently at line 549, clicking "Developer View" sets `ownerSkipMode(false)` but the view still shows the owner-adapted UI because `hasRepProfile` check at line 583 gates the dev info card. For owner, when `ownerSkipMode === false`, the portal should render exactly as a developer rep would see it — showing the dev name/email card and the full registration flow.

**Fix in `DeveloperPortal.tsx`**: Change the condition at line 583 from `hasRepProfile && !isOwner` to `hasRepProfile && !isOwner` → when owner has `ownerSkipMode === false`, show the standard developer card (lines 622-636) regardless of `hasRepProfile`. The logic becomes: `hasRepProfile && !isOwner && !ownerSkipMode`.

**2. Separate Launch and Event submission tabs**
Replace the current single "Events" tab (line 830) with two distinct tabs:
- **Events tab** — for event invitations (open days, networking, exhibitions). Includes file upload.
- **Launches tab** — for new project launches. Includes file upload. Auto-creates an owner task with reminder.

Each gets its own form state, file upload area, and submission handler that inserts into `developer_submissions` with `submission_type = 'event_invitation'` or `submission_type = 'launch_announcement'`.

**3. Add file uploads to event and launch forms**
Add a file upload section (reuse the same pattern from project submission) to both event and launch forms. Files go to `documents/developer-events/{timestamp}-{filename}`. Store file URLs in the `developer_submissions` row (use the existing `uploaded_files` column or add via migration if missing).

**4. Auto-create owner tasks/reminders**
When an event is submitted → create `admin_tasks` entry: "Event to attend: {title}" with `due_date = event_date`, category `event_attendance`.
When a launch is submitted → create `admin_tasks` entry: "New Launch: {title} — prepare marketing" with `due_date = launch_date`, category `launch_preparation`, with notes.

**5. Owner backend: Launches & Events management section**
Add a new owner-only tab "Manage" that shows:
- All launches and events from `developer_submissions`, sorted newest first
- Search bar (by developer name, title, or day of week)
- Calendar-style date filter
- Each item has: Hide/Show toggle, Assign Broker button
- Uses `developer_submissions` table with an `is_hidden` column and `assigned_broker_id` column (migration needed)

### Database Migration
Add columns to `developer_submissions`:
```sql
ALTER TABLE developer_submissions ADD COLUMN IF NOT EXISTS event_files jsonb DEFAULT '[]';
ALTER TABLE developer_submissions ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;
ALTER TABLE developer_submissions ADD COLUMN IF NOT EXISTS assigned_broker_id uuid;
ALTER TABLE developer_submissions ADD COLUMN IF NOT EXISTS submission_subtype text; -- 'launch' or 'event'
```

### Files Changed

| File | Changes |
|---|---|
| `src/pages/DeveloperPortal.tsx` | Fix Developer View toggle logic, split Events into separate Launch + Event tabs with file uploads, add owner "Manage" tab with search/hide/assign, auto-create reminder tasks on submission |
| New migration | Add `event_files`, `is_hidden`, `assigned_broker_id` columns to `developer_submissions` |

### Technical Details
- Developer View fix: condition becomes `if (isOwner && !ownerSkipMode)` → render the normal dev card (lines 622-636)
- File upload for events/launches reuses the same `supabase.storage.from("documents").upload()` pattern
- Owner Manage tab queries `developer_submissions` with search filter, shows hide toggle via update, broker assign via dropdown from `broker_profiles`
- Reminder tasks use `admin_tasks` insert with `due_date` set to event/launch date

