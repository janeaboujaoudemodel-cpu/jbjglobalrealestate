

# Remaining Incomplete Tasks -- Final Audit

After a thorough code audit, here are all the tasks that are still NOT done or only partially done:

---

## Task 1: Financial Disclaimer Missing on AIROICalculatorPremium

**Problem:** The compliance rule explicitly names "ROI Calculators" as requiring the gold-styled disclaimer link. `AIROICalculatorPremium.tsx` calls `AIToolPremiumLayout` WITHOUT the `showFinancialDisclaimer` prop (line 84-91). This is a financial/investment tool that calculates returns -- it absolutely needs the disclaimer.

**Fix:** Add `showFinancialDisclaimer` prop to the `AIToolPremiumLayout` call in `AIROICalculatorPremium.tsx`.

**File:** `src/components/ai-tools/premium/AIROICalculatorPremium.tsx` (line ~90, add `showFinancialDisclaimer`)

---

## Task 2: Financial Disclaimer Missing on AIContractReviewerPremium

**Problem:** `AIContractReviewerPremium.tsx` has a red legal disclaimer card but does NOT have the mandatory gold-styled "Contact our team for professional guidance" link that redirects to `/contact`. The existing disclaimer says "consult a qualified legal professional" but doesn't link to the contact page as required.

**Fix:** Add `showFinancialDisclaimer` prop to its `AIToolPremiumLayout` call (line ~74-81).

**File:** `src/components/ai-tools/premium/AIContractReviewerPremium.tsx` (line ~80, add `showFinancialDisclaimer`)

---

## Task 3: Golden Visa Wording -- "Get Your Golden Visa" on Homepage

**Problem:** The compliance memory states Golden Visa eligibility must be described as "eligible to apply". The `ExploreServicesCard.tsx` homepage card (line 100) says **"Get Your Golden Visa"** -- this implies guaranteed issuance, which violates the compliance standard.

**Fix:** Change title from "Get Your Golden Visa" to "Golden Visa Advisory" and update description to include "eligible to apply" phrasing.

**File:** `src/components/home/ExploreServicesCard.tsx` (lines 100-101)

---

## Task 4: Golden Visa Wording -- MegaMenuServices Description

**Problem:** `MegaMenuServices.tsx` line 44 says **"Mortgages, Golden Visa, conveyancing, management and more"** -- while this is a navigation label (acceptable), the broader context of the card implies direct service provision. This is borderline but should be consistent.

**Fix:** Update to "Mortgages, Golden Visa advisory, conveyancing, management and more" -- minor wording adjustment.

**File:** `src/components/header/MegaMenuServices.tsx` (line 44)

---

## Task 5: AIInvestmentReportPage Missing `showFinancialDisclaimer` on Layout

**Problem:** While `AIInvestmentReportPage.tsx` was supposedly updated with the disclaimer, let me verify the actual prop is there.

**Verification needed:** Confirm `showFinancialDisclaimer` is present in the layout call.

---

## Execution Order

1. Add `showFinancialDisclaimer` to `AIROICalculatorPremium.tsx`
2. Add `showFinancialDisclaimer` to `AIContractReviewerPremium.tsx`
3. Fix "Get Your Golden Visa" wording in `ExploreServicesCard.tsx`
4. Fix MegaMenuServices Golden Visa description
5. Verify AIInvestmentReportPage disclaimer

All fixes are small -- single-line or two-line changes per file.

