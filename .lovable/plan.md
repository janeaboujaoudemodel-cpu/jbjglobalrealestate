

# Redesign Awards Page with All 18 Real Award Photos

## Overview

Complete rewrite of the Awards page to replace the 6 placeholder icon cards with all 18 real award photos (10 previously uploaded + 8 new ones). The page will feature a premium gallery layout with a hero spotlight, chronological sorting, and rich award details.

## Complete Awards List (18 Awards, Chronologically Sorted)

| # | Image File | Award Title | Organization | Year |
|---|-----------|-------------|-------------|------|
| 1 | Untitled_design_21.PNG | Partnership Recognition | Dubai Holding | 2018 |
| 2 | Untitled_design_22.PNG | Top Broker Award | Emaar | 2019 |
| 3 | Untitled_design_23.PNG | 1st Place - Top Performing Q4 | Meraas | 2019 |
| 4 | Untitled_design_34.PNG | 2nd Place - Top Performing Broker Q3 | Meraas | 2019 |
| 5 | JBJ_GLOBAL_REAL_ESTATE.PNG | Elite Partners of Q3 | DAMAC | 2020 |
| 6 | Untitled_design_24.PNG | Top Agency Q1 Broker Awards | DAMAC | 2021 |
| 7 | Untitled_design_25.PNG | Quarter 2 Broker Awards - No. 11 | Emaar | 2021 |
| 8 | Untitled_design_33.PNG | Quarter 2 Broker Awards - No. 11 | Emaar | 2021 |
| 9 | Untitled_design_26.PNG | 1st Place - Top Performing Partner | Tilal Al Ghaf / Majid Al Futtaim | 2021 |
| 10 | Untitled_design_27.PNG | Top Performer Q3 | DAMAC | 2021 |
| 11 | Untitled_design_28.PNG | The Diamond Club - No. 1 Performing Partner | Meydan | 2022 |
| 12 | Untitled_design_29.PNG | The Black Onyx Awards | Dubai Properties / Meraas | 2023 |
| 13 | Untitled_design_30.PNG | Quarter 2 Broker Awards - No. 12 | Emaar | 2023 |
| 14 | Untitled_design_19.PNG | JBJ Recognition Trophy | JBJ Global | -- |
| 15 | Untitled_design_20.PNG | Top Broker Award | Sobha Realty | -- |
| 16 | Untitled_design_31.PNG | Quarter 3 Broker Awards - No. 2 | Emaar | 2024 |
| 17 | Untitled_design_32.PNG | Quarter 3 Broker Awards - No. 2 | Emaar | 2024 |
| 18 | Untitled_design_35.PNG | 3rd Highest Performing Channel Partner | Sobha Realty | 2024 |

Note: Images 7/8 (Emaar Q2 2021) and 16/17 (Emaar Q3 2024) appear to be different angles/presentations of the same award. Both will be included since the user uploaded them as separate items.

## Implementation

### Step 1: Copy all 18 images to `src/assets/awards/`

Each image gets a descriptive filename for clean imports.

### Step 2: Rewrite `src/pages/Awards.tsx`

**Keep unchanged:** Hero section, Stats counter section, CTA section.

**Replace entirely:** The placeholder awards grid section (lines 92-133).

**New awards grid features:**
- Data-driven array of 18 award objects with `image`, `title`, `organization`, `year`
- Awards sorted chronologically (2018 to 2024), undated awards at the end
- Each card displays:
  - Award photo in a square container with `object-contain` on a dark background (black/near-black) so trophies stand out beautifully against their original backgrounds
  - Gold border with hover glow + lift effect
  - Award title (bold, black text)
  - Organization name (gold text)
  - Year badge in the top-right corner
- Grid: 1 column mobile, 2 columns tablet, 3 columns desktop
- Updated section subtitle to reflect that real awards are now shown

### Card Design

```text
+-------------------------------+
|  [Year Badge]          top-right
|                               |
|     [Award Photo]             |
|     object-contain            |
|     dark bg container         |
|                               |
+-------------------------------+
|  Award Title (bold)           |
|  Organization (gold)          |
+-------------------------------+
```

- Image container: `aspect-square bg-zinc-900 rounded-t-xl` with the photo using `object-contain` so the full trophy/certificate is visible
- Text area: champagne gradient background (`jj-card-inner`) with gold border
- Hover: `hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)]`
- Year badge: small gold pill positioned top-right over the image

### Technical Details

**Files modified:**
- `src/pages/Awards.tsx` -- rewrite the awards grid section only, keep hero/stats/CTA
- 18 new image files copied to `src/assets/awards/`

**No new dependencies required.** Uses existing design system classes.

