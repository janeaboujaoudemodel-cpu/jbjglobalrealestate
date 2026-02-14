

## Restore Logo Background Box with Smart Color Logic

### Problem

After removing the background box entirely, logos with transparent backgrounds (Azizi, Binghatti, Imtiaz, etc.) now sit directly on top of the feature photo and become hard to see or invisible.

### Solution

Restore the background box behind logos on all 3 external card components, using this logic:

- If `logo_bg_color` exists in the database, use it (e.g., Nakheel gets navy, Danube gets red, Binghatti gets black)
- If `logo_bg_color` is missing/null, default to **white** (`#FFFFFF`)
- This ensures every logo has a clean, visible container

### Current Data State

- **442 developers** already have `logo_bg_color` set
- **93 developers** are missing it (will get white box)
- Key examples: Nakheel = navy, Danube = red, Binghatti = black, Azizi = white (null), Emaar = white (null)

### Files to Update (3 files)

**1. `src/components/DeveloperCard.tsx` (lines 94-108)**

Restore the container div around the logo:
- Wrap `<img>` in a `div` with `w-14 h-14 rounded-lg overflow-hidden shadow-lg`
- Apply `backgroundColor` from `developer.logo_bg_color || "#FFFFFF"`
- Logo img uses `w-full h-full object-contain p-0.5`
- Restore `logoBgColor` variable

**2. `src/components/ReellyProjectCard.tsx`**

Wrap the logo `<img>` in a container div with `w-12 h-12 rounded-lg bg-white shadow-lg overflow-hidden flex items-center justify-center` and the img uses `w-full h-full object-contain`.

**3. `src/components/ProjectCard.tsx`**

Same approach as ReellyProjectCard -- wrap in a white background container div.

### What Does NOT Change

- Internal project detail pages (gold-framed logo) remain untouched
- No logo images are modified
- No database changes needed

