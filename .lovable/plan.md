

## Fix Developer Logo System Globally

### Root Cause (TWO issues)

**Issue 1: `logo_url` not fetched in most queries.** The developer join in most Supabase queries is `developer:developers(id, name, slug)` -- missing `logo_url`. Only `useProjectsListing` (line 369) and one other query (line 465) include it. This means `getDeveloperLogoUrl()` returns `null` because the field was never fetched, causing the logo to not render at all or fall through to a fallback.

**Issue 2: Logo container has `bg-black/40 backdrop-blur-sm` (smoky gray).** This was introduced in the last fix. The user wants the original clean container restored.

### Fix Plan

**File 1: `src/hooks/useProjects.ts`** -- Add `logo_url` to ALL developer joins

- Line 262: `developer:developers(id, name, slug)` → `developer:developers(id, name, slug, logo_url)`
- Line 282: same change
- Line 334: same change
- Line 417: same change
- Line 440: same change

**File 2: `src/pages/Favorites.tsx`** -- Add `logo_url` to developer joins

- Line 126: `developer:developers(id, name, slug)` → `developer:developers(id, name, slug, logo_url)`
- Line 140: same change

**File 3: `src/pages/Compare.tsx`** -- Add `logo_url`

- Line 134: `developer:developers(name, slug)` → `developer:developers(name, slug, logo_url)`

**File 4: `src/components/ComparisonBar.tsx`** -- Add `logo_url`

- Line 54: `developer:developers(name, slug)` → `developer:developers(name, slug, logo_url)`

**File 5: `src/pages/Quiz.tsx` and `src/pages/QuizResults.tsx`** -- Add `logo_url` to developer joins

**File 6: `src/components/home/FeaturedListings.tsx`** -- Restore clean logo container

- Line 157: Remove `bg-black/40 backdrop-blur-sm`, restore to clean white container: `w-12 h-12 rounded-lg shadow-lg overflow-hidden p-1.5 bg-white/90`
- Line 169 fallback: keep as-is (dark bg for missing logo initial is fine)

**File 7: `src/components/ProjectCard.tsx`** -- Restore clean logo container

- Line 208: Remove `bg-black/40 backdrop-blur-sm`, change to `w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center shadow-lg p-1.5 bg-white/90`

**File 8: `src/components/ReellyProjectCard.tsx`** -- Restore clean logo container

- Line 164: Same change -- remove `bg-black/40 backdrop-blur-sm`, use `bg-white/90`

**File 9: `src/components/project-detail/RecommendedProjects.tsx`** -- Restore clean logo container

- Line 191: Remove `bg-black/40 backdrop-blur-sm`, use `w-10 h-10 rounded-xl overflow-hidden shadow-md border border-gold/40 p-1.5 bg-white/90`

### What stays untouched

- `getDeveloperLogoUrl` utility -- correct, no changes
- `object-contain` on all logo images -- correct
- DeveloperCard.tsx -- already has correct conditional logic
- No layout, color, card design, border, or CTA changes
- No database changes

### Technical Details

- Using `bg-white/90` (slightly translucent white) gives a clean, non-opaque container that doesn't look "boxed" but still ensures logo visibility over any background image
- Adding `logo_url` to all developer joins is the critical data fix -- without it, `getDeveloperLogoUrl` has no data to return
- This is the same field already used successfully in `useProjectsListing` (line 369)

