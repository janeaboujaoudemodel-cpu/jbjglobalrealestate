## Goal
Fix the bottom of the global vertical sidebar in `src/components/navigation/GlobalVerticalNav.tsx`:

1. Make the **Contact** and **Support** tiles smaller and use a finer red border.
2. Stop the **Sign Out** button text from flickering between red and white.

## Changes

### 1. Shrink Contact + Support tiles (lines ~1247-1268)
- Reduce vertical padding: `py-2` → `py-1.5`
- Reduce font size: `text-[11px]` → `text-[10px]`
- Reduce icon size: `w-4 h-4` → `w-3.5 h-3.5`, lower `strokeWidth` from `2.5` to `2`
- Tighter gap between icon + label: `gap-1` → `gap-0.5`
- Replace heavy `border-2` with finer `border` (1px) and soften the red: `borderColor: '#DC2626'` → `'rgba(220,38,38,0.45)'`
- Hover keeps solid red fill (unchanged behavior, just thinner resting border)
- Reduce wrapper container padding: `px-2.5 py-2.5` → `px-2 py-2`, and `gap-2` → `gap-1.5` between the two tiles

### 2. Fix Sign Out flicker (lines ~1270-1280)
Root cause: the Sign Out button is missing `data-no-contrast-guard`, so the runtime contrast guard in `src/utils/contrastGuard.ts` periodically rewrites its color (red on light champagne is treated as a same-tone/low-contrast risk in some passes), producing the white→red→white flicker the user sees.

Fix:
- Add `data-no-contrast-guard` to both the signed-in `<button>` and the signed-out `<Link to="/auth">` so the guard leaves them alone.
- Keep the resting state explicitly red text + red exit icon + faint red tint background, so it stays red without requiring hover.
- Keep the existing hover (solid red fill, white text) behavior intact.
- Apply the same finer `border` (1px) treatment for visual consistency with the shrunk Contact/Support tiles above.

### Files touched
- `src/components/navigation/GlobalVerticalNav.tsx` (only the bottom block, ~lines 1242-1292)

No other files, no DB, no new dependencies.