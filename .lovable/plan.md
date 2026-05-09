I found the immediate cause: the hub is querying raw `status = draft` and labeling those rows as “Forms Generated”, so empty unnamed drafts are counted/generated incorrectly. The dashboard also masks phone/email by design, and the document preview only has a red hover/remove confirm instead of visible field controls.

Plan to fix immediately:

1. Document hub classification and speed
- Split documents into clear buckets:
  - Draft Applications: empty/incomplete template drafts, including the two “Unnamed client” selling forms.
  - Forms Generated: completed template data ready for review/send.
  - Pending Signature.
  - Signed.
  - Recently Deleted.
- Exclude `deleted_at` rows from normal lists and show them only in Recently Deleted.
- Replace multiple separate envelope queries with one optimized query and client-side bucket counts to stop the slow loading/flicker.
- Add bulk-select checkboxes for Draft Applications / Forms Generated / Recently Deleted.
- Add bulk actions: move to Recently Deleted, restore, and clear selection.

2. Correct existing document data display
- Keep the two empty unnamed forms as Draft Applications.
- Ensure Omar’s completed document displays correctly with full client name and full phone/email wherever owner/admin sees the card.
- Remove masked phone/email display on owner/admin e-sign cards and show full values.

3. Template creation without client email
- Allow creating/saving a template draft without client email.
- If no email exists, keep the client recipient out until send time and support WhatsApp/copy-link flow once recipient details are added.
- Keep email sending protected: email channel still requires a valid recipient email at send time.

4. Document preview/editor controls
- Replace the red-only hover behavior in the preview with visible inline controls on editable fields:
  - X/remove field.
  - Edit field.
  - Approve field.
  - Clearer selected/hover state.
- Improve placed-signature fields in the field placer so delete and resize handles are reliably visible and not hidden/clipped.
- Keep resizing handles on all corners and allow direct field value edits from the side list.

5. “Approve” property details logic
- Add an Approve action that applies smart visibility rules to the rendered document.
- For Omar’s/current PAA data, property details will show Apartment, Furnished, and the correct occupancy state.
- Because you specified it is currently tenanted with vacating date on the 24th, the approved document should show Tenanted + Vacating Date 24th, not incorrectly force Vacant before that date.
- Hide non-applicable options from the approved render: Villa, Office, Warehouse, Unfurnished, and any irrelevant fields.
- Always include Plot Number as a field in the template form/schema per Property Finder requirements, even when plot size is not applicable.

6. Trade license company naming
- Ensure generated agreements use the full registered company suffix `LLC SOC` when writing the company legal name, while keeping the public brand name as `JBJ GLOBAL REAL ESTATE` where appropriate.

7. CRM merge and dropdown filters
- Complete the CRM contact merge path around the unified contact view/RPC standard.
- Add requested dropdown filters for CRM lists: Stage, Source, Owner/Assignee, and Tag.
- Keep filters URL/state-safe and compatible with bulk actions.

8. Download/blank-preview hardening
- Keep private signed-document downloads using authenticated blob fetch.
- Replace remaining direct private-storage iframe/open links in e-signature pages with authenticated/proxied URLs so blank previews and “authentication required” errors do not recur.

9. E2E screenshot verification
- Test the full flow end-to-end:
  - Create draft without email.
  - Fill/approve PAA fields.
  - Confirm Draft Applications vs Forms Generated buckets.
  - Send for signature.
  - Sign via public signing link.
  - Confirm signed PDF download and audit certificate download.
  - Confirm Recently Deleted restore.
  - Confirm CRM filters.
- Capture screenshots for the major steps and fix any layout/data regressions found before marking complete.