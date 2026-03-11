

## Deep Audit & Implementation Plan — Broker Portal, Academy, Admin, Career Portal

### AUDIT FINDINGS

**What EXISTS and works:**

| Area | Status | Details |
|------|--------|---------|
| Broker Portal (`/broker-portal`) | Exists | Profile hero, 12-tool grid, training progress, document verification section |
| JBJ Academy (`/jbj-academy`) | Exists | Video hero, profile card, tools grid, certification section, graduates gallery (placeholder) |
| Broker Education (`/broker-education`) | Exists | 15 books, 75 modules, 5 learning paths |
| Education Tests | Partial | 26 test questions seeded (need ~75 more for full coverage) |
| Certification System | Exists | `certification_phases` + `user_certification_progress` tables, `CertificationSection` component |
| Graduates Gallery (`/academy/graduates`) | Exists | Fetches `hr_certificates`, search + lookup by cert number |
| Certificate Verification (`/verify-certificate/:token`) | Exists | Token + number lookup, active/revoked display |
| Broker Profiles DB | Exists | 35 columns including `custom_title`, `performance_rating`, `verification_status`, `probation_end`, `show_contact_public`, `rera_expiry_date`, etc. |
| Open Positions DB | Exists | 21 active positions seeded across Sales, IT, Marketing, HR, etc. |
| Career Application (`/join`) | Exists | 37 hardcoded job positions, CV upload, confirmation email |
| HR Dashboard | Exists | Has `OpenPositionsPanel` for admin CRUD on positions |
| Broker Admin (`/jbj-broker-admin`) | Exists | Uses `jbj_brokers` table (AI brokers), NOT `broker_profiles` |

**GAPS & ISSUES FOUND:**

| # | Gap | Severity | Location |
|---|-----|----------|----------|
| 1 | `JoinApplication.tsx` uses hardcoded `JOB_POSITIONS` array, does NOT fetch from `open_positions` table | High | JoinApplication.tsx:45-84 |
| 2 | Admin Broker Management (`JBJBrokerAdmin.tsx`) manages AI brokers (`jbj_brokers`), not real broker profiles (`broker_profiles`). No admin UI for toggling `show_contact_public`, editing `custom_title`, skipping probation | High | JBJBrokerAdmin.tsx |
| 3 | `AdminCRM.tsx` exports CSV with plaintext `email_lower`/`phone_e164` — bypasses encryption | High | AdminCRM.tsx:237-249 |
| 4 | Graduates gallery has no QR code per certificate (uses existing `qrcode-generator` package but not integrated) | Medium | AcademyGraduates.tsx |
| 5 | Only 26 test questions for 75 modules — most modules have zero quiz questions | Medium | DB |
| 6 | `OpenPositionsPanel` writes to `hr_job_offers` table, NOT `open_positions` table — two parallel systems | Medium | OpenPositionsPanel.tsx:57 |
| 7 | Broker Portal document upload buttons are non-functional (no upload handler) | Medium | BrokerPortal.tsx |
| 8 | No face verification workflow exists (field `face_verification_status` in DB but no UI) | Low | Missing |
| 9 | No broker notification when open positions are added | Low | Missing |

---

### IMPLEMENTATION PLAN

#### Task 1: Connect Career Portal to `open_positions` DB table
- **JoinApplication.tsx**: Fetch `open_positions` where `is_active = true` and display as premium cards above the form
- Replace hardcoded `JOB_POSITIONS` with dynamic positions from DB
- Show broker roles with "Partnership · Commission Basis" premium badge
- Store `position_applied` from DB position title in the application record

#### Task 2: Admin Broker Management Panel
- **Create `src/components/admin/BrokerManagementPanel.tsx`**: Table of all `broker_profiles` with:
  - Toggle `show_contact_public` per broker
  - Edit `custom_title`, `custom_label`, `performance_rating` inline
  - Skip probation button (sets `probation_skipped = true`, clears `probation_end`)
  - View verification status, document expiry alerts
- Integrate into existing admin route (add tab to `AdminCRM.tsx` or create dedicated route)

#### Task 3: QR Codes on Graduate Certificates
- **AcademyGraduates.tsx**: Add QR code per certificate card using `qrcode-generator` package
- QR links to `/verify-certificate/{verification_token}`

#### Task 4: Seed Remaining Test Questions
- DB insert: Add ~50 more test questions to cover all 15 books (at least 3-5 per module for key modules)

#### Task 5: Fix OpenPositionsPanel to use `open_positions` table
- **OpenPositionsPanel.tsx**: Change from `hr_job_offers` to `open_positions` table for CRUD
- Ensure admin can add/edit/deactivate positions

#### Task 6: Broker Document Upload Handler
- **BrokerPortal.tsx**: Wire upload buttons to Supabase storage (`broker-documents` bucket)
- Save URL + expiry date to `broker_profiles` (rera_card_url, id_document_url, rera_expiry_date, id_expiry_date)

#### Task 7: Fix AdminCRM CSV Export Security
- **AdminCRM.tsx**: Strip `email_lower` and `phone_e164` from CSV export or route through decryption RPC

#### Task 8: Premium UI Polish
- Ensure Broker Portal and Academy maintain champagne-gold design consistency
- Add graduation cap icon prominence in Academy hero

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/JoinApplication.tsx` | Fetch from `open_positions`, display dynamic cards |
| `src/components/admin/BrokerManagementPanel.tsx` | **New** — admin toggles for broker profiles |
| `src/pages/AdminCRM.tsx` | Add Broker Management tab, fix CSV export |
| `src/pages/AcademyGraduates.tsx` | Add QR codes per certificate |
| `src/components/hr/OpenPositionsPanel.tsx` | Switch to `open_positions` table |
| `src/pages/BrokerPortal.tsx` | Wire document upload handlers |
| DB insert | Seed ~50 more test questions |

