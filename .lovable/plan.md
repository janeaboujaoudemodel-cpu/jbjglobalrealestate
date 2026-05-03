# Plan: Recreation Prompt + Website Link Fix

This plan has two deliverables: (1) a small UI fix on the Relationships page so the website chip shows the actual URL, and (2) a complete, copy-pasteable prompt you can drop into a new Lovable project to recreate the Media Ingestion Hub, the Relationships hub (developers + brokerages), and the bulk email automation with prefilled signatures.

---

## Part 1 — Fix the brokerage website chip

**File:** `src/pages/CRMRelationships.tsx`, line 302 (component `BrokerageContactLinks`)

Currently the chip renders the literal word "Website". The developer card (line 1440) already shows the URL — only the brokerage row is wrong.

**Change:** render the cleaned URL text inside the anchor instead of the word "Website", keep the globe icon, keep it clickable, keep `target="_blank"` and `rel="noopener noreferrer"`. Strip protocol + trailing slash for display so it reads `example.com/path` rather than `https://example.com/`. Truncate visually if it overflows the row.

No other files affected.

---

## Part 2 — Full recreation prompt (give this to Lovable on the new project)

Paste the block below into the new Lovable project as your first message. It is self-contained — it tells the new agent exactly what to build, in what order, with the right backend, the right tables, the right edge functions, and the prefilled email templates you asked for ("This is Jane from the sales department, reaching out on behalf of Citi Developers…").

````text
Build me a real-estate operations backend with three connected modules:
(1) Media Ingestion Hub, (2) Relationships Hub (Developers + Brokerages),
(3) Bulk Email Automation with prefilled signatures.

Use Lovable Cloud for the backend. Use Lovable Email for sending (built-in,
no Resend). All tables must have RLS. All admin actions must be gated by a
`has_role(auth.uid(), 'admin')` security-definer function on a separate
`user_roles` table — never store roles on profiles.

================================================================
MODULE 1 — RELATIONSHIPS HUB
================================================================
Two tables:

  developers (
    id uuid pk, name text not null, slug text unique,
    logo_url text, website text, developer_email text,
    phone text, whatsapp_e164 text,
    head_office_address text, emirate text, office_map_url text,
    primary_contact jsonb,           -- { name, title, email, phone }
    field_sources jsonb default '{}',-- per-field provenance
    notes text, created_at timestamptz default now()
  )

  brokerages (
    id uuid pk, name text not null, slug text unique,
    logo_url text, website text, email text, phone text,
    whatsapp_e164 text, instagram_url text,
    office_address text, office_location text, emirate text,
    office_map_url text, agency_code text,
    primary_contact jsonb,
    field_sources jsonb default '{}',
    top_agents jsonb default '[]',
    created_at timestamptz default now()
  )

UI: `/owner/crm/relationships` with two tabs (Developers / Brokerages),
search, filter by emirate, card grid. Each card shows logo, name, and
clickable contact chips: email (mailto), phone (tel), WhatsApp (wa.me),
office (Google Maps), Instagram, and **Website — the chip MUST display
the actual URL (e.g. `acme.com`), not the word "Website", and be
clickable**. Strip `https://` and trailing `/` from the displayed text
but keep the full URL in `href`. Add an edit drawer for every field.

================================================================
MODULE 2 — MEDIA INGESTION HUB
================================================================
A drag-and-drop bulk uploader at `/owner/media-ingestion`:

- Accept up to 100 files per batch (images, PDFs, brochures, floor plans).
- Two modes: **Attach** (assign files to an existing developer/project)
  and **Extract** (run AI to read brochures/floor plans and create or
  update a project record).
- Optimistic insert into a `media_assets` table:
    id, file_url, file_type, mime, size_bytes, developer_id,
    project_id, status ('pending'|'processed'|'failed'),
    ai_extracted jsonb, created_by uuid, created_at
- Files go to a `media` storage bucket with RLS.
- An edge function `process-media-batch` runs Gemini 2.5 Flash via the
  Lovable AI Gateway (no API key needed) to extract: project name,
  developer, location, unit mix, price range, handover date, brochure
  text. Results merged back into `projects`.
- Role-gated to admin/owner. Show a live progress list with retry.

================================================================
MODULE 3 — BULK EMAIL AUTOMATION (prefilled, one-click)
================================================================
Two buttons on the Relationships hub:
  [ Email all developers ]   [ Email all brokerages ]

Flow:
  1. Open a modal showing the recipient list with checkboxes
     (prefilled from developers / brokerages tables — name, contact
     person, email, office). User can deselect any row.
  2. Show the email template with merge fields already filled in.
     Allow editing subject + body before sending.
  3. On send, call a single edge function `send-bulk-relationship-email`
     that loops the selected list and, for EACH recipient, invokes
     `send-transactional-email` with a unique `idempotencyKey` of
     `bulk-${campaignId}-${recipientId}`. This keeps each send 1:1 and
     transactional (not marketing) so Lovable Email accepts it.
  4. Log every send into `bulk_email_campaigns` and
     `bulk_email_recipients` with status (queued/sent/failed).

Templates (React Email, in `_shared/transactional-email-templates/`):

  developer-outreach.tsx
    Subject: "Partnership inquiry — {{developerName}}"
    Body greeting: "Dear {{contactName || 'Team'}},"
    Signature block:
      "Best regards,
       Jane — Sales Department
       JBJ Global Real Estate"

  brokerage-outreach.tsx
    Subject: "Co-broke opportunity for {{brokerageName}}"
    Body opening (PREFILLED EXACTLY):
      "Hi {{contactName || 'Team'}},

       This is Jane from the sales department, reaching out on behalf
       of Citi Developers. We'd like to introduce our latest inventory
       and discuss a co-brokerage arrangement with {{brokerageName}}."
    Include office address line if present, and a CTA button
    "Book a 15-minute call".
    Signature block:
      "Warm regards,
       Jane — Sales Department
       on behalf of Citi Developers"

All dynamic values passed via `templateData` and rendered as React props
(auto-escaped). No `dangerouslySetInnerHTML`. No unsubscribe footer in
the template — the system appends it automatically.

================================================================
INFRA CHECKLIST (do all of these)
================================================================
- Enable Lovable Cloud.
- Run `setup_email_infra` then `scaffold_transactional_email`.
- Create the `media` storage bucket with RLS (admin write, public read
  for processed assets only).
- Create `user_roles` table + `has_role` security-definer function.
- Add RLS on every table: admins full access; authenticated read on
  developers/brokerages; owner-only on bulk_email_* tables.
- Add an admin guard wrapper on `/owner/*` routes.
- Use Inter font, champagne/ink palette, gold #B89555 only as a 1px
  hairline accent (never as a fill).

When everything is wired, show me:
  1. The relationships page with seed data.
  2. The media ingestion drop zone working end-to-end.
  3. A dry-run of the bulk email modal with prefilled recipients and
     the Jane-from-sales template.
````

---

## Notes

- The recreation prompt deliberately uses **transactional email per recipient** (1:1 with idempotency keys), not a marketing blast — this is the only pattern Lovable Email accepts and it preserves deliverability.
- "Citi Developers" and "Jane / Sales Department" are baked into the brokerage template exactly as you dictated; the new agent will not need to ask.
- The website-chip fix in Part 1 is a 1-line UI change and ships independently of Part 2.
