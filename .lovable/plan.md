# Finish Pending Production Work

## Goal
Complete the cited unfinished work without redesigning the approved public experience: restore fast, deterministic styling; make property purpose logic truthful; make chat/advisory escalation persist securely; finish the developer media workflow; complete calendar and inbox integrations; and retire the duplicate owner CRM experience.

## Confirmed Baseline
- The public catalogue currently has 1,652 published sale projects and **0 published rental records**. Rent must not reuse or relabel sale inventory.
- `chat_conversations` has guest/member policies but no matching Data API table grants, which explains the observed guest persistence failures.
- Seven exact-name developer duplicate groups remain in the database.
- The new CRM shell and the legacy owner CRM are both still routable; some “new” shell modules are placeholders while real capabilities remain in the older CRM.
- CSS contains thousands of broad `html body` selectors. Moon theme is generated and uses deliberate high-specificity scoping, so a blind global replacement would risk contrast regressions.
- Google calendar pull works; local-event push can skip rows when `is_cancelled` is null. Outlook is connected without the write scope required for two-way sync.

## 1. CSS Performance and Moon Contrast
- Add a targeted selector-analysis/rewrite script rather than editing thousands of selectors blindly.
- Remove redundant `html body` prefixes only from selector families whose cascade outcome is proven unchanged; preserve route scopes, portal scopes, and contrast locks.
- Update the Moon-theme generator, not its generated CSS, and reduce repeated theme scoping only to the minimum specificity that still wins against Sun/champagne rules.
- Give Moon sidebar section labels and inactive links explicit white/white-muted semantic tokens; keep the owner backend theme lock unchanged.
- Measure before/after style recalculation, long tasks, dropdown open/close latency, CSS size, and selector count. Reject any rewrite that changes screenshots or worsens timings.

## 2. Truthful Buy, Rent, Resale, and Distress Search
- Keep **Sell** as a direct route to the property-listing flow, never as a search filter.
- Split sale and rental inventory at the query boundary using `listing_kind`; remove the current client-side hardcoded “Rent = zero” shortcut once the rental query path is wired.
- Add rental-ready taxonomy: `Ready` and `Resale Ready`; hide off-plan, handover, payment-plan, and distress controls for Rent.
- Make price labels and sorting purpose-aware: sale price for Buy, rent amount plus yearly/monthly/weekly/daily frequency for Rent.
- Add the missing rental-frequency database field and indexes only if needed by the existing projects model; do not fabricate rental listings. Until real rental rows exist, show a polished zero-inventory state with “List a rental” and advisory actions.
- Make `/properties`, `/rent`, `/resale`, and `/distress` use the same URL codec, query engine, count engine, headings, chips, and result totals.
- Remove duplicate legacy filtering inside `Properties.tsx` so the visible grid, count button, URL, and toolbar cannot disagree.

## 3. Advisory Desk and AI Chat Persistence
- Apply the missing table grants that match the existing `chat_conversations` and `advisory_desk_requests` RLS policies; do not loosen ownership or staff access.
- Move conversation creation/update and guest history retrieval behind validated Edge Functions so browser code never relies on email-only table access.
- For signed-in users, derive `user_id`, email, and name from the verified token and persist the conversation as **Member · verified**.
- For public guests, accept the collected email/name/phone only on public routes, persist as **Guest · unverified**, and never allow guest reads of arbitrary conversation rows.
- Keep gated routes session-required; reject a missing/invalid token before creating a ticket. Consolidate the gated-route prefix list into one shared contract to prevent frontend/function drift.
- Deploy advisory request/reply functions with in-function auth handling that permits the intended public guest request path while keeping owner replies owner-only.
- Fix the widget so conversation creation failure blocks the false “agent joining” success state, and show a recoverable error instead.
- Preserve owner email, bell notification, query, transcript, identity details, origin, and deep link. Rebuild the queue cards with semantic components/tokens and no inline hardcoded contrast styles.

## 4. Developer Media Studio and Data Integrity
- Rebuild the studio as a responsive grid/list workspace with 25/50/100 per-page controls, search, bucket filters, selection count, select-all-on-page, and bulk actions.
- Make cover and logo tiles themselves clickable upload targets with immediate local preview, upload progress, retry, URL paste, and post-save verification.
- Route logo uploads through the approved white-artwork processing path; show every logo on the locked emerald-to-black plate and never approve raw artwork merely because a URL exists.
- Treat a failed image load as missing media in both counts and publish eligibility, not only as a row-level warning.
- Add explicit states: missing, processing, needs review, approved, broken link, archived, and live. Completing valid media moves a record to review; bulk approval publishes it.
- Archive public developer profiles with no working cover, while retaining them in the owner queue with precise missing-photo/logo alerts.
- Merge the seven exact-name duplicate developer groups into canonical records only after remapping projects and dependent references; retain source/provenance and audit records. Keep presentation-layer dedupe as a final safety net.

## 5. One Owner CRM, No Duplicate Shells
- Make `/owner/crm/jbj` the single canonical owner CRM shell and redirect legacy owner CRM routes into equivalent new-shell destinations.
- Replace placeholder new-shell modules with the existing live components and data for leads, tasks, calls, notes, calendar, inbox, reports, automation, contracts, and relationships.
- Preserve and surface capabilities currently found only in the older CRM, including AI lead scoring/next actions, call activity/timing, pipeline analytics, and deal prediction, before retiring their old routes.
- Remove duplicate “CRM” and “JBJ CRM” navigation entries and all legacy champagne-shell links after parity is verified.
- Update notification, email, and in-app deep links to canonical new-shell routes.
- Keep the vertical sidebar, 56px chrome, emerald/white active state, responsive collapse behavior, and owner fixed-skin rule.

## 6. Admin Multi-Account Inbox
- Verify the existing `/admin/inbox` schema and all sync/mirror functions against the real account records for `contact@jbj.ae` and `helpdesk@jbj.ae`.
- Complete connection-state UX for Gmail, Outlook, and Hostinger IMAP: linked account, missing permission, expired connection, syncing, partial failure, and retry.
- Ensure read/unread, star, archive, trash, draft, send, attachment, and thread actions mirror to the source mailbox and surface per-account failures rather than reporting a blanket success.
- Keep AI assistive only: triage, category, urgency, SLA, summaries, and reply drafts require owner approval before sending.
- Add real-time refresh/invalidation and verify account-specific unread counts, folders, search, SLA states, and outbound replies.

## 7. Notes and Two-Way Calendar Sync
- Fix local-event push by treating null `is_cancelled` as active and recording per-provider external IDs/sync timestamps safely.
- Prevent pull-then-push loops and preserve conflict metadata for edits made in both calendars.
- Reconnect Outlook with calendar read/write permission; if the provider connection cannot be changed automatically, show an exact reconnect-required state rather than “connected”.
- Verify Google and Outlook pull, create, update, cancellation, duplicate prevention, and repeat sync.
- Keep note alerts, repeat rules, snooze, in-app notification, email notification, and “Add to calendar” linked to the canonical calendar event.

## 8. Verification and Release Gates
- Run focused unit/regression tests for URL codecs, purpose sanitization, rental frequency, gated/public escalation, identity derivation, broken-media bucketing, duplicate remapping, and calendar push filtering.
- Run database linter/security checks after migrations and test these boundaries: guest cannot read conversations; guest public escalation succeeds; guest gated escalation fails; member ownership cannot be spoofed; non-owner cannot read owner queues.
- Run authenticated and guest E2E flows for chat → advisory queue → owner reply, including email/bell deep links.
- Capture required visual proof only through `scripts/qa/shot.py`: search on desktop/tablet/mobile, Moon sidebar, Advisory Desk, Media Studio, inbox, and canonical CRM.
- Measure interaction performance before/after the CSS work and verify no partial/blank route render, overlap, cropped text, broken contrast, or dropdown regression.
- Publish only after the canonical CRM redirects, security boundaries, and visual/performance gates pass; explicitly label any external-provider path that remains unverified.

## Technical Notes
- Schema changes use reviewed migrations with grants before RLS policies; data merges use the database data-operation path, not schema migrations.
- Existing generated backend client/type files and generated Moon CSS remain untouched directly.
- No fake rental inventory, developer media, identities, or successful-provider claims will be introduced.
