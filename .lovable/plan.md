## Goal

Turn the project page into a fully owner-editable surface (every label, photo, fact, developer info, document, etc.), add an email-based delegate access manager so you can grant Saleem (or anyone) granular per-section access, fix the "pending" badge, and make project status sync from a single source of truth.

---

## 1. Fix the "pending" badge under the hero

**Root cause:** `QuickFactsBar` renders `statusLabel || availabilityStatus` as a Badge. `project.availability_status` is set to `"pending"` (internal admin state) and is leaking into the public UI.

**Fix:**
- In `QuickFactsBar.tsx`, only render the status badge when the value is a public-friendly term (whitelist: `available`, `selling`, `limited`, `few left`, `sold out`, `launching`, `coming soon`, `new`, `ready`, `under construction`, `off-plan`). Hide internal states (`pending`, `draft`, `unverified`, etc.).
- Add a small util `publicStatusLabel(status)` so we don't leak again.

## 2. Unified status (single source of truth = `handover_date`)

- New util `src/utils/projectStatus.ts` → `getProjectStatus(project)`:
  - If `handover_date` exists and is in the past → `{ label: 'Ready', date: null }`
  - Else if `handover_date` future → `{ label: formatDisplayDate(handover_date), date: handover_date }`
  - Else fall back to `status_label` or derived (existing `deriveHandover`).
- Replace every place that renders handover/ready independently (hero pill line 642–650, Quick Stats card line 767, QuickFactsBar handover fact, project cards strip) to read from this util.
- Editing `handover_date` in **any** card writes to `projects.handover_date` → all labels resync automatically (React Query invalidation already in place).
- Above the second Quick Stats card, add the eyebrow label "Handover" (matching siblings: Starting Price / Handover / Bedrooms / Size). Remove the inner border/pill around the word "Ready" — just plain text styled like the other values.

## 3. Universal inline editing on the project page

Wrap every editable field in `<InlineEditable>` (owner-only via `useIsAppOwner`). Add a tiny pencil affordance next to each. Scope on this page:

**Hero section**
- Project name, starting price, location, bedrooms, size, handover (already partly wired — finish the rest).

**Quick Stats grid (4 cards)**
- Each card gets its own pencil → opens the right field editor (price_from / handover_date / bedrooms / size).

**Quick Facts bar**
- Property type, total units, floors, status, handover, last updated note.

**Developer card (`DeveloperInfoCard.tsx`)**
- Logo (upload/replace via `OwnerImageManager`-style dropzone targeting `developers.logo_url`).
- Name (already), description (already), **founded year**, headquarters, projects-delivered count, website, every visible stat. Add pencil next to each.

**Anywhere else a label/feed/place text renders** (overview tab, amenities list items, payment plan rows, location/neighborhood blurb, FAQ items). One pass to wrap them all.

## 4. Photo gallery management

Extend `OwnerImageManager.tsx`:
- **Drag-to-reorder** with `@dnd-kit/sortable` (already in deps). Writes new `display_order` to `project_images`.
- **Set as Cover** button on each tile (already started — verify).
- **Delete** with confirm.
- **Upload** multi-file (already wired).
- Tiles show role badges (Cover / Card / Gallery) per the existing 3-slot Media Management standard.

## 5. "View as visitor" / Public preview toggle

- New header chip on owner-viewed project page: `Owner` ⇄ `Visitor` toggle (sticky top-right of the page).
- Stored in `sessionStorage` (`jbj_preview_as_visitor=1`).
- A new hook `useEffectiveOwner()` returns `isOwner && !previewAsVisitor`. All `<InlineEditable>`, owner dropzones, edit pencils, admin bars read from this — so flipping the toggle hides every edit affordance and the page renders exactly as a public visitor sees it.

## 6. Owner-only delegate access manager (per-section)

**DB (new migration):**
```sql
create table public.owner_delegates (
  id uuid pk default gen_random_uuid(),
  owner_user_id uuid not null,        -- always the app owner
  delegate_email text not null,
  delegate_user_id uuid,              -- filled on first login match
  scopes jsonb not null default '{}', -- e.g. {"project_photos":true,"project_text":true,"developer_info":false,"documents":true,"market_intel":false}
  is_active boolean not null default true,
  created_at, updated_at
);
-- RLS: only owner role can select/insert/update/delete.
-- Add helper: public.has_delegate_scope(_user_id uuid, _scope text) returns boolean (security definer).
```

**UI: new page `/owner/access` (linked from Executive Command Center → "Access & Delegates")**
- List of delegate emails with status (Pending login / Active).
- "Add delegate" → email + tick boxes per scope:
  - Project text (titles, descriptions, prices)
  - Project photos & gallery
  - Project documents/brochures
  - Developer info
  - Quick facts / handover / availability
  - Market Intelligence
  - CRM
  - Marketing Hub
- Revoke / pause / edit scope per row.

**Hook:** `useCanEdit(scope)` → `isAppOwner || has_delegate_scope(user.id, scope)`. Every `<InlineEditable>` and owner dropzone takes a `scope` prop and uses this hook instead of `useIsAppOwner` directly. Result: a delegate only sees pencils for the sections you ticked.

## 7. Files touched

- **New:** `src/utils/projectStatus.ts`, `src/hooks/useEffectiveOwner.ts`, `src/hooks/useCanEdit.ts`, `src/components/project-detail/OwnerVisitorToggle.tsx`, `src/pages/owner/AccessDelegates.tsx`, `src/components/owner/DelegateRow.tsx`, migration for `owner_delegates`.
- **Edited:** `QuickFactsBar.tsx` (pending fix + handover label), `ProjectDetailLayout.tsx` (status sync, eyebrow on card #2, more pencils), `DeveloperInfoCard.tsx` (logo upload + all-field pencils), `OwnerImageManager.tsx` (dnd reorder + cover/delete polish), `InlineEditable.tsx` (accept `scope` prop), all owner-only components rerouted through `useEffectiveOwner` + `useCanEdit`.

## 8. Out of scope (kept untouched)

- Gift Transactions widget, "Notice something incorrect" section, mortgage tools, market intel content (only access toggle added).

---

Ready to switch to build mode?
