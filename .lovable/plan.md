# CRM Relationships – Button Contrast & Brokerage Auto-Fill

## Part 1 — Fix button + tab contrast (global)

The "Add Brokerage" button currently uses `variant="primary"`, which renders as solid black on the champagne page. On hover it shifts to gold, but at rest the icon/text-on-black tile reads as a heavy "all-black slab." The active tab also turns into a solid black pill which reads as a hole on champagne. We will:

1. **Repaint the "Add Brokerage" CTA on this page** to `variant="gold"` (solid `#B89555` with white text + gold deep on hover). This matches Owner Command Center primary-action tiles and removes the all-black look.
2. **Audit & repaint other "primary" CTAs sitting next to `outline`/champagne controls** in the same file (Add Brokerage, Add Developer, any "Save" / "Apply" inside this hub) to `variant="gold"` so the dominant action is gold, not pure ink.
3. **Fix tab triggers** in `CRMRelationships.tsx` (Brokerages / Developer Registry):
   - Active state: `bg-[#B89555] text-white` (gold) with subtle ring instead of solid `#1A1A1A`.
   - Inactive state: `text-[#1A1A1A]` (was `#5A4A2E` faded).
   - Hover state: `bg-[#EFE6D6] text-[#1A1A1A]` (was a 5% black wash that looked white-on-white).
4. **Repeat audit globally** — search for the same TabsTrigger pattern (`data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white`) and the same contrast issue and replace with the new gold-active recipe everywhere it appears (Owner Dashboard tabs, CRM tabs, Marketing Hub tabs, etc.). This standardizes "active tab = gold" across the app.
5. **Update memory** (`mem://ui-ux/visual-standards/segmented-control-tab-standard`) to record the new gold-active rule so future tabs follow it automatically.

## Part 2 — Auto-fill UAE brokerage directory + owner-added separation

Currently the brokerage tab is empty unless the owner manually clicks "Add Brokerage". The user wants:

- The brokerage list to **auto-populate with all UAE brokerages** (across all 7 emirates).
- Brokerages the owner **personally adds** to live in a separate logical bucket.
- If an owner-added brokerage matches one already in the seed directory, both rows are kept: the seeded one is **highlighted as "Already in Directory"** and the owner copy moves into an **"Existing" tab** (mirroring the developer registry pattern).

### Plan

1. **Database**
   - Add column `crm_brokerages.source text default 'owner'` with values `'owner' | 'directory'`.
   - Add column `crm_brokerages.is_existing_match boolean default false` for highlighting.
   - Add column `crm_brokerages.match_directory_id uuid` (self-FK) linking an owner row to its directory twin.
   - Seed `source='directory'` rows for the UAE: expand the existing 47 to a comprehensive UAE-wide list (~150+ brokerages across Dubai, Abu Dhabi, Sharjah, Ajman, RAK, Fujairah, UAQ) using public RERA/ADREC names. Owner_id will be set to the project owner so RLS lets the owner read them; they are flagged `source='directory'` so they cannot be edited or deleted by the owner UI.
   - Add a DB trigger `on insert/update of crm_brokerages` (when `source='owner'`) that fuzzy-matches `company_name` (lower/normalized) against existing `source='directory'` rows. If a match is found, set `is_existing_match=true` and `match_directory_id` on the owner row, and set `is_existing_match=true` on the directory row.

2. **UI — `CRMRelationships.tsx` BrokeragesTab**
   - Add a sub-tab strip inside the Brokerages tab: **All / Directory (UAE) / My Additions / Existing Matches**.
     - **Directory (UAE)** — read-only cards (`source='directory'`), grouped by emirate, with the new emirate filter.
     - **My Additions** — `source='owner'`, fully editable.
     - **Existing Matches** — owner rows where `is_existing_match=true`, shown with a gold "Already in Directory" badge and a link to open the directory twin.
     - **All** — combined view; directory rows that have a matching owner row get a gold "Owner-added" pill; owner rows that match a directory entry get the "Already in Directory" pill.
   - Add the **Emirates filter** (Dubai / Abu Dhabi / Sharjah / Ajman / RAK / Fujairah / UAQ / All) above the search.
   - Card visual: directory rows get a subtle gold left-border accent; owner rows keep the standard champagne card.

3. **Mutation rules**
   - `Add Brokerage` always inserts with `source='owner'`. The trigger handles match detection — no client-side dedupe required.
   - Disable edit/delete on directory rows in the UI (action buttons hidden when `source='directory'`); owner can still attach notes/reminders.

4. **Counts & badges**
   - Tab labels show counts: `Directory (UAE) · 150`, `My Additions · N`, `Existing Matches · N`.
   - This mirrors the Developer Registry "merge into Not Started + show as existing" pattern already shipped, so behavior is consistent across both registries.

## Technical notes

- Files to edit:
  - `src/pages/CRMRelationships.tsx` (tab triggers, BrokeragesTab subtabs, Add button variant, emirate filter, badge rendering).
  - Optional sweep: `src/components/admin/*Tabs*`, `src/pages/Owner*` for the same `data-[state=active]:bg-[#1A1A1A]` pattern.
  - `mem://ui-ux/visual-standards/segmented-control-tab-standard` (rule update).
- New migration: adds `source`, `is_existing_match`, `match_directory_id`, the match trigger, then seeds the UAE directory rows.
- `useCRMRelationships.ts` hook gains a `source` filter argument; existing query becomes parameterized.

## Out of scope

- Email-preview wrap fix, Send Test button, brokerage card refresh visuals, and the Export Center remain on the previously-approved roadmap and are not part of this turn.
