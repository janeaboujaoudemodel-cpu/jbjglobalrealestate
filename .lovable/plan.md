## Plan

Three small, focused fixes — sidebar nav and one shortcut tile. No business logic.

### 1. Add "Relationship Hub" in the CRM vertical sidebar
File: `src/components/owner-dashboard/OwnerSidebarNav.tsx`

Inside the CRM `children` array (currently: Leads, Brokers, Brokerage Agencies, Developers, Developer Sales Representatives, Employees, Investors), add at the top:

```
{ label: "Relationship Hub", icon: Network, path: "/owner/crm?section=relationships" }
```

This routes through the existing legacy migration in `UnifiedCRM.tsx` (which redirects `?section=relationships` → Investors directory) AND keeps a single entry point for the relationship pages. Use the `Network` icon (already imported).

### 2. Collapse Leads (and other CRM groups) by default until clicked
File: `src/components/owner-dashboard/OwnerSidebarNav.tsx` (function `isOpen`, lines ~212-220)

Current behavior auto-expands a parent whenever:
- the parent is the active path, OR
- any descendant is active, OR
- `location.pathname.startsWith(item.path.split("?")[0])` — this last rule is what forces "Leads" open whenever the user is anywhere on `/owner/crm`.

Change so that a parent is open ONLY if:
- the user explicitly toggled it open in `openMap`, OR
- one of its own children matches the **current `?entity=&view=`** exactly (i.e. `isActivePath(child.path)` is true for a direct child).

Concretely: drop the third "pathname startsWith" auto-expand rule, and replace `isAnyChildActive` (which recurses) with a one-level check for the Leads parent so that simply being on `/owner/crm?entity=brokers&...` does not pop the Leads branch open. Net effect:
- Land on `/owner/crm` (no params) → CRM expanded, Leads collapsed.
- Click "Leads" → expands.
- Navigate to `entity=leads&view=flagged` (e.g. via shortcut) → Leads auto-expands because a direct child is active.

This is a UI-only change; nothing else relies on the old behavior.

### 3. Add a "Relationship Hub" shortcut tile
File: `src/components/owner-dashboard/DepartmentShortcuts.tsx` (and/or `QuickActionsGrid.tsx` — whichever currently shows the CRM/Tasks/Calendar shortcuts the user already has).

Add a tile:
- Label: "Relationship Hub"
- Icon: `Network`
- Path: `/owner/crm?section=relationships`
- Same champagne styling as siblings.

If both files render the user-visible shortcut grid the user is referring to, add it to `DepartmentShortcuts.tsx` (closest match to the "shortcut" terminology used elsewhere). I will confirm the right file during implementation by checking which is rendered on the route the user has open and add the tile there.

### Out of scope
No DB changes, no Relationship Hub redesign, no changes to lead/investor/broker pages — purely sidebar + shortcut wiring.
