# Footer + Mode Switcher polish

Three small premium fixes: a broader currency list with cleaner sqft/sqm separation in the footer, plus a refined Mode dropdown header and tighter row alignment.

## 1. Footer currency selector — add the full world set

File: `src/components/CurrencySwitcher.tsx` (`SUPPORTED_CURRENCIES` is the single source of truth used by the footer, hero, account menu, and `useCurrency`).

Expand the list from 10 → ~30 major globally-traded currencies, alphabetised after the AED + USD anchors:

```
AED 🇦🇪, USD 🇺🇸, EUR 🇪🇺, GBP 🇬🇧, INR 🇮🇳, SAR 🇸🇦, CNY 🇨🇳, RUB 🇷🇺,
CAD 🇨🇦, AUD 🇦🇺, JPY 🇯🇵, CHF 🇨🇭, SGD 🇸🇬, HKD 🇭🇰, KRW 🇰🇷, TRY 🇹🇷,
QAR 🇶🇦, KWD 🇰🇼, BHD 🇧🇭, OMR 🇴🇲, EGP 🇪🇬, ZAR 🇿🇦, BRL 🇧🇷, MXN 🇲🇽,
NZD 🇳🇿, SEK 🇸🇪, NOK 🇳🇴, DKK 🇩🇰, PLN 🇵🇱, THB 🇹🇭, MYR 🇲🇾, IDR 🇮🇩,
PHP 🇵🇭, PKR 🇵🇰, NGN 🇳🇬
```

Also add matching FX entries to `CURRENCY_RATES` and `CURRENCY_SYMBOLS` in `src/hooks/useCurrency.ts` so price conversions still work. The footer dropdown already scrolls (`max-h-80 overflow-y-auto`) so no layout change needed.

## 2. Footer sqft / sqm — premium divider + visual distinction

File: `src/components/Footer.tsx` (lines 137–151).

Two refinements applied together:

- Insert a 1px champagne hairline divider between the two buttons (`bg-[#D9C292]/40`) so it reads as a deliberate split, not one merged pill.
- Give the inactive side a slightly muted tone (`text-white/55`) and the active side a soft champagne backdrop + white text, so the active selection is immediately legible.

Result:

```text
[ sq ft ] │ [ sq m ]
   ▲ active = white text on champagne tint
            ▲ inactive = muted white, transparent
```

## 3. ModeSwitcher dropdown — refined header + tighter rows

File: `src/components/ModeSwitcher.tsx`.

a. **Header polish** (lines 198–203, the "Select your mode" block the user dictated as "lecture mode"):
   - Restyle into a true premium header: white background, single champagne-gold hairline bottom border, smaller pill-style eyebrow tag "MODE", crisp 14px black title "Select your mode", 11px gray subtitle. Removes the heavy gray box look.

b. **Tighten the four category rows** (line 206 + 245):
   - Reduce inter-card spacing from `gap-3` (12px) → `gap-1.5` (6px).
   - Reduce row vertical padding from `py-3` → `py-2.5` and `min-h-[84px]` → `min-h-[72px]`.
   - Apply `line-clamp-1` (instead of 2) and drop `min-h-[28px]` on the description so all four rows have identical height regardless of text length.
   - Standardise the right-side chip width (`min-w-[78px]` → `w-[84px]`) so "Selected" and short labels align edge-to-edge across all four rows.

c. **Container width**: bump `w-[340px]` → `w-[360px]` to absorb the chip width change without truncating "Investor + Broker".

## Files to edit

- `src/components/CurrencySwitcher.tsx` — expand `SUPPORTED_CURRENCIES`
- `src/hooks/useCurrency.ts` — add matching `CURRENCY_RATES` and `CURRENCY_SYMBOLS` entries
- `src/components/Footer.tsx` — sqft/sqm divider + active-state contrast
- `src/components/ModeSwitcher.tsx` — header restyle, tighter row spacing, uniform chip width

## Out of scope

- Live FX feed (rates stay as the static table the platform already uses).
- Header/account-menu mode switcher visuals stay untouched — the user's complaint is specific to the footer-triggered dropdown which uses the same component, so the fix applies everywhere automatically.
