
# Comprehensive CRM & Navigation Enhancement Plan

## Executive Summary

This plan addresses multiple interconnected requirements:
1. **Merge Owner Dashboard and CRM** into a unified premium CRM system
2. **Fix Header Navigation (Insights Menu)** - Add mode-conditional content, careers, legal, guides, market intelligence
3. **Fix Mode Switcher Dropdown** - Prevent immediate closing on click
4. **Fix CRM Layout Issues** - Text overflow, responsive breakpoints, card containment
5. **Replace Yellow Gold Active Button Color** - Use champagne gradient instead

---

## Part 1: Unified CRM Architecture

### Current State
- **Owner Dashboard** (`/owner`): Dark theme (bg-black, zinc-950), KPI tiles, quick actions, leads, follow-ups, department shortcuts
- **CRM** (`/crm`): Champagne theme, tabs-based layout, leads table, Kanban, employees hub
- **Admin CRM** (`/admin/crm`): Light champagne theme, broker management, audit logs

### Proposed Unified Structure
Merge functionality while preserving the Owner Dashboard's premium dark UI style:

**Route Structure:**
- `/owner` → Unified Owner CRM Command Center (dark theme)
  - Combines KPI tiles, quick actions, leads management, broker oversight, audit logs
  - All CRM tabs integrated (All Leads, Flagged, VIP, Employees Hub, Brokers, Audit)
  - Owner-only features: Broker management, global view, audit logs
- `/crm` → Broker-level CRM (champagne theme for brokers, redirects owners to `/owner`)
  - Brokers see their isolated workspace
  - Limited to their assigned leads

### Key Changes

**File: `src/pages/OwnerDashboardOverview.tsx`**
- Add tabs for: Overview, Leads, Employees, Brokers, Audit Logs
- Integrate `CRMLeadsTableV2`, `FlaggedLeadsView`, `EmployeesHub`
- Add broker management section (from AdminCRM.tsx)
- Add audit logs tab

**File: `src/pages/CRM.tsx`**
- Add check: if `isOwner`, redirect to `/owner`
- Keep for broker-level users only

---

## Part 2: Header Navigation Fixes (MegaMenuInsights)

### Current Issues
1. "Market Intel" should be "Market Intelligence" (full text)
2. Missing Guides section with all guide pages
3. Missing mode-conditional content (Investor vs Broker sections)
4. Missing Careers and Legal as distinct sections
5. Large gap at bottom needs better spacing

### Proposed Structure for MegaMenuInsights

**7-Column Layout with Mode-Conditional Content:**

| Column | Section | Links |
|--------|---------|-------|
| 1 | News & Updates | Latest News, Market Updates, Company News, Press Releases |
| 2 | **Market Intelligence** (full text) | Market Overview, Area Intelligence, Market Reports, Methodology |
| 3 | Guides (expanded) | Guides Library, Buyer Guide, Seller Guide, Landlord Guide, Tenant Guide, Investor Education, FAQ, Golden Visa |
| 4 | Toolkit | All Tools, Creative Suite, ROI Calculator, Mortgage Calculator, Compare Properties, Property Map |
| 5 | **Mode-Conditional** | **Investor Mode**: Investor Dashboard, Investor Tools, Investor Guides, Investor Hub. **Broker Mode**: Broker Dashboard, Broker Tools, Broker Training, Certifications. **Both Mode**: All links |
| 6 | Company | About JBJ, Founder (conditional), Meet the Team, Contact, **Careers** |
| 7 | Legal | Terms, Privacy, Cookies, Disclaimers, IP, Trust Center |

### File Changes

**File: `src/components/header/MegaMenuInsights.tsx`**
```tsx
// Key changes:
// 1. Rename "Market Intel" → "Market Intelligence"
<MegaMenuSectionTitle icon={BarChart3} title="Market Intelligence" />

// 2. Expand Guides section with all guides
const guidesLinks = [
  { label: 'Guides Library', href: '/guides', icon: BookOpen },
  { label: 'Buyer Guide', href: '/buyer-guide', icon: FileText },
  { label: 'Seller Guide', href: '/seller-guide', icon: FileText },
  { label: 'Landlord Guide', href: '/landlord-guide', icon: FileText },
  { label: 'Tenant Guide', href: '/tenant-guide', icon: FileText },
  { label: 'Rent Guide', href: '/rent-guide', icon: FileText },
  { label: 'Golden Visa', href: '/guides/golden-visa-uae', icon: Award },
  { label: 'FAQ', href: '/faq', icon: HelpCircle },
];

// 3. Add mode-conditional section
const { isInvestorMode, isBrokerMode, isCombinedMode } = useUserModeContext();

const investorLinks = [
  { label: 'Investor Dashboard', href: '/investor-dashboard', icon: LayoutDashboard },
  { label: 'Investor Education', href: '/investor-education', icon: GraduationCap },
  { label: 'Investor FAQ', href: '/investor-faq', icon: HelpCircle },
  { label: 'Investor Services', href: '/investor-services', icon: Briefcase },
];

const brokerLinks = [
  { label: 'Broker Dashboard', href: '/broker-dashboard', icon: LayoutDashboard },
  { label: 'Broker Training', href: '/broker-education', icon: GraduationCap },
  { label: 'Certifications', href: '/verify-certificate', icon: Award },
  { label: 'Broker FAQ', href: '/broker-faq', icon: HelpCircle },
  { label: 'Broker Resources', href: '/broker-resources', icon: FolderOpen },
];

// 4. Separate Careers and Legal sections
const companyLinks = [
  { label: 'About JBJ', href: '/about', icon: Building2 },
  ...(isFounderVisible ? [{ label: 'Founder & Leadership', href: '/founder', icon: UserCircle }] : []),
  { label: 'Meet the Team', href: '/team', icon: Users },
  { label: 'Contact Us', href: '/contact', icon: Phone },
];

const careersLinks = [
  { label: 'Careers', href: '/join', icon: Briefcase },
  { label: 'Apply Now', href: '/join-application', icon: FileText },
];
```

---

## Part 3: Fix Mode Switcher Dropdown Closing Issue

### Current Issue
The mode switcher dropdown in MegaMenuAccount.tsx closes immediately when clicking on a mode option because the parent mega menu is also handling clicks.

### Root Cause
The ModeSwitcher is inside MegaMenuAccount, and when clicking on a mode option, the event propagates to parent handlers that close the menu.

### Solution

**File: `src/components/ModeSwitcher.tsx`**
The hardening already exists (lines 95-97, 125-128) with `e.preventDefault()`, `e.stopPropagation()`, and `onPointerDown` handlers. The issue may be the parent container not stopping propagation properly.

**File: `src/components/header/MegaMenuAccount.tsx`**
Add additional event isolation around the ModeSwitcher component:

```tsx
// Line 184-185, wrap ModeSwitcher
<div 
  onClick={(e) => e.stopPropagation()} 
  onPointerDown={(e) => e.stopPropagation()}
  onMouseDown={(e) => e.stopPropagation()}
>
  <ModeSwitcher variant="header" />
</div>
```

---

## Part 4: Fix CRM Layout Issues

### Current Issues
1. Text overflows card boundaries
2. Content breaks at certain screen widths
3. Smaller screens work, larger screens break

### Root Causes
- Fixed max-width containers not responding to viewport
- Missing `overflow-hidden` on cards
- Missing `truncate` on text elements
- Grid gaps causing overflow at breakpoints

### File Changes

**File: `src/pages/CRM.tsx`**

```tsx
// Line 343: Change max-width to be responsive
<div className="max-w-[1600px] w-full mx-auto px-4 md:px-6 py-3">

// Line 429: Fix main content area
<main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-6 py-8 space-y-6 overflow-hidden">

// Line 439: Fix grid to prevent overflow
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
```

**File: `src/components/crm/CRMDashboardCards.tsx`**

```tsx
// Line 254: Add overflow handling
<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 md:gap-3 overflow-hidden">

// Line 260-261: Fix card title overflow
<CardTitle className="text-xs font-semibold text-black truncate max-w-[80px] md:max-w-none">
```

**File: `src/components/crm/CRMEnhancedDashboard.tsx`**

```tsx
// Line 225-226: Add overflow to card container
<Card key={index} className="border-zinc-200 bg-white shadow-md overflow-hidden">

// Line 234-239: Fix value display
<div className="text-xl md:text-2xl font-bold text-zinc-900 truncate">
```

---

## Part 5: Replace Yellow Gold Active Button Color

### Current Issue
Active tab buttons use `data-[state=active]:bg-gold` which creates a bright yellow/gold background. User wants to use the same champagne gradient color as the KPI cards.

### Current KPI Card Style (to match)
From `CRMDashboardCards.tsx` line 258:
```tsx
bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]
```

### Files to Update (38 files have this pattern)

**Global Fix - Update TabsTrigger styling across all files:**

Replace:
```tsx
className="data-[state=active]:bg-gold data-[state=active]:text-black text-black"
```

With:
```tsx
className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border data-[state=active]:border-gold/40 text-black"
```

**Key Files to Update:**
1. `src/pages/CRM.tsx` (lines 580, 587, 597, 604)
2. `src/pages/AdminCRM.tsx` (lines 326, 330, 334)
3. `src/components/account/InvestorDashboard.tsx` (lines 321, 324, 327, 330)
4. All other 35 files with this pattern

**Alternative Approach - Create Reusable Style:**
Create a CSS custom class in `src/index.css`:

```css
.tab-trigger-champagne {
  @apply data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border data-[state=active]:border-gold/40;
}
```

Then replace all instances with:
```tsx
className="tab-trigger-champagne text-black"
```

---

## Part 6: View Mode Toggle Fix

The view mode toggle (Table/Kanban) on line 562-568 of CRM.tsx also uses `bg-gold` for active state:

```tsx
// Current (line 562):
className={`p-2 rounded transition-all ${viewMode === "table" ? "bg-gold text-black" : "text-black hover:bg-gold/10"}`}
```

**Replace with:**
```tsx
className={`p-2 rounded transition-all ${viewMode === "table" 
  ? "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 text-black" 
  : "text-black hover:bg-gold/10"}`}
```

---

## Implementation Order

1. **Phase 1: Active Color Fix** (Quick Win)
   - Replace `bg-gold` active states with champagne gradient
   - Update ~38 files with TabsTrigger pattern
   - Update view mode toggles

2. **Phase 2: CRM Layout Fixes** (High Priority)
   - Add overflow handling to cards
   - Fix responsive grid breakpoints
   - Add truncate to text elements

3. **Phase 3: Header Navigation** (Medium Priority)
   - Expand MegaMenuInsights with full content
   - Add mode-conditional sections
   - Add "Market Intelligence" full text
   - Add all guides, careers, legal

4. **Phase 4: Mode Switcher Fix** (Quick Fix)
   - Add event isolation wrapper in MegaMenuAccount

5. **Phase 5: CRM Merge** (Largest Scope)
   - Enhance OwnerDashboardOverview with CRM tabs
   - Add broker management
   - Add audit logs
   - Redirect owners from /crm to /owner

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/header/MegaMenuInsights.tsx` | Expand content, mode-conditional, full Market Intelligence text |
| `src/components/header/MegaMenuAccount.tsx` | Event isolation for ModeSwitcher |
| `src/pages/CRM.tsx` | Layout fixes, active color, responsive grid |
| `src/pages/AdminCRM.tsx` | Active color fix |
| `src/components/crm/CRMDashboardCards.tsx` | Overflow, truncate, responsive |
| `src/components/crm/CRMEnhancedDashboard.tsx` | Overflow fixes |
| `src/pages/OwnerDashboardOverview.tsx` | Merge CRM functionality |
| `src/index.css` | Add `.tab-trigger-champagne` utility class |
| 35+ additional files | Replace `bg-gold` active state |

---

## Compliance Verification

- **Owner name lock**: "Jane bou Jaoude" spelling preserved
- **UI theme/colors**: Only changing active button color from yellow-gold to champagne gradient (user requested)
- **No orphan routes**: All routes remain functional
- **No broken hooks**: No hook order changes
- **6 header items**: Buy, Rent, Projects, Areas, Developers, Insights (unchanged)
- **Footer role-agnostic**: No changes to footer

---

## Security Notes

- No RLS policy changes
- No AuthContext changes
- No OwnerGuard changes
- CRM access model unchanged (owner_admin sees all, brokers see own leads)
