## What's wrong right now

- **Handover label** is rendered as a metallic gold pill via `HandoverPill.tsx → .jj-cta-gold-metallic`. It should mirror the **Starting price** box (translucent champagne, 1.5px solid gold hairline, ink text, 8px radius) — not a filled metallic pill.
- **Request Callback Now** CTA looks lighter than the **sq ft** header chip because the two use different palettes/animations:
  - sqft (`jj-metallic-active` in `HorizontalUtilityBar.tsx`): `#d8b86a → #f4e3a8 → #b89555 → #f4e3a8 → #d8b86a`, size `220% 220%`, `4.5s ease-in-out`.
  - my `.jj-cta-gold-metallic`: `#E6D3A8 / #F5E9CC / #D8BE82`, size `200% 100%`, `3s linear` + a bright white diagonal sweep.
- **Phone country trigger** is still a static champagne fill; it must use the same metallic gradient/animation as sqft.
- **Country / nationality / language dropdowns are visually broken** (no background). Cause: the global popper-content lock I added in `src/index.css` includes
  ```
  [data-radix-popper-content-wrapper] > [data-no-contrast-guard] { background-color: revert !important; ... }
  ```
  PopoverContent in `phone-input.tsx` already carries `data-no-contrast-guard` and an inline `backgroundColor:"#F7F2EA"`. `revert !important` outranks the inline style and wipes the surface to transparent.

## Plan (in order — no skipping, each step screenshot-validated)

### A. Repair regressions from the last batch
1. **HandoverPill = Starting-price twin**
   - Rewrite `src/components/ui/HandoverPill.tsx` to render the same chrome as `PricePill`:
     - container: translucent champagne `rgba(253,251,247,0.55)` + `backdrop-filter: blur(14px) saturate(160%)` + `1.5px solid #B89555` + `border-radius: 8px` + soft shadow stack identical to `.price-pill-premium`.
     - "Ready"/date typography: Inter, ink `#1A1A1A`, weight 800–900, 14px, tabular-nums.
     - Remove `.jj-cta-gold-metallic` class and the metallic shimmer animation from this component.
   - Keep memory rule that orange is forbidden; just shift handover from filled-gold to glass+gold-hairline so it matches Starting price.

2. **Exact metallic match (CTA + phone trigger)**
   - In `src/index.css`, replace `.jj-cta-gold-metallic` body so the palette / size / animation are **byte-identical to `jj-metallic-active`**:
     - `background-image: linear-gradient(120deg, #d8b86a 0%, #f4e3a8 25%, #b89555 50%, #f4e3a8 75%, #d8b86a 100%);`
     - `background-size: 220% 220%;`
     - `animation: jbj-champagne-shimmer 4.5s ease-in-out infinite;` (keep keyframes `0/50/100 background-position`).
     - `box-shadow: inset 0 0 0 1px rgba(255,244,210,.45), inset 0 -1px 2px rgba(0,0,0,.18);` (same as sqft) + a small drop shadow for CTA elevation only.
   - Remove the `::before` white-diagonal sweep that was making the CTA read lighter; rely on the gradient drift alone, exactly like sqft.
   - Keep `color: #1A1A1A` and ink icons; preserve reduced-motion no-op.
   - Apply the same metallic surface to `button[data-phone-code-trigger]`: replace the static champagne fill (lines ~4564–4572 + the earlier theme-tokens.css override) with the same metallic gradient + animation + 1px gold hairline + ink text/icons. Keep inline-styles in `phone-input.tsx` from forcing dark via `!important` on the CSS side.

3. **Restore dropdown surfaces (global)**
   - In `src/index.css`, rewrite the popper-content lock so it can never blank-out an inline-styled popover:
     - Drop the `revert !important` exclusion branch entirely.
     - Apply champagne fill + 1px soft-gold border to **every** floating surface (SelectContent, PopoverContent, DropdownMenuContent, ComboboxContent, country/nationality/language). Match selectors to all real Radix data-attrs Rendered in DOM: `[data-radix-select-content]`, `[data-radix-popover-content]`, `[data-radix-dropdown-menu-content]`, plus generic `[role="listbox"]`, `[role="menu"]`, `[role="dialog"]` (Popover uses dialog), and `[cmdk-root]` parent.
     - Use `background-color: #F7F2EA !important;` + `background-image: linear-gradient(180deg,#FDFBF7,#F7F2EA) !important;` + `border: 1px solid rgba(184,149,85,.55) !important;` + `box-shadow: 0 12px 32px -12px rgba(26,26,26,.18), 0 4px 12px -4px rgba(184,149,85,.25) !important;` + `color:#1A1A1A !important;`.
     - Lock items: `[role="option"]`, `[role="menuitem"]`, `[cmdk-item]` → ink text; hover/selected/highlighted → champagne tint `rgba(184,149,85,.12)`.
     - Allowlist only **truly dark** popovers via the existing `[data-on-dark]` attribute (set on the small number of dark surfaces, e.g. owner toolbar) — and use `background: #1A1A1A !important;` for those instead of `revert`. No more `revert !important` anywhere.

4. **Visual proof (mandatory before moving on)**
   - `view_preview` at desktop + mobile widths.
   - Screenshot the project page header showing sq ft chip and "Request a Call Back Now" CTA side-by-side; confirm identical hue/animation.
   - Open the phone country picker; screenshot the dropdown showing champagne surface, gold hairline, ink rows.
   - Open one Select (nationality / language); screenshot showing the same surface.
   - Confirm Starting price + Handover chip side-by-side look like twins (champagne glass + gold hairline + ink).
   - Only then mark A complete.

### B. Batch 4 — Gallery
- Confirm dedup + hi-res upgrade already in `ProjectDetailLayout.tsx` is live; then polish the lightbox: stable sizing with `object-contain`, no crop jumps between portrait/landscape, keyboard arrows, and gold-hairline frame matching the rest of the page.
- Screenshot lightbox open on a portrait image and a landscape image at desktop + mobile.

### C. Batch 5 — Owner/User toggle default
- Already flipped default to User Mode in `useEffectiveOwner.ts`. Validate end-to-end:
  - As owner, fresh session → page renders without edit affordances; toggle shows "User Mode" selected; switching to "Owner Mode" reveals edit chrome; reloading respects the explicit `"0"`/`"1"`.
- Screenshots of both modes on `/project/vindera-emaar-properties-the-valley`.

### D. Batch 6 — Location / Nearby
- Audit `ProjectLocationMap`, `PointsOfInterest`, `ProjectNearbyPropertiesMap`, `ProjectLocationFlyover`, `MoreFromDeveloperStrip` for any residual non-champagne colors or blue accents and replace with the champagne/gold/ink token set.
- Improve "Other projects in this area" matching: same `area_id` (or fuzzy area-name) + same emirate, ordered by proximity if coords available, fall back to same developer. Hide section when 0 matches.
- Screenshot the Location section and the Nearby strip showing real same-area results on Vindera (Emaar — The Valley).

### E. Remaining queued tasks (after 4-6)
Payment plan pending-state, brochure-card readability + blocked-download proxy, "More from developer" visibility, mortgage calculator border refresh, AI analyzer progressive state, DLD widget refresh, final desktop/tablet/mobile E2E screenshots.

### F. Memory lock (always-on rules)
- `mem://ui-ux/visual-standards/handover-equals-starting-price` — HandoverPill MUST mirror PricePill chrome (glass champagne + 1.5px gold hairline, ink text); never filled metallic.
- Update `mem://ui-ux/visual-standards/metallic-gold-cta-primitive` — `.jj-cta-gold-metallic` palette/size/animation MUST be byte-identical to `.jj-metallic-active` (sqft). No white diagonal sweep.
- Update `mem://ui-ux/visual-standards/global-dropdown-and-cta-lock` — popper-content lock MUST NOT use `revert !important`; dark popovers opt-in via `[data-on-dark]` with explicit dark tokens, not revert.

## Technical notes (root-cause summary)
- Dropdown went blank because `background-color: revert !important` on the data-no-contrast-guard branch beats inline `style.backgroundColor` and there is no fallback color in the cascade, so the surface paints transparent.
- CTA reads lighter because the palette anchor color `#D8BE82` is ~10–15% lighter in luminance than sqft's `#b89555`, the gradient size is `200% 100%` instead of `220% 220%` (so the dark band passes through faster and is less visible), and the bright `::before` sweep adds an additional white wash that sqft does not have.
- Handover should never have been filled metallic — the user's pattern across the page is glass+gold-hairline for "info chips" (Starting price, Status, Handover) and metallic only for **action** CTAs.
