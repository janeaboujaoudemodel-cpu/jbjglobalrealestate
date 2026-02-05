
# JBJ Global Real Estate — Master Task Implementation Plan

## Executive Summary

This plan addresses 13 major requirement areas from Jane's comprehensive specification. Based on codebase analysis and Jane's answers, the implementation is organized into prioritized phases.

---

## SECTION A: Account Mode Dropdown Fixes (P0 - Critical)

### Current State Analysis
- **ModeSwitcher.tsx** (lines 56-75): Mode selection works but navigates to `/my-dashboard` on every change
- **MegaMenuAccount.tsx**: Avatar uses `useMemo` for stability; badge shows mode + points correctly
- The "Explorer" label issue was already fixed - now shows mode name + points

### Issues to Fix
1. **Dropdown closes on click** - Already has `e.stopPropagation()` but Radix DropdownMenu behavior may override
2. **Long-press disables modes** - No disabled logic exists; this is a CSS/touch event issue
3. **Avatar flicker (JB → J)** - `accountDisplayName` memo depends on `crmProfile` which loads async

### Implementation

#### A1. Fix Mode Switcher Click Behavior
**File: `src/components/ModeSwitcher.tsx`**
- Remove navigation on mode change (let user stay on current page)
- Use `DropdownMenuItem` with `onSelect` instead of `onClick` to prevent auto-close
- Add explicit close control with small delay to show success state

#### A2. Stabilize Avatar Initials
**File: `src/components/header/MegaMenuAccount.tsx`**
- Add loading skeleton state while CRM profile loads
- Use initial fallback from `user_metadata` immediately, only update if CRM profile differs
- Lock avatar container dimensions with CSS

#### A3. Prevent Dropdown Layout Shift
**File: `src/components/header/MegaMenuAccount.tsx`**
- Add `min-width: 640px` and `min-height: 420px` to MegaMenuShell wrapper
- Use CSS `transform` for open animation instead of height/width changes

#### A4. Add Mode Selector to Footer
**File: `src/components/Footer.tsx`**
- Import `ModeSwitcher` component
- Add a new section in the footer navigation area showing current mode with ability to switch
- Use same styling as header (champagne gradient + gold border)

---

## SECTION B: Homepage UI Fixes (P0 - Critical)

### B1. Fix Active Tab Color (Buy/Rent Button)
**Current Issue:** Uses `bg-gold` which Jane identifies as "yellow"
**Approved Style:** White/champagne glassmorphism for active states

**File: `src/components/home/FeaturedListings.tsx`** (lines 156-178)

Replace:
```tsx
activeTab === 'buy'
  ? 'bg-gold text-black shadow-lg'
  : 'bg-black/5 text-black hover:bg-black/10'
```

With approved active style:
```tsx
activeTab === 'buy'
  ? 'bg-white/90 text-black shadow-lg border-2 border-gold/60 backdrop-blur-sm'
  : 'bg-gradient-to-r from-[#F5EBD7]/40 via-[#E8DCC8]/40 to-[#D4C4A8]/40 text-black hover:bg-white/60 border border-gold/30'
```

### B2. Add Gold Borders to Listing Cards
**File: `src/components/home/FeaturedListings.tsx`** (line 197)

Current empty state cards already have `border-2 border-gold/20 border-dashed` - change to solid gold border:
```tsx
border-2 border-gold/40 hover:border-gold
```

### B3. Make "View All Properties" Button 3D Premium
**File: `src/components/home/FeaturedListings.tsx`** (lines 218-226)

Replace current flat button with approved 3D premium button style:
```tsx
<Link
  to={activeTab === 'buy' ? '/properties?transaction=buy' : '/properties?transaction=rent'}
  className="relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl transition-all duration-300 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50 hover:scale-[1.02] transform active:scale-95 group"
  style={{
    boxShadow: `
      0 10px 30px rgba(200,167,102,0.4),
      0 6px 15px rgba(0,0,0,0.2),
      inset 0 2px 4px rgba(255,255,255,0.9),
      inset 0 -2px 4px rgba(200,167,102,0.2),
      0 0 20px rgba(200,167,102,0.3)
    `,
  }}
>
  ...
</Link>
```

---

## SECTION C: Toolkit Branding (P0 - Critical)

### C1. Confirm Title Is Correct
**Already done:** Search shows "JBJ Royal Tools Hub" in:
- `src/components/home/ToolkitShowcaseCard.tsx` (line 112)
- `src/pages/toolkit/RoyalToolsHub.tsx` (lines 1-4, 118)
- `src/config/royalToolsRegistry.ts` (line 2)

**No changes needed** - the title is already correct.

### C2. Verify UI Is Approved Style
The `ToolkitShowcaseCard.tsx` uses approved champagne gradient styling:
- `bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`
- `border-2 border-gold/50`
- Premium shadow

**Current code is correct.** If there's regression, need to check if a different component is rendering on homepage.

---

## SECTION D: Section Sizing Consistency (P0 - Critical)

### Current Issue
"Explore Our Services should not touch corners" - needs to match container sizing of other sections.

**File: `src/pages/Index.tsx`** (around line 487)

The `ExploreServicesCard` is rendered inside a section but may lack proper container wrapping.

### Fix
Wrap `ExploreServicesCard` in the standard `jj-layer-2` container:
```tsx
<section className="py-12 md:py-16 bg-black">
  <div className="jj-layer-2">
    <ExploreServicesCard />
  </div>
</section>
```

This matches the pattern used by other sections like FeaturedListings and WhyChooseUs.

---

## SECTION E: Mortgage Calculator Audit (P1 - High)

### Current Math Analysis
The calculator at `src/components/MortgageCalculator.tsx` uses standard amortization formula:
```
M = P[r(1+r)^n]/[(1+r)^n-1]
```

Default values: AED 2,000,000 property, 20% down, 4.5% rate, 25 years

**Calculation verification:**
- Down payment: AED 400,000 (20%)
- Loan amount: AED 1,600,000
- Monthly payment: AED 8,882 (correct)
- Total payment: AED 2,664,600 (correct)
- Total interest: AED 1,064,600 (correct)

**The math is correct.** The issue may be that example values shown in the compact view don't match these calculations.

### Required Enhancements

#### E1. Add Down Payment % and AED to Compact View
**File: `src/components/MortgageCalculator.tsx`** (lines 88-131)

Add a fourth card showing:
- "Down Payment: 20% | AED 400,000"

#### E2. Update Example Disclaimer
Change the disclaimer to clearly show all assumptions:
```tsx
*Estimates based on {formatCurrency(propertyPrice)} property, {downPaymentPercent}% down ({formatCurrency(calculations.downPayment)}), {interestRate}% rate, {loanTermYears} years
```

#### E3. Add Percentage Labels to Breakdown Cards
For each card, add percentage context where applicable:
- Loan Amount: "80% of property value"
- Total Interest: "X% of loan"

---

## SECTION F: Section Divider (P1 - High)

### Jane's Answer: Use premium gold sparkle divider

### Current State
The `SectionDivider` component already exists and is used throughout the homepage.

**Current Issue:** Missing divider between "Why Choose Us" and "Best Idea Award"

### Fix
**File: `src/pages/Index.tsx`** (around line 644)

Looking at the current order:
```tsx
{/* BEST IDEA AWARD */}
<BestIdeaAward />

{/* DIVIDER */}
<SectionDivider />

{/* WHY CHOOSE US */}
<WhyChooseUs />
```

The divider IS already between sections. However, the order is: BestIdeaAward → Divider → WhyChooseUs. Jane may want divider BEFORE BestIdeaAward.

Add:
```tsx
{/* DIVIDER - Before Best Idea Award */}
<SectionDivider />

{/* BEST IDEA AWARD */}
<BestIdeaAward />
```

---

## SECTION G: Footer Social Icons (P1 - High)

### Current State Analysis
**File: `src/components/marketing/SocialLinks.tsx`**

Current `glow` variant:
```tsx
case 'glow':
  return 'text-gold hover:text-black drop-shadow-[0_0_8px_rgba(200,167,102,0.8)] hover:drop-shadow-none';
```

**Issue:** Hover shows `text-black` which Jane says is wrong.

### Fix
**File: `src/components/marketing/SocialLinks.tsx`** (line 29-30)

Replace hover behavior:
```tsx
case 'glow':
  return 'text-gold hover:text-gold-light drop-shadow-[0_0_8px_rgba(200,167,102,0.8)] hover:drop-shadow-[0_0_16px_rgba(200,167,102,1)] hover:scale-110 transition-all duration-300';
```

### Add "Connect With Us" Label
**File: `src/components/Footer.tsx`** (around line 441)

Add label above social links:
```tsx
<div className="relative flex flex-col items-center gap-4">
  <p className="text-gold/80 text-sm uppercase tracking-[0.2em] font-medium">
    Connect With Us
  </p>
  <div 
    className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl"
    ...
  >
    <SocialLinks variant="glow" ... />
  </div>
</div>
```

---

## SECTION H: AI Video Tool Integration (P2 - Medium)

### Current State
- `AIVideoStudio.tsx` is a standalone timeline editor
- Separate tools exist: VoiceStudio, BeautyFilters, CaptionsTranslate, VideoResizePack

### Integration Approach
Keep all standalone tool pages, but add them as **embedded modules** within the AI Video Studio.

**File: `src/components/ai-video-studio/AIVideoStudio.tsx`**

Add a new panel/tab system in the right panel (`InspectorPanel`) area:
1. **Voice Tab** - Embedded VoiceStudio component
2. **Captions Tab** - Embedded CaptionsTranslate component
3. **Beauty Tab** - Embedded BeautyFilters component
4. **Resize Tab** - Embedded VideoResizePack (export presets)

Each module will be imported and rendered within tabs, sharing the timeline context.

---

## SECTION I: File Retention Policy (P2 - Medium)

### Current Behavior Analysis
Need to check if files have auto-delete logic.

### Implementation
1. **Remove auto-delete timers** from any processing functions
2. **Add autosave** to IndexedDB/localStorage for drafts
3. **Persist final exports** to user's Supabase storage bucket

---

## SECTION J: ROI Tool Naming (P1 - High)

### Current State
Tool is already named "Property Evaluator" in:
- `ToolkitShowcaseCard.tsx` - "Property Evaluator"
- Route: `/property-evaluator`

### Verify Global Consistency
Search for any remaining "ROI" references and update to "Property Evaluator"

---

## SECTION K: PDF Tool Phase 1 (P2 - Medium)

### Jane's Answer: Start with core PDF + signatures

### Phase 1 Features
1. **Page extraction** - Select pages to extract as new PDF
2. **Page reordering** - Drag-drop to rearrange
3. **Merge PDFs** - Combine multiple files
4. **Basic signatures** - Draw/upload signature, place on document
5. **Save options** - Save as new PDF, save individual pages

### Technical Approach
- Use `pdf-lib` (already installed) for PDF manipulation
- Create new page: `src/pages/toolkit/PDFEditor.tsx`
- Add signature canvas component
- Store signatures in localStorage for reuse

---

## SECTION L: Admin Presentation Generator (P3 - Future)

### Depends on
- Phase 1 PDF tool completion
- Property listing data structure

### Implementation Notes
- Add "Generate Presentation" button to listing admin
- Auto-compile: property images, floor plans, developer info
- Include agent business card (from profile)
- Output as branded PDF presentation

---

## Implementation Priority Order

| Phase | Tasks | Files |
|-------|-------|-------|
| **Phase 1: Critical Fixes** | A1-A4, B1-B3, C2, D, F, G | ModeSwitcher, MegaMenuAccount, FeaturedListings, Footer, Index |
| **Phase 2: Calculator + Naming** | E1-E3, J | MortgageCalculator, search/replace for ROI refs |
| **Phase 3: Video Integration** | H, I | AIVideoStudio, new embedded modules |
| **Phase 4: PDF Tool** | K | New PDFEditor page |
| **Phase 5: Presentation Gen** | L | Listing admin enhancement |

---

## QA Acceptance Criteria

### Mode Switcher
- [ ] Clicking mode option does not close dropdown prematurely
- [ ] Long-press does not disable any modes
- [ ] Avatar initials remain stable during load
- [ ] Badge shows "Investor • 0 pts earned" format
- [ ] Mode selector visible in footer
- [ ] Mode persists across refresh

### Homepage UI
- [ ] Active Buy/Rent tab uses white/champagne glassmorphism (not yellow-gold)
- [ ] Listing cards have solid gold borders
- [ ] "View All Properties" button has 3D premium styling
- [ ] "Explore Our Services" section matches container sizing of other sections

### Footer
- [ ] Social icons hover shows gold glow (not black)
- [ ] "Connect With Us" label displayed above icons
- [ ] All social links working and opening correct URLs

### Mortgage Calculator
- [ ] Down payment shows % AND AED amount
- [ ] Example disclaimer shows all parameters
- [ ] Math verified against Dubai market standards

---

## Files to Modify (Summary)

| File | Changes |
|------|---------|
| `src/components/ModeSwitcher.tsx` | Fix click behavior, remove auto-navigation |
| `src/components/header/MegaMenuAccount.tsx` | Stabilize avatar, fix layout shift |
| `src/components/home/FeaturedListings.tsx` | Active tab style, gold borders, 3D button |
| `src/components/Footer.tsx` | Add mode selector, "Connect With Us" label |
| `src/components/marketing/SocialLinks.tsx` | Fix hover state (no black) |
| `src/components/MortgageCalculator.tsx` | Add down payment card, percentage labels |
| `src/pages/Index.tsx` | Add divider before BestIdeaAward, wrap ExploreServices in container |
| `src/components/ai-video-studio/AIVideoStudio.tsx` | Add integrated tool tabs |
| New: `src/pages/toolkit/PDFEditor.tsx` | Phase 1 PDF tool |

