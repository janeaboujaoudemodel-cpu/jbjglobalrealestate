# Project / Listing Card Overhaul + Locked Developer Rule

Scope: `ProjectCard` (used on Home + /properties + everywhere), `FeaturedListings` grid, sale-status badge behavior, owner edit affordance, and a global "no card without developer logo" rule.

## 1. Remove carousel arrows from cards (global)

In `src/components/ProjectCard.tsx`:
- Delete the entire `{images.length > 1 && (...)}` block that renders the `ChevronLeft` / `ChevronRight` prev/next buttons and the dots indicator (lines ~209–253).
- Remove the `ChevronLeft, ChevronRight` imports, `currentImageIndex` state, and `handlePrevImage` / `handleNextImage` handlers. Card image becomes a single static cover (`primaryImageUrl`).
- Carousel arrows remain ONLY inside the project detail gallery (`/project/:slug`), untouched.
- Add a project-wide rule (memory entry + brief comment): card-level image navigation arrows are banned. If any arrow is ever needed on a card, it must be solid black `#1A1A1A` or gold `#B89555` in BOTH idle and hover states — never white-on-image or faded.

## 2. Bottom row: price LEFT, handover RIGHT (everywhere, including homepage)

In `ProjectCard.tsx`:
- Remove the homepage-only "price over image" branch (lines ~287–295).
- Remove the `isHomepage` ternary on the bottom row (lines ~366–376) so the price pill always renders on the left of the handover line, on every page.
- Remove the `flex-1` spacer `<div>` (line 363) AND remove the "Premium full-width divider" line above it (line 360)? Keep ONE divider (the existing gold gradient divider already sits above the meta block); the bottom row sits directly after the description, no large empty rectangle.
  - Net result: description → thin gold hairline → `price (left) ⋯ Ready (right)` row, with normal `gap-3` only.

## 3. Sale-status badge ("On Sale" / "Announced" / "Presale")

- Default behavior: do NOT render `saleStatusLabel` on cards. Hide automatically unless the owner has explicitly enabled it for that project.
- New owner-only toggle stored on the project: reuse existing `project.show_sale_status` flag (add it if missing via migration: boolean default false on `projects`).
- When the flag is true AND a sale status exists, render a NEW badge variant `status-frame`:
  - Square-cornered (or `rounded-sm` 2px) rectangle, NOT a pill.
  - Champagne surface `#F7F2EA`, 1px gold border `#B89555`, ink-black text `#1A1A1A`.
  - Matches the visual frame of the price pill so they read as a pair.
  - Added to `src/components/ui/card-badge.tsx` as a third variant; existing `card-status-badge` rounded style stays available but is no longer used on cards.

## 4. Owner edit affordance on every card

- New tiny `<OwnerCardEditMenu projectId saleStatus showSaleStatus />` rendered top-right of the card (only when `useEffectiveOwner().effectiveOwner === true`).
- Pencil icon button → popover with:
  - Toggle "Show sale-status badge"
  - Select for sale status (`On Sale` / `Announced` / `Presale` / `Sold Out` / none)
  - "Edit full listing" link to existing admin editor
- Writes to `projects.show_sale_status` and `projects.status_label` via existing owner-scoped mutation hook.
- Mirror it on the developer directory card and project detail header so owners can edit from any surface (single shared component).

## 5. Grid: 3 per row × 2 rows = 6 listings (desktop horizontal)

In `src/components/home/FeaturedListings.tsx`:
- Change grid to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (drop the 4-col breakpoint).
- Mobile: 1 column visually but cap the list to 3 cards (premium > dense). Tablet portrait (`sm`, up to ~1024 vertical): 2 cols.
- Desktop landscape (`lg` and up): 3 cols × 2 rows.
- Reduce skeleton + slice to 6.
- In `src/hooks/useHandpickedProjects.ts` lower `TARGET` from 8 to 6 so all fallback branches respect the new count.

Responsive intent summary:

```text
phone portrait     → 1 col, 3 cards total
tablet portrait    → 2 cols, up to 6
tablet landscape   → 3 cols × 2 = 6
desktop            → 3 cols × 2 = 6
```

## 6. LOCKED RULE: no listing card / project page without developer logo

Root cause for Four Seasons DIFC, Avalon Boulevard, Vivante (Meteora), Aisha Residence 1/2: their `developers.logo_url` is NULL.

Two-layer enforcement:

**A. Display fallback (immediate, no blank cards)**
- `ProjectCard.tsx` top-left badge: when `getDeveloperLogoUrl()` returns null, render `<DeveloperLogo variant="nameplate" name={project.developer?.name} />` instead of the `property_type_label` pill. This guarantees the developer is ALWAYS identifiable on the card (champagne plate with the developer wordmark — primitive already exists in `src/components/ui/DeveloperLogo.tsx`).
- Project detail page: require the existing Developer section to render the same nameplate fallback when logo is missing — never hide the section.

**B. Publication gate (locked, schema-level)**
- New migration: extend `trg_enforce_no_publish_without_photo` (or add sibling `trg_enforce_no_publish_without_developer`) so a project cannot be `is_published=true` unless its developer exists AND `developers.logo_url IS NOT NULL` AND passes the same allow-list as `isValidDeveloperLogoUrl` (basic regex check in SQL).
- Photoless / logoless projects show up in `/admin Listings Approval` → new "Needs Developer Logo" tab beside "Needs Photo".
- Memory: add `mem://constraints/no-developer-logo-no-publish-rule` and update `mem://index.md` Core to include: "A project without a developer logo can NEVER be published. Cards must always show the developer (logo or nameplate fallback)."

## 7. Memory updates

- Update `mem://ui-ux/visual-standards/listing-card-layout-standard` with: no carousel arrows on cards; price LEFT / handover RIGHT on every page; no spacer rectangle; sale-status badge hidden by default; rectangular gold-bordered frame style.
- Add `mem://constraints/card-arrow-prohibition` (no faded white-on-white arrows anywhere; if used, solid black or gold only).
- Add `mem://constraints/no-developer-logo-no-publish-rule`.
- Update Core line: "Listing Cards: ... no carousel arrows; price-left / handover-right bottom row; sale-status badge owner-opt-in, rectangular gold-frame style."

## Technical notes

- DB migration adds `projects.show_sale_status boolean not null default false` and extends the publish trigger.
- `CardBadge` gets a `status-frame` variant (square corners, champagne fill, gold border, ink text).
- `OwnerCardEditMenu` is a new file under `src/components/cards/`. Reuses `useEffectiveOwner` + existing project-update mutation. RLS already restricts writes to owner.
- No changes to header, sidebar, footer, AI Concierge, hero search, or any non-card surface.
- `useHandpickedProjects` TARGET → 6; mobile slice handled in `FeaturedListings` (`projects.slice(0, isMobile ? 3 : 6)`).

## Files touched

- `src/components/ProjectCard.tsx` (arrows out, bottom-row restructure, owner menu, nameplate fallback)
- `src/components/home/FeaturedListings.tsx` (grid 3-col, slice to 6, skeleton count)
- `src/hooks/useHandpickedProjects.ts` (TARGET = 6)
- `src/components/ui/card-badge.tsx` (new `status-frame` variant)
- `src/components/cards/OwnerCardEditMenu.tsx` (new)
- `supabase/migrations/*` (add `show_sale_status` column + extend publish trigger)
- Memory files under `mem://` (new + index)
