

## Audit Report: Multi-Portal System + Developer Portal Fixes

### Completion Status by Task

| # | Task | Status | Evidence |
|---|------|--------|----------|
| 1 | **Fix "Register as Rep" label** → "Register as Developer / Representative" | DONE | `SalesRepRegistration.tsx:294` shows correct label; `DeveloperPortalCTA.tsx:27` shows correct label |
| 2 | **Rename Developer Portal tab** → "Update Profile" | DONE | `DeveloperPortal.tsx:1037` shows "Update Profile" |
| 3 | **Investor Portal rebuild** (7 tabs, premium styling) | DONE | `InvestorDashboard.tsx` — 546 lines, tabbed portal with Dashboard/Properties/Documents/Profile/Inbox/Alerts/Calendar |
| 4 | **Broker Portal enhancement** (tabbed structure) | DONE | `BrokerPortal.tsx` — 528 lines, tabbed with same structure |
| 5 | **ApprovalTimeline shared component** | DONE | `src/components/shared/ApprovalTimeline.tsx` — 156 lines, 3-step with photos |
| 6 | **Event Management Hub** | DONE | `src/pages/owner/EventManagementHub.tsx` — 201 lines, create/send/manage events by category |
| 7 | **useEventManagement hook** | DONE | `src/hooks/useEventManagement.ts` — 166 lines, full CRUD + invitations |
| 8 | **events + event_invitations tables** | DONE | Migration created, route wired at `/owner/event-management` |
| 9 | **Role options include "Other" with custom field** | DONE | `SalesRepRegistration.tsx:38` — `other` role with "Please specify your role" |
| 10 | **Owner/CEO/Founder requires ID + passport + trade license + RERA** | DONE | Validation at lines 150-167 |
| 11 | **Registration gate blocks portal access until registered** | DONE | `DeveloperPortal.tsx:968` — `shouldShowRegistrationGate` logic |
| 12 | **Owner auto-approve toggle for developers** | DONE | `DeveloperPortal.tsx:1919` — Toggle button per rep |
| 13 | **Owner restrict access for developers** | DONE | `DeveloperPortal.tsx:1933` — Restrict/Restore button |
| 14 | **Nationality with flags dropdown** | DONE | `NationalitySelect` component imported and used |
| 15 | **Phone with country code + flag** | DONE | `PhoneInputWithCountry` component imported and used |
| 16 | **Language multi-select** | DONE | `LanguageMultiSelect` component imported and used |

---

### NOT YET COMPLETED — Requires Implementation

| # | Task | Status | Details |
|---|------|--------|---------|
| A | **Homepage CTA cards: 4x2 grid layout** | NOT DONE | Currently 7 developer actions in `grid-cols-2 md:grid-cols-4` — need exactly 8 cards in 2 rows of 4. Need to add "Update Your Profile" card and rename "Register as Developer / Representative" → "Register as Developer or Sales" |
| B | **Remove "Interest Registration" terminology** | NOT DONE | 40+ references in `DeveloperPortal.tsx` — "interest registration" concept exists for launches. Should be renamed to "Launch Interest" or removed entirely per user's confusion |
| C | **Owner in developer mode sees owner-specific cards on homepage** | NOT DONE | `DeveloperPortalCTA.tsx:39` — when `isDeveloperMode` is true, owner sees developer cards, but owner actions (Quick Upload, Manage Launches, Review Submissions, Manage Developers) are hidden. User wants: when in developer mode, show developer view ONLY (no command center, no owner access). This IS currently correct — owner in dev mode sees developer cards. But the labels/cards need updating |
| D | **"On Leave" feature for developers** | NOT DONE | No on-leave self-service feature exists. The `is_on_leave` badge shows in owner manage view (line 1909) but developers cannot mark themselves on leave. Need: leave toggle + leave dates + return date in developer profile |
| E | **Secondary contact fields** | PARTIAL | `personal_email` and `personal_phone` fields exist in registration form state, but need to verify they're rendered in the UI and saved |
| F | **Icon styling: yellow-gold → champagne-gold** | NOT DONE | `DeveloperPortalCTA.tsx:63` uses `bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]` — this IS already champagne-gold. Need to verify if the user sees something different |

---

### Implementation Plan (3 Batches)

#### Batch 1: Homepage CTA Cards Fix
**File:** `src/components/home/DeveloperPortalCTA.tsx`

1. Change developer actions to exactly 8 cards in 2 rows of 4:
   - Row 1: Submit Project | Submit Event | My Projects | Check Listings
   - Row 2: Request Briefing | Agreements | Register as Developer or Sales | Update Your Profile
2. Rename "Register as Developer / Representative" → "Register as Developer or Sales"
3. Remove any owner-specific items when `isDeveloperMode` is true (already working but verify)
4. Keep champagne-gold icon styling (already correct gradient)

#### Batch 2: Developer Portal — Remove "Interest Registration" + Add On-Leave
**File:** `src/pages/DeveloperPortal.tsx`

1. Remove or rename all "Interest Registration" references → rename to "Launch Interests" where it makes sense for owner manage tab, or remove the concept entirely
2. Owner manage tab label: "Review Interest Registration" → "Review Launch Interests" or remove
3. Add "Mark as On Leave" toggle in the developer's profile/Update Profile section with:
   - Leave start date, return date
   - Self-service toggle
   - Saves to `developer_sales_reps` table (needs `is_on_leave`, `leave_start_date`, `leave_return_date` columns)

**Database migration:** Add columns to `developer_sales_reps`:
- `is_on_leave` boolean default false
- `leave_start_date` date nullable
- `leave_return_date` date nullable

#### Batch 3: Registration Form — Secondary Contacts + "Other" Role Polish
**File:** `src/components/developer-portal/SalesRepRegistration.tsx`

1. Verify personal_email and personal_phone fields render in the UI with clear labels: "Company Email", "Personal Email", "Company Phone", "Personal Phone"
2. Verify "Other" role shows mandatory text input for custom role title (already in validation, need to confirm UI renders)
3. Ensure all fields save to backend properly

### Summary
- **16 tasks completed** from the approved plan
- **6 items still need work** (cards layout, interest registration removal, on-leave feature, secondary contacts UI verification, icon refinement)
- 3 implementation batches to finish everything

