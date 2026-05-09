Plan to implement immediately after approval:

1. Draft application lifecycle
- Let template forms be created even when client/property fields are incomplete.
- Save incomplete generated forms as `draft` with whatever fields are available instead of blocking creation.
- Keep completed/generated-but-unsent forms in the Draft/Forms Generated area until sent for signature.

2. Draft bulk actions + recently deleted
- Add selection controls in Drafts: select one, select all, clear selection.
- Add bulk actions: delete selected, delete all visible drafts.
- Change draft deletion to soft-delete first, not permanent delete.
- Add a Recently Deleted view with restore selected, restore all, and permanent-delete behavior after 30 days.
- Add the required database fields/functions for `deleted_at` and 30-day purge, and exclude deleted forms from normal Draft/Sent/Signed lists.

3. Signature and email branding cleanup
- Remove the duplicated sender name from the premium signature; keep one luxury name line with a real gold divider underneath.
- Change title to `Founder & CEO`.
- Remove all `Private Office` wording in the e-signature email, footer, and document chrome; replace with the official office location already used by the project’s contact/brand source.
- Force email and website display as `CONTACT@JBJ.AE` and `WWW.JBJ.AE`.
- Fix email footer spacing so company name stays on one line, email/website/phone do not collide, and phone does not split across lines.
- Fix the broken font link and make the test email render exactly like the real recipient email.
- Remove `[TEST]`, “This is a test preview”, and the test alert/banner from the actual email body; keep only internal audit metadata so clients are not affected.

4. Signing link failure
- Fix `/sign/:token` so the public signing page sends the signing token in the expected secure header when loading recipient/document/fields.
- Also validate token expiry correctly and show the document, signature pad, download button, and submit flow from the test email link.
- Keep test sends from changing recipient/envelope status, but use the real active signing token so the Review & Sign button opens the same signable document.

5. Border mismatch in generated agreement
- Make the internal page card and gold outer border use matching sharp/square corners so there is no rounded-card gap inside the document preview/print/email rendering.
- Apply the same fix to regenerated PDFs so print and preview match.

6. Deployment and verification
- Redeploy changed email/signature backend functions after edits.
- Navigate through the flow end-to-end: create an incomplete draft, bulk delete/restore it, send test email, open Review & Sign from the generated link, sign, and confirm download/preview works.
- Capture screenshots of the Draft bulk controls, email preview/signature, and working signing page after implementation.