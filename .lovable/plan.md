## Message I will send after a client replies with a signed document

**Subject:** Thank you for signing — JBJ Property Advertising Agreement

**Body:**

Dear Omar Allam Niazi Shadid,

Thank you for signing the document. We have received your signed Property Advertising Agreement and it has now been filed securely with JBJ GLOBAL REAL ESTATE.

Document: JBJ-PAA-LEASING-0001  
Signed received: {received date and time}

Our team will review the signed copy and contact you if anything further is required. If you have any questions, simply reply to this email.

With appreciation,  
JBJ GLOBAL REAL ESTATE

A test of this thank-you email will be sent to **infoo.jane@gmail.com** after implementation.

## Tasks

### 1. Force the latest PAA PDF before every email send
- Make **Send test** and **Approve & send** regenerate/synchronise the current PAA document first.
- Ensure the attached PDF always matches the latest visible document preview, including **NON EXCLUSIVE** instead of any old **EXCLUSIVE** version.
- Apply the same safeguard to both current send dialogs so no older cached document URL can be attached.
- Add cache-busting/signed attachment URL handling so Gmail receives the newly generated PDF bytes, not a stale storage file.

### 2. Show the exact attached documents in the email preview
- Add an **Attachments included** area directly under the email preview/footer.
- Show the standard generated PAA PDF first.
- Make it clickable so you can open/read exactly what the client will receive.
- Keep the existing upload option for extra files, and show uploaded files in the same preview list.
- Ensure real sends and test sends include both:
  - the latest standard PAA PDF
  - any manually uploaded extra files

### 3. Harden the signed-document reply detection
- Treat a client reply with a PDF/document attachment as a signed return when the sender matches a pending e-sign recipient.
- Do not rely only on subject text like “signed” or filename wording; the attachment + matching pending signer should be enough.
- Keep the inbox classifier category/status correct for signed contract replies.
- Fix audit logging fields so sync events are recorded properly.
- Add idempotency so the same Gmail message cannot mark/sign the same envelope twice.

### 4. Complete the e-signature lifecycle from inbox reply
- When a matching signed document is received:
  - upload/store the returned signed PDF
  - mark the recipient as **signed**
  - set the signed timestamp from the email received time
  - move the envelope from pending to **completed/signed** when all client signers are complete
  - create/update the signed contract record
  - update the owner document hub so it appears under signed contracts

### 5. Send the automatic thank-you email
- Trigger the branded thank-you email immediately after the signed reply is accepted.
- Make it idempotent so the client does not receive duplicate thank-you messages.
- Add a test mode/override so I can send the exact thank-you email to **infoo.jane@gmail.com** without pretending the live client signed again.

### 6. Show “Signed by {name} on {datetime}” everywhere needed
- Keep the signed-by line in the rendered PAA template.
- Ensure the main document form and signed-contract cards show:
  - signer name
  - received/signed date and time
  - source: email reply when applicable

### 7. Validate end-to-end
- Verify the current envelope `JBJ-PAA-LEASING-0001` is stored as **NON EXCLUSIVE** and that the send attachment matches that latest value.
- Deploy changed backend functions.
- Send a real outbound **test PAA email** to **infoo.jane@gmail.com** with the latest non-exclusive PDF attached.
- Send the **thank-you-for-signing test email** to **infoo.jane@gmail.com**.
- Check function logs and database state for send/sync paths, including pending → signed/completed lifecycle.