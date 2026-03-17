

## SESSION 8 — Footer Visual Consistency Fix

### Problems Identified (from screenshots at 85-87% scroll)

1. **"Licensed ✦ BUY ✦ SELL ✦ RENT ✦ REAL ESTATE In The UAE"** — The text uses `text-zinc-900` on a champagne background. "Licensed" and "UAE" use a gradient fill that makes them hard to read. The ✦ diamonds use `text-zinc-700` — too faint.

2. **Circles flanking the Licensed badge** (line 592, 621) — `bg-gradient-to-br from-zinc-700 via-zinc-600 to-gold/60` with fast `animate-pulse` and excessive glow shadows. Should match "Stay in the Loop" title's gold gradient style.

3. **"Stay in the Loop" title** — This is the **reference style**. Uses: `background: linear-gradient(135deg, #1a1a1a 0%, #333333 30%, #D4AF37 50%, #333333 70%, #1a1a1a 100%)` with `-webkit-background-clip: text`. This is readable and premium.

4. **Dark premium strip labels** — "Connect", "Mode", "Currency" use `text-gold/60` and `text-[10px]` — far too faint on the dark background.

5. **Currency/Unit controls** (FooterCurrencyUnit) — The `AED` button and `sq ft` / `sq m` toggles are champagne-colored on a dark strip but the inactive unit buttons use `bg-[#F5EBD7]/40 text-black/50` — extremely low contrast.

### Fix Plan

**File: `src/components/Footer.tsx`**

#### 1. Licensed badge text (lines 593-620)
- Change the main `<p>` from `text-zinc-900` to the same gradient text style as "Stay in the Loop"
- Apply the same `linear-gradient(135deg, #1a1a1a ... #D4AF37 ... #1a1a1a)` background-clip text to the ENTIRE "Licensed ✦ BUY ✦ SELL..." line (not just "Licensed" and "UAE")
- Remove the separate gradient styling on individual words — apply it to the whole `<p>` tag

#### 2. Flanking circles/dots (lines 592, 621)
- Change from `bg-gradient-to-br from-zinc-700 via-zinc-600 to-gold/60` to solid `bg-gold`
- Remove `animate-pulse` (too fast, not premium)
- Reduce shadow from aggressive `0_0_20px...0_0_40px` to subtle `0_0_8px_rgba(200,167,102,0.4)`

#### 3. ✦ diamonds in Licensed line (lines 603, 605, 607, 609)
- Change from `text-zinc-700` to `text-gold` for consistency with the "✦ Stay in the Loop ✦" heading

#### 4. Dark strip labels — increase contrast (lines 677, 688, 700)
- "Connect" label: `text-gold/60` → `text-gold`
- "Write Us" label: `text-gold/60` → `text-gold/90`
- "Mode" label: `text-gold/60` → `text-gold`
- "Currency" label in FooterCurrencyUnit (line 147): `text-gold/60` → `text-gold`

#### 5. FooterCurrencyUnit controls — increase contrast (lines 145-211)
- Inactive unit buttons (line 205): `text-black/50` → `text-black/70`
- Active unit button background stays as-is (already filled)

### Files Modified
- `src/components/Footer.tsx` — FooterCurrencyUnit component + footer licensed badge + dark premium strip

### Route
- All pages (footer is global)

### Testing Steps
1. Navigate to homepage, scroll to footer
2. Verify "Licensed ✦ BUY ✦ SELL..." line matches "Stay in the Loop" gold-gradient style
3. Verify flanking dots are solid gold, no pulsing
4. Verify "Connect", "Mode", "Currency" labels are clearly visible gold on dark strip
5. Verify AED dropdown and sq ft/sq m toggle have readable text

