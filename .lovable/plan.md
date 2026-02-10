

# Standardize Developer Logos -- Gold Border, Full-Fit, No White Border

## Problem

Developer logos across the platform have inconsistent styling. Some use white backgrounds with white/zinc borders, some have padding that makes logos look small, and some use `object-fill` which distorts them. The user wants ALL developer logos to match the gold-bordered style seen in the DeveloperInfoCard on project detail pages.

## Reference Style (DeveloperInfoCard)

The approved standard from the project detail page:
- Gold border: `border: 3px solid hsl(42 45% 59%)`
- Gold shadow: `boxShadow: 0 4px 16px rgba(200,167,102,0.3)`
- White background
- `object-contain` (no cropping/distortion)
- Minimal padding (`p-1` for small logos, `p-2` for large ones)

## All Files to Update

| File | Component | Current Issue | Fix |
|------|-----------|--------------|-----|
| `ProjectCard.tsx` (line 198) | Card logo overlay | `border border-gold/30` (thin, faint) | `border-2 border-gold` with gold shadow |
| `ReellyProjectCard.tsx` (line 152) | Card logo overlay | `border border-gold/30` (thin, faint) | `border-2 border-gold` with gold shadow |
| `DeveloperCard.tsx` (line 85) | Directory card logo | Already has gold border -- OK | Keep as-is |
| `DeveloperDetail.tsx` (line 150-162) | Detail page hero logo | Already has gold border -- OK | Keep as-is |
| `DeveloperInfoCard.tsx` (line 58-69) | Project detail sidebar | Already gold -- this is the reference | Keep as-is |
| `DeveloperSearchModal.tsx` (line 93-97) | Search modal logo | `bg-white`, thin border, `object-fill` | Gold border, `object-contain p-1` |
| `AreaDevelopersBar.tsx` (line 70) | Area page dev logos | No border, just `rounded` | Gold border container |
| `PropertiesReelly.tsx` (line 394) | Filter bar dev icon | `object-fill` | `object-contain` |
| `PropertySearchBar.tsx` (line 117) | Search bar dev icon | `object-fill` | `object-contain` |

## Specific Changes

### 1. ProjectCard.tsx (line 198)
Change the logo container from thin faint border to proper gold:
```
border border-gold/30
```
to:
```
border-2 border-gold shadow-[0_4px_16px_rgba(200,167,102,0.3)]
```

### 2. ReellyProjectCard.tsx (line 152)
Same change as ProjectCard -- upgrade to gold border with shadow.

### 3. DeveloperSearchModal.tsx (lines 93-97)
- Change `object-fill` to `object-contain p-1` (prevent distortion)
- Add proper gold border: `border-2 border-gold/50` for top-tier, `border border-gold/30` for others

### 4. AreaDevelopersBar.tsx (line 70)
Add gold border to the logo images inside the developer chips.

### 5. PropertiesReelly.tsx (line 394)
Change `object-fill` to `object-contain` (small inline icon, just fix distortion).

### 6. PropertySearchBar.tsx (line 117)
Change `object-fill` to `object-contain` (small inline icon, just fix distortion).

## Files Modified

| File | Change |
|------|--------|
| `src/components/ProjectCard.tsx` | Upgrade logo border to gold |
| `src/components/ReellyProjectCard.tsx` | Upgrade logo border to gold |
| `src/components/DeveloperSearchModal.tsx` | Gold border + object-contain |
| `src/components/area-detail/AreaDevelopersBar.tsx` | Gold border on logo images |
| `src/pages/PropertiesReelly.tsx` | Fix object-fill to object-contain |
| `src/components/PropertySearchBar.tsx` | Fix object-fill to object-contain |

