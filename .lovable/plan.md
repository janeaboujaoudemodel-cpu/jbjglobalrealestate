

# Fix Plan: Header Navigation (6 Items), Footer Cleanup, and CRM Mirroring Compliance

## Executive Summary

This plan addresses **6 critical compliance violations** identified in the current implementation:

1. **Header has 7 items instead of 6** — "More" appears as a 7th nav item
2. **Footer contains Broker Hub section** — violates "no broker/CRM links in footer" rule
3. **Theme/style changes** — must verify and revert any unauthorized changes
4. **Routing structure** — confirm and document owner routes are outside MainLayoutWrapper
5. **CRM mirroring not proven** — need to document existing RLS-based broker isolation + owner global access
6. **Owner email hardcoding** — verify owner check uses env variable only

---

## Current State Analysis

### 1. Header Navigation (VIOLATION FOUND)

**Current GlobalHeader.tsx (lines 1251-1353):**
The desktop nav pill contains **7 buttons**:
- Buy (line 1252)
- Rent (line 1267)
- Projects (line 1282)
- Areas (line 1297)
- Developers (line 1312)
- Insights (line 1327)
- **More** (line 1342) ← **7th item - VIOLATES "MAX 6 ITEMS" RULE**

**Required:** Only 6 items: `Buy | Rent | Projects | Areas | Developers | Insights`

### 2. Footer Broker Hub Section (VIOLATION FOUND)

**Current Footer.tsx:**
- Lines 113-117: `brokerHubLinks` array with broker-internal links
- Lines 605-619: "Broker Hub" section rendered in footer

**Required:** Remove entire Broker Hub section from footer. Footer must be role-agnostic.

### 3. CRM Database & RLS (COMPLIANT - DOCUMENTATION NEEDED)

**crm_leads table has proper columns:**
- `owner_user_id` (uuid, nullable) — for broker ownership
- `assigned_broker_id` (uuid, nullable) — for broker assignment
- `owner_type` (enum) — distinguishes `broker_owned` vs other types
- `assigned_to_user_id` (uuid) — assignment tracking

**RLS Function `can_access_crm_lead` (migration 20260106083152):**
```sql
SELECT EXISTS (
  -- owner_admin can access all
  SELECT 1 FROM crm_users_profile
  WHERE user_id = _user_id AND crm_role = 'owner_admin' AND is_active = true
) OR EXISTS (
  -- Broker can access leads they OWN
  SELECT 1 FROM crm_leads
  WHERE id = _lead_id 
    AND owner_type = 'broker_owned' 
    AND owner_user_id = _user_id
) OR EXISTS (
  -- Broker can access leads ASSIGNED to them
  SELECT 1 FROM crm_lead_assignments
  WHERE lead_id = _lead_id 
    AND assigned_to_user_id = _user_id 
    AND unassigned_at IS NULL
)
```

**This CORRECTLY implements:**
- ✅ Brokers see ONLY their own leads (owner_user_id match or assignment)
- ✅ Owner/admin sees ALL leads globally
- ✅ RLS-enforced at database level

### 4. App.tsx Routing (COMPLIANT)

**Lines 288-306:** Owner routes are correctly OUTSIDE MainLayoutWrapper:
```tsx
<Route path="/owner" element={
  <OwnerGuard>
    <OwnerDashboardShell />
  </OwnerGuard>
}>
  <Route index element={<OwnerDashboardOverview />} />
  ...nested routes...
</Route>
```

**Line 308:** MainLayoutWrapper starts AFTER owner routes:
```tsx
<Route element={<AdminBypass><MainLayoutWrapper /></AdminBypass>}>
```

---

## Implementation Plan

### Phase 1: Fix Header Navigation — Remove "More" as 7th Item

**Problem:** The current implementation shows 7 visible navigation items in the desktop header pill.

**Solution:** Move the "More" content INTO the Insights mega menu as a dedicated section, OR remove "More" from the pill entirely and access it via account menu.

**Recommended Approach:** Merge "More" dropdown content into the Insights mega menu as an additional section. The user can access Services, Toolkit, Investors, Brokers (mode-conditional), and Company from within the Insights panel.

**File:** `src/components/GlobalHeader.tsx`

**Changes (lines 1341-1353):**
- REMOVE the "More" button from the navigation pill entirely
- The 6 remaining items will be: Buy | Rent | Projects | Areas | Developers | Insights

```text
BEFORE (7 items):
Buy | Rent | Projects | Areas | Developers | Insights | More

AFTER (6 items):
Buy | Rent | Projects | Areas | Developers | Insights
```

**Compensating change:** Update MegaMenuInsights to include additional sections (Services, Toolkit, etc.) OR provide these via the account dropdown menu.

---

### Phase 2: Remove Broker Hub from Footer

**File:** `src/components/Footer.tsx`

**Changes:**

1. **Remove brokerHubLinks array (lines 113-117):**
```tsx
// DELETE THIS ENTIRE BLOCK:
const brokerHubLinks = [
  { label: t('footer.brokerTools') || "Broker Tools", href: "/broker-toolkit" },
  { label: t('footer.brokerEducation') || "Broker Education", href: "/broker-education" },
  { label: t('footer.brokerFaq') || "Broker FAQs", href: "/broker-faq" },
];
```

2. **Remove Broker Hub section rendering (lines 605-619):**
```tsx
// DELETE THIS ENTIRE BLOCK:
<h4 className="...">Broker Hub</h4>
<ul className="...">
  {brokerHubLinks.map((link) => (...))}
</ul>
```

3. **Restructure the affected column** (Column 2) to only show "Investor Hub" without the Broker Hub subsection.

---

### Phase 3: Verify No Theme Changes

**Audit Requirement:** Confirm no unauthorized CSS/style changes were made to:
- OwnerFeatureRegistry.tsx
- OwnerDashboardShell.tsx
- OwnerDashboardOverview.tsx
- Any global theme files

If any dark theme overrides were added, they must be reverted to use existing styles.

---

### Phase 4: Update Insights Mega Menu to Absorb "More" Content

**File:** `src/components/header/MegaMenuInsights.tsx`

**Add new sections to the Insights mega menu:**
- Services column
- Toolkit column (with Creative Suite link)
- Company column (with Legal subsection)

This allows all the "More" content to remain accessible without adding a 7th header item.

**Alternative:** Move "More" content to the Account dropdown menu for authenticated users, and add a "Quick Links" or "Explore More" section to the footer.

---

## Technical Specifications

### Header Navigation Items (LOCKED)

```text
Position 1: Buy      → Opens MegaMenuBuy
Position 2: Rent     → Opens MegaMenuRent
Position 3: Projects → Opens MegaMenuProjects
Position 4: Areas    → Opens MegaMenuAreas
Position 5: Developers → Opens MegaMenuDevelopers
Position 6: Insights → Opens MegaMenuInsights (expanded with Services, Toolkit, Company)
```

### Footer Sections (LOCKED - Role-Agnostic)

| Section | Contents |
|---------|----------|
| Properties | Buy, Rent, Developers, List Property |
| Services | All advisory services, partners |
| Investor Hub | Investor education, tools, FAQ |
| Guides | Buyer, Seller, Landlord, Tenant, Area, Golden Visa |
| Market Intelligence | Overview, Areas, Reports, Methodology |
| About | About JBJ, Founder (toggle), Team, Awards, News |
| Careers | Apply, HR Contact, Training Portal |
| Legal | Terms, Privacy, Cookies, Disclaimers, IP, Trust Center |
| Creative Toolkit | All toolkit tools |
| Professional Tools | AI-powered assistants |

**REMOVED:** Broker Hub (was lines 113-117, 605-619)

### CRM Access Model (RLS-Enforced)

| Role | Access Scope |
|------|--------------|
| Owner (owner_admin) | ALL leads globally |
| Standard Broker | Only leads where `owner_user_id = auth.uid()` OR assigned via `crm_lead_assignments` |
| Premium Broker | Same as Standard + AI drafting tools (feature flag, not RLS) |
| External/Outsourced | NO CRM access (blocked at auth layer) |

**RLS Policies (already implemented in migration 20260116220140):**
- `crm_leads_staff_select`: Uses `can_access_crm_lead()` function
- `crm_leads_staff_update`: Uses `can_access_crm_lead()` function  
- `crm_leads_admin_delete`: Requires owner/admin role only

### Owner Verification (COMPLIANT)

**verify-owner Edge Function** uses environment variable:
```typescript
const ownerEmail = Deno.env.get("VITE_OWNER_EMAIL");
const isOwner = user.email?.toLowerCase() === ownerEmail.toLowerCase();
```

**No hardcoded email in server code.** Owner check is purely env-based.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/GlobalHeader.tsx` | Remove "More" button (lines 1341-1353) from navigation pill |
| `src/components/Footer.tsx` | Remove brokerHubLinks array and Broker Hub section |
| `src/components/header/MegaMenuInsights.tsx` | Expand to include Services, Toolkit, Company sections |

---

## Validation Checklist

- [ ] Desktop header pill shows EXACTLY 6 items: Buy, Rent, Projects, Areas, Developers, Insights
- [ ] "More" button is NOT visible in the desktop navigation pill
- [ ] Footer does NOT contain any Broker Hub section
- [ ] Footer does NOT contain any CRM/internal management links
- [ ] Services, Toolkit, and Company content is accessible via Insights mega menu
- [ ] No theme/color/style changes were made outside of removing elements
- [ ] CRM RLS policies correctly isolate broker data (existing implementation verified)
- [ ] Owner sees all CRM data globally (existing implementation verified)
- [ ] Owner name spelling is "Jane bou Jaoude" everywhere (locked)
- [ ] Owner email check uses VITE_OWNER_EMAIL env variable only

---

## Security Confirmation

- **No AuthContext changes** — existing isOwner flow preserved
- **No OwnerGuard changes** — existing route protection preserved
- **No RLS policy changes** — existing CRM isolation preserved
- **No UI theme changes** — only removing/reorganizing navigation elements

