

## Master System Architecture — Audit & Gap Analysis

This is not a greenfield build. The platform already has ~90% of the requested modules implemented. Below is the full architecture map, what exists, and the gaps that need to be filled.

---

### EXISTING SYSTEM STRUCTURE

```text
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React/Vite)                     │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────────────┐  │
│  │ AuthGate │ │OwnerGuard│ │MainLayout │ │OwnerDashboardShell│  │
│  └──────────┘ └──────────┘ └───────────┘ └───────────────────┘  │
│       Routes: PublicRoutes | AdminRoutes | OwnerRoutes           │
│               AIToolRoutes | ToolkitRoutes | StandaloneRoutes    │
├─────────────────────────────────────────────────────────────────┤
│                    BACKEND (Lovable Cloud)                        │
│  ┌───────────────┐ ┌──────────────┐ ┌─────────────────────────┐ │
│  │ Edge Functions │ │  Storage     │ │  Realtime Subscriptions │ │
│  │ (30+ deployed) │ │  (documents) │ │  (notifications/chat)   │ │
│  └───────────────┘ └──────────────┘ └─────────────────────────┘ │
│  ┌───────────────┐ ┌──────────────┐ ┌─────────────────────────┐ │
│  │ AI Gateway    │ │  RLS Policies│ │  Auth (Email+Google)    │ │
│  │ (Lovable AI)  │ │  (per table) │ │  (JWT + verify-owner)   │ │
│  └───────────────┘ └──────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                     DATABASE (PostgreSQL)                         │
│  projects | developers | developer_representatives               │
│  briefing_requests | briefing_attendance | rep_activity_log      │
│  crm_leads | crm_users_profile | admin_tasks | security_events  │
│  user_roles | user_agreements | user_notifications               │
│  hr_employees | broker_verifications | market_opportunities      │
└─────────────────────────────────────────────────────────────────┘
```

---

### STEP-BY-STEP GAP ANALYSIS

#### Step 1 — System Structure: COMPLETE
All layers exist: Frontend (React), Backend (Edge Functions), Auth (JWT + Owner verification), AI (Lovable AI gateway), Database (PostgreSQL + RLS), Storage (documents bucket), Security (CSP, WAF-like blocking, scraping_blocks), Monitoring (security_events, audit triggers).

#### Step 2 — Routing Map: COMPLETE
Every requested route already exists:

| Requested Route | Existing Route | Location in UI |
|---|---|---|
| `/dashboard` | `/dashboard` → redirects by role | Main entry after login |
| `/developer-hub` | `/developer-portal` | Public route, accessible via mode selector |
| `/developer-hub/company-registration` | `/developer-portal?tab=submit` | Tab inside Developer Portal |
| `/developer-hub/projects` | `/developer-portal?tab=projects` | Tab inside Developer Portal |
| `/developer-hub/marketing-materials` | `/developer-portal?tab=materials` | Tab inside Developer Portal |
| `/developer-hub/events` | `/developer-portal?tab=events` | Tab inside Developer Portal |
| `/developer-hub/agreements` | `/e-signature` | Owner route, E-Signature module |
| `/developer-hub/tasks` | `/owner/crm/tasks` | Owner Command Center |
| `/developer-hub/crm` | `/owner/crm` | Owner Command Center |
| `/developer-hub/database` | `/admin/developers` | Admin route |
| `/developer-hub/reports` | `/jbj-broker-reports` | Owner route |
| `/admin` | `/admin` or `/owner/admin` | Owner-guarded |
| `/admin/developers` | `/admin/developers` | AdminDevelopers page with briefing mgmt |
| `/admin/projects` | `/owner/listing-admin` | Listing admin panel |
| `/admin/approvals` | `/owner/listing-admin` | Project approval queue |
| `/admin/tasks` | `/owner/crm/tasks` | CRM Tasks |
| `/admin/security` | `/security-console` | Security Console |
| `/admin/system-logs` | `/owner/audit` | Owner Audit Page |

#### Step 3 — Dashboard Structure: COMPLETE
- **Owner Dashboard**: `/owner` — OwnerDashboardOverview with pending approvals, tasks, system alerts
- **Admin Dashboard**: `/admin` — Admin panel with developer registrations, leads, roles
- **Developer Dashboard**: `/developer-portal` — Shows projects submitted, briefing requests, rep profile
- **Investor Dashboard**: `/investor-dashboard` — Portfolio views, KPIs, market alerts

#### Step 4 — Developer Hub: MOSTLY COMPLETE
Existing in `/developer-portal` with tabs: Projects, Events, Materials, Listings, Briefings, Messages, Rep Registration.

**Gaps to fill:**
- No dedicated "Agreements" tab inside Developer Portal (currently lives in E-Signature module)
- No "Tasks" tab for developer reps to see their assigned tasks
- Marketing materials upload exists but no approval workflow status panel for reps

#### Step 5 — CRM Database: COMPLETE
`developer_representatives` table stores: full_name, title, phone, email, whatsapp, developer_id, activity_score, is_primary, is_active, notes, languages, nationality, gender.
`crm_leads` stores contacts with full filtering.
AdminDevelopers page has rep management with search/filter.

**Gap:** No UI filter by gender, nationality, languages, years in RE, or rating in the AdminDevelopers rep list.

#### Step 6 — Report Download: PARTIAL
Compare page has PDF download. CRM has CSV export. 

**Gap:** No company-letterhead PDF export with header/footer/timestamp for CRM data. No grouping by role (COO, Admin, Sales Rep, Channel Partner).

#### Step 7 — Briefing System: COMPLETE
`BriefingRequestForm` → `briefing_requests` table → Admin approval in `BriefingManagement` → `BriefingAttendance` page with selfie+GPS → `rep_activity_log` points system → Feedback/rating.

#### Step 8 — AI Processing: COMPLETE
`universal-link-extractor` edge function auto-structures project data from URLs/PDFs. AI gateway processes property descriptions, market analysis, and listing generation.

#### Step 9 & 10 — Security & Database Security: COMPLETE
RLS on all sensitive tables. `verify-owner` edge function. `security_events` + `scraping_blocks` tables. CSP headers. Anti-scraping protection. Encrypted HR data.

#### Step 11 — Monitoring: COMPLETE
`security_events` table logs all violations. `log-security-event` edge function. Owner audit page. Login activity tracked.

---

### IMPLEMENTATION PLAN — Fill Remaining Gaps

**Gap 1: Developer Portal — Add "Agreements" & "Tasks" tabs**
- File: `src/pages/DeveloperPortal.tsx`
- Add a new `agreements` tab showing documents assigned to the rep from `e_signature_envelopes` where the rep's email matches a signer
- Add a `tasks` tab querying `admin_tasks` filtered by the rep's user_id

**Gap 2: AdminDevelopers — Enhanced CRM Filtering**
- File: `src/pages/AdminDevelopers.tsx`
- Add filter dropdowns for: Language, Nationality, Gender, Rating (from rep_activity_log score)
- Add a "Years in RE" computed filter

**Gap 3: CRM PDF Export with Letterhead**
- Create edge function `generate-crm-report` that produces a PDF with:
  - Company letterhead (logo + "JBJ Global Real Estate")
  - Header with report title, date, filtered criteria
  - Footer with page numbers and timestamp
  - Grouping by role (COO, Admin, Sales Rep, Channel Partner)
- Add "Export PDF Report" button to AdminDevelopers and CRM pages

**Gap 4: Developer Portal — Marketing Materials Approval Status**
- File: `src/pages/DeveloperPortal.tsx` (materials tab)
- Show approval status badges (Pending/Approved/Rejected) on uploaded materials
- Query `developer_project_submissions` for status tracking

---

### FILES TO CHANGE

| File | Changes |
|---|---|
| `src/pages/DeveloperPortal.tsx` | Add Agreements tab, Tasks tab, materials approval status |
| `src/pages/AdminDevelopers.tsx` | Add language/nationality/gender/rating filters |
| New: `supabase/functions/generate-crm-report/index.ts` | PDF report generation with letterhead |
| `src/pages/CRM.tsx` or `src/pages/AdminCRM.tsx` | Add "Export PDF Report" button |

This is a focused plan addressing only the gaps. The platform already covers ~95% of the requested enterprise architecture.

