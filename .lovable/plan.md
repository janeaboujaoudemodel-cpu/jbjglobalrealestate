## What I found so far

### Current winning/conflicting CSS rules

1. **Global price-orange rule is still active**
   - `src/index.css:248-249` defines `--price-orange` / `--price-orange-glow`.
   - `src/index.css:2543-2564` forces `.text-price-orange`, `[data-price]`, `[data-price-badge]`, `.price-value`, `.property-price`, `.listing-price`, etc. to orange.
   - `src/index.css:2590-2614` forces brighter orange on dark surfaces.
   - `src/index.css:2616-2637` keeps solid orange price pills white-on-orange.
   - `src/components/ui/card-price-payment-row.tsx:161-166` directly applies `text-[hsl(var(--price-orange))]` to property-card prices.
   - `src/components/ui/price-pill.tsx` and `src/index.css:3092-3139` still preserve a price-colored value path.

2. **There are more than two contrast systems competing**
   - `src/index.css:489-553` global data contrast enforcement.
   - `src/index.css:555-609` mobile readability overrides.
   - `src/index.css:611-647` hero contrast override/rescue.
   - `src/index.css:2991-3008` hero readability lock.
   - `src/index.css:3312-3367` gold/champagne debrand and badge safety rules.
   - `src/index.css:3369-3400` sidebar active item and dark-CTA exceptions.
   - `src/index.css:3412-3460` homepage-specific contrast patches.
   - `src/index.css:3642-3775` global gray/champagne remappers.
   - `src/index.css:4187-4262` final light-surface lock.
   - `src/index.css:4270-4310` final dark-surface lock.

3. **The dangerous escape hatch is still present**
   - The final light lock at `src/index.css:4226` and icon lock at `4258` skip anything with `[data-no-contrast-guard]` / `.allow-white`.
   - Many header/sidebar/homepage elements use `data-no-contrast-guard`, so old white/gold/ink choices can escape the architecture instead of being corrected by a single contract.

4. **Header/sidebar files controlling the current chrome**
   - Horizontal utility bar: `src/components/navigation/HorizontalUtilityBar.tsx:98-100` uses `bg-[#FDFBF7]` with gold divider.
   - Expanded sidebar root: `src/components/navigation/GlobalVerticalNav.tsx:1421` uses `bg-[#FDFBF7]` and forced gold child text/icons.
   - Collapsed sidebar root/header/body: `src/components/navigation/GlobalVerticalNav.tsx:1281-1290` uses `bg-[#FDFBF7]`.
   - Sidebar logo header: `src/components/navigation/GlobalVerticalNav.tsx:1012` uses `bg-[#FDFBF7]`.
   - Bottom Contact/Support controls: `src/components/navigation/GlobalVerticalNav.tsx:1168-1210` use champagne/gold styling.

## Implementation plan

### 1. Do not touch homepage structure or content
- No homepage component rewrites.
- No homepage section/layout/background changes.
- The fix will be CSS architecture plus the property-card price component only.

### 2. Restore/lock header and sidebar chrome to champagne-gold
- Keep the vertical sidebar exactly in its current champagne/gold style.
- Add a scoped chrome lock for `[data-chrome="sidebar"]` and `[data-chrome="utility-bar"]` so broad surface rules cannot repaint them white or invert their icons/text.
- Do not change the sidebar navigation items, collapse behavior, spacing, or menus.

### 3. Remove orange from property-card prices everywhere
- Change `CardPricePaymentRow` so property-card price numbers always render ink/black `#1A1A1A`, not `--price-orange`.
- Update `PricePill` / `.price-pill-value` if any property card path still uses it.
- Neutralize the global price-orange enforcement for property-card selectors only, or remove the global orange price lock if it is only serving property-card prices.
- Update/remove the price color audit/tests that currently enforce orange, so future builds do not reintroduce it.

### 4. Replace scattered contrast patches with one controlled contract
- Remove or neutralize the overlapping legacy contrast blocks listed above.
- Keep only two final contrast rules:
  1. **Light/champagne/gold surfaces:** text/icons are ink `#1A1A1A`.
  2. **Dark/navy/photo surfaces:** text/icons are champagne/white.
- Preserve only the required exceptions:
  - vertical sidebar/current chrome styling
  - approved dark CTAs with their own navy background
  - explicit nested opposite surfaces, so light cards inside dark sections and dark CTAs inside light sections stay readable

### 5. Make the rendered audit prove the real winner
- Extend the rendered contrast audit to report:
  - computed `color`
  - computed `-webkit-text-fill-color`
  - nearest surface/chrome ancestor
  - class list
  - element text
  - screenshot coordinate
- Add checks for:
  - white text/icons on champagne/gold/light
  - ink/black text/icons on dark/photo/navy
  - price values still orange on property cards

### 6. Visual proof before saying fixed
After implementation, I will capture screenshots and only mark complete if visually clean:
- `/` homepage: header/sidebar and handpicked/property cards
- `/properties`: property-card price numbers black, no orange
- `/company-profile`: title sections contrast
- `/about`
- `/contact`
- `/founder`
- `/press-kit`
- `/developers`
- `/areas`

## Acceptance rule
I will not claim the issue is fixed until screenshots confirm:
- no white text/icons on champagne/gold/light backgrounds
- no black/ink text on dark/photo backgrounds
- no orange property-card price numbers
- header and vertical sidebar remain champagne/gold and are not made whiter
- homepage layout/content remains untouched