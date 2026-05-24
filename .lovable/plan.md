## Goal

On every project's hero section, give the owner a quick way to click the hero image, open the project's gallery in a picker, and assign any photo as either:

- **Use as Cover** → updates `projects.cover_image_url` (the big hero image shown on the detail page)
- **Use as Profile** → updates `projects.card_image_url` (the thumbnail shown on listing/search cards across the site)

This is owner-only, never visible to public visitors. Listing cards and search/filter UI are not touched — only the data source they already read from changes.

## Scope

- Only the hero section of `src/components/project-detail/ProjectDetailLayout.tsx`.
- New component `src/components/project-detail/owner/HeroImagePicker.tsx`.
- No DB migration needed — `projects.cover_image_url` and `projects.card_image_url` already exist, and `project_images` already powers the gallery.
- No changes to listing cards, search, or other layouts.

## Behavior

1. When viewed by the owner (via existing `useIsAppOwner` / `useCanEdit("project_photos")`), a small champagne "Edit hero" pill appears in the top-right corner of the hero, below the 88px header (uses `top-[112px] xl:top-[120px]` so it never collides with the sticky header in any sidebar/header state). Public visitors see nothing.
2. Clicking the pill (or clicking anywhere on the hero while holding the owner badge) opens a modal "Select hero image" with:
   - A responsive grid of all `project_images` for this project (reuses the same query key `["owner-project-images", projectId]` so it stays in sync with the existing Owner · Photos manager).
   - Hover state on each tile showing two actions:
     - **Use as Cover** — sets `cover_image_url` (also bumps that image's `display_order` to 0 so it's first in the carousel).
     - **Use as Profile** — sets `card_image_url`.
   - Badges on the currently-selected Cover and Profile tiles so the owner sees what's active.
   - "Upload new photo" button at the top of the modal that reuses the same upload pipeline (`project-images` storage bucket → insert into `project_images`).
3. After either action, invalidate `["project", slug]`, `["projects"]`, `["owner-project-images", projectId]`, and `["nearby-projects"]` so the hero, listing cards, and nearby map refresh immediately.
4. Toasts confirm the action ("Cover photo updated" / "Profile photo updated").
5. All styling stays within the champagne-gold design system — no gray surfaces, no faded gold, gold used only as 1px hairline, premium pill matches the existing "SOLD OUT" badge sizing.

## Out of scope

- No changes to listing card layout, price pill, or developer label rules.
- No removal of the existing Owner · Photos manager further down the page — both coexist; the hero picker is just a faster entry point.
- No new RLS / migrations / edge functions.

## Files

- **New:** `src/components/project-detail/owner/HeroImagePicker.tsx`
- **Edit:** `src/components/project-detail/ProjectDetailLayout.tsx` — mount `<HeroImagePicker />` inside the hero section, gated by `isOwner`.
