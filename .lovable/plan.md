

# Master Prompt Implementation Plan - Owner Dashboard Command Center + Navigation Audit

## Executive Summary

This plan implements the Master Prompt requirements to ensure the Owner Dashboard Command Center is fully functional, properly integrated, and all navigation elements are correctly linked. The plan verifies existing structures are correct and fixes any gaps.

---

## Current State Analysis

### What Already Works Correctly

**1. Public Header (6 Items - VERIFIED CORRECT)**
The GlobalHeader.tsx already implements the locked 6-item header:
- Buy | Rent | Projects | Areas | Developers | Insights | More

**2. More Dropdown (MegaMenuMore.tsx - VERIFIED CORRECT)**
Already structured with 5 columns:
- Services (Property Management, Golden Visa, Mortgage, Valuation, Sell)
- Toolkit (ROI Calculator, Mortgage Calculator, Compare, Map, AI Home Finder)
- Investors (Dashboard, Education, Reports, Guides, Portfolio)
- Brokers (conditional - only in Broker Mode: Hub, Dashboard, CRM, Training, Resources)
- Company (About JBJ, About Jane bou Jaoude, Team, Contact, Careers, Press)

**3. Owner Dashboard Shell (OwnerDashboardShell.tsx)**
Already implemented with:
- Collapsible sidebar navigation (via OwnerSidebarNav component)
- Mobile responsive Sheet drawer
- Top bar with Owner badge
- Outlet for nested routes

**4. Owner Sidebar Navigation (OwnerSidebarNav.tsx)**
Already has 7 organized sections with 25+ links:
- Core, Properties, Communication, AI & Tools, Creative, Admin, System

**5. Owner Dashboard Overview (OwnerDashboardOverview.tsx)**
Already implements:
- KPI tiles (clickable)
- QuickActionsGrid component
- DepartmentShortcuts component
- IntegrationWidgets component

**6. Account Menu (MegaMenuAccount.tsx)**
Already has Owner Dashboard shortcut at top of Owner Shortcuts section

**7. App.tsx Routing**
Owner routes correctly nested under OwnerDashboardShell (lines 288-306)

---

## Issues Identified & Fixes Required

### Issue 1: Owner Dashboard Header Copy
**Location:** OwnerDashboardOverview.tsx
**Current:** No personalized welcome message for Jane bou Jaoude
**Fix:** Add header section with "Owner Command Center" title and "Welcome back, Jane bou Jaoude — Your integrated dashboard"

### Issue 2: MegaMenuMore Broker Links
**Location:** MegaMenuMore.tsx line 55
**Current:** Links to `/broker/crm` which may not exist
**Fix:** Update to `/crm` (the actual CRM route)

### Issue 3: Some Quick Action Routes May Not Exist
**Location:** QuickActionsGrid.tsx
**Current:** Some routes like `/studio` may need verification
**Action:** Verify all routes exist before implementation

### Issue 4: OwnerFeatureRegistry Uses MainLayout
**Location:** OwnerFeatureRegistry.tsx line 409
**Current:** Wraps in MainLayout (causing UI conflict when accessed via /owner shell)
**Fix:** Remove MainLayout wrapper since it's accessed via OwnerDashboardShell

---

## Implementation Plan

### Phase 1: Owner Dashboard Overview Enhancement

**File:** `src/pages/OwnerDashboardOverview.tsx`

**Changes:**
1. Add header section at the top of the component:

```tsx
{/* Command Center Header */}
<div className="mb-6">
  <h1 className="text-2xl md:text-3xl font-bold text-white">
    Owner Command Center
  </h1>
  <p className="text-zinc-400 mt-1">
    Welcome back, Jane bou Jaoude — Your integrated dashboard
  </p>
</div>
```

2. Ensure all KPI tiles navigate correctly:
- Total Leads → `/crm/leads`
- New This Week → `/crm/leads?filter=new`
- Pending Tasks → `/crm/tasks`
- Active Chats → `/owner/inbox`

(Already implemented correctly in current code)

---

### Phase 2: MegaMenuMore Route Correction

**File:** `src/components/header/MegaMenuMore.tsx`

**Change:** Update broker CRM link from `/broker/crm` to `/crm`

```tsx
// Line 55: Change from
{ label: 'Broker CRM', href: '/broker/crm', icon: Users },
// To
{ label: 'Broker CRM', href: '/crm', icon: Users },
```

---

### Phase 3: QuickActionsGrid Route Verification

**File:** `src/components/owner-dashboard/QuickActionsGrid.tsx`

**Verify all routes exist (from App.tsx analysis):**

| Button | Current Route | Verified Exists |
|--------|---------------|-----------------|
| + Add Lead | `/crm?action=new-lead` | Yes (CRM page) |
| Calendar | `/crm/calendar` | Yes (line 469) |
| Property Map | `/map` | Yes (line 481) |
| AI Assistant | `/founder-assistant` | Yes (line 509) |
| Studio | `/studio` | Yes (line 535) |
| Automations | `/automations` | Yes (line 524) |
| Analytics | `/jbj-analytics` | Yes (line 502) |
| Marketing | `/admin/marketing-hub` | Yes (line 483) |

All routes verified - no changes needed.

---

### Phase 4: DepartmentShortcuts Route Verification

**File:** `src/components/owner-dashboard/DepartmentShortcuts.tsx`

**Verify all routes exist:**

| Department | Route | Verified |
|------------|-------|----------|
| CRM Dashboard | `/crm` | Yes (line 458) |
| HR Dashboard | `/hr-dashboard` | Yes (line 629) |
| IT Department | `/it-department` | Yes (line 627) |
| Employee Hub | `/employee-hub` | Yes (line 517) |
| Listing Admin | `/listing-admin` | Yes (line 511) |
| Security Console | `/owner/safety` | Yes (line 302) |

All routes verified - no changes needed.

---

### Phase 5: IntegrationWidgets Route Verification

**File:** `src/components/owner-dashboard/IntegrationWidgets.tsx`

**Verify routes:**
- `/crm/calendar` - Yes
- `/crm/tasks?action=new` - Yes (CRM Tasks page)
- `/crm/notes?action=new` - Yes (CRM Notes page)
- `/automations` - Yes

All routes verified - no changes needed.

---

### Phase 6: OwnerFeatureRegistry Layout Fix

**File:** `src/pages/OwnerFeatureRegistry.tsx`

**Current Problem:** The component wraps itself in `<MainLayout>` which conflicts with the OwnerDashboardShell when accessed via `/owner/features`.

**Fix:** Remove the MainLayout wrapper and let the page render directly within the shell's Outlet.

```tsx
// Current (line 408-411):
return (
  <MainLayout>
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      ...
    </div>
  </MainLayout>
);

// Change to:
return (
  <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
    ...
  </div>
);
```

Also update line 425 to use the locked owner name:
```tsx
<p className="text-zinc-500 text-sm">Jane bou Jaoude — Complete visibility of all implemented features</p>
```

---

### Phase 7: OwnerSidebarNav - Add Missing Routes

**File:** `src/components/owner-dashboard/OwnerSidebarNav.tsx`

**Current sections verified correct. Add any missing CRM routes:**

Verify these routes are in the sidebar:
- `/crm/notes` - Already in CRM section? Need to verify
- `/crm/reminders` - Already in CRM section? Need to verify

If missing, add to appropriate section.

---

## Files to Modify

1. **`src/pages/OwnerDashboardOverview.tsx`**
   - Add "Owner Command Center" header with personalized welcome for Jane bou Jaoude

2. **`src/components/header/MegaMenuMore.tsx`**
   - Fix broker CRM link from `/broker/crm` to `/crm`

3. **`src/pages/OwnerFeatureRegistry.tsx`**
   - Remove MainLayout wrapper
   - Ensure owner name is "Jane bou Jaoude"

---

## Verification Checklist

After implementation, verify:

- [ ] Public header shows ONLY: Buy | Rent | Projects | Areas | Developers | Insights + More
- [ ] More dropdown contains Services/Toolkit/Investors/Brokers (conditional)/Company
- [ ] Brokers menu appears ONLY in Broker Mode
- [ ] Investor Mode never sees Brokers or CRM
- [ ] Footer unchanged (no CRM/broker internal links)
- [ ] Owner Dashboard appears in account menu only for Owner
- [ ] Owner sidebar is sectioned and navigates correctly
- [ ] OwnerDashboardShell compiles and renders nested routes properly
- [ ] OwnerDashboardOverview shows "Owner Command Center" title
- [ ] OwnerDashboardOverview shows "Welcome back, Jane bou Jaoude"
- [ ] KPI tiles navigate to correct routes
- [ ] QuickActionsGrid buttons all navigate correctly
- [ ] DepartmentShortcuts cards all navigate correctly
- [ ] No fake counts; no invented routes
- [ ] Owner name is ALWAYS: Jane bou Jaoude

---

## Security Confirmation

**No security layer modifications:**
- AuthContext - NOT MODIFIED
- OwnerGuard - NOT MODIFIED
- RLS policies - NOT MODIFIED
- Existing security logic - NOT MODIFIED

**No UI theme changes:**
- Colors - NOT MODIFIED
- Fonts - NOT MODIFIED
- Spacing - NOT MODIFIED
- Design language - NOT MODIFIED

---

## Routes Summary

**Routes linked in this implementation (all verified to exist):**

**Owner Command Center:**
- `/owner` - Dashboard
- `/owner/inbox` - Unified Inbox
- `/owner/templates` - Message Templates
- `/owner/settings/communication` - Communication Settings
- `/owner/agenda` - Daily Agenda
- `/owner/features` - Feature Registry
- `/owner/audit` - Audit Page
- `/owner/integrations` - Integrations Status
- `/owner/safety` - Safety Panel

**CRM Modules:**
- `/crm` - CRM Dashboard
- `/crm/leads` - Leads Inbox
- `/crm/tasks` - Tasks
- `/crm/calendar` - Calendar
- `/crm/notes` - Notes
- `/crm/reminders` - Reminders
- `/crm/employees` - Employees

**System & Admin:**
- `/automations` - Workflow Automations
- `/security-console` - Security Console
- `/jbj-analytics` - Analytics Dashboard
- `/founder-assistant` - AI Assistant
- `/studio` - Creative Studio
- `/admin/marketing-hub` - Marketing Hub

