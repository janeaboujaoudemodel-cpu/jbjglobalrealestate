# Filter Bar Polish + Black-on-Black Cleanup + Mobile/Tablet Fixes

Six concrete bugs from your screenshot + voice notes. Tight, surgical fixes.

## 1. Filter pill hover crops the top border

**Cause:** `filterPillInactiveLight` in `src/components/filters/filterStyles.ts` uses `hover:-translate-y-0.5`. Because the pill's parent row uses `overflow: hidden` (filter scroller), the 2px lift clips the top.

**Fix:**
- Remove `hover:-translate-y-0.5` from `filterPillInactiveLight`.
- Replace the lift with a soft 3D feel that lives **inside** the pill: `hover:shadow-[0_4px_12px_rgba(184,149,85,0.18)] hover:bg-[#F7F2EA] hover:border-[#B89555]` + a subtle `transition-shadow`.
- Same treatment for `togglePillOff` and `filterSecondaryButton`.

## 2. "Dropdown looks overrided — full black" + unreadable titles next to Reset

**Cause:** Filter popovers (Price, Payments, Handover, etc.) render inside the global black-CTA repaint zone, which is flipping their internal section headers/labels to white-on-light. And the section title strip next to the Reset button in `AdvancedFilterPanel` inherits ink-on-ink from the same guard.

**Fix in `AdvancedFilterPanel.tsx` + each popover content wrapper:**
- Add `data-no-contrast-guard` to the popover `<PopoverContent>` root so the global guard doesn't repaint inner text/icons.
- Force the panel surface explicitly: `bg-[#FDFBF7] text-[#1A1A1A]` on the outer wrapper.
- Section headers ("Price", "Payment plan", "Bedrooms", etc.) get `text-[#1A1A1A] font-semibold` (no /XX fade).
- Reset button uses `filterSecondaryButton` token (already champagne+ink+gold).
- Audit `index.css` PASS guards: scope the dark-CTA repaint to `button:not([data-no-contrast-guard] button)` so popover internals never get touched.

## 3. Search input "behavior" cleanup

**Fix in `FilterShortcutBar.tsx` search pill:**
- Make placeholder text full ink at /60 (currently /70 reads as faded on champagne hairline). Tested still passes AA on `#FDFBF7`.
- Trim the AED suffix from the min/max price inputs on mobile (<480px) — it overlaps the number.
- Enter key on search now triggers query (currently only debounce).

## 4. iPad sidebar cropped at bottom

**Cause:** The 88px L-shaped sidebar uses `h-[calc(100vh-88px)]` but on iPad Safari, `100vh` includes the browser chrome that disappears on scroll. Bottom icons get cut off.

**Fix in `src/components/layout/AppSidebar.tsx`:**
- Replace `100vh` with `100dvh` (dynamic viewport height) — safari-stable.
- Add `overflow-y-auto` + `scrollbar-width: none` to the sidebar's icon column so any overflow scrolls invisibly instead of clipping.
- Tablet breakpoint (768-1024px): collapse the sidebar to a 56px rail (icons only, no labels) so it never runs out of room.

## 5. Listing photos shifting / not loading

**Cause:** `<ListingCard />` cover image uses `<img>` with no fixed aspect ratio while the loading skeleton has a different height → layout jumps when the image loads. Some `<img>` instances also lack `loading="lazy"` + `decoding="async"`.

**Fix in `src/components/properties/ListingCard.tsx` (and grid card variants):**
- Wrap cover in `aspect-[4/3] overflow-hidden bg-[#EFE6D6]` so the slot is reserved before the image loads.
- Add `loading="lazy" decoding="async"` to all listing covers.
- On error, swap to `getHighResImageUrl` fallback (already in repo) — currently only handled in some cards.
- Use `object-cover w-full h-full` so images never letterbox or shift.

## 6. Touch-up: hover-lift removed from any other clipped contexts

Audit and remove `hover:-translate-y-*` from elements inside any horizontally-scrolling row (filter bar, segmented controls, tab strip). Replace with shadow-only hover.

---

## Files to edit

- `src/components/filters/filterStyles.ts` — remove translate, add shadow hover
- `src/components/filters/AdvancedFilterPanel.tsx` — `data-no-contrast-guard`, explicit ink titles
- `src/components/filters/FilterShortcutBar.tsx` — search polish, AED suffix
- `src/index.css` — scope dark-CTA guard to skip `[data-no-contrast-guard] *`
- `src/components/layout/AppSidebar.tsx` — dvh + auto-scroll + tablet rail
- `src/components/properties/ListingCard.tsx` — aspect ratio + lazy + fallback
- (Audit pass) `rg "hover:-translate-y" src/components` — strip from any pill inside scrollers

## Out of scope (separate ticket if you want)

- Major sidebar redesign for mobile (hamburger drawer)
- Image CDN swap

Reply **Approve** to build.