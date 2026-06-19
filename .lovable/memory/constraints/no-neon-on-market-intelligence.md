---
name: No Neon Shell on Market Intelligence
description: Market Intelligence (overview, areas, area-detail, reports, methodology, monthly/quarterly/annual briefs, internal subpages) must never render on data-neon-page. Use champagne+gold+ink palette only.
type: constraint
---
Removed by owner directive (Jun 2026). Market Intelligence pages previously used `[data-neon-page]` which produced cyan/violet/magenta orbs, navy KPI cards, and a cyan "MARKET INTELLIGENCE" eyebrow — all off-brand.

Rules:
- Root of every `/market-intelligence/*` page = `bg-[#FDFBF7]` (page champagne), ink text. No `data-neon-page`, no `bg-gradient-to-br from-[hsl(32,28%...)]` dark gradient.
- Section bands use `.jj-section-champagne` / `.jj-band-surface` / `.jj-band-raised` — never `bg-[#1A1A1A]` parent wrappers (those produced empty espresso strips between cards).
- KPI cards / Quarterly tiles / Performance rows = `.jj-card-inner` (champagne #FDFBF7, 1px gold #B89555/30 hairline, ink text).
- Hero uses `MarketIntelligenceHero` WITHOUT `.jj-hero-neon` (no cyan/violet/magenta orbs). Dark video bg with black overlay is OK; eyebrow stays gold (#B89555) on glass.
- "Explore More Market Intelligence" pre-footer uses the existing champagne `PreFooterSeparator` — no blue CTAs.

**Why:** Owner repeatedly stated Market Intelligence must match the global champagne palette site-wide; the neon shell was perceived as "broken colors" and "tiffany blue/cyan boxes".
