## Plan

1. **Make the Message body stable and editable**
   - Replace the fragile `contentEditable` message editor with a controlled `<textarea>`-based editor for this email body.
   - Keep the toolbar out of the typing path so typing, deleting, selecting, and cursor position behave normally.
   - Convert the textarea text to clean email HTML for preview and sending, so the live preview still updates immediately.

2. **Lock the default template to the requested wording**
   - Use one canonical message template:
     ```text
     Dear {{client_name}},

     Please find the PDF attached to this email. Once you have reviewed it,
     kindly sign it using DocuSign at your earliest convenience and return
     it by replying to this email or this ticket with the signed copy attached.

     Thank you,
     ```
   - Remove old phrases such as “signature pending”, “secure download button below”, “attached PDF document for electronic signature”, and signature-token leftovers when the dialog opens.

3. **Stop stale saved/draft text from reintroducing bugs**
   - During hydration, ignore or clean legacy saved templates and local drafts that match old wording.
   - Keep user edits from being overwritten while typing.
   - Update the parent fallback default body so new envelopes open with the same short template.

4. **Keep preview and sends consistent**
   - Pass the generated clean HTML to `EmailPreviewIframe`, test-send, and real-send payloads.
   - Ensure the preview reflects exactly what the editable Message field contains, plus the separate signature block.