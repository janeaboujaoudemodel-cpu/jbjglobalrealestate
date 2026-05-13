## Plan: make Webmail connection and inbox usable

### 1) Fix the misleading connection status
- Change channel state logic so a channel is only shown as **Connected** when it is active and its last sync is not failed.
- If the mailbox row exists but sync failed, show it as **Needs reconnect / Sync failed** in red, not green.
- Separate **connection status** from **reply tone status** so “Default active profile” is not confused with mailbox connectivity.
- After Hostinger/Webmail reconnect succeeds, invalidate and refetch all channel queries immediately so the tile flips state without a manual refresh.

### 2) Replace confusing actions with clear mailbox actions
- For a connected mailbox, replace the persistent **Reconnect** emphasis with:
  - **Open inbox** as the primary action.
  - **Sync now** / **Resync inbox** as a secondary action.
  - **Connection settings** for reconnect/edit credentials.
- Make the per-account row clickable/actionable by adding explicit buttons for **Open inbox**, **Sync**, and **Settings**; the tone-profile dropdown remains only for AI reply tone.
- Add clear red error copy when sync fails, with a reconnect/settings path.

### 3) Route directly into the right inbox section
- Add query-param support to `/owner/inbox` so links can open a specific provider/account, e.g. Hostinger/Webmail or Gmail.
- From the Hostinger tile, **Open inbox** will navigate to the unified inbox filtered to that Hostinger channel.
- Expand the inbox channel tabs so connected Hostinger/Webmail accounts appear individually, just like multiple Gmail accounts.

### 4) Put all email sources in the Email section
- Update the CRM Email Center / inbox section so it clearly points to the unified inbox for **Hostinger/Webmail, Gmail, Outlook, and cloud email** rather than only the old Gmail/JBJ classifier.
- Preserve the existing category chips and AI triage UI, but make the primary email access path the unified provider-based inbox.

### 5) Fix Webmail sync reliability
- Patch the Hostinger IMAP sync function to authenticate with a method Hostinger accepts instead of failing with the current `AUTH=[object Object]` capability error.
- When sync succeeds, clear `last_error`; when it fails, store the failure and surface it in red on the tile.
- Deploy the updated communication functions after editing.

### 6) Verify the result
- Check backend channel rows confirm Hostinger is active and no stale error remains after sync.
- Test the Hostinger connect/sync/open-inbox path from `/owner/settings/communication`.
- Confirm `/owner/inbox` opens with the Hostinger tab/account selected and messages/categories render when available.