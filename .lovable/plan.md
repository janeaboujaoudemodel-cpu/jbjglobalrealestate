
# JBJ Global Real Estate - Comprehensive System Audit & Fix Implementation Plan

## Executive Summary

This audit covers the complete JBJ Global Real Estate platform - frontend, backend, security, integrations, and UI compliance. Based on extensive codebase analysis, I have identified multiple areas requiring attention across 7 task groups.

---

## AUDIT REGISTER STRUCTURE

The JBJ_GLOBAL_AUDIT_REGISTER will be created as a markdown file to track all items:

```text
| Task ID | Area | Feature Name | Page/Component | Claimed Status | Test Result | Fix Applied | Notes |
|---------|------|--------------|----------------|----------------|-------------|-------------|-------|
```

---

## TASK GROUP 1: GLOBAL AUDIT INITIALIZATION

### Findings

**Backend Schema Status - VERIFIED EXISTING:**
- `user_preferences` table - EXISTS with `selected_mode` column
- `user_roles` table - EXISTS with proper enum `app_role`
- `hr_user_roles` table - EXISTS for HR/broker member roles
- `points_ledger` table - EXISTS for earn/redeem history
- `books_catalog` table - EXISTS for education books
- `broker_education_progress` table - EXISTS for module tracking
- `developer_visit_requests` table - EXISTS for GPS visit system
- `developer_visit_checkins` table - EXISTS for check-in/check-out
- `deals` table - EXISTS for broker deals
- `pending_project_imports` table - EXISTS for approval queue
- `tier_definitions` table - EXISTS for progression tiers
- `notifications` table - Needs verification

**Security Findings from Linter:**
- 4 RLS policies using `USING (true)` or `WITH CHECK (true)` for non-SELECT operations - NEEDS FIX

### Required Fixes

1. **Create audit_register.md file** to track all audit items
2. **Fix overly permissive RLS policies** identified by database linter
3. **Verify `has_role` security definer function** exists for proper role checking

---

## TASK GROUP 2: FRONTEND UI & UX COMPLIANCE AUDIT

### Findings

**2.1 UI Compliance Issues Identified:**
- Footer navigation section - FIXED in previous session (champagne layer, gold titles, colored icons)
- Homepage Hub cards - FIXED (gold gradient applied)
- AI Home Finder - FIXED (dark background, white title, purple badge)
- Services Grid buttons - FIXED (primary buttons added)

**2.2 Scroll/Overflow Issues:**
- Mega menu dropdowns use `ScrollArea` component - APPEARS FUNCTIONAL
- Footer `Collapsible` components for mobile - NEEDS TESTING

**2.3 Button Hierarchy:**
- Primary buttons using `variant="primary"` consistently in most components
- Market Report form button - FIXED to use Button component

**2.4 Forms Global Issues:**
- `PhoneInput` component EXISTS at `src/components/ui/phone-input.tsx`
- Country dropdown uses searchable select with flags - NEEDS VERIFICATION for active color

**2.5 Profile Icon Rules:**
- `MegaMenuAccount.tsx` line 73-78: `getInitials()` function splits by space and takes first 2 initials - CORRECT
- Full name display - CORRECT at line 100-102
- Tier label - MISSING in account dropdown

**2.6 Dashboard Sub-Pages:**
- `/my-dashboard` route EXISTS (line 281 in App.tsx)
- `MyDashboard.tsx` renders inside MainLayout with proper shell
- InvestorDashboard renders inside MainLayout - CORRECT
- "My Dashboard" shortcut in Header - EXISTS (GlobalHeader.tsx line 957-961)
- "My Dashboard" shortcut in Footer - EXISTS (Footer.tsx line 108)

### Required Fixes

| ID | Issue | File | Priority |
|----|-------|------|----------|
| UI-001 | Add tier label to profile dropdown | MegaMenuAccount.tsx | HIGH |
| UI-002 | Verify country dropdown active color | PhoneInput/CountryDropdown | MEDIUM |
| UI-003 | Test Guides mega menu backdrop scroll | MegaMenuMore.tsx | MEDIUM |

---

## TASK GROUP 3: MODE SWITCHING (CLIENT / BROKER)

### Findings

**Current Implementation:**
- `UserModeContext.tsx` - EXISTS with full implementation
- `useUserMode.ts` hook - EXISTS (duplicate of context logic)
- `ModeSwitcher.tsx` - EXISTS with dropdown UI
- Mode persists to:
  - localStorage (`jj_user_mode` key) - IMMEDIATE
  - Supabase `user_preferences.selected_mode` - ON LOGIN

**Issues Identified:**
- Mode selector uses `DropdownMenu` which auto-closes correctly - CORRECT BEHAVIOR
- Mode persists across refresh via localStorage - VERIFIED
- Mode syncs with database on user login - VERIFIED

**Placement Check:**
- Header: `ModeSwitcher` in `MegaMenuAccount.tsx` line 106 - PRESENT
- Account menu: Visible in account dropdown - CORRECT

**Role Access Check:**
- `canAccessBrokerMode` in ModeSwitcher line 44: Only allows broker mode for `broker` or `broker_partner` roles - CORRECT

### Status: WORKING AS DESIGNED

No fixes required for mode switching core functionality.

---

## TASK GROUP 4: BACKEND SCHEMA & PERMISSIONS

### Verified Tables

| Table | Status | Notes |
|-------|--------|-------|
| user_preferences | EXISTS | Has selected_mode, notification prefs |
| user_roles | EXISTS | Uses app_role enum |
| hr_user_roles | EXISTS | For HR hiring workflow |
| points_ledger | EXISTS | Full points tracking |
| tier_definitions | EXISTS | Broker/client tiers |
| deals | EXISTS | Broker deal tracking |
| books_catalog | EXISTS | Education books |
| broker_education_progress | EXISTS | Module completion |
| broker_education_books | EXISTS | Book catalog |
| developer_visit_requests | EXISTS | Visit requests |
| developer_visit_checkins | EXISTS | GPS check-in/out |
| pending_project_imports | EXISTS | Approval queue |
| audit_logs | EXISTS | System audit trail |

### Permission Model

**Current Roles in `app_role` enum:**
- admin
- moderator
- user
- (Additional roles defined in visitor_role enum)

**Listing Admin "Sarah" Restriction:**
- `ListingAdminGuard.tsx` EXISTS - Restricts `/listing-admin` to single email
- Cannot delete data - Controlled by RLS policies
- Cannot bypass approval - Approval workflow in place

### Required Fixes

| ID | Issue | Priority |
|----|-------|----------|
| BE-001 | Fix 4 overly permissive RLS policies | BLOCKER |
| BE-002 | Verify has_role() security definer function | HIGH |
| BE-003 | Add notifications table if missing | MEDIUM |

---

## TASK GROUP 5: PROVIDENT & REELLY SYNCHRONIZATION

### Findings

**Reelly API Integration:**
- `supabase/functions/reelly-api-sync/index.ts` - EXISTS (809 lines)
- Uses proper API endpoint: `https://api-reelly.up.railway.app/api/v2/clients/projects`
- JWT-based `X-API-Key` authentication - CORRECT
- Projects go to `pending_project_imports` for approval - CORRECT

**Provider Separation:**
- Reelly and Provident have SEPARATE sync functions
- `reelly-api-sync` for Reelly
- `provident-batch-sync`, `provident-full-sync` for Provident
- Each tracks its own counts via source URL pattern

**Queue Persistence:**
- `pending_project_imports` table with status column
- Items persist until approved/rejected
- Status: pending, approved, rejected

**Image Repair System:**
- `repair-approved-projects` function EXISTS
- `repair-project-images` function EXISTS
- `reelly-fill-missing-assets` function EXISTS

### Issues

| ID | Issue | Priority |
|----|-------|----------|
| SYNC-001 | Verify image repair actually restores images | HIGH |
| SYNC-002 | Verify queue persists after browser close | MEDIUM |
| SYNC-003 | Validate Reelly count consistency | MEDIUM |

---

## TASK GROUP 6: EDUCATION, BOOKS & CERTIFICATION

### Findings

**Books Library:**
- `BrokerEducation.tsx` EXISTS with 3D book cards (`Book3DCard` component)
- Language filter: `bookLanguage` state with `BookLanguageFilter` component
- Books grouped by learning path with ordering

**Module/Test System:**
- `broker_education_progress` table tracks:
  - `book_id`, `module_id`, `user_id`
  - `is_completed`, `test_score`, `attempts_count`
  - `completed_at`, `unlocked_at`
- `useBrokerEducation.ts` hook manages progress

**Certification:**
- `hr_certificates` table EXISTS with:
  - `certificate_number`, `verification_token`
  - `full_name`, `track`, `scores`
  - `is_revoked`, `revoked_at`, `revoked_reason`
- `/verify-certificate` route EXISTS

### Issues to Verify

| ID | Issue | Priority |
|----|-------|----------|
| EDU-001 | Verify books are same size (3D cards) | MEDIUM |
| EDU-002 | Verify sequential unlock logic | HIGH |
| EDU-003 | Verify randomized questions | HIGH |
| EDU-004 | Test 3 failures -> show answers flow | HIGH |
| EDU-005 | Verify certificate PDF generation | MEDIUM |

---

## TASK GROUP 7: NOTIFICATIONS & PREFERENCES

### Findings

**Stay in the Loop:**
- `NewsletterBand.tsx` EXISTS - Renders above footer
- Uses `NewsletterBrevo` component for form
- Form behavior needs verification for no-reload

**Notification Preferences:**
- `user_preferences` table has columns:
  - `email_notifications`
  - `push_notifications`
  - `browser_notifications`
  - `notification_frequency`
- `useNotificationPreferences.ts` hook EXISTS

### Issues

| ID | Issue | Priority |
|----|-------|----------|
| NOTIF-001 | Verify newsletter submit doesn't reload page | MEDIUM |
| NOTIF-002 | Verify notification preference toggles work | MEDIUM |

---

## TASK GROUP 8: FEATURE PARITY CHECKLIST

### BLOCKERS (Must Pass)

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| B-001 | RLS Policy Security | FAIL | 4 permissive policies found |
| B-002 | User Authentication Flow | PASS | Auth working |
| B-003 | Mode Persistence | PASS | localStorage + DB sync |
| B-004 | Project Approval Queue | PASS | pending_project_imports working |

### HIGH PRIORITY

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| H-001 | Tier Label in Profile | FAIL | Missing in dropdown |
| H-002 | Education Sequential Unlock | NEEDS TEST | Code exists |
| H-003 | Image Repair System | NEEDS TEST | Functions exist |
| H-004 | Sync Queue Persistence | NEEDS TEST | Table exists |

### MEDIUM PRIORITY

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| M-001 | Country Dropdown Active Color | NEEDS TEST | PhoneInput exists |
| M-002 | Newsletter No-Reload | NEEDS TEST | Component exists |
| M-003 | Guides Dropdown Scroll | NEEDS TEST | ScrollArea used |
| M-004 | Books Same Size | NEEDS TEST | 3D cards exist |

---

## IMPLEMENTATION PLAN

### Phase 1: Security Fixes (BLOCKER)

**BE-001: Fix Overly Permissive RLS Policies**

Create SQL migration to update the 4 policies identified by the linter:
- Identify specific tables with `USING (true)` or `WITH CHECK (true)` on INSERT/UPDATE/DELETE
- Replace with proper user-based conditions: `auth.uid() = user_id`

### Phase 2: UI Compliance Fixes

**UI-001: Add Tier Label to Profile Dropdown**

File: `src/components/header/MegaMenuAccount.tsx`

Add tier badge next to user name using the `useTierProgress` hook:
```tsx
// Import useTierProgress
import { useTierProgress } from "@/hooks/useTierProgress";

// In component
const { tierProgress } = useTierProgress();

// Add badge after displayName
{tierProgress?.currentTier && (
  <Badge className="ml-2" style={{ backgroundColor: tierProgress.currentTier.badge_color }}>
    {tierProgress.currentTier.tier_name}
  </Badge>
)}
```

### Phase 3: Verification Testing

For each item marked "NEEDS TEST":
1. Open browser tool
2. Navigate to relevant page
3. Perform test actions
4. Capture screenshot
5. Update audit register with result

---

## FILES TO MODIFY

| File | Changes |
|------|---------|
| `src/components/header/MegaMenuAccount.tsx` | Add tier label badge |
| Database migration | Fix RLS policies |
| `audit_register.md` (NEW) | Create audit tracking file |

---

## VERIFICATION CHECKLIST

Before marking complete:
- [ ] All BLOCKER items = PASS
- [ ] All HIGH priority items = PASS or documented workaround
- [ ] Screenshot proof for each fix
- [ ] No UI system changes (colors, layout preserved)
- [ ] No content changes
- [ ] All existing functionality still works

---

## NOTES

1. The majority of requested backend schemas ALREADY EXIST and are properly structured
2. Mode switching is FUNCTIONAL - persists via localStorage and syncs to DB
3. The main security concern is the 4 permissive RLS policies flagged by the linter
4. UI fixes are minimal - mainly adding tier label to profile dropdown
5. Several items require runtime testing rather than code fixes
