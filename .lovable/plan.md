# Business Card Scanner — Repair + CRM Integration

## Strategy
Reuse 100% of existing infrastructure. **No new tables**, **no new OCR provider**, **no duplicate CRM**. The scanner becomes a thin ingestion surface that writes into the existing `crm_leads` table (master DB) and links to `crm_brokerages` / `crm_developer_registry` when applicable.

## Scope of changes

### 1. Edge function (`supabase/functions/business-card-ocr`)
Extend the Gemini prompt + response shape to emit the missing fields the spec requires:
- `mobile`, `whatsapp`, `landline` (separated, not one `phone` blob)
- `linkedin`, `instagram`, `website`
- `address`, `city`, `country`
- `company_name`, `agency_name`, `developer_name` (one of)
- `event_source`, `notes`, `raw_text`
Keep model = `google/gemini-2.5-flash` (cheap, fast, already free via Lovable AI Gateway). No extra secrets needed.

### 2. New edge function `crm-save-scanned-card`
Single endpoint that:
- Verifies JWT + admin/owner role (mirrors `requireOwnerAuth` pattern used elsewhere).
- Runs **CRM-wide duplicate check** against `crm_leads` using: `email_lower`, `phone_normalized` / `phone_e164` (digits only), and `(full_name + company_name)` fuzzy match.
- Returns `{ status: "duplicate" | "new", existing?: lead }` so the UI can show Merge / Update / Add New / Add Note.
- On confirm action: `insert` (new) | `update` (merge fields, never overwrite non-empty with empty) | `append-note` into `crm_leads`. Sets `source = 'business_card_scan'`, `lead_source_type = 'scan'`, persists `raw_import = { ocr_payload, card_image_url }`.
- If `agency_name` present → upsert into `crm_brokerages` and link via `company_name`. If `developer_name` → upsert into `crm_developer_registry`. (Reuse existing tables only.)

### 3. Storage
Add `business-card-scans` private bucket (RLS: owner-only) to persist the original card image alongside the lead for audit/verification. Lead row stores the storage path inside `raw_import`.

### 4. UI — `src/pages/BusinessCardScanner.tsx` + `BusinessCardResults.tsx`
Per-card review row gains:
- **Contact type** dropdown → maps to `crm_contact_type` (Broker, Brokerage Agency, Developer, Investor, Client, Partner, Media, Supplier, Other).
- **Labels multi-select** (VIP, Hot Lead, Follow Up, Event Contact, Broker, Investor, Developer, Potential Partner, Needs Verification, Urgent) → `crm_leads.tags[]`. VIP also flips `vip = true`.
- New separated fields: WhatsApp, Landline, LinkedIn, Instagram, Event Source.
- **Save to CRM** button per card + **Save All** bulk. Calls `crm-save-scanned-card`. Shows duplicate dialog (Merge / Update / Add New / Add Note / Cancel) when needed.
- "Needs Review" badge on any field the AI flagged low-confidence or left empty among critical fields.
- Existing CSV/Excel export and encryption stay as-is (secondary).

### 5. Shortcuts (visibility only for admin/owner)
Add a "Business Card Scanner" entry, gated by the same role check used elsewhere, in:
- Owner sidebar (next to Relationship Hub).
- CRM Relationships page header.
- Leads & Clients page header.
- Marketing Hub page header.
- Mobile admin nav (`MobileBottomNav` / equivalent).
Single shared component `<ScanCardShortcut />` to avoid drift.

### 6. Campaign reachability
No code change required — once leads land in `crm_leads` with `tags[]` and `contact_type`, the existing CRM filters (`CRMRelationships`, `BulkSendDialog`, Marketing Hub audience builder) already segment by tag/type/city/country/source. We will verify the filters surface the new `source = 'business_card_scan'` and the new tag values.

## Out of scope (explicitly not doing)
- New CRM tables / new contact store.
- Separate OCR provider (Google Vision, Tesseract). Lovable AI Gateway already handles it for free.
- Rebuild of camera/upload UI — current components stay.

## Test plan (manual, end-to-end)
1. Mobile camera scan → review → classify Broker + tag VIP → Save → appears in `crm_leads` with tags + contact_type.
2. Same card re-scanned → duplicate dialog → Merge → fields enriched, no duplicate row.
3. Desktop bulk upload of 5 cards → Save All → 5 leads created, agency cards also create/link `crm_brokerages` row.
4. Filter CRM Relationships by tag `Hot Lead` and source `business_card_scan` → scanned contact appears.
5. Marketing Hub → audience "Brokers in Dubai" → scanned broker is reachable; send test email.
6. Export CSV from scanner still works.
7. Non-admin user cannot see shortcuts and cannot call `crm-save-scanned-card` (403).

## Files touched (estimate)
- `supabase/functions/business-card-ocr/index.ts` — extend prompt + payload.
- `supabase/functions/crm-save-scanned-card/index.ts` — **new**.
- `supabase/migrations/<ts>_business_card_scans_bucket.sql` — bucket + RLS.
- `src/pages/BusinessCardScanner.tsx` — wire Save to CRM, duplicate dialog.
- `src/components/business-card/BusinessCardResults.tsx` — type dropdown, labels, new fields, save buttons.
- `src/components/business-card/ScanCardShortcut.tsx` — **new** shared shortcut.
- Sidebar / `CRMRelationships.tsx` / Leads / Marketing Hub / mobile nav — add `<ScanCardShortcut />`.
