# Owner Backend cleanup inside JBJ Hub

Scope is **only** pages routed under `/owner/crm/jbj/owner-*` (the ones we imported from the legacy JBJ backend). The Zoho-mirrored CRM pages (`home`, `feeds`, `calls`, `deals`, `salesinbox` Zoho core, etc.) are **not touched**.

## 1. Kill the gold/champagne skin on owner-backend pages

Currently `crmShell.css` overrides champagne backgrounds only on a few utility classes and many owner pages still ship hardcoded `#FDFBF7 / #F7F2EA / #EFE6D6 / #B89555` gradients (e.g. `OwnerCreativeSuite`, featured-projects hero card, sales-inbox folder chips).

- In `crmShell.css`, extend the `.jc-app [data-hub-page]` scope so every emerald owner page force-resets:
  - Champagne page/hero gradients → white canvas `#FFFFFF`
  - Gold hairlines (`border-[#B89555]/…`, `#EFE6D6`) → emerald hairline `rgba(6,78,59,0.12)`
  - Gold text (`text-[#8A7356]`, `text-[#B89555]`) → ink `#1A1A1A` or emerald `#064E3B`
  - Gold icon tiles/badges → emerald `#064E3B` tile with white icon
- Add a `<div data-hub-page>` wrapper via a lightweight `OwnerHubPage` layout so we only affect owner backend routes, never Zoho-mirrored ones.
- Keep the JBJ metallic-gold CTA primitive (`.jj-cta-gold-metallic`) **untouched** on public marketing pages — the override is gated behind `.jc-app [data-hub-page]` only.

## 2. Fix the sidebar Handshake / Owner Backend vertical bug

In the screenshot, the "Owner Backend" folder header and Handshake icon stack vertically because the folder label wraps under the collapsed rail width and long labels break.

- `crmShell.css` `.jc-folder__label`: enforce `flex-direction: row`, `min-width: 0`, `flex-wrap: nowrap`, ellipsis on `span`, and fixed `24px` icon slot.
- `.jc-owner-hub .jc-teamspace__title`: same row lock + `white-space: nowrap`.
- Verify Handshake, Sparkles, Palette, ShieldAlert renders inline with their labels at both expanded and collapsed sidebar states.

## 3. Rebuild the imported owner pages page-by-page

For every page under `CRM_OWNER_HUB_SECTIONS`, apply the same Zoho-matched chrome:

- **Page header card**: flat white surface, thin emerald hairline `1px solid rgba(6,78,59,0.10)`, `border-radius: 8px` (NOT full-rounded), 24px inner padding, emerald eyebrow label + ink title + ink subtitle. Removes the current "rounded pill" hero seen on Featured Projects.
- **Section cards** (`.jc-owner-card`): white bg, `8px` radius, emerald hairline, `24px` padding, `12px` gap between sections. No touching the viewport edge — add `24px` container padding.
- **Device tabs (Mobile / Tablet / Desktop) on Featured Projects**: pill group with a single container radius, tabs stay inside container, active = emerald fill with white text (matches Zoho segmented control).
- **Insights strip** at the top of every rebuilt owner page: 3-tile row (KPIs relevant to the page — e.g. Featured Projects → "Live slots · Auto refreshes · Manual entries"; SalesInbox → "Unread · Waiting · Snoozed"; Data Hub → "Unassigned · Assigned today · Stale >72h"). Tiles use emerald label + big ink number + tiny delta.
- **CTA row alignment**: primary action = emerald fill white text; secondary = white with emerald hairline; never gold on backend.

Pages to rebuild in this pass (all `owner-*` slugs from `CRM_OWNER_HUB_SECTIONS`):
Core (Owner Panel, Overview, JBJ Hub, Document Studio, CRM Database, JBJ CRM, Data Hub), Developers (Broker Portal, Developers Portal, Projects, Calendar, Access Requests, Profiles, Missing Logos, Drive Extractions), Properties (Properties, Featured Projects, Property Map, Listings Admin), Communication (Messages/Inbox, Team Chat, Relationships Hub), AI & Tools (all 11 entries), Creative (Brand Assets, Studio, Founder & Podcast, Podcast Studio, Voice Agent, Kanban, Marketing Hub, News, Books), People & HR (Careers Portal), Admin (Analytics, Users, CRM Directory, Research Users, Preview Broker Portal), System (External Access, Audit, Integrations, Safety, Settings, Security Console, Executive Assistant).

Each page keeps its existing business logic — this is a **chrome/layout rebuild only**, wrapping the existing component in `<OwnerHubPage title subtitle insights={[...]}>` and neutralizing hardcoded champagne classes.

## 4. Validation gate

For every rebuilt page:
1. Playwright shot at 1280×1800 desktop viewport of `/owner/crm/jbj/{slug}`.
2. Assert: no `#B89555`, `#FDFBF7`, `#F7F2EA`, `#EFE6D6`, `text-[#8A7356]`, `bg-champagne` in the rendered DOM computed styles.
3. Assert: page header has emerald hairline + `8px` radius, not the current pill.
4. Assert: sidebar Handshake row renders on a single line at both expanded and collapsed states.
5. Attach screenshots inline for the top 6 pages (Featured Projects, Data Hub, Developers Portal, Broker Portal, Properties, Overview).

## What we will NOT touch

- Zoho-mirrored CRM pages: `home`, `feeds`, `workqueue`, `leads`, `contacts`, `accounts`, `deals`, `forecasts`, `campaigns`, `tasks`, `meetings`, `calls`, `documents` (CRM one), plus the mirrored SalesInbox core layout that ships with Zoho parity. If SalesInbox is required as an owner-only rebuild instead of Zoho-mirrored, confirm before touching.
- Any public marketing page or `.jj-cta-gold-metallic` gold primitive outside `[data-hub-page]`.
- Any business logic / data queries on the owner pages.

## Technical notes

- New file: `src/pages/owner/crm/shell/OwnerHubPage.tsx` — layout wrapper providing `data-hub-page`, header card, insights strip, content slot.
- Edit: `src/pages/owner/crm/shell/crmShell.css` — new `.jc-app [data-hub-page]` reset block, `.jc-owner-card`, `.jc-owner-header`, `.jc-owner-insights`, plus `.jc-folder__label` / `.jc-owner-hub__title` row locks.
- Edit each `owner-*` page component to wrap its root in `<OwnerHubPage …>` and drop the local champagne gradient container. Zoho-mirrored components are opened only to confirm they are **not** wrapped.
- No DB / edge function / RLS changes.
