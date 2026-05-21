I found three concrete issues to fix:

1. **Omar envelope data/state**
   - Current envelope `810df24a-145b-48f2-8e5a-f18e44e0c576` is saved as `sent`, and Omar’s recipient is `viewed`, so it should appear under **Pending Signature**.
   - The completed/signed record was deleted by an older reset, but the audit log still shows Omar signed on **2026-05-09 20:14:33 UTC** before the reset.
   - I will restore the envelope to the correct pending-signature state, keep Omar’s filled fields, keep the same recipient, and ensure it is visible in both **Generated** and **Pending Signature**.

2. **Wrong template/rendering**
   - The database currently has only these system template keys: `jbj-letterhead-blank` for the standard letterhead and `jbj-letterhead-leasing` for the PAA leasing agreement.
   - The Omar envelope uses the legacy key `jbj-property-advertising-agreement`, while the active leasing system template key is `jbj-letterhead-leasing`.
   - I will normalize the renderer/classification so Omar’s envelope opens with the approved PAA leasing layout, not the blank/standard letterhead layout and not an “official correspondence leasing” letter.
   - I will keep the **Standard JBJ Letterhead** separate for AI-generated letters/job offer/warning/NOC/etc.; it will not be used for Omar’s PAA leasing agreement.

3. **Owner document detail layout**
   - Keep the main action buttons directly above the document.
   - Keep Recipients/CC, Details, Activity Log, and Listing Draft minimized by default in a compact top band.
   - Make the document preview full-width, taller, and independently scrollable so the A4 page can be read fully.
   - Remove the extra full activity log block below the document so it does not push the document down again.

Technical changes after approval:
- Update `DocumentsFormsHub.tsx` bucket/status classification so `sent`, `viewed`, and `partially_signed` always count in **Pending Signature**, including legacy PAA envelopes.
- Update `envelopeStatus.ts` template-kind detection for `jbj-letterhead-leasing`, `jbj-paa-leasing`, and `jbj-property-advertising-agreement`.
- Update `EnvelopeDetail.tsx` title/description and preview layout so legacy/active PAA keys render consistently as PAA Leasing and the document fills the page.
- Add a safe migration to restore Omar’s envelope status/recipient state to pending signature and preserve the current filled Omar fields.