

## Plan: Dashboard Polish, Task Modal CRM Integration & Attachment Persistence

This plan addresses 5 distinct requests across the dashboard, vertical nav, recommendation popup, and task creation system.

---

### 1. Remove Black Header Bar from My Dashboard

**Current state**: `MyDashboard.tsx` has an 84px black header bar with `border-b border-gold/20`.
**Change**: Remove the separate black header div entirely. Move the "My Dashboard" title and role badge into the champagne container itself, at the top. The champagne container will use `rounded-2xl` (restoring top rounding) and `mt-3` instead of `mt-0 rounded-t-none border-t-0`. This eliminates the black line/border completely.

**File**: `src/pages/MyDashboard.tsx` — Remove lines 278-296 (the black header div), update the champagne container div (line 298) to restore top rounding and margin, and move the title/badge inside it.

---

### 2. "Create Ticket" in Gold in Vertical Nav

**Current state**: In `GlobalVerticalNav.tsx` (line 478-484), the "Create Ticket" link uses `text-black/60 hover:text-gold`.
**Change**: Update to `text-gold font-bold hover:text-gold/80` to make it gold by default. Also update the label to "Create Ticket Support".

**File**: `src/components/navigation/GlobalVerticalNav.tsx` — Update the Create Ticket link styling and label.

---

### 3. Recommendation Popup: Show 3 Instead of 2

**Current state**: The query uses `.limit(3)` but the area filter may only return 2 matching projects.
**Change**: If area-filtered results return fewer than 3, backfill with additional non-duplicate projects (general query) to always show exactly 3. This is a logic fix in `PropertyRecommendationPopup.tsx` around lines 86-112.

**File**: `src/components/PropertyRecommendationPopup.tsx` — Add backfill logic after area query to ensure 3 results.

---

### 4. Smart Date Input in Task Creation Modal

**Current state**: The due date field is `<Input type="date">` which relies on browser native date picker with separate day/month/year fields.
**Change**: Replace with a text input that accepts free-form date entry (e.g., `05082026`, `05/08/2026`, `5.8.2026`) and auto-formats to `DD/MM/YYYY` on blur. Under the hood, it stores the value as `YYYY-MM-DD` for the database. Also add a calendar popover (Shadcn DatePicker) as an alternative selection method.

**File**: `src/components/dashboard/TaskCreationModal.tsx` — Replace the date input with a smart date field component that parses various input formats and auto-corrects.

---

### 5. CRM Lead Integration in Task Creation Modal

**Current state**: The modal has a "Client Contact" text field but no CRM lead connection.
**Change**: Add a "Lead" section with two options:
- **Select Lead**: Searchable dropdown that queries `crm_leads` table, lets user pick an existing lead. Stores `lead_id` on the task.
- **Add New Lead**: Inline fields for name + phone. On task submit, inserts a new row into `crm_leads` with `source: 'task'`, `lead_source_type: 'manual'` and links the `lead_id` to the task.

**Database migration**: Add `lead_id UUID REFERENCES crm_leads(id)` column to `admin_tasks` table.

**Files**:
- Migration: Add `lead_id` column to `admin_tasks`
- `src/components/dashboard/TaskCreationModal.tsx` — Add lead selector UI with search + "Add New Lead" toggle

---

### 6. Wire Attachments with Backend Storage

**Current state**: Attachments upload to `documents` bucket and store URLs in `admin_tasks.attachments` (JSON column). This already persists for the task creator.
**Change**: 
- Ensure the `documents` storage bucket exists and is accessible (create via migration if needed)
- Verify RLS on the bucket allows authenticated users to upload to their own path
- When a task has a `lead_id`, the attachments are visible to both the task owner AND the lead's associated user (if they have a dashboard). This means adding a view or query path so the user tied to the lead can see task attachments assigned to them.
- Create a storage bucket RLS policy: authenticated users can read files in `task-attachments/{their_user_id}/` path.

**Files**:
- Migration: Create `documents` bucket if not exists, add RLS policies for task-attachment paths
- No major code changes needed — the existing upload flow in `TaskCreationModal.tsx` already saves to `admin_tasks.attachments`

---

### Summary of Changes

| # | What | Files |
|---|------|-------|
| 1 | Remove black header, seamless champagne | `MyDashboard.tsx` |
| 2 | Gold "Create Ticket Support" in nav | `GlobalVerticalNav.tsx` |
| 3 | Always show 3 recommendations | `PropertyRecommendationPopup.tsx` |
| 4 | Smart date auto-format input | `TaskCreationModal.tsx` |
| 5 | CRM lead selector + new lead creation | `TaskCreationModal.tsx` + DB migration |
| 6 | Wire attachment storage with RLS | DB migration for bucket + `lead_id` column |

