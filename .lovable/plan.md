

## Fix Duplicate Header Issue

### Problem Identified

The header appears twice because:

1. **MainLayout renders GlobalHeader**: All routes under `MainLayoutWrapper` automatically get the `GlobalHeader` from `MainLayout.tsx` (line 201)

2. **9 pages render GlobalHeader directly**: These pages import and render `GlobalHeader` within their own component, causing a second header

### Affected Files

| File | Line | Issue |
|------|------|-------|
| `src/pages/LandlordListForm.tsx` | 6, 105 | Imports and renders GlobalHeader |
| `src/pages/RequestValuation.tsx` | 6, 108 | Imports and renders GlobalHeader |
| `src/pages/JoinInvestorList.tsx` | 6, 100 | Imports and renders GlobalHeader |
| `src/pages/partners/PartnerCompanySetup.tsx` | 19, 85 | Imports and renders GlobalHeader |
| `src/pages/Disclaimers.tsx` | 4, 91 | Imports and renders GlobalHeader |
| `src/pages/InvestorServices.tsx` | 5, 131 | Imports and renders GlobalHeader |
| `src/pages/ThankYou.tsx` | 6, 140 | Imports and renders GlobalHeader |
| `src/pages/SellWithUs.tsx` | 5, 94 | Imports and renders GlobalHeader |
| `src/pages/Reviews.tsx` | 5, 94 | Imports and renders GlobalHeader |

---

### Solution

Remove the `GlobalHeader` import and JSX usage from all 9 affected page components. The header is already provided by `MainLayout` through the route wrapper.

---

### Implementation Details

For each file, we need to:

1. **Remove the import statement**:
```tsx
// REMOVE this line:
import GlobalHeader from "@/components/GlobalHeader";
```

2. **Remove the JSX element**:
```tsx
// REMOVE this line:
<GlobalHeader />
```

---

### Changes Summary

| File | Action |
|------|--------|
| `src/pages/LandlordListForm.tsx` | Remove import (line 6) + JSX (line 105) |
| `src/pages/RequestValuation.tsx` | Remove import (line 6) + JSX (line 108) |
| `src/pages/JoinInvestorList.tsx` | Remove import (line 6) + JSX (line 100) |
| `src/pages/partners/PartnerCompanySetup.tsx` | Remove import (line 19) + JSX (line 85) |
| `src/pages/Disclaimers.tsx` | Remove import (line 4) + JSX (line 91) |
| `src/pages/InvestorServices.tsx` | Remove import (line 5) + JSX (line 131) |
| `src/pages/ThankYou.tsx` | Remove import (line 6) + JSX (line 140) |
| `src/pages/SellWithUs.tsx` | Remove import (line 5) + JSX (line 94) |
| `src/pages/Reviews.tsx` | Remove import (line 5) + JSX (line 94) |

---

### Why This Happened

These pages were likely created before the centralized `MainLayout` pattern was established, or they were copied from a template that included the header. Per the architecture memory (`architecture/centralized-footer-and-cta-logic-v1`), all global UI elements (Header, Footer, CTA) should be rendered exclusively in `MainLayout.tsx`.

---

### Result

After this fix:
- Only ONE header will appear on all pages
- Consistent header behavior across the entire site
- Proper transparent/solid header transitions based on scroll

**Total Files Modified**: 9

