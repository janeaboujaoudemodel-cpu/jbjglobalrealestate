---
name: Developer Logo Artwork Quality Standard (LOCKED)
description: Every developer logo asset must be pure white on true transparency with no baked box, ghost wash, faint ink or photo content; measurable thresholds + what to do when no official artwork exists.
type: constraint
---
Every asset stored in `developers.logo_url_processed` / `logo_url` for a
developer identity MUST satisfy all of the following:

- **No baked background.** Background pixels must be alpha `0`, not a low-alpha
  wash. Reject when `frac(alpha>12) > 0.80` while `frac(alpha>200) < 0.45` —
  that signature is a semi-transparent square that renders as a lighter box
  inside the emerald plate (the Taraf defect).
- **No internal box / slab.** No rectangle, white slab or visible image
  boundary around the mark unless the rectangle is genuinely part of the
  official mark (e.g. Myra, Rokane, DIA frames).
- **Pure white ink.** Mean RGB of ink pixels (`alpha>128`) ≈ 255.
- **Readable weight.** `frac(alpha>128)` must be ≥ 0.04 of the canvas.
- **Tight crop.** Ink bounding box ≥ 55% of canvas area — no dead padding that
  shrinks the mark inside the plate.
- **Never a photo.** Interior renders, exteriors, Instagram exports and
  screenshots are never logos.
- **English only.** Drop duplicated Arabic wordmarks (Reportage / Kifata rule).

Processing recipe (v3): estimate background from border median, hard-zero every
pixel within distance 45, ramp to opaque at 110, force RGB to white, keep the
original alpha edges, then tight-crop. Vectors are rasterized at ~1600px wide
with all fills/strokes forced to `#fff`.

**When the brand has no symbol/monogram at all** (site uses a plain text
title, or the domain is dead and no mark can be sourced): build a real plain
wordmark asset — the brand name set in the closest matching typeface (the
site's own font when known, otherwise the JBJ pair: Jost for modern brands,
Cormorant Garamond for classic ones), uppercase, generously letterspaced,
name on line 1 and the descriptor smaller on line 2, rendered pure white on
transparency and tight-cropped — then store it like any other logo with
`logo_status = 'approved'`. This is allowed because it reproduces the brand's
actual (text-only) identity. Never invent a symbol, monogram or icon, never
redraw a real mark, and never keep a defective file. `logo_status = 'missing'`
is reserved for brands whose real mark exists but has not been sourced yet.

DB writes are blocked by `enforce_developer_logo_lock` and
`protect_approved_developer_logos`; a trusted correction runs
`set local app.allow_logo_overwrite = 'true'` and clears `logo_locked` first.
