
## Direct answers to your questions

**1. Where are Contracts?**
There IS a Contracts tab in the Email Center (top filter row, between Overview and Registrations). You may be confusing it with the standalone Contract Vault at `/owner/crm?entity=leads&view=contracts`. They are two different things:
- **Email Center → Contracts tab** = contract-related *emails* (signed agreements, addenda, MOUs landing in your inbox).
- **Contract Vault** = the master list of signed contract *records*.
I'll rename the Email Center tab to **"Signed Contracts"** and add a status sub-grouping (Signed / Pending Signature / Needs Document) so it's obvious.

**2. Test emails.** Confirmed — from now on, every test send defaults to `infoo.jane@gmail.com`. I will purge every `drjane@gmail.com` reference (6 places — see Technical section).

**3. T4 (Registration confirmation).** Understood. For developers already marked "registered" (like Shoba) — send a one-time confirmation email asking them to confirm our agency status. If they reply yes → stays registered. If no reply / negative → auto-flip back to `pending_registration`, extract the task from their reply, attach it to the developer with a link to the email preview. **Going forward, no developer is auto-marked registered until they reply confirming** — and the confirmation reply must include the contact person responsible for projects/events/commission.

**4. T5 (auto-flip status).** Yes, you're right — I should just do it, not ask. When a developer replies "you are registered/onboarded" the system auto-flips `registration_status = registered`.

**5. Why the missing-document chase bug?** When an email is classified as `signed` but `contract_document_url` is empty (no PDF attached, or the attachment was a low-confidence match), the system currently flags it `needs_review` instead of auto-firing a chase email. The fix: when `status=signed` AND no attachment AND `linked_developer_id` is set → automatically send the document-request email, log it, and stamp `awaiting_them` until the doc arrives.

**6. Email client duplication in Communication.** There are currently two places that show emails: **Communication Hub** (multi-channel: Gmail/Slack/Telegram, raw thread view) and **Email Center** (CRM-scoped, classified, real-estate only, with actions). Recommendation below in section 5.

---

## 1. Premium UI upgrade for Email Center

```text
┌─────────────────────────────────────────────────────────────┐
│ Email Command Center                  [Sync inbox now]      │
│ Real-estate only · auto-BCC infoo.jane@gmail.com            │
├─────────────────────────────────────────────────────────────┤
│ [Overview] [Signed Contracts] [Registrations]               │
│ [New Launches] [Projects & Inventory] [Commission]          │
│ [Events] [Partnerships] [Brokerages] [Careers] [Other]      │
├─────────────────────────────────────────────────────────────┤
│ Sub-filters: All · Awaiting you · Awaiting them · Signed    │
│              · Pending · Needs doc                          │
├─────────────────────────────────────────────────────────────┤
│ ╔══════════════════════════════════════════════════════╗   │
│ ║ 🟡 GOLD-BORDERED CARD                                ║   │
│ ║ ● Sobha Realty · Signed: Authorization Agreement     ║   │
│ ║ Status: ✅ Signed   Linked: Sobha (Registered)       ║   │
│ ║ [Preview email] [Open contract] [Reply] [Archive]    ║   │
│ ╚══════════════════════════════════════════════════════╝   │
└─────────────────────────────────────────────────────────────┘
```

- Every card gets a 1px gold hairline border (`#B89555`), champagne surface, ink text — full conformance with the existing design system.
- Status pills colour-coded: Signed = emerald, Awaiting you = amber, Awaiting them = blue, Needs doc = rose, Info = champagne.
- New status filter sub-bar so you can flip between "Awaiting you / Awaiting them / Signed / Pending / Needs doc" within any category.

## 2. Real-estate-only filter (strict)

Right now the classifier only requires "JBJ token OR known developer domain". That's why unrelated mail leaks in. New rule:
1. **Must** match a real-estate signal (developer domain, RERA/DLD/ADREC, "agency/brokerage/listing/project/launch/inventory/commission/agreement", or known-developer name) **AND**
2. **Must not** match a blocklist (newsletters, no-reply marketing, banking, government tax circulars, Google/Apple/Microsoft notices, LinkedIn jobs unrelated to RE).

Anything that doesn't pass both rules is dropped before insert (not just hidden). Re-running Sync will purge previously-misclassified items from `email_inbox_items`.

## 3. New category sections (replaces flat list)

| New tab | What goes here |
|---|---|
| Overview | Everything real-estate |
| Signed Contracts | Signed/executed agreements + MOUs |
| Registrations | "You are registered / pending registration" replies |
| Brokerages | Replies from brokerages we onboarded (the automated outreach loop) |
| New Launches | New project announcements, pre-launch teasers |
| Projects & Inventory | Brochures, inventory sheets, fact sheets, payment plans |
| Commission | Commission structures, payouts, slabs |
| Events | Launch events, broker events, site visits |
| Partnerships | MoUs, co-broking, JV, referral programs |
| Careers | CVs, recruiter mail |
| Other | RE-related but uncategorised |

## 4. Auto-CRM sync from emails (the big one)

Every classified email triggers a side-effect pipeline:

```text
Email arrives
  → classify (category + status)
  → match developer (by domain / known sender)
  → if signed agreement + no doc → fire document-chase
  → if registration confirmation reply → flip status registered + capture contact person
  → if New Launch / Project email
       └→ extract attached brochure(s), fact sheet, payment plan
       └→ try to match an existing project (fuzzy: project_name + developer)
       └→ if match → attach docs to that project (Property page + Home feed update via existing project_media flow)
       └→ if no match → create a draft listing (status=draft, source=email),
              auto-fill name/developer/location from email body,
              run deep-research enrichment (existing universal-link-extractor),
              route to Listing Admin for owner approval
       └→ if "offline opportunity" keyword → create as Offline Property
  → if Commission email → attach to developer's commission ledger
```

All sends are server-side; you keep one-click "Approve" buttons in Listing Admin so nothing goes public without you.

## 5. Recommendation: Email Center vs Communication Hub

They serve different jobs and should **not** be merged:
- **Communication Hub** = raw multi-channel inbox (Gmail + Slack + Telegram + Twilio). Keep as-is.
- **Email Center** = CRM-aware, classified, real-estate-only, with one-click CRM actions.

**Dedup action:** remove the generic "Email" tab inside Communication Hub for the *owner role* (it just mirrors Gmail) and replace it with a link card "Open Email Command Center →". Other channels (Slack, Telegram, SMS) stay in the Hub. This eliminates the duplicate inbox view without losing functionality.

## 6. Founder BCC fix (`drjane@gmail.com` → `infoo.jane@gmail.com`)

Replace in 6 files:
- `supabase/functions/send-registration-confirmation/index.ts` (line 14: `FOUNDER_BCC` constant)
- `src/hooks/useEmailInboxItems.ts` (line 96: toast string)
- `src/pages/owner/crm/EmailCenter.tsx` (lines 7, 78: header copy)
- `src/config/ownerEmails.ts` (line 12: remove `drjane@gmail.com` from OWNER_EMAILS)
- header comments in `send-registration-confirmation/index.ts` (line 3)

## 7. End-to-end test (I just run it, no more asking)

I will execute against `infoo.jane@gmail.com` as the captive recipient:
- T1 Email log dialog → already fixed, just re-verify
- T2 Sync inbox → confirm real-estate-only filter drops the noise
- T3 Auto-link signed contracts
- T4 Send registration-confirm to Sobha **via your address** (you receive it, Sobha doesn't) and verify BCC = infoo.jane@gmail.com
- T5 Simulate "yes registered" reply → confirm auto-flip
- T6 Trigger missing-doc chase on a signed-no-attachment record
- T7 BCC enforcement audit across all outbound functions
- T8 Counts match UI

I'll deliver a pass/fail table with screenshots and the new categories populated.

---

## Technical section (for the AI/dev)

**Files to edit**
- `supabase/functions/classify-jbj-inbox/index.ts` — tighten `isJbjRelated` (AND-of-positive-signal + blocklist), expand `CATEGORY_RULES` for new sections (new_launches, projects_inventory, commission, events, brokerages), emit side-effect events.
- `supabase/migrations/<new>.sql` — extend `email_inbox_items.category` check constraint with the new values; add `linked_project_id`, `extracted_documents jsonb`, `auto_action_taken text` columns.
- New edge function `email-side-effects` — handles project attach/create, doc-chase auto-fire, registration-confirm flip.
- `src/pages/owner/crm/EmailCenter.tsx` — new CATEGORIES array, status sub-filter bar, gold-bordered card component, copy fix.
- `src/hooks/useEmailInboxItems.ts` — extend `InboxCategory` union, update queries, fix toast copy.
- `src/config/ownerEmails.ts` — remove `drjane@gmail.com`.
- `supabase/functions/send-registration-confirmation/index.ts` — `FOUNDER_BCC = "infoo.jane@gmail.com"`; add `variant="ask_status_confirmation"` mode with 7-day timeout that flips `registered → pending_registration` on no-reply.
- Listing-creation reuse: call existing `universal-link-extractor` + `create-listing-draft` (or equivalent) — no new ingestion pipeline.

**DB changes summary (one migration):**
- `email_inbox_items.category` enum widened
- new cols on `email_inbox_items`: `linked_project_id uuid`, `extracted_documents jsonb default '[]'::jsonb`, `auto_action_taken text`, `confirmation_sent_at timestamptz`
- new table `developer_registration_confirmations(developer_id, sent_at, replied_at, outcome)` for the 7-day reconfirmation loop.

**Order of work**
1. BCC purge + ownerEmails edit (5 min, safe).
2. Migration + classifier rewrite.
3. EmailCenter UI rebuild with gold cards + sub-filter.
4. Side-effects edge function.
5. Communication Hub dedup card.
6. Run E2E and deliver pass/fail report.

Approve and I'll execute end-to-end, no further questions.
