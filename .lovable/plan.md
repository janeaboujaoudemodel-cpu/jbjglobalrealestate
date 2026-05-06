## Goal

Inside the **Brokerages** tab of CRM Relationships, restructure into two top-level tabs and make sure newly added agencies land in your personal pipeline ("My Additions") with both Card view and Excel view available at all times.

## What changes

### 1. Two new tabs inside Brokerages

Add a tab strip at the top of the Brokerages section:

```text
[ Agencies ]   [ Individual Brokers ]
```

- **Agencies** — the existing brokerage directory (everything currently shown).
- **Individual Brokers** — a new view listing every broker (person) you have on file. Source = union of:
  - `crm_brokerage_agents` (brokers added under any agency, with the agency name shown as a column), AND
  - Standalone brokers not tied to any agency (we'll allow `brokerage_id = null` rows in the same `crm_brokerage_agents` table so you can add a lone broker without first creating an agency).
  - Columns: Name · Phone · WhatsApp · Email · Role · Status · Agency · Last contacted · Actions.
  - Same Card / Excel toggle as Agencies.
  - "+ Add broker" button works with or without selecting an agency.

### 2. New agencies auto-land in "My Additions"

`openNew()` already stamps `entry_source: "owner"`, so any agency you create is already part of My Additions. We will:
- After save, **switch the source sub-tab to `owner` ("My Additions")** and scroll the new row into view, so you immediately see your new entry.
- Toast confirmation: "Added to My Additions — ready for outreach".

### 3. Always show Card view AND Excel view for My Additions

Today there is one shared `viewMode` toggle (`cards | excel`) that hides the other view. Change to:
- **My Additions** sub-tab: always renders **both** the Card grid (top) and the Excel grid (bottom), with a small "Jump to Excel ↓ / Jump to Cards ↑" anchor.
- All other sub-tabs (All / UAE Agencies / Already Sent / New Replies): keep the existing Card/Excel toggle (unchanged), so we don't slow down 10k-row views.

### 4. Counts & filters

- Tab badges show live counts: `Agencies · {data.length}` and `Individual Brokers · {brokerCount}`.
- Filters (search, list sidebar, status, emirate) apply to whichever tab is active. The Individual Brokers tab gets its own search box plus an "Agency" filter dropdown.

## Out of scope

- No changes to email templates, breakfast invitation, registration card, or developer tabs.
- No schema changes beyond making `crm_brokerage_agents.brokerage_id` nullable (one migration) so standalone brokers are storable.

## Technical notes

- File: `src/pages/CRMRelationships.tsx` — wrap `BrokeragesTab` body in a Radix `Tabs` (`agencies` | `brokers`).
- New component: `src/components/crm/IndividualBrokersTab.tsx` — fetches `crm_brokerage_agents` joined to `crm_brokerages(company_name)`, reuses `ExcelGridView` + a card grid built from the existing card markup.
- Migration: `ALTER TABLE crm_brokerage_agents ALTER COLUMN brokerage_id DROP NOT NULL;` (only if it's currently NOT NULL — we'll verify first).
- `BrokerageAgentsEditor` stays as the per-agency editor; the new tab is read/write at the broker level.
- "My Additions" dual-view: conditionally render both `<CardsGrid />` and `<ExcelGridView />` when `sourceTab === "owner"`; otherwise keep the toggle.
- After `save()` succeeds for a new agency: `setSourceTab("owner")` + `qc.invalidateQueries(["crm-brokerages"])`.