

## Plan: Dedicated Broker Portal + Full Academy Upgrade + Career Portal Open Positions

This is a large, multi-phase implementation. The request covers **5 major areas**: a unified Broker Portal, a fully upgraded JBJ Academy with 15+ education modules and quizzes, an admin broker management panel, a graduates verification gallery, and a career portal with dynamic open positions.

---

### Phase 1: Database Schema — New Columns & Tables

**Migration SQL:**

1. **`broker_profiles` — add admin-controllable fields:**
   - `custom_title` text
   - `custom_label` text  
   - `performance_rating` text (e.g., 'elite', 'top_performer', 'rising_star')
   - `show_contact_public` boolean DEFAULT false (toggle per broker)
   - `show_last_name_public` boolean DEFAULT false
   - `probation_months` integer DEFAULT 3
   - `probation_end` timestamptz
   - `probation_skipped` boolean DEFAULT false
   - `current_tier` text DEFAULT 'Starter'
   - `verification_status` text DEFAULT 'unverified'
   - `rera_card_url` text
   - `id_document_url` text
   - `rera_expiry_date` date
   - `id_expiry_date` date
   - `face_verification_status` text DEFAULT 'pending'
   - `total_points` integer DEFAULT 0

2. **`open_positions` table** (new) — for career portal integration:
   - id, title, department, description, requirements (jsonb), employment_type (text, e.g. 'commission_basis'), is_active boolean, is_broker_role boolean, created_at, created_by
   - RLS: public read for active positions, owner/admin write

3. **Seed 15+ education modules** into `broker_education_modules` with full content for all 9 books (objection handling, closing techniques, market knowledge, CRM usage, cold calling, follow-up, lead management, marketing yourself, different call types, RERA knowledge, etc.)

4. **`broker_education_tests`** — questions per module (if not already seeded, seed ~5 questions per module for all 15+ modules)

---

### Phase 2: Dedicated Broker Portal Page (`/broker-portal`)

**New file:** `src/pages/BrokerPortal.tsx`

A unified hub that consolidates all broker tools into a single premium portal. Structure:

- **Hero** — Premium champagne-gold header with graduation cap icon, "JBJ Broker Portal"
- **Broker Profile Card** (reuse from JBJAcademy) — shows first name, photo, tier badge, verification status, probation period, loyalty points, document expiry alerts
- **Quick Access Grid** — Cards linking to:
  - Listing Portal, CRM, Admin Support/AI Assistant, Objection Handler, Guides & Books Library, Broker Dashboard, Loyalty & Points, Education Hub (JBJ Academy)
- **Document Upload Section** — ID and RERA card upload with expiry date picker, face verification prompt
- **My Certificates** — List of earned certificates with QR codes
- **Training Progress** — Summary of completed modules across all books

Route: Add to `PublicRoutes.tsx` as `/broker-portal`

---

### Phase 3: Upgrade JBJ Academy Content

**Expand education books** — Ensure all 9 books have comprehensive modules. Seed additional modules via migration:

| Book | Additional Modules to Seed |
|------|---------------------------|
| Book 1: UAE Real Estate Framework | RERA test prep questions, DLD processes |
| Book 2: Ethics & Conduct | Anti-fraud, client confidentiality |
| Book 3: Sales Mastery | Objection handling, closing techniques, cold calling |
| Book 4: Client Advisory (Buyer) | Buyer psychology, showing properties |
| Book 5: Client Advisory (Seller/Landlord) | Pricing strategy, marketing listings |
| Book 6: Market Intelligence | Comparable analysis, area expertise |
| Book 7: CRM & Lead Management | Pipeline management, follow-up cadence |
| Book 8: Marketing & Personal Brand | Social media, self-marketing, lead generation |
| Book 9: Advanced (Restricted) | Negotiation mastery, luxury segment |

Each module includes quiz questions (already have `ModuleTest` component + `useModuleTests` hook). Seed test questions per module.

**Certificate generation** — Already exists via `hr_certificates` table + `CertificationSection`. Enhance to auto-apply owner's stamp/signature from session storage (existing stamp generator integration).

---

### Phase 4: Admin Broker Management Panel

**Upgrade:** `src/pages/JBJBrokerAdmin.tsx`

Add new tabs/sections:

1. **Broker Directory Table** — Each broker row shows: name, photo, tier, status, probation remaining, verification status. Actions per broker:
   - Toggle `show_contact_public` (show/hide contact details on website)
   - Edit title/label/status/performance rating
   - Skip probation (set `probation_skipped = true`, clear `probation_end`)
   - Promote to Elite/Verified
   - View certificates

2. **Document Verification Queue** — List of brokers with pending ID/RERA uploads. Admin can approve/reject. System checks name matching.

3. **Probation Management** — Set probation months (3 or 6), skip probation for individual brokers

---

### Phase 5: Verification Expiry Logic

**Edge function or cron-triggered logic:**
- Check `broker_profiles` where `rera_expiry_date < now()` or `id_expiry_date < now()`
- Set `verification_status = 'expired'` 
- After 24 hours of expiry, set `verification_status = 'unverified'`
- Create alert/notification for the broker to re-upload

This can be a database function triggered by cron or checked on login.

---

### Phase 6: Graduates Gallery Enhancement

**Existing:** `src/pages/AcademyGraduates.tsx` — already shows certificates, search, lookup.

Enhancements:
- Show only first name + photo (already doing `cert.full_name.split(" ")[0]`)
- Add QR code generation per certificate (use existing `qrcode-generator` package)
- QR links to `/verify-certificate/:token` which already exists
- Certificate detail shows: active/revoked status, certificate number, track, score, issue date

---

### Phase 7: Career Portal — Dynamic Open Positions

**Modify:** `src/pages/JoinApplication.tsx`

1. Fetch `open_positions` from database where `is_active = true`
2. Display as cards above the application form — each position shows title, department, employment type
3. For broker positions: highlight "Partnership Opportunity — Commission Basis, No Salary" with premium messaging about promotions
4. User selects position when applying → stored in application record
5. Email confirmation mentions the specific position applied for
6. Backend shows which position was applied for + CV matching accuracy

**Seed positions:** Insert 20+ open positions covering all departments (IT, Marketing, Admin, HR, Web Dev, Sales, Brokers, etc.)

**Notification:** For users who registered as brokers, show notification about open broker positions.

**HR Hub integration:** Add quick-add form for new positions in `/hr-dashboard`

---

### Files Created/Modified

| File | Action |
|------|--------|
| DB migration | New columns on `broker_profiles`, `open_positions` table, seed modules + test questions + positions |
| `src/pages/BrokerPortal.tsx` | **New** — Unified broker portal |
| `src/routes/PublicRoutes.tsx` | Add `/broker-portal` route |
| `src/pages/JBJAcademy.tsx` | Minor — link to broker portal |
| `src/pages/JBJBrokerAdmin.tsx` | Add broker management tabs (toggle contacts, edit title/tier, skip probation) |
| `src/pages/JoinApplication.tsx` | Fetch & display `open_positions`, position selector |
| `src/pages/AcademyGraduates.tsx` | Add QR code per certificate |
| `src/pages/VerifyCertificate.tsx` | Ensure certificate detail shows expiry/active status |
| `src/components/broker-education/BookDetailModal.tsx` | Ensure module tests work for all seeded modules |
| `src/pages/HRDashboard.tsx` | Add quick-add for open positions |

---

### Important Notes

- This is a very large scope. Implementation will be broken into multiple messages to stay within quality bounds.
- All UI follows the Champagne Gold design system per locked memory.
- Broker portal shows only first name + photo publicly; last name/email/phone hidden unless admin toggles `show_contact_public`.
- Certificate stamp/signature integration uses session storage from the existing Stamp Generator workflow.

