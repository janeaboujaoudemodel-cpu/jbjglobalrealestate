---
name: Amenities Photo Card Standard (LOCKED)
description: Amenities & Features grid — brochure-cropped photos, numbered emerald pagination, white-on-emerald contrast, no image duplicates within a page.
type: design
---

# Amenities & Features — Locked Standard

Reference: AMRA project Amenities tab (from Red Light Therapy Suites through Cryo Rooms) is the reference implementation.

## Rules
1. **Photo source** — Each amenity title MUST resolve 1:1 to a brochure-cropped or dedicated photorealistic asset. No random gallery photos, no keyword-guessing fallbacks that surface unrelated images.
2. **No duplicate photos on the same page** — If the same crop must be reused, at minimum change the amenity to a different page, or generate a new asset. Never render two adjacent cards with identical image bytes.
3. **Citi Buddy card** — The robot render must display as full object-contain on a champagne gradient background (not a dark overlay, not cropped).
4. **Pagination controls**
   - Prev / Next buttons: solid emerald `#064E3B` background, **pure white** text/icons. Never black text on emerald.
   - Page indicators: numbered pills (1, 2, 3…). Active = emerald with white text. Inactive = white bg with emerald text and champagne border.
   - No dot-only pagination.
5. **Fact-sheet numbers** — All stats (wellness sq ft, unit counts, etc.) MUST come from the currently uploaded fact sheet. AMRA: **688,000 sq ft** dedicated wellness area (not 470,000 — that was the deprecated fact sheet).
