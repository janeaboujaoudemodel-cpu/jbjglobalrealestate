

# Fix: Awards Cards, Mortgage Full Numbers, Developer Logo, and Awards Page Premium Upgrade

## 1. Awards: Swap Duplicate Q2 No.11 Photo

The current `award07` uses `emaar-q2-no11-2021a.png`. The user wants the second photo (`emaar-q2-no11-2021b.png`) which shows the award positioned to the left of the "1st Place Top Performing Partner" award.

**File:** `src/pages/Awards.tsx`
- Change import on line 12 from `emaar-q2-no11-2021a.png` to `emaar-q2-no11-2021b.png`

## 2. Mortgage Calculator: Full Numbers Instead of Abbreviated

The compact mode (6-card grid) currently uses `formatCurrencyAbbreviated()` which shows values like "AED 1.6M" or "AED 400K". The user wants full readable numbers like "AED 1,600,000" so users know exactly how much they pay.

**File:** `src/components/MortgageCalculator.tsx`
- Lines 113, 127, 141, 155, 169, 184: Replace `formatCurrencyAbbreviated(...)` with `formatCurrency(...)` in all 6 compact cards
- Reduce font size in compact cards to fit full numbers: change `text-xs sm:text-sm` to `text-[10px] sm:text-xs` for the currency values so long numbers like "AED 2,000,000" fit within the card without overflowing

## 3. Awards Page: Hero Video + Premium UI

### 3a. Hero Section Video Background
Add a looping, muted background video (reuse the press-kit hero video or a premium awards-style video) behind the hero section for a premium feel.

**File:** `src/pages/Awards.tsx`
- Import the hero video asset
- Add a `<video>` element as an absolute background in the hero section with autoplay, loop, muted, playsInline
- Add a dark overlay gradient for text readability

### 3b. Fix Stats Cards Overflow
The "Social Followers" stat shows "1,000,000+" which overflows the card on mobile. 

**File:** `src/pages/Awards.tsx`
- Add responsive text sizing to the CounterStat component: `text-2xl md:text-4xl lg:text-5xl` instead of fixed `text-4xl md:text-5xl`
- Add `break-words` and `min-w-0` to prevent overflow

### 3c. Award Cards: Consistent Sizing and Premium Look
- Set a fixed height for the image container so all cards are uniform
- Ensure text content stays within card boundaries with `line-clamp` and proper padding
- Add a subtle gold glow on hover for premium feel

## 4. Developer Logo (Imtiaz): Fix Sizing

The Imtiaz logo appears too large and not readable in the `w-12 h-12` container with `object-fill` which stretches it.

**File:** `src/components/ProjectCard.tsx`
- Change the logo `<img>` from `object-fill` to `object-contain` with some padding (`p-1`) so the logo sits inside the container without being stretched/distorted
- This ensures logos like Imtiaz that have non-square aspect ratios remain readable

**File:** `src/components/ReellyProjectCard.tsx`
- Apply the same fix if the developer logo rendering exists here

## Technical Summary

| File | Change |
|------|--------|
| `src/pages/Awards.tsx` | Swap award07 to use `emaar-q2-no11-2021b.png`; add hero video background; fix stats overflow; improve card consistency |
| `src/components/MortgageCalculator.tsx` | Replace `formatCurrencyAbbreviated` with `formatCurrency` in all 6 compact cards; adjust font sizes for fit |
| `src/components/ProjectCard.tsx` | Change developer logo from `object-fill` to `object-contain p-1` for readable logos |
| `src/components/ReellyProjectCard.tsx` | Same logo fix |

