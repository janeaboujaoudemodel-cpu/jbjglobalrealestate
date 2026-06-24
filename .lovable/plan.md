# Apply AI Comparison shell style to public + tool pages

## What changes

Every top-level section on public marketing pages and tool pages will be wrapped in the same outer shell as the AI Property Comparison card:

- Champagne `#F7F2EA` background
- `rounded-2xl` corners
- `p-8 md:p-10` inner padding
- Two soft `#EFE6D6/10` blur orbs in opposite corners
- Sits inside a centered, padded container so it never touches screen edges

Inner content (titles, mini-cards, CTAs, tables) stays exactly as each page already has it. Only the outer shell changes.

## Homepage lock

`src/pages/Index.tsx` and every component under `src/components/home/**` are off-limits. No edits, no imports changed. I'll add a guard comment at the top of each modified file confirming it's not a homepage component.

## Scope (in this delivery)

Public marketing + tool pages only:

- Properties listing, project detail, area pages
- Tools: Mortgage Calculator, Compare Projects, Compare Units, AI Home Finder, Property Evaluator, Rental Index, Royal Tools Hub
- Services pages (investor services, complaints, legal hub, RERA forms, etc.)
- Marketing hubs: News, Market Intel, Guides, FAQ, Careers, Contact, About, Company Profile

Owner CRM, broker portal, developer hub stay as-is — out of scope until you confirm Phase 2.

## How it's built

1. **New primitive** `src/components/ui/ai-shell-card.tsx`:
   - Reuses the exact classes from `AIComparisonWidget` lines 33-38 (champagne shell + blur orbs).
   - Accepts `padding` (`md` | `lg`), `tone` (default `surface`), and pass-through `className`.
   - Wraps content in `relative z-10` so existing layouts don't shift.

2. **Section sweep** per page:
   - Find each top-level section block (typically a `<section>` or `<div>` with marketing copy + a CTA).
   - Replace its outer wrapper with `<AIShellCard>`.
   - Leave child grids, mini-cards, tables, buttons untouched.

3. **Spacing rule**: Cards stack with `space-y-6 md:space-y-10` between them inside the page container — same rhythm AI Comparison already uses.

## Validation

After each page batch (5-8 pages at a time), one desktop screenshot per restyled page at 1280×900, scrolled through to confirm:

- Outer shell renders correctly
- No double-card stacking (e.g. shell-inside-shell)
- No content overflow or broken grids
- Homepage screenshot at the end to prove it's untouched

If a page already uses `PremiumSectionCard`, I'll swap it for `AIShellCard` rather than nesting.

## Delivery order

1. Tools hub + 5 tool pages (highest visibility)
2. Properties listing + project detail + area pages
3. Services + legal + RERA
4. Marketing hubs (News, Intel, Guides, FAQ, Careers, Contact, About, Company Profile)

Each batch ends with screenshots and a brief written summary. Homepage verified untouched at the end.

## Technical notes

- Memory `mem://ui-ux/visual-standards/global-surface-theme-standard` continues to govern color tokens; the new shell uses tokens, not raw hexes once moved into the primitive.
- `data-marketing-page` and `.jj-band` rules from `mem://ui-ux/visual-standards/full-bleed-band-system` are preserved — the shell sits *inside* bands, not replacing them.
- `IconTile`, `PricePill`, `DeveloperLink`, and CTA primitives are not touched.
- No removal of any existing feature or content (per `mem://constraints/ui-restructuring-no-removal-policy`).

After you approve, I'll start with Phase 1 (tools hub + 5 tool pages) and post screenshots before continuing.
