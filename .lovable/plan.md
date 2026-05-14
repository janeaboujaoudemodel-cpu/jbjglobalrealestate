## Plan: Email preview flow polish

### (a) Auto-save subject/body on every keystroke
- In the e-signature send dialog (and any sibling outreach dialog using `SubjectInput` + `EmailBodyEditor`), wire both fields through `useFormAutoSave` (or a lightweight debounced `localStorage` writer mirroring it) keyed per envelope/lead id.
- Persist `{ subject, bodyHtml }` on every change with ~400ms debounce; restore on dialog open if a draft exists and envelope hasn't been sent yet.
- Clear the draft after a successful lock+send or when the user explicitly hits Cancel → Discard.
- Show a subtle "Draft saved" hint under the editor (no toast spam).

### (b) Clean up the "Agreement — Leasing" dash style
- Audit where the title renders (subject preset + preview header in `buildEnvelopeEmailHtml` and the dialog title).
- Replace the ASCII hyphen `-` with a typographic em dash `—` consistently, trim surrounding whitespace, and standardize casing to `Agreement — Leasing`.
- Apply the same normalization helper to other preset titles so future labels stay consistent.

### (c) Deploy updated edge functions
- Redeploy `elevenlabs-agent` and `elevenlabs-conversation-token` (already edited in prior turns) plus any outreach send function touched by the subject/preset normalization, so the locked payload matches the new title format byte-for-byte.

### Technical notes
- Files likely touched: `src/components/e-signature/*` (send dialog), `src/lib/email/buildEnvelopeEmailHtml.ts`, a small `src/lib/email/presetTitles.ts` helper, possibly `src/hooks/useFormAutoSave.ts` usage.
- No schema changes; drafts live in encrypted `localStorage` via existing `useFormAutoSave`.
- Deploys: `elevenlabs-agent`, `elevenlabs-conversation-token`, and the e-signature send function if its preset rendering changes.
