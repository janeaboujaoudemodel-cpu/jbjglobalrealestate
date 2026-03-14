

## Plan: Lead Encryption + Document Encryption + Key Management

### Current State Assessment

**What already exists:**
- HR employee data encryption via `hr_employees_secure` view (encrypted PII columns)
- Business card client-side AES-256-GCM encryption (`businessCardEncryption.ts`)
- `download-file` edge function with auth-gated private storage access
- Field-level masking via `useCRMFieldPermissions` hook (from Session 9)
- Several storage buckets are already private: `esign-documents`, `hr-documents`, `hr-secure-documents`, `consent-documents`, `portal-documents`, `seller-documents`, `support-attachments`, `video-processing-temp`
- RLS on `crm_leads` restricting access by role/assignment
- Secrets managed server-side (17 runtime secrets, none exposed in frontend bundle)
- `VITE_OWNER_EMAIL` is in `.env` but NOT imported by any frontend code (safe)
- Transport security: all Supabase endpoints are HTTPS by default

**Gaps to fill:**
1. CRM lead sensitive fields (`phone_e164`, `email_lower`, `notes`, `ai_score`) stored as plaintext in database
2. Several sensitive storage buckets are **public** and shouldn't be: `broker-documents`, `documents`, `listing-documents`, `project-documents`
3. No server-side encryption/decryption edge function for CRM data
4. No key rotation tracking or encryption audit visibility
5. No owner-facing encryption status dashboard

### Architecture: Server-Side Encryption via Edge Function + Supabase Vault

The approach uses a **server-side encryption edge function** that handles encrypt/decrypt operations using AES-256-GCM. The encryption key is stored as a Supabase secret (`CRM_ENCRYPTION_KEY`), never exposed to the frontend. The frontend receives only decrypted data after passing RLS + role checks.

### Database Migration

**1. Add encrypted columns to `crm_leads`:**
```sql
ALTER TABLE crm_leads ADD COLUMN phone_encrypted text;
ALTER TABLE crm_leads ADD COLUMN email_encrypted text;
ALTER TABLE crm_leads ADD COLUMN notes_encrypted text;
```
These columns store AES-256-GCM ciphertext. Original plaintext columns remain temporarily for migration, then get nulled out after data migration.

**2. Create `encryption_audit_log` table:**
```
id (uuid PK), user_id (uuid), action (text: encrypt/decrypt/key_rotate/access_denied),
data_class (text: crm_lead/document/hr), record_id (text),
created_at (timestamptz)
```
RLS: Owner-only SELECT, service-role INSERT.

**3. Create `encryption_status` table** — Tracks what's encrypted:
```
id (uuid PK), data_class (text), table_name (text), field_name (text),
encryption_algorithm (text), is_encrypted (bool), last_key_rotation (timestamptz),
storage_bucket (text), bucket_is_private (bool), notes (text),
updated_at (timestamptz)
```
Pre-seeded with current encryption status for all sensitive data classes.

**4. Make sensitive storage buckets private:**
```sql
UPDATE storage.buckets SET public = false WHERE id IN (
  'broker-documents', 'documents', 'listing-documents', 'project-documents'
);
```

### Edge Function: `crm-data-encrypt`

New edge function handling server-side encrypt/decrypt:
- **POST `/encrypt`**: Accepts plaintext fields, returns encrypted values. Called during lead create/update.
- **POST `/decrypt`**: Accepts encrypted fields, returns plaintext. Called only after RLS + role verification.
- **POST `/migrate`**: One-time bulk encryption of existing plaintext data.
- Uses `CRM_ENCRYPTION_KEY` from Deno.env (Supabase secret).
- Logs every decrypt operation to `encryption_audit_log`.
- JWT auth required; owner/admin roles for decrypt.

### Frontend Integration

**Update: `src/hooks/useCRMFieldPermissions.ts`**
- When a field is encrypted, call the decrypt edge function instead of reading plaintext.
- Cache decrypted values in-memory only (never localStorage).

**New: `src/pages/owner/EncryptionAuditDashboard.tsx`** (Task 7)
Owner-only dashboard showing:
- Data class encryption status table (CRM leads, HR employees, documents, storage)
- Storage bucket privacy status (public vs private)
- Key rotation status and last rotation date
- Recent decrypt access log (who decrypted what, when)
- Secret exposure audit summary (hardcoded checks for known patterns)
- Risk assessment badges (green/amber/red per data class)

### Secret Management Hardening (Task 5)

**Audit findings — current state is good:**
- No secrets in frontend bundles (verified: no `VITE_` secret imports besides URL/key/project-id)
- `VITE_OWNER_EMAIL` in `.env` but unused in frontend code — will remove from `.env` (it exists as runtime secret `OWNER_EMAIL` already)
- No secrets logged to console (verified)
- No secrets in localStorage (only UI preferences stored)
- API keys only in edge function runtime secrets

**Action:** Remove `VITE_OWNER_EMAIL` from `.env` file since it's a secret that shouldn't be in the client bundle even if unused.

### Files Summary

| File | Change |
|------|--------|
| **Migration** | Add encrypted columns to `crm_leads`, create `encryption_audit_log` + `encryption_status`, make 4 buckets private, seed encryption status data |
| **New**: `supabase/functions/crm-data-encrypt/index.ts` | Server-side AES-256-GCM encrypt/decrypt edge function |
| **New**: `src/pages/owner/EncryptionAuditDashboard.tsx` | Encryption status + audit dashboard |
| **Update**: `src/routes/OwnerRoutes.tsx` | Add `/owner/encryption-audit` route |
| **Update**: `.env` | Remove `VITE_OWNER_EMAIL` |

### Implementation Order
1. Add `CRM_ENCRYPTION_KEY` secret (request from user)
2. Database migration (encrypted columns, audit tables, bucket privacy, seed data)
3. `crm-data-encrypt` edge function
4. `EncryptionAuditDashboard` page
5. Route registration
6. Remove `VITE_OWNER_EMAIL` from `.env`

### What This Does NOT Cover (Transparency)
- **Postgres TDE (Transparent Data Encryption)**: Not available in managed Supabase — encryption at rest is handled by Supabase's infrastructure (AES-256 disk encryption on all managed instances by default).
- **Client-to-server transport**: Already HTTPS everywhere via Supabase infrastructure.
- **Existing HR encryption**: Already implemented via `hr_employees_secure` view — no changes needed.

