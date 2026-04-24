# Fix Filter Popover Behavior & Performance

## Problems observed

Inside `src/components/filters/FilterShortcutBar.tsx` (used globally via `GlobalFilterBar`) and tied to `src/components/navigation/GlobalFilterBar.tsx`:

1. **Apply Filter button does nothing** — in the Price popover, the button has `onClick={() => {}}` (line 352). It does not close the popover or confirm anything.
2. **Min/Max price inputs feel unresponsive / "won't take numbers"** — every keystroke calls `update()` → `onFilterChange` → `GlobalFilterBar.handleFilterChange`, which on non-property pages calls `navigate('/properties?...')`. That navigation re-mounts the page on every character, making the input appear frozen and swallow keystrokes.
3. **Price preset chips (500K, 1M, 1.5M…) flicker black→white and feel broken** — clicking a preset triggers the same navigate-per-click pipeline. Combined with `transition-all` on the chip and the full tree re-render from navigation, the chip momentarily loses its active state visually.
4. **Popovers never close after a choice** — no popover uses controlled `open` state, so Apply, presets, and selections keep the dropdown open indefinitely. On mobile this feels stuck.
5. **General slowness** — the bar is fixed and wide; every small change (slider, toggle, input) triggers a full URL-encode + `navigate` + `CustomEvent` dispatch. That is heavy for keystrokes.

## Goals

- Typing in min/max price fields is instant on all devices.
- Preset chips toggle cleanly without flicker and stay in their active state.
- "Apply Filter" actually applies and closes the popover; pressing Enter in an input applies too.
- Global navigation/URL sync only happens on Apply (or on debounce), not on every keystroke.
- Works on mobile, tablet, desktop, RTL; no layout shift.

## Changes

### 1. `src/components/filters/FilterShortcutBar.tsx`

**Introduce local draft state for popover-scoped filters (price, payments, handover, size).**
- Each relevant popover (`Price`, `Payments`, `Size` if present) becomes controlled: `const [priceOpen, setPriceOpen] = useState(false)` etc.
- Inputs inside the popover bind to local draft state (`draftPriceMin`, `draftPriceMax`, `draftPaymentPlanMax`, `draftAfterHandover`, `draftPostHandoverOnly`).
- Initialize draft from `filters` when the popover opens (`onOpenChange` → if opening, copy from `filters`).
- On **Apply**, Enter key, or preset click + short timeout: call `onFilterChange` once with merged draft, then `setPriceOpen(false)`.
- On **Reset** inside the popover: clear draft values only.
- Clicking a **preset chip** sets `draftPriceMax` immediately (instant visual feedback) and optionally auto-applies after ~150 ms so the popover closes cleanly.

Result: typing is local-only → no re-renders of the page, no navigation, no flicker. The chip reflects draft state, not global state, so it can't be "stolen back" by a late re-render.

**Wire Apply button:**
```tsx
<Button
  onClick={() => {
    onFilterChange({ ...filters, priceMin: draftPriceMin, priceMax: draftPriceMax });
    setPriceOpen(false);
  }}
>
  {t('filter.applyFilter')}
</Button>
```

**Submit on Enter** in both price inputs via `onKeyDown` → same handler.

**Remove `transition-all` from preset chips** (use `transition-colors` only) to stop the black/white flash during any remaining re-render.

**Apply the same controlled-popover + draft pattern** to Payments (slider + after-handover + post-handover switch) and Size (min/max sqft/sqm). Slider commits on release via `onValueCommit` → draft update; Apply writes to global.

For quick-toggle popovers (Property Type, Bedrooms, Status, Construction, Sort, Views) where a single click is the whole interaction, keep them uncontrolled but **auto-close** after selection when it makes sense (e.g., Sort: close immediately; multi-select: keep open until user clicks outside, which is current behavior — fine).

### 2. `src/components/navigation/GlobalFilterBar.tsx`

Currently `handleFilterChange` immediately `navigate()`s on every change when off the property page. Change to:

- On property pages: continue dispatching `globalFilterChange` so the listing updates live (but because draft is now local to the popover, this only fires on Apply anyway — already a huge win).
- Off property pages: only navigate when a filter is actually committed (Apply, preset auto-apply, chip toggle for single-choice pills, sort selection). Since `onFilterChange` is now only invoked on commit, the existing logic is already safe — no code change needed beyond confirming behavior. No debounce hack required.

No changes to URL encoding/decoding logic.

### 3. Minor polish

- Ensure `inputMode="numeric"` and `pattern="[0-9]*"` on price/size inputs so mobile shows the numeric keypad and typing is faster.
- Add `autoComplete="off"` to avoid browser autofill lag.
- Ensure price inputs use `type="text"` (already) with numeric filter — keep, but prevent leading-zero state churn.

## Technical notes

- No backend or schema changes.
- Only `FilterShortcutBar.tsx` is meaningfully edited; `GlobalFilterBar.tsx` behavior is unchanged by code but improved by the upstream fix.
- No new deps.
- RTL, dark/light variants, mobile scroll row — all preserved.

## Files to edit

- `src/components/filters/FilterShortcutBar.tsx`

## QA checklist after implementation

1. Landing page → click Price → type `500000` in Min → characters appear instantly, no page jump.
2. Click preset `1M` → chip turns black immediately, popover closes within ~150 ms, URL updates to `/properties?priceMax=1000000`.
3. On `/properties` page → open Price → type Min/Max → press Enter → popover closes, results update once.
4. Payments popover: drag slider → value label updates live → release → Apply → popover closes, single URL update.
5. Mobile (375px): numeric keypad appears for price; popovers close cleanly; no horizontal jank.
6. RTL: popovers and Apply still work; chip active state stable (no flicker).
