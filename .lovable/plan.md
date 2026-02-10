

# Redesign Awards Page with Real Award Photos

## Overview

Replace the 6 placeholder award cards with 10 real award photos uploaded by the user. Each card will feature the actual trophy/certificate image with proper award details extracted from the photos. The page will use a premium gallery-style layout.

## Awards Identified from Photos

| # | Image File | Award Title | Organization | Year |
|---|-----------|-------------|-------------|------|
| 1 | JBJ_GLOBAL_REAL_ESTATE.PNG | Elite Partners of Q3 2020 | DAMAC | 2020 |
| 2 | Untitled_design_19.PNG | JBJ Recognition Trophy | JBJ Global | - |
| 3 | Untitled_design_20.PNG | Top Broker Award | Sobha Realty | - |
| 4 | Untitled_design_21.PNG | Partnership Recognition | Dubai Holding | 2018 |
| 5 | Untitled_design_22.PNG | Top Broker Award | Emaar | 2019 |
| 6 | Untitled_design_23.PNG | 1st Place - Top Performing Q4 | Meraas | 2019 |
| 7 | Untitled_design_24.PNG | Top Agency Q1 Broker Awards | DAMAC | 2021 |
| 8 | Untitled_design_25.PNG | Quarter 2 Broker Awards - No. 11 | Emaar | 2021 |
| 9 | Untitled_design_26.PNG | 1st Place - Top Performing Partner | Tilal Al Ghaf / Majid Al Futtaim | 2021 |
| 10 | Untitled_design_27.PNG | Top Performer Q3 | DAMAC | 2021 |

## Implementation

### Step 1: Copy all 10 images to `src/assets/awards/`

Copy each uploaded image into the project so they can be imported as ES6 modules in the React component.

### Step 2: Rewrite `src/pages/Awards.tsx`

**Replace the placeholder cards section** with a data-driven awards grid:

- Define an array of award objects, each with: `image` (imported asset), `title`, `organization`, `year`, `description`
- Awards sorted chronologically (2018 to 2021)
- Each card shows:
  - Large photo (aspect-ratio square, object-contain on a dark/champagne background so the trophy is fully visible)
  - Gold border with hover glow effect
  - Award title in bold
  - Organization name in gold
  - Year badge in top-right corner
- Grid layout: 2 columns on mobile, 3 columns on desktop (same as current)
- Hero section: Replace the JBJ trophy image (Untitled_design_19.PNG) as a hero background or featured spotlight at the top
- Keep the existing Stats counter section and CTA section unchanged

### Card Design (Premium Style)

Each award card will have:
- A square image container with `object-contain` and a subtle champagne-to-white gradient background so the trophy stands out
- Gold border (`border-2 border-gold`)
- Hover effect: lift + gold shadow glow
- Below the image: award title (bold, black text), organization (gold text), year (small badge)
- No generic icons -- real photos only

### Hero Enhancement

Use the JBJ trophy photo (Untitled_design_19.PNG) as a featured "hero award" spotlight above the grid, displayed larger with a premium dark background and gold accents.

### Technical Details

**Files modified:**
- `src/pages/Awards.tsx` -- complete rewrite of the awards grid section
- 10 new image files copied to `src/assets/awards/`

**Imports pattern:**
```text
import award1 from "@/assets/awards/damac-elite-q3-2020.png";
import award2 from "@/assets/awards/jbj-trophy.png";
// ... etc
```

**No new dependencies required.** Uses existing design system classes (`jj-layer-2`, `jj-layer-active`, `jj-card-inner`, `border-gold`).

