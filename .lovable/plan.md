

# Fix: Add Click Feedback Animation to Service Carousel Arrows

## Problem

The left/right arrow buttons on the Services carousel (mobile) look static when tapped. They already have `whileTap={{ scale: 0.85 }}` from Framer Motion, but the effect is subtle and there's no visual color or glow change, making them feel unresponsive.

## Solution

Enhance both arrow buttons with richer interactive feedback:

**File:** `src/components/home/ServicesGrid.tsx` (lines 148-165)

For both the Left and Right `motion.button` elements:

1. **Add `whileHover`** -- slight scale-up and gold glow on hover:
   `whileHover={{ scale: 1.1, boxShadow: "0 0 16px rgba(200,167,102,0.6)" }}`

2. **Strengthen `whileTap`** -- deeper press with gold background flash and inward shadow:
   `whileTap={{ scale: 0.8, backgroundColor: "rgba(200,167,102,0.25)", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.15)" }}`

3. **Add spring transition** for a bouncy, tactile feel:
   `transition={{ type: "spring", stiffness: 400, damping: 15 }}`

4. **Add CSS transition classes** for the icon color shift on active state:
   Add `active:text-gold` to the `ChevronLeft` / `ChevronRight` icons so the arrow itself turns gold on press.

These changes make the buttons visually "pop" when pressed -- the button shrinks, flashes gold, and the icon changes color, giving clear tactile feedback that the tap was registered.

## Technical Details

| Property | Current | New |
|----------|---------|-----|
| `whileTap` | `scale: 0.85` | `scale: 0.8` + gold background + inset shadow |
| `whileHover` | none | `scale: 1.1` + gold glow shadow |
| `transition` | default | spring with stiffness 400, damping 15 |
| Icon classes | `text-zinc-800` | `text-zinc-800 active:text-gold transition-colors` |

Only one file is changed: `src/components/home/ServicesGrid.tsx`.

