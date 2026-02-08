
# Homepage Services Section & Divider Alignment Fixes

## Overview
Two changes are needed on the homepage:

1. **Explore Our Services Card** - Remove the slide counter (showing "1 / 12") from the footer
2. **Section Dividers** - Fix centering issues between Why Dubai section, Best Idea Award, and Mortgage Calculator

---

## Change 1: Remove Service Counter

### Current State
The Explore Our Services slideshow shows a counter in the footer displaying "1 / 12", "2 / 12", etc. as you navigate through the 12 services.

### What Will Change
Remove the numeric counter entirely while keeping the footer bar for visual balance. The slideshow already has navigation arrows and all 12 services rotate automatically or via manual navigation.

### File to Modify
`src/components/home/ExploreServicesCard.tsx`

### Technical Details
Remove lines 324-329 which contain:
```jsx
<div className="flex items-center justify-center py-4 md:py-5 border-t border-gold/30 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]">
  <span className="text-sm text-black/60 font-medium">
    {currentIndex + 1} / {services.length}
  </span>
</div>
```

Replace with a simple progress bar or remove the footer entirely.

---

## Change 2: Center Dividers Between Sections

### Current State
The dividers appear visually off-center because:
- The **Why Dubai Capital Section** uses `min-h-screen` with no explicit top/bottom padding
- Surrounding sections use `py-12 md:py-16`
- This creates uneven visual spacing above and below dividers

### What Will Change

**Option A (Recommended)**: Add consistent padding to the Why Dubai section edges
- The section currently bleeds edge-to-edge which looks great
- Add padding AFTER the section ends before the divider appears

**Option B**: Adjust the SectionDivider component padding when adjacent to full-bleed sections

### Files to Modify

1. **`src/pages/Index.tsx`** - Wrap the WhyDubaiCapitalSection in a container that adds margin after the section, OR add an empty spacer div between the fullscreen section and divider

2. Potentially adjust the divider's vertical padding based on context

### Technical Approach

Since WhyDubaiCapitalSection is 100vh (full screen height), the divider that comes BEFORE it and AFTER the Mortgage Calculator needs equal visual spacing.

Current flow:
```
Mortgage Calculator (py-12/py-16)
  ↓
SectionDivider (py-8/py-10)  ← needs to feel centered
  ↓
WhyDubaiCapitalSection (100vh, no padding)
  ↓
SectionDivider fullWidth (py-8/py-10)  ← needs to feel centered
  ↓
BestIdeaAward (py-12/py-16)
```

**Solution**: For dividers adjacent to full-viewport sections (like Why Dubai), add extra padding to create visual balance. This can be done by:
- Creating a wrapper around the divider with additional spacing
- Or adding margin-top/margin-bottom to the full-height section

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/home/ExploreServicesCard.tsx` | Remove the "X / 12" counter from footer (lines 324-329) |
| `src/pages/Index.tsx` | Add spacing before/after WhyDubaiCapitalSection to center the adjacent dividers |

---

## Visual Before/After

**Services Card Footer:**
- Before: Shows "3 / 12" counter
- After: Clean footer bar without counter (or remove footer entirely for cleaner look)

**Divider Spacing:**
- Before: Dividers appear closer to one section than another due to 100vh section having no padding
- After: Equal visual spacing above and below each divider, creating balanced rhythm throughout the page
