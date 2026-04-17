

## Problem

The user's screenshot of `/project/tilal-al-furjan` shows the hero (dark image background) where text that SHOULD be white is rendering dark/unreadable:
- Breadcrumb: `Home / All Projects in Dubai / Al Furjan / Tilal Al Furjan`
- "Download Brochure" / "Register Interest" button text styling
- Location pill, "by Nakheel" developer line

This is caused by **over-aggressive global CSS overrides** in `src/index.css` (lines ~1993-2205) that don't know whether their target sits over a dark image or a light surface. They blanket-force gold/cream/champagne text to black, and unconditionally rewrite breadcrumb's `text-muted-foreground`/`text-gold` to dark — breaking every dark hero, dark modal overlay, and dark image card on the site.

## Root causes (in `src/index.css`)

1. **Lines 2013–2033**: `text-[#D4AF37]`, `text-[#C8A766]`, `text-gold/*` opacity variants forced to `#111` everywhere — kills gold accents on dark heroes.
2. **Lines 2044–2053**: `from-[hsl(32...)]` / `from-[hsl(38...)]` dark-amber gradients flipped to white — breaks intentional dark hero gradients.
3. **Lines 2079–2090**: All `text-gold` SVG icons forced to `#111` regardless of context.
4. **`ProjectBreadcrumb.tsx`**: Uses `text-muted-foreground` (dark) on a hero overlay where parent provides no `text-white` context — needs an explicit prop / variant for "on dark surface".

## Fix Strategy

### A. Introduce a `.on-dark` opt-out class
Add a CSS escape hatch: any element (or ancestor) tagged `data-surface="dark"` or class `.on-dark` will:
- Skip all global "force dark text" overrides (gold/cream/champagne text remains its intended bright color)
- Force `text-muted-foreground`, `text-gold`, `text-gold/*`, `text-amber-*` descendants to readable light tones (white / amber-200)
- Keep icon colors light

### B. Wrap hero content with the new marker
In `ProjectDetailLayout.tsx` line 582, add `data-surface="dark"` to the hero content `<div>`. Same for any other "dark image hero" sections found in the audit.

### C. Update `ProjectBreadcrumb.tsx`
Add `surface?: "light" | "dark"` prop. When `dark`:
- Links: `text-white/80 hover:text-white`
- Separators: `text-white/40`
- Current page: `text-amber-200` (replaces gold)
Pass `surface="dark"` from the project hero usage.

### D. Audit & tag other dark-hero sections
Scan the codebase for sections with dark image overlays (`bg-gradient-to-t from-black`, `bg-zinc-900`, hero video backgrounds) that contain `text-gold`, `text-muted-foreground`, or `text-[#C8A766]` descendants. Add `data-surface="dark"` to their content wrappers. Targets to audit:
- `ProjectDetailLayout` hero
- `CommunityDetail` hero (already uses `text-black` correctly — verify)
- `Hero.tsx`, `HeroSection.tsx`, all `*Hero*.tsx` components
- `AreaDetail`, `DeveloperDetail` page heros
- Footer (dark bg, may already be ok)
- Any modal / sheet over dark image

### E. CSS rule changes (`src/index.css`)
Add a single new block near the bottom:

```css
/* Dark-surface escape hatch — opt-in via data-surface="dark" or .on-dark */
[data-surface="dark"], .on-dark { color: rgb(255 255 255 / 0.92); }

[data-surface="dark"] :is(.text-gold, [class*="text-gold/"], 
  [class*="text-[#D4AF37]"], [class*="text-[#C8A766]"], [class*="text-[#F5E6C8]"]),
.on-dark :is(.text-gold, [class*="text-gold/"]) {
  color: #FDE68A !important;     /* amber-200, readable on dark */
}

[data-surface="dark"] :is(.text-muted-foreground, .text-gray-500, .text-gray-600, .text-gray-700),
.on-dark :is(.text-muted-foreground, .text-gray-500, .text-gray-600) {
  color: rgb(255 255 255 / 0.78) !important;
}

[data-surface="dark"] svg:is(.text-gold, [class*="text-gold"], .text-gray-400, .text-gray-500, .text-gray-600, [class*="text-muted"]) {
  color: #FDE68A !important;
}

/* Buttons inside dark surfaces — keep white text on transparent/bordered variants */
[data-surface="dark"] .bg-gold { background-color: #FDE68A !important; color: #111 !important; }
```

This is **additive**: doesn't touch existing rules, only overrides them inside `[data-surface="dark"]` scopes.

## Files to modify

1. `src/index.css` — add the `[data-surface="dark"]` override block (~30 lines).
2. `src/components/project-detail/ProjectDetailLayout.tsx` — add `data-surface="dark"` to hero content wrapper (line 582) and Sold Out wrapper (line 574).
3. `src/components/project-detail/ProjectBreadcrumb.tsx` — add `surface` prop and apply `data-surface="dark"` + readable color classes on the `<Breadcrumb>` root when on dark hero.
4. **Audit pass** — grep for `from-black|bg-zinc-900|bg-black/60` heros and add `data-surface="dark"` where text-gold / muted text appears.

## Verification

After implementation, in default mode:
1. Run a `code--exec` script that uses `playwright`/`chromium-headless` (or `browser--screenshot`) to capture:
   - `/project/tilal-al-furjan` (hero)
   - `/area/...` (any area hero)
   - `/developer/nakheel` (developer hero)
   - Homepage hero
2. Save PNGs to `/mnt/documents/contrast-fix/` and present as `<lov-artifact>` for proof.
3. Provide a written list of every file/section touched.

## What stays the same

- Light-surface fixes (forms, dropdowns, champagne cards) remain intact.
- CTA system, monochrome palette unchanged.
- No mass find-replace; minimal targeted changes.

