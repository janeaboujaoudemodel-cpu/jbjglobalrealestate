

## Plan: Complete Vertical Navigation — All Pages Categorized

After cross-referencing every route file against the current `NAV_ITEMS` array in `GlobalVerticalNav.tsx`, I found **80+ pages/tools missing** from the sidebar. Here's the full implementation plan.

---

### Missing Pages by Category

**PROPERTIES (missing 8):**
Communities, Resale Properties (listing submenu), Listing Portal Submit, My Listings, Property Evaluator, Rental Index, Sell With Us, Property Valuation, Property Measurement

**GUIDES (missing 8):**
Investor FAQ, Buyer FAQ, Seller FAQ, Landlord FAQ, Tenant FAQ, Broker FAQ, Seller Listing Guide, Landlord Portal

**INSIGHTS (missing 6):**
Market Report, Market Overview, Area Intelligence, Market Reports Archive, Methodology, Internal MI Dashboard (owner-only)

**SERVICES (missing 14):**
Architecture, Interior Design, Fit-Out, Design & Build, Law Firm, Buying Advisory, Rental Advisory, Investment Advisory, Snagging, Broker Certification, Complaint Procedures, Customer Happiness Center, Testimonials, AI Tools Service

**PARTNERS (new section, 5):**
Partners Hub, Mortgage Partner, Legal Partner, Company Setup Partner, Visa Services

**COMPANY (missing 7):**
Awards, Press Kit, Company Profile, Philanthropy, Our Brokers, Reviews, Partner Governance

**LEGAL (missing 2):**
Trust & Compliance, Risk Disclosure

**TOOLS (missing 12):**
Video Resize, PDF from Photos, Image Resize, Voice Studio, Voice Studio Pro, AI Video Studio, Captions & Translate, Background AI, Beauty Filters, PDF Editor, Landing Page Builder

**AI TOOLS (missing 3):**
AI Personal Shopper, AI Investment Report, Voice Agent Settings

**BROKER & ACADEMY (new section, 10):**
Broker Portal, Broker Toolkit, Broker Resources, Broker Training, Broker Hub, JBJ Academy, Academy Graduates, AI Broker Workspace, Broker Dashboard, Broker Education

**INVESTOR (new section, 5):**
Investor Hub, Investor Services, Join Investor List, Investor Dashboard, Portfolio Views

**PRODUCTIVITY (new section, 10):**
Spreadsheet, Documents, QR Generator, Contract Forms, Video Meeting, Presentations, Sitemap, Pricing, Onboarding, Client Portal

**ADMIN & OWNER (new section, 30+):**
Admin CRM, Admin Inquiries, Admin Chat, Admin Onboarding, Admin Roles, Admin Intelligence, Admin Developers, Admin Marketing Hub, Admin Training Guide, Admin Legal Center, HR Dashboard, HR Agent, Employee Hub, Employee Chat, Employee Management, Customer Happiness, Security Console, Company Comm, Executive Assistant, Call Review, Video Builder, Business Card Scanner, JBJ Analytics, JBJ Design Studio, JBJ Broker Admin, Broker Messages, Broker Reports, Broker Admin Assistant, Referral Admin, E-Signature suite, Whiteboard, Mind Map, Form Builder, Kanban, Email Client, Team Chat, Automations, Alerts Demo

**BUSINESS SUITES (new section, 5):**
All Tools Suite, Real Estate Suite, Broker Suite, Creative Suite, Productivity Suite, Suites Hub

---

### Implementation

**Single file modified:** `src/components/navigation/GlobalVerticalNav.tsx`

Changes to the `NAV_ITEMS` array:
1. Expand existing sections (PROPERTIES, TOOLS, INSIGHTS, GUIDES, SERVICES, COMPANY, LEGAL, MY ACCOUNT) with all missing routes
2. Add new sections: BROKER & ACADEMY, INVESTOR, PARTNERS, PRODUCTIVITY, BUSINESS SUITES, ADMIN & OWNER
3. Each section uses appropriate icons from the existing lucide-react imports
4. Admin/Owner items are conditionally rendered based on `isOwner` role (already available in the component)
5. Broker items conditionally shown for `isBroker` role
6. Update `SECTION_KEYS`, `SECTION_ICONS`, and the section rendering logic to support the new sections
7. Add any missing lucide icon imports at the top

The nav already supports collapsible accordion sections, so adding more sections integrates naturally. No new components needed — just expanding the existing data arrays.

### Estimated items total: ~200 nav items across ~14 sections (up from ~85 across 8 sections)

