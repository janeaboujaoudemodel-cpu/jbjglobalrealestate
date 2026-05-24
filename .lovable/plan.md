## What already exists (no duplication needed)

- `src/components/project-detail/ProjectNearbyPropertiesMap.tsx` — already rendered under "Project Location" on `/project/:slug` as a second map with the current project in **red** and other nearby projects as pins. Same-area first (matches `area_name`), then ~10km bbox fallback.
- `src/components/ContinueSearching.tsx` — already built and used on `/areas`, `/developers`, `/properties`. It is imported and lazy-loaded in `src/pages/Index.tsx` but **not rendered** anywhere on the homepage.
- `JBJ_BROWSING_HISTORY` localStorage key — **read** by `useHandpickedProjects.ts`, but **never written** anywhere in the codebase, so today nothing actually gets saved when a user visits a project.

The plan extends what's already there. No new map or duplicate "continue searching" component will be created.

## 1. Upgrade `ProjectNearbyPropertiesMap`

Edit the existing file only (no new component):

- Pin colors: keep current project **red** as today; switch the nearby pins from gold to **blue** (`#1D4ED8` → `#1E3A8A` gradient) to match the user's spec.
- Extend the data fetch to also return `developer_name` (and `developers.slug` via join) so the popup can credit the developer.
- Popup content per nearby pin:
  - cover image (existing)
  - project name → links to `/project/:slug` (existing, clickable)
  - **`<DeveloperLink />`** with developer name (clickable → `/developer/:slug`) — uses the project-wide standard, not a custom string
  - **`<PricePill />`** for the price (replaces hand-rolled "From AED …" so it respects the price/developer-label standard)
  - small **"← Back to {currentProjectName}"** ghost button at the bottom of the popup. It stores the current project's slug in `sessionStorage` under `JBJ_PROJECT_BACK_STACK` (push), then `Link` navigates to the nearby project.
- On `/project/:slug` mount, if `JBJ_PROJECT_BACK_STACK` is non-empty and the top entry is **not** the current slug, render a sticky **"← Return to previous project"** chip above the title. Clicking it pops the stack and `navigate(-1)`-style routes back to that slug. Pure frontend, no schema change.

Section heading stays "Other projects in this area" (already present).

## 2. Actually record browsing history

Create `src/lib/browsingHistory.ts` with a single `recordProjectView({ id, slug, name, developer_name, area_name, cover_image_url })`:

- Writes to the existing `JBJ_BROWSING_HISTORY` localStorage key consumed by `useHandpickedProjects`.
- Deduplicates by `slug`, most-recent first, capped at 20 entries — matches the "Browsing History Deduplication" memory standard.
- If the user is signed in, also upserts into a new `user_project_views` table (insert below) so history follows them across devices and surfaces in their account.

Call `recordProjectView(...)` once from `ProjectDetailLayout.tsx` inside a `useEffect` keyed on `project.id`. No UI change there.

### DB migration (one new table)

```sql
create table public.user_project_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid not null,
  project_slug text not null,
  viewed_at timestamptz not null default now(),
  unique (user_id, project_id)
);
alter table public.user_project_views enable row level security;
create policy "own views select" on public.user_project_views
  for select using (auth.uid() = user_id);
create policy "own views insert" on public.user_project_views
  for insert with check (auth.uid() = user_id);
create policy "own views update" on public.user_project_views
  for update using (auth.uid() = user_id);
create index on public.user_project_views (user_id, viewed_at desc);
```

No foreign key to `auth.users` (per project standard). Upsert refreshes `viewed_at` on revisit.

## 3. Restore "Continue Searching" on the homepage

Render the **existing** `ContinueSearching` (already lazy-imported on line 59 of `Index.tsx`) inside a `<PremiumSectionCard>` block right after `FeaturedListings`, wrapped in a `Suspense` fallback like every other home section. Same `type="property"` prop signature already used on `/properties`. No new component, no duplicated logic. If the user has zero history, `ContinueSearching` already falls back to trending (per the "History & Trending Fallback" memory).

## Files touched

- **Edit** `src/components/project-detail/ProjectNearbyPropertiesMap.tsx` — blue pins, developer in select + popup, `<PricePill />`, `<DeveloperLink />`, back-stack push button.
- **Edit** `src/components/project-detail/ProjectDetailLayout.tsx` — `recordProjectView` effect + "Return to previous project" chip.
- **New** `src/lib/browsingHistory.ts` — single source of truth for reads/writes of `JBJ_BROWSING_HISTORY` + `user_project_views`.
- **Edit** `src/pages/Index.tsx` — render the already-imported `ContinueSearching` after `FeaturedListings`.
- **Migration** — `user_project_views` table with RLS.

## Out of scope

- No new map library, no second nearby-projects component.
- No changes to `ContinueSearching.tsx` itself — it already does the right thing.
- No changes to how `useHandpickedProjects` consumes history — it already reads the same key.
