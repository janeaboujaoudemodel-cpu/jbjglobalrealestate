
# Project Page Overhaul Plan

Scope: `/project/:slug` page + Dubai Market Intelligence widget + Mortgage Calculator. No removal of existing features.

---

## 1. Handover card (hero section)
- Remove the small "Handover" / "Ready" eyebrow label inside the card.
- Keep only the date value (or "Ready") sitting directly inside the card with no preceding text label.
- File: `src/components/project-detail/QuickFactsBar.tsx` (and the hero handover pill component if separate — will locate during build).

## 2. Location section — dual map exploration
Under the existing "Project Location" block add two compact horizontal strips (one line each):
- **Line A — "Other projects in this area"**: developer-agnostic, filtered by area name (excludes current project + current developer).
- **Line B — "More from {DeveloperName}"**: same developer, other projects (excludes current project).
Each strip = horizontally scrollable row of mini project cards (image, name, PricePill, handover pill) → click navigates to that project.
- Reuses existing `ProjectNearbyPropertiesMap` data pattern.
- New component: `src/components/project-detail/RelatedProjectsStrips.tsx`.

## 3. Restore competitor pins on the project map
- The project map previously rendered other developers' projects in the same area; this regressed.
- Fix `ProjectNearbyPropertiesMap` query: re-enable area-radius pull, ensure no filter by current developer, ensure pins render. Keep current project as red pin, others as gold (already implemented — debug why empty).

## 4. Owner inline editing (live on the project page)
For users with owner role (`requireOwnerAuth` / existing `OwnerGuard` pattern):
- Wrap editable fields with an `<InlineEditable>` primitive (click pencil → input/textarea → autosave to `projects` table).
- Editable fields: title, description, starting price, founded/launch date, handover date, location text, property type, total units, floors.
- Save via direct supabase update (RLS already restricts to owner).
- Component: `src/components/project-detail/owner/InlineEditable.tsx` + `useOwnerInlineSave` hook.

## 5. Owner drag-and-drop document & brochure ingestion
Next to "Project Documents" section, add an always-visible **owner-only** drop zone:
- Drag any file (PDF brochure, floor plans, payment plan, etc.) → uploads to existing storage bucket.
- Per-file **Visibility toggle** (Hidden / Visible) — stored on the document row; only "Visible" shows publicly.
- After upload, file is sent to existing **Universal Link Extractor / enrichment edge function** (per `mem://architecture/ai-tools/universal-link-extractor-standard`) to auto-enrich the listing (description, amenities, prices, payment plan, handover date).
- **No duplication**: reuse the existing `media-ingestion-hub` backend + `enrich-project` edge function (per `mem://features/listing-admin/media-ingestion-hub-standard`); do not create a parallel pipeline.
- Component: `src/components/project-detail/owner/OwnerDocDropzone.tsx`.

## 6. Mortgage calculator slider bug (carry-over fix)
- Root-cause the slider value not propagating in `src/components/MortgageCalculator.tsx` (the embedded one on the project page).
- Likely cause: controlled `Slider` `value` prop tied to a stale `propertyPrice` from props, with `onValueChange` mutating local state that is overwritten on re-render.
- Fix: single source of truth (lift state OR uncontrolled with `defaultValue` + `onValueCommit`), verify with browser interaction + screenshot at min/mid/max.

## 7. CTA rename + color
- Rename **"AI Mortgage Assistant"** → **"JBJ Mortgage Assistant"** everywhere it appears (mortgage section header, button label, modal title).
- "Ask" CTA: keep current shape; restyle to premium gold-champagne (`variant="gold"` per `mem://ui-ux/visual-standards/cta-system-standard`). Compare against the current gold spec — if existing gold is already richer (e.g., gradient hairline), keep that.

## 8. Dubai Market Intelligence — daily freshness
- Verify the `pg_cron` job `sync-dld-market-data` is actually scheduled and running daily (query `cron.job` + `cron.job_run_details`).
- If not firing: re-schedule with correct URL + anon key headers; add fallback so `applyLiveTicks` in `useDLDMarketData.ts` always shows today's "as of" date.
- Add a visible "Updated: {today}" stamp on the widget.

## 9. DLD widget — premium recoloring
Replace current orange-heavy semantics with the requested premium palette in `src/lib/dataColors.ts` (single source of truth so every chart updates):
- **Off-plan** → emerald green (premium growth)
- **Secondary** → deep red (`#B91C1C`-ish, not bright)
- **Cash** → soft sky blue
- **Mortgage** → champagne gold `#B89555`
Keep "Gifts" row and "Notice something incorrect" untouched.

---

## Out of scope (will NOT touch)
- Gifts row, "Notice something incorrect" section.
- Any other site-wide CTA sweep beyond the JBJ Mortgage Assistant button.
- Header/sidebar, footer, navigation.

## Verification (mandatory before marking done)
For each section above:
1. Browser navigate to `/project/pinewood-village-wasl-properties-jumeirah-golf-estates`.
2. Screenshot the changed area at 975px viewport.
3. For owner editing + dropzone: log in as owner, perform the action end-to-end, screenshot result.
4. For mortgage slider: drag to 3 positions, confirm derived monthly payment updates each time, screenshot all three.
5. For DLD cron: run `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5` and confirm last run < 24h ago.
