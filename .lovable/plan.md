## Brokerage outreach — Send Test fix + remove JBJ Global from brokerage UI/emails

### Problem 1 — "Send Test" silently does nothing on the brokerage card AND from the Outreach menu

Two distinct dialog mounts exist for the brokerage Send Test flow inside `src/pages/CRMRelationships.tsx`:

- `BrokeragesTab` (line 480) owns its own `testSendOpen` state. The `OutreachActionsMenu → Send test` (line 1000) toggles it AND `Send test email` button on the Brokerage Outreach Pack card dispatches `crm:open-brokerage-test` (line 1658) which is also wired to that state via the listener at lines 537–544. **However, the matching `<TestSendDialog mode="brokerage" …/>` instance is mounted at the bottom of the FILE (line 2612) inside the outer page component, NOT inside `BrokeragesTab`.** That outer dialog reads its own `testSendOpen` state declared at line 2538, which is **never set to true by anything**. The two `setTestSendOpen` calls inside `BrokeragesTab` only toggle the inner state, which has no dialog mounted to listen to it. Net effect: clicking "Send test" in either place does nothing.

  **Fix**: mount the brokerage `<TestSendDialog mode="brokerage" variant="brokerage_partnership_intro" …/>` **inside** `BrokeragesTab` (next to its `<TemplateEditorDialog>` mount), wired to the local `testSendOpen` / `setTestSendOpen`. Remove the orphan instance at line 2612 (and its dead state at 2538) from the outer wrapper.

- While editing, also confirm the variant matches what the user is actively editing — pass `variant={tplOpen ? <currently-edited-variant> : "brokerage_partnership_intro"}` only if needed; otherwise leave the default. No business-logic changes.

### Problem 2 — Strip "JBJ Global" / "Amra · JBJ Global" / "on behalf of JBJ Global Real Estate" wording from the brokerage area

User intent: brokerage outreach is on behalf of **CITI Developers** only. Amra is the sender, no co-branding with JBJ Global.

Hits to remove/rename in `src/pages/CRMRelationships.tsx`:

1. Line 1551 — `headerTitle = "Brokerage Outreach Pack — Amra · JBJ Global"` → **"Brokerage Outreach Pack — Amra · CITI Developers"**.
2. Line 1554 — lead copy `"…sent by Amra on behalf of JBJ Global Real Estate"` → **"…sent by Amra for CITI Developers."**.
3. Line 1599 — `From name` placeholder `"Amra · JBJ Global Real Estate"` → **"Amra · CITI Developers"**.

Edge function `supabase/functions/crm-send-brokerage-outreach/index.ts`:

4. Line 103 — preamble line `"We'd love to introduce JBJ Global Real Estate to your team."` → **"We'd love to introduce CITI Developers to your team."**.

DB row `crm_email_templates` where `variant = 'brokerage_breakfast_invite'`:

5. The HTML contains `"On behalf of <strong>Citi Developers</strong>, I'd like to personally invite…"` — keep "Citi Developers" but ensure the wording reads naturally without any JBJ co-branding. **No JBJ references exist in either DB template** (verified — `position('JBJ' in html) = 0` for both). The only "behalf" string is the Citi Developers one which is correct.

   No DB change required for JBJ removal — the only on-screen "JBJ Global" / "on behalf of JBJ Global" copy is in the React `DocumentPackPanel`, not in the email body.

### Verify

1. Open Brokerages tab → click **Outreach → Send test** → dialog opens.
2. Open Brokerage Outreach Pack card → click **Send test email** → same dialog opens.
3. Send a real test → email arrives; signature reads "Amra … CITI Developers" with no JBJ wording.
4. Card header reads "Brokerage Outreach Pack — Amra · CITI Developers".
5. Lead paragraph below reads "…sent by Amra for CITI Developers."

### Files to change

- `src/pages/CRMRelationships.tsx` — relocate brokerage `<TestSendDialog>` into `BrokeragesTab`, remove orphan instance + dead state, copy fixes (lines 1551, 1554, 1599).
- `supabase/functions/crm-send-brokerage-outreach/index.ts` — line 103 copy fix; redeploy.

No DB migration, no template HTML changes, no business-logic changes.
