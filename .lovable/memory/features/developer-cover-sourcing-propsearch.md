---
name: Developer Cover Sourcing via propsearch.ae (approved channel)
description: How to source missing developer building photos from propsearch.ae developer profile pages, including the index URL, rate limits and matching rules.
type: feature
---

# propsearch.ae — approved cover source for developer cards

- Full developer index (2,167 profile links, one request):
  `https://propsearch.ae/dubai-construction-specialists/property-developers`
  → links of the form `https://propsearch.ae/dubai-property-developers/<slug>`
- Each profile page carries the developer's real project/building photos as
  `https://static.propsearch.ae/dubai-locations/<project>_XXXX.jpg` (and `/media/large/...`).
  Skip `_sm.` thumbnails and the area-link thumbnails at the bottom of the page.
- **No logos** on propsearch — logos must still come from the developer's own site/Instagram.
- Rate limiting: the site returns **429** after ~20 fast requests. Fetch sequentially with
  ~1.2s delay and a 20s backoff on 429. Never brute-force slug guessing — match names against
  the downloaded index locally.
- Matching: normalise both names by dropping generic tokens (real/estate/development/properties/
  llc/group/holding/investment) and require an exact normalised match (difflib ratio 1.0).
  Fuzzy matches are rejected (e.g. `Kaya Developers` → `laya-developers` is a different company).
- Every accepted photo must be reviewed on a contact sheet before it is applied; reject school/
  people/interior shots (e.g. Diamond Developers' page shows children, not a building).
- Accepted photos are re-hosted on the Lovable CDN (`lovable-assets create`) and written to
  `developers.feature_image_url`; every attempt is logged in `developer_media_repair_attempts`.
