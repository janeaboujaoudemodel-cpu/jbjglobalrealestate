## Goal
Eliminate every gray section divider, hairline, and gray surface so the entire site reads as one continuous champagne canvas with gold-only accents.

## Changes

### 1. Kill `SectionDivider` globally
`src/components/ui/section-divider.tsx` → make the component a no-op that always returns `null` (keep the export so the ~30 existing call sites continue to compile). Result: the gold diamond ornaments and any residual gray strips between sections disappear in one edit, across `Index.tsx`, `AIHub`, `BrokerHub`, `BuyerGuide`, `DeveloperDetail`, `Guides`, `Partners`, `PropertyManagement`, `ProjectDetailLayout`, and all mega-menus.

### 2. Neutralize `AdaptiveHairline`
`src/components/ui/AdaptiveHairline.tsx` → render `null`. Removes every adaptive divider line site-wide without touching call sites.

### 3. Purge gray separators / borders in CSS
In `src/index.css`:
- Map `--border`, `--input`, `--muted`, `--muted-foreground` away from neutral grays to champagne tokens (`#EFE6D6` border, `#F7F2EA` muted, ink `#1A1A1A` muted-foreground).
- Add a global override so any leftover `bg-gray-*`, `bg-neutral-*`, `bg-slate-*`, `bg-zinc-*`, `bg-stone-*`, `border-gray-*`, `divide-gray-*`, `<hr>`, and `[role="separator"]` resolve to champagne surface / transparent dividers (gold hairline only when explicitly opted-in via `data-gold-hairline`).
- Loading skeletons (`.animate-pulse`, `[data-skeleton]`, shadcn `Skeleton`) repainted to champagne shimmer (`#F7F2EA` → `#EFE6D6`) instead of gray.

### 4. Tailwind config
`tailwind.config.ts` → remap the `gray`, `neutral`, `slate`, `zinc`, `stone` palettes to the champagne ramp (page / surface / raised / ink) so any future `bg-gray-100` etc. is automatically champagne, not gray.

### 5. Lock the rule
Add to `mem://constraints/no-gray-surfaces` and append to `mem://index.md` Core: "No gray surfaces, borders, dividers, or skeletons anywhere. Champagne tones only; gold only as 1px hairline accent. SectionDivider and AdaptiveHairline are permanently no-op."
Also append the rule to `src/config/master-lock.ts`.

### 6. Verification
- Visual check on Home, AI Hub, Broker Hub, Developer Detail, Project Detail to confirm sections butt cleanly with no diamond ornament and no gray strip.
- Grep for `bg-gray-`, `border-gray-`, `<hr` to confirm only css-overridden usages remain.

## Out of scope
Dark-mode ink surfaces (`#1A1A1A`) used for explicit dark sections (footer, modals on dark) — those are ink, not gray, and stay.
