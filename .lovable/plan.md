
# JBJ CRM — Full Workspace Rebuild

Rename and rebuild the current `/owner/crm/zoho` page into a full **JBJ CRM** workspace that visually and functionally mirrors Zoho CRM, powered by (a) our own database as the source of truth and (b) the Zoho connector as a live sync layer so data survives disconnect.

## Scope of this phase (Phase 1)

Ship the **shell + all module screens + Zoho mirror-to-DB sync** so the layout, navigation, and every module page exist end-to-end. Deep automation (portal push, social ads, lead-distribution engine) lands in Phase 2 as separate work items — the UI slots for each are created now so nothing needs re-plumbing later.

## New route structure

```
/owner/crm/jbj                        Home (dashboard tiles)
/owner/crm/jbj/reports
/owner/crm/jbj/analytics
/owner/crm/jbj/my-requests
/owner/crm/jbj/agents
/owner/crm/jbj/team-space
/owner/crm/jbj/work-queue
/owner/crm/jbj/leads
/owner/crm/jbj/contacts
/owner/crm/jbj/accounts
/owner/crm/jbj/deals
/owner/crm/jbj/forecast
/owner/crm/jbj/documents
/owner/crm/jbj/campaigns
/owner/crm/jbj/tasks
/owner/crm/jbj/meetings
/owner/crm/jbj/calls
/owner/crm/jbj/inventory      (products, quotes, invoices, orders)
/owner/crm/jbj/support        (cases, solutions)
/owner/crm/jbj/services
/owner/crm/jbj/projects
/owner/crm/jbj/integrations   (Zoho, portals, socials, API keys)
/owner/crm/jbj/settings/roles
```

Old `/owner/crm/zoho` becomes a 301 redirect to `/owner/crm/jbj`.

## Layout — dedicated JBJ CRM shell

New `JbjCrmShell.tsx` renders **only** when inside `/owner/crm/jbj/*`, replacing the standard owner sidebar with a Zoho-style left rail:

```text
+------+---------------------------------------+
| Rail |  Top bar: module title · search · +   |
|      +---------------------------------------+
|      |  Module content (list / kanban / …)   |
|      |                                       |
+------+---------------------------------------+
```

- 224 px collapsible rail (72 px icon-only).
- Champagne surface `#F7F2EA`, emerald metallic active pill, gold hairline dividers — brand palette, no Zoho blue.
- Rail footer: **two 3D emerald pills** stacked
  - "Owner Panel" → `/owner/admin`
  - "Return to Site" → `/`
- Rail header: JBJ monogram + label "JBJ CRM" + edition chip "Enterprise".

## Module screens (Phase 1 render contract)

Every module ships with the standard Zoho four-view header — **List · Kanban · Table · Chart** — plus create/edit drawer, filter panel, and inline row actions. Backed by our own tables so data persists after Zoho disconnect.

| Group          | Modules                                                                 |
|----------------|-------------------------------------------------------------------------|
| Home           | Dashboard tiles (open deals, tasks due, meetings today, pipeline)       |
| Sales          | Leads, Contacts, Accounts, Deals, Forecast                              |
| Marketing      | Campaigns                                                               |
| Activities     | Tasks, Meetings, Calls                                                  |
| Inventory      | Products, Price Books, Quotes, Sales Orders, Invoices                   |
| Support        | Cases, Solutions                                                        |
| Collaboration  | Documents, Team Space, Work Queue, My Requests                          |
| Delivery       | Projects, Services                                                      |
| Intelligence   | Reports, Analytics, Agents (AI assistants)                              |
| Config         | Integrations, Roles & Permissions                                       |

## Zoho mirror (source-of-truth strategy)

- New tables `jbj_crm_<module>` mirror the 9 Zoho modules already reachable via connector, plus internal-only modules (Team Space, Work Queue, Projects, etc.).
- Extend `zoho-crm-proxy` into `jbj-crm-sync` edge function that pulls Zoho modules into the mirror tables on demand and on a scheduled cron; every list screen reads from the mirror, so **data stays visible after disconnect**.
- Two-way write comes in Phase 2; Phase 1 is read-through-mirror + local create/edit on JBJ-only modules.

## Integrations hub (stubs wired, deep work in Phase 2)

The `/integrations` screen ships with cards for each target so users see the roadmap and can paste keys today:

- Zoho CRM (already live) — status, last sync, disconnect
- Developer Upload API — generates per-developer API key, docs snippet showing how a developer's site posts new projects into JBJ (auto-syncs to platform listings)
- Portals: Property Monitor, Bayut, DXB Interact, DLD, Property Finder, Property Guru, Dubizzle — each with an on/off toggle per listing
- Social: Facebook, Instagram, TikTok, LinkedIn — connect + campaign push toggle

Toggles persist to a `jbj_crm_integration_settings` table; actual push jobs are Phase 2.

## Roles & lead distribution (skeleton)

- `jbj_crm_roles` table (Owner, Sales Manager, Agent, Marketing, Support) with per-module CRUD flags.
- `jbj_crm_lead_assignments` with round-robin or manual assignment; screen shows who owns each lead and last-touch age so "who's not following up" is visible.
- Distribution engine (rules-based auto-assign) queued for Phase 2.

## Technical notes

- Files:
  - `src/pages/owner/crm/jbj/JbjCrmShell.tsx` — layout + rail
  - `src/pages/owner/crm/jbj/index.tsx` — dashboard
  - `src/pages/owner/crm/jbj/modules/<Module>Page.tsx` — one per module
  - `src/components/crm/jbj/RecordTable.tsx`, `RecordKanban.tsx`, `RecordDrawer.tsx`, `FilterPanel.tsx` — shared primitives
  - `src/routes/OwnerRoutes.tsx` — nest `/owner/crm/jbj/*` under a `<JbjCrmShell>` outlet, add redirect from `/owner/crm/zoho`
- Sidebar entry in `OwnerSidebarNav.tsx` renamed **Zoho CRM → JBJ CRM**, routes to `/owner/crm/jbj`.
- Edge functions: rename `zoho-crm-proxy` role to `jbj-crm-sync` (keep proxy for live pass-through), add cron trigger for scheduled mirror.
- DB migration adds `jbj_crm_*` tables with RLS restricted to owner + assigned CRM roles, plus GRANTs per project standard.
- Existing `/owner/crm` (internal JBJ leads CRM) is untouched — this is an additive workspace.

## Out of scope for Phase 1 (explicit, so nothing is silently dropped)

- Two-way Zoho write-back (create in JBJ → push to Zoho)
- Live portal publishing to Bayut/PF/etc. (only toggles + storage now)
- Social campaign execution
- Automated lead-distribution rules engine
- AI Agents runtime (module screen ships, agents themselves are stubs)

Each is a follow-up phase; the UI already has its slot so no rework needed.

## Validation

- Visual: Playwright screenshots at 1440/1024/390 across every module route, compared for brand palette compliance (no blue, no raw gray, emerald active pill, champagne surface).
- Functional: click every rail item, confirm route loads with the four-view header and at least the list view rendering mirror data.
- Regression: existing `/owner/crm` and `/owner/admin` unaffected.
