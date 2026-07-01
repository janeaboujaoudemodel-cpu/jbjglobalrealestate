## Understood — resetting the direction

The current work still touches Zoho at runtime (edge proxy, live fetching, embedded Zoho URL). That will be removed entirely. The final CRM will be a fully standalone JBJ product that only *looks* like Zoho.

## Phase 0 — Purge every Zoho runtime dependency

Delete / neutralize:
- `supabase/functions/zoho-crm-proxy/` (delete edge function)
- `src/pages/owner/crm/ZohoCRMPage.tsx` (old embed page)
- `src/pages/owner/crm/jbj/JbjCrmModuleList.tsx` — live fetch calls
- `src/pages/owner/crm/jbj/JbjCrmHome.tsx` — live KPI fetch
- Any `zoho_*` env vars / secrets references from client code
- Any "Open in Zoho" links, iframes, or oauth callbacks in owner routes

No network call to any `zoho.com` / `zohoapis.com` / proxy will remain. Grep gate will confirm zero matches for `zoho` in `src/`.

## Phase 1 — Application shell only (this is what you approve before I touch modules)

Build the pixel-clone shell from scratch. No module data, no logic — just the frame.

### 1. Vertical sidebar (left rail)
Exact Zoho CRM section list, order preserved, no additions, no renames:
```text
Home
Feeds
Leads
Contacts
Accounts
Deals
Tasks
Meetings
Calls
Reports
Analytics
Products
Quotes
Sales Orders
Purchase Orders
Invoices
Campaigns
Vendors
Price Books
Cases
Solutions
Forecasts
Documents
Visits
Social
Projects
```
Zoho's collapsed 56px icon rail ↔ 208px expanded rail behavior, same hover reveal, same active pill, same section grouping under the "More" chevron overflow when viewport is short. Icons rebuilt with lucide equivalents tinted in JBJ Emerald (active) / Graphite (idle) / Pearl White ink where on emerald.

### 2. Top header (56px)
Left → right, same spacing and sizing as Zoho:
1. JBJ logo (replaces Zoho logo — only branding swap)
2. Module tabs row (horizontal nav mirroring sidebar's "pinned" tabs)
3. Global search (centered, same width behavior, same shortcut hint)
4. Quick create ( + )
5. Notifications bell
6. Chat / Feeds icon
7. Calendar icon
8. Setup (gear)
9. Workspace / org switcher
10. User avatar menu

Same responsive collapse order Zoho uses (search shrinks first, then icons collapse into overflow).

### 3. Content frame
- White page background (#FFFFFF Pearl White)
- Left rail + top header L-frame, content area scrolls independently
- Card, table, drawer, modal, dropdown, tab, and hover primitives built as JBJ components (`<ZLikeTable/>`, `<ZLikeDrawer/>`, etc.) — visually identical to Zoho, styled with JBJ tokens

### 4. Design tokens (JBJ, replacing Zoho blue/orange only)
```text
--jbj-emerald:      #0F5A45   (primary — Zoho's blue slot)
--jbj-emerald-ink:  #0B4636   (hover/active deep)
--jbj-pearl:        #FFFFFF   (surface)
--jbj-canvas:       #F5F6F8   (app bg — same as Zoho's neutral)
--jbj-graphite:     #2B2F36   (primary text)
--jbj-graphite-2:   #5A6270   (secondary text)
--jbj-hairline:     #E4E7EC   (borders)
--jbj-accent:       #B89555   (gold, hairline only)
```
No generic Tailwind green, no black icons, no black active titles. All existing shell files rewritten to consume these tokens.

### 5. Own backend (scaffolded, no data yet)
Create Lovable Cloud tables + RLS so the CRM owns its data from day one — but no module UI is wired in Phase 1:
- `crm_users`, `crm_roles`, `crm_user_roles` (own auth mapping, no Zoho identity)
- `crm_modules` registry (drives sidebar/header)
- `crm_records` generic + per-entity tables added per module in later phases
- `crm_activity_log`
All GRANTs + RLS included. Future integrations (Meta, PF, Bayut, WhatsApp, OpenAI, etc.) will land as JBJ edge functions writing into these tables — never Zoho.

## Phase 2+ (locked until you approve Phase 1)
Only after you sign off on the shell will I build modules one by one (Leads first), each with its own list view, detail view, create form, filters, and drawer — all backed by JBJ tables.

## Technical notes
- Route: `/owner/crm` (JBJ CRM). `/owner/crm/jbj` and `/owner/crm/zoho` old routes redirect here.
- Files removed: `zoho-crm-proxy`, `ZohoCRMPage.tsx`, current `jbj/JbjCrm*.tsx` (rewritten from scratch under `src/pages/owner/crm/shell/`).
- New shell files: `CrmShell.tsx`, `CrmSidebar.tsx`, `CrmHeader.tsx`, `CrmSearch.tsx`, `CrmQuickCreate.tsx`, `CrmWorkspaceSwitcher.tsx`, `CrmNotifications.tsx`, `crmShell.css`, `crmTokens.css`.
- CI grep: fail build if `src/` contains the string `zoho` (case-insensitive) outside of a single `docs/` note.

## What I need from you
Approve this plan and I will:
1. Purge all Zoho runtime code.
2. Ship the shell (sidebar + header + frame + tokens + empty routed pages for every Zoho section).
3. Stop and wait for your pixel-review before any module work.
