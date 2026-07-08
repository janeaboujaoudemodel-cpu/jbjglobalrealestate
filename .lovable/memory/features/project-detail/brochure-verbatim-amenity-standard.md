---
name: Brochure-Verbatim Amenity Standard (LOCKED — Global)
description: Project amenity titles MUST match the developer's brochure/factsheet verbatim. Never rename. Missing photos are generated in the project's brand palette. Applies to every project including new uploads.
type: constraint
---

# Brochure-Verbatim Amenity Standard (LOCKED)

Applies globally to every project detail page — AMRA today, every existing and every newly uploaded project tomorrow. This rule overrides any earlier "shorter title" or "consistent phrasing" habit.

## Rules — non-negotiable

1. **Title = brochure verbatim.** Every amenity title on a project page must match the exact wording in the developer's uploaded brochure / factsheet. Do not rename, shorten, pluralize, re-case, or "clean up" ("Smart Recovery Boots" ≠ "Smart Recovery Hub"; "Full-service Beauty Salon" ≠ "Beauty Salon"; "Isabella Cucina Italiana" ≠ "Isabella Cucina Restaurant"). Preserve `&`, apostrophes, and capitalization from the source.
2. **Photo = brochure photo.** Match each amenity to the brochure-cropped or officially-supplied photo. Never pair a title with an unrelated stock image.
3. **Generate only when no source photo exists.** After exhausting every uploaded document (brochure, factsheet, supporting decks), only then generate a photo. Generated images must:
   - Use the project's brand palette (AMRA = warm champagne / cream / emerald / soft gold, resort-lagoon light).
   - Be photorealistic and relevant to the specific amenity title.
   - Never contain text overlays, logos, or watermarks.
   - Be saved to `src/assets/<project-slug>-brochure/` alongside the brochure crops.
4. **No duplicate photos on the same paginated page.** Enforced by `paginateAmenities()` in `AmenitiesWithPhotos.tsx`.
5. **New project uploads inherit this contract.** When onboarding a project, extract the amenity list from the uploaded brochure verbatim, pair with supplied media, and generate only for the residual set.
6. **Any deviation is a bug.** If a rename is unavoidable (e.g. two brochure sections use different wording for the same room), keep the brochure wording and add a comment explaining the mapping — do not silently rename.

## AMRA reference

Source of truth: `src/assets/amra-factsheet.pdf.asset.json` (AMRA English Factsheet).
Roster + image map lives in `ProjectDetailLayout.tsx` (`amraAmenities`, `amraAmenityImages`).
Brochure crops live in `src/assets/amra-brochure/`.
