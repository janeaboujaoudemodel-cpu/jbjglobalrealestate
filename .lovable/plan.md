

## CRM & Admin Backend Deep Audit Fix Plan

### Issues Found

1. **Lead count mismatch**: Owner dashboard queries (`owner-kpi-total-leads`, `owner-kpi-new-leads-week`, `owner-newest-leads`) do NOT filter `deleted_at IS NULL`, so soft-deleted leads inflate counts and appear in "Newest Leads"
2. **LeadRow missing phone**: The `LeadRow` component in `OwnerDashboardOverview.tsx` shows email but never renders `phone_e164`
3. **CRM tabs not centered**: `TabsTrigger` elements use `px-5 py-2.5` but the `TabsList` uses `p-1.5` causing asymmetric padding (more top than bottom)
4. **Status badge "New" too wide**: `LeadStatusBadge` uses `px-3.5 py-1.5` even for short words like "New", making the pill disproportionately long
5. **CRMLeadsTableV2 status dropdown is a raw HTML `<select>`** with emoji optgroup labels and browser-default styling -- not matching the champagne theme
6. **LeadQuickFilters** use white/zinc/blue backgrounds instead of champagne theme
7. **Owner dashboard cards** use `bg-white/70` instead of champagne gradient
8. **Owner dashboard tabs** use `bg-white/80` instead of champagne gradient

### Plan

#### 1. Fix lead count synchronization (OwnerDashboardOverview.tsx)
- Add `.is('deleted_at', null)` to ALL lead queries:
  - `owner-kpi-total-leads` (line 280)
  - `owner-kpi-new-leads-week` (line 296)
  - `owner-newest-leads` (line 349)

#### 2. Show phone in LeadRow (OwnerDashboardOverview.tsx)
- Add phone display between name and source badge in the `LeadRow` component (line 120-131)
- Show phone icon + number when `lead.phone_e164` exists

#### 3. Fix CRM tab centering (CRM.tsx)
- Change `TabsList` padding from `p-1.5` to `p-2` for balanced vertical padding
- Ensure `TabsTrigger` uses equal `py-2.5` on all sides

#### 4. Fix "New" status badge width (LeadStatusBadge.tsx)
- Reduce `sm` size from `px-2.5` to `px-2` and `md` from `px-3.5` to `px-3`
- Remove `min-w` constraints that cause oversized pills for short labels

#### 5. Replace raw `<select>` in CRMLeadsTableV2 with InlineStatusSelect
- Replace the native HTML `<select>` dropdown (lines 436-472) with the existing `InlineStatusSelect` component which already has proper champagne styling
- This fixes: gray background, blue highlights, emoji optgroups, browser-default styling

#### 6. Normalize LeadQuickFilters to champagne theme
- Replace white/zinc/blue color scheme with champagne gradients
- Active state uses gold ring + champagne gradient background
- Text stays black for contrast

#### 7. Normalize Owner Dashboard to champagne theme
- Replace `bg-white/70` and `bg-white/80` with champagne gradient on Cards and TabsList
- Replace `border-[#C9A84C]/30` with `border-gold/30` for consistency

#### 8. Newsletter phone field already present
- The newsletter already collects full name and phone -- verified in code. The issue is historical leads captured before these fields were added. No code change needed here.

### Files to change
- `src/pages/OwnerDashboardOverview.tsx` -- deleted_at filter, phone display, champagne theme
- `src/components/crm/CRMLeadsTableV2.tsx` -- replace `<select>` with `InlineStatusSelect`
- `src/components/crm/LeadStatusBadge.tsx` -- reduce padding for compact badges
- `src/components/crm/LeadQuickFilters.tsx` -- champagne theme
- `src/pages/CRM.tsx` -- tab centering fix

