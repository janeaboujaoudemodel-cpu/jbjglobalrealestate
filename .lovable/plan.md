## Goal
Redesign the product language at the UI-system level so current and future screens inherit JBJ automatically: Champagne / White surfaces, locked Emerald as the primary brand accent, black typography, gold hairlines only where appropriate, and no grey/blue/random green default styling.

## What will change

### 1. Lock the brand token layer
- Create one canonical Emerald gradient token and one hover gradient token.
- Alias all legacy active/focus/primary/ring/sidebar/accent tokens to Emerald.
- Add system tokens for:
  - Emerald solid surface
  - Emerald soft surface
  - Emerald outline/accent
  - Champagne card surface
  - White surface
  - Gold hairline only
- Remove CSS paths where gold/grey/blue can still win active, focus, hover, icon, tab, badge, or status states.

### 2. Rebuild shared primitives as the source of truth
Update the shared components so pages do not need to remember Emerald manually:
- `Button`: primary = locked Emerald gradient + white text/icons; secondary = Champagne/White + Emerald text/icons.
- `Badge`: all neutral/active/success/default badges inherit Emerald styling; destructive/error remains red only for true destructive states.
- `IconTile`: default tone becomes Emerald; Champagne tiles render Emerald glyphs; active tiles render Emerald fill + white glyph.
- `Tabs`: active tabs use Emerald; inactive tabs use Champagne/White with Emerald hover/focus.
- `DropdownMenu`, `Select`, `Command`: items, checkmarks, highlighted rows, labels, separators, focus rings all inherit Emerald.
- `Table`: headers, hover rows, selected rows, action cells, checkboxes, and empty rows inherit Emerald accents.
- `Card`: add reusable visual rhythm variants instead of flat cards:
  - Champagne card + Emerald content
  - Emerald header + White content
  - White surface + Emerald iconography
  - Emerald feature card

### 3. Add global semantic primitives for product language
Create or standardize primitives that pages can use without local styling:
- `SectionHeader` / section label primitive: eyebrow, icon, active arrow, divider accent all Emerald by default.
- `KpiCard`: Emerald icon tile, strong black metric, Emerald arrow/accent, premium hover inversion.
- `EmptyState`: Emerald icon, Emerald accent mark, premium illustration motif, stronger hierarchy, better spacing, and CTA slot.
- `StatusIndicator`: online/success/active/focus states use Emerald automatically.
- `FeatureCard` / `Panel`: handles visual rhythm so pages do not all look identical.

### 4. Remove local color bypasses instead of patching individual visuals
Audit and replace raw color utilities that override the system, especially:
- grey/slate/zinc/neutral icons and labels
- blue active/focus/ring states
- random green/emerald shades outside the locked token
- hardcoded gold fills where Emerald should be the accent
- page-local KPI, section header, empty state, table, badge, and nav styling

This includes backend/admin/CRM/broker surfaces, but the fix will be via shared primitives and global inheritance rules first, not one-off button edits.

### 5. Apply the system to the current proving surfaces
Use `/broker/portal` and `/broker/crm` as proof pages because they currently expose the failures:
- “Data Access” and “Pipeline” inherit Emerald icon/label accents.
- “Broker Workspace” gets an Emerald accent within the section label system.
- “No activity yet”, “No databases”, and “No leads” render through the new premium EmptyState primitive.
- KPI tiles use one system rhythm, not page-local grey/gold/blue styling.
- Primary CTAs match the same locked Emerald gradient everywhere.

### 6. Add enforcement and visual proof
- Add CSS guardrails for foreground contrast:
  - Emerald background = white text/icons/borders at rest and hover.
  - Champagne/White background = black typography + Emerald icon/accent.
- Run a rendered audit across key routes at desktop and mobile sizes.
- Verify computed styles for CTAs, active nav/tabs, badges, icon tiles, dropdown selected states, tables, empty states, and section labels.
- Only report completion after visual verification shows the same system across screens.

## Technical scope
Primary files to update:
- `src/index.css`
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/icon-tile.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/command.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/premium-backend-layout.tsx`

New or consolidated primitives:
- Global section header / label component
- Global KPI card component
- Global premium empty state component
- Global panel/card rhythm variants

Page files will only be touched to remove local styling bypasses and use the shared primitives where local components currently block inheritance.