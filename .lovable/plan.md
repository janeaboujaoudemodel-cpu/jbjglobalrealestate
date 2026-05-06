## Developer Registry — fix "Registered" card + dedupe filters

### The two problems

**1. The "Registered" card (and any history-only status) is a dead end**
The Outreach Queue panel applies `statusFilter` against `queuePool`, and `queuePool` deliberately excludes anyone whose `status === 'registered'` (they live in Sent History). So clicking the **Registered** stat card sets `statusFilter = 'registered'`, the queue filter returns 0 rows, and the user sees "No developer match the current filters / Show full queue". The card is wired to state but routes the user to an empty pool.

**2. Filters are duplicated three times**
The same status concept currently appears as:
- `<Select>` "All statuses" dropdown (line 2013) — full STATUS_DEV list
- Pill chips row (lines 2151–2203) — STATUS_DEV minus `registered` + a Contracts toggle
- Stat cards grid (lines 2206–2215) — full STATUS_DEV list, also clickable as filter

Three controls drive the same `statusFilter` state. Plus the email filter (`Not sent / Sent / Confirmed registered`) overlaps with the status filter (`registered`), giving the user a fourth way to express the same thing.

### Fix

**A. Smart routing for status tiles**
Make every tile / chip / select option open the right sub-tab automatically, so no click ever lands in an empty view.

```text
not_started, pending_application, documents_required,
under_review, rejected, expired       → setSubTab("queue")
registered                             → setSubTab("history") + filter history by registered
contracts                              → setSubTab("history") + filter by contract rows
```

The Sent History view (`SentHistoryView`) already receives `historyPool`. Add a lightweight status filter prop so it can narrow to `registered` or contract rows when the user lands there from a tile. The `statusFilter` state stays a single source of truth, but each consumer (queue list vs. history list) reads from the appropriate pool.

**B. Remove duplicate filter UI**
Keep ONE consolidated filter strip and delete the redundant ones:

- **Keep**: the stat cards grid (line 2206) — visual, shows counts, click-to-filter, includes Registered. This is the most useful surface.
- **Keep**: the search input + the single "All emails / Not sent / Sent" select (drop the `registered` option from the email filter since it duplicates the status).
- **Remove**: the chip row (lines 2151–2203). Move the Contracts toggle into the stat-cards grid as the 8th tile so it sits with the rest.
- **Remove**: the "All statuses" `<Select>` at line 2013 (replaced by the cards).
- **Drop** the `registered` option from the email-filter select since it's now redundant with the Registered card.

Result: one filter row (search + email-state select + actions) and one stats grid where every tile filters and routes correctly.

**C. Empty-state copy**
When the user is on Queue and a tile would yield zero rows but rows exist in History, replace "No developer match" with a single CTA: *"3 developers in this status are in Sent History — Open Sent History"* that flips `subTab = "history"` and applies the filter. Same in reverse from History.

### Files touched
- `src/pages/CRMRelationships.tsx` (only the `DeveloperRegistryTab` section, ~lines 1937–2280)
- `src/pages/owner/crm/SentHistoryView.tsx` — add an optional `statusFilter` prop and a small filter chip row mirroring the queue's smart routing

No DB, no edge function, no schema changes. Pure UI consolidation + routing fix.
