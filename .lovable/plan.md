## Project page — hero contrast + global layout padding fix

### Diagnosis (from the two annotated screenshots + code at `src/components/project-detail/ProjectDetailLayout.tsx`)

**Hero is broken**
- The hero content (`Starting from AED 9.9M`, the `Elwood` H1, developer name, location row, breadcrumb) renders almost invisible — it sits over a bright pool background and the inline `color: rgba(255,255,255,0.85)` etc. is being overridden by a contrast guard (`data-ink-emerald-opt-out` is set but the `[data-surface="dark"]` wrapper is being clobbered by a newer `same-tone` guard pass, so text drops to ink).
- The three CTAs (`Download Brochure`, `Register Interest`, `Download branded presentation`) use `.jj-pill-emerald` — emerald fill on emerald-shadowed image = unreadable. User wants the opposite treatment.

**Layout is broken**
- `STARTING PRICE / HANDOVER / BEDROOMS / SIZE` cards (`ProjectDetailLayout.tsx` line 967–996) run inside `max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-12`, but the surrounding section uses an inline gradient background that bleeds the band edge to edge — so on the user's preview width the cards appear to "touch the edges" because the gold-bordered tiles inherit the band's full width with only 20px padding while the homepage uses ~32–48px.
- Same issue cascades to other in-content sections that use bespoke padding instead of the shared band/card primitives.

### What to change (surgical, frontend only)

**1. Hero — make all hero text and CTAs render white on the photo**

In `src/components/project-detail/ProjectDetailLayout.tsx` (lines 705–815):
- Tag the hero `<section>` with `data-hero-dark` and keep `data-surface="dark" data-no-contrast-guard` on the inner container so the universal same-tone guard skips it (matches the locked Hero Rule in memory).
- Replace inline `color: 'rgba(255,255,255,0.85)'` / `#FDE68A` / `#FCD34D` chains with explicit `text-white` / `text-white/80` Tailwind classes plus `[--tw-text-opacity:1]` so no later CSS pass can reroute them to ink.
- Keep `Starting from` in white, keep the price in `--price-orange` via the existing `<span>` pattern (locked Price Rule).
- Replace the three filled `.jj-pill-emerald` CTAs with a new **ghost-on-dark** primitive class (added in `src/index.css`):
  ```
  .jj-hero-ghost-cta {
    background: transparent;
    color: #FFFFFF;
    border: 1.5px solid rgba(255,255,255,0.85);
    backdrop-filter: blur(6px);
  }
  .jj-hero-ghost-cta:hover {
    background: rgba(255,255,255,0.10);
    border-color: #FFFFFF;
  }
  .jj-hero-ghost-cta svg { color: #FFFFFF; stroke: #FFFFFF; }
  ```
  Apply this to `Download Brochure`, `Register Interest`, `Request Brochure`, and `Download branded presentation` in the hero. Drop `jj-pill-emerald`. Add `data-no-contrast-guard` so the global guard doesn't try to "fix" them back to ink.
- Force `ProjectBreadcrumb surface="dark"` text to white via the same opt-out.

**2. Layout padding — adopt the homepage card padding everywhere on the project page**

In `ProjectDetailLayout.tsx` (line 962–964) the main band uses:
```
max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-12
```
Replace with the homepage standard (used by `<PremiumSectionCard>` and the home `ProjectCard` grid):
```
max-w-[1240px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-20
```
and add `gap-6 md:gap-8` to the quick-stats grid so the gold-bordered tiles get the same breathing room as homepage cards. Only the background band stays full-bleed.

**3. Same audit on adjacent project-page sections**

Walk through these and apply the same `px-6 sm:px-10 lg:px-16 xl:px-20` (no other markup changes):
- `QuickFactsBar` wrapper (line 998)
- `OwnerProvenanceCard` wrapper (line 1011)
- `DETAILS` / `GALLERY` / `AMENITIES` / `MASTER PLAN` / `LOCATION` section wrappers down to the bottom of `ProjectDetailLayout.tsx`.
- `ProjectDetailTabs.tsx` outer container.

No backend, schema, or data changes. No removal of any section or feature.

### Validation (Playwright via shell, headless Chromium)

For each route, scroll to top + middle + bottom, take a screenshot at 1280×1800, and open the screenshots to confirm contrast + padding:
1. `/project/elwood-sobha-realty-dubailand` (the page in the user's screenshots).
2. `/project/<one published apartment>` and `/project/<one published villa>` picked from the live DB so we cover both hero photo types.
3. `/` (homepage) and `/properties` to confirm we didn't regress the existing card padding.
4. `/dashboard` and `/broker` to spot-check that the dashboard didn't inherit the new hero CSS.

Failing screenshots → patch and re-shoot. Final delivery includes the before/after screenshot pair for the project hero + quick-stats band.

### Out of scope
- No copy changes, no new CTAs, no backend/edge-function/RLS changes.
- No restyling of cards on the homepage or listing pages — they already match the target.
- No new contrast guard — we use the existing `data-no-contrast-guard` + `data-hero-dark` hooks already in `index.css`.