## Goal
Eliminate every non-brand color (purple, violet, indigo, neon cyan, deep black backgrounds) from public AI pages so the whole site reads in the locked **Champagne / Gold / Mother-of-Pearl + Ink** palette that already governs the header, footer, and Home.

## Heads-up: memory conflict (need your decision)
Memory `mem://brand/ai-premium-purple-standard` currently says "violet/purple gradient theme is RESERVED for AI elements." Your request reverses that rule. The plan below assumes I **retire that standard** (purple/violet banned site-wide, AI surfaces use the same champagne/gold/ink as everything else). If you'd rather keep purple only inside *interior* AI widgets (not on AI marketing pages), say so before approving.

## Scope (visible front-end only — no business logic, no backend)

### Pass 1 — `/ai-hub` (the page you're looking at)
Rebuild the top half so it matches the lower "How It Works / FAQ" half:
- Hero: remove `background: "#07060F"`, neon orbs, dark video composite, purple eyebrow chip, purple→cyan gradient on "Tools Hub" headline, dark CTA buttons. Replace with champagne page band (`.jj-band` page tone), gold 1px hairline eyebrow, ink headline, gold-accented "Tools Hub" word, and the locked CTA primitives (`.jj-cta-dark` navy + `.jj-cta-champagne`).
- Tools Library section: swap any purple/cyan tile accents for `<IconTile tone="gold" />` and champagne raised surface.
- Bottom CTA band (currently "deep violet"): convert to navy `#102540` (approved dark CTA band) with white text — same treatment as the Get Verified banner, no purple.
- Keep ALL content, ALL tool cards, ALL CTAs, ALL FAQs. Only colors/surfaces change.

### Pass 2 — AI tool pages with purple/violet/indigo (13 files)
`AIFinancialAdvisor.tsx`, `AIClientMatcherPage.tsx`, `AICalendar.tsx`, plus toolkit pages `PDFEditor`, `PDFSuite`, `VoiceStudio`, `VoiceSuite`, `PdfFromPhotos`, `ImageResize`, `BrochureGeneratorPage`, `BeautyFilters`, `BackgroundAI`, `VideoResizePack`.
For each: replace `bg-purple-*`, `from-violet-*`, `text-indigo-*`, raw `#7c3aed/#8b5cf6/#a78bfa`, etc. with the champagne tokens (`bg-[#F7F2EA]`, ink text `#1A1A1A`, gold hairline `#B89555`, `<IconTile tone="gold" />`, `<PricePill />` where prices appear). Dark hero bands → champagne `.jj-band` or navy `#102540` per the CTA primitive system.

### Pass 3 — Global guard so this never regresses
Add a CSS guard in `src/index.css` that auto-remaps the banned hues on any `[data-marketing-page]` root:
- `bg-purple-*`, `bg-violet-*`, `bg-indigo-*`, `bg-fuchsia-*` → champagne raised `#EFE6D6`
- `text-purple-*`, `text-violet-*`, `text-indigo-*` → ink `#1A1A1A`
- Bare `bg-black` / `bg-[#07060F]` / `bg-[#0F0820]` on marketing pages → champagne page `#FDFBF7`
Mirrors the existing "Black-CTA → Navy" and "No Bright Yellow-Gold" guards.

### Pass 4 — Memory + lint
- Rewrite `mem://brand/ai-premium-purple-standard` to "RETIRED — AI surfaces use champagne/gold/ink like the rest of the site."
- Add a new core line: "No purple/violet/indigo/fuchsia anywhere on marketing pages. AI = same champagne theme."
- Extend `scripts/contrast/` with a `check-no-purple.mjs` companion to `check-no-blue.mjs` so CI catches future regressions.

## Validation (only what you asked for)
After Pass 1 finishes, I'll take `browser--screenshot` proofs of `/ai-hub` (hero, tools library, CTA band) at desktop and mobile widths and post them inline. Then I'll repeat the same screenshot pass for each repainted AI tool page in Pass 2 (one batched gallery, one shot per page) so you can verify visually before I close the task.

## Out of scope
- No edits to interior owner/CRM/dashboard tools (those aren't on the public AI surface you're seeing).
- No content/copy changes, no removed tools, no route changes.
- No backend/RLS/edge-function work.

## Technical notes
- Touched files: `src/pages/AIHub.tsx`, the 13 AI tool pages listed above, `src/index.css` (guard block), `scripts/contrast/check-no-purple.mjs` (new), `mem://brand/ai-premium-purple-standard` (rewrite), `mem://index.md` (core line + memory description update).
- Reuses existing primitives: `.jj-band`, `.jj-cta-dark`, `.jj-cta-champagne`, `<IconTile />`, `<PricePill />`, `<DeveloperLink />`, `SectionDividerGoldFullBleed`.
- "No Removal" policy honored: zero features, sections, or tool cards deleted.

Approve and I'll start with `/ai-hub` so you see the repaint immediately, then sweep the rest.
