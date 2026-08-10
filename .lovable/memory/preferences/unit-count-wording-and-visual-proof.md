---
name: Unit Count Wording & Visual Proof Capture
description: "295 units" not "residences"; total units only (never availability); Playwright screenshots must wait for real content via scripts/qa/shot.py
type: preference
---

## Unit count wording (LOCKED)
- Any numeric inventory figure renders as **units** — never "residences", "apartments", "homes", "keys".
- The figure shown is the project's **total units** (fixed for the lifetime of the tower), taken from `projects.total_units`.
- **Availability is never displayed** on the public site (`available_units` changes daily). Owner backend only.
- Normalisation is enforced in code: `normalizeUnitWording()` in `src/pages/ProjectDetail.tsx` rewrites imported copy (descriptions, highlights, USP bullets) so no source feed can reintroduce the wrong noun.
- 77S Tower = 295 total units (1–5 BR, penthouses, sky villas), 40 storeys, 650 parking.

## Blank screenshot root cause (FIXED)
- Cause: cold Vite dev route transforms take 25–40s; a fixed short `wait_for_timeout` captured the Suspense loader → blank cream page.
- Always capture with `python3 scripts/qa/shot.py <route> <out.png>`: it warms the route, waits for real content (`main h1` or a supplied selector) up to 90s, settles fonts/images, and **exits non-zero if the page is empty** so a blank PNG can never be shown as proof.
- Never present a screenshot whose helper run did not print `OK ... chars of text`.
