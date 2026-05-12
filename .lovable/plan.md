Scope is large. To keep this approvable in one shot I'm splitting into **Phase 1 (this approval)** — every concrete bug you named + the new broker-distribution / AI-suggestions panel — and **Phase 2 (separate approval)** — the broader "rebuild the CRM for 2026" sweep, since that touches dozens of files and deserves its own review.

---

## Phase 1 — what gets fixed now

### 1. "All Leads" shows nothing
`CRMLeadsTableV2` (filter `all`) currently joins `crm_lead_state` and silently drops any lead that has no `state` row, then the chips/tag filter further filter to zero. Fix:
- Use a left join (or fetch `state` separately and merge), so leads with no state still appear with `pipeline_status = "new"`.
- Reset `tagFilter` / `stageMulti` defaults to empty when `filterType === "all"`.
- Add a one-line debug toast when `leads.length > 0` but `filtered.length === 0` so the cause ("filtered out by …") is visible.

### 2. Stage dropdown — colored chips, "Positive = green"
In `CRMLeadsTableV2`'s Stage multi-select (and the row-level pipeline_status badge), each stage gets a solid colored chip on a champagne background:

| Stage              | Color      |
|--------------------|------------|
| new                | Blue       |
| contacted          | Blue/600   |
| qualified          | Indigo     |
| interested / positive / hot | **Emerald (green)** |
| negotiation        | Amber      |
| already_bought / closed_won | Emerald-700 |
| no_answer          | Slate      |
| junk               | Rose       |
| closed_lost        | Red        |

Token-driven (uses existing `--data-emerald / --data-blue / --data-amber / --data-red` from the data-viz standard). The currently-empty popover background gets a champagne raised surface so the chips have a backdrop.

### 3. Sources column shows "…"
The Sources cell truncates at 1 line via CSS overflow. Fix: render up to 2 source chips inline, then "+N" pill that opens a popover listing all sources for that lead. Same for the Source filter dropdown — render full names with truncation only on >40 chars.

### 4. Hover / dropdown surfaces are gray
Every `Select`, `Popover`, `DropdownMenu`, `Command` used in the CRM page swaps `bg-popover / bg-muted / hover:bg-accent` for the champagne tokens already defined: `bg-[#FDFBF7]` panel, `hover:bg-[#EFE6D6]`, border `border-[#B89555]/30`. Done via a single `crm-popover` utility class added to `index.css` and applied to the popover/select content components used inside `UnifiedCRM`.

### 5. "Unassigned" everywhere → real owner / broker name
In `CRMLeadsTableV2` and the VIP / Owner views, the assignee cell currently falls back to literal "Unassigned" when `assigned_broker_id` is null. Fix:
- If `assigned_to_user_id === ownerId` → show "Me" with a gold ring.
- If `assigned_broker_id` set → show broker full name + avatar.
- If both null → show "Pool" (italic, muted) — the word "Unassigned" is removed.

### 6. New filter: **Assigned to broker**
Add a `Assignee` filter group with:
- "Me", "Any broker", per-broker quick-pick (top 8 most active, rest in "More…"), "Pool".
Filter chip persists in the URL (`?assignee=me|broker:<id>|any|pool`).

### 7. Distribution stats strip (above the leads table)
Compact 1-row strip:
```
Total 1,243 │ With me 318 │ Assigned to brokers 712 │ Pool 213 │ Junk 52
```
Plus a "Brokers" expandable showing each broker's count + last-touch days + a tiny sparkline (data already in `crm_lead_assignments` + `crm_activities`). Built as a new `<LeadDistributionStrip />` component, RLS-safe (uses owner-scoped query already present in `useCRMSectionCounts`).

### 8. AI Suggestions panel ("Next steps")
New `<CRMAINextActions />` widget pinned under the distribution strip when `entity=leads`. Calls the existing Lovable AI Gateway edge function (or adds a thin `crm-ai-next-actions` edge function if none fits) and returns 4–6 actionable cards:
- "Reassign 14 stale leads from Broker X (no touch in 21d)"
- "12 likely-junk leads detected — review & purge"
- "8 hot leads pending follow-up today"
- "Lead distribution skew: Broker Y at 38%, Broker Z at 4% — rebalance?"
Each card has Apply / Dismiss / Snooze. Apply triggers the existing bulk-assign / bulk-junk / task-create RPCs — no new business logic.
Model: `google/gemini-3-flash-preview`.
Refresh: every 6h (cached in `crm_ai_suggestions` table — single new table, owner-RLS).

### 9. Vertical sub-sidebar removed
The vertical inner sidebar that recently appeared inside Investors / Brokers / Developers panels (introduced inside `CRMRelationships` / `InvestorsDirectory`) is replaced by the existing horizontal sub-section bar pattern used in `UnifiedCRM`. No content removed — just layout flipped to top-row pills, identical styling to the other CRM sub-tabs.

### 10. Polish pass on the existing CRM
- Replace remaining `text-muted-foreground` inside the CRM tree with `text-[#1A1A1A]/70`.
- Standardize all CRM popover surfaces to champagne via the new utility class.
- Fix every "loading…" gray state to use `<Skeleton />` on champagne.
- No business-logic / RLS / route / removal changes.

---

## Phase 2 — deferred to a separate plan (preview only)

A genuine "2026 CRM" rewrite warrants its own approval. Headlines I'd propose for that round:
- Single TanStack-table virtualized leads grid replacing the 3 overlapping list components.
- Unified saved-views (URL + DB) with shareable presets.
- One AI sidekick panel always docked to the right (chat + actions, replaces the current floating widget + this Phase-1 suggestions card).
- Broker scorecards (KPIs, SLA, churn risk).
- Realtime presence (who's looking at which lead).
- Mobile redesign of the leads list (card view under 768px).
- Background workers for stale-lead reassignment + junk auto-clean (cron edge functions).

I'll write that as Plan 2 once Phase 1 lands so each batch stays reviewable.

---

## Files touched in Phase 1

- `src/components/crm/CRMLeadsTableV2.tsx` (state join, chips, sources cell, assignee labels, assignee filter)
- `src/components/crm/CRMRelationships.tsx` + `InvestorsDirectory.tsx` (flip vertical sidebar → horizontal pills)
- `src/components/crm/LeadDistributionStrip.tsx` (new)
- `src/components/crm/CRMAINextActions.tsx` (new)
- `src/pages/owner/crm/UnifiedCRM.tsx` (mount strip + AI panel above body when `entity=leads`)
- `src/index.css` (`.crm-popover` champagne utility, stage chip color tokens)
- `supabase/functions/crm-ai-next-actions/index.ts` (new, owner-auth-guarded)
- Migration: `crm_ai_suggestions` table (owner-scoped RLS)

Verification: open `/owner/crm?entity=leads&view=all` → leads visible, stage chips colored, sources expanded, assignee names real, distribution strip + AI cards render, no vertical inner sidebar anywhere.
