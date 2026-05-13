## Plan

1. **Make channel status deterministic**
   - Update the channel state logic so a channel shows **Connected** only when the active row has `sync_status = synced` and no current `last_error`.
   - Treat stale or mixed states consistently: if the current Hostinger row is healthy, it must never show “Sync failed — reconnect”; if it failed, it must never render as green connected.
   - Clear/refresh query state after connect, reconnect, and sync so the UI does not display old cached status.

2. **Fix the Hostinger tile layout**
   - Constrain the action row so `Open inbox`, `Sync now`, `Add another`, and `Reconnect` cannot collide, overflow, or sit inside the wrong visual boxes.
   - Make the account row responsive: mailbox name, `Open inbox`, and the auto-reply switch wrap cleanly on narrow widths without breaking the card.
   - Keep the existing champagne/gold styling and do not remove any controls.

3. **Make audit/status labels match real meaning**
   - Show “Auto-reply paused” only as the current toggle state, not as a scary/inconsistent provider status.
   - Keep sync activity lines separate from provider health so old failed audit entries do not override a later successful sync.

4. **Validate the fix**
   - Verify the current backend Hostinger row is healthy and that the rendered tile should show Connected.
   - Check the communication settings page at the current viewport width for no overlapping, no vertical stacking inside buttons, and consistent red/green status.

## Technical details

- Main files: `src/hooks/useCommChannels.ts` and `src/components/owner-comm/ChannelTile.tsx`.
- No database schema change is needed: the current Hostinger row already has `sync_status = synced`, `last_error = null`, and a recent `last_sync_at`.
- If edge-function behavior is touched later, I will deploy the changed function immediately; the current plan should be frontend/status logic only.