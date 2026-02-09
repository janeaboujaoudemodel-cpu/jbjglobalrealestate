

# Full Global Button & UI Contrast Audit

## Executive Summary

This plan addresses critical UI/UX issues identified across the platform:

1. **Faded/invisible buttons** on dark backgrounds (e.g., Interior Design Studio's "Back to Mode Selection")
2. **White text on white/light backgrounds** (e.g., Room/Area Name dropdown on light cards)
3. **Poor dropdown styling** - rectangular, small text, gray colors, bad hover states
4. **AI tools not matching their accent colors** internally (cards, sections, buttons)
5. **Interior Design Studio needs integration** into one tabbed screen with per-mode colors

---

## Part 1: Interior Design Studio Redesign

### Current Issues
- 4 separate cards for mode selection, then navigates to separate pages
- "Back to Mode Selection" button faded/invisible on dark background
- Dropdowns (Room/Area Name) have white text on light backgrounds
- Measure button is faded and rectangular

### Target: Tabbed Suite with Per-Mode Colors

**Layout Architecture:**
```text
┌─────────────────────────────────────────────────────────────────┐
│  AI Interior Design Studio                                      │
├─────────────────────────────────────────────────────────────────┤
│  [ Concept ◈ ] [ Redesign 📷 ] [ Staging 🛋️ ] [ Chat 💬 ]       │
│     purple        blue          emerald       orange            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────────────────────────┐ │
│  │ Project Details  │  │                                      │ │
│  │ - Project Name   │  │   Mode-Specific Form Content         │ │
│  │ - Room Name      │  │   (styled with mode's accent color)  │ │
│  │ - Property Type  │  │                                      │ │
│  │ - Size + Measure │  │   [Generate Button in mode color]    │ │
│  └──────────────────┘  └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Color Scheme by Mode

| Mode | Accent | Button | Border | Badge |
|------|--------|--------|--------|-------|
| Concept | Purple/Fuchsia | `variant="ai-purple"` | `border-fuchsia-500/50` | `bg-fuchsia-500/20 text-fuchsia-300` |
| Redesign | Blue/Cyan | `variant="ai-blue"` | `border-blue-500/50` | `bg-blue-500/20 text-blue-300` |
| Staging | Emerald/Teal | `variant="ai-emerald"` | `border-emerald-500/50` | `bg-emerald-500/20 text-emerald-300` |
| Chat | Amber/Orange | `variant="ai-orange"` | `border-amber-500/50` | `bg-amber-500/20 text-amber-300` |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/InteriorDesignAI.tsx` | Convert to single-page tabbed layout with shared project details |
| `src/components/interior-design/DesignModeSelector.tsx` | Convert to horizontal tab bar, not card grid |
| `src/components/interior-design/DesignProjectHeader.tsx` | Fix dropdown contrast, use mode-specific borders |
| `src/components/interior-design/ConceptRenderForm.tsx` | Use `variant="ai-purple"` for all buttons |
| `src/components/interior-design/PhotoRedesignForm.tsx` | Use `variant="ai-blue"` for all buttons |
| `src/components/interior-design/VirtualStagingForm.tsx` | Use `variant="ai-emerald"` for all buttons |
| `src/components/interior-design/DesignChatAssistant.tsx` | Use `variant="ai-orange"` for all buttons |

---

## Part 2: Property Measurement Page Fixes

### Current Issues
- Property type cards use `border-teal-500` when selected but continue button is faded
- Property Name input has white text on dark background (acceptable)
- Continue button should be solid `bg-teal-500` not transparent

### Fixes Required

| Element | Current | Fix |
|---------|---------|-----|
| Continue button | `bg-teal-500 hover:bg-teal-600 text-white` | Already correct, verify not stripped |
| Property type cards (selected) | `border-teal-500 bg-teal-500/20 text-teal-300` | Already correct |
| All borders/cards | Should match teal theme | Add `border-emerald-500/30` consistently |
| Form inputs | `bg-zinc-800/50 border-zinc-700 text-white` | Correct for dark theme |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/PropertyMeasurement.tsx` | Ensure buttons use `variant="ai-emerald"` or `variant="ai-teal"` |

---

## Part 3: Global Dropdown Fix

### Problem
- `<Select>` and `<SearchableSelect>` components use champagne styling designed for light pages
- On dark AI tool pages, they show light backgrounds with correct styling
- The issue is buttons inside these pages NOT the dropdowns themselves

### Current Select Styling (Already Fixed)
```tsx
// src/components/ui/select.tsx - Already uses:
// SelectContent: bg-[#FDFBF7] text-black border-gold/50
// SelectItem: text-black hover:text-gold
```

### Dropdown on Dark Pages
- Create a dark variant for SelectTrigger when used on dark backgrounds
- Pass `variant="dark"` to SelectTrigger on AI tool pages

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ui/select.tsx` | Add dark variant for SelectTrigger |
| `src/components/interior-design/DesignProjectHeader.tsx` | Use dark SelectTrigger variant |
| All AI tool form components | Use dark SelectTrigger variant when on dark backgrounds |

---

## Part 4: Button System Enhancement

### Problem
The `sanitizeButtonClassName` function strips custom colors from buttons unless they use `variant="ai-*"`. Many buttons on AI pages use raw className styling that gets stripped.

### Solution
1. Add more AI variants if needed (already have 15)
2. Ensure ALL AI tool buttons explicitly use `variant="ai-*"` props
3. Buttons using `variant="outline"` or `variant="ghost"` on dark backgrounds need dark-specific variants

### New Button Variants to Add

```tsx
// Dark theme ghost/outline variants
"dark-ghost": "bg-transparent text-white border-2 border-zinc-600 hover:bg-white/10 hover:border-white/40",
"dark-outline": "bg-transparent text-white border-2 border-white/40 hover:bg-white/10 hover:border-white/60",
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ui/button.tsx` | Add `dark-ghost` and `dark-outline` variants |

---

## Part 5: Full Site Button Audit

### Audit Checklist for Each AI Tool Page

For EVERY AI tool page, verify:
1. Primary action button uses `variant="ai-{color}"` matching the tool's theme
2. Secondary buttons use `dark-outline` or `dark-ghost` on dark backgrounds
3. No buttons use raw `className` colors that get stripped
4. All text is readable (no white-on-white, no gray-on-gray)

### AI Tool Pages to Audit

| Tool | Route | Expected Accent |
|------|-------|-----------------|
| Interior Design | `/interior-design-ai` | Per-mode (purple/blue/green/orange) |
| Property Measurement | `/property-measurement` | Teal/Emerald |
| Property Evaluator | `/property-evaluator` | Blue |
| Rental Index | `/rental-index` | Emerald |
| Compare | `/compare` | Purple |
| AI Lead Qualification | `/ai-lead-qualification` | Purple |
| AI Follow-up Scheduler | `/ai-followup-scheduler` | Cyan |
| AI Objection Handler | `/ai-objection-handler` | Orange |
| AI ROI Calculator | `/ai-roi-calculator` | Emerald |
| AI Price Predictor | `/ai-price-predictor` | Blue |
| AI Competitor Analysis | `/ai-competitor-analysis` | Orange |
| AI Market Report | `/ai-market-report` | Blue |
| AI Contract Reviewer | `/ai-contract-reviewer` | Red |
| AI Translation Hub | `/ai-translation-hub` | Purple |
| AI Video Tour Script | `/ai-video-tour-script` | Amber |
| AI Call Summarizer | `/ai-call-summarizer` | Violet |
| AI Neighborhood Insights | `/ai-neighborhood-insights` | Emerald |
| AI Social Media | `/ai-social-media` | Pink |

### Files to Modify (Premium AI Tools)

All files in `src/components/ai-tools/premium/*.tsx`:
- Ensure primary buttons use correct `variant="ai-*"`
- Ensure cards have matching border colors
- Ensure section headers use matching icon colors

---

## Part 6: Form Input Contrast on Dark Backgrounds

### Standard for Dark AI Pages

```tsx
// Input on dark background
<Input className="bg-zinc-800/50 border-zinc-600 text-white placeholder:text-zinc-400" />

// Select trigger on dark background
<SelectTrigger className="bg-zinc-800/50 border-zinc-600 text-white" />
```

### Standard for Light/Champagne Pages

```tsx
// Already using champagne gradient - correct
<SelectTrigger className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black" />
```

---

## Part 7: AI Tool Card Consistency

### Rule: Each AI Tool Must Match Its Accent Color

For a tool with accent color X (e.g., emerald), these elements MUST use emerald:

1. **Hero badge**: `bg-emerald-500/20 text-emerald-300 border-emerald-500/30`
2. **Section borders**: `border-emerald-500/30`
3. **Active/selected cards**: `border-emerald-500/50 bg-emerald-500/20`
4. **Primary button**: `variant="ai-emerald"`
5. **Icons**: `text-emerald-400` or `text-emerald-500`

---

## Implementation Order

### Phase 1: Core Components (Highest Impact)
1. Add `dark-ghost` and `dark-outline` variants to button.tsx
2. Add dark variant to SelectTrigger
3. Fix InteriorDesignAI.tsx to tabbed layout with per-mode colors
4. Fix PropertyMeasurement.tsx buttons to use `variant="ai-teal"`

### Phase 2: AI Tools Audit (High Impact)
5. Audit and fix all premium AI tool components
6. Ensure each tool uses its accent color consistently for buttons/borders/cards

### Phase 3: Global Forms & Inputs
7. Audit all form pages on dark backgrounds
8. Ensure no white-on-white text anywhere

### Phase 4: Admin/Owner Dashboards
9. Audit owner and admin pages
10. Ensure consistent button contrast

---

## Files to Modify (Complete List)

### Core UI Components
| File | Changes |
|------|---------|
| `src/components/ui/button.tsx` | Add `dark-ghost`, `dark-outline` variants |
| `src/components/ui/select.tsx` | Add dark SelectTrigger variant |

### Interior Design Studio
| File | Changes |
|------|---------|
| `src/pages/InteriorDesignAI.tsx` | Convert to tabbed single-page layout |
| `src/components/interior-design/DesignModeSelector.tsx` | Convert to horizontal tab bar |
| `src/components/interior-design/DesignProjectHeader.tsx` | Use dark inputs, mode-specific borders |
| `src/components/interior-design/ConceptRenderForm.tsx` | Use `variant="ai-purple"` |
| `src/components/interior-design/PhotoRedesignForm.tsx` | Use `variant="ai-blue"` |
| `src/components/interior-design/VirtualStagingForm.tsx` | Use `variant="ai-emerald"` |
| `src/components/interior-design/DesignChatAssistant.tsx` | Use `variant="ai-orange"` |
| `src/components/interior-design/DesignResultsGallery.tsx` | Use mode-aware button colors |

### Property Measurement
| File | Changes |
|------|---------|
| `src/pages/PropertyMeasurement.tsx` | Use `variant="ai-teal"` for all buttons |

### Premium AI Tools
All files in `src/components/ai-tools/premium/`:
- AICompetitorAnalysisPremium.tsx (orange)
- AIContractReviewerPremium.tsx (red)
- AIFollowupSchedulerPremium.tsx (cyan)
- AILeadQualificationPremium.tsx (purple)
- AIMarketReportPremium.tsx (blue)
- AINeighborhoodInsightsPremium.tsx (emerald)
- AIPricePredictorPremium.tsx (blue)
- AIROICalculatorPremium.tsx (emerald)
- AITranslationHubPremium.tsx (purple)
- AIVideoTourScriptPremium.tsx (amber)
- AICallSummarizerPremium.tsx (violet)

### Additional AI Tool Pages
| File | Changes |
|------|---------|
| `src/pages/AISocialMediaPage.tsx` | Use `variant="ai-pink"` |
| `src/pages/Compare.tsx` | Use `variant="ai-purple"` |
| `src/pages/PropertyEvaluator.tsx` | Use `variant="ai-blue"` |
| `src/pages/RentalIndex.tsx` | Use `variant="ai-emerald"` |

---

## Acceptance Criteria

1. All buttons on dark backgrounds are clearly visible with proper contrast
2. No white text on white/light backgrounds anywhere
3. Interior Design Studio is a single tabbed page with 4 integrated modes
4. Each mode in Interior Design uses its own accent color (purple/blue/green/orange)
5. Property Measurement uses teal/emerald consistently
6. Every AI tool page uses its designated accent color for buttons, borders, and cards
7. Dropdowns on dark backgrounds are styled appropriately
8. No faded or invisible buttons anywhere in the application
9. All forms have readable placeholder text
10. Ghost/outline buttons on dark backgrounds are visible

---

## Technical Notes

### Button Variant Selection Guide

| Background | Primary Action | Secondary Action |
|------------|----------------|------------------|
| Dark (black/zinc-900) | `variant="ai-{color}"` | `variant="dark-outline"` or `variant="dark-ghost"` |
| Light (champagne/white) | `variant="primary"` | `variant="secondary"` or `variant="outline"` |
| Hero (dark with gradients) | `variant="ai-{color}"` | `variant="dark-outline"` |

### SelectTrigger Variant Selection Guide

| Background | Variant |
|------------|---------|
| Dark pages (AI tools) | Dark variant with `bg-zinc-800 border-zinc-600 text-white` |
| Light/Champagne pages | Default champagne gradient |

