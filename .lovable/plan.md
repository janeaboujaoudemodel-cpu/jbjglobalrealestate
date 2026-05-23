## Immediate repair plan: Developers Portal + developer data consistency

### Confirmed issues from audit
- The new `DevelopersPortalRoutes` file exists but is not mounted in `App.tsx`, so `/developers-portal` is not actually reachable.
- Old `/developer-hub-admin` routes still render the old admin shell instead of redirecting into the standalone portal.
- Approval actions call two missing backend functions: `portal-approve-rep-application` and `portal-decide-access-request`.
- The portal uses `developer_sales_reps`, but the current database has `0` sales reps there, so rep pages and approvals appear empty.
- The public developer page already has projects and map, but the requested broker rep-access CTA is not mounted there yet.
- Developer information is split between `developers`, `crm_developer_registry`, and old `uae_developers`/rep tables. The public website uses `developers`, while some new portal tables incorrectly reference `uae_developers`.
- Developer logos are present in many places, but not consistently rendered next to every developer name.
- The enrichment queue has real staged entries, but the Before/Proposed UI hides empty proposed fields and can make rows look broken or empty instead of showing a clear “No proposed change / keep current” state.

## What I will fix

### 1. Make the standalone portal real and replace both old hubs
- Mount `DevelopersPortalRoutes()` in `App.tsx` outside the main site shell so it has its own dedicated environment.
- Replace `/developer-hub` and `/developer-hub-admin` entry points with redirects to the new portal structure.
- Update old internal links in developer directory/enrichment/profile pages so they point to `/developers-portal/...` instead of `/developer-hub-admin/...`.
- Keep public `/developers` and `/developer/:slug` intact for clients.

### 2. Wire approval queues end-to-end
- Add backend functions:
  - `portal-approve-rep-application`
  - `portal-decide-access-request`
- These will validate the signed-in owner/admin server-side, update request/application statuses, create/link rep records when approving, and audit decisions.
- Improve queue screens so they show:
  - pending rep applications
  - broker rep-access requests
  - clear empty states only when data is truly empty
  - visible developer identity with logo where possible

### 3. Correct the canonical developer data flow
- Treat `developers` as the canonical public/project developer table for portal profile data, project pages, project cards, maps, CRM registry display, and developer directory.
- Add a safe migration to align the new portal access/application tables with canonical `developers` where needed, without exposing private contact fields publicly.
- Keep admin override access: owner can always edit developer profile, media, reps, projects, status, and logos.

### 4. Show developer logo next to developer name everywhere practical
- Reuse the existing locked `DeveloperLogo` component.
- Update key surfaces:
  - public `/developer/:slug` header/section name treatment
  - project cards where developer name appears under payment plan
  - developer map popup/header where possible
  - CRM Relationship Hub developer registry cards/rows
  - portal directory/profile/queue rows
  - admin/backend developer rows
- If no valid logo exists, internal/admin surfaces show the approved Building2 fallback; public listing surfaces use the safe nameplate fallback where appropriate.

### 5. Enrich developer section on public developer pages
- Add a dedicated developer identity block using the same canonical data: logo, description, headquarters, founded year, website/public-safe links, project count, and “View all projects” CTA.
- The CTA will open `/properties?developer=<slug>` and work with the existing property filter logic.
- Keep the existing projects grid and developer projects map, but ensure the developer identity data is consistent with the portal/admin source.

### 6. Fix rough/empty enrichment cards
- Rework `DeveloperEnrichmentQueue` diff cards so every tracked field renders a stable row:
  - Current value
  - Proposed value
  - status: New / Updated / Confirmed / No proposed change
- Empty proposed fields will not look broken; they will clearly say “No proposed change” and show what will be kept.
- Add logo/name in the card header and stronger visual hierarchy for before/proposed comparisons.

### 7. Verify with real data and route checks
- Use database reads to confirm counts after wiring.
- Check routes and UI states for:
  - `/developers-portal`
  - `/developers-portal/directory`
  - `/developers-portal/access-requests`
  - `/developers-portal/enrichment`
  - `/developer/:slug`
  - relationship hub developer registry
- Check that staged enrichment rows currently in the database are visible and actionable.
- Check that missing approvals are not a UI wiring issue versus truly no records.

## Technical notes
- I will not edit generated backend client/type files.
- Any schema/RLS changes will be done through a migration.
- Private rep contact details stay gated: brokers request access; investors do not see rep details or booking.