## Goal

Polish the lower half of every project page so the **Dubai Market Intelligence** widget and the sections around it are full-bleed, consistently spaced, and the **Ready to Get Started** CTA returns above Recommended Projects.

## Problems today (file: `src/components/project-detail/ProjectDetailLayout.tsx`)

1. The whole content body is wrapped in `max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16` (line 824). The DLD widget sits inside it, AND the widget itself adds `mx-4 md:mx-8` + `max-w-6xl` inside → it's double-constrained and looks narrow.
2. Above DLD there's a hand-rolled diamond divider (lines 1401–1407) — not the approved `<SectionDividerGoldFullBleed />` standard.
3. Every block uses `mb-14` → vertical rhythm is too loose.
4. RecommendedProjects wrapper (line 1476) has only `pb-12 md:pb-16` and **no top padding** → it visually touches the previous section.
5. The "Ready to Get Started" CTA (`<CallToActionSection />`) was removed in a prior consolidation (comment line 1471). User wants it back.

## Changes (single file edit)

### A. DLD section → full-bleed band

- Wrap `<DLDMarketWidget />` in a full-bleed escape: `relative left-1/2 right-1/2 -mx-[50vw] w-screen` band with `data-marketing-page`-friendly champagne background, replacing the current `<div className="mb-14">`.
- Above it, replace the hand-rolled diamond divider with `<SectionDividerGoldFullBleed />` (existing primitive).
- In `src/components/shared/DLDMarketWidget.tsx`:
  - Remove the outer `mx-4 md:mx-8 rounded-3xl border ...` framing on `<section>` so it can breathe edge-to-edge.
  - Drop `py-16` → `py-10 md:py-14`.
  - Widen inner `max-w-6xl` → `max-w-[1600px]` so the grid uses the full band.
  - Keep all cards, labels, data, sources line untouched (no-removal policy).

### B. Tighten vertical rhythm in the content column

- Replace `mb-14` on the major section wrappers in the project content body (AI analyzer block, DLD wrapper, Investment Metrics, FAQ, Report Issue banner) with `mb-10 md:mb-12`.
- Inquiry form wrapper `mb-8` stays.

### C. Re-mount "Ready to Get Started"

- Right after `</section>` (line 1473) and **before** the RecommendedProjects wrapper, add a full-bleed champagne band containing `<CallToActionSection projectName={project.name} projectId={project.id} location={project.location} />`. Import is already present (line 53), no new import needed.
- Add `<SectionDividerGoldFullBleed />` above it as the section break (replaces the silent visual gap that previously existed).

### D. RecommendedProjects spacing

- Change the wrapper on line 1476 from `pb-12 md:pb-16` to `pt-10 md:pt-14 pb-10 md:pb-14` so it no longer touches the CTA above and the page bottom is tighter.
- Add a `<SectionDividerGoldFullBleed />` above it (between CTA and Recommended).

## Out of scope

- No data, copy, or card removals (no-removal policy).
- No changes to the hero, breadcrumb, header, footer, or any other listing/search surface.
- No new components, no new dependencies, no DB work.

## Files

- **Edit:** `src/components/project-detail/ProjectDetailLayout.tsx`
- **Edit:** `src/components/shared/DLDMarketWidget.tsx` (remove outer mx/rounded/border, widen inner max-width, trim py)
