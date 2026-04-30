## Goal

In the **Developers → Outreach Queue** tab (`src/pages/CRMRelationships.tsx`), let you bulk-revert any group of developers — typically the 24 stuck on **Pending Application** after the failed-email batch — back to **Not Started** so they can be re-emailed in one click.

The selection plumbing (per-row checkboxes, `selected` Set, `Select all filtered`, `Clear`, `Send to Selected`) already exists. I'm only adding two buttons and one bulk handler — no new components, no schema changes.

## What I'll add

In `DeveloperRegistryTab`:

1. **"Select all Pending Application" button** — one-click shortcut next to the existing `Select all filtered` / `Clear` controls. Selects every row in the current `queuePool` whose `status === "pending_application"`.
2. **"Reset to Not Started" button** — sits next to the existing `Send to Selected` button in the bulk action bar. Disabled when nothing is selected.
   - Confirms: *"Reset N developers back to Not Started? They'll re-appear ready to send."*
   - Loops over `selectedDevs` calling the existing `useQuickStatusUpdate` (`developer_registry`, status `not_started`). This already writes to `crm_relationship_status_history` (audit trail intact).
   - Shows a toast progress counter (mirrors the existing `bulkSend` UX).
   - On finish: clears selection, refetches, toasts `Reset N · Failed M`.
3. New `bulkResetting` boolean state to disable the button while running.
4. Import the `RotateCcw` icon from `lucide-react`.

## What I won't touch

- No DB migration, no edge function changes.
- No changes to `useQuickStatusUpdate` (already supports the call).
- No removal of existing buttons (per the No-Removal rule).
- The per-row `InlineStatusSelect` continues to work for one-off changes.

## Sketch of the bulk handler

```ts
const bulkResetToNotStarted = async () => {
  if (!selected.size) return;
  if (!confirm(`Reset ${selected.size} developers back to Not Started? They'll reappear ready to send.`)) return;
  setBulkResetting(true);
  const t = toast.loading(`Resetting 0 / ${selected.size}…`);
  let ok = 0, fail = 0;
  for (let i = 0; i < selectedDevs.length; i++) {
    const d = selectedDevs[i];
    if (d.status === "not_started") { ok++; }
    else {
      try {
        await quickStatus.mutateAsync({
          entityType: "developer_registry",
          id: d.id, status: "not_started", previousStatus: d.status,
        });
        ok++;
      } catch { fail++; }
    }
    toast.loading(`Resetting ${i + 1} / ${selectedDevs.length}…`, { id: t });
  }
  toast.success(`Reset: ${ok} · Failed: ${fail}`, { id: t });
  setBulkResetting(false);
  clearSelection();
  refetch();
};
```

## Result

- One click → "Select all Pending Application" → all 24 stuck rows ticked.
- One click → "Reset to Not Started" → they all flip back, audit trail recorded.
- Then your existing **Send to Selected** button (or the bulk send) re-emails them through the now-fixed mail pipeline.