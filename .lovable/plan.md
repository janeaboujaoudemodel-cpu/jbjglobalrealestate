## Plan

1. **Make the email message editor normal, not code-like**
   - Detect saved email bodies that contain escaped HTML like `&lt;br/&gt;` and convert them back into normal rich-text line breaks.
   - Keep the preview rendering as a normal email message, not visible HTML code.
   - Set the default client message to clearly say the PDF is attached and is for electronic signature.

2. **Fix the missing PDF attachment in test/client emails**
   - Pass the actual generated PDF URL from the envelope into the send dialog.
   - Keep the branded download button in the email.
   - Ensure the backend attaches the real PDF file to both **Send test** and **Send to client** emails.
   - Add a clear fallback/error signal so if the PDF cannot be fetched, it does not silently send without the document.

3. **Default to JBJ Executive Office signature**
   - Change the send dialog signature selection so e-signature client emails default to **JBJ Executive Office**, not Founder/CEO.
   - Keep Founder/CEO signature untouched.

4. **Clean system signature labels/content**
   - Remove `Office of the Founder` from the **JBJ Executive Office** signature.
   - Normalize non-founder system signatures so their visible name/title starts directly as `JBJ Front Desk`, `JBJ HR Team`, etc., without duplicated or awkward labels.
   - Do this through the signature rendering/data path without changing the Founder/CEO signature.

5. **Deploy and verify**
   - Redeploy the changed e-signature email functions.
   - Verify the last failure cause: the test request sent only `attachment_name` and no `attachment_url`, so the backend had no PDF URL to fetch.
   - Send/check a test path after changes to confirm the request includes the PDF URL and the function reports the attachment was included.