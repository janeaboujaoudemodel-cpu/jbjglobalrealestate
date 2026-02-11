
## What you reported (grouped)
1) Developer detail page (example: /developer/meraas)
- Hero background image shows missing/blank.
- Developer logo inside the framed tile is not “full fit” (white corners/edges showing).
- Headquarters line is too specific (shows “Sales Boutique / Trade Center …” instead of just “Dubai, UAE”).

2) Developer projects map
- Markers + popups show “POA” for many projects.

3) Listing cards (project cards across the site, including developer pages)
- “Project general facts” text appears in the card preview text.
- Project titles are truncated with ellipsis (three dots) — not allowed.
- Sold status appears in multiple places; you only want Sold badge top-left, not repeated inside the content area.
- Developer “by X” styling isn’t consistently pure gold (some looks orange/gradient).

4) Active tab/button styling
- The active state still uses the old solid gold “yellow” fill (you want the newer subtle active background style, not the old gold fill).

---

## Root causes found in code
### A) Missing hero image on developer page
In `src/pages/DeveloperDetail.tsx` the hero uses:
```ts
src={getHighResImageUrl(developer.feature_image_url)}
```
`getHighResImageUrl()` rewrites CloudFront `/x/260x200/...` into `/x/1920x1080/...`. For some developer feature images (including Meraas), that “high-res” size URL can fail, resulting in a broken hero image even though `feature_image_url` exists in the database.

### B) Logo “not full fit” in the developer header tile
`DeveloperDetail.tsx` renders the logo with:
- a white background tile
- `object-contain` plus padding (`p-2`)
This guarantees visible edges for logos that have internal whitespace or a dark “block” that should fill the frame.

### C) HQ too specific
`DeveloperDetail.tsx` displays `developer.headquarters` as-is, which currently contains long “Sales Boutique” addresses for some developers (Meraas, etc.).

### D) “POA” on the map
`src/components/developer/DeveloperProjectsMap.tsx` returns `"POA"` when `price_from` is null and uses `"POA"` inside marker labels too.
`src/pages/PropertyMap.tsx` also uses `"POA"` in multiple places.

### E) Ellipsis on titles + “Project general facts” in card previews
`src/components/ProjectCard.tsx` uses `line-clamp-1` for titles (ellipsis).
It also previews `project.description` raw without applying `formatReellyDescription()` / `stripMarkdown()`, so the string “Project general facts” can leak into the preview.
Additionally, the description paragraph uses `line-clamp-2`, which can hide the “…more” affordance unpredictably.

### F) “By developer” mixed gold/orange
`src/components/ui/developer-link.tsx` uses a gradient:
`from-gold via-handover to-gold`
Your “handover” color reads orange, so the developer name appears gold/orange instead of pure gold.

### G) Active state old gold fill
`src/components/EmiratesTabs.tsx` uses `bg-gold text-black` for the active tab — exactly the “old solid gold” look you don’t want.

---

## Implementation plan (what I will change)

### 1) Fix developer hero image reliably (no more blank hero)
**File:** `src/pages/DeveloperDetail.tsx`

- Replace the raw `<img src={getHighResImageUrl(...)}>` with `SafeImage` and a fallback chain:
  - Primary: `getHighResImageUrl(developer.feature_image_url)` (try best quality)
  - Fallback: the original `developer.feature_image_url` (guaranteed to exist if the record has it)
  - Final fallback: the existing gradient background (already there)

**Acceptance criteria**
- Meraas shows a hero image (not blank).
- Other developers still show their hero images.
- If “high res” fails, the hero still displays using the original URL automatically.

---

### 2) Make the developer logo tile “full fit” (bigger, centered, no white corners)
**File:** `src/pages/DeveloperDetail.tsx`

- Update the logo tile wrapper and image rendering to match the already-approved “full-fit logo” approach used elsewhere:
  - remove inner padding (p-0)
  - use a solid background that hides corners (black for dark logos) while keeping the gold border
  - change logo image from `object-contain p-2` to a full-fit render strategy:
    - default: `object-cover` + `transform: scale(1.15–1.25)` (starting at 1.2)
  - keep `overflow-hidden` so the frame clips perfectly

**If any single logo gets cropped too aggressively**
- Add a small per-developer override in `DeveloperDetail.tsx` (like we did for marquee) to adjust:
  - `fit: "cover" | "contain"`
  - `scale`
This keeps it perfect for Meraas without breaking others.

**Acceptance criteria**
- Meraas logo looks full-fit (no white corners/edges) and centered.
- The logo appears visibly larger inside the frame.

---

### 3) Headquarters display: show only city + country (e.g., “Dubai, UAE”)
**Files:**
- `src/pages/DeveloperDetail.tsx`
- `src/components/DeveloperGrid.tsx` (it also displays headquarters)
- (optional) anywhere else headquarters appears in user-facing UI

- Implement a small formatter (either inline or a tiny utility) that:
  - takes the last 2 comma-separated parts (e.g., “Dubai, UAE”)
  - removes “Sales Boutique / Building / Tower / Floor” style address details automatically

**Acceptance criteria**
- Meraas HQ displays “Dubai, UAE” (not the boutique address).
- Dubai Properties displays “Dubai, UAE” (not “Sales Boutique …”).
- If a developer truly has HQ outside Dubai, it still shows as “City, Country” (no street-level detail).

---

### 4) Remove “POA” from maps and replace with clear text (or hide)
**Files:**
- `src/components/developer/DeveloperProjectsMap.tsx`
- `src/pages/PropertyMap.tsx`
- (optional follow-up) any other map/marker formatter using “POA” (search shows StudioEditor also has it)

Changes:
- Replace “POA” with:
  - marker label: `Ask` (short, readable in a pill)
  - popup label: `Price on request`
This avoids the confusing abbreviation and stops the “POA POA POA” effect.

**Acceptance criteria**
- No “POA” visible on the developer map or property map.
- Projects without `price_from` show “Ask” / “Price on request”.

---

### 5) Listing cards: no ellipsis on titles, remove “Project general facts”, keep “…more” visible, fix sold duplication
**Files (minimum):**
- `src/components/ProjectCard.tsx` (main card used across Properties, DeveloperDetail projects grid, Featured listings, etc.)
- `src/components/ReellyProjectCard.tsx` (if still used anywhere public-facing)
- `src/components/project-detail/RecommendedProjects.tsx` (title currently line-clamped)

**Project title (no three dots)**
- Remove `line-clamp-1` from project titles.
- Ensure wrapping works cleanly:
  - `whitespace-normal break-words leading-tight`
  - (optional) add consistent spacing using a `min-h` title area to keep cards tidy while still showing the full title.

**Description preview cleanup**
- Before truncation, sanitize the text:
  - `stripMarkdown(formatReellyDescription(project.description))`
  - this removes “Project general facts” and other raw headings.
- Replace the CSS `line-clamp-2` approach with manual truncation so “…more” is always visible and never gets clipped away by the clamp.
- Keep the word “more” as the affordance exactly as you requested (e.g., `…more`).

**Sold duplication**
- Remove “Sold” text in the price row when sold out.
- Keep only the top-left “Sold Out” badge.

**Developer “by X” consistency**
- Ensure all cards use `DeveloperLink` (clickable) so:
  - “by ” stays neutral
  - developer name is pure gold
  - consistent everywhere

**Acceptance criteria**
- Long project names (e.g., “Jumeirah Residence …”) are fully readable (wraps, no ellipsis).
- “Project general facts” never appears in card previews.
- Sold status appears only as the top-left badge, not repeated in the content.
- “…more” is visible on all project cards that show descriptions.

---

### 6) Developer name color: remove orange/gradient and enforce pure gold everywhere
**File:** `src/components/ui/developer-link.tsx`

- Change developer name styling from gradient (`via-handover`) to pure gold:
  - `text-gold font-semibold`
  - keep hover underline
- Keep the “always clickable to /developer/:slug” rule intact.

**Acceptance criteria**
- Developer names never look orange.
- Developer names are consistently gold wherever “by Developer” appears.

---

### 7) Active button/tab styling: remove the old solid gold fill
**File:** `src/components/EmiratesTabs.tsx`

- Replace active state from:
  - `bg-gold text-black border-gold`
to a subtler, “new standard” active style that sits on the background layer:
  - `bg-gold/10 text-gold border-gold/60`
  - optional: a lighter shadow that doesn’t look like the old yellow pill

**Acceptance criteria**
- Active tab no longer looks like the old bright solid gold.
- Active state is clearly visible and premium.

---

## How I will verify (end-to-end)
1) Go to `/developers` → click Meraas → confirm hero image appears.
2) Confirm Meraas logo tile is full-fit and centered (no white corners).
3) Confirm HQ is displayed as “Dubai, UAE”.
4) Confirm developer map markers/popup never show “POA”.
5) Scroll to the projects grid:
   - titles wrap fully (no ellipsis)
   - developer “by Meraas” is pure gold
   - description preview has “…more” and no “Project general facts”
   - sold projects show sold only in the top-left badge
6) Confirm Emirates tabs active state uses the new subtle styling (not solid gold).

---

## Files expected to change
- `src/pages/DeveloperDetail.tsx`
- `src/components/ui/developer-link.tsx`
- `src/components/EmiratesTabs.tsx`
- `src/components/developer/DeveloperProjectsMap.tsx`
- `src/pages/PropertyMap.tsx`
- `src/components/ProjectCard.tsx`
- `src/components/ReellyProjectCard.tsx` (if used publicly)
- `src/components/project-detail/RecommendedProjects.tsx`
- `src/components/DeveloperGrid.tsx` (HQ formatting consistency)
