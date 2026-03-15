

## Fix: Mega Menu Dropdowns Too Wide for Content

### Problem
`MegaMenuShell` forces all dropdowns to span the full viewport width via `left: '24px'; right: '24px'`. Menus with less content (e.g., Projects with only 4 categories) have huge empty gaps between the content and the edges.

### Solution
Change `MegaMenuShell` positioning from full-width stretch to **content-fit centered**:
- Remove `left: 24px; right: 24px` 
- Use `left: 50%; transform: translateX(-50%); width: fit-content; maxWidth: calc(100vw - 48px)`
- Each menu's inner `max-w-[...]` container already defines the correct width — the shell will now shrink to match

This is a **single-file fix** in `src/components/header/mega-menu-primitives.tsx` (the `MegaMenuShell` component, lines 30-33) that automatically applies to all 12+ mega menus globally.

### File to modify
- `src/components/header/mega-menu-primitives.tsx` — update shell positioning styles

