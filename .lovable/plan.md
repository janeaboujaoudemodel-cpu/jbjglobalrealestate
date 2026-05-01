## Goal

Make every brokerage breakfast / partnership email render fully personalized for the recipient: their **contact name**, their **company name**, their **group / partnership status**, and a **preferred event time** they can lock in before sending — with sensible fallbacks so a missing field never produces a broken `{{variable}}` in the inbox.

Today the template only knows `{{brokerage_name}}`, `{{contact_first_name}}`, `{{owner_first_name}}`, `{{booking_url}}` etc. Group status and a personalized event time are not passed through.

## What changes

### 1. Expanded template variable set

The send function (`crm-send-brokerage-outreach`) will compute and inject these variables for every send (test or real):

| Variable | Source | Fallback |
|---|---|---|
| `contact_first_name` | `primary_contact.name` first token | `"Team"` |
| `contact_full_name` | `primary_contact.name` | `company_name` |
| `contact_title` | `primary_contact.title` | `""` (line hidden) |
| `brokerage_name` | `crm_brokerages.company_name` | `"your brokerage"` |
| `brokerage_location` | `office_location` / `emirate` | `"Dubai"` |
| `group_status_label` | derived (see below) | `"Independent Brokerage"` |
| `group_status_line` | one-sentence intro line built from status | generic line |
| `preferred_event_time_label` | human-readable preferred slot | `"a time that suits you"` |
| `preferred_event_time_iso` | ISO of chosen slot | `""` |
| `booking_url` | existing token URL | existing |
| `owner_first_name`, `from_name`, `reply_to`, `cc_email` | existing | existing |

**Group status derivation** uses fields already on the row (no schema change required for v1):
- `outreach_stage = "active"` → `Active Channel Partner`
- `tags` contains `vip` / `priority` → `Priority Partner`
- `nda_status = "signed"` → `NDA-Signed Partner`
- `is_existing_match = true` → `Existing Relationship`
- otherwise → `Prospective Partner`

The matching `group_status_line` is a short pre-written sentence per status (e.g. *"As one of our active channel partners, …"* vs *"We'd love to introduce JBJ Global Real Estate to your team …"*).

### 2. Per-send overrides from the UI

`BulkSendDialog` gets a new compact "Personalization" panel (collapsible, on by default for brokerage variants) with three optional overrides per recipient row:

- **Contact name** — pre-filled from `primary_contact.name`, editable inline.
- **Group status** — dropdown: Prospective / Existing Relationship / Priority / Active Channel / NDA-Signed / Custom… (auto-detected default).
- **Preferred event time** — dropdown of upcoming `breakfast_slots` (next ~6 slots) plus an "Open scheduler — let them choose" option (current behavior).

All three are optional; leaving them blank uses the auto-derived value above. The dialog already iterates over recipients, so each row carries its own `personalization` object.

The hook `useSendBrokerageOutreach` and the edge function payload gain:

```ts
personalization?: {
  contactName?: string;
  contactFirstName?: string;
  groupStatus?: "prospective" | "existing" | "priority" | "active" | "nda" | "custom";
  groupStatusLabelOverride?: string;
  preferredSlotId?: string;       // breakfast_slots.id
  preferredEventTimeOverride?: string; // free-text, e.g. "Tuesday 9 May, 8:30 AM"
}
```

### 3. Edge function logic (`crm-send-brokerage-outreach`)

- Accept the new `personalization` object.
- After loading the brokerage row, compute the variable map using overrides → row values → fallbacks (in that order).
- If `preferredSlotId` is provided, fetch that slot from `breakfast_slots`, format it in Dubai timezone (e.g. *"Tuesday, 12 May · 8:30 AM (GST)"*), and pass it as `preferred_event_time_label` + ISO.
- If `preferredSlotId` is set, also forward it to `crm-create-breakfast-invite-token` so the booking page can pre-select that slot (small additive param `preferredSlotId` — token endpoint just stores it on `meeting_requests.preferred_date`/`preferred_time`).
- Render both `subject` and `html` through `renderTemplate` with the full variable map (subject gains `{{contact_first_name}}` and `{{group_status_label}}` support).
- Log the resolved personalization snapshot into `crm_relationship_email_log.body_snippet` for traceability.

### 4. Template updates (data-only, via insert tool)

Update the two existing rows in `crm_email_templates` (`brokerage_partnership_intro`, `brokerage_breakfast_invite`) so the HTML body uses the new variables:

- Greeting: `Dear {{contact_first_name}},`
- A personalized intro paragraph that injects `{{group_status_line}}` and references `{{brokerage_name}}` and `{{brokerage_location}}`.
- A "Suggested time" block: *"We've held **{{preferred_event_time_label}}** for {{brokerage_name}} — confirm or pick another time below."* This block is rendered conditionally via a simple `{{#if preferred_event_time_iso}}…{{/if}}` substitution we add to `renderTemplate` (tiny extension, still no dependencies).
- Subjects updated to e.g. *"{{contact_first_name}}, breakfast with JBJ — {{preferred_event_time_label}}"* with graceful fallback when the time is empty.

No schema migration required — only template HTML/subject text is updated, which is data, applied via the insert tool.

### 5. Booking page hand-off

`BreakfastBooking.tsx` already reads `attendee_count` / `briefing_topics` / `preferred_date` / `preferred_time` from the lookup endpoint. We pass the chosen `preferredSlotId` through `crm-create-breakfast-invite-token` so when the partner clicks the email link, their pre-selected slot is highlighted (no behavior change if absent).

## Files touched

- `supabase/functions/crm-send-brokerage-outreach/index.ts` — accept `personalization`, derive variables, look up slot, expand renderTemplate map, support `{{#if x}}…{{/if}}`.
- `supabase/functions/crm-create-breakfast-invite-token/index.ts` — accept optional `preferredSlotId` and persist it on the placeholder `meeting_requests` row.
- `src/hooks/useCRMRelationships.ts` — extend `useSendBrokerageOutreach` payload type.
- `src/components/crm/BulkSendDialog.tsx` — new collapsible Personalization panel per row (contact name, group status, preferred slot dropdown), pulls upcoming slots via a small new hook `useUpcomingBreakfastSlots()`.
- `src/hooks/useCRMRelationships.ts` — add `useUpcomingBreakfastSlots()` (selects next 8 future rows from `breakfast_slots`).
- `crm_email_templates` rows for both brokerage variants — updated subject + HTML (data update, applied via the insert tool).

## Out of scope

- No new database columns. Group status is derived, not stored separately. If later the user wants a hard-coded `group_status` field on `crm_brokerages`, that's a follow-up.
- No changes to developer-registration variants — personalization stays brokerage-only for now.
- No new auth or RLS work; `breakfast_slots` is already readable, and the rest runs server-side with service role.

## Acceptance check

- Sending a test email for a brokerage with a populated `primary_contact.name`, an `outreach_stage`, and a chosen preferred slot produces an email whose subject, greeting, intro line, and "suggested time" block all reflect those values — no `{{variable}}` leaks in the inbox.
- Sending with everything left blank still produces a valid, professional email using the fallback values.
- The booking link in that same email opens the scheduler with the suggested slot highlighted.
