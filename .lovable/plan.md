
# Two Changes: Featured Area Cards with Photos + Champagne Book Redesign

## Change 1 — AreasWeCover: Featured Photo Cards (8 areas, 2 rows)

### Current State
The component shows 12 plain text links in a 6-column grid with no photos. Just a champagne pill with the area name. No trending badges.

### New Design
- Limit to **8 areas** (2 rows of 4 on desktop, 2 rows of 2 on mobile)
- Each card is a **tall photo card** (~200px) with:
  - Full-bleed `background-image` photo from `image_url` (already in the DB — all 8 top areas have real photos)
  - Champagne-gold gradient overlay from transparent at top to deep black at bottom
  - Area name in white bold text at the bottom
  - If `is_trending = true` → gold "Trending" pill badge top-right
  - If `is_high_demand = true` → red/amber "High Demand" pill badge top-right (below trending if both)
  - Gold 3px border on hover with lift animation (`whileHover={{ y: -6 }}`)
  - Property count shown as a small badge bottom-left: e.g. "184 Projects"
- Grid: `grid-cols-2 md:grid-cols-4` → 2 rows of 4 cards on desktop, 2 rows of 2 on mobile
- Fallback: if no `image_url`, show the champagne gradient with JBJ monogram at 10% opacity (same standard as area guides)

### Data Available
From the DB query, all 8 top areas have valid photo URLs in `image_url` pointing to Supabase Storage:
- JVC: `jvc-jumeirah-village-circle.jpg` (is_high_demand: true)
- Dubai Islands: `dubai-islands.png` (is_trending: true, is_high_demand: true)
- Business Bay: `business-bay.png` (is_trending: true, is_high_demand: true)
- Dubailand: `dubailand-residence-complex.jpg`
- Al Marjan Island: `al-marjan-island.png` (is_trending: true)
- Arjan: `arjan.png`
- JVT: `jvt-jumeirah-village-triangle.png`
- Abu Dhabi: `abu-dhabi.png`

### Layout Structure
```text
┌─────────────────────────────────────────────────────────────┐
│  [MapPin] EXPLORE DUBAI          Areas We Cover             │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  PHOTO   │ │  PHOTO   │ │  PHOTO   │ │  PHOTO   │      │
│  │          │ │[Trending]│ │[Trending]│ │          │      │
│  │          │ │          │ │          │ │          │      │
│  │ 184 proj │ │ Dubai    │ │ Business │ │ Dubailand│      │
│  │ JVC      │ │ Islands  │ │ Bay      │ │          │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  PHOTO   │ │  PHOTO   │ │  PHOTO   │ │  PHOTO   │      │
│  │[Trending]│ │          │ │          │ │          │      │
│  │ Al Marjan│ │ Arjan    │ │ JVT      │ │ Abu Dhabi│      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│              [ View All Areas → ]                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Change 2 — MarketReportHeroBook: Champagne/Pearl/Gold Theme

### Current State
The book cover uses a **dark theme**: `bg-gradient-to-br from-zinc-900 via-black to-zinc-900`, white title text, zinc-grey borders, very dark interior. The spine is dark zinc. The pages edge is zinc.

The **surrounding section** in `Index.tsx` (line 439) already has the correct champagne palette: `bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`.

### User Requirement
The book itself should match the champagne/pearl/gold theme of its surrounding section — not be dark. The aesthetic should feel like a luxury coffee-table book: pearl-white cover, champagne interior, gold accents, black text.

### New Book Design
Replace the current dark zinc theme with a champagne-pearl-gold luxury book:

**Cover background**: `bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#D4C4A8]` — pearl white fading to warm champagne

**Cover image**: Keep the luxury villa photo but use `opacity-40` (lighter since bg is light now)

**Cover border**: `border-2 border-gold/60` with a gold shadow glow

**Book spine** (left edge): `bg-gradient-to-r from-[#C8A766] via-[#E8DCC8] to-transparent` — a rich gold spine visible on the left

**Spine text**: `text-black` (readable on gold background), rotated as before

**Title text**: `text-black` (not white — since background is now light)

**Gold accent line**: Keep the `from-gold to-gold-dark` horizontal rule — this works great

**"Latest Edition 2026" badge**: `bg-gold/20 border border-gold/50 text-black` (was gold text, now black for contrast)

**Publisher line**: `text-zinc-600` (was zinc-400, need darker for light bg)

**Border separator**: `border-t border-gold/30` instead of `border-zinc-800`

**Pages edge effect** (right side): Use `bg-gradient-to-l from-[#F5EBD7]/30 via-[#E8DCC8]/20 to-transparent` — warm champagne page edges instead of cold zinc

**Book shadow**: `20px 20px 60px rgba(0,0,0,0.4), -5px -5px 20px rgba(200,167,102,0.3)` — reduced dark shadow, added gold ambient glow

**Floating "Free Download" badge**: Already uses champagne gradient — keep as-is

**Founder byline**: `text-zinc-500` → `text-zinc-600` (darker for readability on light bg)

### Visual Comparison
```text
BEFORE (dark):                   AFTER (champagne):
┌────────────────┐               ┌────────────────┐
│ ▓▓▓▓ zinc-900 │               │ ░░░░ pearl     │
│ [villa photo   │               │ [villa photo   │
│  opacity 60%]  │               │  opacity 40%]  │
│                │               │                │
│ ▬▬▬▬ gold bar │               │ ▬▬▬▬ gold bar  │
│ [gold badge]   │               │ [black badge]  │
│ UAE Real Estate│               │ UAE Real Estate│
│ [white text]   │               │ [black text]   │
│ Market Intel   │               │ Market Intel   │
│ [gold text]    │               │ [gold text]    │
│ ─────zinc─────│               │ ─────gold──────│
│ JBJ [zinc-400] │               │ JBJ [zinc-600] │
└────────────────┘               └────────────────┘
```

---

## Files to Change

| File | What Changes |
|---|---|
| `src/components/home/AreasWeCover.tsx` | Full redesign: photo cards with gradient overlay, trending/high-demand badges, property count, limit to 8, 2×4 grid layout |
| `src/components/MarketReportHeroBook.tsx` | Replace dark zinc theme with champagne/pearl/gold: bg, spine, text colors, border, shadow, page edges |

## What Does NOT Change
- `useAreas` hook — works correctly, just change `limit: 12` → `limit: 8`
- The wrapping section in `Index.tsx` — stays exactly as-is (already champagne)
- `MarketReportCTA.tsx` — the button and benefits list around the book stay unchanged
- The `/market-report` page — unchanged
- All other homepage sections — locked per memory constraint
- Database schema — no changes needed
