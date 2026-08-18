# Edge functions with no traceable caller (JBJ-028)

Generated 2026-08-18 against commit `1e51a42`.

## What this is

The Aug 17 backend audit estimated "roughly 210 of 507" edge functions have no
traceable caller, and flagged its own number as likely high. This is a tighter
pass over the same question.

**Result: 105 of 506 functions, not ~210.** The audit's estimate was roughly
double, because its sweep only looked for `supabase.functions.invoke(...)`
calls in the frontend plus known cron wiring.

## Method

A function counts as *referenced* if its exact directory name appears in any
file under `src/`, `supabase/migrations/`, `supabase/config.toml`, or any
**other** function's source — that last one is what catches function-to-function
calls, which the original sweep could not see. A function citing its own name
inside its own directory does not count.

Reproduce with `scripts/audit/find-orphan-functions.sh`.

## Important caveats — do not bulk-delete from this list

This list is a **starting point for review, not a delete queue.** It cannot see:

- **Webhook targets configured outside this repo** — anything wired in the
  Stripe, Resend, Meta/WhatsApp or Vapi dashboards is invoked by URL and will
  never appear in this codebase. Deleting one silently breaks a live integration.
- **Supabase scheduled jobs (pg_cron) defined directly in the database** rather
  than in a committed migration.
- **Dynamically built invoke strings** (e.g. `invoke(\`sync-${provider}\`)`).
- **Manual/operational endpoints** intentionally called by hand from curl or the
  Supabase dashboard.

Also note that removing a function from this repo does **not** undeploy it — see
JBJ-027. Retirement means replacing it with an inert stub (see
`supabase/functions/_shared/retired.ts`) and then undeploying it in Supabase.

## Suggested triage order

1. Anything using a service-role client with no caller check — highest risk if
   it is genuinely reachable. Retire these first.
2. Obvious one-offs and dated scripts.
3. Everything else — confirm against the external dashboards before touching.

## The list (105)

- `ai-enrich-drafts`
- `ai-find-developer-logos`
- `apply-book-content-once`
- `auto-find-developer-images`
- `batch-generate-interiors`
- `birthday-dispatcher`
- `broker-email-send`
- `bulk-import-devs-2027-6`
- `bundle-smoke-test`
- `clone-jane-voice`
- `comm-auto-reply`
- `crm-broker-account-state`
- `crm-broker-ai-clean`
- `crm-create-breakfast-invite-token`
- `crm-scrape-developer-emails`
- `daily-auto-extraction`
- `db-health-check`
- `dld-daily-sync`
- `documents-public-fill`
- `download-project-document`
- `elevenlabs-podcast-tts`
- `elevenlabs-scribe-token`
- `elevenlabs-sfx`
- `enrich-all-drives`
- `enrich-area-descriptions`
- `enrich-area-images`
- `enrich-developer-data`
- `enrich-project-bedrooms`
- `enrich-project-payment-plans`
- `enrich-published-projects-cron`
- `esign-inbound-autoreply`
- `esm-supabase-smoke-test`
- `extract-citi-developer`
- `extract-logo-colors`
- `extract-payment-plans`
- `fill-developer-feature-images`
- `find-developer-logos-v2`
- `fix-broken-news-images`
- `fix-developer-feature-images`
- `fix-developer-photos`
- `fix-missing-images`
- `flag-lead-junk`
- `generate-area-images`
- `generate-developer-descriptions`
- `gmail-integration`
- `inbox-attachment`
- `inbox-auto-acknowledge`
- `inbox-daily-report`
- `inbox-folder-sync`
- `inbox-modify`
- `inbox-send-as`
- `inbox-trash`
- `instagram-process-scheduled`
- `listing-enrichment-matcher`
- `mirror-developer-logos`
- `mirror-news-images`
- `npm-supabase-smoke-test`
- `outreach-cadence-run`
- `portal-approve-rep-application`
- `portal-decide-access-request`
- `process-approval`
- `process-drive-upload`
- `proof-phase-a1`
- `proof-phase-a2`
- `provident-batch-sync`
- `provident-enrich-core-fields`
- `provident-sync-all`
- `provident-sync-master`
- `recalc-lead-score`
- `reelly-backfill-details`
- `reelly-emergency-full-extract`
- `reelly-fetch-details`
- `reelly-offline-orchestrator`
- `rel-schedule-followup`
- `repair-area-images`
- `repair-developer-urls`
- `repair-draft-projects`
- `repair-empty-projects`
- `repair-image-urls`
- `repair-project-data-gaps`
- `restore-developer-logos`
- `restore-developer-photos`
- `rls-hardening-proof`
- `rls-proof-ai-job-master`
- `rls-proof-anon-dev-sales-reps`
- `rls-proof-anon-vapi-call-logs`
- `rls-proof-anon-video-assets`
- `rls-proof-anon-video-studio-jobs`
- `rls-proof-phase5-hr-chat`
- `sarah-extract-projects`
- `scrape-developer-logos`
- `secure-file-upload`
- `security-proof-jobs`
- `security-proof-studio-projects`
- `send-idea-approved-email`
- `signup-client`
- `std-smoke-test`
- `summarize-user-profiles`
- `sync-all-listings`
- `sync-lead-backfill`
- `sync-provident-logos`
- `uae-registry-followup-send`
- `vapi-retention-cleanup`
- `vapi-webhook`
- `zoho-reverse-pull`
