## Goal

When the user clicks **Send via email** on a leasing envelope:

1. The Message body in the dialog should start directly with `Dear {client},` and contain only the agreed wording — no "Signature pending", no "Please find attached the signature", no "secure download button below" leftovers.
2. The Message field must be fully editable — the user reports it currently won't accept typing.
3. The live preview on the right must reflect the new short body byte-for-byte.

## New default body (single source of truth)

```
Dear {{client_name}},

Please find the PDF attached to this email. Once you have reviewed it,
kindly sign it using DocuSign at your earliest convenience and return
it by replying to this email or this ticket with the signed copy attached.

Thank you,
```

The signature block is rendered separately by the template (it already is) — no signature text in the body.

## Changes

### 1. `src/components/e-signature/SendForSignatureDialog.tsx`
- Replace `DEFAULT_BODY` with the new copy above (drop the "secure link below / fully executed copy will be returned" lines, drop the trailing `{{sender_signature}}`).

### 2. `src/components/e-signature/SendViaEmailDialog.tsx`
- Add a NEW_DEFAULT_BODY_HTML constant matching the wording above and use it as the seed when `defaultBody` is empty/legacy.
- In `legacyBodyToHtml`, additionally strip legacy phrases so old saved templates auto-clean on open:
  - `Attached is your … prepared by JBJ Global Real Estate.`
  - `Kindly review and digitally sign … secure link below …`
  - `Once signed, a fully executed copy will be returned to you automatically.`
  - any `also available via the secure download button below` fragment.
  After stripping, if the remaining body is empty, fall back to `NEW_DEFAULT_BODY_HTML`.
- In the dialog's hydration effect, when the saved `data.body_html` from `esign_email_template_defaults` matches the legacy preset, replace it with `NEW_DEFAULT_BODY_HTML` instead of restoring the old text.

### 3. Fix the "can't type in Message" bug

Two root causes:

a. **Hydration effect re-runs on every parent re-render.**
   The effect at lines 198–243 depends on `defaultBody`, `defaultSubject`, `attachmentName`, etc. The parent passes new string references on each render, so the effect overwrites `bodyHtml` after every keystroke.

   Fix: gate the hydration with a `hydratedRef` that resets only on `open` transitioning false → true. All resets (`setTos`, `setCcs`, `setSubject`, `setBodyHtml`, etc.) run once per open, not on every prop change.

b. **`EmailBodyEditor` re-syncs `innerHTML` while the field is focused**, clobbering the caret.

   Fix in `src/components/e-signature/EmailBodyEditor.tsx`: in the `useEffect` that mirrors `value` into `innerHTML`, skip the assignment when `document.activeElement === ref.current`. Only sync when the editor isn't focused (e.g., when a preset is inserted programmatically).

### 4. `src/components/e-signature/EmailPreviewIframe` consumers
No template change needed — the iframe already renders whatever `bodyHtml` is passed. Once the body is corrected, the preview updates automatically. The hidden Gmail preheader strings in `buildEnvelopeEmailHtml.ts` and `_shared/envelope-email-html.ts` stay (they're invisible and don't appear in the preview pane).

## Verification

1. Open `/owner/documents/forms/<id>` → Send via email.
2. Confirm the Message editor shows only the new 3-line body.
3. Type freely in the Message field — caret stays put, characters appear.
4. Live preview matches keystroke-by-keystroke.
5. Send test to `infoo.jane@gmail.com` and confirm the delivered email has the same short body.

No backend / edge-function changes required — the edge functions already forward `interpolated_body_html` verbatim.
