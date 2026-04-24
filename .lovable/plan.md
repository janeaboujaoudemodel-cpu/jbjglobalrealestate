## Three targeted fixes

### 1. Mode Switcher dropdown — keep each row visibly colored and add breathing room

File: `src/components/ModeSwitcher.tsx`

Problems today:
- Rows render flush against each other (no vertical gap), so the four colored tiles "touch".
- Default shadcn `DropdownMenuItem` applies `focus:bg-accent focus:text-accent-foreground` (a neutral gray) on hover/keyboard focus, which overrides the per-mode `bgColor` / `color` and makes the items appear uncolored — exactly what the user is seeing on Investor mode and the others.

Changes:
- Add `mt-1.5` (or wrap each item in a spacer) on every `DropdownMenuItem` so the four colored tiles are visually separated. Net result: 6px gap between rows + the existing 8px content padding.
- Add `focus:!bg-transparent focus:!text-current data-[highlighted]:!bg-transparent data-[highlighted]:!text-current` to each `DropdownMenuItem` so shadcn's neutral focus color does NOT clobber the mode's own `bgColor` / `color`. The row's own `bgColor` (e.g. `bg-emerald-500/10`) stays visible at all times.
- On hover, intensify the existing tint instead of replacing it: keep `hover:brightness-105` and add `hover:shadow-sm`.
- Increase contrast of the description line from `opacity-80` to `opacity-90` so it stays readable on the tinted background.
- Bump dropdown width slightly (`w-72` → `w-80`) so the longer "Investor + Broker" description doesn't wrap awkwardly between rows.

This component is the single source of truth, so the fix automatically applies everywhere it's mounted: horizontal header (`HorizontalUtilityBar`), account mega-menu (`MegaMenuAccount`), and footer (`Footer`). No per-call-site changes needed.

### 2. Sidebar Contact + Support icons — make the headset & ticket icons clearly visible

File: `src/components/navigation/GlobalVerticalNav.tsx` (bottom Support strip, lines ~1219–1235)

Today both icons use `text-red-400` on a warm `#F0E8D8` champagne background — far too pale.

Changes:
- `Headphones` next to Contact: `text-red-400` → `text-red-600` and add `stroke-[2.5]` so it reads as a solid red glyph.
- `Ticket` next to Support: same treatment — `text-red-600 stroke-[2.5]`.
- Bump label color from `text-black/50` to `text-black/80` (and hover to `text-black`) so the labels match the new icon prominence.
- Slightly enlarge icons from `w-3 h-3` to `w-3.5 h-3.5` for legibility without breaking the 48px collapsed-rail layout.

Also apply the same red-600 + stroke-2.5 treatment in `src/components/navigation/PropertiesVerticalNav.tsx` (lines ~223–235) so the legacy nav stays consistent.

### 3. Hero CTA pills — every label fully readable, no ellipsis

File: `src/pages/Index.tsx` (lines ~243–258)

Today the pills use `truncate` + a 3-column grid on mobile, which clips "Sell Your Property", "Submit Complaint", "Create Your CV", etc. with `…`.

Changes:
- Remove `truncate` from the label `<span>`. Allow up to 2 lines: `whitespace-normal leading-tight text-center break-words`.
- Switch the pill from a fixed-height oval (`rounded-full`) to a `rounded-2xl` tile so 2-line labels fit cleanly. Keep the same dark glass styling (`bg-black/60 border-white/30`).
- Stack icon above label on mobile, side-by-side on `sm+`: `flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2`.
- Tighten font slightly on mobile so two short words fit per line: `text-[10.5px] sm:text-xs font-medium`.
- Ensure consistent height with `min-h-[58px] sm:min-h-[44px]` so the 3×2 grid stays even when one tile wraps and another doesn't.
- Keep the existing `grid grid-cols-3 lg:grid-cols-6` layout — only the inner pill markup changes.

Result: all six labels — Sell Your Property, AI Home Finder, Explore AI Tools, Create Your CV, Update Profile, Submit Complaint — render in full, with no `…`, on every viewport.

### Files touched
- `src/components/ModeSwitcher.tsx`
- `src/components/navigation/GlobalVerticalNav.tsx`
- `src/components/navigation/PropertiesVerticalNav.tsx`
- `src/pages/Index.tsx`

### Out of scope (preserved)
- All routes, mode definitions, and CTA destinations stay identical.
- No removal of any hero section, sidebar entry, or footer block (No-Removal policy).
