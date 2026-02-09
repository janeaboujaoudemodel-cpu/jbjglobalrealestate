

## Summary

You have identified three issues that need to be fixed:

1. **Duplicate "Support Tickets" tab in Admin Panel** - The "Support Tickets" tab is already included inside the "Customer Happiness" Hub as a sub-tab, so the separate "Support Tickets" tab should be removed from the main Admin tabs.

2. **Rename "Customer Happiness" to "Customer Happiness Hub"** - The tab should be named "Hub" or "Customer Happiness Hub" for consistency.

3. **"Ticket Support Hub" link in header account dropdown not working** - When clicking "Ticket Support Hub" in the account dropdown, it opens the Admin Panel but stays on the Overview tab instead of switching to Customer Happiness. This is because the Admin page doesn't read the `?tab=` URL parameter.

---

## Implementation Steps

### Step 1: Fix the URL Tab Parameter Reading in Admin Page

The Admin page currently ignores the `?tab=customer-happiness` URL parameter because it uses a hardcoded `defaultValue="overview"`. 

**File: `src/pages/Admin.tsx`**

Add `useSearchParams` import and use it to read the tab parameter:

```tsx
import { useNavigate, useSearchParams } from "react-router-dom";

// Inside the component:
const [searchParams] = useSearchParams();
const tabFromUrl = searchParams.get("tab");

// Then use controlled Tabs:
<Tabs value={activeTab} onValueChange={setActiveTab} ...>
```

This ensures that `/admin?tab=customer-happiness` opens directly to Customer Happiness.

---

### Step 2: Remove Duplicate "Support Tickets" Tab from Admin

Since Support Tickets is already embedded inside Customer Happiness Hub (as a sub-tab at line 329-331), the separate "Support Tickets" tab in the main Admin TabsList is redundant.

**File: `src/pages/Admin.tsx`**

Remove lines 489-492 (TabsTrigger) and lines 570-574 (TabsContent):
- Remove: `<TabsTrigger value="support-tickets" ...>Support Tickets</TabsTrigger>`
- Remove: `<TabsContent value="support-tickets">...</TabsContent>`

---

### Step 3: Rename Tab and Header Link

**File: `src/pages/Admin.tsx`**
- Change "Customer Happiness" tab label to "Customer Happiness Hub" (or just "Hub")

**File: `src/components/header/MegaMenuAccount.tsx`**
- Rename "Ticket Support Hub" to "Customer Happiness Hub" (lines 362-365)
- Update subtitle from "Manage customer tickets" to "Reviews, Tickets & Ideas"

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` | Add URL tab parameter handling, remove "Support Tickets" tab (duplicate), rename "Customer Happiness" to "Customer Happiness Hub" |
| `src/components/header/MegaMenuAccount.tsx` | Rename "Ticket Support Hub" to "Customer Happiness Hub", update subtitle |

---

## Expected Result

After these changes:
1. Clicking "Customer Happiness Hub" in the header account dropdown will open `/admin?tab=customer-happiness` and land directly on the Customer Happiness Hub tab
2. The Admin Panel will have no duplicate "Support Tickets" tab - tickets are managed inside Customer Happiness Hub
3. The naming will be consistent: "Customer Happiness Hub" everywhere

