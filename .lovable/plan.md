

# Implementation Plan: Footer Section Title & Divider Fixes

## Summary
This plan fixes the visibility of the "Get In Touch" divider, corrects the gradient text rendering issue on section titles (which shows as squares on some browsers), ensures all category titles are aligned on the same line, and standardizes colors (gold titles, black page links).

---

## Issues Identified

### 1. "Get In Touch" Divider Not Visible
**Current State (Line 750):**
```tsx
<div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent mx-4" />
```
The `via-gold/40` (40% opacity) is too faint to be visible.

**Fix:**
Make the divider thicker and more visible with higher opacity:
```tsx
<div className="h-[2px] bg-gradient-to-r from-gold/20 via-gold/80 to-gold/20 mx-4" />
```

### 2. Section Titles Showing Squares (Gradient Text Bug)
**Current State (Lines 510-516, 536-542, etc.):**
```tsx
<h4 
  className="font-bold text-[10px] sm:text-xs md:text-sm uppercase..."
  style={{
    background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 30%, #D4AF37 50%, #333333 70%, #1a1a1a 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  }}
>
```
The `WebkitBackgroundClip: 'text'` and `WebkitTextFillColor: 'transparent'` cause rendering issues on some browsers, showing as colored squares instead of gradient text.

**Fix:**
Replace complex gradient with simple solid gold color using Tailwind:
```tsx
<h4 className="font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.08em] sm:tracking-[0.15em] mb-1.5 sm:mb-2 md:mb-4 pb-1 sm:pb-2 border-b border-gold/30 text-gold">
```

### 3. Categories Not Aligned on Same Line
**Current State:**
- Column 1 uses `text-[10px] sm:text-xs md:text-sm` for titles
- Columns 2-4 use `text-xs sm:text-sm md:text-base lg:text-lg` for titles
- This inconsistency causes misalignment

**Fix:**
Standardize ALL section titles to the same font size:
```tsx
className="font-bold text-xs sm:text-sm md:text-base uppercase tracking-[0.12em] mb-2 sm:mb-3 md:mb-4 pb-1 sm:pb-2 border-b border-gold/30 text-gold"
```

### 4. Page Links Must Be Black
**Current State (Lines 527, 551, etc.):**
```tsx
className="text-zinc-700 hover:text-gold..."
```
This is already correct - `text-zinc-700` is dark/black, and it hovers to gold.

---

## Implementation Details

### File to Modify
`src/components/Footer.tsx`

### Phase 1: Fix All Section Title Styling (Lines 510-516, 536-542, 562-568, 588-594, 614-620, 640-646, 666-672, 692-698, 723-730, 754-760)

Replace ALL section titles from gradient style to solid gold:

**Before:**
```tsx
<h4 
  className="font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.08em] sm:tracking-[0.15em] mb-1.5 sm:mb-2 md:mb-4 pb-1 sm:pb-2 border-b border-gold/30"
  style={{
    background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 30%, #D4AF37 50%, #333333 70%, #1a1a1a 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  }}
>
```

**After:**
```tsx
<h4 className="font-bold text-xs sm:text-sm md:text-base uppercase tracking-[0.12em] mb-2 sm:mb-3 md:mb-4 pb-1 sm:pb-2 border-b border-gold/30 text-gold">
```

### Phase 2: Fix Dividers to Be More Visible (Lines 718 and 750)

**Before:**
```tsx
<div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent mx-4" />
```

**After:**
```tsx
<div className="h-[2px] bg-gradient-to-r from-gold/20 via-gold/80 to-gold/20 mx-6" />
```

### Phase 3: Fix "Get In Touch" Title (Line 754-762)

**Before:**
```tsx
<h4 
  className="font-bold text-xs sm:text-sm md:text-base uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 md:mb-5"
  style={{
    background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 30%, #D4AF37 50%, #333333 70%, #1a1a1a 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  }}
>
  Get in Touch
</h4>
```

**After:**
```tsx
<h4 className="font-bold text-sm sm:text-base md:text-lg uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 md:mb-5 text-gold">
  Get in Touch
</h4>
```

### Phase 4: Fix "Professional Tools" Title (Lines 723-733)

**Before:**
```tsx
<h4 
  className="font-bold text-sm sm:text-base md:text-lg uppercase tracking-[0.12em] sm:tracking-[0.18em] md:tracking-[0.25em] mb-2"
  style={{
    background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 30%, #D4AF37 50%, #333333 70%, #1a1a1a 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    filter: 'drop-shadow(0 2px 6px rgba(200,167,102,0.3))',
  }}
>
  ✦ Professional Tools ✦
</h4>
```

**After:**
```tsx
<h4 className="font-bold text-sm sm:text-base md:text-lg uppercase tracking-[0.12em] sm:tracking-[0.18em] md:tracking-[0.25em] mb-2 text-gold drop-shadow-[0_2px_6px_rgba(200,167,102,0.3)]">
  ✦ Professional Tools ✦
</h4>
```

---

## Summary of Changes

| Element | Before | After |
|---------|--------|-------|
| Section titles (Properties, Services, etc.) | Complex gradient with `WebkitBackgroundClip` showing as squares | Simple `text-gold` |
| Title font sizes | Inconsistent (some `text-[10px]`, some `text-lg`) | Unified `text-xs sm:text-sm md:text-base` |
| Dividers | `h-px via-gold/40` (barely visible) | `h-[2px] via-gold/80` (clearly visible) |
| Page links | `text-zinc-700` (already correct) | No change needed |
| Get In Touch title | Gradient text | `text-gold text-sm sm:text-base md:text-lg` |
| Professional Tools title | Gradient text with filter | `text-gold` with Tailwind drop-shadow |

---

## Deliverables

1. All section titles display in solid gold (no squares/boxes)
2. All category titles aligned at the same size
3. Dividers clearly visible with 80% gold opacity
4. Page links remain black with gold hover
5. "Get In Touch" and "Professional Tools" titles properly styled in gold

