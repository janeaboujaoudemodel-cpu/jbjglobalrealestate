I found two separate signing systems mixed together:

1. The email button currently opens `/sign/:token`, which loads the newer e-signature envelope flow.
2. There is also an older CRM document flow with `/documents/sign/:token`, but that page is currently just a dead “link no longer valid” screen.

The “Unable to Load Document” is not a styling issue: the failing link is almost certainly using an expired/invalid token, or routing a CRM document token into the envelope loader. I will fix the actual routing/loading instead of only changing the template.

Plan:

1. Make the public signing page robust
- Update the `/sign/:token` page so it shows a clear branded loading state immediately, not a white blank page.
- Improve the error message to show the real backend reason: expired link, invalid token, completed document, or missing document.
- Remove public display of contact email from the error screen to respect the project privacy rule.

2. Fix token/link mismatch
- Update document sending so CRM document links use `/documents/sign/:token`, not `/sign/:token`.
- Replace the placeholder `/documents/sign/:token` page with a real public document review/sign UI using the existing `documents-public-fill` backend function.
- This UI will load the agreement by token, render the agreement HTML, let the client draw/sign, then submit the signature back to the existing backend.

3. Fix signature appearance in the agreement
- Remove the cheap duplicated underscore/line behind the typed name/signature area.
- Render captured signatures in a distinct handwritten-style treatment: darker ink, larger, italic/cursive fallback stack, with one thin gold hairline only when needed.
- If the captured image is used, it will sit cleanly without an extra underline cutting through it.

4. Fix existing date underline duplication permanently
- Keep the DD/MM/YYYY date group as one continuous gold hairline only.
- Ensure final signature-date blocks do not add extra mini underlines.

5. Deploy and verify the backend functions that changed
- Deploy any edited signing/document functions immediately after code changes.
- Test with real recent tokens through the deployed function before saying it works.
- If the token is expired, I will report that specifically instead of claiming the page is fixed.