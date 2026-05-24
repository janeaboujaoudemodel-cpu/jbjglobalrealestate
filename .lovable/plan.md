## Issues to fix in `src/components/home/AIConcierge.tsx`

1. **Header looks cropped.** Current header is fixed at `h-[68px]` with a 40px avatar + two stacked text lines, no vertical breathing room, and the avatar is `h-10 w-10` — the second line ("JBJ Global Real Estate") visually clips at the bottom hairline.

2. **Background reads silver/gray, not champagne-gold.** Header uses `bg-secondary` (a neutral token that, on this drawer, paints as a cold cream/silver), and the drawer body uses `bg-background` — both come across as gray next to the gold-themed home page.

3. **Strong deep black line cutting across the screen.** That's the combo of `border-b border-gold/40` on the header + `border-l border-gold/55` on the drawer aside + the dark backdrop seam at the very top — they read as one heavy black rule.

## Fix

Change three blocks inside `AIConcierge.tsx`, nothing else:

### a) Drawer container (`<motion.aside>`, ~line 149)

- Replace `bg-background` with the champagne page tone `bg-[#FDFBF7]` so the whole sheet is warm.
- Soften the left border from `border-l border-gold/55` to `border-l border-[#B89555]/25` so it stops reading as a black line.
- Soften the heavy shadow seam: change boxShadow from `hsl(var(--foreground) / 0.22)` to `rgba(184, 149, 85, 0.18)` (warm gold-tinted shadow instead of cold black).

### b) Header strip (~line 156)

Replace the header `<div>`:
- Background → champagne-gold mirror-metallic gradient: `bg-[linear-gradient(135deg,#F7F2EA_0%,#EFE6D6_45%,#F7F2EA_100%)]` with a subtle inner sheen via `shadow-[inset_0_-1px_0_rgba(184,149,85,0.18)]`.
- Border → soft 1px gold hairline: `border-b border-[#B89555]/30` (no more dark line).
- Height → `h-[80px]` (was `h-[68px]`) so the two-line title + 40px avatar have breathing room and don't clip.
- Padding → `px-5 py-3` so the content vertically centers cleanly.

### c) Messages scroll area (~line 177)

Change `bg-background` to `bg-[#FDFBF7]` so the body matches the new champagne header instead of switching to a cooler tone.

## Out of scope

- No copy changes (header already reads "JBJ Concierge" / "JBJ Global Real Estate", aligned with the no-"AI Concierge" memory rule).
- No logic, no streaming code, no channel-switcher edits.
- Only `src/components/home/AIConcierge.tsx` is touched.
