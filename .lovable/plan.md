## Goal

Four fixes across the CRM Relationships page (Brokerages + Developer Registry tabs).

---

## 1. Developer Registration Pack card — match the brokerage card

In `src/pages/CRMRelationships.tsx` `DocumentPackPanel`:

- Currently the **"Open template editor"** and **"Send test email"** buttons render only when `context === "brokerage"`. Render them for `context === "developer"` as well, dispatching new events `crm:open-developer-template` and `crm:open-developer-test`.
- Wrap the entire card in the same `<Collapsible>` minimiser pattern already used in the developer page (header row with chevron + "Collapse" link). Persist open/closed state in `localStorage` per-context (`crm.pack.brokerage.collapsed`, `crm.pack.developer.collapsed`). Both cards (brokerage card at line 818 and developer card at line 2041) get the identical collapsible chrome.
- In the developer tab (`DeveloperRegistryView`), wire the new events so they open the existing `TemplateEditorDialog` / `TestSendDialog` for the **developer** template (not the brokerage one). Pass `context="developer"` so the dialogs target the developer pack, not the brokerage pack.

No business logic changes — only UI parity + collapse.

---

## 2. DLD import — show real per-batch progress

Today `handleImportDLD` calls the edge function once and the function inserts everything internally, so the UI only sees a single final toast. Replace with a client-driven batched flow:

1. Fetch `/dld-broker-offices.json` once on the client (already public).
2. Slice into chunks of **500 rows**.
3. For each chunk, call `crm-import-dld-brokerages` with `{ rows: chunk }`. The edge function already supports `body.rows`.
4. After every chunk, update a single sticky toast:
   `Importing DLD register — 4,500 / 10,078 done · 5,500 remaining · +312 new this batch`
5. Track running totals (`insertedTotal`, `updatedTotal`, `skippedTotal`) and show them in the final success toast.
6. Add a `Cancel` action on the toast that aborts the loop between batches.
7. Disable the button + show progress bar (reuse the existing `Progress` component) inline next to the button.

No edge-function change needed — the function is already idempotent and accepts `rows`. Only `handleImportDLD` in `CRMRelationships.tsx` is rewritten.

---

## 3. CRMListSidebar — convert to horizontal toggle

`src/components/crm/CRMListSidebar.tsx` currently renders as a 224px-wide left rail (`w-56 shrink-0 … sticky`). On the brokerage and developer tabs it squeezes the main content into a narrow column.

Plan:

- Add a new layout variant `orientation: "horizontal" | "vertical"` (default `horizontal`).
- In horizontal mode it renders as a single-row pill bar above the filter bar:
  `[ All active 1,240 ] [ Databases ▾ 3 ] [ Junk Bin 12 ] [ Trash 5 ]`
  - "Databases" becomes a dropdown popover (no horizontal sprawl when many lists exist).
  - Same active styling as today (champagne fill + ink text + hairline gold border) — keeps the design-system contract.
- Update `CRMRelationships.tsx` brokerage view (line ~798) and developer view (line ~2030) to use the horizontal variant, and remove `flex-col lg:flex-row` wrapper so the main column reclaims full width.
- Keep the vertical variant available (no callers right now, but harmless) so we can revert per-page if needed.

---

## 4. Lock "one agency per email" rule

The user's hard rule: **a single outreach email must reference exactly one brokerage everywhere** — greeting, subject, body, footer. No mixing of two agency names.

Steps:

1. **Edge function guard** (`supabase/functions/crm-send-brokerage-outreach/index.ts`):
   - After template substitution, run a guard that:
     - Confirms the resolved `brokerage_name` is a non-empty string.
     - Scans the rendered subject + html + text for any **other** brokerage name from `crm_brokerages` for this owner that is NOT the recipient. If found → return `400 { error: "Cross-agency contamination blocked", offending: [...] }` and DO NOT send.
     - Confirms no leftover `{{brokerage_*}}` placeholders remain.
   - Lock greeting to `Dear {{brokerage_name}} team,` when no contact name exists — never `Dear Info`, never another brokerage.
2. **Test send** path uses `testBrokerageName` (already added) and applies the same guard.
3. **DB-level safety**: add a CHECK trigger on `crm_email_send_log` (or whichever audit table records sends) that rejects rows where `subject` or `body` contains the literal text of a different `brokerage_name` from the same owner. (Implemented as a `BEFORE INSERT` plpgsql trigger doing a single `EXISTS` lookup against `crm_brokerages`.)
4. **Template editor**: when the owner edits the brokerage template, show a red banner if the saved subject/body contains a hard-coded agency name from the directory (`Provident`, `Fine Properties`, etc.) instead of `{{brokerage_name}}`. Block "Save" until cleaned.
5. Memory: write `mem://compliance/single-agency-email-rule` capturing the rule + enforcement points so it can never be re-broken silently.

---

## 5. Tighten RLS / exposed-data audit (scoped)

Run the Supabase linter and review RLS only for the tables touched by this change:

- `crm_owner_settings` — confirm `owner_id = auth.uid()` on every policy (select/insert/update/delete).
- `crm_brokerages` — confirm same and that no policy uses `USING (true)`.
- `crm_email_send_log` (or equivalent) — owner-scoped read; service-role-only insert from edge function.
- `crm_email_templates` — owner-scoped CRUD.

Fix any finding in a single migration. No schema changes beyond what step 4.3 requires (the cross-agency trigger).

---

## Out of scope

- Calendar / Google integration changes
- Email design beyond the single-agency lock
- Bulk newsletters
- Auth flow

---

## Files touched

- `src/pages/CRMRelationships.tsx` (sections 1, 2, 3 wiring)
- `src/components/crm/CRMListSidebar.tsx` (section 3)
- `src/components/crm/TemplateEditorDialog.tsx` + `TestSendDialog.tsx` (accept `context="developer"`, listen for new events; section 4.4 banner)
- `supabase/functions/crm-send-brokerage-outreach/index.ts` (section 4.1, 4.2)
- New migration: cross-agency trigger + any RLS tightening (section 4.3, 5)
- New `mem://compliance/single-agency-email-rule`

---

## Verification

- Click both pack cards → collapse/expand persists across reload.
- Developer pack shows the two new buttons; clicking opens the developer template/test.
- Trigger DLD import → toast updates every batch with `done / total · remaining`.
- Brokerage and developer tabs render full-width; list filter bar sits horizontally above filters.
- Send a test brokerage email containing two different agency names in the body → server returns 400, nothing sent, toast explains the block.
- Supabase linter is clean for the four tables listed.
