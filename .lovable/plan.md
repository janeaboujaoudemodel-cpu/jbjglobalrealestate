# Fix card hover + handover label consistency

Three issues to fix:

1. **Past handover dates should show "Ready"** — A project showing `31 December 2024` should render as `Ready` (just `Ready`, not `Handover Ready`), matching how Dalana Residence behaves.
2. **Cards turn dark on hover** — Hovering a project card on the homepage darkens the whole card background, hiding the orange price and orange handover date.
3. **Hover effect** — Replace the dark color shift with a clean lift/zoom (no color change).

---

## 1. Handover label normalization

**File**: `src/utils/handoverDerivation.ts`

Currently `deriveHandover()` returns the raw `handover_date` field as-is — so a stored value like `"31 December 2024"` or `"2023"` displays literally. Update it to:

- Try to parse the direct field as a date (full date strings, `YYYY`, `Q# YYYY`).
- If the parsed date is **in the past** OR matches `/ready|complet|handed.?over/i` → return `"Ready"`.
- Otherwise return the existing normalized string (`Q# YYYY`, `YYYY`, or the raw value if already in the allowed format).

Also add a `Ready` short-circuit for `construction_status` BEFORE reading `handover_date`, so a row marked `ready` always wins over a stale date field.

The eyebrow label on cards stays as `Handover` and the value renders `Ready` — so the full visual reads `HANDOVER  Ready`, never `Handover Ready` as a single phrase. No code currently emits the string `"Handover Ready"`; this is purely the date normalization fix.

## 2. Card hover — kill the black flash

**Root cause**: `src/index.css` lines 3440–3455 apply a generic hover treatment to **any** `<a>` that contains a Lucide icon:

```css
a:hover:has(.lucide) {
  background-color: hsl(var(--accent) / 0.6);   /* darkens the card */
  ...
}
a:hover:has(.lucide) .lucide {
  color: hsl(var(--accent-foreground));
  transform: translateY(-0.5px);
}
```

The homepage project card is an `<a>` (Link) that contains MapPin + CreditCard icons → it matches → background flips to a near-ink accent → the runtime `contrastGuard` (`src/utils/contrastGuard.ts`) then sees a dark effective background and force-sets `color: #FDFBF7 !important` on the link, dragging price and handover text off-orange.

**Fix**: scope that hover rule so it only targets icon-tile-style controls, not full cards. Two changes in `src/index.css`:

- Narrow the selector to `.icon-tile:hover` (and the dark-mode equivalent at line 3506). The `a:hover:has(.lucide)` / `button:hover:has(.lucide)` / `[role="button"]:hover:has(.lucide)` selectors get removed from the background+icon-color block.
- Keep the focus-visible/active rules (lines 3459–3489) as-is — those only kick in on keyboard or click, not mouse hover, so they don't cause the regression.

## 3. New homepage card hover effect

**File**: `src/components/home/FeaturedListings.tsx` (the inner card `<div>` at line 162).

Current hover: `hover:border-[#B89555]/30 hover:shadow-lg hover:-translate-y-1` (already a lift, but masked by issue #2).

After the CSS fix above, the lift will work. Strengthen it slightly so the user clearly sees motion without any color change:

- Bump shadow: `hover:shadow-xl`
- Slightly larger lift: `hover:-translate-y-1.5`
- Keep image inner zoom: `group-hover:scale-105` (already present)
- Border on hover: stay at the same gold tone, no contrast change
- Add `transition-transform duration-300` for a smooth feel

Add `data-no-contrast-guard` on the `.price-pill-premium` and `.handover-orange` containers as belt-and-braces, so even if any future cascade darkens an ancestor the orange text is never re-flipped to white by the runtime guard.

---

## Files changed

- `src/utils/handoverDerivation.ts` — past-date → `Ready` normalization
- `src/index.css` — narrow `a:hover:has(.lucide)` rule to `.icon-tile` only
- `src/components/home/FeaturedListings.tsx` — stronger lift on hover, `data-no-contrast-guard` on price + handover

## Out of scope (will not touch)

- The `.payment-plan-square` styling — already ink-on-gold and unaffected.
- The Project Detail filter chips — fixed in the previous turn.
- The Provident Portal handover repair tools — already shipped.
