# Relationship Hub: Speed, Polish & Saved Sender/CC

Three connected fixes in `/owner/crm/relationships` (CRMRelationships).

## 1. Speed up tab + sub-tab switching

**Problem**: Switching Brokerages ↔ Developer Registry, and Outreach Queue ↔ Sent History, refetches and re-renders large tables — feels laggy.

**Fix**:
- Wrap parent `<Tabs>` content with `forceMount` so both tabs stay mounted after first visit; toggle visibility via `hidden`. Keeps React-Query caches warm and avoids tear-down/re-mount of large lists.
- For sub-tabs (Outreach Queue / Sent History) inside `DeveloperRegistryTab`, render both lists once and toggle by CSS only (`hidden` attr). They already share the same `data` array.
- Add `staleTime: 60_000` to:
  - `useDeveloperRegistry`
  - `useCRMBrokerages` (relationship list)
  - `useEmailTemplate`, `useOwnerSettings`
  - SentHistoryView's internal queries
- Memoize the heavy `<table>` body rows (extract to a tiny `<RegistryRow />` component wrapped in `React.memo`).

Result: first visit still loads, every subsequent switch is instant.

## 2. Saved Sender + CC emails (multi-select with persistence)

**Schema change** (`crm_owner_settings`):

Add two JSONB array columns to keep history of every email the user ever typed, plus the currently active selection.

```sql
ALTER TABLE crm_owner_settings
  ADD COLUMN IF NOT EXISTS saved_sender_emails JSONB
    DEFAULT '[]'::jsonb,                  -- ["contact@jbj.ae","ops@jbj.ae", ...]
  ADD COLUMN IF NOT EXISTS saved_cc_emails JSONB
    DEFAULT '[]'::jsonb,                  -- ["info.jane@gmail.com", ...]
  ADD COLUMN IF NOT EXISTS active_cc_emails JSONB
    DEFAULT '[]'::jsonb;                  -- subset that is currently CC'd on sends
```

`reply_to_email` (string) stays as the single active primary; `saved_sender_emails` is the dropdown the user picks from. CC becomes multi-select (`active_cc_emails`).

**UI** in `DocumentPackPanel`:
- Replace plain Input for **Primary sender (Reply-to)** with a `<Combobox>` showing saved senders + free-text. "Add" pushes to `saved_sender_emails`. Clicking a saved entry sets it as `reply_to_email`. Trash icon next to each entry deletes from saved list (never auto-deletes when switching).
- Replace single CC input with a **chip multi-select**: one chip per email in `saved_cc_emails`; clicking toggles inclusion in `active_cc_emails`. "+ Add email" input appends to saved list. Saved list is preserved even when unselected.
- Remove the "Always CC" switch (replaced by per-chip selection). Migrate existing `cc_email` into `saved_cc_emails` + `active_cc_emails` on first load.

**Send pipeline**:
- `BulkSendDialog` and `TestSendDialog` read `active_cc_emails` (array). Edge function `rel-send-bulk-email` already accepts CC; pass joined array.
- `useOwnerSettings` defaults updated to provide both arrays.

## 3. Visual polish & contrast

- Replace muddy `text-[#1A1A1A]/60` on small captions with `/70` to satisfy contrast guard.
- Tab triggers: tighten active-state — cream `#EFE6D6` + ink, single 1px gold hairline, no shadow blur (current `shadow-sm` causes faint halo).
- Sub-tab pills (Outreach Queue / Sent History): same cream-active treatment, remove faded gray inactive (`text-[#1A1A1A]/60` → `/70`), add gold underline only when active.
- Filter row: align all controls to 36px height, single border tone (`border-[#1A1A1A]/10`), champagne hover.
- Saved-sender / CC chips: cream chip with thin gold border when active; plain `#FDFBF7` with `#1A1A1A]/15` border when inactive.
- Loading skeletons (`Skeleton h-32`) replace spinner-only states so the page never collapses while switching.

## Files touched

- `src/pages/CRMRelationships.tsx` — tab `forceMount`, sub-tab toggle, sender/CC UI rewrite, contrast tweaks.
- `src/hooks/useCRMRelationships.ts` — `useOwnerSettings` defaults + cache `staleTime`; `useCRMBrokerages` `staleTime`; `useDeveloperRegistry` `staleTime`.
- `src/components/crm/SentHistoryView.tsx` — `staleTime`, memoized rows.
- `src/components/crm/BulkSendDialog.tsx` — read `active_cc_emails` array, pass through.
- `src/components/crm/TestSendDialog.tsx` — same.
- New small primitive `src/components/crm/EmailListEditor.tsx` — saved-list combobox + chip multi-select.
- DB migration: add 3 JSONB columns to `crm_owner_settings`, backfill from existing `cc_email`.
