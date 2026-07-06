
## Scope

Backend (owner dashboard) only. No frontend/public site changes.

## Track A — Global backend contrast & layout sweep

Root cause: several owner-dashboard surfaces render dark text on the emerald gradient because they use raw `bg-emerald-*` / hardcoded classes instead of the `jj-cta-emerald` / `[data-surface="emerald"]` primitives that PASS 142 whitens. I'll fix at the primitive level (one CSS lock) AND repaint the offending components.

Pages to audit + fix (screenshot each before/after with Playwright at 1280×1800 and mobile 390×844):

1. `/owner` (Owner Panel dashboard)
   - Vertical "Search" button → header search input layout is collapsing; fix flex/min-width in `OwnerHeader`.
   - "Marketing" / "View Site" / Refresh CTAs → force `jj-cta-emerald` white text+icon.
   - Active Leads / Recent Visitor Activity insight cards → white heading + body on emerald.
   - System Health cards, Storage/Edge Functions status dots → emerald tokens.

2. `/owner` Admin Assistant panel
   - JAJ avatar circle → replace flat green with `--gradient-ink`.
   - Active toggle pill → dot inside pill, not overflowing.
   - Test Email / Test Chat buttons → white text+icon.
   - Languages pills (English/Arabic/French) → emerald metallic + white.
   - Metric cards (Active Brokers, Total Leads, etc.) → readable body.

3. `/owner/crm` (JBJ CRM)
   - Top filter pills: Leads/Databases/Investors/Developers/Dev Sales → white on emerald.
   - Sub-tabs: All Leads/Dashboard/Flagged/VIP/Junk/Lead Mgmt/Tasks/Calendar → white on emerald.
   - Status pills currently gold-on-emerald (restricted) → switch to white text + emerald bg, remove gold on emerald combo.
   - Email/Source/Status cells on the leads table → white on emerald.
   - Contact detail drawer pills → same treatment.
   - **Calendar tab**: currently no-op. Wire it to render the same calendar component used in the CRM Calendar view (reuse existing `CrmCalendar` component, mount inside `/owner/crm?tab=calendar`).

4. `/owner/access-requests`
   - "Rep Applications" active tab visible; "Broker Access Requests" tab has broken contrast → fix tab primitive.
   - Empty-state description text → readable ink on champagne.

5. `/owner/profile-rebuild` → rename route + label to **Developer Profiles** (sidebar + page title + route alias with redirect). Restyle header CTAs to emerald metallic.

6. Project detail / upload pages
   - Missing-logos section upload buttons: black icon+text on emerald → white.
   - Field labels/descriptions on emerald cards → white.

7. Global primitive fixes (single source, in `src/index.css` PASS 142+):
   - `[data-surface="emerald"] *` → force `color:#FFFFFF !important` on button, a, span, p, h1-h6, svg (stroke+fill where appropriate).
   - Ban `text-black` / `text-emerald-900` inside `[data-surface="emerald"]` via `:where()` override.
   - Fix pill dot: `.jj-pill-active .dot { inset: auto; margin: 0 4px; }` so it stays inside the pill.
   - Remove gold-on-emerald status combinations in `crmStatusPalette` when parent is emerald surface (use white fg instead).

**Validation**: Playwright script hits every route above, screenshots desktop + mobile, then runs a color-picker check that asserts no descendant of `[data-surface="emerald"]` has computed `color` darker than `#B0B0B0`. Save all screenshots to `/mnt/documents/backend-contrast-audit/`.

## Track B — Featured Projects per-device manager

Rebuild `/owner/home-featured-projects` (`HomeFeaturedProjectsManager.tsx`) as a 3-device layout picker.

### Data model change

Extend `public.home_featured_projects` with:
- `device` text NOT NULL DEFAULT 'desktop' — enum-checked: `mobile` | `tablet` | `desktop`.
- Existing `display_order` scoped per-device.
- New table `public.home_featured_manual_projects` for owner-authored projects that don't exist in `projects` yet (fields: title, developer_name, emirate, community, starting_price, hero_image_url, cta_url).
- Migration adds GRANTs + RLS: owners/admins full access, public read of visible rows.

### UI

Three side-by-side device frames (Mobile 390 / Tablet 834 / Desktop 1280) that render the exact HandpickedProjects grid at that width using the same component the public site uses.

Each frame has:
- Live preview of current slots (drag handle, hide toggle, replace).
- "Add slot" (+) button — no cap, defaults to 6 but supports 8/10/N.
- "Replace" opens a picker: search live `projects` table OR "Create manual project" form.
- Drag-and-drop reorder within a device.
- "Copy from desktop → tablet/mobile" quick action.

`useHandpickedProjects` reads per current viewport (`useMediaQuery`) and pulls the matching device's slots; falls back to desktop if no rows for that device.

### Validation

Playwright: open the manager, drag reorder, toggle hide, add a manual project, resize the public `/` home to mobile/tablet/desktop, screenshot each showing the correct per-device set.

## Delivery order

1. Ship the CSS primitive lock (PASS 143) — fixes ~70% of contrast in one commit.
2. Component-level repaints for the 6 pages above.
3. Calendar tab wiring + Developer Profiles rename.
4. Featured Projects migration + rebuilt manager + hook update.
5. Full Playwright audit run, screenshots to `/mnt/documents/backend-contrast-audit/` and `/mnt/documents/featured-projects-audit/`.

## Technical notes

- All new emerald surfaces must use `data-surface="emerald"` + `jj-cta-emerald` — no raw `bg-emerald-*` classes.
- Sidebar rename: update `OwnerSidebarNav.tsx` label + icon, add route alias `/owner/profile-rebuild` → `/owner/developer-profiles` with 301-style `Navigate replace`.
- Featured Projects migration is additive; existing rows default to `device='desktop'` so nothing breaks.
- Estimated LOC: ~1400 added / ~400 modified across ~25 files + 1 migration.
