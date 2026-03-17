

## SESSION — Developer Hub Onboarding, Access Gating & Profile Management

### Current State

**What exists:**
- `developer_representatives` table — stores rep registrations with `status` field (values: `active`, `pending_review`, etc.), role, full_name, email, phone, languages, nationality, etc.
- `SalesRepRegistration.tsx` — full registration form for Sales Rep / Admin / Channel Partner / Owner roles (in `/developer-portal`), with document uploads and terms acceptance.
- `DeveloperCompanyRegistration.tsx` — company-level registration (4-step wizard) using `developer_registrations` table.
- `DeveloperPortal.tsx` — already has profile editing logic with developer-change re-verification (sets `status = 'pending_review'`).
- Developer Hub shell, sidebar, overview — rebuilt with premium dark theme.

**What's missing:**
1. No access gating inside Developer Hub — all sidebar pages are accessible regardless of approval status.
2. No registration entry point inside the Developer Hub itself — users must go to `/developer-portal`.
3. No "Broker (request access only)" user type.
4. Missing DB columns: `city`, `country`, `job_title`, `whatsapp_number`, `marketing_materials_url`.
5. No dedicated profile management page inside Developer Hub.
6. No proof document upload fields for non-Owner roles (offer letter, employment proof, authorization letter).

### Plan — 5 Deliverables

#### 1. Database Migration — Add Missing Columns
Add to `developer_representatives`:
- `country TEXT`
- `city TEXT`
- `job_title TEXT`
- `whatsapp_number TEXT`
- `marketing_materials_url TEXT`
- `verification_type TEXT` — type of proof doc (offer_letter, employment_proof, authorization_letter, company_id)
- `verification_document_url` already exists

Also add `'broker_request'` as a valid role value (the `role` column is TEXT, not enum — no migration needed, just UI support).

#### 2. Developer Hub Registration Page (`DeveloperHubRegistration.tsx`)
New page at route `/developer-hub/register` — replaces the need to go to `/developer-portal` for registration.

**Form fields (single-page, sectioned):**
- Section 1 — Identity: Full Name, Role (dropdown: Developer Owner, Sales Representative, Developer Admin, Channel Partner, Broker — Request Access Only), Job Title, Developer Company Name (select from existing developers list)
- Section 2 — Contact: Personal Email, Company Email, Personal Mobile, Company Contact Number, Optional WhatsApp Number
- Section 3 — Location & Languages: Country, City, Languages Spoken (multi-select)
- Section 4 — Verification Documents: Upload zone for at least one of: Offer Letter, Employment Proof, Company Authorization Letter, Company ID/Employment Card. File upload to `documents` storage bucket (existing pattern from `SalesRepRegistration.tsx`).
- Section 5 — Terms & Submit

**Submission logic:**
- Inserts into `developer_representatives` with `status = 'pending_review'`
- Creates an `admin_tasks` entry for owner review
- Shows confirmation screen with "Pending Approval" state

**Styling:** Premium dark theme matching Developer Hub shell (dark cards, gold accents, cream text).

#### 3. Access Gating in Developer Hub Shell
**File: `DeveloperHubShell.tsx`**

Add a query for `developer_representatives` status. Gate logic:
- **No registration found** → Show registration prompt (redirect to `/developer-hub/register`)
- **Status = `pending_review`** → Show "Pending Approval" state with status timeline. Only allow viewing Overview (read-only) and Registration page.
- **Status = `active` / `approved`** → Full access to all sidebar pages
- **Status = `rejected`** → Show rejection notice with admin notes, allow re-registration
- **Role = `broker_request`** → Show "Access Request Received" message, no hub access until approved

**Implementation:** Wrap `<Outlet />` with a gating component that checks status and renders either the page or the appropriate gating screen.

#### 4. Profile Management Page (`DeveloperHubProfile.tsx`)
New page at route `/developer-hub/profile`.

**For approved users — editable fields:**
- Full Name
- Personal Email, Company Email
- Personal Mobile, Company Contact Number
- Languages Spoken (multi-select)
- Job Title
- Marketing Materials URL
- WhatsApp Number
- Verification documents (re-upload)

**Company change trigger:** If user changes Developer Company Name, set `status = 'pending_review'` and show warning modal: "Changing your company will require re-verification. Your access will be restricted until re-approved."

**Styling:** Premium dark cards with gold borders, matching hub theme.

#### 5. Sidebar & Route Updates
**File: `DeveloperHubSidebarNav.tsx`** — Add "My Profile" nav item (UserCircle icon) between Overview and Company Registration.

**File: `DeveloperHubRoutes.tsx`** — Add routes:
- `/developer-hub/register` → `DeveloperHubRegistration`
- `/developer-hub/profile` → `DeveloperHubProfile`

### Files Created
1. `src/pages/developer-hub/DeveloperHubRegistration.tsx` — Registration form
2. `src/pages/developer-hub/DeveloperHubProfile.tsx` — Profile management

### Files Modified
1. `src/pages/developer-hub/DeveloperHubShell.tsx` — Access gating logic
2. `src/components/developer-hub/DeveloperHubSidebarNav.tsx` — Add Profile + Register nav items
3. `src/routes/DeveloperHubRoutes.tsx` — Add new routes
4. `src/pages/developer-hub/DeveloperHubOverview.tsx` — Show rep status in identity block

### Database Migration
```sql
ALTER TABLE public.developer_representatives
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS marketing_materials_url TEXT,
  ADD COLUMN IF NOT EXISTS verification_type TEXT;
```

### Route Map
- `/developer-hub` → Overview (gated)
- `/developer-hub/register` → Registration form (always accessible)
- `/developer-hub/profile` → Profile management (approved only)
- All other hub routes → gated behind approval

### Approval Flow Summary
```text
User registers → status = 'pending_review' → admin_tasks created
  ↓
Admin approves → status = 'active' → full hub access
Admin rejects → status = 'rejected' → rejection notice shown
  ↓
User changes company → status = 'pending_review' → re-verification required
```

