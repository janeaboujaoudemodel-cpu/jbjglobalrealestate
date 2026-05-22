
# Developer Portal Rebuild — End-to-End

Premium champagne+gold redesign, real sales-rep upload flow, **one-time approval → every future edit auto-publishes**, and a full cleanup pass on broken/fake project data already in the database.

---

## 1. Data cleanup (run first, before any UI work)

Audit found **1,316 projects** with missing cover, missing price, or pre-2024 handover out of 2,504 published. Plus reelly.io legacy junk (Screenshots, "1080x1080", etc.).

Two-pass migration:

**Pass A — Unpublish suspect rows** (`is_published = false`) when ANY of:
- `cover_image_url` is null OR matches forbidden patterns (`screenshot`, `whatsapp`, `convert.io`, `frame+N`, `1080x1080`, project photo paths used as cover)
- `price_from` is null OR `< 100,000`
- `handover_date` is null OR in the past AND `construction_status != 'completed'`
- `name` contains obvious junk markers ("test", "untitled", "draft", `%d0%`)

**Pass B — Soft-delete** (new `deleted_at timestamptz` column, RLS hides it) when **2+** red flags are present (e.g. no price AND no valid image AND pre-2024 handover). Recoverable from Owner panel.

Add `projects.data_quality_flags jsonb` so the owner sees exactly why each was flagged. Add a "Restore" button in the Owner panel for soft-deleted rows.

Same cleanup applied to `project_images` (drop forbidden URLs) and `project_documents` (drop placeholder/fake brochures already covered by the Brochure Section Logic standard).

## 2. Developer onboarding & approval (the trust model)

```text
Sales-rep signs up (/register/developer)
        │
        ▼
Submits company profile + logo + description + first project pack
        │
        ▼
Status: pending_review  ─── Owner reviews ONCE ───▶ status: approved + trust_level: auto_publish
        │
        ▼
From now on: every edit, every new project, every file → publishes LIVE instantly
                                                            (no further approval)
```

Schema changes on `developers`:
- `trust_level enum('pending','auto_publish','suspended')` default `pending`
- `approved_at`, `approved_by`, `last_auto_publish_at`

Edge function `developer-auto-publish` (replaces draft-first flow for trusted devs):
- Validates owner of submission == approved sales-rep for that developer
- If `trust_level = 'auto_publish'`: writes straight into `projects` + `project_images` + `project_documents`, sets `is_published = true`, bumps `source_updated_at`
- If `trust_level = 'pending'`: routes to existing `developer_project_submissions` review queue
- Always logs to `developer_activity_log` with diff payload
- Owner can hit "Suspend trust" → flips back to draft-first

This keeps the Owner's one-click approval as the single trust gate the user described, while satisfying the existing "Project Submission" standard by keeping the draft pipeline alive for un-trusted reps.

## 3. Sales-rep upload UI (premium champagne+gold)

Single shell at `/developer-hub` (already exists, gets full redesign), using locked palette `#FDFBF7 / #F7F2EA / #EFE6D6 / #B89555 / ink #1A1A1A`, Inter only, 1px gold hairlines, cream raised surfaces, `<IconTile tone="gold">`, no gold fills.

Sections (sidebar nav):
1. **Company Profile** — logo (uses locked `developerLogo.ts` allow-list), description, website, languages, nationality
2. **Projects** — list + "Add project" wizard:
   - Step 1 Basics: name, location, type, handover, price range, unit types
   - Step 2 Media: cover, gallery, floor plans (drag-drop, 50MB/file, 200MB/session — already enforced by `developerFileValidation.ts`)
   - Step 3 Brochure & documents
   - Step 4 Review & **Publish** (button text changes based on `trust_level`: "Submit for approval" vs "Publish live")
3. **Edits to live projects** — inline editor on each card, "Save & publish" autosaves and pushes live
4. **Launches & events** — existing flow, restyled
5. **Activity** — read-only log of what auto-published, with rollback

Every form input follows Institutional Form Standard (ink on champagne). No raw white. No purple (purple reserved for AI). Status badges use semantic palette (Emerald=live, Amber=pending, Red=suspended).

## 4. Public website reflection

Already wired: public `/developers/:slug` and `/projects/:slug` read from `projects` + `developers` with `is_published=true` and `deleted_at IS NULL`. After cleanup migration + auto-publish edge function, edits show up immediately because:
- React Query keys for `['projects', slug]` and `['developer', slug]` invalidated by Supabase Realtime subscription on `projects` table (already enabled per realtime memory)
- Add realtime channel for `developers` so logo/description changes propagate without refresh

## 5. End-to-end tests

Playwright spec `tests/developer-portal-e2e.spec.ts`:
1. Sign up as new sales-rep → submit company → submit project → assert `status=pending_review`
2. Owner approves → assert `trust_level=auto_publish`
3. Sales-rep edits project price → assert public `/projects/:slug` shows new price within 5s (realtime)
4. Sales-rep uploads new brochure → assert it appears on public page
5. Sales-rep creates 2nd project → assert it's published live with no owner action
6. Owner clicks Suspend → assert next edit returns to draft queue

Vitest unit tests for the auto-publish edge function (trust gating, validation, RLS bypass via service role only when owner already approved).

## 6. Files touched

**New**
- `supabase/migrations/<ts>_developer_trust_and_cleanup.sql` — trust_level + soft-delete + data cleanup
- `supabase/functions/developer-auto-publish/index.ts`
- `src/pages/developer-hub/DeveloperProjectWizard.tsx`
- `src/pages/developer-hub/DeveloperLiveEditor.tsx`
- `src/pages/owner/DeveloperTrustPanel.tsx` (approve / suspend / restore)
- `src/hooks/useDeveloperAutoPublish.ts`
- `tests/developer-portal-e2e.spec.ts`
- `mem://features/developer-portal/auto-publish-trust-standard.md`

**Edited**
- `src/pages/developer-hub/DeveloperHubShell.tsx` — full champagne restyle, IconTile, hairlines
- `src/pages/developer-hub/DeveloperHubOverview.tsx`
- `src/pages/developer-hub/DeveloperCompanyRegistration.tsx`
- `src/pages/DeveloperPortal.tsx` — strip legacy chrome, route to new wizard
- `src/components/developer-portal/*` — restyle, remove gold fills, fix contrast
- `src/routes/DeveloperHubRoutes.tsx` — add wizard + live editor routes
- Memory index

---

## Technical notes

- Soft-delete column added with index `WHERE deleted_at IS NULL` for query speed
- All cleanup wrapped in single transaction with `SAVEPOINT` per batch
- Auto-publish edge function uses `requireOwnerAuth` only for suspend/restore; sales-rep auth checked via session JWT + developer_sales_reps mapping
- Realtime publication already covers `projects`; migration adds `developers`
- No new secrets needed
- Champagne palette already in `index.css` tokens — no token changes, only component-level cleanup
