## Goal

Establish one premium standard, applied globally, for how every section on the site reads:

1. **Full-bleed section cards** — every section's outer card stretches edge-to-edge across the viewport, but keeps rounded inner corners.
2. **Gold metallic dividers between sections** — the gold full-bleed line (the one currently between *Mortgage Calculator* and *AI Property Comparison*) becomes the only divider used between top-level sections. No more silver/gray bars.

## Findings

- The good divider already exists: `SectionDividerGoldFullBleed` (`src/components/ui/section-divider-gold-fullbleed.tsx`) — gold gradient, `w-screen`, escapes container padding.
- The bad silver divider is the legacy `SectionDivider` from `src/components/ui/section-divider.tsx`. It's still used twice on the home page (lines 460 and 500) — including the bar right after AI Comparison and before the Podcast.
- `PremiumSectionCard` (`src/components/ui/premium-section-card.tsx`) is the canonical gold-bordered shell, but its outer wrapper is hard-locked to `container mx-auto px-4 max-w-7xl` — that is why *Explore Our Guides & Reports* and *Top Areas in Dubai* feel inset instead of edge-to-edge.
- Home sections are inconsistent: some use `PremiumSectionCard`, some use `<div className="jj-layer-2">`, some use bare `<div className="cv-auto">`.

## Plan

### 1. Make `PremiumSectionCard` full-bleed by default

Update `src/components/ui/premium-section-card.tsx`:
- Replace the fixed `container mx-auto px-4 max-w-7xl` wrapper with a `w-full` wrapper that has only small responsive side padding (`px-3 md:px-5`) so the gold border kisses the screen edges but content still breathes.
- Add an optional `width="full" | "contained"` prop (default `"full"`) so any legacy spot that truly needs the old centered max-w-7xl can opt in. Default behavior becomes edge-to-edge.

### 2. Promote every home section to the same shell

In `src/pages/Index.tsx`, convert these sections to `<PremiumSectionCard padding="none" wrapperClassName="cv-auto py-6 md:py-10">` so they all read with the same rounded-2xl gold-bordered full-bleed card:

- Explore Our Guides & Reports (already wrapped — gains full-bleed automatically via step 1)
- Explore Our Services (currently `jj-layer-2`)
- JBJ Royal Tools Hub (currently bare `cv-auto`)
- AI Property Comparison (currently `jj-layer-2`)
- Mortgage Calculator block (currently a custom `bg-[#F7F2EA] border ... rounded-2xl` div — replace the outer chrome with `PremiumSectionCard tone="surface"`, keeping the inner content and CTAs untouched)
- Top Areas in Dubai (already wrapped — gains full-bleed automatically)
- Podcast section (wrap in `PremiumSectionCard`)

### 3. Replace every remaining silver divider with the gold one

In `src/pages/Index.tsx`:
- Line 460: `<SectionDivider />` → `<SectionDividerGoldFullBleed size="md" spacing="md" />` (this is the bar right above AI Comparison the user explicitly called out)
- Line 500: `<SectionDivider fullWidth />` (inside `PodcastVisibilityGate`) → `<SectionDividerGoldFullBleed size="md" spacing="md" />`

Add a dedicated gold divider between *JBJ Royal Tools Hub* and *AI Property Comparison* so they read as fully separate sections (currently there's already one at line 448 — verify it renders and tighten spacing if needed after the card promotion).

### 4. Save the rule to project memory so it propagates site-wide

Add a new memory file `mem://ui-ux/visual-standards/full-bleed-card-and-gold-divider-standard` and reference it from `mem://index.md` Core. Rule:

> Every top-level section on every page is wrapped in `<PremiumSectionCard>` (full-bleed by default: outer card spans `w-full` with rounded-2xl inner corners and a 1px gold hairline border). Between top-level sections, the **only** allowed divider is `<SectionDividerGoldFullBleed />`. Silver/gray `SectionDivider` is banned from page composition (already a no-op via the no-gray rule, but now explicitly forbidden as a section break).

### 5. Leave child content untouched

No internal layout, copy, animation, lazy-loading, or CTA changes inside any of the section components. The change is strictly the outer wrapper + divider color.

## Technical notes

- `SectionDividerGoldFullBleed` already uses `left-1/2 -translate-x-1/2 w-screen` — it works inside any container.
- `PremiumSectionCard` change is the only structural edit; everything else is search/replace at call sites.
- Mortgage block currently has a `<p className="text-...">Estimates only...</p>` disclaimer and two `PearlButton`s inside the rounded container — preserve them verbatim inside the new `PremiumSectionCard`.
- No DB, no edge functions, no business logic touched.

## Out of scope

- Other pages beyond `Index.tsx` won't be touched in this pass; the memory rule + the now-full-bleed `PremiumSectionCard` means future section authoring picks up the standard automatically. A follow-up pass can sweep `Properties.tsx`, listing pages, etc. once you confirm the home page reads correctly.
