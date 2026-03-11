
## Plan: JBJ Academy Portal, Broker Verification System, Career Portal Upgrade & HR Open Positions

This is a very large scope. I'll break it into 5 phases, each deliverable independently. All work builds on existing systems — no duplication.

---

### Phase 1: JBJ Academy Portal Page (`/jbj-academy`)

**What:** A dedicated hub page that consolidates all broker tools, education, and services into one premium portal.

**New file:** `src/pages/JBJAcademy.tsx`

The page will include:
- Premium hero with graduation hat icon and video background
- **Broker Profile Card** — shows the broker's first name, photo, current tier (Probation / Verified / Elite), probation period remaining, loyalty points, title
- **Navigation Grid** linking to existing pages:
  - Broker Education (`/broker-education`)
  - Listing Portal (`/listing-portal`)
  - CRM (`/crm`)
  - AI Assistant (`/ai-hub`)
  - Objection Handler (`/ai-objection-handler`)
  - Dashboard (`/broker-dashboard`)
  - Guides & Books (`/guides`)
  - Broker Resources (`/broker-resources`)
  - Market Intelligence (`/market-intelligence`)
- **Certification Status** — reuses `CertificationSection` component
- **Graduated Brokers Gallery** — queries `hr_certificates` to display certified brokers with certificate numbers + QR codes linking to `/verify-certificate/:token`

**Route:** Add to `PublicRoutes.tsx` at `/jbj-academy`

---

### Phase 2: Broker Verification & Admin Controls

**Database Migration:**
```sql
ALTER TABLE broker_profiles ADD COLUMN IF NOT EXISTS 
  rera_card_url text,
  id_document_url text,
  rera_expiry_date date,
  id_expiry_date date,
  verification_status text DEFAULT 'unverified',
  face_verified boolean DEFAULT false,
  probation_start date,
  probation_end date,
  probation_months integer DEFAULT 3,
  show_contact_public boolean DEFAULT false,
  custom_label text,
  custom_title text;
```

**Broker-facing UI** (inside JBJ Academy profile card):
- Upload ID and RERA card
- Show verification badge when both are valid + name matches + face verified
- Auto-expire: A visual alert when `rera_expiry_date` or `id_expiry_date` < now()
- If expired > 24h, verification badge disappears
- Notification to broker to re-upload

**Admin controls** — Add to existing `TrainingManagement.tsx` or new tab in JBJ Broker Admin (`/jbj-broker-admin`):
- Toggle per broker: `show_contact_public`, edit `custom_title`, `custom_label`, `verification_status`
- Skip probation button (already exists as "Promote to Elite")
- View/download broker documents

**OurBrokers page update:**
- Show only first name + photo (already mostly this way)
- Show verification badge if `verification_status = 'verified'`
- Hide last name, email, phone unless `show_contact_public = true`

---

### Phase 3: Education Books & Testing System — Content Seeding

**Database:** Seed comprehensive education books into `broker_education_books` and modules into `broker_education_modules` using the insert tool. Topics:

1. Objection Handling & Closing Techniques
2. Market Knowledge — UAE Real Estate
3. Lead Management & CRM Best Practices
4. Cold Calling & Follow-Up Strategies
5. Marketing Yourself as a Broker
6. How to Sell to Clients
7. Types of Calls & Communication
8. Legal Framework & RERA Regulations
9. Off-Plan vs Secondary Market
10. Investment Analysis & ROI
11. Property Valuation Fundamentals
12. Client Psychology & Negotiation
13. Dubai Areas & Community Knowledge
14. Developer Relations & Project Launches
15. Digital Marketing for Brokers

Each book gets 4-6 modules with test questions (seeded into `broker_education_tests`).

**Certificate Enhancement:**
- After completing all modules + passing tests, auto-generate certificate
- Certificate includes QR code linking to `/verify-certificate/:token`
- Certificate number displayed
- Owner's stamp + signature auto-applied from sessionStorage stamp data
- Existing `VerifyCertificate.tsx` already handles QR verification — enhance to also support lookup by certificate number (add search input)

---

### Phase 4: Career Portal & Open Positions

**Database:** Seed open positions into `hr_job_offers` using the insert tool. Positions for a global enterprise real estate company:

- Property Consultant (Commission-based, no salary — positioned as "Partnership")
- Senior Property Consultant
- Sales Manager / Team Leader
- Marketing Manager / Digital Marketing Specialist
- Social Media Manager / Content Creator
- Graphic Designer / Photographer / Videographer
- HR Coordinator / Recruitment Specialist
- Finance & Accounting Officer
- IT Support / Web Developer / Mobile Developer
- Data Analyst
- Legal Advisor / Compliance
- Office Administrator / Receptionist
- Executive Assistant / PA
- Customer Service Representative
- Property Management Specialist
- CRM Administrator
- Business Development Manager

**JoinApplication.tsx updates:**
- Position dropdown already exists with most of these — verify all are included
- After submission, email mentions the specific position applied for
- Backend: `hr_applications` already stores `position_applied` — ensure it's displayed in the admin HR hub
- AI CV matching: Call AI to score CV relevance vs. position requirements (0-100% accuracy score), store in `hr_applications`

**Career page (`/join`) updates:**
- Query `hr_job_offers` where `is_active = true` 
- Show open positions as premium cards grouped by department
- Broker positions highlighted as "Partnership Opportunity — Commission Based"
- "Open for Promotion" badge on leadership roles
- Each position has an "Apply Now" button pre-selecting that position

**Notifications:**
- When new position is added by admin, send notification to all users with broker role
- Show in alerts sidebar

**HR Hub integration:**
- Show which position each applicant applied for (already exists)
- Show AI accuracy score for CV vs. position match

---

### Phase 5: Graduated Brokers Portal & Sitemap

**New section in JBJ Academy** or standalone `/academy/graduates`:
- Grid of graduated brokers showing: first name, photo, certificate number, completion date
- Each certificate has a QR code
- Search by certificate number
- Premium graduation theme (caps, gold borders)

**VerifyCertificate.tsx upgrade:**
- Add a search form at top: enter certificate number OR scan QR
- Query by `certificate_number` in addition to `verification_token`
- Show certificate status: Active / Expired / Revoked
- Show full details: track completed, scores, issue date

**Sitemap update:** Add `/jbj-academy`, `/academy/graduates`

---

### Summary

| Phase | Scope | Key Files |
|-------|-------|-----------|
| 1 | JBJ Academy hub page | New `JBJAcademy.tsx`, route in `PublicRoutes.tsx` |
| 2 | Broker verification + admin toggles | DB migration, `broker_profiles` columns, admin tab, `OurBrokers.tsx` |
| 3 | Education content seeding + certificates | DB inserts for books/modules/tests, `VerifyCertificate.tsx` |
| 4 | Career portal + open positions + AI matching | DB inserts for `hr_job_offers`, `JoinApplication.tsx`, notifications |
| 5 | Graduates portal + sitemap | `JBJAcademy.tsx` graduates section, `VerifyCertificate.tsx`, `Sitemap.tsx` |

I'll implement all 5 phases in sequence, starting with the database migration and the Academy hub page.
