
## Why your Amra project looks missing

Your upload **did** save. In the database:

- `Amra The First Integrative Wellness Resort` — Citi Developers — uploaded 2026-07-06 17:18
- `Amra Residences` — Citi Developers — Feb 2026
- `In Amra Residences` — Mar 2026
- `Amra` — Citi Developers — Mar 2026

Two problems today:

1. **My Projects** only lists the first ~500 in a fixed order and has **no search or status filter**, so newer or pending uploads fall off-screen with no way to find them.
2. There is **no duplicate-check step** on upload, so the same building gets saved under multiple names with different cover photos.

---

## What I'll build

### 1. My Projects — search + status filter + newest-first ordering
- Add a **search box** (searches project name + developer name, debounced).
- Add tabs/filters: **All · Published (Live) · Pending · Draft · Unpublished**.
- Default sort: **newest first** so anything you just uploaded is always at the top.
- Increase the effective list ceiling and add "Load more" so you never lose a project past 500.

### 2. Show pending projects too
- Currently the page filters to published only. I'll surface pending, draft, and unpublished with a colored status badge on each row (green Live, amber Pending, grey Draft).

### 3. AI duplicate-check assistant on every upload surface
Adds a small AI panel inside:
- **Developer Portal → Add / Upload Project**
- **Owner → My Projects → Add Project**
- **Founder / bulk upload flows**

Behavior when you type a project name:
- Runs a fuzzy match against `projects` (name, developer_name, area, address, aliases).
- Uses AI to normalize variations ("Amra" / "Amra Residences" / "In Amra Residences" / "Amra The First Integrative Wellness Resort" → same building).
- Shows: "⚠️ 3 possible existing matches for **Amra** by Citi Developers" with each match's cover, name, developer, area, upload date, and **Open / Merge / Continue anyway** actions.
- Blocks silent duplicates by requiring the user to explicitly confirm "This is a new project" before saving.

### 4. Clean up the existing Amra duplicates
I will not auto-delete. Instead I'll surface the four Amra records inside the new duplicate-check panel so you can pick the canonical one and merge/archive the others in one click.

---

## Technical notes

- **Search**: client-side filter on the query result plus a server-side `ilike` on `name` and `developer_name` for lists over 500.
- **Status filter**: uses existing `projects.status` + `is_published` columns (both already exist). No schema change.
- **Duplicate detection service**: new `src/services/projectDuplicateCheck.ts` that runs (a) trigram/`ilike` prefilter over `projects.name` and `developer_name`, then (b) a Lovable AI call (`google/gemini-2.5-flash`) to score semantic similarity and return a ranked match list.
- **UI**: new `<ProjectDuplicateCheck>` component embedded in the three upload surfaces above.
- **My Projects page** (`src/pages/owner/developers/OwnerDevelopersProjects.tsx` or equivalent): add `SearchInput`, `StatusTabs`, `order('created_at', { ascending: false })`, and "Load more" pagination.

No database migration needed.

---

## What I won't touch unless you ask

- Deleting or merging Amra records automatically.
- Renaming existing projects.
- Changing publish/unpublish behavior itself.

Approve this and I'll implement it end-to-end and verify with screenshots.
