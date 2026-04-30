# Developer Documents & Auto-Sign Hub

## What you're getting

Five linked pieces, all gated behind OwnerGuard:

1. **Inbox sync** — Pull every email arriving at `infoo.jane@gmail.com` (which receives the `contact@jbj.ae` forwarder) into Owner Inbox, classify it as "developer-request", and surface a **Required Actions** rail.
2. **Smart auto-reply** — When a developer asks for registration, license, MOU, etc., AI matches the request to your shared documents library and replies with the link plus a personalized message — one click to send, or auto-send with a confidence threshold.
3. **VAT Certificate template** — One-tap generator that builds a JBJ-branded VAT certificate (header + footer + your details), reserves placeholders for stamp + signature, and outputs PDF/PNG. Reusable for any document you want to issue.
4. **Adopt Signature Studio** — Sign + Stamp once, click "Adopt", and the system fills every signature/initial/stamp field on the document, saves date, and re-uploads. Works on contracts the developer sends you.
5. **Contract Vault** — Every signed contract lands here, filterable by emirate, area, developer name, status, and date.

## Architecture

```text
Gmail (infoo.jane@gmail.com ⇐ contact@jbj.ae forwarder)
           │
           ▼
[edge fn: gmail-inbox-sync] ──► owner_comm_threads / owner_comm_messages
           │                       │
           ▼                       ▼
[edge fn: classify-developer-request]      Inbox UI (existing)
           │                                 │
           ▼                                 ▼
   developer_action_items ─────► Required Actions rail
                                   │
                                   ├─► "Send documents library link" → reply via Gmail API
                                   ├─► "Generate VAT certificate" → /owner/templates/vat
                                   └─► "Sign contract" → /owner/sign/:id (Adopt flow)
                                                          │
                                                          ▼
                                                 esign_envelopes
                                                  + signed_documents
                                                          │
                                                          ▼
                                                  Contract Vault UI
```

## Step-by-step plan

### 1. Database (migration)
- `developer_action_items` — one row per detected request. Columns: `id`, `user_id`, `thread_id` (FK `owner_comm_threads`), `developer_id` (FK `crm_developer_registry`, nullable), `request_type` ENUM (`docs_library`, `vat_certificate`, `mou`, `license`, `registration`, `contract_signature`, `other`), `status` (`pending`, `auto_replied`, `awaiting_owner`, `done`, `dismissed`), `extracted_summary` (text), `suggested_reply` (text), `confidence` (numeric), `metadata` (jsonb), timestamps. RLS: `user_id = auth.uid()`.
- `owner_signature_assets` — stores adopted signature/stamp PNGs as base64 or storage paths. Columns: `id`, `user_id`, `kind` ENUM (`signature`, `initial`, `stamp`), `image_url`, `is_default`, `created_at`. RLS: owner-only.
- `signed_contracts_index` — denormalized view backed by `esign_signed_documents` + envelope metadata for fast filter (developer_name, emirate, area, signed_at). Materialized via DB view, no extra writes.
- `document_library_links` — owner-curated registry of canonical documents (label, url, applicable request_types[]). Seeded with the JBJ documents library URL you previously shared. RLS: owner-only.

### 2. Edge functions
- `gmail-inbox-sync` (POST, scheduled every 2 min via pg_cron) — reads `infoo.jane@gmail.com` via `google_mail` connector, upserts threads/messages into `owner_comm_*`. Uses `historyId` checkpoint stored in `owner_comm_settings`.
- `classify-developer-request` (called per new inbound message) — Lovable AI (`google/gemini-2.5-flash`) extracts `request_type`, suggested reply text, confidence. Inserts into `developer_action_items`.
- `send-developer-reply` (POST) — Owner-only. Sends a Gmail reply via the connector, optionally with attached document library link, and marks the action item resolved.
- `generate-vat-certificate` (POST) — Renders branded HTML→PDF (jsPDF), returns base64 + uploads to `signed-contracts` storage bucket. Reserves stamp/signature anchors.
- `apply-adopt-signature` (POST) — Takes envelope id + adopted signature/stamp asset ids. Walks `esign_fields`, fills each one with the saved PNG + today's date, regenerates the signed PDF, marks envelope `signed`, writes to `esign_signed_documents`.

All auth-gated with `requireOwnerAuth`.

### 3. Storage buckets
- `signed-contracts` (private, owner-only RLS).
- `owner-signature-assets` (private, owner-only RLS).
- `template-outputs` (private, owner-only RLS).

### 4. UI — wired into existing routes
- **`/owner/inbox`** — new **Required Actions** rail (right side) listing `developer_action_items`. Each row: developer name, request type, "Send link", "Open VAT", "Sign contract", "Dismiss".
- **`/owner/templates/vat`** — VAT certificate composer (champagne-themed, ink text, gold tabs). Live preview, "Generate PDF", "Send to developer".
- **`/owner/sign/:envelopeId`** — Adopt Signature Studio. Tabs: *Signature*, *Initials*, *Stamp*. Each pad supports draw, type, or upload. "Save & Adopt" persists to `owner_signature_assets`. Click "Adopt to all fields" to fill every placeholder; one-click "Sign & Send".
- **`/owner/contracts`** — Contract Vault. Table with filters: developer, emirate, area, status, date range. Row actions: download, view audit log, re-send.

All four reuse existing primitives: `<IconTile />`, gold-active tabs, champagne surfaces, `--price-orange` for amounts, AdaptiveHairline.

### 5. AI rules for auto-reply
- High confidence (≥ 0.85) + request_type ∈ {docs_library, registration, license, MOU} → auto-send pre-canned reply with the documents library link, mark `auto_replied`, log under thread.
- Lower confidence or `vat_certificate`/`contract_signature` → leave pending in Required Actions for owner one-click resolution.
- Owner can flip the per-type "auto-send" toggle in `/owner/comm-settings`.

## Files to create / edit

**New**
- `supabase/migrations/<timestamp>_developer_documents_hub.sql`
- `supabase/functions/gmail-inbox-sync/index.ts`
- `supabase/functions/classify-developer-request/index.ts`
- `supabase/functions/send-developer-reply/index.ts`
- `supabase/functions/generate-vat-certificate/index.ts`
- `supabase/functions/apply-adopt-signature/index.ts`
- `src/pages/owner/DeveloperActionsRail.tsx` (rail component)
- `src/pages/owner/templates/VatCertificate.tsx`
- `src/pages/owner/sign/AdoptSignatureStudio.tsx`
- `src/pages/owner/contracts/ContractVault.tsx`
- `src/hooks/useDeveloperActionItems.ts`
- `src/hooks/useOwnerSignatureAssets.ts`

**Edit**
- `src/pages/OwnerInbox.tsx` — mount `<DeveloperActionsRail />`
- `src/routes/OwnerRoutes.tsx` — register the three new routes
- `src/components/owner-dashboard/OwnerSidebarNav.tsx` — add "Contracts" + "Templates" links

## What I need from you, briefly
- The shared documents library URL (Drive folder, Notion, etc.) so I can seed `document_library_links` — paste it after approval if I don't already have it. If not provided, I'll create the row with a placeholder you can edit in the UI.
- Confirm `signed-contracts` storage bucket name is fine (or pick a different one).

## Out of scope (this round)
- Full Gmail label management (only INBOX is read).
- Multi-user signature adoption (only the owner's signature/stamp).
- Bulk historical email backfill beyond the last 30 days.
