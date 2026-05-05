## Brokerage outreach is its own pack + persistent Test Send

### What's actually wrong (verified in code/DB)

- **Document Pack is shared between developer and brokerage.** `DocumentPackPanel` reads/writes one set of columns (`drive_doc_pack_url`, `saved_sender_emails`, `saved_cc_emails`) regardless of `context`. The `crm-send-brokerage-outreach` edge function reads from those same shared fields. So whatever you save under "Brokerage Outreach" silently overwrites the developer pack and vice-versa — that's why the brokerage pack feels wrong (wrong drive link, wrong senders/CCs). 
- **`Open Pack ↗` button has poor contrast on normal load.** It uses `border-[#1A1A1A]/30 text-[#1A1A1A]` on a `#FDFBF7` card with no fill — almost invisible until hovered. Same card squeezes the input + button on one row, so on a 1028px viewport the URL is clipped.
- **Trash icon on saved-email chips is `text-[#1A1A1A]/70` inside a tiny ghost button** — barely visible against the cream chip; users miss it.
- **TestSendDialog forgets recipients.** Each open it only prefills the user's own auth email; CC list resets every time. That's why "send test" feels disposable.

### Plan

#### A. Make the Brokerage Document Pack genuinely separate
1. **Migration** — add brokerage-only columns on `crm_owner_settings`:
   - `brokerage_drive_doc_pack_url text`
   - `brokerage_saved_sender_emails jsonb default '[]'`
   - `brokerage_reply_to_email text`
   - `brokerage_saved_cc_emails jsonb default '[]'`
   - `brokerage_active_cc_emails jsonb default '[]'`
   - `brokerage_from_name text`  (default "Amra · JBJ Global Real Estate")
   - Plus persistent test-send fields (used by section D below):
     - `saved_test_to_emails jsonb default '[]'`
     - `saved_test_cc_emails jsonb default '[]'`
2. **`DocumentPackPanel`** — when `context="brokerage"` read/write the `brokerage_*` columns. When `context="developer"` keep using the existing fields. Header copy on the brokerage pack: "Brokerage outreach pack — sent by Amra on behalf of JBJ Global. Independent of developer registration."
3. **`useCRMRelationships.ts`** — extend defaults so brokerage fields hydrate to safe values (`[]`, `""`).
4. **`supabase/functions/crm-send-brokerage-outreach/index.ts`** — read `brokerage_drive_doc_pack_url`, `brokerage_reply_to_email`, `brokerage_active_cc_emails`, `brokerage_from_name` first, falling back to the shared field only if brokerage-specific is empty (back-compat for existing customers). Same for `crm-bulk-brokerage-send` if it shares the resolver.

#### B. Fix contrast and layout (normal load)
- `Open Pack ↗` becomes `<Button variant="outline">` with `bg-[#EFE6D6] border-[#B89555]/40 text-[#1A1A1A]` — visible on champagne without hover.
- The Drive URL row collapses to two rows on `<lg` so the input never gets clipped:
  - `<div className="flex flex-col sm:flex-row gap-2">` with `min-w-0 flex-1` on the input wrapper.
- Trash icon in `EmailListEditor` chips → `text-[#1A1A1A]` (full ink) inside a `bg-[#1A1A1A]/5 hover:bg-red-100 hover:text-red-700` round button so it's always discoverable.

#### C. Speed
- Already addressed in the previous pass (lazy tabs, `placeholderData`, `refetchOnWindowFocus: false`). Add one more: wrap `DocumentPackPanel` in `React.memo` so unrelated re-renders of the parent tab don't re-render it (it currently re-renders on every keystroke in the search box because it sits inside `BrokeragesTab`).
- Promote `DocumentPackPanel` to be rendered once at the page level (inside the active tab still, but outside the heavy filter/sort block), so its inputs feel instant.

#### D. Persistent Test Send
1. **Always-available "Send Test" button** stays where it is in both tabs (already mounted).
2. **`TestSendDialog`** rework:
   - On open, hydrate `to` + `cc` chip lists from `crm_owner_settings.saved_test_to_emails` and `saved_test_cc_emails`.
   - Both fields are now **chip lists** (same UX as `CcListEditor`): add multiple recipients, multiple CCs, click chip to toggle "use for this test", click trash to delete.
   - On send, if a chip was added/removed, write the updated array back to `crm_owner_settings` so it persists across sessions.
   - All "active" To addresses get the test email (loop), CCs come along on each send.
   - Edge function call extends `testRecipient` to also accept `testRecipients: string[]`. Backwards-compatible: fall back to the comma-joined string.
3. Subject still prefixed `[TEST]`; nothing logged to outreach history.

### Files to touch
- `supabase/migrations/<new>.sql` — add 8 brokerage-and-test columns.
- `src/hooks/useCRMRelationships.ts` — defaults + types for the new fields.
- `src/pages/CRMRelationships.tsx` — pass/consume `context`, button visibility/layout, memoize panel.
- `src/components/crm/EmailListEditor.tsx` — visible trash button, responsive chip wrap.
- `src/components/crm/TestSendDialog.tsx` — persistent chip lists, multi-recipient send, save back on close/send.
- `supabase/functions/crm-send-brokerage-outreach/index.ts` — resolve brokerage-specific settings; accept `testRecipients[]`.
- `supabase/functions/crm-send-developer-registration/index.ts` — accept `testRecipients[]` (parity for developer test sends).

### Out of scope
- No changes to the actual outreach templates or pipeline beyond the field source.
- No changes to send history / queue UI beyond what's needed to keep them fast.
