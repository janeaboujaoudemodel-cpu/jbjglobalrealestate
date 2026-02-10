
# Fix: Insights Mega Menu FAQ Distribution + New Projects Detection

## Two Issues to Fix

---

## 1. Redistribute FAQs from Guides Card to Investor/Broker Hub Cards

**Problem:** The Guides card in MegaMenuInsights currently has 11 links (including General FAQ, Buyer FAQ, Seller FAQ, Landlord FAQ, Tenant FAQ), making it much taller than the other cards in the 4-column grid.

**Fix:** Move role-specific FAQs out of the Guides card and into the mode-conditional sections:

- **Guides card** keeps: Guides Library, Buyer Guide, Seller Guide, Landlord Guide, Tenant Guide, Golden Visa, FAQ (general)
  - Remove: Buyer FAQ, Seller FAQ, Landlord FAQ, Tenant FAQ (4 items removed, from 11 down to 7)

- **Investor Tools section** (investorLinks): Add "Landlord FAQ" link alongside the existing "Investor FAQ"
- **Broker Tools section** (brokerLinks): Add "Tenant FAQ" link alongside the existing "Broker FAQ"
- **Buyer FAQ and Seller FAQ**: Move into the Services card (since buying/selling is a service) -- or add them to the Guides card renamed items. Actually, the cleanest approach: keep Buyer FAQ and Seller FAQ in Guides since they relate to guides, and move Landlord FAQ and Tenant FAQ to the mode-conditional sections.

Wait -- the user said specifically:
- Investor Hub: Investor FAQ + Landlord FAQ
- Broker Hub: Broker FAQ + Tenant FAQ

So the investorLinks already has Investor FAQ. Add Landlord FAQ there.
The brokerLinks already has Broker FAQ. Add Tenant FAQ there.
Remove Buyer FAQ, Seller FAQ, Landlord FAQ, Tenant FAQ from the Guides card.
Buyer FAQ and Seller FAQ should go somewhere -- they can stay in Guides since Buyer Guide and Seller Guide are already there. That keeps it cleaner.

Actually re-reading: user said "distribute it next to the investor" and "broker hub you will put broker FAQ and tenant FAQ". He wants Landlord FAQ with investor, Tenant FAQ with broker. Buyer FAQ and Seller FAQ can stay in Guides.

**Final distribution:**
- **Guides card**: Guides Library, Buyer Guide, Seller Guide, Landlord Guide, Tenant Guide, Golden Visa, FAQ (general), Buyer FAQ, Seller FAQ (9 items -- down from 11)
- **investorLinks**: Investor Dashboard, Investor Education, Investor FAQ, Landlord FAQ (4 items)
- **brokerLinks**: Broker Dashboard, Broker Hub, Broker Training, Broker FAQ, Tenant FAQ (5 items)

**File:** `src/components/header/MegaMenuInsights.tsx`

---

## 2. New Project Detector -- Show Only Truly New Projects

**Problem:** The `NewProjectDetector` component checks `pending_project_imports` from the last 24 hours against `projects.slug`. But the user wants to see ALL new projects from Reelly that haven't been approved yet (not just last 24 hours), and only the ones that are genuinely missing from the projects table (no duplicates).

There are currently **7 truly new projects** in the Reelly queue that don't exist in the projects table (identified by matching `reelly_id`).

**Fix:** Update `NewProjectDetector.tsx` to:
1. Remove the 24-hour time filter -- check ALL pending Reelly imports
2. Cross-reference by `reelly_id` (extracted from source_url) against the `projects.reelly_id` column instead of slug matching
3. Show only projects that are NOT in the projects table (truly new)
4. Remove the "EXISTING" badge -- only show NEW projects since we filter them out
5. Increase the limit from 50 to 500 to catch all pending items

**File:** `src/components/listing-admin/NewProjectDetector.tsx`

---

## Technical Summary

| File | Change |
|------|--------|
| `src/components/header/MegaMenuInsights.tsx` | Remove Landlord FAQ and Tenant FAQ from guidesLinks; add Landlord FAQ to investorLinks; add Tenant FAQ to brokerLinks |
| `src/components/listing-admin/NewProjectDetector.tsx` | Remove 24h filter; match by reelly_id not slug; show only truly new projects (not already in projects table) |
