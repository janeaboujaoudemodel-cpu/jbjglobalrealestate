

## Plan: AI Tools Control Panel — Apply / Revert / Test / Publish Workflow

### Current State

- **AIHub.tsx** has ~60 tools defined as static arrays (`investorTools`, `productivityTools`, etc.) with `id`, `title`, `description`, `icon`, `link`, `category`.
- **OwnerRecommendations.tsx** has a recommendation system with Apply/Revert per recommendation (stored in `ai_recommendations` table), but it's **not linked to specific tools** and has no Test/Publish workflow.
- **OwnerFeatureRegistry.tsx** lists features with paths but has no version control.
- No `ai_tool_versions` or `ai_tool_test_logs` tables exist.

### Architecture

Create a new Owner-only page `/owner/ai-tools-control` that:
1. Lists every tool with its direct URL, status, category, and "Open Tool" link
2. Shows per-tool recommendations/fixes with inline Apply → Test → Publish workflow
3. Maintains full version history per tool
4. Records test logs

### Database (2 new tables)

**`ai_tool_versions`** — Version history per tool:
- `id` (uuid), `tool_id` (text, matches tool array id), `version_number` (int), `status` (text: draft/applied/tested/published/reverted/error), `changes_description` (text), `before_snapshot` (jsonb), `after_snapshot` (jsonb), `change_reason` (text), `applied_by` (uuid ref auth.users), `tested_at` (timestamptz), `test_result` (text: pass/fail/null), `test_notes` (text), `published_at` (timestamptz), `reverted_at` (timestamptz), `created_at` (timestamptz)
- RLS: Owner-only read/write (via `has_role` or email check)

**`ai_tool_test_logs`** — Audit trail for tests:
- `id` (uuid), `tool_id` (text), `version_id` (uuid ref ai_tool_versions), `tool_url` (text), `tester_id` (uuid ref auth.users), `result` (text: pass/fail), `notes` (text), `created_at` (timestamptz)
- RLS: Owner-only

### New Page: `src/pages/owner/AIToolsControlPanel.tsx`

**Layout:**
- Header with title "AI Tools Control Panel" and stats row (Live / Draft / Pending Test / Error counts)
- Search + category filter
- Tool list as expandable cards

**Per-Tool Card (Task 1 — Direct URL):**
- Tool name, category badge, status badge (Live/Draft/Applied–Pending Test/Tested–Pending Publish/Published/Reverted/Error/Needs Review)
- Direct URL displayed as copyable text (with copy button)
- "Open Tool" button linking to the tool's `link` path
- Expand chevron for details

**Expanded Tool View (Tasks 2, 3, 4, 5, 6, 7, 8):**

Three tabs inside expansion:

**Tab 1: Fixes & Recommendations**
- Fetches `ai_recommendations` filtered by tool_id (new column needed, or match by tool name)
- Each fix shows: Before/After, affected section, reason, and inline action buttons:
  - **Apply** → creates `ai_tool_versions` entry with status `applied`, tool status becomes "Applied – Pending Test"
  - **Test** → opens tool in new tab + creates `ai_tool_test_logs` entry, prompts for pass/fail + notes
  - **Save & Publish** → updates version status to `published`, sets `published_at`
  - **Revert** → creates new version entry with status `reverted`, tool goes back to previous published version

**Tab 2: Version History (Task 5, 6)**
- Lists all `ai_tool_versions` for this tool, sorted by version_number desc
- Each row: version #, date, what changed, who changed, status badge, Restore button, View Details toggle
- Restore action: creates new version entry copying the old snapshot, marks as "published"

**Tab 3: Test Logs (Task 9)**
- Lists `ai_tool_test_logs` for this tool
- Columns: version, time, tester, result (pass/fail badge), notes

**Status State Machine (Task 7):**
```text
[New Fix] → Apply → "Applied – Pending Test"
         → Test  → "Tested – Pending Publish"
         → Save & Publish → "Published" (Live)
         → Revert → "Reverted" (falls back to previous published)
```

**Task 10 — Owner Only:**
- Route wrapped in `OwnerGuard` in AdminRoutes.tsx
- RLS on both tables restricts to owner email

### Linking Recommendations to Tools

Add `tool_id` column to existing `ai_recommendations` table (nullable text, migration). When generating recommendations from the control panel, auto-tag them with the tool_id. Existing recommendations without tool_id still show in the global hub.

### Files Summary

| File | Change |
|------|--------|
| **New**: `src/pages/owner/AIToolsControlPanel.tsx` | Full control panel (~600 lines) |
| `src/routes/AdminRoutes.tsx` | Add `/owner/ai-tools-control` route with OwnerGuard |
| **Migration** | Create `ai_tool_versions`, `ai_tool_test_logs` tables; add `tool_id` to `ai_recommendations` |

### Implementation Order
1. Database migration (3 changes)
2. Create `AIToolsControlPanel.tsx` with tool list, URL display, status badges
3. Add fix/recommendation panel with Apply/Test/Publish/Revert per fix
4. Add version history tab per tool
5. Add test logs tab per tool
6. Register route in AdminRoutes.tsx

