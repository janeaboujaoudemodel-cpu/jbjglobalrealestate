
This is a large multi-system rebuild. I'm breaking it into 6 phases so each one is verifiable with screenshots before the next starts. Please review — especially phases 3, 5, 6 — because they touch data models and telephony.

---

## Phase 1 — Stop the broken redirects (fast fixes, ~today)

**Problems**
- Broker Portal "Edit templates" opens `/crm/relationship-hub?...&panel=templates`, which currently redirects to the JBJ CRM shell.
- CRM > Developers card shows a "Developers Registry / Open Relationship Hub" placeholder instead of the actual developer workspace.

**Fixes**
- `src/components/crm/BrandedEmailsLauncherCard.tsx`: point "Edit templates" and "Open Relationships Hub" at the real routes that exist in `OwnerRoutes.tsx` (`/owner/crm/relationship-hub` and a `?tab=templates` query the Hub already reads). No more `/crm/*` path — that path is CRM shell only.
- Verify the Hub actually mounts a Templates panel when `panel=templates` is present; if not, add the panel switch there.
- CRM > Developers card: link the tile to `/owner/developers` (existing directory) instead of the "Developers Registry / Open Relationship Hub" placeholder. Remove the placeholder card.

**Validation**: Playwright — click Edit Templates from Broker Portal, Developer Portal, Brokerage Portal; screenshot landing page. Click Developers tile from CRM; screenshot the directory.

---

## Phase 2 — Reorganize CRM entity tiles by ownership

Move each tile to the portal that actually owns the domain, and stop cross-contaminating counts.

| Tile | Current home | New home |
|---|---|---|
| Leads | CRM | CRM (stays) |
| Investors 3 | CRM | Users Hub (new count = users with category=investor) |
| Developers 630 | CRM tile → placeholder | Developer Portal only. CRM keeps a read-only shortcut. |
| Dev Sales Reps | CRM | Developer Portal only. |
| Brokers 33k | CRM | Broker Portal only. |
| Brokerage Agencies 11k | CRM | Broker Portal only. |
| Employees | CRM | HR Hub / Payroll only. |
| Databases | CRM | New Data Hub (Phase 3). |
| Academy | CRM | stays. |

Reconcile the count mismatches (33k vs 32k brokers, 11k vs 10k agencies) by having Broker Portal and CRM read the **same** query (single `useBrokerStats` hook). Root cause is two different filters — the CRM tile counts all `broker_profiles` rows, Broker Portal filters by `is_active`. Pick one filter (`is_active OR status='pending'`) and reuse.

**Validation**: screenshots of CRM (fewer tiles), Broker Portal, Developer Portal, HR Hub. Counts must match across pages.

---

## Phase 3 — Data Hub + AI Lead Distribution engine

New route: `/owner/data-hub` with three tabs:

1. **Databases** — every source table (leads, brokers, brokerages, developers, investors) with role/access controls (who can see contact details).
2. **Lead pipeline** — pool of unassigned leads.
3. **Distribution** — "Distribute with AI" action.

### Distribution workflow
- Owner selects a broker, chooses N leads (20 / 40 / custom), clicks **Distribute with AI**.
- New table `lead_assignments (lead_id, broker_id, assigned_at, status: assigned|contacted|junk|closed, returned_at)`.
- Distribution edge function `distribute-leads`:
  - Picks N leads WHERE not in any active assignment.
  - Uses AI (Lovable AI Gateway, google/gemini-2.5-flash) to score fit between broker specialty/territory and each lead.
  - Locks those leads to the broker (reserved).
- Junk flow: broker flags → status=junk → lead returns to pool or owner reassigns.
- Access toggle per broker: "Show contact details" boolean. If false, broker sees masked phone/email until they log first activity.

### Broker performance view
On broker profile: assigned count, calls made, avg response time, meetings, briefings, deals closed, join date, activity timeline. Backed by `broker_activity_log` table + existing `activity_events`.

**Validation**: assign 20 test leads → verify they disappear from pool → flag one as junk → verify it comes back. Screenshots at each step.

---

## Phase 4 — Unified vertical sidebar (Owner-only merge under Marketplace)

**Concept**: One sidebar, not two.

- Non-owner users see today's `CrmSidebar` up to and including "Marketplace".
- Owner sees a divider under Marketplace, then the entire Owner backend (Owner Panel, JBJ Hub, Developer Portal, Broker Portal, Data Hub, HR Hub, Document Studio, Drive Extractions, Access Requests, Newsletter, Analytics, etc.) — replacing `GlobalVerticalNav`.
- The Owner shell (`/owner/*`) reuses the CRM sidebar component; the old `GlobalVerticalNav` is retired for owner routes.

**Validation**: log in as owner → single sidebar visible on both `/owner/*` and `/owner/crm/jbj/*`. Log in as non-owner (test account) → sidebar stops at Marketplace.

---

## Phase 5 — Owner + user dashboards (Zoho-style daily home)

Every user's CRM `Home` shows: My Untouched Leads, My Open Deals, Today's Leads, My Meetings, My Notes, My Open Tasks. Owner sees the same, aggregated across the workspace.

- New hook `useCrmDashboardStats(scope: 'me'|'workspace')`.
- Cards clickable → drill into filtered lead list.
- "Add Dev Sales Rep" card in Developer Portal is wired to open a searchable developer picker + inline rep-create form (not a dead tile).

**Validation**: screenshots for owner scope and one non-owner test account.

---

## Phase 6 — AI call recording & scoring (staged)

This is the biggest new capability. Proposing to stage it because it needs a telephony provider decision.

- **6a**: Add "Call" button on every lead card. Clicking logs a call intent, opens WebRTC recorder (browser mic) or dials via provider.
- **6b**: On call end, upload audio → edge function `analyze-call` → Lovable AI (Gemini 2.5) transcribes + summarizes + rates tone/clarity/listening + scores lead intent + writes `next_step`.
- **6c**: Save to `call_recordings` table linked to lead + broker; show inline on lead detail and broker performance page.

**Telephony question below** — need the user's pick before building 6a.

---

## Technical notes (for reference)

- New tables: `lead_assignments`, `broker_activity_log`, `call_recordings`, `lead_access_rules`. All with RLS + GRANT blocks per the standard.
- Edge functions: `distribute-leads`, `analyze-call`, `flag-lead-junk`.
- No changes to `auth`, `storage`, `realtime` schemas.
- Every phase ends with Playwright screenshot proof committed under `/tmp/browser/phase-N/`.

---

## Questions before I start

1. **Phase 6 telephony**: browser-mic WebRTC only (free, works today), or integrate Twilio/JustCall for real PSTN calls (needs API key + billing)?
2. **Sidebar merge (Phase 4)**: keep the old owner top-nav header visible above the merged sidebar, or fully retire it?
3. **Should I ship Phase 1 immediately today** (redirect fix + Developers tile) so the broken Edit Templates stops sending you to CRM, and then continue with 2 → 6 across the next turns?

If you approve, I'll start with Phase 1, ship it with screenshot proof, and only then move to Phase 2.
