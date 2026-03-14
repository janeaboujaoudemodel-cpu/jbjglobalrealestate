

## Session 17 — Email Hub Infrastructure + Company / Personal API Key Workflow

### Current State Audit

| Component | Status | Evidence |
|-----------|--------|----------|
| `send-owner-email` edge function | CODE EXISTS but **NOT in config.toml** | Searched all 569 lines of config.toml — no `[functions.send-owner-email]` entry. This means the function may fail JWT validation on deploy. |
| Company email (RESEND_API_KEY) | SECRET EXISTS | `fetch_secrets` confirms `RESEND_API_KEY` is present |
| Personal email (RESEND_PERSONAL_API_KEY) | SECRET DOES NOT EXIST | Not in secrets list — edge function reads it but it's never been set |
| `save_personal_key` action in edge function | NOT IMPLEMENTED | `EmailSettingsPanel.tsx:28` calls `send-owner-email` with `action: "save_personal_key"`, but the edge function has NO handler for this action — it only handles email sending |
| Personal key connection state persistence | NOT IMPLEMENTED | `personalKeyConnected` is local React state — resets to `false` on every page load |
| Email status tracking table | DOES NOT EXIST | No `email_connection_status` or similar table in database |
| Email Hub Status Panel | DOES NOT EXIST | No status overview component exists |
| `owner_comm_threads` / `owner_comm_messages` | EXISTS | Used by send-owner-email to log sent emails |

### Root Problems

1. **Config.toml missing entry** — `send-owner-email` is not registered, meaning it may not deploy properly.
2. **Personal key save is broken** — The UI sends `action: "save_personal_key"` but the edge function ignores it and tries to parse it as a normal email send (crashes on missing `to`/`subject`).
3. **No state persistence** — Whether a personal key was saved is never stored anywhere. Every page reload shows "Normal Mode."
4. **No status dashboard** — Owner has no visibility into what's active, pending, or broken.

---

### Implementation Plan

#### Step 1: Add `send-owner-email` to config.toml
Add `[functions.send-owner-email]` with `verify_jwt = false` (auth is handled in-function).

#### Step 2: Update `send-owner-email` Edge Function
Add action routing at the top of the handler:

- **`action: "save_personal_key"`** — Stores the personal Resend API key as `RESEND_PERSONAL_API_KEY` secret via Vault. Validates the key by making a test API call to `https://api.resend.com/api-keys` (GET). Returns `{ success, valid, key_status }`.
- **`action: "check_personal_key"`** — Checks if `RESEND_PERSONAL_API_KEY` env var exists and is non-empty. Returns `{ exists: boolean, status: "active"|"missing" }`.
- **`action: "check_company_key"`** — Checks if `RESEND_API_KEY` env var exists. Returns `{ exists: boolean, domain: "jbj.ae" }`.
- **Default (no action)** — Current email sending logic (unchanged).

For key storage: Use Supabase Vault (`vault.create_secret`) via the service-role client so the key is available as an env var on next invocation. Alternatively store in an `app_settings` row and read it at runtime from the database.

**Practical approach**: Since we can't dynamically add env vars, store the personal key in an `app_settings` row (key: `resend_personal_api_key`, value: encrypted). The edge function reads it from the database at send time instead of `Deno.env.get`.

#### Step 3: Database — Add email settings row
Insert a row into `app_settings` (if table exists) or create a simple `email_hub_settings` table:

```sql
CREATE TABLE IF NOT EXISTS public.email_hub_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text,
  is_active boolean DEFAULT false,
  last_verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_hub_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner read" ON public.email_hub_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service insert/update" ON public.email_hub_settings
  FOR ALL USING (true) WITH CHECK (true);
```

Seed rows:
- `company_resend_key` → `is_active: true`, `last_verified_at: now()`
- `personal_resend_key` → `is_active: false`, `setting_value: null`
- `company_outbound` → `is_active: true`
- `personal_outbound` → `is_active: false`

#### Step 4: Update `EmailSettingsPanel.tsx`
- On mount: call `send-owner-email` with `action: "check_personal_key"` to get current state
- Persist `personalKeyConnected` from backend response
- Add "Update Key" and "Remove Key" buttons when key is connected
- Show key status badges: Active (green), Missing (amber), Invalid (red)
- Add last-verified timestamp display

#### Step 5: Create `EmailHubStatusPanel.tsx`
New component showing:
- **Company Email** card: domain (jbj.ae), API key status, outbound status, last sent timestamp (from `owner_comm_messages`)
- **Personal Email** card: API key status, outbound status, fallback mode indicator
- **Infrastructure Health** row: edge function status, inbound webhook status
- **Pending Setup** checklist: items that need attention
- Query `owner_comm_messages` for last sent email metadata to show "Last successful send"

#### Step 6: Wire Status Panel into EmailClient
Add a tab or button in `EmailClient.tsx` header (next to existing "Email Settings & API Keys") that opens the status panel. Also add the status panel as a collapsible section at the top of the settings dialog.

#### Step 7: Edge Function — Personal Key Storage & Retrieval
Update `send-owner-email` to:
1. On `save_personal_key`: validate key format → test with Resend API → store in `email_hub_settings` → return status
2. On send with personal account: read key from `email_hub_settings` (not env var) → use for Resend API call
3. On send with company account: continue using `RESEND_API_KEY` env var (unchanged)

This means **no redeployment needed** when the personal key is added later — the edge function reads it from the database at runtime.

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/config.toml` | Add `[functions.send-owner-email]` entry |
| `supabase/functions/send-owner-email/index.ts` | Add action routing, personal key CRUD, runtime key lookup from DB |
| `src/components/email/EmailSettingsPanel.tsx` | Load state from backend on mount, add update/remove key, show real statuses |
| `src/components/email/EmailHubStatusPanel.tsx` | NEW — status dashboard component |
| `src/pages/EmailClient.tsx` | Wire in status panel |
| Database migration | Create `email_hub_settings` table with RLS |

### What Happens When Owner Pastes Personal API Key Later

1. Owner opens Email Client → Settings
2. Pastes `re_xxxxx` key → clicks Submit
3. Frontend calls `send-owner-email` with `action: "save_personal_key"`
4. Edge function validates format → tests key against Resend API → stores in `email_hub_settings` table → returns `{ valid: true, status: "active" }`
5. UI updates to show "API Connected" badge
6. Next email sent from personal account reads key from `email_hub_settings` at runtime
7. **No redeployment needed** — the key is stored in DB, not as an env var

### What Will NOT Be Implemented (Transparency)

- **Inbound email sync from Gmail/Hostinger**: This requires OAuth or IMAP integration which is out of scope for this session. The status panel will show "Inbound: Not configured" clearly.
- **Real-time email receive**: The current system is outbound-only. Inbound is handled by `resend-inbound-email-webhook` for the company domain.

