## Diagnosis
- The Relationships page does open, but it is heavy: first usable paint was about 16.5s in preview, with about 7,479 DOM elements and 18,541 event listeners.
- The main slowdown is frontend work, not a 3-minute database query: `crm_brokerages` loads 10,558 rows, and the current hook fetches full `select(*)` pages, then the page sorts/indexes/counts those rows client-side before it becomes comfortable to use.
- The page also mounts extra hidden work shortly after load: the Developer Registry tab is force-mounted during idle, which triggers `crm_developer_registry` and related settings/template queries even when the user only clicked Relationships > Brokerages.
- I also found visible bugs/noise during audit: the pending-tasks modal blocks the page, `meeting_requests` returns 403 on this page, `email_send_log` returns 404, and `app_settings` returns 403. Some are unrelated to the country dropdown but add user-facing friction and console errors.

## Fix plan
1. **Make Relationships open fast**
   - Change `useBrokerages()` to fetch only the columns the Relationships UI actually renders instead of `select(*)`.
   - Keep pagination, but reduce the payload size and parsing cost for the 10,558-row directory.
   - Add a lightweight `updated_at` index so ordered loads do not require a full sort as the table grows.

2. **Stop hidden tabs from slowing initial open**
   - Remove the idle force-mount of the Developer Registry tab.
   - Keep the Developer Registry loading only when the user clicks that tab.
   - Remove `forceMount` on hidden tab content so hidden heavy tables/components do not stay active unnecessarily.

3. **Fix page-blocking and noisy Relationships queries**
   - Prevent the Pending Tasks alert from blocking the Relationships page on open.
   - Fix `BreakfastBookingsSection` so forbidden `meeting_requests` access does not keep retrying or showing broken state.
   - Guard/fallback the missing `email_send_log` call path so a 404 does not appear on page load.

4. **Improve large-list rendering safety**
   - Ensure the Country filter reset also resets visible pagination.
   - Keep cards windowed and avoid accidentally rendering the full 10k list in normal card mode.
   - Leave Excel view functional, but avoid opening it automatically for huge lists.

5. **Validation after implementation**
   - Re-open `/owner/crm/relationships` in the preview.
   - Check performance profile again for improved FCP/load time and reduced resource/DOM pressure.
   - Check network requests for remaining 403/404/500 errors tied to Relationships.
   - Confirm the country dropdown remains in the Filters popover and still shows detailed countries with flags.

## Files expected to change
- `src/hooks/useCRMRelationships.ts`
- `src/pages/CRMRelationships.tsx`
- `src/components/crm/BreakfastBookingsSection.tsx`
- likely the component/hook that triggers Pending Tasks and the `email_send_log` lookup
- one database migration for the ordered brokerage-load index