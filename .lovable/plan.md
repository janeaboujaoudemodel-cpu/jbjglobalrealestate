# Contrast & Layout Remediation — Batched Plan

Every batch ends with a Playwright screenshot proof under `/tmp/browser/<batch>/`. No batch closes without a screenshot showing the fix. No partial completion.

## Batch A — Owner Overview (`/owner`)
1. **Needs Follow-up circles** (screenshot 1): status dots inside cards render dark-on-dark. Force emerald surface + white inner mark, ≥3:1.
2. **Alert bell vs Search** spacing: add left margin so bell is not glued to Search.
3. **Buttons out of card** (Marketing / View Site / Sign Out): constrain header actions inside the Owner Panel card, wrap on narrow widths.
4. **Overview → Book Hub tab bar**: current flat wrap is unreadable. Rebuild as a proper segmented grid (labeled sections, icon+text pills, 3–4 per row, emerald active state, champagne idle).
5. **Refresh button**: convert to emerald-filled with pure white icon+label.

## Batch B — Vertical Sidebar Restoration
1. Restore the pre-change owner sidebar exactly (structure, order, icon set, spacing) to match front-end.
2. Icons: match the **squared-rounded emerald tile** shape used by the "Calls Today" stat icon — not the softer pill currently rendered.

## Batch C — CRM (`/owner/crm`)
1. **Export button** (icon+label): both currently render near-black on emerald. Force white foreground.
2. **Calls Today / WhatsApp / Total Leads / Conversion Rate** cards: align on one row, unify icon tile size + shape + position, unify label/number baseline, remove wrapping.
3. Match those icon tiles to the sidebar icons (single shape system).
4. **Investors / Developers pipeline chips**: numeric badges show black-on-emerald → force white.

## Batch D — Developer Hub
1. **Projects list** (`/owner/developers/projects` etc.): Unpublish / Edit / View buttons → emerald-filled, white content.
2. **Access Requests → Rep Applications** tab: active pill contrast broken → emerald active + white text; inactive champagne + ink.

## Batch E — Front-End `/properties` Buy/Off-Plan
1. Emerald filter bar: More Filters / Price / Payments / Handover / Property Type triggers render black-on-emerald → white text + white chevrons.
2. Open **Payments dropdown**: panel must be champagne background with **black** text (per user), emerald hover.
3. Property Map circle badges (price labels): force white numerals on emerald.

## Batch F — Listing Admin (`/owner/listing-admin`)
1. Sweep header row from "Project Enrichment" through "Visible" toggle for black-on-emerald.
2. "606 partially enriched" status pill → correct emerald/white or champagne/ink pairing depending on surface.

## Validation Protocol (per batch)
```
/tmp/browser/<batch>/
  before.png
  after.png
  notes.md   # sampled computed colors: fg rgb, bg rgb, WCAG ratio
```
Playwright samples `getComputedStyle` for each fixed element; ratio must be ≥ 4.5:1 for text, ≥ 3:1 for large text/icons. If any sample fails, the batch is not done.

## Execution Order
A → B → C → D → E → F, sequentially. Each batch is a single commit-scope; no cross-batch drift.
