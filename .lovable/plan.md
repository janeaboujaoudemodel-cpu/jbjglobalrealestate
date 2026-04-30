## Goal

Four CRM Developer Registry improvements:

1. Collapse the Outreach Queue card so it doesn't dominate the page.
2. Expand the Sent History side beyond Under Review / Rejected / Expired with new sub-tabs: Inbox, Contacted, Pending Actions, Recently Deleted.
3. Make "Send TEST" always send to my registered email automatically.
4. Show the real developer logo next to every developer everywhere (registry rows, history cards, dropdowns) and on every project related to that developer.

---

## 1. Collapsible Outreach Queue

File: `src/pages/CRMRelationships.tsx` (DeveloperRegistryView, around lines 860-980).

- Wrap the entire queue body (filter row + bulk-action bar + status chip row + cards grid) in a `<Collapsible>` from `@/components/ui/collapsible`.
- Collapsed by default (persist state in `localStorage` key `crm.queue.collapsed`).
- Header strip remains visible: "Outreach Queue (n)" + chevron toggle + the existing sub-tab pills.
- Sent History tab keeps current behaviour (no collapse — that's the side the user actively works in).

## 2. Expanded Sent History with new sub-tabs

File: `src/components/crm/SentHistoryView.tsx`.

Add a top-level segmented control inside Sent History with 7 chips (counts shown):

```text
[All] [Inbox] [Contacted] [Pending Actions] [Under Review] [Rejected] [Expired] [Recently Deleted]
```

Filter logic per chip (computed from existing fields + a couple of new joins):

- **Inbox** — developers with at least one *incoming* row in `developer_action_items` (existing table from Auto-Sign Hub) where `direction = 'inbound'` and not yet resolved.
- **Contacted** — `last_outreach_at` set in last 30d AND no inbound reply yet.
- **Pending Actions** — joined `developer_action_items` rows still `status = 'open'` or `awaiting_owner`.
- **Under Review / Rejected / Expired** — existing registry `status` field (kept).
- **Recently Deleted** — registry rows with `deleted_at IS NOT NULL` in last 30 days (soft delete).

Each card keeps the existing layout but gains:
- A small inbox badge ("3 new replies") when inbound items exist.
- A "Restore" button on Recently Deleted rows.

## 3. "Send TEST" always goes to my registered email

File: `src/components/crm/BulkSendDialog.tsx` (line ~117 `sendTest`).

- Resolve the owner's email server-side via the existing `useOwnerSettings()` hook (already imported in CRMRelationships) → fall back to `auth.user.email`.
- Replace the manual `testEmail` Input with a read-only display of "Test will be sent to: <owner-email>".
- Keep the input editable behind a small "Use a different address" toggle for power users, but default to the registered owner email.
- The "Send TEST" button always fires regardless of what's selected — uses `previewDev` if any, otherwise template defaults.

## 4. Real developer logos everywhere

Logo source of truth is already `developers.logo_url` (validated via `src/utils/developerLogo.ts`). Two gaps to close:

### 4a. Registry & history rows

- `CRMRelationships.tsx` queue row (line ~1103) currently uses raw `<img src={r.logo_url}>` with a letter fallback. Replace with `<DeveloperLogo src={r.logo_url} alt={r.developer_name} renderFallback />` so the locked Building2 icon appears when a logo is missing — and so the same component is used everywhere.
- `SentHistoryView.tsx` cards currently show no logo at all. Add a `<DeveloperLogo />` (size `w-10 h-10`) to the left of `developer_name`.
- Bulk send dialog preview list (BulkSendDialog right column rows) — same component beside each name.

### 4b. Auto-fill missing `logo_url` from website

Add a small "Refresh logos" action in the Document Pack panel that calls a new edge function `fetch-developer-logos`:

- For each registry row missing `logo_url`, fetch `<website>/favicon.ico` and the `<link rel="icon">` from the homepage HTML, prefer 256×256+, store to `developer-logos` storage bucket, write back the public URL to `developers.logo_url` (and mirror to `developer_registry.logo_url`).
- Respects the LOCKED `isValidDeveloperLogoUrl` allow-list (no screenshots, no project photos).

### 4c. Project cards already covered

`src/components/ProjectCard.tsx` already renders `DeveloperLogo` from `project.developer.logo_url` (lines 207-211). Once 4b backfills the missing logos, every project card automatically reflects the correct developer logo — no further code change needed there.

Verify two adjacent surfaces also use the joined developer logo:
- `src/components/project-detail/DeveloperInfoCard.tsx` — already uses it; no change.
- `src/components/ReellyProjectCard.tsx` — confirm it pulls from `project.developer.logo_url`; if not, switch to `<DeveloperLogo />`.

---

## Technical summary

**Files edited**
- `src/pages/CRMRelationships.tsx` — wrap queue in Collapsible; swap raw `<img>` for `<DeveloperLogo>`.
- `src/components/crm/SentHistoryView.tsx` — new sub-tab strip, joined inbox/action-item counts, logo on every card.
- `src/components/crm/BulkSendDialog.tsx` — default test email to owner registered email, lock by default.
- `src/components/ReellyProjectCard.tsx` — confirm/route through `<DeveloperLogo>`.

**New file**
- `supabase/functions/fetch-developer-logos/index.ts` — favicon/og:image scraper, validated against `isValidDeveloperLogoUrl`, writes to storage + `developers.logo_url`.

**Migration**
- Add `deleted_at timestamptz` column to `developer_registry` (if missing) for the Recently Deleted tab; add index on `developer_action_items(developer_registry_id, status, direction)` for the Inbox/Pending counts.

**Hook**
- Extend `useDeveloperActionItems` to expose per-developer counts grouped by status/direction.

No removed features. All existing CRM functionality preserved.