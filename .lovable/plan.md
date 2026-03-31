

## Lock Developer Logos & Fix Meraas Logo Visibility

### What this plan does

1. **Lock developer logos globally** — Add a code-level lock rule that prevents any future modification to `logo_url` values, logo container styling, or fallback logic.

2. **Fix Meraas logo visibility** — The Meraas logo is an SVG from `cdnlogo.com` which renders very small inside the current `w-12 h-12` / `w-14 h-14` containers. Increase container size and remove padding constraints so the Meraas wordmark is clearly readable.

### Changes

**File 1: `src/config/master-lock.ts`** — Add DEVELOPER_LOGO_LOCK section

Add a new frozen config block documenting that developer logos are locked:
- `logo_url` values in the database are read-only — no overwriting, no fake initials, no generated letters
- Logo container styling (`bg-white/90`, `object-contain`, padding) is locked
- Only the database source of truth may provide logos
- Changes require explicit founder unlock

**File 2: `src/components/DeveloperCard.tsx`** — Increase logo overlay size for SVG logos

- Line 108: Change `w-14 h-14` to `w-16 h-16` for the logo overlay container on developer cards, giving more room for wordmark-style logos like Meraas

**File 3: `src/components/home/FeaturedListings.tsx`** — Increase logo container

- Line 157: Change `w-12 h-12` to `w-14 h-14` for the developer logo container so Meraas and similar wordmark logos are visible

**File 4: `src/components/ProjectCard.tsx`** — Increase logo container

- Line 208: Change `w-12 h-12` to `w-14 h-14`

**File 5: `src/components/ReellyProjectCard.tsx`** — Increase logo container

- Line 164: Change `w-12 h-12` to `w-14 h-14`

**File 6: `src/components/project-detail/RecommendedProjects.tsx`** — Increase logo container

- Line 191: Change `w-10 h-10` to `w-12 h-12`

### What stays untouched
- No database changes — logos are correct
- No logo URL changes — locked
- `getDeveloperLogoUrl` utility — unchanged
- `bg-white/90` container background — locked
- `object-contain` on all logo images — locked

