## Plan to fix Hostinger Webmail properly

### What is actually broken
- The database currently shows Hostinger as active and synced, but the UI can stay stale because the connect dialog only refreshes some query keys and misses `comm-channel-states`.
- The sync failure is real: recent audit logs show `Server does not support required capability: AUTH=[object Object]` from `comm-inbound-sync`. The connect function uses raw IMAP `LOGIN` successfully, but the sync function uses the IMAP library authentication path, which fails against Hostinger.
- The inbox shows “Connect channels” because there are currently no imported Hostinger threads, not because the channel row is missing.
- The “Auto-reply enabled/active” wording is confusing; the field is being used as a per-account reply automation/tone toggle, but the UI does not show the actual reply/draft content there.
- Some tile content can overflow because account rows, buttons, audit labels, and selects do not consistently wrap/truncate inside fixed-width cards.

### Implementation
1. **Fix Hostinger IMAP sync**
   - Replace the Hostinger branch in `comm-inbound-sync` with a raw TLS IMAP flow matching the working `comm-hostinger-connect` login method.
   - Use `UID SEARCH` / `FETCH` safely so Hostinger inbox messages can actually be imported.
   - Keep failures precise in `last_error`, but clear `last_error` and mark `sync_status='synced'` after a successful sync, even when there are zero new emails.

2. **Make the UI update immediately after connect/reconnect**
   - After `HostingerCredentialDialog` succeeds, invalidate all communication and inbox query keys, including `comm-channel-states`, `owner-channels`, `owner-comm-channels`, audit summary/events, and inbox threads.
   - Ensure the status pill uses only the actual current channel row state and does not remain on old “sync failed” after a successful reconnect.

3. **Clean up the channel card behavior**
   - For connected channels, show `Connected` and keep errors only when the current row is actually failed.
   - Change “Reply tone per account / Auto-reply active” wording to a clearer automation label so it does not imply a hidden visible reply message.
   - Remove the misleading “Reconnect” emphasis when the channel is healthy; keep `Sync now`, `Open inbox`, and a softer `Update credentials` action.

4. **Fix overflow in cards**
   - Add wrapping/truncation constraints for identifiers, status pills, account rows, audit values, selects, and action buttons.
   - Preserve the existing champagne/gold visual system and do not remove any functionality.

5. **Verify**
   - Deploy the updated `comm-inbound-sync` backend function.
   - Test the function against the current logged-in Hostinger channel.
   - Re-check the channel row and audit log to confirm `sync_status='synced'`, `last_error=null`, and no stale failed label remains.
   - Confirm inbox either shows imported threads or a more accurate empty state for a connected-but-empty mailbox.