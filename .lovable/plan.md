

# Global Audit: Remove Competitor Platform References from Public Frontend

## Problem Identified

The platform — which IS an authorized real estate platform — is directing its own users to competitor platforms (Bayut, Property Finder, Dubizzle, Property Monitor, Knight Frank) in public-facing disclaimers, source citations, and AI training data. This undermines the platform's authority and sends traffic to competitors.

## Audit Findings

### Category A: Public-Facing UI Text (MUST FIX — users see these)

| # | File | Line(s) | Violation |
|---|------|---------|-----------|
| 1 | `src/pages/RentalIndex.tsx` | 449-451 | "please refer to DLD, RERA, and **authorized real estate platforms**" |
| 2 | `src/components/shared/DLDMarketWidget.tsx` | 71 | "Sources: DLD, RERA, DXB Interact, **Property Monitor, Knight Frank, Bayut, Property Finder**" |
| 3 | `src/components/shared/DLDMarketWidget.tsx` | 194 | Same sources list repeated in full widget |
| 4 | `src/pages/marketReportTemplate.ts` | 422 | "Sources: DLD · DXB Interact · **Property Finder · Bayut**" |
| 5 | `src/pages/marketReportTemplate.ts` | 453 | "Sources: DLD · DXB Interact · **Bayut**" |
| 6 | `src/pages/PropertyEvaluator.tsx` | 323 | "Sources: DLD · RERA · **Property Monitor · Knight Frank** · JLL" |
| 7 | `src/pages/SellWithUs.tsx` | 323 | "Sources: DLD · RERA · **Property Monitor**" |
| 8 | `src/components/crm/LeadShortlistPanel.tsx` | 235 | "Add properties from **Property Finder**" |
| 9 | `src/components/WhyDubaiSection.tsx` | 145 | "**Knight Frank** Global Cities Index" — this is an attributed ranking citation, acceptable |

### Category B: Data Config Comments (code-only, not user-visible but should be cleaned)

| # | File | Issue |
|---|------|-------|
| 10 | `src/constants/dldMarketData.ts` | Line 97: comment "Sources: Bayut, Property Finder, Property Monitor" |
| 11 | `src/constants/dldMarketData.ts` | Line 111: comment "Sources: DXB Interact, Property Monitor, Knight Frank" |
| 12 | `src/config/open-data-config.ts` | Line 160: comment "Sources: DLD, Property Monitor, Knight Frank, Bayut" |
| 13 | `src/config/open-data-config.ts` | Lines 67-115: Bayut, Property Finder, Dubizzle listed as "open data sources" with URLs |

### Category C: AI Training/Brain Configs (internal, but AI may surface these to users)

| # | File | Issue |
|---|------|-------|
| 14 | `src/config/ai-personalities.ts` | Lines 694-697: "PROPERTY PORTALS: Bayut, Property Finder, Property Monitor" |
| 15 | `src/config/ai-comprehensive-training.ts` | Lines 98-135: Full portal configs with URLs |
| 16 | `src/config/ai-brain-training.ts` | Lines 81-98: Same portal configs |
| 17 | `src/config/assistant-brain-updates.ts` | Lines 188-190: "Property Monitor", "Property Finder", "Bayut" listed |
| 18 | `src/config/market-intelligence-engine.ts` | Lines 5, 190-205: property_finder, bayut, knight_frank as data source types |

### Category D: Admin/Internal Tools (KEEP per existing compliance rules)

Translation files referencing "Bayut/PropertyFinder/Dubizzle" in listing admin extraction context — these are internal admin tools and per the existing compliance standard, competitor names are explicitly allowed in internal admin contexts. **No changes needed.**

## Plan

### Phase 1: Fix Public-Facing Text (8 edits)

1. **`src/pages/RentalIndex.tsx`** (line 449-452): Replace "authorized real estate platforms" with "For official records, please refer to Dubai Land Department (DLD) and RERA."

2. **`src/components/shared/DLDMarketWidget.tsx`** (line 71): Change to "Sources: DLD, RERA, DXB Interact. For informational purposes only."

3. **`src/components/shared/DLDMarketWidget.tsx`** (line 194): Same fix for full widget version: "Sources: Dubai Land Department (DLD), RERA, DXB Interact. YTD 2026 data."

4. **`src/pages/marketReportTemplate.ts`** (line 422): Change to "Sources: Dubai Land Department (DLD) · DXB Interact"

5. **`src/pages/marketReportTemplate.ts`** (line 453): Change to "Sources: Dubai Land Department (DLD) · DXB Interact"

6. **`src/pages/PropertyEvaluator.tsx`** (line 323): Change to "Sources: DLD Public Records · RERA · JBJ Analysis Framework"

7. **`src/pages/SellWithUs.tsx`** (line 323): Change to "Sources: DLD Public Records · RERA · JBJ Analysis Framework"

8. **`src/components/crm/LeadShortlistPanel.tsx`** (line 235): Change to "Add properties from the listing database"

### Phase 2: Clean Data Config Comments (4 edits)

9. **`src/constants/dldMarketData.ts`** lines 97, 111: Update comments to reference only "DLD, RERA, DXB Interact"

10. **`src/config/open-data-config.ts`** line 160: Update comment. Remove Bayut/PropertyFinder/Dubizzle from the `OPEN_DATA_SOURCES` array (lines 87-115) — these are NOT government open data sources.

### Phase 3: Clean AI Training Configs (5 edits)

11. **`src/config/ai-personalities.ts`**: Remove "PROPERTY PORTALS" section or replace with "Use DLD and RERA as primary data references"

12. **`src/config/ai-comprehensive-training.ts`**: Remove propertyPortals object and update citation instructions to only reference DLD/RERA

13. **`src/config/ai-brain-training.ts`**: Remove propertyPortals object

14. **`src/config/assistant-brain-updates.ts`**: Remove Property Monitor, Property Finder, Bayut entries

15. **`src/config/market-intelligence-engine.ts`**: Remove property_finder, bayut, knight_frank from source types

### Exceptions (NO changes)

- **`src/components/WhyDubaiSection.tsx`** line 145: "Knight Frank Global Cities Index" — this is a **ranking citation** (like citing Numbeo), not a platform referral. Acceptable per the user's rule that DLD/RERA and **verified official citations for rankings** are permitted.
- **Translation files** with Bayut/PropertyFinder in listing admin contexts — internal admin, per compliance standard.
- **`src/lib/imageUtils.ts`** and **`supabase/functions/download-file/index.ts`** — these are backend allowed-domain lists for image proxying, not public text.

### What will NOT be changed

- No UI layout changes
- No new components
- No unrelated modifications
- Admin/internal tools keep competitor names per existing compliance rules

