## Premium price label + handover date restyle

Restyle the price label on property cards so it reads as **premium**, not as a candy pill, and align the handover date with the same orange identity. Replace the bland "TBA / To be announced" fallback with a real derived date wherever the data allows.

### What changes visually

Property cards (`ProjectCard`, `ReellyProjectCard`, `FeaturedListings`) get a unified price + handover treatment:

```text
┌──────────────────────┐
│  [ FROM  AED 2.4M ]  │  ← square (rounded-md), transparent core,
│                      │     2px orange border, orange ink price,
│                      │     subtle inner glow; no solid fill
└──────────────────────┘
   Handover · Q4 2026     ← same orange, semibold, matches the pill
```

- Price pill: `rounded-md` (square corners, not full-pill), transparent background with a 1.5–2px `--price-orange` border, orange text, soft outer shadow for depth, subtle inner highlight for the premium look.
- "From" eyebrow stays uppercase tracked, smaller, in the same orange but slightly muted weight.
- Handover line on the card body switches from ink (`#1A1A1A`) to `--price-orange`, semibold, matching the pill's tone exactly.

### Smart handover (no more "TBA")

Add a `deriveHandover(project)` helper used by all three cards. Resolution order:

1. Existing `handover_date`.
2. Alt fields if present on the row: `handover`, `completion_date`, `expected_completion`, `handover_quarter`.
3. Regex scrape `Q[1-4] YYYY` from `description`, `payment_breakdown`, `payment_plan`, `status_label`, `construction_status`.
4. Earliest future bare year (`20YY` ≥ current year) in the same fields.
5. If still nothing, render a refined fallback label "Handover — coming soon" in orange (never "TBA", never "To be announced").

We do not fetch external developer websites at render time (would hit CORS, leak referrers, slow the grid). Instead we extend the existing **listing enrichment edge function** so that whenever a project is enriched it also writes a derived `handover_date` into the row when the column is empty and we can extract one from the developer's payload. That one-time backfill makes the live cards show real dates rather than fallbacks.

### Files touched

- `src/components/ProjectCard.tsx` — new pill style + orange handover line + `deriveHandover` helper.
- `src/components/ReellyProjectCard.tsx` — same pill + handover treatment.
- `src/components/home/FeaturedListings.tsx` — replace `'TBA'` with `deriveHandover` + premium fallback.
- `src/components/project-detail/ProjectDetailLayout.tsx` — replace remaining `"TBA"` strings on the detail summary with the same helper, keep the orange handover styling consistent.
- `src/index.css` — small utility class `.price-pill-premium` so the look is reusable and lint-stable (no inline color literals).
- `supabase/functions/enrich-listing-metadata/index.ts` (existing enrichment fn — extend it, do not create a new one) — when a project has no `handover_date`, parse the same Q#/year patterns from any source text it already has and persist the result. Owner-auth only.

### Constraints honored

- Keeps `--price-orange` as the single source of truth for prices and handover (per Premium Price Orange standard).
- No solid white text on light. No faded gold. Inter only.
- "No Removal" — every existing element (From label, currency, sold-out badge, sale-status badge) stays; only the visual treatment changes.
- Runtime contrast guard still passes: orange ink on transparent-over-image gets a subtle dark scrim behind the pill so it remains AA on bright photos.

### Out of scope

- Live scraping of developer websites at render time.
- Changing the price value, currency conversion, or sale-status badges.
- Touching homepage hero (per prior directive).
