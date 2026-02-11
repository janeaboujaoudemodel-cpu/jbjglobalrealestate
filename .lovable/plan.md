
# Fix Digital Business Card UI Issues

## 1. Save Contact Buttons - Fix Color and Width

**Problem:** "Save Company Contact" and "Save Personal Contact" buttons use a bright gold gradient (`GOLD.gradient`) and are stretched full-width (`w-full`).

**Fix:**
- Replace `background: GOLD.gradient` with the approved champagne gradient: `background: linear-gradient(135deg, #FDFBF7, #F5F0E6, #EDE4D3)`
- Change border from solid gold to `border-gold/50` (champagne tone)
- Remove `w-full` so buttons auto-size to their content (inline-flex, centered)

Applies to both buttons at lines 428-438 and 479-489.

## 2. Email and Website Cards - Reduce Stretching

**Problem:** The "Send Email" and "Website" cards are full-width (`w-full`) with heavy padding, making them look oversized.

**Fix:**
- Remove `w-full` from both cards (lines 493-511 and 514-534)
- Use `inline-flex` with `mx-auto` centering so they size to content
- Reduce padding from `py-4 px-6` to `py-3 px-5` for a tighter fit

## 3. Social Media Icons - Hover Effect

**Problem:** Social icons have no distinct hover state.

**Fix:** On hover, the circle background becomes black and the icon becomes gold/white.

For all social icon links (lines 546-620+):
- Add `hover:bg-black` class and use CSS group hover to change icon color to white on hover
- Add `group` class to each `<a>` tag
- Add `group-hover:text-white` transition to each icon

## Technical Details

**File:** `src/pages/DigitalCard.tsx`

### Save buttons (lines 428-438 and 479-489):
```
- style={{ background: GOLD.gradient, border: `2px solid ${GOLD.primary}` }}
+ style={{ background: 'linear-gradient(135deg, #FDFBF7, #F5F0E6, #EDE4D3)', border: `2px solid ${GOLD.primary}50` }}
- className="w-full flex items-center justify-center ..."
+ className="inline-flex items-center justify-center mx-auto ..."
```

### Email card (line 495) and Website card (line 518):
```
- className="w-full flex items-center gap-3 py-4 px-6 ..."
+ className="inline-flex items-center gap-3 py-3 px-5 ... mx-auto"
```

### Social icons (all ~8 social links):
```
- className="w-11 h-11 rounded-full ... bg-white"
+ className="w-11 h-11 rounded-full ... bg-white group hover:bg-black"
- <FaLinkedinIn className="w-5 h-5" style={{ color: GOLD.primary }} />
+ <FaLinkedinIn className="w-5 h-5 group-hover:text-white transition-colors" style={{ color: GOLD.primary }} />
```
