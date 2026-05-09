## CRM 2026 Upgrade — Plan

Address every point in your message, plus continue the queued work (developer enrichment, birthday automation, company typeahead). All in one pass.

---

### 1. Restore "All Leads" (the 3 leads that vanished)

The lazy-loaded `CRMEnhancedDashboard.tsx` is failing to fetch (runtime error in console), which is breaking sibling lazy chunks and leaving `All Leads` empty in some sessions. Also, `CRMLeadsTableV2` filters with `isRealCRMLead` which can hide rows missing certain fields.

- Force-refresh the lazy chunk hashes (touch `CRMEnhancedDashboard.tsx`) and add an error boundary so a broken Insights chunk never blanks the leads table.
- Loosen `isRealCRMLead` to include any non-deleted `crm_leads` row that has at least one of: phone, email, full_name. Log dropped rows once for diagnostics.
- Run a read query to confirm the 3 leads still exist; if RLS is blocking them, attach the missing `crm_lead_state_per_user` row via a one-time backfill so they appear under "all".
- Empty state: replace silent "No leads found" with a count breakdown (`X total · Y assigned · Z unassigned`) and a "Recover from Recently Deleted" link.

---

### 2. Remove the vertical sub-sidebar — keep navigation horizontal

Revert `UnifiedCRM` to a single horizontal context bar under the entity bar (matching the entity bar styling). Drop the 212px left rail and the mobile `<select>` block. Sub-section pills line up horizontally with horizontal scroll on overflow, grouped by visual divider (People · Workspace · Pipeline) only when 4+ items exist.

---

### 3. Stage / Source / Owner / Tag filter polish

Inside `CRMLeadsTableV2`:

- **Stage dropdown panel**: give the popover a champagne surface (`bg-[#FDFBF7]` with 1px gold hairline + soft shadow) so Positive/Neutral/Negative groups are clearly framed. Each individual stage chip gets a colored dot:
  - Positive → emerald, neutral → blue, negative → red, junk → amber, no_answer → slate.
- **All Sources**: currently shows `…` because long source labels overflow. Fix with `truncate min-w-0` on `SelectValue` and increase trigger width on `md:`. Also show the count next to each source ("Website · 12").
- **All Owners**: rename "Unassigned" → "Pool (not assigned to a broker)". Add **"Assigned to Broker"** quick filter and a per-broker submenu so you can filter by any specific broker.
- **Hover & open states**: replace the default light-gray hover (`hover:bg-accent`) with `hover:bg-[#EFE6D6]` (champagne raised) and `data-[state=open]`/`data-[highlighted]` on Radix items get `bg-[#EFE6D6]` + 1px gold left-border. Same for the Tag dropdown.

---

### 4. VIP & ownership labels

Replace every "Unassigned" string in lead/owner pills with context-correct copy:

| Where | Old | New |
|---|---|---|
| Owner column | "Unassigned" | "Pool" (with tooltip "Not yet assigned to a broker") |
| VIP filter | "Unassigned" | "Not VIP" |
| Filter dropdown | "Unassigned" | "Pool (no broker)" |

---

### 5. Distribution metrics + AI Next-Step strip

New strip above the leads table (collapsed by default, opens with the existing Insights toggle):

```text
Total 1,248 │ Mine 312 │ Pool 87 │ Assigned 849
            └─ by broker: Sara 220 · Omar 188 · Layla 142 · …
```

- Server-side counts via a single RPC `crm_lead_distribution_for_owner()` returning `{total, mine, pool, by_broker[]}`.
- AI strip below it calls a new edge function `crm-distribution-insights` (Lovable AI Gateway, `google/gemini-3-flash-preview`) with the metrics + last 30d touch data and returns 3–5 concrete next steps:
  - "Reassign 18 stale leads from Sara → Omar (his close-rate is 2.4× higher this month)"
  - "Auto-junk 42 leads with 3+ no-answer attempts and no reply in 21d"
  - "Revive 11 'Interested' leads with no touch in 14d — draft follow-up?"
  - Each suggestion has a one-click action button.

---

### 6. Brokers Registry — vertical-letter card fix (already partly done, finish it)

Sweep every card under Brokers Registry, Developers, Agencies, Sales Reps for missing `min-w-0` / `truncate` / `whitespace-nowrap` and grid containers without `min-w-0`. Verify at 320px, 414px, 768px, 1180px, 1440px viewports.

---

### 7. Queued work from previous turn — execute now

- **Developer enrichment** (`developer-enrich` edge function): on opening a developer row with missing fields, call Lovable AI + Firecrawl to fetch logo, HQ address, CEO, license, Instagram, LinkedIn, official site. Cache to `developers.last_enriched_at`. Manual "Enrich now" button on each row.
- **Birthday dispatcher** (`birthday-dispatcher` cron, daily 08:00 Dubai): pulls `crm_brokers` where `birthday = today`, sends transactional "Happy Birthday from JBJ" via Resend, and posts a morning briefing card on the dashboard. Records run in `birthday_workflow_runs`.
- **Company typeahead** in Add/Edit Broker: combobox sourced from `crm_brokerages.name ∪ developers.name`, fuzzy match, creates a new brokerage row inline if no match.
- **LD 33k+ backfill**: edge function `import-ld-brokers` scaffolded; awaiting your CSV file before it runs.

---

### 8. Out of scope (will not change)

- Investor / Sales Rep / Agency tab visual changes beyond bug-sweep #6.
- Lovable's visual-edit sidebar (your editor chrome).
- Trade-license popups — already locked from `companyLegal.ts`, will not re-prompt.

---

### Technical notes

- New edge functions: `crm-distribution-insights`, `developer-enrich`, `birthday-dispatcher`, `import-ld-brokers`.
- New RPC: `crm_lead_distribution_for_owner()` (SECURITY DEFINER, owner-only).
- New table: `birthday_workflow_runs` (id, run_date, broker_count, sent_count, errors jsonb).
- All AI calls go through Lovable AI Gateway with `LOVABLE_API_KEY`.
- All edge functions use `requireOwnerAuth`.
- Champagne theme tokens only — no raw grays, no gold fills (hairline only).
- Responsive verified at 320 / 414 / 768 / 1180 / 1440 widths.

Reply **Approve** and I'll implement everything in one pass.