# Gate 1 — One Official Emerald Primitive

## Goal
Eliminate every emerald variant. The sidebar **COLLAPSE** button becomes the single visual reference. Every emerald surface across the site reuses one shared primitive with white text and white icons.

## 1. Define the single primitive
In `src/index.css`, create one canonical class — `.jj-emerald` — and one outline sibling `.jj-emerald-outline`. They will own:
- gradient (locked metallic emerald used by the Collapse button)
- shadow, radius, border, transition
- hover (lighter emerald) and active states
- forced `color:#fff` for text and all descendant SVGs (`stroke`, `fill` where appropriate)
- `border:0` unless the Collapse primitive has one

All previous emerald classes (`jj-cta-emerald`, `jj-pill-emerald`, `jj-pill-emerald-metallic`, `jj-cta-emerald-metallic`, `jj-card-emerald-action`, `jj-favorite-trigger`, `jj-surface-emerald`, `jj-emerald-solid`, `jj-emerald-ombre*`, `--jj-emerald-ombre*`) become **aliases** that `@extend`/forward to `.jj-emerald`. No alternative gradients remain.

Add a final lock block:
```css
html body :is(.jj-emerald, [data-emerald="true"]) {
  background: var(--jj-emerald-primitive) !important;
  color:#fff !important; border:0 !important;
}
html body :is(.jj-emerald, [data-emerald="true"]) :is(svg, [data-icon]) {
  color:#fff !important; stroke:#fff !important;
}
html body :is(.jj-emerald, [data-emerald="true"]):hover {
  background: var(--jj-emerald-primitive-hover) !important;
}
```

## 2. Sample the Collapse button
Read the rendered Collapse button (in `BrokerPortalSidebar.tsx` / `OwnerDashboardShell.tsx`) via Playwright, capture its computed `background-image`, `box-shadow`, `border-radius`, `transition`. Those exact values become `--jj-emerald-primitive` / `--jj-emerald-primitive-hover`. No new values invented.

## 3. Migrate every emerald surface to `.jj-emerald`
Replace inline `style={{ backgroundImage: 'var(--jj-emerald-ombre)' ... }}`, raw Tailwind `bg-emerald-*` / `bg-green-*` / `from-*-green-*`, and per-component emerald CSS with `<… className="jj-emerald" />`.

Targets (audited list):
- **Cards:** `FavoriteButton`, `ShortlistBadgeButton`, `DesignFavoriteButton`, `ProjectCard` (EOI/Handover chips, Email/Call/Chat, Add Badge, Register Interest, Download Brochure, Download Branded Presentation), `ReellyProjectCard`, `ContinueSearching` (history circle + heart).
- **Contact CTAs (Ready to Get Started):** WhatsApp, Call, Email, Chat, Contact, Support buttons.
- **AI:** AI Property Comparison icon tile, AI Mortgage Calculator CTA, "AI Powered" label, AI badges, AI CTA buttons.
- **Mortgage:** "Compare to Bank Rates" slider track fill, thumb, hover/focus/active — unify with Interest Rate / Loan Term / Down Payment / Property Price sliders via shared `--slider-range-bg` / `--slider-thumb-bg` tokens set to the primitive.
- **Explore Our Guides:** Book icon tile + "View Library" arrow button.
- **Labels:** single `<EmeraldLabel>` primitive used by AI Powered, Pipeline, Data Access, Professional Development, Foundations, Practical, Internal, Market Intelligence, etc. Remove page-local label CSS.
- **Header chips:** Mode, AED, sq ft/sq m, filter, favorites count.

## 4. Codebase sweep
Run a codemod across `src/**/*.{ts,tsx,css}` that:
- removes inline emerald `style={{ backgroundImage|background|backgroundColor }}` set to greens
- removes `border-white/*`, `borderColor: 'rgba(255,255,255,…)'` on emerald surfaces
- maps `bg-green-*`, `bg-emerald-300..900`, `from/to/via-(green|emerald|teal)-*`, `text-emerald-*`, `border-emerald-*` → `jj-emerald` (or removes when redundant)
- deletes legacy class definitions in `index.css` after aliasing
Fails the build if any of those patterns reappear (ESLint rule + grep check in `scripts/contrast/`).

## 5. Validation (must pass before declaring done)
Playwright run (`/tmp/browser/emerald/`) on `/`, `/properties`, `/project/<slug>`, `/mortgage-calculator`, `/compare`, `/ai-home-finder`, `/guides`, broker portal, owner dashboard:
1. Screenshot full viewport.
2. For each emerald element, read computed `background-image`, `color`, `border-width`, descendant `<svg>` `color`/`stroke`.
3. Assert they equal the Collapse button's values exactly. Any mismatch fails the gate.
4. Zoomed crops of: card heart/shortlist/Add Badge, Email/Call/Chat row, Ready to Get Started cards, AI Mortgage CTA, Compare-to-Bank-Rates slider, Explore Our Guides book + arrow, label chips.

Deliver the contact sheet + per-surface zoom crops. No "fixed" claim without the diff report showing zero mismatches.

## Files expected to change
- `src/index.css` (consolidate + lock primitive, alias legacy classes)
- `src/components/ui/emerald/EmeraldButton.tsx`, add `EmeraldLabel.tsx`, `EmeraldIconTile.tsx`
- `src/components/ui/slider.tsx` (single emerald token for filled track + thumb)
- `FavoriteButton`, `ShortlistBadgeButton`, `DesignFavoriteButton`, `ProjectCard`, `ReellyProjectCard`, `ContinueSearching`, `MortgageCalculator`, `mortgage/MortgageParityPanel`, guides/AI/contact sections, header chips
- `scripts/contrast/check-emerald-primitive.mjs` (new guard)
- `eslint-rules/no-raw-emerald.js` (new)

## Out of scope
No logic changes, no copy changes, no layout restructuring — visual primitive consolidation only.
