I’ll fix this as one upgrade to the brokerage section in the Relationships CRM.

What I found
- The main brokerage CRM is `src/pages/CRMRelationships.tsx` at `/owner/crm/relationships`.
- It already loads from `crm_brokerages`, but search filters on every keystroke and can feel slow with a bigger directory.
- The list currently sorts by backend `updated_at`, so top agencies are not guaranteed to stay at the top.
- Export is CSV only and still includes a RERA license column. I’ll remove RERA from the visible/exported brokerage flow because you said all agencies must already be licensed.
- There is an existing reminders table (`crm_relationship_reminders`) and an existing `admin_tasks` table. I’ll wire the brokerage Remind button into both, and add calendar/note records through a new CRM action table so it is tracked cleanly.

Implementation plan

1. Make brokerage search fast and reliable
- Add a debounced search value so typing does not lag.
- Search across agency name, emirate, office/location, website, phone, email, Instagram, status, outreach stage, and represented developer.
- Normalize text before searching so names with symbols or accents (for example `fäm Properties`) are easier to find.
- Keep the search input responsive even as the directory grows.

2. Rank famous/top agencies first
- Sort brokerages by a deterministic priority score:
  1. `directory_rank` if present
  2. estimated agent count
  3. rating
  4. deal count / activity
  5. agency name
- Add a hardcoded priority boost for UAE-famous agencies already in the directory, such as fäm Properties, Betterhomes, Allsopp & Allsopp, Metropolitan, D&B Properties, AX Capital, Driven, Provident, haus & haus, White & Co, Engel & Völkers, Espace, Knight Frank, CBRE, JLL, Asteco, Coldwell Banker, Savills, Chestertons, Bayut/Dubizzle-owned agency entries only if they are real estate brokerages.
- Keep non-real-estate filtering rules: no banks, mortgage brokers, insurance, law firms, logistics brokers, etc.

3. Make the brokerage list CRM-style
- Replace the current general brokerage statuses with business statuses matching your wording:
  - Not registered
  - Message sent
  - Follow-up scheduled
  - Registered
  - Active partner
  - Dormant
  - Do not contact
- Display a clear status pill/dropdown on every agency, including directory agencies.
- Show outreach metrics on each card: last message, attempts, next follow-up, deals, inquiry count, agent count.
- Rename “Licensed” UI labels to “Verified UAE real estate agencies” and remove visible RERA license labels from cards and exports.

4. Add PDF, CSV, and Excel export
- Add three export buttons: `Export PDF`, `Export CSV`, `Export Excel`.
- Export the currently filtered/sorted agency list in CRM-report format.
- Columns will include:
  - Rank
  - Agency name
  - Emirate
  - Office location
  - Website
  - Instagram
  - Phone
  - WhatsApp
  - Email
  - CRM status
  - Outreach stage
  - Last message sent
  - Next follow-up
  - Message attempts
  - Deals
  - Estimated agents
  - Rating
  - Notes
- Excel will be a real `.xlsx` sheet using the existing `xlsx` package, with styled headers and column widths.
- PDF will use `jsPDF` + `jspdf-autotable`, branded `JBJ GLOBAL REAL ESTATE`, landscape layout, and summary totals for the owner/company report.
- CSV remains simple and clean for import into other tools.

5. Make Remind create reminder, task, calendar item, and note
- Update `Remind` so one click creates:
  - CRM relationship reminder for the agency
  - Owner/admin task in `admin_tasks`
  - Brokerage CRM action record of type `calendar_event`
  - Brokerage CRM note/action record saying a follow-up reminder was created
- Update the agency row with `next_followup_at`, `next_action_at`, `next_action_note`, and outreach stage `follow_up_scheduled` when appropriate.
- Show a toast confirming: reminder added, task created, calendar note saved.

6. Add the required database support
- Add a small `crm_brokerage_actions` table for notes/calendar/activity against each agency:
  - owner_id
  - brokerage_id
  - action_type (`note`, `calendar_event`, `reminder`, `status_change`)
  - title
  - body
  - due_at
  - metadata
  - created_by
- Protect it with owner/admin RLS following the existing CRM access pattern.
- Add indexes for brokerage and due date.
- Add an outreach-stage value for `follow_up_scheduled` if not already present.
- Do not modify generated backend client/type files.

7. Improve directory completeness controls
- Keep the existing background directory sync card.
- Adjust the wording to make clear this is the UAE real estate agency directory only.
- Keep the backend exclusion rules for banks/mortgage/insurance/legal/logistics.
- Increase the visible/exportable list handling so all loaded agencies appear and can be searched/exported. If the backend has more than 1,000 agencies later, the hook will page through all rows instead of relying on a single capped query.

Files I expect to edit
- `src/pages/CRMRelationships.tsx`
- `src/hooks/useCRMRelationships.ts`
- `src/components/crm/DirectoryToolsPanel.tsx`
- a new migration under `supabase/migrations/...`
- possibly `supabase/functions/seed-uae-brokerage-directory/index.ts` and/or `supabase/functions/enrich-uae-brokerage-directory/index.ts` for stricter real-estate-only wording and ranking/contact fields

Result after approval
- Brokerage search will feel immediate and find agencies correctly.
- The most famous/top UAE agencies will appear first.
- You’ll have PDF, CSV, and Excel exports suitable to send to the owner/company leadership.
- No RERA license column/label will be shown in this brokerage CRM flow.
- Every agency will have clear CRM status tracking.
- Clicking `Remind` will create the reminder, task, calendar-style action, and note in one step.