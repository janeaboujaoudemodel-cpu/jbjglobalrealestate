## What's actually wrong

1. **"When I click Properties it opens the wrong page."** The route `/properties` is wired to `PropertiesReelly` (a marketing landing), not to `Properties.tsx` which is the real listings page with Buy/Sell/Rent and Ready/Off-plan filters already built in.
2. **"Property Management page looks broken."** `src/pages/services/PropertyManagement.tsx` is built on a gold-on-champagne palette with `Playfair Display` serif. The hero subtitle uses `text-gray-600` on a near-black gradient (unreadable). This violates four locked design memories (Monochrome, Typography, CTA, Footer).
3. **The Properties click should reveal a richer menu** (Buy / Sell / Rent, Ready / Off-plan, plus categories: apartments, villas, townhouses, penthouses, retail, commercial, offices, plots).

I will not delete any feature on the Property Management page (No Removal policy) — only restyle.

---

## Step 1 — Properties navigation (dropdown + filtered page)

### 1a. Mega-menu in the top utility bar
File: `src/components/navigation/HorizontalUtilityBar.tsx` (the existing "Browse" Popover, lines ~226–263).

Expand the popover from 3 items to a 3-column mega-menu:

```text
┌──────────────────── BROWSE PROPERTIES ────────────────────┐
│ TRANSACTION       │ READINESS         │ CATEGORY          │
│  Buy              │  Ready to move    │  Apartments       │
│  Rent             │  Off-plan         │  Villas           │
│  Sell (list)      │  New launches     │  Townhouses       │
│                   │                   │  Penthouses       │
│                   │                   │  Commercial       │
│                   │                   │  Retail           │
│                   │                   │  Offices          │
│                   │                   │  Plots / Land     │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ [ See all properties → ]   [ Resale investor deals ] │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

Each link routes to `/properties` with the matching URL param the existing `Properties.tsx` page already understands:
- Transaction: `?transactionType=buy|rent`
- Readiness: `?completionStatus=ready` / `?completionStatus=off-plan` / `?status=new_launch`
- Category: `?type=apartment|villa|townhouse|penthouse|commercial|retail|office|plot`

Same pattern applied to `GlobalVerticalNav.tsx` Properties section so the side rail matches.

### 1b. Properties route fix
File: `src/routes/PublicRoutes.tsx` line 202.

Change:
```ts
<Route path="/properties" element={<PropertiesReelly />} />
```
to:
```ts
<Route path="/properties" element={<Properties />} />
<Route path="/properties/explore" element={<PropertiesReelly />} />
```

`PropertiesReelly` is preserved (No Removal) at the new `/properties/explore` path, and the marketing CTAs still work. The existing redirects `/buy → /properties?transactionType=buy` and `/rent → /properties?transactionType=rent` then reach the right page automatically.

### 1c. Filter chips on the listings page
`Properties.tsx` already shows Buy/Rent toggles and a Ready/Off-plan strip. I'll surface category chips (apartment, villa, townhouse, penthouse, commercial, retail, office, plot) in the same row using the existing `appliedFilters.propertyType` field, so the page lands with the chip pre-selected when arriving from the dropdown.

---

## Step 2 — Rebuild Property Management page on the locked design system

File: `src/pages/services/PropertyManagement.tsx`

Replace styling only — keep every section, every list, every FAQ, every CTA, every form field. Concretely:

| Currently | Replace with |
|---|---|
| `bg-gradient-to-br from-[#FDFBF7] via-[#F8F3EA] to-[#F0E8D8]` page bg | `bg-background` (white) |
| Hero `bg-gradient-to-b from-[#1a1714] to-[#151210]` + gold radial blobs | Clean white hero with a single thin `<AdaptiveHairline />` divider; eyebrow chip uses `border-border bg-card text-foreground` |
| `font-family: Playfair Display, serif` everywhere | `Inter` (project default) — remove inline `style={{ fontFamily }}` |
| `#C8A766` gold accents in body text/headings | `text-foreground` for headings, `text-muted-foreground` for descriptions, `--price-orange` only for any monetary stats |
| `text-gray-600` on dark hero (the unreadable line) | `text-foreground/80` on white hero |
| Gold CTA buttons (`PremiumHeroButton`) | Existing `Button` primary (black on white, white on black), no gold text |
| Champagne `CCard` (gradient + gold border) | Standard `Card` from `@/components/ui/card` with `border border-border` and white surface |
| Section heading "first word in gold" | Solid `text-foreground` heading; optional small uppercase eyebrow above in `text-muted-foreground` |

Trust badges, performance stats, onboarding steps, leasing steps, service modules, FAQ accordion, fees table, consultation form — all preserved.

---

## Step 3 — Global contrast audit (whole app, public + dashboards)

This is a sweep, not a redesign. Targets the patterns that produce the "unreadable / broken" feel:

1. **`text-gray-*` on dark surfaces** — replace with `text-foreground`, `text-muted-foreground`, or `text-white/80` per the surface, using the White-on-Light Guard rule.
2. **Solid white text on light/gold surfaces** — flip to `text-foreground` (the static/runtime guard already exists; I'll fix the violations it would catch).
3. **Gold text in interactive controls** (links, buttons, tab triggers) — replace with `text-foreground` per CTA System Standard. Gold remains permitted only as a thin hairline accent.
4. **Body copy at < 14px or `opacity < 0.7` on busy backgrounds** — bump to `text-sm` minimum and `/80` opacity floor.
5. **Disabled/muted form labels** — ensure `text-muted-foreground` resolves to a contrast ratio ≥ 4.5:1 on the surface.

I'll grep the codebase for the offending tokens (`text-gray-`, `text-[#C8A766]`, `text-white` on light bg, `Playfair`, etc.) and fix violations file-by-file. I'll batch this across:
- Public pages (Home, Properties, Communities, Services/*, About, Contact, Legal, Company Profile)
- Owner/admin dashboards
- Auth + onboarding screens

Locked features (Resale Investor Listings, Legal Hub, Company Profile Premium dark theme, AI purple theme, Executive Command Center) keep their distinct themes — the audit only fixes contrast violations inside them, not the theme itself.

---

## Files I'll touch

**Step 1 (nav + routing):**
- `src/components/navigation/HorizontalUtilityBar.tsx`
- `src/components/navigation/GlobalVerticalNav.tsx`
- `src/routes/PublicRoutes.tsx`
- `src/pages/Properties.tsx` (category chip row only)

**Step 2 (Property Management restyle):**
- `src/pages/services/PropertyManagement.tsx`

**Step 3 (contrast audit, in batches):**
- Targeted edits across `src/pages/**`, `src/components/**` where offending classes are detected. Each batch shows the file list before editing.

---

## Out of scope

- No database changes.
- No edge function changes.
- No removal of any existing section, link, or feature.
- Locked themes (Resale, Legal Hub, Company Profile dark, AI purple) keep their identity.
