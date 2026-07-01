# JBJ CRM Enterprise — Full Zoho-Parity Rebuild

## Goals (from your feedback)

1. **One sidebar only.** When inside `/owner/crm/jbj/*`, the JBJ CRM rail **replaces** the Owner backend sidebar — no double rail, no compressed content.
2. **Zoho layout parity.** Match Zoho CRM's UX exactly (top bar, left rail, module tabs, list header, filter drawer, record detail, related-list tabs). Only the colors change (emerald + champagne + white; no restricted "green").
3. **Collapse button at the BOTTOM** of the rail (not top), plus **Owner Panel** + **Return to Site** pills below it.
4. **All emerald, never restricted green.** Fix all icon/text contrast: white ink on emerald, black ink on champagne.
5. **Fully functional modules**, not stubs. Every listed module must open, load, search, paginate, and show a working record detail — either from Zoho (live) or the JBJ local cache — with no "not implemented" placeholders.
6. **Hostinger domain re-validation guide** (`jbj.ae` / `www.jbj.ae`) so you can revalidate DNS end-to-end.

## Architecture

```text
/owner/crm/jbj                         (JBJ CRM shell — REPLACES OwnerShell sidebar)
 ├─ top bar   [logo | module tabs | search | create | notif | user]
 ├─ left rail (Zoho-style, 240px / 56px collapsed)
 │   groups: Workspace · Sales · Marketing · Activities · Collaboration ·
 │           Operations · Intelligence · Configure
 │   footer (bottom): [Collapse ⟷] [Owner Panel] [Return to Site]
 └─ main
     ├─ ListView   (filter drawer left · list right · bulk actions · pagination)
     ├─ KanbanView (stage columns · drag-drop · WIP counters)
     ├─ Detail     (header · related-list tabs · timeline · notes · emails · files)
     └─ Settings   (per-module: fields, layouts, workflow rules stub-safe)
```

Routing change: `OwnerRoutes` renders `<JbjCrmShell/>` for `/owner/crm/jbj/*` **outside** `<OwnerShell/>` so only one sidebar mounts.

## Modules (all functional in Phase 1)

Live via Zoho gateway (v6, correct `fields` param, 204 = empty):
Leads · Contacts · Accounts · Deals · Tasks · Meetings · Calls · Cases · Products · Quotes · Invoices · Sales Orders · Purchase Orders · Vendors · Price Books · Campaigns · Solutions · Notes · Attachments

Local (Supabase-backed, real CRUD on existing JBJ tables):
Documents · Team Space · Work Queue · My Requests · Projects · Reports · Analytics · AI Agents · Integrations · Roles

Every module supports: list, search (server-side for Zoho `criteria=`, client-side for local), pagination (50/page, `more_records`), sort, column chooser (persisted per-user in `localStorage`), CSV export, and a right-drawer detail with related-list tabs.

## Design tokens (locked)

- Emerald metallic `#064E3B → #0A6E4F → #064E3B` — used for rail selection, primary buttons, active tab underline, badges.
- Champagne `#F7F2EA` page, `#EFE6D6` raised, `#FDFBF7` card.
- Ink `#1A1A1A` on champagne. **Pure white `#FFFFFF`** on emerald (icons + text, no exceptions).
- Gold `#B89555` — 1px hairline only, never a fill.
- Removes every `emerald-500/600/700` Tailwind class from the CRM tree (which was the "restricted green") — replaced with the `.jbj-emerald-*` metallic tokens.

## Rail behavior

- Default expanded 240px; collapsed 56px (icon-only).
- **Collapse button pinned to rail footer**, above the two 3D emerald pills:
  - `Owner Panel` → `/owner/admin`
  - `Return to Site` → `/`
- Groups are accordions, remember open state per-user.
- Active item: emerald metallic pill, white icon+label, 2px gold left indicator.
- Inactive: transparent, ink text, gold-hover.

## Real functionality contract

For each live module the engine will:

1. `GET /zoho_crm/{Module}?fields=…&page=…&per_page=50` — real columns per module.
2. Detail: `GET /zoho_crm/{Module}/{id}` + related lists (`/Notes`, `/Attachments`, `/Activities`, `/Emails`) rendered as Zoho-style tabs.
3. Create/Edit: POST/PUT `{ data:[{…}] }` with client-side Zod validation + inline errors.
4. Delete: DELETE with confirm.
5. Search: `/{Module}/search?criteria=(Field:starts_with:value)` debounced 300ms.
6. Empty (204) and Zoho error envelopes rendered as first-class states (never a raw JSON dump).
7. Mirror-cache to `localStorage` per module so the workspace still renders if Zoho is momentarily down.

## Files to add / change

New:
- `src/pages/owner/crm/jbj/JbjCrmShell.tsx` (replaces OwnerShell for this route)
- `src/pages/owner/crm/jbj/JbjTopBar.tsx`
- `src/pages/owner/crm/jbj/JbjLeftRail.tsx` (footer collapse + pills)
- `src/pages/owner/crm/jbj/views/ListView.tsx`
- `src/pages/owner/crm/jbj/views/KanbanView.tsx`
- `src/pages/owner/crm/jbj/views/RecordDetail.tsx`
- `src/pages/owner/crm/jbj/views/RelatedListTabs.tsx`
- `src/pages/owner/crm/jbj/engine/zohoClient.ts` (edge-fn wrapper, fields registry, pagination, search, CRUD)
- `src/pages/owner/crm/jbj/engine/moduleRegistry.ts` (fields, columns, kanban stage field, related lists per module)
- `src/pages/owner/crm/jbj/engine/localModuleAdapters.ts` (Supabase-backed modules)
- `src/pages/owner/crm/jbj/styles/jbj-crm.css` (emerald-metallic tokens + Zoho-parity layout classes)

Changed:
- `src/routes/OwnerRoutes.tsx` — mount JBJ CRM **outside** `OwnerShell`, remove second sidebar.
- `supabase/functions/zoho-crm-proxy/index.ts` — add all modules, correct `fields` per module, search endpoint, single-record GET/PUT/DELETE, related lists.

## Hostinger domain re-validation guide

Delivered inline in chat after build (no code needed): DNS records to check on Hostinger, how to re-verify in Lovable Publish → Domains for `jbj.ae` and `www.jbj.ae`, TTL waits, and how to test with `dig`.

## Out of scope for this pass (called out honestly)

- Workflow Rules **execution engine** and Blueprint editor — UI shells only; running rules would need scheduler infra. Everything else on the list ships fully working.

## Validation

- Playwright: navigate every rail item on desktop + iPad + mobile; assert no double sidebar, footer collapse works, active pill is emerald white, no `text-emerald-6/7/800` residue.
- Manual: Leads/Contacts/Deals show real Zoho rows; create + edit + delete round-trips; search returns filtered rows; empty module shows empty state, not error.

Approve and I'll build the whole thing in one pass.
