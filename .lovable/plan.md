## CRM Phase-2 finishing pass

Most items from the list are already in `CRMLeadsTableV2.tsx` / `InlineStatusSelect.tsx` / `UnifiedCRM.tsx` from the previous turns. The remaining gap is **(a)** the "All Leads" empty state, **(b)** the AI Next-Actions panel + edge function, and **(c)** verifying the inner vertical rail is gone everywhere.

### 1. Fix "All Leads" empty state
**Root cause:** `CRMLeadsTableV2` runs every fetched row through `isRealCRMLead` which strips any name starting with `test/demo/redacted/system-verification` or any email matching `^test*@`, `@example.com`, `@tupmail.com`, `verification@`. Your 4 seed leads almost certainly match those patterns, so the table empties out even though rows exist.

Fix:
- In `CRMLeadsTableV2.fetchLeads`, when `isOwner === true` **skip** `isRealCRMLead` and instead only drop rows where `deleted_at` is set. Owners must always see what's actually in the database; the guard was for public-facing surfaces.
- Render an empty-state CTA when there really are zero rows: "No leads yet — Import CSV · Add lead · Refresh", instead of the bare "No leads found." line.
- Add a tiny diagnostic line under the header in dev when `leads.length !== filtered.length`: "Showing X of Y (filters active) — Clear".

### 2. Stage colored chips + Sources cell
Already shipped in the previous turn (`InlineStatusSelect` now renders each option as a `LeadStatusBadge` with green/blue/red category headers; the Source column wraps inside a champagne pill). No further code change — keep as is.

### 3. Champagne dropdown surfaces, Me/Pool labels, Assignee filter, Distribution strip
All present in `CRMLeadsTableV2.tsx` (lines 469–600): champagne `SelectContent`, "With Me / Assigned / Pool (no broker)" labels, dedicated Assignee dropdown, distribution strip with total / mine / assigned / pool + clickable top-broker pills. **No change needed** — verify only.

### 4. Remove vertical sub-sidebar
`UnifiedCRM.tsx` uses two horizontal bars (entity tabs + sub-section pills). `CRMRelationships.tsx` has no `aside`/`w-64` either. Sweep:
- `rg "aside|w-56|w-60|w-64|w-72|flex-col.*sticky"` inside `src/pages/owner/crm/**` and `src/components/crm/**`.
- If anything still renders a vertical rail (suspected: `CRMSideRail`, `CRMFloatingInsightsWidget`), confirm it's a floating dock not a layout column. The "side rail" should only render as a fixed right-edge dock; if it ever takes column width, swap it to `position: fixed`.

### 5. AI Next-Actions panel + edge function
New piece. Adds a smart "What to do next" widget at the top of `Leads → Dashboard` view inside `UnifiedCRM`.

**Component:** `src/components/crm/CRMAINextActions.tsx`
- Reads the visible `leads` array (top 50 by `created_at desc`) plus the per-user state map.
- POSTs `{ leads: [{id, full_name, pipeline_stage, last_activity_at, source}] }` to a new edge function.
- Shows up to 5 ranked cards (champagne surface, gold hairline): **Lead · Why · Suggested action** with one-click buttons (`Call`, `Email`, `Schedule`, `Mark Won`, `Snooze`) that route to existing handlers in `CRMLeadsTableV2` (`handleCall`, `handleEmail`, `InlineStatusSelect`).
- Cached for 10 min in `crm_ai_suggestions` so the panel doesn't burn tokens on every render.

**Edge function:** `supabase/functions/crm-ai-next-actions/index.ts`
- `requireOwnerAuth` middleware (per Zero-Trust standard).
- Calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with structured output (`Output.object`) returning `{ suggestions: [{ leadId, reason, action: "call|email|schedule|won|snooze", confidence }] }`.
- Stores result in `crm_ai_suggestions` keyed by `(user_id, lead_set_hash)`.

**Migration:** new table `public.crm_ai_suggestions`
```text
- user_id uuid (owner of the cache row)
- lead_set_hash text (md5 of sorted lead ids)
- payload jsonb
- created_at timestamptz default now()
RLS: only the owning user_id can SELECT/INSERT; admins via has_role('admin').
```

### 6. Mount the panel
In `UnifiedCRM.tsx`, when `entity === "leads" && view === "overview"`, render `<CRMAINextActions userId={userId} />` above `CRMEnhancedDashboard`. Lazy-imported so initial bundle stays small.

### 7. QA sweep
- Open `/owner/crm?entity=leads&view=all` → all 4 DB leads visible.
- Stage cell = colored chip; dropdown items render as badges.
- Source cell wraps full label, no "…".
- Distribution strip shows totals; clicking a broker pill filters by them.
- `/owner/crm?entity=leads&view=overview` shows AI Next-Actions strip, then dashboard.
- No vertical column anywhere inside the CRM body.

### Technical notes
- The `isRealCRMLead` guard stays for public/anonymous routes — this only bypasses it for the owner-only table.
- Edge function uses `npm:ai` + `Output.object` (no manual JSON parsing).
- Cache invalidates when any lead's `pipeline_stage` changes via existing `queryClient.invalidateQueries(['crm-leads-inbox'])` plus a new key `['crm-ai-suggestions']`.
- All UI keeps champagne tokens (#FDFBF7 / #F7F2EA / #EFE6D6 / #B89555 hairline / #1A1A1A ink).
