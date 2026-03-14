

## Plan: Security Layer 4I — Data Loss Prevention + Safe Export Controls

### Current State

**Exists:**
- `logDocumentDownload` in `pdfWatermark.ts` — only logs to `console.log`, NOT to database
- `useCRMFieldPermissions` — role-based field masking for CRM (phone, email)
- `ReAuthModal` + `useStepUpAuth` — step-up re-authentication with 10-min elevated session
- `VIPExportButton` — exports VIP leads CSV/JSON with NO logging, NO auth gate, raw PII
- `CRMBulkActions.handleExportSelected` — exports selected leads CSV with NO logging, raw PII
- `SecurityDashboardSummary.exportToCSV` — exports security report with NO logging
- `DocumentDownloads` — watermark IDs generated but `logDocumentDownload` only does `console.log`
- `BusinessCardScanner` — exports scanned contacts CSV/Excel with NO logging
- `DataRoomExportService` — in-memory export log, never persisted to database
- `CompanyProfileDownload` — generates PDF with NO logging
- Various `navigator.clipboard.writeText` calls across AI tools (no logging)

**Gaps:**
- No `dlp_export_events` table — exports are completely untracked in the database
- No step-up auth gate on sensitive exports (CRM, VIP, security reports)
- `logDocumentDownload` is a no-op (console.log only)
- Exported CRM data includes raw PII (phone, email) — no masking applied
- No owner dashboard for viewing all export activity
- Clipboard copy of sensitive data is unmonitored

### Implementation

#### 1. Database: `dlp_export_events` Table

Centralized export audit log:
- `id`, `created_at`, `user_id`, `user_email`
- `export_type` — 'crm_leads', 'vip_leads', 'security_report', 'document_download', 'business_cards', 'company_profile', 'data_room', 'bulk_leads'
- `export_format` — 'csv', 'json', 'pdf', 'html'
- `record_count` integer
- `contains_pii` boolean
- `fields_exported` text[]
- `fields_masked` text[]
- `watermark_id` text
- `ip_address` text
- `user_agent` text
- `required_step_up` boolean — whether step-up auth was triggered
- `status` — 'completed', 'blocked', 'pending_approval'

Owner-only RLS (select). Authenticated insert.

#### 2. Utility: `src/utils/dlpExportLogger.ts`

Central function `logExportEvent(params)` that inserts into `dlp_export_events`. Used by all export points.

Also: `maskExportField(fieldName, value)` — reusable masking for exports (phone → `+971 ••• 234`, email → `ab•••@domain.com`).

#### 3. Wire Step-Up Auth to Critical Exports

Wrap these with `useStepUpAuth.requireStepUp()`:
- **VIPExportButton** — critical severity (contains VIP PII)
- **CRMBulkActions.handleExportSelected** — critical severity (bulk PII)
- **SecurityDashboardSummary.exportToCSV** — normal severity (security data)
- **BusinessCardScanner exports** — normal severity

#### 4. Apply PII Masking to Exports

For CRM and VIP exports, mask `phone_e164` and `email_lower` in the exported data unless the user has an elevated session. The masking uses the same logic from `useCRMFieldPermissions.maskValue`.

#### 5. Wire `logDocumentDownload` to Database

Replace the `console.log` in `pdfWatermark.ts` with an actual insert into `dlp_export_events`.

#### 6. Owner Export Audit Dashboard

New section in `IncidentReadinessPanel` (or as a tab):
- **Export Activity Feed** — latest 50 exports with type, user, record count, PII flag, timestamp
- **Summary cards** — total exports today, PII exports, blocked exports
- **Filter** by export type, date range, user
- Expandable row showing fields exported/masked

#### 7. Clipboard Copy Logging (Lightweight)

For sensitive modules (CRM lead detail, call review), intercept `navigator.clipboard.writeText` calls and log to `dlp_export_events` with `export_type: 'clipboard_copy'`.

### Files

| File | Action |
|------|--------|
| **Migration** | Create `dlp_export_events` table with RLS |
| **New**: `src/utils/dlpExportLogger.ts` | Central export logging + masking utility |
| **Update**: `src/utils/pdfWatermark.ts` | Wire `logDocumentDownload` to database |
| **Update**: `src/components/crm/VIPExportButton.tsx` | Add step-up auth + logging + PII masking |
| **Update**: `src/components/crm/CRMBulkActions.tsx` | Add step-up auth + logging + PII masking |
| **Update**: `src/components/admin/SecurityDashboardSummary.tsx` | Add step-up auth + logging |
| **Update**: `src/pages/BusinessCardScanner.tsx` | Add step-up auth + logging |
| **Update**: `src/components/admin/CompanyProfileDownload.tsx` | Add export logging |
| **Update**: `src/components/DocumentDownloads.tsx` | Wire to DLP logger |
| **Update**: `src/pages/owner/IncidentReadinessPanel.tsx` | Add Export Audit section |

### Implementation Order
1. Database migration (`dlp_export_events`)
2. Create `dlpExportLogger.ts` utility
3. Update `pdfWatermark.ts` to log to DB
4. Wire step-up auth + logging + masking into VIPExportButton, CRMBulkActions, SecurityDashboardSummary, BusinessCardScanner, CompanyProfileDownload, DocumentDownloads
5. Add Export Audit section to IncidentReadinessPanel

