## Immediate CRM Repair Plan

### 1. Restore owner backend access
- Keep your verified owner role as the source of truth, not the visitor/broker mode picker.
- Add an owner-aware redirect on `/broker/*`: if the signed-in user is owner/admin and is not explicitly previewing broker mode, route them back to `/owner` or `/owner/crm`.
- Add a dedicated **Broker Portal Preview** entry/button inside the owner backend so you can intentionally view the broker portal without losing owner access.
- Fix the owner return link from `/owner/dashboard` to the real owner route `/owner` / `/owner/crm`.

### 2. Fix broker portal routing and click actions
- Replace the current “Add Lead” and “Import Database” sidebar links with actions that open working dialogs on the broker pages.
- Update `/broker/leads?action=new` to automatically open a lead creation dialog.
- Update `/broker/databases?action=import` to automatically open the database upload/import dialog.
- Update broker dashboard “Add lead” so it opens the same working flow, not a passive list page.

### 3. Repair the broker leads query bug
- The broker leads page is currently requesting a non-existent `crm_leads.status` column, causing a 400 error.
- Change broker lead queries and displays to use existing fields like `pipeline_stage`, `lead_source_type`, and `source`.
- Ensure broker CRM, broker dashboard, and broker leads page no longer crash or show broken empty states because of that invalid column.

### 4. Allow brokers to create leads and import databases while keeping owner visibility
- Adjust the broker lead creation flow so broker-created leads are saved under the broker’s account and marked with `created_by_user_id` / broker ownership metadata.
- Add a safe backend policy/RLS repair so authenticated brokers can insert their own leads without needing internal CRM employee status.
- Adjust database upload so broker-imported databases are saved with:
  - `uploaded_by = broker user`
  - `broker_owner_user_id = broker user`
  - owner-visible metadata so the owner can still see the upload copy in the main backend.
- Add/repair policies for broker-owned database rows so brokers can insert/read the databases they upload.

### 5. Owner can inspect each broker’s activity/uploads
- Add owner CRM visibility for broker-created leads and broker-uploaded databases.
- Surface broker-origin metadata in owner CRM/database areas so when you open a broker account/profile, you can see:
  - leads they added manually
  - databases they imported
  - leads generated from their imported databases
- Preserve the broker’s own workspace view separately from your full owner backend.

### 6. Verify end-to-end
- Confirm your owner account has `owner`/`admin` role and routes to the owner backend by default.
- Confirm `/broker/leads?action=new` opens Add Lead and saves without the invalid `status` error.
- Confirm `/broker/databases?action=import` opens Import Database and saves rows.
- Confirm broker-created/imported data appears in the broker portal and remains visible in the owner CRM/backend.

## Technical files likely to change
- `src/routes/BrokerPortalRoutes.tsx`
- `src/components/broker-portal/BrokerPortalLayout.tsx`
- `src/components/broker-portal/BrokerPortalSidebar.tsx`
- `src/pages/broker/BrokerLeadsPage.tsx`
- `src/pages/broker/BrokerDatabasesList.tsx`
- `src/pages/broker/BrokerCRM.tsx`
- `src/pages/broker/BrokerDashboardLanding.tsx`
- `src/hooks/useBrokerScopedLeads.ts`
- `src/components/crm/CRMLeadModal.tsx`
- `src/components/crm/UploadDatabaseDialog.tsx`
- `src/components/owner-dashboard/OwnerSidebarNav.tsx`
- One database migration for RLS/policy repair only, no destructive data changes.