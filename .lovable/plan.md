# Brokerage Outreach Automation — Mirror of Developer Flow

Replicate the exact developer outreach automation for brokerages: bulk email with branded templates, test sends, recent-contact skip, status pills, send log, and a pre-written "Private Breakfast Briefing" message authored as Jane (Head of Sales).

## What gets built

### 1. Two locked, branded email templates (DB-stored, editable + lockable)

Same `crm_email_templates` table the developer flow uses, with two new variants:

- `brokerage_partnership_intro` — primary outreach for brokerages not yet in our channel-partner network. Body authored as Jane, Head of Sales, JBJ GLOBAL REAL ESTATE. Asks whether the brokerage is already registered with us / has an active group, and proposes a **private breakfast briefing** at the JBJ office to discuss collaboration and partnership opportunities. Includes brokerage placeholder `{{brokerage_name}}` and a CTA button to confirm interest.
- `brokerage_breakfast_invite` — direct breakfast-event invitation for brokerages we've already qualified (or are re-engaging). Slightly more event-focused tone with date-flexible language.

Both templates use the same champagne/gold institutional shell as the developer templates (logo, header, hairline, signature block). Each can be locked once finalized so the wording can't be changed accidentally.

### 2. Edge function: `crm-send-brokerage-outreach`

A 1:1 clone of `crm-send-developer-registration` with brokerage-specific fields:

- Validates `brokerageId` (or `testRecipient` for a test send), looks up the brokerage row in `crm_brokerage_registry`.
- Renders `{{brokerage_name}}`, `{{contact_first_name}}` (from `primary_contact.name`), `{{owner_first_name}}` (Jane), `{{event_url}}` placeholders.
- Sends via the existing email infrastructure (`send-transactional-email` queue) so retries, suppression, and rate-limit handling work for free.
- On success: writes to `crm_outreach_touchpoints` (channel = "email", direction = "outbound", stage = "introduced"), updates `last_outreach_at` + increments `outreach_count` on the brokerage row, and creates a `developer_action_items`-equivalent row (we'll reuse the same table renamed semantically — see "Database" below).
- Honors `silent` for bulk loops, `testRecipient` for test sends, and the "skip if contacted in last 7 days" guard.

### 3. UI: brokerage tab gets the same toolset

In `CRMRelationships.tsx` (Brokerages section):

- **Bulk-select checkboxes** on each brokerage card (already present on developers).
- **"Send Outreach" button** that opens a brokerage-flavored `BulkSendDialog`.
- **"Send TEST" button** next to it — auto-fills the owner's registered email (matching the developer flow change from earlier).
- **Sent-history sub-tabs** (Inbox, Contacted, Pending Actions, Under Review, Rejected, Expired, Recently Deleted) wired to `entity_type = "brokerage"` filter on the touchpoint table.

### 4. `BulkSendDialog` becomes entity-aware

The component currently hard-codes `Developer` shape and developer variants. Refactor in place to accept an `entityType: "developer" | "brokerage"` prop. Internally it picks the right variants list, the right hook (`useSendDeveloperRegistration` vs new `useSendBrokerageOutreach`), the right template lookup, and the right placeholder substitution map. No visual changes — the dialog looks identical for both flows.

### 5. The "Jane / Private Breakfast" copy

Locked template body for `brokerage_partnership_intro` (paraphrased from the user's brief, written as Jane, Head of Sales — Channel Partners):

> Subject: Private Breakfast Briefing — JBJ Global Real Estate × {{brokerage_name}}
>
> Dear {{contact_first_name}},
>
> I'm Jane, Head of Sales handling Channel Partners at JBJ Global Real Estate. I wanted to reach out personally to check whether {{brokerage_name}} is currently registered with us or has an active group on our channel-partner network — and if not, I'd like to fix that.
>
> We're hosting a **private breakfast briefing** at our Dubai office for senior leadership at selected brokerages. The agenda is short and focused: a market read on Q[NN], a walk-through of our exclusive inventory and commission structure, and a private conversation about how we can collaborate as channel partners going forward.
>
> If this is of interest, reply to this email and I'll have my office send three date options. I'd also be glad to bring a tailored partnership brief specific to {{brokerage_name}}.
>
> Warm regards,
>
> **Jane Williams**
> Head of Sales — Channel Partners
> JBJ GLOBAL REAL ESTATE

The `{{owner_first_name}}` variable defaults to "Jane" but resolves to the logged-in owner's first name when present, so the same template works whether the founder or Jane is sending. The user can edit and lock the wording from the existing template editor UI.

## Database

One migration:

1. **`crm_brokerage_registry`** — add the same outreach columns developers already have if missing: `last_outreach_at timestamptz`, `outreach_count int default 0`, `outreach_stage text default 'not_contacted'`, `deleted_at timestamptz`. Add an index on `(deleted_at, last_outreach_at)`.
2. **`developer_action_items`** — generalize to **`crm_action_items`** with an added `entity_type text check (entity_type in ('developer','brokerage'))` column and a backfill (`update ... set entity_type = 'developer'`). Add a compatibility view named `developer_action_items` that filters to `entity_type = 'developer'` so existing developer code keeps working. RLS policies are recreated on the new table with the same `requireOwnerAuth` rules.
3. **`crm_email_templates`** — insert two new rows for `brokerage_partnership_intro` and `brokerage_breakfast_invite` with the locked body above.

## Files touched

- `supabase/functions/crm-send-brokerage-outreach/index.ts` — new edge function (clone of developer one).
- `supabase/migrations/<timestamp>_brokerage_outreach.sql` — schema + seed templates.
- `src/hooks/useCRMRelationships.ts` — add `useSendBrokerageOutreach`, extend `RegistrationVariant` union, generalize `useEmailTemplate` to accept any variant.
- `src/components/crm/BulkSendDialog.tsx` — accept `entityType` prop, swap labels/hooks/variants accordingly.
- `src/pages/CRMRelationships.tsx` — wire bulk-select + Send Outreach + Send TEST on the Brokerages tab; reuse `SentHistoryView` with `entityType="brokerage"`.
- `src/components/crm/SentHistoryView.tsx` — already entity-aware after the recent rewrite; only need to pass `entity_type = "brokerage"` filter through.

## Out of scope for this turn

- Logo auto-fetch for brokerages (covered by the existing `<DeveloperLogo />` standardization — same component now renders brokerage logos identically).
- Calendar booking for the breakfast event (use the existing meeting-booking orchestration once the brokerage replies; no changes needed).
- WhatsApp / SMS variants (email-only for v1, matching the developer flow exactly).