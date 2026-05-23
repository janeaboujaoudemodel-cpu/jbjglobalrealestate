## Goal

1. Replace the homepage **"Handpicked For You"** mini-card with the canonical `<ProjectCard />` used on `/properties` — pixel-for-pixel the same component, no duplication.
2. On that canonical card, **replace the top-left "Apartment" property-type label with the approved developer logo** (same `<DeveloperLogo variant="bare" />` already used on Featured Listings). This change applies globally wherever `<ProjectCard />` is rendered.
3. Make Handpicked **personalized** — drive its results from each user's actual signals (interest form, search filters, favorites, browsing history, selected mode), with a deterministic public-visitor fallback so the section never looks empty.
4. QA in the live preview before marking done.

---

## Files touched

| File | Change |
|---|---|
| `src/components/ProjectCard.tsx` | Top-left badge: swap `property_type_label` (text "Apartment") for `<DeveloperLogo />` overlay. One-line conditional fallback to the old text badge only if no `developer.logo_url` exists. |
| `src/hooks/useHandpickedProjects.ts` *(new)* | Personalized recommender. Reads signals → builds a ranked project list. Returns `{ projects, isLoading, source }`. |
| `src/components/home/FeaturedListings.tsx` | Delete the inline mini-`ProjectCard` (lines 155–266). Import the canonical `ProjectCard` from `@/components/ProjectCard`. Swap data source from `useFeaturedProjects` → `useHandpickedProjects`. Keep header, grid, View All CTA, layer-2 band, skeletons. |

No other files are modified. The `ELITE_DEVELOPERS` fallback logic is preserved inside `useHandpickedProjects` as the anonymous-visitor branch — no removal of existing behavior.

---

## ProjectCard.tsx — the only visual change

Current block (lines 253–258):

```tsx
{project.property_type_label && (
  <CardBadge variant="status" className="absolute top-3 left-3 z-10">
    {project.property_type_label}
  </CardBadge>
)}
```

Becomes:

```tsx
{logoUrl ? (
  <div className="absolute top-3 left-3 z-20">
    <DeveloperLogo src={logoUrl} alt={project.developer?.name || ''} variant="bare" loading="lazy" />
  </div>
) : project.property_type_label ? (
  <CardBadge variant="status" className="absolute top-3 left-3 z-10">
    {project.property_type_label}
  </CardBadge>
) : null}
```

Everything else — image carousel, dots, sale-status badge, price pill, title/location order, DeveloperLink, description, hairline divider, handover-orange pill, Email/Call/Chat row — stays byte-identical so Properties, Resale, Map, and the new Handpicked all render the same card.

---

## Personalization hook — `useHandpickedProjects`

Tiered signal pipeline (first match wins, all stack):

1. **Logged-in + interest form filled** → query `crm_leads` for the current user's `email_lower` and pull `property_type`, `bedroom_requirement`, `budget_min/max`, `preferred_location`. Build `projects` SELECT with matching filters, ordered by closeness to budget midpoint.
2. **Favorites** → if the user has rows in `favorites`, fetch the developers/areas of those projects and recommend more from the same developer + area.
3. **Recent browsing** → read existing localStorage browsing history (already maintained per Memory: Browsing History Deduplication). Boost projects matching last viewed developers/areas.
4. **Mode-aware fallback** *(anonymous or zero signal)* → use current `ELITE_DEVELOPERS` rotation logic, but bias by `useUserModeContext`:
   - investor → ready + high-yield areas (Business Bay, Marina, Downtown)
   - broker → broad mix across all elite developers (current behavior)
   - developer → projects from their own developer first, then peers

Each tier returns up to 8 results, dedup by `id`, fill remaining slots from the next tier so the grid is always 8 cards. Same `SELECT` shape as the existing query so the canonical `ProjectCard` consumes it without prop changes (it already accepts the `Project` type — we'll map the FeaturedProject fields to `Project` via a small adapter, or query directly with the full `Project` SELECT used by `useProjects`).

No new tables. No migration. Pure read-side composition over `projects`, `favorites`, `crm_leads`, and localStorage.

---

## FeaturedListings.tsx — slimmer

```tsx
import ProjectCard from "@/components/ProjectCard";
import { useHandpickedProjects } from "@/hooks/useHandpickedProjects";
// ...
const { projects, isLoading } = useHandpickedProjects();
// grid maps projects → <ProjectCard project={p} currency="AED" sizeUnit="sqft" />
```

Inline mini-card and `useFeaturedProjects` are removed. Heading stays "Handpicked For You", chips and View All CTA untouched.

---

## Memory updates

Append a one-line memory:

> **Handpicked = Canonical ProjectCard** — `/` Handpicked For You section MUST render `<ProjectCard />` from `src/components/ProjectCard.tsx`. No private mini-card duplicates. Top-left badge across all ProjectCard consumers is the developer logo; only falls back to property-type text when `developer.logo_url` is missing.

---

## QA (before marking done)

After build:

1. `browser--navigate_to_sandbox` → `/` → screenshot the Handpicked section. Confirm: same card chrome as `/properties` cards, developer logos visible top-left (no "Apartment" text), price pill bottom-right, Email/Call/Chat row present, identical hover lift.
2. Navigate to `/properties` → confirm logo replaces the "Apartment" badge there too.
3. Confirm 8 cards render, no duplicate developers, no empty state for anonymous user.
4. Open console — no React key warnings or 404 image fetches from the swap.
5. Resize to 414px — confirm grid collapses to 1 col and card still legible.

If any of the QA checks fail, fix in the same loop before reporting.

---

## What is intentionally NOT done

- No DB migration. All personalization is read-side.
- No new tracking events. We reuse signals already captured.
- No change to card vertical order, dividers, colors, or any other card region.
- No change to Featured Listings header copy, badge, or "View All Projects" CTA.
- Resale and Map pages get the logo upgrade for free via the shared card — no per-page work.
