
# Owner Dashboard Command Center - Complete Fix Plan

## Problem Summary

The Owner Dashboard at `/owner` is not displaying the correct layout because:

1. **OwnerDashboardShell exists but is NOT used** - The shell component with sidebar navigation was created but never imported or used in App.tsx routing
2. **All /owner/* routes bypass the sidebar** - Routes render standalone without the command center shell
3. **Dashboard inside global layout** - The owner routes are inside MainLayoutWrapper (with global header/footer), conflicting with the dedicated shell design
4. **Account dropdown works** - The Owner Dashboard shortcut in MegaMenuAccount correctly links to `/owner`, but the destination renders wrong content

---

## Technical Architecture Changes

### 1. Route Structure Refactoring

**Current problematic structure:**
```
MainLayoutWrapper
  └── /owner → OwnerDashboardOverview (no sidebar!)
  └── /owner/inbox → OwnerInbox (no sidebar!)
  └── /owner/audit → OwnerAuditPage (no sidebar!)
  └── etc.
```

**New correct structure:**
```
OwnerDashboardShell (with sidebar + top bar)
  └── /owner → OwnerDashboardOverview (via Outlet)
  └── /owner/inbox → OwnerInbox (via Outlet)
  └── /owner/audit → OwnerAuditPage (via Outlet)
  └── /owner/integrations → OwnerIntegrationsPage (via Outlet)
  └── /owner/safety → OwnerSafetyPage (via Outlet)
  └── /owner/templates → OwnerTemplates (via Outlet)
  └── /owner/settings/communication → OwnerCommSettings (via Outlet)
  └── /owner/agenda → OwnerAgenda (via Outlet)
  └── /owner/features → OwnerFeatureRegistry (via Outlet)
  └── /owner/properties → PropertyManagement (via Outlet)
  └── /owner/documents → Documents (via Outlet)
```

---

### 2. App.tsx Routing Changes

**File: `src/App.tsx`**

**Changes required:**
- Import `OwnerDashboardShell`
- Create a dedicated route block for `/owner/*` routes OUTSIDE MainLayoutWrapper
- Use nested routes with parent shell and child pages via Outlet
- Keep OwnerGuard on the parent shell (covers all children)

**New route block (to be added before MainLayoutWrapper routes):**
```tsx
{/* Owner Command Center - Dedicated shell without global header/footer */}
<Route path="/owner" element={
  <OwnerGuard>
    <OwnerDashboardShell />
  </OwnerGuard>
}>
  <Route index element={<OwnerDashboardOverview />} />
  <Route path="inbox" element={<OwnerInbox />} />
  <Route path="templates" element={<OwnerTemplates />} />
  <Route path="settings/communication" element={<OwnerCommSettings />} />
  <Route path="agenda" element={<OwnerAgenda />} />
  <Route path="features" element={<OwnerFeatureRegistry />} />
  <Route path="audit" element={<OwnerAuditPage />} />
  <Route path="integrations" element={<OwnerIntegrationsPage />} />
  <Route path="safety" element={<OwnerSafetyPage />} />
  <Route path="properties" element={<OwnerProperties />} />
  <Route path="documents" element={<OwnerDocuments />} />
</Route>
```

---

### 3. OwnerDashboardOverview Cleanup

**File: `src/pages/OwnerDashboardOverview.tsx`**

**Changes:**
- Remove the outer wrapper `div className="min-h-screen bg-black"` (shell provides this)
- Remove the container padding (shell provides `<div className="p-6">`)
- Simplify to just the content that goes inside the shell

---

### 4. OwnerDashboardShell Enhancements

**File: `src/pages/OwnerDashboardShell.tsx`**

**Current state:** The shell already has the sidebar navigation component, but needs minor improvements:

**Enhancements:**
- Mobile responsive sidebar (hamburger menu on small screens)
- Add keyboard shortcut indicator for toggling sidebar
- Ensure sticky top bar works correctly with scrolling content

---

### 5. UI/Layout Polish

**Global styling checks:**
- All cards use `bg-zinc-900/80 border-zinc-800` base
- Hover states use `hover:border-gold/40`
- KPI tiles are clickable with `cursor-pointer`
- Icons are 24px (w-6 h-6) standard size
- Proper spacing: `gap-4` between cards, `mb-6` between sections
- Text colors: `text-white` for titles, `text-zinc-400` for secondary

---

### 6. Button Functionality Verification

All navigation buttons in QuickActionsGrid and DepartmentShortcuts use `navigate()`:

| Component | Button | Target Route |
|-----------|--------|--------------|
| QuickActionsGrid | + Add Lead | `/crm?action=new-lead` |
| QuickActionsGrid | Calendar | `/crm/calendar` |
| QuickActionsGrid | Property Map | `/map` |
| QuickActionsGrid | AI Assistant | `/founder-assistant` |
| QuickActionsGrid | Studio | `/studio` |
| QuickActionsGrid | Automations | `/automations` |
| QuickActionsGrid | Analytics | `/jbj-analytics` |
| QuickActionsGrid | Marketing | `/admin/marketing-hub` |
| DepartmentShortcuts | CRM Dashboard | `/crm` |
| DepartmentShortcuts | HR Dashboard | `/hr-dashboard` |
| DepartmentShortcuts | IT Department | `/it-department` |
| DepartmentShortcuts | Employee Hub | `/employee-hub` |
| DepartmentShortcuts | Listing Admin | `/listing-admin` |
| DepartmentShortcuts | Security Console | `/owner/safety` |
| KPI Tiles | Total Leads | `/crm/leads` |
| KPI Tiles | New This Week | `/crm/leads?filter=new` |
| KPI Tiles | Pending Tasks | `/crm/tasks` |
| KPI Tiles | Active Chats | `/owner/inbox` |

---

## Files to Modify

1. **`src/App.tsx`**
   - Import `OwnerDashboardShell`
   - Move all `/owner/*` routes to dedicated block with shell parent
   - Remove duplicate route definitions from MainLayoutWrapper block

2. **`src/pages/OwnerDashboardShell.tsx`**
   - Add mobile responsive hamburger menu
   - Minor styling improvements

3. **`src/pages/OwnerDashboardOverview.tsx`**
   - Remove outer min-h-screen wrapper
   - Remove container padding (shell provides it)
   - Simplify to content-only

4. **`src/components/owner-dashboard/OwnerSidebarNav.tsx`**
   - Verify all route paths are correct
   - Add any missing navigation items

---

## Additional Pages to Create

For complete coverage, these placeholder pages may need creation:

- `/owner/properties` - Owner-specific property management view
- `/owner/documents` - Owner document vault

---

## Security Considerations

- OwnerGuard remains on the parent shell route (single check covers all children)
- No changes to RLS policies
- No changes to edge function verify-owner
- The useOwnerVerification hook continues working via edge function

---

## Expected Result

After implementation:
1. User clicks "Owner Dashboard" in account dropdown
2. Navigates to `/owner`
3. **NEW BEHAVIOR:** Full-screen Owner Command Center appears with:
   - Left sidebar with 7 organized sections (25+ links)
   - Top bar with "Owner Command Center" title and Owner badge
   - Main content area showing KPI tiles, Quick Actions, Leads, Follow-ups, etc.
4. All sidebar navigation links work
5. All Quick Action buttons work
6. All KPI tiles are clickable
7. Premium black/gold/champagne theme throughout
