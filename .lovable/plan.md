## Fresh diagnosis

The remaining bugs are coming from four separate places:

1. **Signature picker still blue** because the native `<select>` option highlight is browser/OS-controlled. Styling the select border is not enough; the dropdown options can still render blue.
2. **Duplicated JBJ Front Desk / Help Desk / Support** because duplicate system rows already exist in the database.
3. **Email was changed to `frontdesk@jbj.ae`** in the signature preset data. You want the original emails retained, so this must be restored instead of altered.
4. **Download still blocked on desktop** because the email link currently opens `/d?u=...`, but that page still fetches the underlying storage URL from the browser. Desktop blockers can still block that fetch. The download needs to stream through the project’s existing `download-file` backend function instead.

## Phase 5 — Fix current email/signature/document send issues

### 1. Signature picker: remove native blue completely
- Replace the native `<select>` in `SendViaEmailDialog` with a custom popover/listbox.
- Style hover, active, selected, focus ring, and border with champagne/gold only.
- Keep the same signature-selection behavior, but no browser-native blue option highlight.

### 2. Signature duplicates + wrong email restoration
- Add a database migration that:
  - removes duplicate system signature rows, keeping one per signature name;
  - restores the intended email values from the original system presets instead of the newly changed `frontdesk@jbj.ae` values;
  - keeps Front Desk, Help Desk, and Support as **three separate signatures**, not one bundled signature.
- Add a safe uniqueness guard so the same duplicate system rows cannot be inserted again.

### 3. Subject default: “Signature Pending”
- Update the PAA/envelope default subject generation from `Please sign...` to `Signature Pending — ...`.
- Apply it in:
  - new envelopes created from templates;
  - the send-via-email dialog fallback;
  - test-send and real-send fallback logic.
- Existing envelopes that still have `Please sign...` should be normalized when the dialog opens, unless the owner has manually typed a different custom subject.

### 4. Per-email edit vs standard template save
- Change `Approve & send` and `Send test` so edits apply to the **current email payload only** by default.
- Add an explicit **Save as standard template** action in the dialog.
- Only that explicit save updates `email_subject` / `email_message` on the envelope/template baseline for future opens.
- This preserves your rule: unsaved preview edits affect only the current email, not future emails.

### 5. Download CTA: document icon + no desktop blocking
- Add a premium inline document/file SVG mark to the email download CTA, with no arrow icon.
- Change the branded `/d` landing page so it does **not** fetch the storage URL directly from the browser.
- Route downloads through the existing `download-file` backend stream with `Content-Disposition: attachment`, keeping the visible experience branded as JBJ.
- Upgrade `/d` page copy/design: “Your document is ready”, company name “JBJ GLOBAL REAL ESTATE L.L.C S.O.C”, primary Download button, and direct fallback only through the same proxy path.

### 6. Redeploy changed backend functions
- Because the delivered email HTML is rendered by backend functions, redeploy the changed email/download-related functions after code changes.

## Phase 6 — Continue Forms & Agreements unification after the above bugs are fixed

- Keep `/owner/documents/forms` as the current working route while stabilizing the send flow.
- Then proceed with the Forms & Agreements hub unification:
  - Templates
  - My Documents
  - E-Signature inline section
  - Applications
  - Archive
- Do not remove existing E-Signature/Form features; consolidate them into one hub with redirects for old routes.

## Validation

- Confirm the signature dropdown has no blue hover/selected state.
- Confirm only one each appears: JBJ Front Desk, JBJ Help Desk, JBJ Support.
- Confirm signature emails are restored and not changed to the unwanted new values.
- Send a test email to `infoo.jane@gmail.com`.
- Confirm subject starts with `Signature Pending`.
- Confirm email download CTA includes a document icon and no arrow.
- Confirm clicking download on desktop goes through the branded `/d` page and does not expose/block the raw storage URL.
- Confirm edits sent without “Save as standard template” do not persist as the default for future sends.