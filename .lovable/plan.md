

# Fix: Insights Mega Menu FAQ Distribution + New Projects Detection

## Change 1: Redistribute FAQs in MegaMenuInsights

**File:** `src/components/header/MegaMenuInsights.tsx`

**Current problem:** The Guides card has 11 items (including Buyer FAQ, Seller FAQ, Landlord FAQ, Tenant FAQ), making it visually taller than the other cards.

**Changes:**
- Remove "Landlord FAQ" and "Tenant FAQ" from `guidesLinks` (lines 52-53)
- Keep "Buyer FAQ" and "Seller FAQ" in Guides (they pair with Buyer/Seller Guides)
- Add `{ label: 'Landlord FAQ', href: '/landlord-faq', icon: HelpCircle }` to `investorLinks` (after line 79)
- Add `{ label: 'Tenant FAQ', href: '/tenant-faq', icon: HelpCircle }` to `brokerLinks` (after line 86)

**Result:**
- Guides: 9 items (down from 11)
- investorLinks: 4 items (Investor Dashboard, Investor Education, Investor FAQ, Landlord FAQ)
- brokerLinks: 5 items (Broker Dashboard, Broker Hub, Broker Training, Broker FAQ, Tenant FAQ)

---

## Change 2: New Project Detector -- Show Only Truly New Projects

**File:** `src/components/listing-admin/NewProjectDetector.tsx`

**Current problem:** Uses 24-hour filter and slug-based matching, showing duplicates and missing older new projects.

**Changes:**
- Remove the 24-hour time filter (delete `oneDayAgo` and `.gte()` clause)
- Query ALL pending imports (increase limit from 50 to 500)
- Match by `reelly_id` column directly (both `pending_project_imports` and `projects` have `reelly_id` integer columns)
- Filter out any imports whose `reelly_id` exists in the `projects` table
- Remove the "EXISTING" badge and related UI -- only show genuinely new projects
- Update the header text from "Detected Today" to "New Projects from Reelly"
- Simplify the interface: remove `existsOnWebsite` and `existingProjectId` fields since we only show new ones

**Database verification:** Confirmed 7 truly new projects exist (reelly_ids: 3239, 3241, 3243, 3242, 3227, 2985, 3244).

---

## Technical Summary

| File | Change |
|------|--------|
| `src/components/header/MegaMenuInsights.tsx` | Remove Landlord FAQ and Tenant FAQ from guidesLinks (lines 52-53); add Landlord FAQ to investorLinks (after line 79); add Tenant FAQ to brokerLinks (after line 86) |
| `src/components/listing-admin/NewProjectDetector.tsx` | Remove 24h filter; match by reelly_id not slug; show only truly new projects (7 found); remove EXISTING badge |

