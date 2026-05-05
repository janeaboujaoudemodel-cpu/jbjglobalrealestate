## Scope

Four targeted fixes on the existing CRM Relationships + Brokerage system. No new modules, no duplication.

---

### 1. CC emails not persisting (auto-save fix)

**Problem.** In `DocumentPackPanel` (`src/pages/CRMRelationships.tsx`), `CcListEditor` writes both `saved` and `active` arrays into a local `draft` state. They only persist when the user clicks **Save settings**. Same for `PrimarySenderEditor` — the only reason senders feel "saved" is because the user clicks Save after adding one. CCs disappear because users add them just before sending and never hit Save.

**Fix.**
- Add a small auto-save effect inside `DocumentPackPanel`: when the patch only touches `savedCc`, `savedSenders`, `activeCc`, `replyTo`, debounce 600 ms and call `upsert.mutateAsync` automatically. Anything else (drive URL, from-name) still requires the explicit **Save** click.
- After a successful auto-save, clear the dirty state so the Save banner doesn't appear.
- The CC chip rendering already shows every saved entry with a delete button — once persistence works, "always fixed with delete option" is satisfied.

### 2. "Attended briefing" tracking per agency

**Problem.** No way to mark a brokerage as having attended the breakfast briefing.

**Fix.** Add to `crm_brokerages` (single migration, additive only):
- `attended_briefing boolean NOT NULL DEFAULT false`
- `attended_briefing_date date`
- `briefing_notes text`

(`status` and `notes` already exist — reuse them, do NOT add duplicates.)

UI in the brokerage edit dialog (existing `<Dialog>` around the brokerage form) — new section "Briefing attendance":
- Switch "Attended breakfast briefing"
- Date input (enabled only when switch is on)
- Textarea "Briefing notes"

Also add a small badge on each brokerage card: "Attended ✓ — DD MMM YYYY" when `attended_briefing = true`. Hooked to existing `useUpsertBrokerage`.

### 3. Brokerage "All" tab showing 0 vs per-emirate showing 377

**Investigation.** DB shows 394 brokerages, all `entry_source = 'directory'`, none with NULL emirate. The page reads:
- `data.length` → drives "All" labels → would be 394 ✓
- `directoryCount` → 394
- `ownerCount` → 0
- `existingCount` → 0

So if the user's "All" tab is showing **0** while emirates sum ~377, the most likely cause is the **My Additions** sub-tab being active (which is 0) or a stale `placeholderData` returning an empty cache. Need to confirm in build mode by:
- Logging `data.length` and active `sourceTab` on the live page.
- Verifying `useBrokerages` isn't returning a stale empty array on first paint (it uses `placeholderData: prev` — fine).

**Fix candidates** (will pick during build once root cause is confirmed):
- If "All" tab itself shows the correct number but the **list area** shows 0 — the bug is in `filtered`: `emirateLower` becomes `"all"` and a directory row with `emirate = "Dubai"` matches because `emirateFilter !== "all"` guard works… so this should not fail. We'll verify the active `sourceTab` default and ensure `setSourceTab` isn't being reset to `"owner"` by an effect.
- If a status filter or `do_not_contact` flag is hiding rows, surface a "filters active" banner with a one-click reset.
- Make the **All** sub-tab always read from `data.length` (already does) and add a defensive `sourceTab === 'all'` early-return that bypasses the `entry_source` filter (already does).

### 4. Continue remaining items from prior plan

Two items from the previous plan are not yet wired into the UI:
- **Inbound AI extraction display** in `UAERegistryDetailPage.tsx` Communication tab: render `ai_extracted` JSONB (summary, requested documents, contact person, registration instructions, deadline, recommended next action). Add a "Use AI draft" button that pre-fills the outreach send form with `ai_extracted.draft_response_html` and reuses `uae-registry-send`.
- **Last response summary + required next action** auto-displayed at the top of the Profile tab when the record has `last_response_summary` / `required_next_action` populated by `uae-registry-inbound-reply`.

No new edge functions, no new tables — the extraction is already saved by the inbound function from the previous turn; this is purely UI surfacing.

---

## Files to edit

- `src/pages/CRMRelationships.tsx` — auto-save effect in `DocumentPackPanel`; briefing fields in brokerage dialog + card badge; defensive checks on `sourceTab`/filters.
- `src/hooks/useCRMRelationships.ts` — pass new fields through `useUpsertBrokerage` (no schema-typed changes needed; payload is `any`).
- `src/pages/owner/uae-registry/UAERegistryDetailPage.tsx` — surface `ai_extracted`, `last_response_summary`, `required_next_action`, "Use AI draft" button.
- New migration: add 3 columns to `crm_brokerages`.

No new pages, no new edge functions, no duplicate state, no schema rebuild.

Approve to switch to build mode.