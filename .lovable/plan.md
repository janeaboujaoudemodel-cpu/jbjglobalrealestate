I’ll upgrade the CRM Relationships Hub into a connected registration/contacting system and fix the CRM access bug first.

## What I’ll build

### 1. Fix CRM access immediately
- Stop the CRM from sending the verified Owner back to the homepage.
- Make `/crm` and `/owner/crm` trust the existing Owner verification, then fall back to the CRM staff profile only for non-owner users.
- Reduce duplicate toast popups so access problems show once, not three times.
- Ensure the Owner can enter the CRM even if `crm_users_profile` is missing or delayed.

### 2. Add inline status dropdowns next to every company/name
- Brokerage cards: dropdown beside company name.
- Developer registry cards: dropdown beside developer name.
- Client cards: dropdown beside client/company name.
- Changing a dropdown will save instantly and update `last_interaction_at` / status history.
- Fix the active black button/readability issue by using clear black/white contrast and visible active states.

### 3. Add full contact/status tracking fields
For developers, brokerages, and clients I’ll add/manage:
- Status
- Notes
- First contact date
- Last contact date
- Next follow-up date
- Contact person name
- Contact person role
- Email
- Phone
- WhatsApp
- Location / emirate
- Website
- Source of contact
- Outreach count
- Last email synced date
- Last auto-reply date

### 4. Email synchronization for replies
I’ll add a connected email sync flow that can read incoming messages from your connected mailbox and update the CRM automatically:
- If an agency/developer replies “already registered”, “you are registered”, “approved”, etc. → status becomes `registered`.
- If they reply with “pending”, “under review”, “processing” → status becomes `pending` / `under_review`.
- If they ask for documents → status becomes `documents_required`.
- If rejected/expired → status updates accordingly.
- The matched email thread will be logged against the brokerage/developer/client with a short AI summary and note.

Important: Gmail access requires the Gmail connector to be linked with read/send permissions. I’ll connect it during implementation so you can authorize the mailbox.

### 5. Automatic reply to developer registration requests
When a developer emails you asking for registration documents, the system will:
- Detect the developer/company from the incoming email.
- Create or update the developer registration row.
- Auto-reply with a polished JBJ GLOBAL REAL ESTATE paragraph and your Google Drive link:
  `https://drive.google.com/drive/folders/1EsWVmAPv6ljBzWbWNAvv07EQrHwi5drS?usp=sharing`
- CC the configured CC email.
- Update the developer status to `documents_sent` / `pending_application`.
- Add a reminder if they do not respond.

Proposed email wording:

```text
Dear Developer Relations Team,

Thank you for reaching out to JBJ GLOBAL REAL ESTATE.

Please find below our JBJ Global Documents folder, which includes the required company documents for broker registration:

JBJ Global Documents:
https://drive.google.com/drive/folders/1EsWVmAPv6ljBzWbWNAvv07EQrHwi5drS?usp=sharing

Kindly confirm once received and let us know if any additional documents, forms, NOC, agency code requirements, or signed registration agreements are needed.

For any questions, please reply to this email and keep our team copied.

Warm regards,
JBJ GLOBAL REAL ESTATE
```

### 6. Sender/CC switch and bulk outreach for all sections
I’ll add one shared “Email Settings” panel used by Developer, Brokerage, and Client outreach:
- Primary sender email.
- CC email: `infoo.jane@gmail.com`.
- Reply-to email.
- A “Reverse” button that swaps primary and CC.
- Per-send override: choose which email to send from and which email receives CC.
- Bulk send for brokerages and clients, matching the existing developer bulk send behavior.
- Save defaults permanently.

Note: actually sending from a Gmail address requires Gmail send authorization for that mailbox. If a mailbox is only used as CC/reply-to, it can be saved immediately.

### 7. Calendar/reminder integration
- Add reminders to the Relationships Hub for:
  - first contact due
  - follow-up due
  - registration pending too long
  - documents requested
  - expiry/renewal
- Show these reminders in CRM calendar.
- Add the reminder email target `infoo.jane@gmail.com` to settings so reminders can be routed there.
- If Google Calendar is authorized, sync reminder events into the connected calendar.

### 8. Research/import structure for developers and brokerage companies
I’ll prepare the CRM to store richer researched records for:
- UAE developers, expanding beyond the current 93.
- Brokerage companies in Dubai, Sharjah, Ajman, Ras Al Khaimah, and Umm Al Quwain.

Each imported/researched record will support:
- Company/developer name
- Emirate/location
- Email
- Phone
- Website
- Contact person
- Source URL
- Notes
- Status
- Verification confidence
- Last checked date

Because this data must be accurate and sourced, I’ll build the import/research pipeline and seed with the safest available known entries first. For a truly “deep Google research” list of all companies, the implementation will use the connected research/scraping capability and store source URLs so every entry can be verified later rather than inventing contact details.

## Technical work

- Database migration:
  - Add missing relationship tracking columns.
  - Add email sync log/history table.
  - Add status history table.
  - Add owner relationship email settings.
  - Add optional source/verification fields for imported contacts.
  - Fix RLS so the verified Owner can read/write relationship records without relying only on `admin` role.
- Frontend:
  - Update `CRM.tsx` access logic.
  - Update `CRMRelationships.tsx` UI, status dropdowns, email settings, bulk send, and contrast fixes.
  - Update `useCRMRelationships.ts` hooks.
  - Update `CRMCalendar.tsx` to include relationship reminders.
- Backend functions:
  - Add email sync processor for incoming Gmail messages.
  - Add auto-reply function for developer registration requests.
  - Generalize send-registration so brokerages, clients, and developers can use the same email controls.
  - Deploy changed backend functions after editing.
- Connectors:
  - Link Gmail for mailbox read/send sync.
  - Link Google Calendar if calendar sync is required.
  - Use existing Firecrawl connection for researched/source-backed enrichment where possible.

## Expected result

You will have one CRM Relationships Hub where developers, brokerages, and clients all have statuses, notes, contacts, dates, bulk emails, email response syncing, reminders, and calendar visibility. The Owner CRM access bug will be fixed so you are not blocked or redirected away again.