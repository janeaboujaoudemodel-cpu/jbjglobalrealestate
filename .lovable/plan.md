

## Fix Logo Containers: Remove White Background, Keep Correct Data Extraction

### Problem
The logo data extraction (`getDeveloperLogoUrl`) is working correctly. However, a forced `bg-white` was added to all logo containers in the last fix, creating an ugly white box effect. The user wants this removed -- logos should render cleanly over the card image without an artificial white background.

### Root Cause
The DeveloperCard component already has the correct pattern: it conditionally applies white bg only for specific developers that need it (Azizi, Binghatti, etc.) and uses `logo_bg_color` or transparent for others. The other 4 components were given a blanket `bg-white` which is wrong.

### Changes (4 files, logo container styling only)

**1. `src/components/home/FeaturedListings.tsx` (line 157)**
- Remove `bg-white` from logo container
- Change to: `w-12 h-12 rounded-lg shadow-lg overflow-hidden p-1.5` (no bg-white)
- Add subtle backdrop blur for visibility: `bg-black/40 backdrop-blur-sm`

**2. `src/components/ProjectCard.tsx` (line 208)**
- Remove `bg-white` from logo container
- Change to: `w-12 h-12 rounded-lg shadow-lg overflow-hidden p-1.5 bg-black/40 backdrop-blur-sm`

**3. `src/components/ReellyProjectCard.tsx` (line 164)**
- Remove `bg-white` from logo container
- Same pattern: `w-12 h-12 rounded-lg shadow-lg overflow-hidden p-1.5 bg-black/40 backdrop-blur-sm`

**4. `src/components/project-detail/RecommendedProjects.tsx` (line 191)**
- Remove `bg-white` from logo container
- Change to: `w-10 h-10 rounded-xl overflow-hidden shadow-md border border-gold/40 p-1.5 bg-black/40 backdrop-blur-sm`

### What stays untouched
- `getDeveloperLogoUrl` utility (correct, no changes)
- `object-contain` on all logo images (correct)
- DeveloperCard.tsx (already has correct conditional logic)
- DeveloperSearchModal.tsx (separate component, already correct)
- No color, layout, card design, border, or CTA changes
- No database changes

### Visual Result
- Logos render over a subtle dark translucent backdrop (same as DeveloperCard's transparent approach)
- No ugly white box
- Logos centered with balanced p-1.5 padding
- object-contain prevents cropping/stretching
- Premium, clean look

