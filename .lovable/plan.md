## Goal

Make the homepage read as a sequence of **self-contained premium cards** separated by real gold dividers, fix two interaction/visual bugs (Explore Services eyebrow + tab sync), and restyle Royal Tools Hub to match the Explore Services card pattern.

---

## 1. Full-bleed gold dividers between major sections

Currently `<SectionDivider fullWidth />` is rendered between sections but is a **permanent no-op** per the No-Gray standard, so nothing visible separates Featured Properties → Invest in Dubai → Explore Our Guides.

Introduce a new full-bleed primitive `SectionDividerGoldFullBleed` (thin variant of `SectionDividerGold`) that escapes container padding (`w-screen relative left-1/2 -ml-[50vw]`) and renders the existing gold gradient. Use it in `src/pages/Index.tsx` at these joints only:

- After Featured Properties / Resale block → before **Invest in Dubai** (OverseasInvestorsBanner)
- After **Invest in Dubai** → before **Explore Our Guides** (HomepageBookMarquee)
- After **Explore Our Guides** → before **Explore Our Services**
- After **Explore Our Services** → before **JBJ Royal Tools Hub**
- After **JBJ Royal Tools Hub** → before AI Comparison / Mortgage

Existing `<SectionDivider />` calls stay (still no-op) so nothing else changes.

---

## 2. Wrap homepage sections in the gold-bordered "premium card" style

The Mortgage Calculator and Explore Our Services already use the canonical premium card shell:

```text
rounded-2xl border border-[#B89555]/30 bg-[#F7F2EA]/[#FDFBF7]
shadow-[0_8px_28px_rgba(184,149,85,0.10)]
```

Create a shared primitive `PremiumSectionCard` (small wrapper at `src/components/ui/premium-section-card.tsx`) that renders that shell with consistent padding, then refactor these sections to mount inside it (content unchanged):

- **FeaturedListings** (Handpicked For You + View All CTA together)
- **ResalePropertiesSection**
- **OverseasInvestorsBanner** (Invest in Dubai)
- **HomepageBookMarquee** (Explore Our Guides)
- **AreasWeCover** (Top Areas in Dubai)
- **JBJPodcastSection**

Only the outer wrapper changes; internal layouts, copy, images, and CTAs are preserved. ExploreServicesExpander, ToolkitShowcaseCard, and MortgageCalculator already use the shell — they stay as-is.

---

## 3. Fix `ExploreServicesExpander`

File: `src/components/home/ExploreServicesExpander.tsx`

- **Remove the eyebrow** "JBJ Service" with the small icon (lines 136–139) that sits above the active service title — the tab strip already identifies the active service.
- **Verify tab → hero sync**: the code already sets `active` from `activeId` and the `Explore Now` link already uses `active.href`. If a stale-state issue is observed in preview after the eyebrow removal, force a remount of the hero panel via `key={active.id}` on the wrapper (already present on the bg div — extend to the whole panel so title/description/CTA refresh together).

---

## 4. Restyle JBJ Royal Tools Hub as a scrollable card (Explore Services pattern)

File: `src/components/home/ToolkitShowcaseCard.tsx`

Convert the current 8-tile grid into the same layout idiom as `ExploreServicesExpander`:

- Keep the existing premium card shell (already gold-bordered).
- Replace the grid with:
  1. **Header** — title + sub (kept).
  2. **Horizontally scrollable tabs row** (one tab per tool, icon + name) using the same scroller pattern as ExploreServicesExpander (`overflow-x-auto no-scrollbar`, border-b active underline in `#1A1A1A`).
  3. **Active tool hero panel** below the tabs — large card showing the active tool's icon tile, name, description, and a primary CTA button that links to `tool.href`. Same 280–340px height.
  4. **Footer "Explore JBJ Tools" PearlButton** kept as a secondary "view all" affordance.
- Render **all** approved public tools (drop the `.slice(0, 8)` cap) so users can scroll through every tool inline.

This gives Royal Tools Hub the same "premium card with scrollable inner content" feel the user asked for.

---

## 5. Files touched

**New:**
- `src/components/ui/premium-section-card.tsx`
- `src/components/ui/section-divider-gold-fullbleed.tsx`

**Edited:**
- `src/pages/Index.tsx` — swap no-op dividers between Featured / Invest / Guides / Services / Tools for the new full-bleed gold divider; wrap target sections in `PremiumSectionCard`.
- `src/components/home/ExploreServicesExpander.tsx` — remove eyebrow, ensure key-based remount.
- `src/components/home/ToolkitShowcaseCard.tsx` — convert grid → tabs + hero panel; render all tools.

**Unchanged:** hero, header, footer, ProjectCard, MortgageCalculator inner UI, all other features (No-Removal policy honored).

---

## Out of scope

- No backend / data / RLS changes.
- No edits to header, sidebar, ProjectCard, or any other component beyond the 3 files above.
- No font, palette, or icon-system changes — strict reuse of the existing champagne / `#B89555` tokens.
