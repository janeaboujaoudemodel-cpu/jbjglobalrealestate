## What is actually wrong (verified in the database, not guessed)

There are **two records per project**. The page you are looking at is the thin scraped duplicate, not the real one:

| Slug you opened | Record | Data |
|---|---|---|
| `/project/arya` | `ARYA` (9a7e228e…) | no description, no price, no handover, bedrooms 0-3, sizes 400-1500 → renders "Price TBA", "Coming soon", "Details will be provided by our team" |
| — | `Arya Residences` (898c26d1…) | full description, price from 1.9M, handover 2027-12-31, 1-5 BR, 19 images |
| `/project/agua` | `AGUA` (d37d6d63…) | empty description, no price, no handover |
| — | `Agua Residences` (36517cf3…) | full facts, price 3.44M-5.25M, handover 2027 |

The gallery of the thin records is a raw `<img>` sweep of citideveloper.com. Confirmed rows in `project_images`:

```text
/images/flags/en.png?w=48&q=75   <- UK language-switcher flag
/images/flags/ar.png?w=48&q=75   <- UAE flag
/images/flags/ru.png?w=48&q=75   <- Russian flag
/images/arya/broker-kit/b-1..b-9.png?w=384&q=75   <- broker-kit slides
/images/agua/kit/V-10..V-24.png?w=384&q=75
```

So three separate defects, all reproduced from the data:

1. **Low quality** — every image is requested at `w=384&q=75`, a thumbnail transform. That is why the "FACT SHEET" / "PAYMENT PLAN" / "ART OF NEO LUXURY" tiles look blurry.
2. **Semantic blindness** — broker-kit deck slides (payment plan, fact sheet, cover art) were dumped into the photo gallery instead of being routed to their own sections. Flags were ingested as project photos.
3. **No carousel arrows** — `src/components/ImageCarousel.tsx` has no `ChevronLeft`/`ChevronRight` controls at all; navigation is thumbnails-only.

## Plan

### 1. Media classifier (the real fix — "understand what you extract")
Add a shared classifier used by ingestion and by render time, keying off filename, alt text, image dimensions and OCR/vision of the slide when ambiguous:

- reject: language flags, logos, icons, sprites, anything under ~200px on either side, tracking pixels
- `payment_plan` → Payment Plan section only
- `fact_sheet` / `brochure_page` → documents / fact-sheet section only
- `floor_plan`, `master_plan`, `amenity`, `interior`, `exterior`, `location_map` → their matching sections
- `gallery` → only true renders/photography

Nothing is deleted. Misclassified rows are marked non-gallery so they stop showing as photos, keeping the no-deletion rule intact.

### 2. Full-resolution upgrade
Strip `?w=&q=` thumbnail transforms and re-fetch each asset at source resolution, then re-host in the `project-media` bucket so quality is under our control and stops depending on the developer's Next.js image proxy.

### 3. Consolidate the thin duplicates
`/project/arya` and `/project/agua` point at the enriched records (`Arya Residences`, `Agua Residences`): copy the missing facts (description, price, handover, bedroom range, sizes) onto the records the slugs resolve to, and keep the vetted gallery. No rows dropped.

### 4. Carousel arrows
Add left/right chevrons to `ImageCarousel` (main view and lightbox), keyboard arrow support, gold-on-emerald per brand tokens, shown only when more than one image exists, and visible on mobile as swipe plus tap targets.

### 5. Guard so it cannot regress
A gallery-render guard drops non-photo/oversmall assets even if bad rows are inserted later, plus a rule locked into project memory: **extracted assets must be classified into their section — never bulk-dumped into the gallery.**

### 6. E2E validation with screenshots
Playwright pass on `/project/arya`, `/project/agua`, plus two control projects: assert no flags in gallery, no payment-plan/fact-sheet slides in gallery, arrows present and functional, hero and gallery images load at full resolution, facts populated (no "Price TBA"/"Coming soon"), payment plan renders inside the payment-plan section, zero 4xx in the network log. Screenshots attached for each.

## Technical notes

- New: `src/lib/media/classifyProjectImage.ts` (shared classifier + gallery guard)
- Edited: `src/components/ImageCarousel.tsx`, `src/components/project-detail/ProjectDetailLayout.tsx` (gallery filter), `src/components/project-detail/PaymentPlanVisualization.tsx` (accept classified payment-plan images)
- Ingestion path: `full-project-extract`, `repair-project-extraction`, `extract-citi-developer`, `media-ingestion-classify` route through the same classifier
- Database: one migration adding an image `asset_role` column plus a backfill of existing rows; only role/visibility flags and the missing fact fields on the two slugs are written — nothing deleted
