Plan to fix the Document Studio holiday-home contract end-to-end:

1. Lock the Holiday Home document layout
- Make Holiday Home Booking Agreement use an explicit locked page structure that Document Studio will not auto-repaginate.
- Page 1: premium welcome introduction, guest identity/booking profile, quotation only. No terms/conditions on page 1.
- Page 2: terms & conditions only, kept together on one page without the acknowledgement/disclaimer splitting into another page.
- Page 3: acknowledgement/disclaimer centered, signature block pushed lower, authorised company signature/stamp and guest signature aligned parallel on the same row, footer fixed to the bottom.
- If the final visual test proves disclaimer + signatures + footer can fit cleanly after page 2 terms without violating readability, I’ll keep it on page 2; otherwise the locked 3-page version will remain.

2. Improve the Holiday Home content and live fields
- Rewrite the intro to sound more premium and welcoming.
- Add missing left-side fields that the preview already expects: ID type, ID/passport number, nationality, booking date.
- Use dummy defaults in preview until the left-side fields are filled, then reflect the real values live.
- Generate and persist one system booking ID per document using the existing chained booking ID function, instead of random preview IDs changing during edits.

3. Fix saved-document persistence and library flow
- Save generated documents into the existing `crm_documents` flow with template ID, booking ID, field values, and rendered HTML so saved documents do not disappear.
- Keep the existing action-sheet flow: Preview / Edit / Delete.
- Show saved documents grouped by the selected document type, so Holiday Home shows holiday-home contracts, Commission Agreement shows commission contracts, etc.

4. Fix stamp/signature visuals
- Remove the white background from the JBJ company stamp asset used inside the document.
- Increase/stretch the stamp display so it is clearer and less compressed.
- Keep signature/stamp controls clickable and make the final page signature area align cleanly: company side and other-party side parallel.

5. Fix footer and header chrome
- Make preview and export footer match exactly.
- Footer will be full-width edge-to-edge, pinned flush to the page bottom with no white gap below it.
- Keep the full company legal name on one line; distribute office, phone, email, website, and trade licence more spaciously below.

6. Fix language selector border
- Override the Document Studio language dropdown focus/active styles so it uses gold borders/rings only, never blue.

7. Visual + technical E2E verification
- Open the Careers Portal Document Studio, select Holiday Home, inspect pages 1–3 visually.
- Fill guest/ID/booking fields and confirm live preview updates.
- Save the document, reload/select the template, and confirm it appears under the saved Holiday Home documents with the booking ID.
- Confirm Preview/Edit/Delete action sheet still works.
- Confirm Export PDF and Print controls are visible and usable.
- Check console/network for errors during the flow.