## Fix plan for My Projects (Developer Hub / Owner)

Confirmed via database: real off-plan total is **2,781** (813 Live, 1,968 Draft). The page shows 199/500 because the query was capped at 200 with a 500 upper cap. Amra has `description = null` — that's why publish blocks with `missing_description`. All Provident-sourced records lack cover/description because they were imported as skeletons.

### 1. Correct counts + Live tab actually working
- Replace client-side pagination with a **server-side aggregate**: fetch true totals (`count: 'exact', head: true`) for All / Live / Draft using the same `is_offplan` filter used elsewhere on the site — so the number matches the public directory (813 live).
- Load current tab's projects with `range()` pagination (200 at a time) instead of blanket `.limit(500)`. Load-more appends.
- Live tab (`is_published = true`) will now show the 813 live projects instead of 0.

### 2. Fix bulk toolbar "Clear" contrast
- The "Clear" button sits on the emerald bulk-action bar and the label is being washed by the `.jj-cta-emerald` global rule. Give it an explicit white outline + `#FFFFFF` text with inline style + `allow-white` so it survives the global emerald sweep. Also audit any secondary "Clear" chips inside search/filter areas that render on the champagne background and lock those to `#1A1A1A`.

### 3. Checkbox tick colour on emerald
- The shadcn `Checkbox` uses `text-primary-foreground` for the check icon. On the emerald-tinted selected state the icon renders near-black. Update `src/components/ui/checkbox.tsx` so `data-[state=checked]` forces `color:#FFFFFF` on the `<Check />` icon and background stays emerald. This fixes every checkbox in the app in one shot (My Projects, CRM tables, bulk toolbars, etc.).

### 4. Publish blocked by "missing_description" + Edit only shows price/handover
- Extend the inline Edit panel: add **Description** (textarea) and **Cover image** upload alongside price & handover — these are the fields most commonly missing.
- Add an **"AI fill from fact sheet"** button on the Edit panel. It calls a new edge function `project-autofill-description` that:
  - Loads any attached brochure/fact-sheet document for the project (from `project_documents` / storage)
  - Falls back to project name + developer + location if no doc
  - Uses `google/gemini-2.5-flash` to produce a 120–180-word marketing description
  - Writes to `projects.description`
- The full wizard (`/owner/developers/new-project?edit=<id>`) already exists; add an **"Open full editor"** link inside the inline Edit panel so users can jump to it when inline fields aren't enough.
- After AI fill, re-run publish so missing_description clears automatically.

### 5. Show source of every listing + surface data issues
- Add a small **source chip** next to the Live/Unpublished badge on each row: e.g. `Source: Provident feed`, `Source: PAA envelope`, `Source: Manual`, `Source: Brochure upload`. Uses existing `projects.source` column (values already in DB: `provident`, `paa-envelope`, `manual`, etc.).
- When `data_quality_flags` are present, replace the plain "2 data issues" badge with an **expandable list** on hover/click showing each missing field (`missing_description`, `missing_cover`, `missing_price`, `missing_handover`, …) so the user knows exactly what to fix before publishing.
- Same chips appear inside the Edit panel and on the public project card, so the origin is traceable everywhere.

### 6. Verification
- Playwright screenshot pass on `/owner/developers/projects`:
  - Counts read 2,781 / 813 / 1,968 (or refreshed live numbers)
  - Clear button legible on emerald bar
  - Checkbox tick renders white when a row is selected
  - Source chip visible on every card
  - Amra: click "AI fill from fact sheet", then Publish — succeeds without missing_description
- Attach screenshots inline in the reply.

### Out of scope (ask before doing)
- Merging / deleting the four Amra duplicate rows (still awaits your call).
- Unifying counts on **every** public page (home, /projects directory, Owner Overview KPIs). This plan fixes the My Projects page and the shared count helper it will use; wiring the same helper into the other pages is a follow-up if you want it now.

Confirm and I'll implement all six sections in one pass, then post the screenshots.