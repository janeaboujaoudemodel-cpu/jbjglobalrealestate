
# AI Tools Premium Fix & Enhancement Plan

## Issues Identified

### 1. Faded Buttons (Critical)
The global `Button` component in `button.tsx` has a `sanitizeButtonClassName` function that strips color classes like `bg-gradient-to-r`, `from-cyan-600`, `text-white`. This makes all buttons appear faded/invisible on dark backgrounds.

**Solution**: Add a new `variant="ai-tool"` to the button system that bypasses sanitization and provides tool-specific colored buttons.

### 2. White Text on White Background
Some components still use default light-themed cards. All AI tools need dark-themed inputs and cards with proper contrast.

### 3. Missing Premium Components (6 tools)
These tools still use old basic UI:
- Translation Hub (Amber theme)
- Market Report (Indigo theme)
- Document Generator (Lime theme)
- Video Tour Script (Pink theme)
- Contract Reviewer (Red theme)
- Property Analyzer (Sky theme)

### 4. No Tool Guides
Each tool needs an inline guide explaining:
- What the tool does (2-line description)
- How to use it (step-by-step)
- Benefits and use cases

---

## Implementation Plan

### Phase 1: Fix Button System
Add AI tool button variants that work on dark backgrounds:

**File**: `src/components/ui/button.tsx`
- Add `ai-emerald`, `ai-purple`, `ai-blue`, `ai-cyan`, etc. variants
- These variants use explicit color classes that are NOT sanitized
- Format: `bg-{color}-600 hover:bg-{color}-500 text-white border-{color}-700`

### Phase 2: Create Tool Guide Component
Create a reusable inline guide component:

**New File**: `src/components/ai-tools/AIToolGuide.tsx`
```
interface AIToolGuideProps {
  title: string;
  description: string;
  steps: string[];
  benefits: string[];
  color: string;
}
```
- Collapsible by default
- Dark-themed card with colored accents
- Shows in the header area under subtitle

### Phase 3: Upgrade Remaining 6 Tools to Premium

#### 3.1 Translation Hub (Amber)
**New File**: `src/components/ai-tools/premium/AITranslationHubPremium.tsx`
- Language swap animation
- Side-by-side source/target display
- Cultural context tips
- Quick copy buttons for both languages

#### 3.2 Market Report (Indigo)
**New File**: `src/components/ai-tools/premium/AIMarketReportPremium.tsx`
- Visual trend indicators
- Key metrics dashboard
- Downloadable report format
- Market outlook badges

#### 3.3 Document Generator (Lime)
**New File**: `src/components/ai-tools/premium/AIDocumentGeneratorPremium.tsx`
- Template preview
- Tone selector with examples
- Multiple output formats
- Save to drafts option

#### 3.4 Video Tour Script (Pink)
**New File**: `src/components/ai-tools/premium/AIVideoTourScriptPremium.tsx`
- Scene-by-scene breakdown
- Timing indicators
- Voice style selector
- Download script option

#### 3.5 Contract Reviewer (Red - High Alert Color)
**New File**: `src/components/ai-tools/premium/AIContractReviewerPremium.tsx`
- Risk highlighting with severity levels
- Clause-by-clause analysis
- Comparison against standard terms
- Legal disclaimer prominent

#### 3.6 Property Analyzer (Sky)
**New File**: `src/components/ai-tools/premium/AIPropertyAnalyzerPremium.tsx`
- Multi-metric dashboard
- Comparable properties cards
- Investment score gauge
- Area insights map preview

### Phase 4: Update All Page Components
Update all 14 page files in `src/pages/AI*.tsx` to:
- Use the new premium components
- Remove old wrapper styling
- Consistent SEO metadata

### Phase 5: Add Inline Guides to All Tools
Add guide data to each premium component:
- 2-line description visible on load
- Expandable "How to Use" section
- Benefits list with icons

---

## Technical Changes Summary

### Files to Create (7 new files)
1. `src/components/ai-tools/AIToolGuide.tsx` - Reusable guide component
2. `src/components/ai-tools/premium/AITranslationHubPremium.tsx`
3. `src/components/ai-tools/premium/AIMarketReportPremium.tsx`
4. `src/components/ai-tools/premium/AIDocumentGeneratorPremium.tsx`
5. `src/components/ai-tools/premium/AIVideoTourScriptPremium.tsx`
6. `src/components/ai-tools/premium/AIContractReviewerPremium.tsx`
7. `src/components/ai-tools/premium/AIPropertyAnalyzerPremium.tsx`

### Files to Modify (16 files)
1. `src/components/ui/button.tsx` - Add AI tool button variants
2. `src/components/ai-tools/AIToolPremiumLayout.tsx` - Add guide slot
3. `src/components/ai-tools/premium/index.ts` - Export new components
4. `src/components/ai-tools/premium/AIROICalculatorPremium.tsx` - Fix button + add guide
5. `src/components/ai-tools/premium/AILeadQualificationPremium.tsx` - Fix button + add guide
6. `src/components/ai-tools/premium/AIPricePredictorPremium.tsx` - Fix button + add guide
7. `src/components/ai-tools/premium/AIFollowupSchedulerPremium.tsx` - Fix button + add guide
8. `src/components/ai-tools/premium/AICompetitorAnalysisPremium.tsx` - Fix button + add guide
9. `src/components/ai-tools/premium/AINeighborhoodInsightsPremium.tsx` - Fix button + add guide
10. `src/components/ai-tools/premium/AIObjectionHandlerPremium.tsx` - Fix button + add guide
11. `src/components/ai-tools/premium/AIMeetingSummarizerPremium.tsx` - Fix button + add guide
12. `src/pages/AITranslationHubPage.tsx` - Use premium component
13. `src/pages/AIMarketReportPage.tsx` - Use premium component
14. `src/pages/AIDocumentGeneratorPage.tsx` - Use premium component
15. `src/pages/AIVideoTourScriptPage.tsx` - Use premium component
16. `src/pages/AIContractReviewerPage.tsx` - Use premium component

---

## Color Scheme (Final)

| Tool | Theme | Button Class |
|------|-------|--------------|
| ROI Calculator | Emerald | `ai-emerald` |
| Lead Qualification | Purple | `ai-purple` |
| Price Predictor | Blue | `ai-blue` |
| Neighborhood Insights | Teal | `ai-teal` |
| Competitor Analysis | Orange | `ai-orange` |
| Market Report | Indigo | `ai-indigo` |
| Objection Handler | Rose | `ai-rose` |
| Follow-up Scheduler | Cyan | `ai-cyan` |
| Meeting Summarizer | Violet | `ai-violet` |
| Translation Hub | Amber | `ai-amber` |
| Video Tour Script | Pink | `ai-pink` |
| Contract Reviewer | Red | `ai-red` |
| Document Generator | Lime | `ai-lime` |
| Property Analyzer | Sky | `ai-sky` |

---

## Expected Outcome
- All 14 tools have premium dark-themed UI
- Buttons are vibrant and visible (not faded)
- Each tool has inline guide with description + how-to-use
- Text is readable (white on dark, not white on white)
- All tools work end-to-end with proper field mapping
- Consistent UX across all AI tools
