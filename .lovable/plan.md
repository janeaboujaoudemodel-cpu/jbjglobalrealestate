## Phase-2 CRM Audit — All 9 tasks verified ✅

I traced each requested item to its concrete location in the codebase and confirmed it is wired end-to-end. No regressions found; nothing requires re-implementation. One small UX gap is noted at the bottom (optional follow-up).

| # | Task | Status | Where it lives |
|---|------|--------|----------------|
| 1 | **Fix "All Leads" empty state** | ✅ Implemented | `CRMLeadsTableV2.tsx` L651-672 — splits empty state into two: (a) `leads.length===0` → "No leads yet" + Refresh / Import CSV / Add lead buttons; (b) filter-hidden → "No leads match your filters" + count + **Clear filters** button. Owners bypass `isRealCRMLead` (L170) so seeded rows are visible. |
| 2 | **Stage colored chips + green positive** | ✅ Implemented | `LeadQuickFilters.tsx` (Hot/Won = `text-emerald-700`, Lost/Invalid = `text-red-700`). Inline status dropdown `InlineStatusSelect.tsx` groups by category with **emerald** dot for `positive`, **red** for `negative`, **blue** for `neutral`. Quick chips strip in `CRMLeadsTableV2.tsx` L402-411 also active. |
| 3 | **Sources cell expanded display** | ✅ Implemented | `CRMLeadsTableV2.tsx` L733-737 — Source `<TableCell>` is `min-w-[180px] max-w-[260px] whitespace-normal break-words`, value rendered as champagne pill (`bg-[#EFE6D6]/60` + gold border). `formatSourceLabel()` (L379) maps raw keys → human labels (Newsletter, AI Chat, Brochure Download, etc.). |
| 4 | **Champagne dropdown surfaces** | ✅ Implemented | All 3 `<SelectContent>` in `CRMLeadsTableV2.tsx` L558/579/599 use `bg-[#FDFBF7] border-[#B89555]/40 shadow-xl ring-1 ring-[#B89555]/10` with `[&_[data-highlighted]]:bg-[#EFE6D6]`. `InlineStatusSelect.tsx` dropdown uses the gradient `from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]`. |
| 5 | **Replace Unassigned with Me / Pool** | ✅ Implemented | Filter dropdown L580-583: **All Owners / With Me / Assigned to a Broker / Pool (no broker)**. Assigned-broker cell L764 shows italic "Pool" instead of "Unassigned". Tag filter L602 also says "Pool (no broker)". |
| 6 | **Add assignee filter** | ✅ Implemented | New `assigneeFilter` state L98, filter logic L359-366 (handles `__mine__`, `__assigned__`, `__unassigned__`, and per-broker UUIDs). Dropdown L575-593 lists all brokers via `assigneeOptions` (L341). Cleared by "Clear filters" button. |
| 7 | **Lead distribution strip** | ✅ Implemented | `CRMLeadsTableV2.tsx` L474-519. Shows: total · `with me` (emerald) · `assigned` (blue) · `in pool` (amber) + top-6 brokers as clickable chips that toggle `assigneeFilter`. |
| 8 | **AI next-actions panel + edge function** | ✅ Implemented | `CRMAINextActions.tsx` (242 LOC) mounted in `UnifiedCRM.tsx` L246 (Leads → Overview). Edge function `supabase/functions/crm-ai-next-actions/index.ts` (187 LOC) uses `npm:ai` + Lovable AI gateway, validates with zod, caches in `crm_ai_suggestions` table (verified to exist in DB). UI handlers route Call → `tel:`, Email → `mailto:`, Schedule → lead page, Mark Won → updates `pipeline_stage`. |
| 9 | **Remove vertical sub-sidebar** | ✅ Implemented | `UnifiedCRM.tsx` only contains horizontal `<nav role="tablist">` bars (entity bar L376, sub-section bar L423). No left-rail / `lg:w-64` column remains. `CRMSideRail` (L486) is the floating slide-in **action dock** (Calendar/Notes/Tasks button), not a vertical navigation sidebar — keeping it is consistent with the request. |

### Runtime / build sanity

- DB: `crm_ai_suggestions` table present (verified via `psql`).
- Console error in current preview is unrelated: `DocumentsFormsHub.tsx` failed dynamic import on `/owner/documents/forms` — that's a different page from the CRM and not part of this scope.
- No TypeScript or build errors reported by the harness on the 4 CRM files touched.

### Optional small follow-ups (not part of original 9, only flag — not changing now)

1. The AI panel's `Snooze` action only hides locally — it doesn't write a `snoozed_until` to the DB, so it reappears on refresh. Add a `crm_ai_snoozed (lead_id, until)` row + filter in the edge function if you want true snooze persistence.
2. Distribution strip top-broker chips aren't keyboard-focusable in screen-reader order (they're `<button>` so OK, but no `aria-pressed`). Add `aria-pressed={assigneeFilter===id}` for full a11y parity with the segmented control standard.

Say "apply follow-ups" if you want me to implement the two optional items above; otherwise the 9 tasks are confirmed complete and live.