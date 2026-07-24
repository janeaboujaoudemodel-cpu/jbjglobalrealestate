Implement the requested Phase 1.5 fixes and visible dashboard repair now, without starting Phase 2.

Confirmed current state from read-only checks:
- `DeveloperOwnerCampaignDashboard.tsx` currently counts `crm_developer_registry` rows directly and counts `crm_relationship_email_log` outbound rows as contacted/sent, which explains the live misleading cards.
- `BrandedEmailDashboard.tsx` currently reads `crm_relationship_email_log` and `crm_campaign_recipients`, not the canonical JBJ campaign spine/views.
- Canonical campaign tables exist: `jbj_campaign_recipients` with `send_status`, `delivery_status`, `reply_status`, `business_status`, `provider`, `resend_message_id`, `idempotency_key`; and `jbj_email_events` with idempotent event keys.
- Existing canonical views exist: `jbj_campaign_counts_v1`, `jbj_portal_counts_v1`, `jbj_phase1_reconciliation_v1`.
- `RESEND_WEBHOOK_SECRET` is configured in backend secrets, so webhook hardening/testing can proceed.
- Remaining Gmail outbound code is still present in the five named functions and `gmail-integration`/Gmail gateway send paths.

Plan:

1. Database/spine migration for Phase 1.5
   - Add/adjust canonical schema support for a true `intended_send_id` model.
   - Update `jbj_record_resend_send` so idempotency is based on one intended email:
     - campaign: `campaign_id + campaign_recipient_id + intended_send_id`
     - transactional: `workflow_instance_id + recipient_id + intended_send_id`
   - Add webhook replay/idempotency safeguards using Resend/Svix event IDs and existing event idempotency.
   - Add reconciliation exception storage/reporting and insert the missing `shahid.mukhtar@reportageuae.com` skipped remote-server failure as an exception, without fabricating a campaign recipient.
   - Update canonical dashboard views so they expose correct developer/brokerage KPI counts: total, actual contacted, accepted/delivered sent, failed/excluded, human replies, automated replies, registered, pending response, retry eligible, permanently excluded.

2. Shared Resend sender service
   - Update `_shared/jbjSpine.ts` to require/pass `intended_send_id` and build keys around intended sends.
   - Ensure every Resend send writes provider message ID and event metadata into the spine.
   - Keep retrying the same intended send idempotent while allowing later legitimate follow-ups and new campaigns to the same recipient/template.

3. Migrate/safely retire remaining outbound Gmail sender functions
   - `breakfast-booking-confirm`: replace the owner notification Gmail send with Resend; preserve booking details, date/time, location/slot data, attendees, consent, and recipient info; write transactional spine/audit events.
   - `send-registration-confirmation`: replace Gmail with Resend; write to the JBJ spine and keep developer registration logs.
   - `send-developer-reply`: replace Gmail with Resend; preserve thread context via `In-Reply-To` and `References` headers where available; write reply event/spine metadata.
   - `outreach-send-locked`: audit callers; if active, redirect to canonical Resend send while preserving locked-payload hash verification; if no active callers, make it return a clear retired/redirect response and remove outbound Gmail capability.
   - `broker-email-send`: keep only broker-owned OAuth mailbox paths where required for per-broker identity; remove any JBJ Gmail fallback; add JBJ spine writes for broker sends. If the broker-owned mailbox path remains, label it as broker identity mail, not JBJ campaign mail.
   - `gmail-integration/index.ts` send path: gate off/remove outbound sending; Gmail remains for inbound sync, reading threads, reply matching, classification, and attachments only.

4. Resend webhook hardening and verification
   - Make `RESEND_WEBHOOK_SECRET` mandatory: reject missing signatures, invalid signatures, expired timestamps, and replayed event IDs.
   - Process events idempotently using Resend/Svix event ID plus message ID.
   - Deploy and test the webhook with configured secret, including rejection cases and accepted event cases.

5. Reconciliation completion and lists
   - Run a second reconciliation pass using available evidence: current spine rows, message IDs, thread IDs, delivery/status events, existing email logs, timestamps, subjects, and inbound/system messages.
   - Keep `gmail_legacy_attempted` only where evidence is genuinely insufficient.
   - Separate: attempted unknown, likely accepted by Gmail before limit, confirmed rejected, confirmed failed, confirmed temporary failure.
   - Produce retry-eligible and permanently-excluded counts/lists; do not resend legacy recipients.

6. Wire developer campaign dashboard to canonical sources
   - Replace old dashboard counting logic with canonical view/spine queries.
   - Correct definitions:
     - Total Developers from canonical developer table only.
     - Contacted from actual contacted/accepted/delivered send records only, excluding Gmail legacy attempted, failed, invalid, rejected, bounced, deferred, and blocked.
     - Emails Sent from provider accepted/delivered only, with the selected definition visible in UI.
     - Registered from the canonical registration status field.
     - Responded split into Human Replies and Automated Replies.
   - Make every KPI card clickable and open the exact filtered records behind the number.
   - Ensure cards, tabs, tables, exports/profiles use the same canonical filters.

7. Fix developer cards and status behavior
   - Make every developer card clickable.
   - Show correct registration status on each card.
   - Use compact label `Pending` instead of `Application Pending`.
   - Force three-dot/action icons on emerald backgrounds to pure white.
   - After manual status edits, invalidate/refetch canonical dashboard and card queries immediately.

8. Verification and final report
   - Deploy changed edge functions.
   - Run read-only data checks for before/after KPI values.
   - Run edge-function tests for migrated senders, idempotency duplicate retry, legitimate follow-up, webhook signature/replay behavior, and breakfast/registration/developer-reply paths.
   - Run Playwright visual verification on the developer portal/dashboard with screenshots proving clickable KPI/card behavior and registered-status display.
   - Provide final evidence report only after verification, including: outbound provider map, Gmail inbound-only confirmation, migrated/retired functions, dashboard source views, before/after KPI numbers, clickable proof, status proof, webhook result, idempotency result, reconciliation totals, retry-eligible count, permanently-excluded count, and blockers if any.