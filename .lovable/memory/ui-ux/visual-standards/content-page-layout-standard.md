---
name: Content Page Layout Standard (Hero + Floating TOC)
description: LOCKED layout rules for every guide, insight, service, company, legal, and help page — solid emerald hero (no stripes), centered title, floating right-side emerald TOC over full-width content.
type: constraint
---

# Content Page Layout Standard — LOCKED

Applies to every non-app content page:
Guides · Insights · Services · Company (About, Team, Developers) · Legal (Terms, Privacy, Cookies, Disclaimers, IntellectualProperty, AML/KYC) · Help & Support (FAQ family) · News.

## Rule 1 — Hero
- Background: solid emerald ombré only via `--jj-emerald-ombre` (or `linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)`).
- **FORBIDDEN**: `repeating-linear-gradient`, diagonal line SVGs, grid overlays, cube/oblique/vertical/horizontal line patterns, shimmer bars, animated stripe sweeps.
- Title, eyebrow chip, and subtitle must be `text-align: center`.
- Use `<GuideHero>` or `<PremiumEmeraldHero>` — do not write inline hero markup.

## Rule 2 — Content Column
- Content is full page width, `max-w-4xl mx-auto px-6` (Buyer's Guide card size).
- The TOC must NOT push, shrink, or grid-share the content column.
- No `lg:grid-cols-[Xpx_1fr]` alongside a sidebar TOC on these pages.

## Rule 3 — Floating TOC ("In This Guide")
- Position: `fixed`, right side, `z-index: 60`+ (must sit above every section, never behind).
- Fill: `--jj-emerald-ombre`, text pure white, gold hairline.
- Use `<GuideTableOfContents>` (existing) or the shared `<FloatingTOC>` wrapper.
- Collapsible with chevron. Mobile: bottom-sheet trigger, same emerald/white.
- Section click uses `scrollToId` with 20px extra offset + `scroll-mt-24` on target sections.
- Active-section highlight via single `IntersectionObserver` with rootMargin `-25% 0px -60% 0px` — NEVER auto-jumps 3 sections at once.

## CSS Enforcement
`src/index.css` PASS 173 neutralizes the historic stripe overlays on `.jj-disclaimer-hero__motion`, `.jj-company-hero-motion`, `main[data-company-legal-page]::before`, and all `[data-mi-hero-variant]`. Do not re-introduce them.
