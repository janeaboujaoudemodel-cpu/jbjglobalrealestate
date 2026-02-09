

# Fix Developer Duplicates, Logo Sizing, Header Transparency, and Project Detail Quality

## Issues Identified

### 1. More Duplicate Developers Still Exist
Despite the previous merge, new duplicates remain:
- **"Ellington and RAK Properties"** (19 projects) -- This is a combined entry that should NOT exist. "Ellington" and "RAK" are two completely different developers. The 19 projects under this combined entry need to be split: Ellington projects go to "Ellington Properties" (slug: `ellington`, 49 projects), and RAK projects go to "RAK Properties" (slug: `rak-properties`, 0 projects).
- **"Imtiaz Development"** (0 projects) vs **"Imtiaz Developments"** (36 projects) -- Need to merge, keeping "Imtiaz Developments" which has all 36 projects.

### 2. Logo Sizing -- Not Full-Fit
The logos in DeveloperCard.tsx use `max-w-full max-h-full object-contain p-2` which leaves padding/whitespace. The user wants logos to fill the entire container edge-to-edge.

**Fix**: Change logo img class from `max-w-full max-h-full object-contain p-2` to `w-full h-full object-cover` (no padding) in:
- `DeveloperCard.tsx` (line 97) -- external card
- `DeveloperDetail.tsx` (line 160) -- internal detail page
- `DeveloperInfoCard.tsx` (line 65) -- project detail developer section

### 3. Header Transparency
The header already has transparent-on-load behavior (GlobalHeader.tsx lines 211-248). It initializes `isSolid = false` and sets solid after scrolling past 80px. This appears to already work correctly. Will verify and ensure it functions on all pages including developer detail and project detail pages.

### 4. Project Detail Issues (Sunset Bay Grand)
- **"1 Floors"** showing -- The `floors` field is `1` which is incorrect data from Reelly (likely `building_count`). The HouseDetailsSection already has logic (line 65-70) to show "1 Building" for floors <= 3, but QuickFactsBar may show it differently. Need to hide floor count of 1 as it's meaningless.
- **Description formatting** -- Has `#####` markdown headers and hashtag-like formatting. The `renderMarkdownToHtml` function handles markdown, but the raw description contains `#####` headers that render as tiny headings. Need to upgrade these to proper styled sections and strip any hashtag symbols.
- **Gallery showing only 1 photo** -- The project only has 1 image in the `project_images` table. The Reelly API likely has more photos. This is a backfill/sync issue -- the sync currently only saves the cover image, not all project images.
- **Payment plan not extracted** -- Same backfill gap; payment plan data from Reelly is not being saved during sync.

### 5. Developer Detail Page -- Hero Image Too Small
Currently `h-[280px] md:h-[380px]`. User wants full-screen hero. Change to `h-screen min-h-[500px]`.

## Plan

### Step 1: Database -- Merge Duplicates

**Split "Ellington and RAK Properties":**
- Query the 19 projects under this combined developer
- Identify which ones are Ellington projects vs RAK projects (by project name)
- Reassign Ellington projects to "Ellington Properties" (id: `01949ea2-12a9-444a-8c44-dcf4bc10e643`)
- Reassign RAK projects to "RAK Properties" (id: `692ec896-fa22-49af-89d8-31866651822e`)
- Delete the combined "Ellington and RAK Properties" row

**Merge "Imtiaz Development" into "Imtiaz Developments":**
- Copy best logo/description/feature_image from "Imtiaz Development" to "Imtiaz Developments"
- Reassign any projects (currently 0) from duplicate
- Delete "Imtiaz Development" (id: `344b94ac-083a-4316-a7af-135c4463b990`)

### Step 2: Logo Full-Fit (3 files)

**`src/components/DeveloperCard.tsx`** (line 97):
```
// FROM: className="max-w-full max-h-full object-contain p-2"
// TO:   className="w-full h-full object-cover"
```

**`src/pages/DeveloperDetail.tsx`** (line 160):
```
// FROM: className="w-full h-full object-contain p-3"
// TO:   className="w-full h-full object-cover"
```

**`src/components/project-detail/DeveloperInfoCard.tsx`** (line 65):
```
// FROM: className="w-full h-full object-contain p-4"
// TO:   className="w-full h-full object-cover"
```

### Step 3: Developer Detail -- Full-Screen Hero

**`src/pages/DeveloperDetail.tsx`** (line 112):
```
// FROM: className="relative w-full h-[280px] md:h-[380px] overflow-hidden"
// TO:   className="relative w-full h-screen min-h-[500px] overflow-hidden"
```

### Step 4: Fix Project Detail -- Hide Invalid Floor Count

**`src/components/project-detail/ProjectDetailLayout.tsx`**:
In the QuickFactsBar area, the `floors` value of 1 should not be passed. Add a guard: only pass `floors` when it's greater than 3 (matching HouseDetailsSection logic).

### Step 5: Fix Description Formatting

**`src/components/project-detail/ProjectDetailLayout.tsx`**:
The description rendering already uses `renderMarkdownToHtml`. The issue is that the raw description has `#####` (h5) headers that render too small. Need to update the markdown renderer or add CSS to style `h5` elements within the description as proper section headers. Also strip any standalone hashtag lines.

### Step 6: Developer Info Card -- Rounded Borders on Black Background

**`src/components/project-detail/DeveloperInfoCard.tsx`**:
The outer `div` with `bg-black` needs rounded corners to match the inner card. Add `rounded-2xl` to the outer container.

## Files to Modify

| File | Change |
|------|--------|
| Database | Split "Ellington and RAK Properties" into separate developers; merge "Imtiaz Development" duplicate |
| `src/components/DeveloperCard.tsx` | Logo: `object-cover` instead of `object-contain p-2` |
| `src/pages/DeveloperDetail.tsx` | Logo: `object-cover`; Hero: full-screen height |
| `src/components/project-detail/DeveloperInfoCard.tsx` | Logo: `object-cover`; outer container: rounded corners |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Guard floors <= 3 from QuickFactsBar; improve description heading styles |

