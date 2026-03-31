

## Logo System Fix Plan

### Problem
The `getDeveloperLogoUrl` utility correctly extracts `logo_url` from Supabase join arrays. However, there are padding/container inconsistencies across components, and the core data extraction needs verification.

### Root Cause Analysis
The logo rendering code is actually correct in most places -- it uses `getDeveloperLogoUrl()` which pulls from `logo_url`. The issue is likely:
1. **FeaturedListings** logo container (line 157): `w-12 h-12` with NO padding class -- logo touches edges
2. **ProjectCard** logo container (line 208): conditionally applies `p-1` only when no `logo_bg_color` -- inconsistent
3. **RecommendedProjects** logo container (line 191): uses `p-0.5` -- too small

### Changes (3 files, logo containers only)

**1. `src/components/home/FeaturedListings.tsx` (line 157)**
- Add `p-1.5` padding to the logo `div` so the logo never touches edges
- Change: `w-12 h-12 rounded-lg shadow-lg overflow-hidden bg-white` --> `w-12 h-12 rounded-lg shadow-lg overflow-hidden bg-white p-1.5`

**2. `src/components/ProjectCard.tsx` (lines 206-219)**
- Remove conditional padding logic; always apply `bg-white shadow-lg p-1.5`
- Remove `getDeveloperLogoBgColor` conditional -- always use white container with consistent padding
- Keep `w-12 h-12 rounded-lg` dimensions

**3. `src/components/ReellyProjectCard.tsx` (line 164)**
- Change `p-1` to `p-1.5` for consistency with other cards

**4. `src/components/project-detail/RecommendedProjects.tsx` (line 191)**
- Change `p-0.5` to `p-1.5` for consistent padding across all logo containers

### What stays untouched
- No color changes, layout changes, or card design changes
- No database modifications
- The `getDeveloperLogoUrl` utility remains as-is (it correctly extracts `logo_url`)
- Fallback behavior (Building2 icon or initial letter) remains unchanged

### Technical Details
- All logo containers standardized to: `bg-white rounded-lg shadow-lg p-1.5 overflow-hidden` with `object-contain` on the image
- This ensures equal padding on all 4 sides, centered alignment, no stretching, no cropping

