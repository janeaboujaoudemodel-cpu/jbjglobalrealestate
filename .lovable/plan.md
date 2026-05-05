## Agency Activity Log — Full Workflow Upgrade

Add complete bulk + per-row management on top of the existing list, with proper handling of the three underlying data sources (reminders, brokerage actions, outreach history).

### What you'll be able to do

**Per row (hover toolbar on each card):**
- Toggle done / not done (reminders)
- Edit title, body, due date inline
- Delete (with 6-second undo toast)
- Restore from trash

**Bulk (sticky toolbar appears when 1+ selected):**
- Tick checkbox on each row
- Select all (visible / filtered)
- Unselect all
- Mark selected as done
- Mark selected as not done (restore active)
- Delete selected (with undo)
- Restore selected (from trash view)
- Permanently delete (trash view only)
- Export selected only

**View tabs added** above the list: `Active` · `Done` · `All` · `Trash`.
Counters (Total / Reminders / Notes / Calendar / Outreach) become clickable filters and reflect the active view.

### Data-model rules (per source)

| Source table | Done toggle | Delete | Restore |
|---|---|---|---|
| `crm_relationship_reminders` | flips `is_done` | sets `metadata.deleted_at` (add jsonb col) | clears it |
| `crm_brokerage_actions` | flips `metadata.is_done` | sets `metadata.deleted_at` | clears it |
| `crm_outreach_touchpoints` | n/a (history is read-only) | hidden from delete; bulk skips them with a toast note | n/a |

Outreach entries stay visible but show a small "history — read only" hint instead of action buttons, so the audit trail can never be tampered with.

### Schema change (one tiny migration)

`crm_relationship_reminders` has no `metadata` column today — add one:

```sql
alter table public.crm_relationship_reminders
  add column if not exists metadata jsonb not null default '{}'::jsonb;
```

No other schema changes; soft-delete + done flags live inside `metadata.deleted_at` and `metadata.is_done` JSON keys, so we don't reshape any existing tables.

### Files to change

- `src/pages/owner/crm/AgencyActivityLog.tsx` — main rewrite:
  - Add `selected: Set<string>` state, `view: 'active'|'done'|'all'|'trash'` state.
  - Add row checkbox column, sticky bulk-action bar, per-row hover actions.
  - Update query to include rows where `metadata.deleted_at` is set so trash view works; default Active view filters them out.
  - Add mutations: `toggleDone(ids[])`, `softDelete(ids[])`, `restore(ids[])`, `purge(ids[])` — each fans out per source table and revalidates `["crm-unified-activity"]`.
  - Optimistic cache update so ticking feels instant; toast w/ "Undo" button for destructive actions.
- `src/components/crm/ActivityBulkBar.tsx` *(new)* — sticky toolbar component (count, Mark done, Restore, Delete, Clear selection).

### UX notes

- Bulk bar slides in at the bottom on champagne surface with gold hairline (matches design tokens).
- Checkboxes use existing `@/components/ui/checkbox`.
- "Select all" only selects rows currently visible after filters/view, so the user is never surprised.
- Touchpoint rows render the checkbox disabled with a tooltip: "History entries can't be modified."
- Keyboard: `x` toggles selection on focused row, `Esc` clears selection, `Shift+click` range-selects.

Once you approve, I'll run the one-line migration, then ship the rewrite + new bulk bar in a single pass.