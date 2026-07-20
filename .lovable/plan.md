# Hub contrast + sidebar search + in-place Branded Emails

Four fixes, all inside the JBJ Hub shell. No touching Zoho-mirrored pages.

## 1. Contrast on header + search overlay

**Header (`CrmHeader.tsx` + `crmShell.css`)**
- Force the header action icons (Plus, Wand, Bell, Calendar, Store, Settings, Grip, avatar) to solid white on emerald — no faded opacity, stroke 2.25, size 20.
- Plus button becomes a filled emerald→gold metallic tile with a solid white `+` (currently faded).
- `⌘K` badge in the search pill: emerald chip with white text.

**Search overlay (`CrmSearchOverlay.tsx` + css)**
- Input text color: pure `#0F1F17` on white, placeholder `Search leads, developers, projects, brokers, areas…` in `#4B5D55`.
- Search glass icon: emerald `#064E3B`, not faded.
- "Jump to module" chips: white bg, emerald border, emerald icon + emerald text (currently reads as faded/invisible emerald-on-emerald).
- Loading/empty states: emerald text on white.
- Result row hover: soft emerald tint, title black, subtitle `#4B5D55`.

## 2. Search bar at the top of the vertical sidebar

Add a persistent search field as the first row of `CrmSidebar.tsx`, directly under the "Hub" workspace switcher:
- Full-width emerald-tinted input with a white search icon, placeholder `Search Hub…`.
- Click / focus / typing / `⌘K` all open the same `CrmSearchOverlay` (single source of truth — no duplicate search logic).
- In collapsed sidebar state, it shrinks to a single search-icon button that still opens the overlay.
- Keep the header `⌘K` search pill (user said "either move it, either keep it but fix contrast") — both entry points feed the same overlay.

## 3. Fix the emerald "Group not created" pill under Open profile

On the Developer Portal directory cards, the emerald `GROUP NOT CREATED` chip currently renders with black text on emerald (unreadable). Lock it to white text on emerald in `DeveloperDirectory.tsx` via the emerald-surface white-text contrast guard already used elsewhere.

## 4. Branded Emails — in-place, restructured, scalable

**Kill the redirect.** Rewrite `BrandedEmailsLauncherCard.tsx` so it no longer links to `/owner/crm/relationship-hub`. Replace it with a full in-place `<BrandedEmailsPanel>` that opens as a large right-side sheet (same shell as CRM record drawers) — everything stays inside `/owner/crm/jbj/owner-developers` (or the brokerage equivalent).

**Fix the vertical text bug.** The card currently forces "Branded Emails" into a narrow flex column; rebuild the header as a single-row hero (icon · title · eyebrow) with `min-w-0` and no `md:flex-col`, and drop the champagne gradient in favor of the Hub emerald/white surface so it matches the rest of the shell.

**New panel structure (shared by developer + brokerage variants):**

```text
┌─ Branded Emails ──────────────────────────────┐
│ Template picker  |  Audience  |  Preview  |  Send │
├───────────────────────────────────────────────┤
│ 1. Template                                        │
│    Registered / Not Registered / Launch / Briefing │
│    (thumbnails, from existing template library)    │
├───────────────────────────────────────────────┤
│ 2. Audience                                        │
│    ● Select all  ● Registered only  ● Custom       │
│    [ 🔍 Search developer / brokerage to include ]  │
│    [ 🔍 Search to exclude ]                        │
│    ┌ Included (▣ 612) ──── Excluded (▢ 4) ┐       │
│    │ chips, removable, virtualized list    │       │
│    └─────────────────────────────────────┘        │
├───────────────────────────────────────────────┤
│ 3. Preview  (rendered email w/ real signature)     │
│ 4. Send test → Send live  (locked flow)            │
└───────────────────────────────────────────────┘
```

- Includes: default all developers/brokerages, "Select all", search-add, chip-remove.
- Excludes: search-driven exclusion list; excluded rows greyed in the include list.
- Counts update live: `Sending to N of Total`.
- Reuses the existing template library + campaign send edge function that Relationships Hub already wires — no duplicate infra, just a new panel UI on top.
- Developer variant queries `developers`; brokerage variant queries `crm_brokerages`. Same panel, one prop.

**Where the panel mounts:**
- Developer Portal card → in-place sheet inside `/owner/crm/jbj/owner-developers`.
- Brokerage Portal card → in-place sheet inside `/owner/crm/jbj/owner-brokerage`.
- Owner backend card variants → same panel, same shell.

## 5. E2E validation (Playwright, screenshot proof)

For every change above, capture screenshots at 1280×1800:
1. Header at rest — all icons solid white, `+` filled tile.
2. Search overlay open with query "citi" — chips readable, results grouped, loading state visible.
3. Sidebar search field visible (expanded + collapsed states).
4. Developer Portal card with `GROUP NOT CREATED` chip — white text on emerald.
5. Branded Emails panel:
   - Panel opens in place (URL still `/owner/crm/jbj/owner-developers`).
   - Select-all → 616 included.
   - Search-exclude "citi" → Citi Developers moves to Excluded, count becomes 615.
   - Preview tab renders template.
   - Send-test button visible + wired.
6. Repeat the panel flow for the Brokerage variant.

All screenshots saved to `/tmp/browser/hub-fixes/` and reviewed before I claim done.

## Technical notes

- Files touched: `src/pages/owner/crm/shell/CrmHeader.tsx`, `CrmSidebar.tsx`, `CrmSearchOverlay.tsx`, `crmShell.css`, `src/components/crm/BrandedEmailsLauncherCard.tsx`, new `src/components/crm/branded-emails/BrandedEmailsPanel.tsx` (+ audience picker + template picker subcomponents), `src/pages/developer-hub-admin/DeveloperDirectory.tsx` for the pill fix.
- No schema changes. Uses existing `branded_email_templates`, `email_send_log`, `email_send_quota` tables and the existing send edge function.
- No changes to Zoho-mirrored CRM pages (Leads/Deals/Contacts/Accounts/Tasks/Meetings/etc).
