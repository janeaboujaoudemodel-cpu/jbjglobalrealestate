# Brokerage CRM — Completion report

All items from the previous plan have been implemented and verified live.

## ✓ Database migrations applied
- `crm_brokerage_actions`: owner-accessible RLS via `is_jbj_owner(auth.uid())`; action_type extended to include `outreach_sent`, `call`, `status_change`; index on `(owner_id, created_at DESC)`.
- `crm_brokerage_agents`: table + owner-only RLS + `updated_at` trigger.
- `crm_brokerages.admin_contact` JSONB column added (default `{}`).
- `brokerage-contact-photos` private storage bucket + owner-only policies.

## ✓ Agency Activity Log (`/owner/crm/relationships/activity`)
- React-query backed (`crm-brokerage-actions` cache key) with refresh button.
- Counters: Total · Reminders · Notes · Calendar · Outreach sent.
- Search + type filter.
- Single unified Export dropdown (PDF / Excel / CSV).
- Alias `/owner/crm/brokerage-actions` → redirects to the activity log.

## ✓ Unified Export dropdown
- One `Export` button in the brokerage toolbar and the activity log.
- Dropdown items: Export as PDF · Export as Excel (.xlsx) · Export as CSV.
- Removed the old separate Export PDF / Excel / CSV buttons.

## ✓ Add / Edit Brokerage dialog
- RERA license field removed (UAE agencies are licensed by default).
- Always-visible "Admin / Owner contact" block (name, role, phone, WhatsApp, email).
- Brokers-under-agency editor (`BrokerageAgentsEditor`) persisted in `crm_brokerage_agents`.
- AI screenshot importer (`BrokerageContactPhotoImporter`) calls deployed `extract-brokerage-contacts` edge function.

## ✓ Outreach selection
- Every agency card (directory + owner additions) has a checkbox.
- Selecting an agency without an email opens the Edit dialog with a clear toast.
- Toolbar: "Select all visible" + "Email Selected Agencies (N)".
- Sends through `BulkSendDialog` with a test send to the owner first.

## ✓ Background directory sync — no more infinite spinners
- `directory-job-runner` now stamps `last_verified_at` on every scanned row, so rows with no public phone/email are not re-scanned forever.
- Hard cap of 30 chunks per run guarantees jobs reach `completed`.
- Stuck legacy jobs marked completed via SQL update.
- `DirectoryToolsPanel` shows three explicit ticked status tiles (Brokerages discovery / Brokerage enrichment / Developer enrichment) plus a top "All daily tasks completed" badge when finished.

## ✓ Shortcuts
- `Agency Activity Log` (CRM group) and `Contract Vault` (Owner Command Center group) added to `src/config/shortcutsConfig.ts`, so global search and pinned shortcuts find them.

## ✓ Edge function
- `extract-brokerage-contacts` deployed; empty body returns a clean `400 paths required`.
- `directory-job-runner` redeployed with the fixes above.
