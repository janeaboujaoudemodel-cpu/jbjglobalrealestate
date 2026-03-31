

# TASK 3 — Final Visual QA Pass: Component-Level Cleanup

## The Real Problem

The CSS override system in `index.css` correctly remaps dark brown section backgrounds (`from-[hsl(32...)]`) to white and maps `text-gold`/`bg-gold`/`border-gold` utilities to monochrome. However, **695 references** across 13 homepage component files still use:

- Inline champagne gradients: `from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]`
- Inline gold borders: `border-gold/30`, `border-gold/40`, `border-gold/60`, `border-2 border-gold`
- Gold shadows: `shadow-[0_8px_30px_rgba(200,167,102,0.3)]`
- Gold hover states: `hover:text-gold`, `hover:border-gold`
- Gold icon tints: `text-gold` on icons
- Gold gradient CTAs: `from-[#B89555] to-[#A68444]`
- Champagne badges: `bg-gradient-to-r from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6]`

The CSS overrides partially catch some of these (the Tailwind `text-gold` and gradient `from-` overrides work), but **inline hex gradients, shadow values, and border-opacity variants slip through** — creating the remaining gold accents, muddy cards, and inconsistent styling.

Additionally, `CombinedContactNewsletter` (the "Ready to Get Started?" CTA) has a completely legacy design with gold gradient text, champagne background, and gold borders — this renders as a broken/muddy section.

## Fix Strategy

Instead of adding more CSS overrides (which create cascading collisions), fix the **8 homepage component files** directly. Each file gets the same treatment:

- Champagne card gradients → `bg-white border border-gray-200`
- Badge pills → `bg-gray-100 border border-gray-300 text-black`
- Gold icon containers → `bg-gray-100 border border-gray-200`
- Icon `text-gold` → `text-gray-600`
- Gold hover shadows → `hover:shadow-lg`
- Gold hover borders → `hover:border-gray-400`
- `hover:text-gold` → `hover:text-gray-700`
- Gold gradient CTA buttons → `bg-black text-white hover:bg-gray-800`
- Gold divider lines → `bg-gray-200`

## Files to Edit (8 component files)

### 1. `src/components/CombinedContactNewsletter.tsx`
Most broken visible section. Full restyle:
- Section bg: `bg-white` (remove dark brown gradient)
- Inner container: `bg-gray-50 rounded-2xl border border-gray-200 p-6 md:p-10`
- Title: Remove gold gradient text effect, use `color: #111` plain
- Contact cards: `border-gray-200` instead of `border-gold`, icon backgrounds `bg-gray-100` instead of colored
- Divider: `bg-gray-200` instead of `via-gold/40`
- Newsletter title: Same — plain black, no gradient

### 2. `src/components/home/WhyChooseUs.tsx`
- Badge: `bg-gray-100 border border-gray-300` (remove champagne gradient)
- Cards: `bg-white border border-gray-200 hover:border-gray-400 hover:shadow-lg` (remove gold borders/shadows)
- Icon containers: `bg-gray-100` (remove dark brown gradient)
- `text-gold` → `text-gray-600` on icons
- `hover:text-gold` → `hover:text-gray-700` on titles

### 3. `src/components/home/StartingPointSection.tsx`
- Badge: same gray treatment
- Tab container: `bg-gray-100 border border-gray-200` (remove brown/gold)
- Active tab: `bg-black text-white` (remove champagne gradient)
- Cards: `bg-white border border-gray-200` (remove champagne gradient + gold borders)
- Icon containers: `bg-gray-100 border border-gray-200` (remove gold gradient)
- `text-gold` → `text-gray-600`

### 4. `src/components/home/OverseasInvestorsBanner.tsx`
- Badge: gray treatment
- Highlight cards: `bg-white border border-gray-200` (remove champagne)
- Icon containers: `bg-gray-100 border border-gray-200`
- CTA buttons: `bg-black text-white` (remove gold gradient buttons)
- Remove inline gold box-shadow styles

### 5. `src/components/home/FeaturedListings.tsx`
- Badge: gray treatment
- Skeleton loaders: `bg-gray-100 border border-gray-200` (remove champagne)
- Favorites/Shortlist pills: `bg-gray-100 border border-gray-300 text-gray-600` (remove rose/amber colored pills)

### 6. `src/components/home/AreasWeCover.tsx`
- Badge: gray treatment
- Area cards hover: `hover:border-gray-400` (remove `hover:border-gold`)
- Remove gold hover shadows

### 7. `src/components/home/HomepageBookMarquee.tsx`
- Icon container: `bg-gray-100 border border-gray-200` (remove gold gradient)
- `text-gold` → `text-gray-600` on icon
- Header text: `text-black` (remove `text-white` — parent is now white)
- "View Library" link: `text-black` (remove `text-gold`)

### 8. `src/components/home/ResalePropertiesSection.tsx`
- Inner card: `bg-white border border-gray-200` (remove champagne gradient + gold border)

## Footer Polish (minor)

The footer structure is already largely correct. Two small fixes:
- Remove redundant double wrapper divs in Zone 2 (lines 606-614 have nested `rounded-none` wrappers with duplicate borders)
- Simplify Zone 3 same way

## What Will NOT Change

- No layout restructuring
- No content or link removal
- No header/filter changes (already correct)
- Hero section stays as-is (dark overlay with video is intentional)
- `ToolkitShowcaseCard` already correct from prior pass
- `TrustBar` already correct from prior pass
- `DeveloperPortalCTA` already correct from prior pass
- Floating action bar stays at current scale/opacity

## Expected Visual Result

- Every homepage section: white cards, gray borders, black text, black CTAs
- No champagne gradients visible anywhere
- No gold text, borders, or shadows
- Consistent card language (white + gray-200 border + rounded-xl)
- Consistent badge language (gray-100 + gray-300 border + rounded-full)
- Clean CTA buttons (black bg, white text, or outlined gray)
- Footer: clean, no double borders

