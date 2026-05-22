## What I found

Service imagery lives in two places:

1. **`public/services/*.jpg`** — 10 bundled JPGs used by `src/components/home/ExploreServicesCard.tsx` (the homepage rotating cards).
2. **Unsplash URLs (`UNSPLASH("…")`)** — 13 hot-linked stock photos in `src/components/home/ExploreServicesExpander.tsx` (the services expander grid).

Result: imagery is inconsistent (owned JPGs vs. random Unsplash), some duplicates (Compare/Eval/Facility reuse other slots), and overall not on-brand premium. User wants ALL service photos regenerated to luxury standard.

## Plan

### 1. Regenerate the 10 existing service backgrounds (in place)

Use `imagegen--generate_image` at **standard** quality, 1600×1000 JPG, premium luxury Dubai real-estate aesthetic — golden hour, marble/champagne/architectural, cinematic, editorial, no text, no people staring at camera. Overwrite the existing files at `public/services/<name>-bg.jpg` so the homepage cards pick them up automatically (filenames unchanged → zero code change for cards).

Files regenerated:
- `buy-property-bg.jpg` — luxury Dubai marina skyline at golden hour, glass towers
- `sell-property-bg.jpg` — premium villa with infinity pool, palm fronds, champagne light
- `rent-property-bg.jpg` — chic Downtown Dubai apartment interior, marble + warm light
- `list-rental-bg.jpg` — elegant landlord-style penthouse living room
- `golden-visa-bg.jpg` — Burj Khalifa silhouette at dusk with gold passport-aesthetic light streaks
- `property-management-bg.jpg` — concierge-grade tower lobby, marble columns, brass accents
- `mortgage-bg.jpg` — refined desk scene: blueprints, brass keys, fountain pen, marble surface
- `passport-visa-bg.jpg` — first-class travel aesthetic: leather portfolio, world map detail, soft gold
- `general-inquiries-bg.jpg` — quiet executive lounge with floor-to-ceiling Dubai view
- `partner-introduction-bg.jpg` — two figures in suits shaking hands silhouetted against city skyline (no faces)

### 2. Add 3 new luxury backgrounds for services missing from the public/ set

The expander currently Unsplash-links these three; create local assets so we own them:
- `public/services/facility-management-bg.jpg` — premium tower exterior with maintenance/architectural detail at twilight
- `public/services/compare-properties-bg.jpg` — moody flat-lay of architectural plans + curated property cards
- `public/services/property-evaluation-bg.jpg` — luxury appraisal scene: scale, blueprint, brass loupe on marble

### 3. Convert `ExploreServicesExpander.tsx` from Unsplash to local assets

Replace the `UNSPLASH(...)` calls with the local `/services/<file>.jpg` paths matched by service id, so the expander and the card slideshow share one consistent, owned, premium image library. No Unsplash hot-links remain. Keep all titles, descriptions, hrefs, icons, and the `available` flag intact (strict no-removal policy).

### Files edited / created

- **Regenerate (overwrite)**: 10 files in `public/services/*.jpg`
- **Create**: 3 files in `public/services/` (facility-management, compare-properties, property-evaluation)
- **Edit**: `src/components/home/ExploreServicesExpander.tsx` — swap `UNSPLASH(...)` for local paths; remove the helper

### Technical notes

- Use `imagegen--generate_image` model `standard`, dims `1600×1000` (target_path must end `.jpg`). One call per image (13 total). Calls are parallelized in two batches to stay within tool limits.
- No DB / no backend / no new deps.
- Champagne-gold design standard preserved; no in-image text.
- Card and expander components keep their existing layout, transitions, and gradients — only the source pixels change.
