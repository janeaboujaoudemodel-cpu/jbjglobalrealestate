
## Goal

Rebuild `/ai-hub` (`src/pages/AIHub.tsx`) into a single, contrast-clean, premium page that matches the locked JBJ design system (champagne + ink + navy CTAs + 1px gold hairline, AI accents in purple). Every issue circled in the four screenshots is addressed; **no features, tools, or sections are removed** (No-Removal policy).

## Issues being fixed

1. **Hero "JBJ Royal Tools Hub"** — text currently dark-on-dark, badge "FREE FOR ALL USERS" invisible.
2. **3 hero CTAs** (Go to My Dashboard / Explore Free Tools / View Premium Plans) — oversized, unbalanced, low contrast.
3. **4 trust cards** (Intelligent Analysis / Instant Results / Data Security / Save Time) — black icon tiles on champagne, broken.
4. **"Discover All Free AI Tools"** heading — half-rendered, half-blue overlay, illegible.
5. **Search bar + category pills** (ALL / PROPERTY / CORPORATE / PRODUCTIVITY / DESIGN / MARKETING) — search input black-on-black, pills inconsistent colors.
6. **"Investment & Property Tools"** band — solid neon purple slab, no breathing room, cards purple-on-purple.
7. **Broker Portal / Investor Hub** cards — dark slabs with neon purple + neon green gradient CTAs that violate the locked navy-CTA standard.
8. **"Welcome back" footer band** — navy `Explore Tools Above` CTA renders invisible on champagne; wording generic.

## Redesign blueprint (top → bottom)

```text
┌────────────────────────────────────────────────────────────┐
│  PREMIUM VIDEO HERO  (full-bleed, ≈ 86vh)                 │
│  • Looping AI/data-mesh video bg (reuse existing asset)    │
│  • Composite legibility overlay (top/bottom dark gradient  │
│    + radial spotlight) — pattern from MarketIntelligenceHero│
│  • Glass gold-border badge: "FREE FOR ALL USERS"           │
│  • H1 white, drop-shadow: "JBJ Royal Tools Hub"            │
│  • Sub: "Your Complete AI Tools Command Center"            │
│  • Single row of 3 EQUAL CTAs, max-w-[200px] each,         │
│    h-12, jj-cta-* primitives:                              │
│      [Go to My Dashboard]  (jj-cta-dark, navy)             │
│      [Explore Free Tools]  (jj-cta-champagne, ink)         │
│      [View Premium Plans]  (jj-cta-dark, navy + Sparkles)  │
└────────────────────────────────────────────────────────────┘
│  TRUST STRIP — champagne band (jj-band--surface)           │
│  4 × IconTile cards (gold tone):                           │
│   Brain · Zap · Shield · Clock  → ink labels, gold hairline│
├────────────────────────────────────────────────────────────┤
│  DISCOVER SECTION — page band                              │
│  • Centered ALL FREE TOOLS chip                            │
│  • H2 ink: "Discover All Free AI Tools" (single color)     │
│  • Sub: "All tools in one place…"                          │
│  • Search input: bg #FDFBF7, ink text, gold hairline       │
│  • Category pills: jj-pill-active (cream + ink + gold)     │
├────────────────────────────────────────────────────────────┤
│  CATEGORY GROUPS (loop, one per category)                  │
│  Each group is its own PremiumSectionCard on champagne;    │
│  cards inside use the same tone (champagne, ink, gold      │
│  hairline, IconTile in mode-purple for AI tools). Replaces │
│  the neon purple/blue/red slabs.                           │
├────────────────────────────────────────────────────────────┤
│  PORTAL ROW — surface band, 2 cards (Broker / Investor)    │
│  • Champagne cards, ink copy, IconTile (gold)              │
│  • CTA = jj-cta-dark (navy + white + gold hairline)        │
│    "Open Broker Portal" / "Open Investor Hub"              │
├────────────────────────────────────────────────────────────┤
│  WELCOME-BACK BAND — raised champagne                      │
│  "Welcome back, {firstName}" + sub + jj-cta-dark           │
│  "Explore Tools Above" (now visible)                       │
└────────────────────────────────────────────────────────────┘
```

## Technical changes

- **File:** rewrite `src/pages/AIHub.tsx` end-to-end. Keep the existing tool registry imports + visibility hook + category list so every currently-listed tool still renders.
- Replace ad-hoc `bg-purple-900/80 …` / neon shadow classes with the locked primitives:
  - Bands: `.jj-band jj-band--page` / `jj-band--surface` / `jj-band--raised`
  - Section shell: `<PremiumSectionCard>`
  - Buttons: `.jj-cta-dark` (navy), `.jj-cta-champagne` (ink), `.jj-pill-active`
  - Icons: `<IconTile />` (`tone="gold"` for trust + portal, `tone="purple"` for AI-tagged tools)
  - Price/dev labels untouched (not used here)
- Hero video: reuse the existing AI/data-mesh `.mp4` used by Market Intelligence Hero (`MarketIntelligenceHero` pattern); fallback poster image.
- All text colors come from semantic tokens (`text-[#1A1A1A]`, `text-white` only on verified-dark surfaces). No raw grays, no faded gold.
- Add `data-marketing-page` on the root so the full-bleed band system applies.
- Remove every `SectionDivider` line (no-op per memory) — sections separated by band-tone alternation only.
- Keep route, SEO head, auth check, and all existing tool data. **No tool, link, or section is removed.**

## Verification

1. Build passes (auto).
2. Open `/ai-hub` in preview, screenshot full page; visually confirm:
   - Hero headline + badge legible over video.
   - 3 CTAs equal width/height, aligned, all readable.
   - 4 trust cards show gold IconTiles (not black squares).
   - "Discover" heading single-color, search input readable.
   - No neon purple/blue slabs; category groups sit on champagne with gold hairline.
   - Portal CTAs are navy `#102540` with white text.
   - "Explore Tools Above" CTA visible.
3. Run contrast guard scripts if they trigger; fix any flag.

## Out of scope (deferred, as noted last turn)

- Deeper Developers Portal expansion (new sidebars, admin/rep sub-pages) — queued as next task per prior message.
