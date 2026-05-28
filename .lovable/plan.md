I will fix this in one focused pass without touching the Broker Academy book styling unless needed for layout conflicts.

## Plan

1. **Restore owner dashboard access**
   - Fix owner routing so clicking Dashboard / My Dashboard cannot trap an owner inside `/broker/portal`.
   - Make `/dashboard` and owner shortcuts reliably send verified owners to `/owner` or `/owner/crm`.
   - Clear the broker-preview session flag whenever the owner returns to the owner backend.

2. **Rebuild the broker portal shell to match the owner backend layout**
   - Change `BrokerPortalLayout` + `BrokerPortalSidebar` to the same structural model as the owner backend: fixed left sidebar, full-height column, aligned top header divider, connected vertical border, collapse behavior, and no empty gap below the sidebar.
   - Add a broker top bar similar to the owner shell so the portal feels intentional, not like a broken public-page insert.
   - Keep the owner-only “Back to Owner Backend” action visible and reliable inside broker preview.

3. **Improve performance / perceived slowness**
   - Remove extra public-page chrome and delayed global widgets from broker portal routes where they are not needed.
   - Keep broker portal pages inside a lightweight dedicated shell and reduce layout nesting that causes slow painting.
   - Keep data queries scoped and avoid unnecessary duplicate loading where the dashboard and CRM currently query the same broker data.

4. **Upgrade broker CRM workspace**
   - Move broker CRM-related actions into `/broker/crm`: assigned databases, leads, add/log lead action, upload/add database request affordance, calls made, tasks/follow-ups, insights, pipeline summary, and activity.
   - Make the page premium and dense like a real broker workspace, not a simple three-tab placeholder.
   - Keep database access scoped to what the owner grants; broker-facing “add/upload database” will be presented as broker workspace actions/request entry points, not owner-level unrestricted admin access.

5. **Fix Request a Form flow**
   - Replace any “Open Forms Hub” style behavior for brokers with a broker-allowed form selector.
   - Brokers choose from allowed forms, attach an optional lead, write notes, and submit a request.
   - The existing owner notification/review path stays connected through `broker_form_requests`; I will also verify the owner page for these requests is reachable from the owner backend.

6. **Validation**
   - Validate routing: owner dashboard returns to owner backend; broker preview remains opt-in only.
   - Validate visuals at the current desktop viewport: sidebar height/border alignment, no bottom gap, CRM premium layout, forms selector.
   - Check TypeScript/static errors for the touched files through the available harness signal.