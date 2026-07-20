## Plan: Merge owner backend into the CRM-style JBJ Hub

### Goal
Make the owner experience a single **JBJ Hub** shell, not a separate champagne/gold owner backend. Broker-facing CRM can remain **JBJ CRM**, but owner-facing navigation/header should read **JBJ Hub** and keep the emerald/white CRM layout.

### What I confirmed
- The current CRM shell is mounted at `/owner/crm/jbj` and uses `CrmShell`, `CrmSidebar`, and emerald/white `crmShell.css`.
- Owner Backend sidebar items currently link to `/owner`, `/owner/data-hub`, `/owner/developers`, etc., which exits the CRM shell and opens the older champagne owner backend layout.
- The older owner backend sidebar has many routes that are missing from the CRM Owner Backend list: Owner Panel, Overview, JBJ Hub, Document Studio, Projects, Calendar, Access Requests, Developer Profiles, Missing Logos, Properties, Property Map, Listings Admin, Inbox, Team Chat, Founder Assistant, Recommendations, AI Home Finder Leads, Royal Tools, Workflow Automation, Meeting Hub, AI Meeting Summarizer, Locations, Data Gaps, AI Enrichment Review, Brand Assets, Studio, Founder/Podcast Control, Podcast Studio, Voice Agent, Kanban, Careers, Admin pages, and System pages.

### Implementation
1. **Rename owner shell identity**
   - In `CrmSidebar`, change owner-facing brand text from “CRM” to **“Hub”** when the signed-in user is owner.
   - Update owner-only section labels from “Owner Backend” to **“JBJ Hub”** or equivalent owner hub wording.
   - Keep broker/non-owner labels as JBJ CRM where applicable.

2. **Stop owner backend links from leaving the CRM shell**
   - Replace `CRM_OWNER_BACKEND` absolute `/owner/...` links with CRM-shell routes like:
     - `/owner/crm/jbj/owner-data-hub`
     - `/owner/crm/jbj/owner-developers`
     - `/owner/crm/jbj/owner-settings`
   - Keep “Return to Site”, “Sign Out”, and “Collapse” as footer actions inside the same scrollable CRM sidebar style.

3. **Add every missing owner backend item into the CRM sidebar**
   - Mirror the existing owner backend sections from `OwnerSidebarNav` into CRM shell groups:
     - Core
     - Developers
     - Properties
     - Communication
     - AI & Tools
     - Creative
     - People & HR
     - Admin
     - System
   - Preserve scrollable vertical behavior.
   - Do not copy the old champagne/gold visual styling.

4. **Render owner pages inside the CRM shell**
   - Add nested CRM-shell routes for owner hub pages under `/owner/crm/jbj/...`.
   - Reuse the existing page components, but wrap them in a CRM-compatible owner page adapter so they display inside `jc-content` without mounting `OwnerDashboardShell`.
   - This avoids the previous backend sidebar/header and keeps the emerald/white CRM frame.

5. **Normalize owner page visuals inside JBJ Hub**
   - Add a scoped CRM-owner style layer so imported owner pages use white/emerald cards, tabs, borders, buttons, and readable black-on-white text.
   - Remove champagne/gold surface dominance only within the JBJ Hub shell.
   - Keep emerald active states, white text on emerald, and no blue interactive states.

6. **Footer controls in CRM sidebar**
   - Add the last sidebar actions exactly as requested:
     - Return to Site
     - Sign Out
     - Collapse
   - Keep them part of the scrollable vertical sidebar area, not fixed to the viewport bottom like the previous backend.

7. **Route fallbacks to prevent empty/404 views**
   - For owner hub slugs without an exact component yet, route to the closest existing owner page or a meaningful CRM-shell page instead of leaving an empty module page.
   - Add safe fallback redirect from unknown owner-hub slugs to `/owner/crm/jbj/owner-overview`.

8. **Visual E2E validation**
   - Use Playwright screenshots to verify:
     - `/owner/crm/jbj` shows owner-facing **JBJ Hub** branding.
     - Clicking Data Hub stays under `/owner/crm/jbj/...` and keeps the emerald/white CRM shell.
     - Clicking Developers Portal stays under the CRM shell.
     - Clicking Settings stays under the CRM shell.
     - Sidebar remains scrollable and includes Return to Site, Sign Out, Collapse.
     - No champagne/gold backend shell appears during these flows.

### Technical notes
- Main files to update:
  - `src/pages/owner/crm/shell/modules.ts`
  - `src/pages/owner/crm/shell/CrmSidebar.tsx`
  - `src/pages/owner/crm/shell/CrmHeader.tsx`
  - `src/pages/owner/crm/shell/CrmShell.tsx`
  - `src/routes/OwnerRoutes.tsx`
  - `src/pages/owner/crm/shell/crmShell.css`
- Existing old backend shell `OwnerDashboardShell` should remain for legacy direct `/owner/...` routes, but owner navigation from the new JBJ Hub should no longer send users there.

### Acceptance criteria
- Owner sees **JBJ Hub**, not JBJ CRM, in the owner CRM shell.
- Owner Backend is not a duplicate list of outbound links; it becomes real in-shell JBJ Hub navigation.
- Every old owner backend sidebar item is represented in the new CRM-style sidebar.
- Owner hub pages open inside the emerald/white CRM layout.
- No empty owner pages, no unexpected redirects to the champagne backend, and no 404s in tested owner hub flows.
- Final response includes screenshot proof from Playwright validation.