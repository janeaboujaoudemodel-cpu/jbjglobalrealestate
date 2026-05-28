
## Goal

Replace the flat champagne-gold treatment on the tool pages with a **premium, differentiated, per-tool look**:
one big outer card per tool, animated ombré border in that tool's signature color fading into ink black (matching the header), centered hero, and all CTAs / status chips / focus rings color-matched to the same accent.

## Tools in scope (each gets its own color)

| Tool | Route | Accent |
|---|---|---|
| AI Home Finder | `/quiz` | Violet → ink |
| Property Evaluator | `/property-evaluator` | Navy → ink (existing) |
| Property Comparison | `/compare` | Burgundy → ink (existing) |
| Rental Index | `/rental-index` | Emerald → ink (existing) |
| Property Measurement | `/property-measurement` | Teal → ink (new) |
| Interior Design AI | `/interior-design-ai` | Rose → ink (new) |
| Business Card Scanner | `/business-card-scanner` | Amber → ink (new) |

Champagne/gold stays only as the page background tint so the tool clearly "sits" on the JBJ site, but **no gold card fills, no gold buttons** inside the tool shell.

## Visual system

```text
┌──────────────────────────────────────────────────────────┐
│  page bg: champagne #FDFBF7                              │
│                                                          │
│   ┌─ animated ombré border (accent → ink, 2px) ───────┐ │
│   │                                                   │ │
│   │   ┌─ Centered Hero ─────────────────────────────┐ │ │
│   │   │  icon tile (accent)                         │ │ │
│   │   │  H1 (ink)   accent word in accent color     │ │ │
│   │   │  subtitle (ink/70)                          │ │ │
│   │   └─────────────────────────────────────────────┘ │ │
│   │                                                   │ │
│   │   ┌─ Form / Content section ─────────────────────┐│ │
│   │   │  inputs, selects, CTA (accent → ink gradient)││ │
│   │   └──────────────────────────────────────────────┘│ │
│   │                                                   │ │
│   │   ┌─ How it works · Data sources · Disclaimer ──┐ │ │
│   │   └──────────────────────────────────────────────┘ │ │
│   └───────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

All sub-sections share **one** outer card. Internal blocks are separated by a thin accent-tinted hairline, not by another card.

## Build steps

1. **Extend the theme registry** `src/components/tools/toolThemes.ts`
   - Add `violet`, `teal`, `rose`, `amber` themes following the same shape as `emerald`/`navy`/`burgundy` (heroGradient, accent, accentSoft, accentBorder, ctaGradient, ctaHover, chipBg, chipBorder).
   - Add `borderGradient` (animated conic/linear gradient from accent → ink → accent) used by the new shell.

2. **New `PremiumToolShell` component** `src/components/tools/PremiumToolShell.tsx`
   - Single outer rounded-2xl card.
   - Animated 2px ombré border using a masked gradient div (`@keyframes tool-border-spin` rotating a conic gradient `accent → #000 → accent`) — pure CSS, no JS.
   - Centered hero slot (icon tile + title + subtitle).
   - Children slot for body sections, separated by `<ToolDivider tone={theme} />` (thin accent-fade hairline, replaces gold one inside the shell).
   - Accepts `theme: ToolTheme`.

3. **New `ToolCTA` button** `src/components/tools/ToolCTA.tsx`
   - Uses `theme.ctaGradient` / `theme.ctaHover`, white text, subtle accent glow on hover, no gold.
   - Replaces every primary CTA inside the 7 tools.

4. **Status chips / badges inside tools**
   - Helper `ToolChip` styled with `theme.chipBg` + `theme.chipBorder` + accent text. Used for "AI Powered", market trend, demand level, etc. (currently violet/gold mix).

5. **Refactor each tool page** to:
   - Import its theme (`toolThemes.violet` etc.).
   - Wrap entire page content in `<PremiumToolShell theme={...} title subtitle icon>`.
   - Remove inner `ToolCard` champagne tiles where they create the "boring gold" double-card effect; keep `ToolCard` only for the legal disclaimer block (re-skinned to accent hairline).
   - Replace `PrimaryCTA` with `ToolCTA`.
   - Center the hero header content (currently left-aligned in `RentalIndex`, `PropertyEvaluator`, etc.).
   - Color all icons, focus rings, asterisks, and section headings with `theme.accent`.

6. **PropertySuite tab bar** `src/pages/toolkit/PropertySuite.tsx`
   - Map each tab to its tool's accent (already partially done) and switch the suite outer background to a soft accent tint that follows the active tab, so the shell feels coherent when switching tabs.

7. **Add missing tools to the suite / hub**
   - Property Measurement, Interior Design AI, Business Card Scanner are not currently inside `PropertySuite`. Add them to the AR / utility tools section of `RoyalToolsHub` with the same `PremiumToolShell` treatment on their own pages (no tab change required unless desired).

## Out of scope

- No backend, data, or copy changes.
- Champagne/gold global theme stays intact for the rest of the site (footer, marketing, listings) — only the 7 tool pages are restyled.
- No new animations beyond the border shimmer and existing fade-in.

## Risk / guardrails

- Memory rule "No gold fills / champagne-gold standard" is **site-wide**. These tool pages are an explicit, named exception (matches the prior pattern where `emerald/navy/burgundy` themes already exist). Will document this as a memory update after build: "Tool pages use `PremiumToolShell` with per-tool ombré accent; gold remains only as page background tint."
- Contrast guard: CTA gradients end in `#000`, white text — passes WCAG. Accent-on-champagne headings use full-saturation accents (not faded), so the faded-gold prohibition still holds.
