## Goal

Re-verify and finish the four CRM tasks from earlier in this thread, plus fix the live `Failed to create lead` 500 the preview is hitting right now.

## What's already on disk (verified)

- `src/components/crm/CampaignComposer.tsx` (340 lines) — composer, basic CSV-style segment fields, audience preview block, send test + send.
- `src/pages/owner/crm/CampaignsPage.tsx` — wraps the composer.
- Route `/owner/crm/campaigns` registered in `OwnerRoutes.tsx`.
- `supabase/functions/crm-resolve-segment/index.ts` (178 lines).
- `supabase/functions/crm-send-campaign/index.ts` (187 lines) — Resend, owner auth, single-agency rule, suppression, quota.
- `crm_email_campaigns` columns + `email_suppressions` table migrations applied.
- `CompanyHub`, `CompanyHubDrawer`, `CompanyHubPage`, `PersonDetailDrawer`, `ScopedExportMenu`, `CRMNetwork` all on disk.

So the previous code did land — but four real gaps remain (matching your selection), plus the runtime error.

---

## Plan

### 1. Fix the runtime 500 — `register-mode-lead` "Failed to create lead"

The error is firing from the mode-picker, not from campaigns. Inspect `crm_leads` schema for required columns / unique constraints the insert is missing (likely `lead_score`, `priority`, or a unique index on `email_normalized`/`owner_user_id`). Then:
- Run a `read_query` against `information_schema` to confirm NOT-NULL and unique constraints on `crm_leads`.
- Either (a) supply the missing defaults in the insert payload, or (b) switch the insert to the canonical `upsert_contact_with_company` RPC referenced in the Unified Relational CRM Standard memory.
- Verify in preview by re-triggering the mode picker.

### 2. CampaignComposer — make it reachable

- Add a sidebar entry `Campaigns` under the existing `CRM` group in the owner sidebar (locate the sidebar component used by `CRMNetwork`, add an item pointing to `/owner/crm/campaigns`).
- Add a `Campaigns` button in `CRMNetwork`'s top action bar so it's also discoverable from the Network screen.

### 3. Replace CSV segment inputs with a real visual builder

In `CampaignComposer.tsx`, swap the textarea-style CSV inputs for proper multi-select chips driven by real DB values:
- **Contact type**: fixed enum (`investor`, `broker`, `developer`, `client`, `lead`).
- **Pipeline stage**: load distinct values from `crm_leads.pipeline_stage`.
- **Tags**: combobox of existing tags (distinct from `crm_leads.tags` array).
- **Company**: combobox sourced from `crm_brokerages` + `crm_developer_registry`.
- **Language / source**: distinct from `crm_leads`.
- VIP, has_email, exclude_suppressed, allow_multi_company stay as switches.
- Add a "Save as segment" button → inserts into `crm_segments` for reuse.

### 4. Quota / suppression / single-agency UI feedback

Add a sticky panel above the Send button:
- **Quota meter**: pull from `useEmailQuota` (already exists). Show `sentToday / dailyLimit` and `sentMonth / monthlyLimit` with a color band (green/amber/red). Block Send when `sentToday >= dailyLimit`.
- **Suppression line**: already returned as `skipped_suppressed_count` — surface as a clear pill ("3 suppressed addresses will be skipped").
- **Single-agency banner**: when `distinct_companies > 1` and `allowMultiCompany=false`, render a red `AlertTriangle` banner listing the top company names from `preview.companies` and disable Send. Add a "Why?" tooltip linking to the Single-Agency rule.
- Show a "Send will fail" banner when `from_email` is not on `@jbj.ae` (the verified Resend domain), matching the existing outreach identity guard.

### 5. End-to-end re-verification of the other thread tasks

Quick audits and fixes only — no rewrites:
- **CRMNetwork**: confirm cross-tab persistent filters survive tab switching, counters click-to-filter works, and the role tab list includes investors / developers / brokers / brokerage agencies / partners. Patch any wired-but-broken item.
- **CompanyHub / CompanyHubDrawer**: confirm both the drawer (from CRMNetwork row click) and the route `/owner/crm/company/:type/:name` open the same Overview + per-section tabs. Confirm inline notes + follow-ups save.
- **PersonDetailDrawer**: confirm clicking a name in CRMNetwork opens it and the timeline merges all six sources.
- **ScopedExportMenu**: confirm CSV/XLSX/PDF buttons fire for each scope (view, company, event, segment, campaign) using a tiny smoke test.

For each, fix what's broken; don't re-architect what works.

---

## Technical details

- New sidebar entry: edit whichever file owns the owner sidebar (likely `src/components/owner/OwnerSidebar.tsx` or similar — locate via rg).
- `crm_segments` table: confirm it exists; if not, add a small migration (`id`, `name`, `filter jsonb`, `owner_user_id`, RLS owner-only).
- Segment chip combobox: reuse existing `MultiCombobox` if present, else build a small one with shadcn `Command` + `Popover`.
- Quota meter: reuse `useEmailQuota` hook (already in repo).
- Single-agency banner uses `--destructive` token on champagne surface; per palette rules, no gold fills.
- `register-mode-lead` fix: either insert missing required columns or call `upsert_contact_with_company` RPC. Do NOT touch RLS or `auth.users`.

## Out of scope

- No changes to Resend identity, outreach-locked-payloads, or other email functions.
- No new tables besides (maybe) `crm_segments` if it doesn't exist.
- No restyling — only the new banners and the segment builder will introduce new UI.
