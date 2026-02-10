

# Fix Developer Partners Marquee — Robustness and Reliability

## Problem

The marquee has several fragility issues that can cause broken scrolling:
1. `loopWidth` is measured via `scrollWidth` before images finish loading, resulting in incorrect width and broken seamless looping
2. Framer Motion's `animate` prop resets on any re-render (e.g., language context change), causing visible jumps
3. Four duplicate loops is excessive — two suffice for seamless scrolling
4. No fallback if an image fails to load (broken logo placeholder)

## Changes (Single File Only)

**File: `src/components/DeveloperPartnersMarquee.tsx`**

### 1. Add image load tracking
- Track how many images have loaded using a counter ref
- Re-measure `loopWidth` after all images in the first loop have loaded
- This ensures the width is accurate for seamless scrolling

### 2. Replace framer-motion with CSS animation
- Use a CSS `@keyframes marquee` animation instead of framer-motion's `animate` prop
- CSS animations don't reset on React re-renders, making the scroll truly seamless
- Apply `animation: marquee Xs linear infinite` with duration based on `loopWidth`
- This eliminates the jump/reset issue entirely

### 3. Reduce to 2 loops
- Keep only 2 copies of the developer list (original + 1 duplicate) for seamless infinite scroll
- Remove the 2 extra unnecessary duplicates

### 4. Add image error fallback
- On `<img onError>`, show the developer name initial in a gold circle as fallback
- Prevents broken image icons from appearing

### Technical Approach

```
Container (overflow: hidden)
  Track div (CSS animation: translateX(0) -> translateX(-loopWidth))
    Loop A: [DAMAC] [EMAAR] [MERAAS] ... (measured for width)
    Loop B: [DAMAC] [EMAAR] [MERAAS] ... (seamless continuation)
```

CSS animation approach:
- Define keyframes inline via `style` prop: `transform: translateX(0)` to `translateX(-${loopWidth}px)`
- Duration = `loopWidth / 80` seconds (adjustable speed)
- `animation-timing-function: linear`, `animation-iteration-count: infinite`

## File Modified

| File | Change |
|------|--------|
| `src/components/DeveloperPartnersMarquee.tsx` | CSS animation, image load tracking, error fallback, reduce to 2 loops |

