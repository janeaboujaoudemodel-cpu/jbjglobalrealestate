
# Homepage Portal Showcase Card — Luxury Redesign

Scope is strictly the **public homepage cards that advertise the portals**. None of the actual portal apps (Broker / Developer / Careers / Owner / Investor) or their internal dashboards will be touched.

## What's wrong today

The current "PortalVisitCard" lives inline inside `src/components/home/DeveloperPortalCTA.tsx` and is the only public portal showcase on the homepage. It carries the exact issues called out:

- A generic `Briefcase` / `PieChart` lucide icon dropped in a 200×260 "portrait tile" as the hero visual
- `Est · MMXXV` decorative serial at the bottom
- "JBJ" tracked monogram rule above the icon (decorative without purpose)
- Only Investor + Broker variants exist; Careers / Owner / Developer have no matching showcase card on the homepage
- The card is duplicated by-shape (not by-code) anywhere else portals are pitched

## Goal

One reusable, brand-aligned component — `<PortalShowcaseCard />` — that every homepage portal pitch renders through. Update it once, every portal showcase across the homepage updates with it.

## Deliverables

### 1. New component — `src/components/home/PortalShowcaseCard.tsx`

A single canonical card. Props:

```ts
type PortalKind = "broker" | "developer" | "careers" | "owner" | "investor";

interface PortalShowcaseCardProps {
  kind: PortalKind;           // drives hero artwork + accent
  eyebrow: string;            // e.g. "Broker Portal"
  title: string;              // e.g. "Your Broker Portal"
  description: string;        // 1–2 sentence value prop
  cta: string;                // e.g. "Access Platform"
  href: string;               // resolved by caller (auth-aware)
  features: { label: string; icon: LucideIcon }[]; // 3–4 chips
}
```

Visual system (locked to brand memory: champagne #FDFBF7 / surface #F7F2EA / raised #EFE6D6, gold #B89555 as 1px hairline only, ink #1A1A1A, navy #102540 CTA):

- Outer navy frame (kept — already on-brand) with gold hairline
- Inner champagne card, layered cream gradient, soft radial gold wash, no flat white
- Editorial typography hierarchy: eyebrow plaque → display title with gold hairline accent → body → feature chips → primary navy CTA + helper line
- **Hero region replaces the icon-in-portrait-tile.** Instead of a lucide icon, render a `<PortalHeroArt kind={kind} />` SVG (see §2). Tall portrait frame stays as a luxury "plate" but its content is purposeful architectural line art, not a generic icon.
- **Remove:** `Est · MMXXV`, the centered Roman serial, the standalone `JBJ` monogram rule above the icon, and any bag/briefcase emblem usage as the hero.
- Hover: subtle lift (`-translate-y-0.5`), gold-glow shadow ramp, 300ms transition. No aggressive motion.
- CTAs use luxury copy: "Access Platform" / "Explore Portal" / "Discover Features" (passed in by caller).
- Responsive: mobile stacks (hero hidden < lg, identical to today), tablet single-column, desktop 2-column grid. Verified across 360 / 768 / 1024 / 1440.

### 2. New artwork primitive — `src/components/home/portal-hero-art/`

One SVG per portal, monochrome ink + 1px gold hairlines on champagne. No raster, no emoji, no lucide-as-hero. Each ≈ 200×260, drawn to fit the existing plate.

| Kind | Hero artwork |
|---|---|
| `broker` | Luxury tower silhouette with thin gold node-network overlay (broker relationships) |
| `developer` | Architectural masterplan / tower blueprint wireframe with grid + section lines |
| `careers` | Stacked executive profile cards in a recruitment pipeline column |
| `owner` | Portfolio dashboard mark — stacked property tiles with a yield sparkline |
| `investor` | Portfolio growth chart with global meridian arc + premium data ticks |

All five share: identical frame dimensions, identical 1px gold hairline border at the plate, identical "JBJ" wordmark removed (no decorative serial). Strokes use `currentColor` so a single ink-tone change cascades.

### 3. Refactor — `src/components/home/DeveloperPortalCTA.tsx`

- Delete the inline `PortalVisitCard` definition.
- Replace each branch (`isInvestorMode`, `isBrokerMode`, developer flow header) with `<PortalShowcaseCard kind=... />`.
- Keep all existing auth/href resolution logic intact (broker auth gate, owner preview param, developer registration gating). No business logic changes.

### 4. Add the missing portal showcases on the homepage

The user explicitly lists five portals. Today only Investor + Broker render. Add:

- **Careers Portal** showcase card → `href="/join"`
- **Owner Portal** showcase card → `href="/owner"` (visible to owner mode only; otherwise hidden, same gating pattern as developer)
- **Developer Portal** showcase card → reuse for developer mode visitors before they have a registration row (currently renders nothing — they'll now see the luxury pitch card)

Placement: same slot in `src/pages/Index.tsx` that already renders `<DeveloperPortalCTA />`. The component continues to render at most ONE card based on active mode — no card spam. The new Careers card surfaces in a dedicated public slot (visible to all modes) since careers is universal.

### 5. Cleanup

- Remove unused imports in `DeveloperPortalCTA.tsx` left over from the inline card.
- No new dependencies.
- No design-token additions — uses existing brand hex values already in memory.

## Files touched

- **NEW** `src/components/home/PortalShowcaseCard.tsx`
- **NEW** `src/components/home/portal-hero-art/BrokerHeroArt.tsx`
- **NEW** `src/components/home/portal-hero-art/DeveloperHeroArt.tsx`
- **NEW** `src/components/home/portal-hero-art/CareersHeroArt.tsx`
- **NEW** `src/components/home/portal-hero-art/OwnerHeroArt.tsx`
- **NEW** `src/components/home/portal-hero-art/InvestorHeroArt.tsx`
- **NEW** `src/components/home/portal-hero-art/index.ts` (PortalHeroArt switch)
- **EDIT** `src/components/home/DeveloperPortalCTA.tsx` (swap to shared card, drop inline `PortalVisitCard`)
- **EDIT** `src/pages/Index.tsx` (mount Careers portal showcase slot)

## Out of scope (will NOT change)

- `/broker/portal`, `/developer-portal`, `/owner`, `/investor-dashboard`, `/join` — actual portal apps and dashboards
- Auth flows, role gating, mode context, CRM, database schemas
- Header, sidebar, footer, mode picker
- Any other homepage section (hero search, services expander, mortgage calculator, etc.)

## Verification

After implementation:

1. Visit `/` in investor / broker / developer / owner modes — confirm only the correct portal card renders and `Est · MMXXV` / bag icons are gone everywhere.
2. Resize to 360px, 768px, 1024px, 1440px — confirm hero artwork hides cleanly < lg and the card stays balanced.
3. Hover each CTA — confirm subtle lift + gold-glow shadow, navy stays navy with white text.
4. Confirm no console / build errors.
