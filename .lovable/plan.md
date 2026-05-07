## Plan

1. **Correct the locked default test recipient**
   - Change the Send Test Email locked profile default from `info.jane@gmail.com` to `infoo.jane@gmail.com` everywhere in the test dialog UI.
   - Update the placeholder/visible locked chip so it always shows the double-o email.

2. **Protect against old wrong saved values**
   - Add a small normalization guard in the test profile hydration: if an existing saved profile contains the wrong `info.jane@gmail.com`, automatically replace it with `infoo.jane@gmail.com`.
   - Persist the corrected profile so the wrong value does not reappear after refresh.

3. **Update the existing implementation note**
   - Correct the internal plan text that still says `info.jane@gmail.com`, so future changes do not copy the wrong email again.

4. **Verify**
   - Search the CRM/test-email code paths again to confirm the wrong single-o address is gone from the implementation.
   - Confirm the dialog default now resolves to `infoo.jane@gmail.com`.