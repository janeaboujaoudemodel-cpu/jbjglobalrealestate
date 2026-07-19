
# Broker Portal v2 — Command Center for JBJ × Citi Developers

Rebuild the Broker Portal into one workspace that (a) manages every brokerage and individual broker regardless of how they entered the system, (b) tracks which database each row came from, (c) sends bulk registration / briefing campaigns without duplicating recipients, and (d) auto-syncs replies from your inbox so agency status updates itself with an AI-drafted response waiting for your approval.

You do not have to build all of this at once. The plan is split into 4 phases so you can approve one, see it working, then move to the next.

---

## Phase 1 — Clean the surface (stats, logos, sources, single intake)

**Fix the counts and scoping**
- "1000 shown" becomes "1,000 of 10,613 agencies" (or brokers, depending on the tab). Same pattern on every filtered view.
- Add a **Database scope switcher** at the top of the list — dropdown with:
  - "All brokerages" (default)
  - "Assigned by Citi Developers" (the sheet Citi handed you)
  - "Registered by me with Citi" (agencies you personally closed)
  - Plus one entry per uploaded database, named by you at upload time (e.g. "DLD individual brokers Q2 2027")
- Each card shows a small chip: **Source · <database name>** (DLD, Citi assignment, Manual entry, etc.).

**One intake, no more duplicate buttons**
- Delete the separate "Import Brokerage" + "Upload database" pair. Replace with a single **`+ Add`** menu:
  - Add a brokerage (single form)
  - Add an individual broker (single form)
  - Upload a database (Excel/CSV) — opens the wizard below

**Upload wizard**
1. Drop file → name the database → pick source label (DLD / Citi assignment / manual list / other).
2. Pick actions (checkboxes — you tick what applies):
   - Create as a **new separate database** (stays visible on its own scope)
   - **Merge** into an existing brokerage list (choose which, or "All")
   - **Both** — create separate AND merge into All (your "create separate + merge" case)
   - **Assign to a broker/team member** → expands a picker
3. Preview rows → Confirm.
- Deduplication is by trade licence number when present, otherwise legal name + emirate. Merges never overwrite non-empty fields (same rule as developer imports).

**Agency logos, auto**
- On first render of an agency card with no logo, an edge function fetches favicon/OG image from the agency website; falls back to Clearbit-style logo lookup by domain; caches to `crm_brokerages.logo_url`.
- Same treatment as developer logos — logo shown left of the name, exactly like Developer Portal cards.

**Phone auto-scrape**
- When phone is missing but website is present, edge function scrapes the site's contact page and tel: links, saves the first valid UAE number to `phone_primary`, keeps discovered extras in `custom_fields.phones[]`.
- Runs on upload and on-demand ("Enrich contacts" per card / bulk action).

**Contacts block (mirror the developer profile pattern)**
- Card shows Contacts section with **+ Add new** (Position dropdown → Owner / Admin / Sales / Broker / Other → name, email, phone, WhatsApp, languages, notes). Repeatable, editable inline. Same UX you already approved on developer cards.

---

## Phase 2 — Move the email templates from JBJ Hub

**Find and wire, do not duplicate**
- The Citi Developers branded templates (registration invite, breakfast briefing invitation, follow-ups, thank-you) currently live under Relationship Hub / JBJ Hub. They stay there. The Broker Portal reads from the **same template registry** so any edit is reflected in both places.
- New tab inside Broker Portal: **Templates** — lists the shared registry with filters (Registration, Briefing, Follow-up, Custom). Preview + duplicate + edit.

**Template variables**
- `{{agency_name}}`, `{{contact_first_name}}`, `{{registration_link}}`, `{{briefing_date}}`, `{{sender_name}}`, `{{sender_signature}}` — resolved per recipient at send time.

---

## Phase 3 — Bulk campaigns, no duplicates

**Compose a campaign**
1. Pick recipients — from any scope (All / Citi-assigned / a specific uploaded database / a saved segment) with filters (registered = no, briefing done = no, emirate, etc.).
2. Pick a template.
3. Preview the merged version for a sample of 3 recipients.
4. Schedule or send now.

**Anti-duplicate guarantee**
- Every send writes to `email_send_log` keyed by `(recipient_email, template_name, campaign_id)`.
- Pre-send filter automatically excludes anyone who already received the same template within the campaign's cooldown window (default 30 days, editable). This is enforced server-side so no manual list-hygiene is needed.
- Suppression list (bounces, complaints, unsubscribes) is honoured automatically.

**Throughput**
- Uses the existing Lovable email infrastructure (queue + retries + DLQ). Default 120/min so a 10k send takes ~90 minutes and stays within reputation limits.
- Progress bar per campaign: queued / sent / delivered / bounced / replied.

---

## Phase 4 — Inbox sync + AI draft replies (the "smart" part)

**Inbox sync (Zoho Mail)**
- You already have the Zoho connection. A scheduled worker polls the inbox every 2 minutes for replies to campaign messages (matched by the `Message-ID` header we send and `In-Reply-To` we receive).
- Each reply is stored as a **thread** attached to the brokerage: full body, sender, timestamp, direction.

**AI classifier (Gemini via Lovable AI)**
For every inbound reply the model returns a structured verdict:
```
{
  intent: "already_registered" | "wants_registration" | "wants_briefing" | "declined" | "question" | "auto_reply" | "other",
  mentioned_sales_rep: "name or null",
  briefing_preferred_date: "iso or null",
  summary: "1-2 sentence English summary"
}
```
Rules applied automatically:
- `already_registered` + rep name → set `citi_registered = true`, `registered_with_rep = <name>`, task "Verify rep <name> exists in Citi team".
- `already_registered` + no rep → set `citi_registered = true`, task "Ask which Citi salesperson handles this agency".
- `wants_briefing` → status → `briefing_pending`, calendar suggestion pre-filled.
- `declined` → `not_interested`, campaign auto-skips this address in future.
- Anything else → `needs_review`.

**AI draft, never auto-sent**
- For every inbound reply the system prepares a draft response using the classifier output + your template library.
- Drafts land in a **Drafts** column on the agency card and in a global Drafts inbox. Each draft has:
  - "Approve & send" (queues the send)
  - "Edit" (inline rich editor)
  - **AI Assistant chat** beside the draft — you type "make it warmer / shorter / mention the Nov 20 briefing" and it rewrites in place. Nothing goes out without your explicit approve.

**Thread view**
- Full email ticket on the card: inbound + outbound chronologically, with the AI verdict + status change chip attached to each inbound message so you see why the status flipped.

---

## Technical section (for reference)

**Data model additions**
- `broker_databases` — id, name, source_label, uploaded_by, created_at, row_count, scope ("citi_assigned" | "personal" | "generic").
- `crm_brokerages.database_id` FK (nullable when a row belongs to multiple databases → use `broker_database_members` join table).
- `crm_brokerages.logo_url`, `custom_fields.phones jsonb[]`, `custom_fields.contacts jsonb[]` (position-typed).
- `broker_campaigns` — id, name, template_name, filter_json, schedule_at, status, cooldown_days.
- `broker_campaign_recipients` — campaign_id, brokerage_id, contact_email, status, message_id.
- `broker_email_threads` — brokerage_id, message_id, in_reply_to, direction, subject, body_text, body_html, received_at.
- `broker_email_ai_verdicts` — thread_id, intent, mentioned_rep, summary, applied_status_change.
- `broker_email_drafts` — brokerage_id, in_reply_to_thread_id, subject, body, status ("draft" | "approved" | "sent" | "discarded"), ai_notes.

**Edge functions**
- `broker-logo-enrich` — favicon/OG/Clearbit lookup, cached.
- `broker-phone-scrape` — fetch + parse contact page.
- `broker-campaign-send` — recipient resolution → dedupe check → enqueue via existing app-email pipeline.
- `broker-inbox-poll` (cron every 2 min) — Zoho Mail via existing gateway → normalize → store thread → classify → draft.
- `broker-draft-rewrite` — invoked from the AI Assistant chat beside a draft.

**Shared with Relationship Hub / JBJ Hub**
- Templates registry (`_shared/transactional-email-templates/`) — untouched, just surfaced in Broker Portal too.
- `crm_brokerages` and `crm_brokers` — the same rows, no duplication.

---

## Two questions before I start Phase 1

1. **Zoho Mail scope** — which mailbox should the inbox poller read? Your personal `janeaboujaoudemodel@gmail.com`, or a shared JBJ mailbox on Zoho (e.g. `hello@jbj.ae`, `brokers@jbj.ae`)? Bulk-campaign replies should land in the mailbox that sent the campaign; tell me the address to use as `From`.
2. **Unsubscribe / opt-out language** — Lovable email infra automatically appends an unsubscribe footer to every send. Confirm that's fine for the Citi registration / briefing campaigns (it is legally required for UAE bulk email under TDRA rules, so I strongly recommend keeping it).

Once you answer those two, I will build Phase 1 end-to-end (stats + database scope + single intake + logos + phones + contacts), take screenshots for you to review, and only then move to Phase 2.
