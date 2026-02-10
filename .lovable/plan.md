

# Add "High Demand" Label + Real Photos/Descriptions for Areas

## Overview
Add a new `is_high_demand` boolean column to the `areas` table, display it as a badge on area cards and hero sections, and populate real photos and descriptions for areas currently missing them (like Dubai Islands).

---

## 1. Database: Add `is_high_demand` Column

Add a new boolean column `is_high_demand` (default `false`) to the `areas` table. Then set it to `true` for high-demand areas like Dubai Islands, Business Bay, JVC, Dubai Hills, Downtown Dubai, and Palm Jumeirah.

**Migration SQL:**
```sql
ALTER TABLE areas ADD COLUMN is_high_demand boolean DEFAULT false;
UPDATE areas SET is_high_demand = true WHERE slug IN (
  'dubai-islands', 'business-bay', 'jvc-jumeirah-village-circle',
  'dubai-hills', 'downtown-dubai', 'palm-jumeirah'
);
-- Also mark Dubai Islands as trending
UPDATE areas SET is_trending = true WHERE slug = 'dubai-islands';
```

---

## 2. Database: Populate Missing Photos and Descriptions

Update areas that currently have `NULL` image/description with real data. For Dubai Islands and other key areas missing content, insert real Unsplash/stock hero images and premium 1-2 sentence descriptions.

**Example for Dubai Islands:**
```sql
UPDATE areas SET
  image_url = 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=800&q=80',
  hero_image_url = 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=1920&q=80',
  description = 'Dubai Islands is a premier waterfront destination featuring luxury residences, pristine beaches, and world-class retail along the Arabian Gulf coastline.'
WHERE slug = 'dubai-islands';
```

Similar updates for: Dubailand Residence Complex, JVT, Arjan, Abu Dhabi, Meydan, Jebel Ali Village, Al Marjan Island, Dubai Hills, Al Furjan, and others missing images.

---

## 3. TypeScript: Update Area Interface

In `src/hooks/useAreas.ts`, add `is_high_demand` to the `Area` interface:
```typescript
is_high_demand: boolean;
```

---

## 4. UI: "High Demand" Badge on Area Cards (AreaGuides.tsx)

Next to the existing "TRENDING" badge on area cards, add a red/orange "HIGH DEMAND" badge when `is_high_demand` is true:
```tsx
{area.is_high_demand && (
  <Badge className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-3 py-1 text-[10px] font-bold tracking-wider shadow-lg">
    <Flame className="w-3 h-3 mr-1" />
    HIGH DEMAND
  </Badge>
)}
```

Position it below or beside the trending badge in the top-right corner of the card photo.

---

## 5. UI: "High Demand" Badge on Area Detail Hero (AreaHeroSection.tsx)

Add a "High Demand" pill next to the existing "Trending" pill in the hero section:
```tsx
{area.is_high_demand && (
  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
    <Flame className="w-3 h-3" />
    High Demand
  </span>
)}
```

---

## 6. UI: Stats Row on Cards

Add a "High Demand" indicator in the stats row at the bottom of area cards (alongside Trending):
```tsx
{area.is_high_demand && (
  <div className="flex items-center gap-1">
    <Flame className="w-3.5 h-3.5 text-red-500" />
    <span className="text-red-500">High Demand</span>
  </div>
)}
```

---

## Files to Modify

| File | Change |
|------|--------|
| Database migration | Add `is_high_demand` column, set values, populate missing images/descriptions |
| `src/hooks/useAreas.ts` | Add `is_high_demand: boolean` to Area interface |
| `src/pages/AreaGuides.tsx` | Add High Demand badge on cards (photo overlay + stats row) |
| `src/components/area-detail/AreaHeroSection.tsx` | Add High Demand pill next to Trending |
| `src/components/home/AreasWeCover.tsx` | No change needed (text-only grid, no badges) |

---

## Summary
- New DB column `is_high_demand` with data for 6+ areas
- Real photos and descriptions populated for all areas missing them
- Red/orange "HIGH DEMAND" badge with flame icon shown on cards and hero sections
- Works alongside existing "TRENDING" badge -- areas can be both trending and high demand

