
# Logo Creator — Color & Button Fix

## What Was Found During Testing

The Logo Creator flow works correctly end-to-end:
- Logo generation, save to Brand Assets, and Full Kit ZIP all function perfectly
- No emojis found anywhere — Lucide icons are used throughout
- Save button correctly shows the storage location ("Corporate Suite → Brand Assets panel")

However, 5 color issues were identified where the **old orange/red gradient** and **orange border** colors are still being used, violating the champagne gold standard required across the platform.

---

## Issues to Fix in `src/components/corporate-suite/LogoCreator.tsx`

### Line 387 — Generate / Regenerate button
Current: `style={{ background: "linear-gradient(135deg, #f97316, #ef4444)" }}`
Fix: Replace with champagne-to-gold gradient with dark text

### Line 500 — Full Kit (ZIP) button
Current: `style={{ background: "linear-gradient(135deg, #f97316, #ef4444)" }}` with `text-white`
Fix: Same champagne gradient, dark text

### Lines 400, 416, 429, 462 — Selection borders on Industry / Style / Color / Font cards
Current: `border-orange-400 bg-orange-50` (selected) and `hover:border-orange-300`
Fix: Replace with `border-[#C9A84C] bg-[#C9A84C]/10` (selected) and `hover:border-[#C9A84C]/60`

### Line 402 — Industry icon active color
Current: `text-orange-500`
Fix: `text-[#C9A84C]`

### Line 452 — "Reset to preset" link
Current: `text-orange-500`
Fix: `text-[#C9A84C]`

### Line 507 — Save to Brand Assets button
Current: `border-orange-300 text-orange-600 hover:bg-orange-50`
Fix: `border-[#C9A84C]/60 text-[#C9A84C] hover:bg-[#C9A84C]/10`

---

## Champagne Gold Standard

The platform uses this as the gold standard for buttons and accents:
- **Primary gold**: `#C9A84C`
- **Generate/primary action button**: dark background with gold text, or champagne gradient (`from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`) with dark text and gold border
- **Selection state**: `border-[#C9A84C] bg-[#C9A84C]/10`
- **Hover state**: `hover:border-[#C9A84C]/60`

For the Generate Logo button specifically — since it is the primary CTA, it will use a dark premium style: deep charcoal background with champagne gold text and a gold border glow, consistent with other primary actions in the suite.

---

## Files to Modify

- `src/components/corporate-suite/LogoCreator.tsx` — 8 targeted line replacements to fix all orange/amber color violations
