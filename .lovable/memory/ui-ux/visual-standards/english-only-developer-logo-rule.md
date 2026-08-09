---
name: English-Only Developer Logo Rule (LOCKED)
description: Developer logo artwork must never contain Arabic script; only the English wordmark/symbol is kept, with the Arabic layer erased and the mark re-cropped and re-whitened.
type: constraint
---
No developer logo stored in `developers.logo_url` / `logo_url_processed` may
contain Arabic (or any non-Latin) script — bilingual lockups are always reduced
to their **English-only** part.

Rules:
- Erase the Arabic layer geometrically (band / column / rect removal), never with
  blind word-box erasure — OCR word boxes overlap Latin glyphs and destroy them
  (this damaged DAR AL ARKAN, LOOTAH, DEYAAR on the first attempt).
- After erasing, drop leftover diacritic specks with connected-component cleanup
  restricted to the erased region (component area < 1% of total ink).
- Then repaint ink pure white, tight-crop to ink bounds, upscale longest edge to
  ~1000px, store under `developer-logos/white-v2/<slug>-en.png`, and set
  `logo_status = 'approved'`, `logo_locked = true`.
- Never keep the Arabic because "the English is small" — add the official English
  wordmark instead if the symbol alone is too small.

Fixed and locked English-only (2026): Dar Al Arkan, Ahmed Alansari, Manazil
Global, Al Fahad Holding, Abyaar, Dubai South, Amaya Properties, Union
Properties, Lootah, Deyaar, MAG Group, MAG Property Development, MERED, Kifata,
Reportage.
