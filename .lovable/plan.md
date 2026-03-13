
Plan to fix both issues immediately (recent-research duplicates + broken bilingual stamp layout) without regressing existing behavior.

1) Recent research: enforce true uniqueness and recency order
- Root cause found:
  - `ContinueSearching` intentionally triplicates items for marquee looping (`duplicated = [...items, ...items, ...items]`), so users visually see repeated listings.
  - Global search is writing plain text queries into the same localStorage key used by recent listings (`jbj_recent_searches`), which can corrupt recent-item state.
- Implementation:
  - `src/components/ContinueSearching.tsx`: remove triplicated render path; render each unique listing once (no visual duplicates), keep smooth scrolling behavior without cloning cards.
  - `src/hooks/useRecentSearches.ts`: strengthen canonical dedupe using normalized key (`type + normalized slug`, fallback to id), always keep newest-first.
  - `src/components/GlobalSearchModal.tsx`: move query history to a separate key (e.g. `jbj_recent_queries`) so listing history remains clean and stable.

2) Standard stamp layout: fix Arabic/English arc logic and spacing rules
- Root cause found:
  - Bottom-arc math is wrong in both frontend and generator backend (`startDeg` centered at 270), which places “bottom” text on the top half.
- Implementation:
  - `src/lib/stampOfficialTemplate.ts`:
    - Correct bottom-arc geometry (bottom hemisphere angles + upright rotation).
    - Enforce strict mapping:
      - Company: top Arabic only, bottom English only.
      - Location: top Arabic only, bottom English only.
    - Keep exactly 3 circles (outer, inner, center).
    - Rebalance ring spacing so company band is larger than location band.
    - Keep company font larger than location font.
    - Keep separators on both sides between arcs.
    - Add stricter fit constraints so text stays centered in the band and never touches borders.
  - `supabase/functions/ai-stamp-generator/index.ts`:
    - Apply the same corrected bottom-arc math and bilingual top/bottom mapping so generated designs follow the same standard rules.

3) Prevent multi-preview SVG cross-over bugs (major stability fix)
- Root cause found:
  - Repeated static SVG ids across many rendered stamps can cause arc/textPath collisions.
- Implementation:
  - `src/components/stamp-generator/StampSVGRenderer.tsx`: add per-instance SVG id scoping (prefix ids and all `url(#...)` / `href="#..."` references) before render.

4) Ensure “standard” is always the baseline design
- `src/lib/stampTemplates.ts` + `supabase/functions/ai-stamp-generator/index.ts`:
  - Insert/keep an `owner-standard` concept as the first deterministic concept using the strict bilingual rules.
  - Keep other generated concepts as variations, but never break baseline geometry.

Technical file touch list
- `src/components/ContinueSearching.tsx`
- `src/hooks/useRecentSearches.ts`
- `src/components/GlobalSearchModal.tsx`
- `src/lib/stampOfficialTemplate.ts`
- `src/components/stamp-generator/StampSVGRenderer.tsx`
- `src/lib/stampTemplates.ts`
- `supabase/functions/ai-stamp-generator/index.ts`

Validation checklist (post-implementation)
- View same property 2, 10, 100 times → only one recent card for that listing, moved to newest position.
- Continue Searching section shows no repeated visual duplicates.
- Standard preview shows:
  - Company Arabic top only, English bottom only.
  - Location Arabic top only, English bottom only.
  - 3 circles only.
  - Company band text larger than location.
  - No text touching any ring.
- Generated concepts maintain the same arc logic and no overlay artifacts across grid cards.
