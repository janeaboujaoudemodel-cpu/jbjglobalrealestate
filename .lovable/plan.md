# Hard-Fix Persistent Faded UI on /join

## What's still broken (from new screenshots)

1. **IMG_4421** — "Join" still renders in faded gold, NOT black. My previous JSX change to `text-black` didn't visually take effect because some other CSS rule still wins.
2. **IMG_4421** — "Contact Our HR · Jessica" button shows only the chat icon; the text label is invisible. The shadcn `<Button variant="primary" asChild>` wrapper combined with descendant-selector contrast guards is killing the white color on the inner `<span>`.
3. **IMG_4419 / IMG_4420** — Position cards have pills that wrap mid-word: "Sales" → "Sale s", "Partner" → "Partn er". The Badge components are too narrow / have wrap enabled.
4. **IMG_4420** — "Commission Basis" text on the position card still renders in faded gold — my amber-700 swap didn't apply because the running build is older than my last edit, OR a different code path is rendering it. Need belt-and-suspenders inline styles.

## Root cause
The CSS contrast guards in `index.css` are deeply nested and use `!important`. JSX class names like `text-black` and `text-white` are getting overridden by `:where()` cascades and `[class*="bg-…"]` matchers in unpredictable ways. The bullet-proof solution is **inline `style={{ color }}` on the affected elements** — inline styles beat any external CSS rule short of `!important` on the same element.

## Fixes

### `src/pages/JoinApplication.tsx`

**Hero "Join" headline (lines 416-418):**
- Replace the `<span className="text-gold|text-black …">Join</span>` with `<span style={{ color: '#000000' }}>Join</span>`. Apply same inline style to the h1 itself.

**Jessica CTA (lines 425-445):**
- Drop the shadcn `<Button variant="primary" asChild>` wrapper. Render the `<Link>` directly with explicit Tailwind utility classes AND inline `style={{ backgroundColor: '#000', color: '#fff' }}`. This bypasses every contrast guard.
- Inline-style the `MessageCircle` icon and label span to `color: '#ffffff'` so they cannot be flipped.
- Inline-style the Bot icon (Jessica avatar) to white as well.
- Add `whitespace-nowrap` so the label never wraps.

**Position cards pills (lines 589-600):**
- Add `whitespace-nowrap` to all three badges (`Partner`, `department`, `Commission Basis`, location) so "Sales" and "Partner" never break across two lines.
- Keep the previously applied black/white solid pills. Add inline `style={{ color }}` as a final guard on the "Commission Basis" span (`color: '#b45309'` for amber-700) and the location text (`color: '#374151'` for gray-700) so even if the rest of the cascade fails, the cards remain readable.
- Set the Partner badge to `min-width: fit-content` so the star + "Partner" label stays one line.

### `src/index.css` (small reinforcement)
- Confirm the existing PASS 5 guard catches `.jj-section-champagne` and add a final one-liner: `.jj-section-champagne span { /* no special color */ }` — actually, no, leave the cascade alone; inline styles are enough.

## Out of scope
- Position-card content (titles, descriptions) is dynamic from DB, untouched.
- No new features. No layout restructure.

## Files to edit
- `src/pages/JoinApplication.tsx` (single targeted edit, lines ~416-445 and ~589-605)

## Expected result
- "Join" renders in solid black, matching "JBJ Global Real Estate".
- Jessica CTA button is solid black with white "Contact Our HR · Jessica" label and white chat icon, label fully visible on one line.
- Position-card pills "Sales", "Partner", "Commission Basis" render on one line, no wrap, all readable.
