## Goal

Three connected fixes so every tool on the site looks, reads, and is named the same way as Compare Projects/Units — only with the contrast bug actually solved.

---

## 1. Fix the Compare Projects pill contrast bug (winning-rule hunt)

Symptom in your screenshot: the active "Compare Projects" pill renders as black-on-near-black — the label is almost invisible. The previous pass set the pill text white via inline style, but a later CSS rule is still winning.

Investigation + fix:

- Grep every selector targeting `[data-cta]`, `.jj-pill-active`, `[role="tablist"] button[aria-selected]`, and the universal light-surface/contrast guards in `src/index.css` and `scripts/contrast/*`.
- Identify which rule is still flipping the active pill's color to ink (almost certainly the PASS 6/PASS 7 "white-on-light" guard matching `bg-[#0A0A0A]` as "light" because of an alpha-overlay parent, or the dark-surface descendant chain matching the pill's wrapper).
- Patch one of two ways (whichever is the true winner): (a) tighten the guard's selector to exclude `[data-cta="dark"]` / `.jj-pill-active`, or (b) move the Compare mode toggle onto the locked `.jj-pill-active` primitive so it's covered by the existing opt-out chain.
- Add a regression line to `scripts/contrast/check-visible-contrast-contract.mjs` asserting the active Compare pill renders white-on-black.
- Re-run the contrast scanner on `/compare` and `/compare?mode=units` and confirm 0 polarity failures before declaring done.

I will report back the exact selector/file that was winning so you can see the root cause, not just the patch.

---

## 2. Repaint every tool in the champagne/gold/ink palette

Same treatment we just did on `/compare`, applied to:

- `/quiz` (AI Home Finder) — `src/pages/Quiz.tsx`, `src/pages/QuizResults.tsx`, `src/components/matchmaker/*`
- `/mortgage-calculator` — `src/pages/MortgageCalculator.tsx`
- `/property-evaluator` + `/request-valuation` — `src/pages/PropertyEvaluator.tsx`, `src/pages/RequestValuation.tsx`
- Royal Tools Hub + every page in `src/pages/toolkit/*` (Photo, Video, Voice, PDF, Brochure, Stamp, Scan&Sign, Virtual Staging, Background AI, Beauty Filters, Image Resize, Captions, Property Suite, Corporate Suite, AI Video Studio)
- Tool-card surfaces in `BrokerToolkit.tsx`, `AIHub.tsx`, `PropertySuite.tsx`, `RealEstateSuite.tsx`

Rules applied uniformly (no exceptions, no per-tool variants):

- Page bg `#FDFBF7`, surface `#F7F2EA`, raised `#EFE6D6`, gold hairline `#B89555` (1px only — never a fill), ink `#1A1A1A`.
- Strip every blue/purple/pink/teal/cyan/neon gradient, glow, blob, glass card, vignette, animated colored line, and `text-white` on a light surface.
- Active tabs/pills → locked `.jj-pill-active` primitive (white text on clean black `#0A0A0A` + 1px gold hairline). Inactive → ink on champagne with 1px gold border.
- Primary CTAs → `.jj-cta-dark`; secondary → `.jj-cta-champagne`; ghost → `.jj-cta-outline`.
- AI-specific affordances keep the existing purple `IconTile` tone (per AI Premium Purple standard) — but ONLY the small icon tile, never page backgrounds, never CTA fills.
- Typography: Inter only, same heading/body sizes used on `/compare`. Buttons share the locked CTA height/radius/padding.

Verification: run the contrast + a11y scripts against every route above; screenshot 3–4 representative tools (Mortgage, Quiz, Property Evaluator, a Toolkit page) and visually confirm parity with `/compare`.

---

## 3. Unify each tool's name across URL, sitemap, SEO, UI, menus

Today the matchmaker tool is called "AI Home Finder" in the sitemap/menu/SEO but "AI Property Finder" inside the tool — and similar drift exists on other tools. One canonical name per tool, used everywhere.

Canonical names I'll standardise on (chosen for clarity + search intent, kept short for menus):

| Tool | Canonical name | URL | Old aliases redirected |
|---|---|---|---|
| Matchmaker quiz | **AI Home Finder** | `/ai-home-finder` (primary) | `/quiz` → 301 to `/ai-home-finder` |
| Project comparator | **Compare Projects** | `/compare` | — |
| Unit comparator | **Compare Units** | `/compare?mode=units` | — |
| Mortgage tool | **Mortgage Calculator** | `/mortgage-calculator` | — |
| Valuation tool | **Property Evaluator** | `/property-evaluator` | `/request-valuation` kept as the lead-capture sub-step |

Why "AI Home Finder" wins over "AI Property Finder": shorter, warmer, matches buyer search intent ("find a home"), already the URL slug + sitemap entry — fewer external changes to land consistency.

Touch list for each rename pass:

- Route file (`AIToolRoutes.tsx`, `OwnerRoutes.tsx`) — make canonical URL primary, old URL `Navigate replace`.
- `src/pages/Sitemap.tsx` + `public/sitemap.xml` + `index.html` canonical/OG.
- Per-page `<title>` / meta description / OG / Twitter / JSON-LD.
- In-tool hero headline, breadcrumbs (`SEOBreadcrumbs.tsx`), tab labels.
- Global menus: `GlobalHeader.tsx`, `MegaMenuMore.tsx`, `MegaMenuSearch.tsx`, `Footer.tsx`, `GlobalVerticalNav.tsx`, `OwnerSidebarNav.tsx`.
- Search/registries: `globalSearchIndex.ts`, `royalToolsRegistry.ts`, `allToolsSuiteConfig.ts`, `publicToolAccess.ts`, `shortcutsConfig.ts`, `page-guides.ts`, `ai-tools-verified-inventory.ts`.
- Translations: replace string in `src/translations/*.ts` (15 locales).
- Owner pages: `AIHomeFinderSubmissionsPage.tsx`, `AIToolsControlPanel.tsx`, `AdminLeads.tsx`.

Verification: grep for each old name post-edit and confirm zero hits outside redirect declarations.

---

## Memory updates

After landing:

- New constraint memory: **Tool palette parity** — every tool (compare, quiz, mortgage, evaluator, toolkit/*) must use the same champagne/gold/ink tokens, locked CTA primitives, and `.jj-pill-active` toggles as `/compare`. No neon, no glass, no per-tool palette variants.
- New constraint memory: **Tool name canonicality** — name table above is the single source of truth across URL, sitemap, SEO meta, in-tool headline, menus, registries, and translations. Renames require updating all surfaces in one pass.

---

## Out of scope

- No business-logic, calculation, or data-flow changes inside any tool — visual + naming only.
- No new tools, no removed features.
