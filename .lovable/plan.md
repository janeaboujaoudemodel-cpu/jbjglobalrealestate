
# HR Hub Complete Integration & Performance Fixes

## Summary of Issues

Based on your feedback, I've identified the following problems:

| Issue | Location | Status |
|-------|----------|--------|
| CV/CV Collection missing from HR Hub | `HRDashboard.tsx`, `EmbeddedHRDashboard.tsx` | Not integrated |
| Slow section loading | Multiple HR panel components | Performance issue |
| "Customer Happiness Hub" named as just "Hub" | `Admin.tsx` line 496 | Wrong label |
| No CV stats in HR Hub header | `HRDashboard.tsx` stats section | Missing stat |

---

## Technical Implementation Plan

### 1. Add CV Center Tab to HR Hub

**Files to modify:**
- `src/pages/HRDashboard.tsx`
- `src/components/admin/EmbeddedHRDashboard.tsx`

**Changes:**
1. Import `CVCenter` component
2. Add new "CV Center" tab trigger with FileText icon
3. Add TabsContent for CV Center
4. Add CV stats to the header cards (pending CVs, total CVs collected)

```tsx
// New tab in HRDashboard.tsx
<TabsTrigger value="cv-center" className="gap-2 rounded-lg ...">
  <FileText className="h-4 w-4" />
  CV Center
</TabsTrigger>

// New tab content
<TabsContent value="cv-center" className="mt-6">
  <CVCenter userId={user?.id || ''} />
</TabsContent>
```

### 2. Add CV Stats to Header

**Files to modify:**
- `src/hooks/useHRStats.ts`
- `src/pages/HRDashboard.tsx`
- `src/components/admin/EmbeddedHRDashboard.tsx`

**Changes to useHRStats:**
```tsx
// Add CV counts to stats
const { count: pendingCVs } = await supabase
  .from("hr_applications")
  .select("*", { count: "exact", head: true })
  .eq("status", "pending");

const { count: totalCVs } = await supabase
  .from("hr_applications")
  .select("*", { count: "exact", head: true });

// Also count from hr_cv_submissions (chat widget submissions)
const { count: chatCVs } = await supabase
  .from("hr_cv_submissions")
  .select("*", { count: "exact", head: true });
```

**New stat card:**
```tsx
<PremiumStatCard
  title="CVs Collected"
  value={statsLoading ? "..." : String(stats?.totalCVs || 0)}
  subtitle={`${stats?.pendingCVs || 0} pending review`}
  icon={FileText}
  accentColor="amber"
/>
```

### 3. Fix Performance - Parallel Queries & Lazy Loading

**Files to modify:**
- `src/hooks/useHRStats.ts`
- `src/components/admin/EmbeddedHRDashboard.tsx`

**Current issue:** Sequential database queries slow down loading.

**Solution:** Use `Promise.all` for parallel queries:

```tsx
// Before (sequential)
const { count: employeeCount } = await supabase...;
const { count: positionsCount } = await supabase...;
const { count: newHiresCount } = await supabase...;

// After (parallel)
const [employeesResult, positionsResult, hiresResult, cvsResult] = await Promise.all([
  supabase.from("crm_users_profile").select("*", { count: "exact", head: true }).eq("is_active", true),
  supabase.from("hr_job_offers").select("*", { count: "exact", head: true }).eq("is_active", true),
  supabase.from("crm_users_profile").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
  supabase.from("hr_applications").select("*", { count: "exact", head: true }),
]);
```

**Additional optimizations:**
- Add `staleTime: 120000` (2 minutes) to reduce refetching
- Use React.lazy for panel components not immediately visible
- Add loading skeletons for each panel

### 4. Fix Customer Happiness Hub Naming

**File to modify:** `src/pages/Admin.tsx`

**Line 494-497 (current):**
```tsx
<TabsTrigger value="customer-happiness" className="tab-trigger-champagne text-black">
  <Heart className="w-4 h-4 mr-2" />
  Hub
</TabsTrigger>
```

**Change to:**
```tsx
<TabsTrigger value="customer-happiness" className="tab-trigger-champagne text-black">
  <Heart className="w-4 h-4 mr-2" />
  Customer Happiness Hub
</TabsTrigger>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/HRDashboard.tsx` | Add CV Center tab, add CV stat card |
| `src/components/admin/EmbeddedHRDashboard.tsx` | Add CV Center tab, add CV stat card |
| `src/hooks/useHRStats.ts` | Add CV stats queries, optimize with Promise.all |
| `src/pages/Admin.tsx` | Fix "Hub" → "Customer Happiness Hub" (line 496) |

---

## Updated HR Hub Structure After Changes

```text
HR Command Center
├── Stats Row
│   ├── Active Employees
│   ├── Open Positions
│   ├── New Hires
│   ├── CVs Collected (NEW)
│   └── AI Insights
│
├── Tabs
│   ├── Performance
│   ├── Hunting
│   ├── CV Center (NEW) ← Added tab
│   ├── Positions
│   ├── Leave
│   ├── Approvals
│   ├── Warnings
│   ├── Job Offers
│   ├── Payroll
│   ├── Benchmarks
│   ├── LinkedIn
│   └── Competitors
```

---

## Implementation Order

1. **Fix naming** - Change "Hub" to "Customer Happiness Hub" in Admin.tsx
2. **Add CV stats** - Update useHRStats.ts with CV counts and parallel queries
3. **Add CV Center tab** - Update HRDashboard.tsx and EmbeddedHRDashboard.tsx
4. **Performance optimizations** - Add staleTime, lazy loading for panels
5. **Test all tabs** - Verify CV Center loads correctly with real data

---

## Acceptance Criteria

1. HR Hub has "CV Center" tab visible in both standalone and embedded versions
2. Stats section shows "CVs Collected" with pending count
3. CV Center tab loads and displays CVs from `hr_applications` table
4. All tabs load faster (parallel queries instead of sequential)
5. Admin panel tab reads "Customer Happiness Hub" instead of "Hub"
6. No breaking changes to existing HR functionality
