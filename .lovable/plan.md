

# TASK 3 REDO: Visual Correction Pass — White-Dominant Premium UI

## Assessment

The header and footer are already largely correct (white backgrounds, black text, gray borders). The core CSS variables are set correctly. The remaining problems are:

1. **FilterShortcutBar + GlobalFilterBar** — still uses champagne gradients and `border-gold` for pills, popovers, and toggle states
2. **FloatingActionBar** — still fully champagne-styled with gold borders, gold icons, gold shadows
3. **Global CSS overrides** need strengthening to catch remaining `bg-gold`, `text-gold`, `border-gold` utility classes
4. **Scattered `text-gold` and `border-gold` references** across 543 files not caught by current overrides

## Execution (5 targeted files + 1 CSS update)

### File 1: `src/components/filters/FilterShortcutBar.tsx`

The core filter bar still uses champagne gradients for pills, popovers, and toggles. Fix all styling constants:

- `pillInactive` (light variant): Change from champagne gradient to `bg-white border border-gray-300 text-black hover:border-gray-400 hover:bg-gray-50`
- `pillActive` (light variant): Change from champagne + gold border to `bg-black text-white border border-black font-bold shadow-sm`
- `popoverClass`: Change from champagne gradient to `bg-white border border-gray-200 z-[10200] shadow-xl`
- `togglePillOff`: Change `border-gold/30` to `border-gray-300 text-gray-600 bg-white hover:bg-gray-50`
- `togglePillOn`: Change gold border + champagne gradient to `border-black bg-black text-white font-bold`
- `CountBadge`: Change gold gradient to `bg-black text-white`
- All inline `border-gold/30` on inputs to `border-gray-300`
- Apply button gradient: Change `from-gold to-gold-dark` to `bg-black text-white hover:bg-gray-800`
- Price preset active: Change champagne + gold to `bg-black text-white border-black`
- Price preset inactive: Change `border-gold/30` to `border-gray-300`

### File 2: `src/components/navigation/GlobalFilterBar.tsx`

- Replace `bg-gradient-to-r from-[#ECE2D2] via-[#E0D3BF] to-[#D8C7A6]` with `bg-white`
- Replace `border-b border-gold/20` with `border-b border-gray-200`

### File 3: `src/components/ui/floating-action-bar.tsx`

Complete visual overhaul — make minimal, elegant, non-intrusive:

- Main bar container: Change champagne gradient + gold border to `bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-lg`
- Action buttons: Change champagne gradient to `bg-gray-50 text-black border border-gray-200 hover:bg-gray-100 hover:shadow-sm`
- Icon spans: Change `text-gold` to `text-gray-600`
- Divider: Change `bg-gold/30` to `bg-gray-200`
- Voice button: Change gold states to `bg-black text-white` (active) / `text-gray-500 hover:bg-gray-100` (inactive)
- Plus button: Same pattern
- Expanded panel: White bg, gray border, `shadow-xl`
- AI Quick Actions label: Change `text-gold` to `text-gray-400`
- Menu item hover: Change `hover:bg-gold/10 hover:text-gold` to `hover:bg-gray-100 hover:text-black`
- Overall: Scale down slightly with `transform: scale(0.9)` for less visual weight

### File 4: `src/index.css` — Strengthen Global Overrides

Add CSS rules to catch the remaining `text-gold`, `bg-gold`, and `border-gold` Tailwind utility classes that the tailwind config remap handles, but also any inline `style` gold references. Add:

```css
/* Catch any remaining gold-class references */
.text-gold { color: #111 !important; }
.bg-gold { background-color: #111 !important; }
.border-gold { border-color: #d4d4d4 !important; }

/* Gold opacity variants */
[class*="bg-gold/"] { background-color: rgba(0,0,0,0.05) !important; }
[class*="border-gold/"] { border-color: rgba(0,0,0,0.12) !important; }
[class*="text-gold/"] { color: rgba(0,0,0,0.7) !important; }
[class*="hover:text-gold"] { }
[class*="via-gold"] { --tw-gradient-via: #e5e5e5 !important; }
[class*="from-gold"] { --tw-gradient-from: #e5e5e5 !important; }
[class*="to-gold"] { --tw-gradient-to: #d4d4d4 !important; }

/* Force inline style gold overrides */
[style*="#D4AF37"] { color: #111 !important; border-color: #d4d4d4 !important; }
[style*="#C8A766"] { color: #111 !important; border-color: #d4d4d4 !important; }
[style*="#B8860B"] { color: #111 !important; border-color: #d4d4d4 !important; }
```

### File 5: `tailwind.config.ts`

Verify the `gold` color token maps to grayscale. Currently `--gold` is `0 0% 10%` which is correct (near-black for accent use), but ensure the Tailwind `gold` color resolves properly for `text-gold`, `bg-gold`, `border-gold` utilities.

## What This Fixes Visually

| Problem | Fix |
|---|---|
| Champagne filter pills | White pills with clean gray borders, black active state |
| Gold-bordered popovers | White popovers with gray borders |
| Ugly floating action bar | Minimal white bar with subtle shadow |
| Remaining gold text/borders | Global CSS override catches all |
| Muddy dark buttons in filter bar | Black-on-white or white-on-black only |
| Inconsistent pill states | Unified: inactive=white+gray, active=black+white |

## What Will NOT Change
- No layout changes
- No content removal
- Header and footer already correct from prior pass
- Hero section unchanged
- All functionality preserved

