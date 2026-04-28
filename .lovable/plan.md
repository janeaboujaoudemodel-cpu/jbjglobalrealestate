## Relationships Hub v2 — Premium restyle, full UAE developer list, one-click registration emailer

You reported five problems on `/owner/crm/relationships`. This plan fixes all of them and adds the developer outreach automation you asked for.

---

### 1. Visual fixes (premium look)

**Problems:**
- Hover on brokerage cards shows white text on white background (unreadable).
- Page is constrained inside a white box that leaves a strip touching the header.
- Header strip and side gutters look disconnected from the rest of the app.
- "Back to CRM" button is squished against the title and looks like an afterthought.

**Fixes:**
- Page background switches from `bg-white` to **creamy ivory** (`bg-[#FAF7F2]`) edge-to-edge — same warm tone used elsewhere in the executive area. No more white-on-white.
- Remove the narrow `max-w-7xl` container so the hub spans full width with proper `px-6 md:px-10` gutters that align with the 88px L-shaped frame.
- Cards become solid white on the cream background with a subtle border (`border-black/5`), `rounded-2xl`, soft shadow on hover, and **explicit `text-black`** on every interactive surface to kill the white-on-white hover bug.
- All status pills repainted with the institutional palette (emerald / amber / blue / red / zinc / orange) and forced black text where contrast would otherwise fail.
- "Back to CRM" becomes a centered, larger pill button (`h-11`, `px-6`, gap-4 from title), placed in its own row above the title — matches the rest of the founder dashboard.
- Tabs restyled as the project-standard segmented control (high-contrast active state on light surface).
- Subtle champagne hairline divider under the title row.

---

### 2. Complete UAE developer list (~80, no exceptions)

The seed currently loads ~60. We expand the canonical list to **every active UAE developer** and pre-fill each one with a registration email address.

**Added to the seed (in addition to existing):** Ellington, Meraas, Meydan, Wasl, Aldar, Bloom, Imkan, Modon, Eagle Hills, Sweid & Sweid, Iman Developers, Mira, Beyond by Omniyat, Sankari, ORO24, Diamondz by Danube, Object 1, Mered, London Gate, Pure Gold, Reportage, Rijas, Roya Lifestyle, Burtville, Sol Properties, ANAX Developments, Q Properties, Octa Properties, Symbolic, Peace Homes, Esnaad, Vincitore, Riviera Group, Range Developments, Skyline Builders, Acube Developments, plus the existing 60. Final list ~80 names.

**New columns on `crm_developer_registry`:** `developer_email text`, `registration_url text`, `last_outreach_at timestamptz`, `outreach_count integer default 0`. Seed pre-fills `developer_email` from a curated mapping (broker-relations / agent-onboarding inboxes where publicly known; left blank with a flag where not).

A **"Refresh UAE list"** button re-runs the seed safely (idempotent — `INSERT … ON CONFLICT (owner_id, developer_slug) DO NOTHING`) so existing rows keep your statuses.

---

### 3. One-click registration emailer (Google Drive document pack)

A new **"Document Pack" panel** at the top of the Developer Registry tab:

- One input: **Google Drive folder/file link** (saved per owner in a new `crm_owner_settings` table — paste once, reuse forever).
- One input: **From signature block** (defaults to your name + `contact@jbj.ae`).
- A toggle: "**CC `info.jane@thegmail.com`**" (on by default).

Per developer row, a new **"Send Registration"** button:
1. Calls a new edge function `crm-send-developer-registration`.
2. Edge function looks up the developer's pre-filled email (or any email you typed in the row's Edit dialog).
3. Sends a branded email via Resend (already wired in the project) with:
   - **Subject:** "Broker Registration Request — JBJ Global Real Estate"
   - **Body:** Professional intro, JBJ company details, RERA/trade licence summary, and the Google Drive link as a prominent button.
   - **Reply-To:** `contact@jbj.ae` (so all responses go to your shared inbox).
   - **CC:** `info.jane@thegmail.com` (when toggle on).
   - Footer line: *"For any questions please reply to contact@jbj.ae and CC info.jane@thegmail.com so our team can assist you further."*
4. On success: bumps `outreach_count`, sets `last_outreach_at`, sets status to `pending_application` if currently `not_started`, logs the send to `email_send_log`, and shows a green toast.
5. Adds an "AI draft" toggle: if on, Gemini personalises the opening line per developer brand before sending.

**Bulk action:** "Send to all not-yet-registered" button at the top — fires the same function once per row with rate limiting (1 email / 800 ms) and shows a live progress toast.

---

### 4. More automation (scheduled + smart)

**New nightly cron (`crm-relationship-cron`):** runs at 02:00 UAE time, scans every developer/brokerage/client and auto-creates `crm_relationship_reminders` rows for:
- Document expiring in ≤30 days.
- No outreach in ≥45 days for non-registered developers.
- Brokerage with no interaction ≥30 days.
- Client birthday in ≤7 days.
- Stale `pending_application` ≥14 days → "Follow up — application pending too long".

Reminders surface in the existing CRM Calendar bell + a new **Automation panel** at the top of the hub showing today's auto-generated tasks with one-click "Done / Snooze 7 days".

**Quick-action menu** on every row: "Send Registration · AI Draft Email · Schedule Follow-up · Mark Registered · Add Document".

---

### 5. Inline status editor

Status badges become **clickable** — opens a small popover with the status options. No more opening the full Edit dialog just to flip a status. Same pattern across all three tabs.

---

### Technical work

**Database migration:**
- Add columns: `crm_developer_registry.developer_email`, `registration_url`, `last_outreach_at`, `outreach_count`.
- New table `crm_owner_settings` (owner_id PK, `drive_doc_pack_url`, `signature_html`, `cc_jane_enabled`, `from_email`).
- Update `seed_crm_developer_registry()` function to insert the full ~80 developer list with pre-filled emails and become safely re-runnable.

**New edge function `crm-send-developer-registration`:**
- Validates owner auth via `requireOwnerAuth`.
- Loads developer + owner settings.
- Sends through Resend with `from = JBJ Global <contact@jbj.ae>`, `replyTo = contact@jbj.ae`, optional CC to `info.jane@thegmail.com`.
- Logs to `email_send_log` and updates the registry row.
- Returns structured success/failure for the toast.

**New edge function `crm-relationship-cron`:** scheduled nightly via pg_cron, generates the auto-reminders described above.

**Frontend:**
- Restyle `src/pages/CRMRelationships.tsx` with the cream background, full-width layout, repositioned back button, fixed hover contrast, premium cards.
- Add `DocumentPackPanel`, `SendRegistrationButton`, `BulkRegistrationButton`, `InlineStatusEditor`, `AutomationPanel` components.
- Extend `useCRMRelationships.ts` with `useOwnerSettings`, `useSendRegistration`, `useBulkSendRegistration`.

**Reused (no rewrite):** Resend integration, OwnerGuard, audit-log helpers, monochrome design tokens, existing brand palette, AI gateway (`google/gemini-2.5-flash`).

---

### Out of scope

- Reading replies from `contact@jbj.ae` back into the CRM (separate inbox sync feature already on the roadmap).
- Auto-uploading the Google Drive folder contents — we only embed the link you paste.
- Per-developer custom email templates — one premium template, optionally AI-personalised opening line.

Approve to build.