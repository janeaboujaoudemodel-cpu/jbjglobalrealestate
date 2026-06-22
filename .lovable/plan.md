## Goal
Fix the actual shared UI primitives so current and future screens inherit the JBJ system automatically, instead of patching individual CRM sections.

## Non-negotiable system contract
- Emerald filled icon tile = white icon, always.
- Primary CTA = locked Emerald gradient, white text, white icon.
- Secondary CTA = shared Champagne/Emerald primitive only.
- Labels, tabs, KPI cards, empty states, and stage cards must come from shared primitives, not local one-off classes.
- No blue, random green, raw gray, or default browser styling in these primitives.

## Implementation plan

### Gate 1 — Global Icon primitive first
I will fix only the icon primitive first, then validate and pause.

What changes:
- Refactor `IconTile` so Emerald is the default and its own surface metadata is always emitted.
- Remove/neutralize icon color escape hatches that allow black/dark icons inside Emerald tiles.
- Add a final global CSS lock for:
  - `[data-icon-tile]`
  - `.jj-icon-tile-emerald`
  - `[data-icon-tile-tone="emerald"]`
- Force all nested SVGs, paths, strokes, spans, and lucide icons inside Emerald icon tiles to white at rest, hover, focus, active, and inside dark/light parent surfaces.
- Convert ad hoc CRM icon-tile markup to the shared primitive only where needed to prove inheritance.

Validation before continuing:
- Screenshot `/broker/crm`.
- Check KPI icons, empty-state icons, pipeline stage icons, CRM tab icons, and CTA icons.
- Programmatically inspect rendered SVG color/stroke inside Emerald tiles.
- Compare before/after screenshots.
- Stop and ask you to approve the icon primitive before moving to labels.

### Gate 2 — One global section label primitive
After icon approval:
- Create one reusable label/eyebrow primitive for labels like `LIVE ACTIVITY`, `JBJ INTELLIGENCE`, `DATA ACCESS`, `PIPELINE`, and `SCHEDULE`.
- Standardize size, spacing, typography, padding, icon treatment, border, and visual weight.
- Replace local label markup on broker/CRM proving surfaces with the primitive.
- Add CSS inheritance for `[data-section-label]` so future labels match automatically.

Validation:
- Screenshot CRM and broker portal labels.
- Confirm all labels share identical computed sizing, spacing, typography, and Emerald treatment.
- Pause for approval.

### Gate 3 — Premium EmptyState primitive
After label approval:
- Promote `BrokerEmptyState` into a global empty-state primitive.
- Enforce Emerald icon tile + white glyph through `IconTile`.
- Standardize hierarchy: strong title, refined description, tighter visual rhythm, gold hairline, premium surface, and consistent CTA slot.
- Replace CRM empty states such as:
  - `There are no leads yet`
  - `No databases shared with you yet`
  - `No leads in your scope yet`
  - `No activity yet`
- Ensure empty-state CTAs use shared `Button` variants only.

Validation:
- Screenshot all CRM empty-state tabs.
- Verify icon contrast, CTA contrast, hierarchy, spacing, and typography.
- Pause for approval.

### Gate 4 — One global CRM/navigation tabs primitive
After empty-state approval:
- Standardize tab navigation through the shared `Tabs` / segmented navigation primitive.
- Active state: Emerald background with white text and white icon.
- Inactive state: same height, spacing, type, icon size, hover, and focus treatment everywhere.
- Replace custom CRM tab buttons with the global primitive.

Validation:
- Screenshot active and inactive states across CRM tabs.
- Inspect hover/focus behavior.
- Pause for approval.

### Gate 5 — KPI and pipeline card primitives
After tabs approval:
- Create/reuse a global KPI card primitive using `IconTile`.
- Stronger number hierarchy, premium hover lift, shadow, and Emerald glow.
- Create/reuse a pipeline stage card primitive using the same icon and hover rules.
- Replace local CRM KPI and stage-card markup.

Validation:
- Screenshot KPI cards and pipeline stage cards at rest and hover.
- Confirm all icons are white inside Emerald tiles.
- Pause for approval.

### Gate 6 — CTA primitive enforcement
After KPI/stage approval:
- Tighten `Button` so primary/legacy primary aliases always render Emerald + white text/icon.
- Ensure links styled as buttons either use `Button asChild` or the exact CTA primitive classes.
- Replace local CTA class bypasses in CRM proving surfaces.

Validation:
- Screenshot and inspect:
  - Add first lead
  - Upload database
  - Open assistant
  - Request database
  - Log a call
- Confirm primary/secondary contrast and hover states.
- Pause for approval.

## Technical files likely involved
- `src/index.css`
- `src/components/ui/icon-tile.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/premium-backend-layout.tsx`
- `src/components/broker-portal/BrokerEmptyState.tsx` or replacement global primitive
- CRM proving surfaces, only to remove local bypasses and consume shared primitives

## Definition of done
The work is not done when colors change. It is done only when the shared primitives own the JBJ visual language and the CRM screens prove the inheritance automatically: Emerald icon tiles always have white icons, labels match globally, tabs match globally, empty states feel premium, KPI/stage cards use the same rhythm, and CTAs use the locked Button system.