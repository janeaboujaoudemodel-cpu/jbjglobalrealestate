

## Email Management Panel — cPanel Integration

### What We're Building

A full "Email Management" panel inside the Employees Hub that lets the admin:
1. Generate a professional email address for any employee (firstname.lastname@jbj.ae)
2. Automatically create the mailbox on your cPanel server via API
3. Send the employee their login credentials via email

### Architecture

```text
┌─────────────────────┐
│  Email Manager UI   │  (new tab in EmployeesHub)
│  - Employee list    │
│  - Generate email   │
│  - Status tracking  │
└────────┬────────────┘
         │ supabase.functions.invoke()
         ▼
┌─────────────────────┐
│  cpanel-email-mgmt  │  (new edge function)
│  - create account   │
│  - list accounts    │
│  - change password  │
│  - delete account   │
└────────┬────────────┘
         │ cPanel UAPI (HTTPS)
         ▼
┌─────────────────────┐
│  cPanel Server      │
│  jbj.ae mailboxes   │
└─────────────────────┘
```

### Database

**New table: `employee_emails`**
- `id` UUID PK
- `user_id` UUID (references auth.users, nullable — not all employees have app accounts)
- `employee_name` TEXT NOT NULL
- `email_address` TEXT NOT NULL UNIQUE
- `department` TEXT
- `quota_mb` INTEGER DEFAULT 1024
- `status` TEXT DEFAULT 'active' (active, suspended, deleted)
- `created_by` UUID (the admin who created it)
- `created_at`, `updated_at` TIMESTAMPTZ
- RLS: only owner_admin/founder roles can read/write

### Secrets Required

Before building, we need two cPanel credentials stored securely:
- **CPANEL_URL** — your cPanel server URL (e.g., `https://mail.jbj.ae:2083`)
- **CPANEL_USERNAME** — cPanel account username
- **CPANEL_API_TOKEN** — cPanel API token (generated from cPanel → Manage API Tokens)

### Edge Function: `cpanel-email-mgmt`

Actions supported:
- **`create`** — Creates mailbox via cPanel UAPI `Email::add_pop`, stores record in `employee_emails`, sends credentials email to admin
- **`list`** — Lists all email accounts from cPanel + local DB
- **`change_password`** — Updates password via `Email::passwd_pop`
- **`suspend`** / **`delete`** — Suspends or removes the account
- **`check`** — Checks if an email already exists

cPanel UAPI call pattern:
```
GET https://{host}:2083/execute/Email/add_pop?email=firstname.lastname&password=xxx&quota=1024&domain=jbj.ae
Authorization: cpanel {username}:{api_token}
```

### Frontend: Email Manager Component

New component `EmailManagement.tsx` added as a tab in EmployeesHub:
- Table of all employee emails with status badges
- "Generate Email" button per employee — auto-suggests `firstname.lastname@jbj.ae`
- Admin can customize the email prefix before confirming
- Password auto-generated (16 chars, strong) with copy button
- After creation: shows credentials card with email, password, IMAP/SMTP settings
- Bulk generate option for multiple employees at once

### IMAP/SMTP Settings Card

After email creation, display a credentials card:
- **Email**: firstname.lastname@jbj.ae
- **Password**: (generated, copyable)
- **IMAP**: mail.jbj.ae:993 (SSL)
- **SMTP**: mail.jbj.ae:465 (SSL)
- Option to send these details to the employee via their personal email

### Files to Create/Modify

1. **New migration** — `employee_emails` table with RLS policies
2. **New edge function** — `supabase/functions/cpanel-email-mgmt/index.ts`
3. **New component** — `src/components/crm/EmailManagement.tsx`
4. **Modify** — `src/components/crm/EmployeesHub.tsx` (add "Email Accounts" tab)
5. **Secrets** — CPANEL_URL, CPANEL_USERNAME, CPANEL_API_TOKEN

### Implementation Order

1. Request and store the 3 cPanel secrets
2. Create `employee_emails` table with RLS
3. Build the `cpanel-email-mgmt` edge function
4. Build the `EmailManagement` UI component
5. Integrate as a new tab in EmployeesHub

