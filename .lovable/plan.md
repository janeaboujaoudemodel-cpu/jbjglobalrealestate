
# Digital Business Card Layout Improvements

## Changes Overview

Three fixes in `src/pages/DigitalCard.tsx`:

## 1. Center Save Contact buttons under their sections

Both "Save Company Contact" (line 428) and "Save Personal Contact" (line 479) currently use `inline-flex` with `mx-auto`, but the parent `<div>` is not set to center them as block-level elements. Wrap each button in a `<div className="flex justify-center">` or add `text-center` / `flex flex-col items-center` to the parent section divs (lines 391-439 and 442-490) so the buttons sit centered under their respective contact details.

## 2. Reorganize Send Email, Share This Card, and Website into a row of 3 cards

Currently these are stacked vertically as individual links/buttons. Restructure them into a horizontal row of 3 equally-styled cards:

- **Remove** the current standalone "Share Card Button" section (lines 626-636) from the bottom
- **Replace** the current Email (lines 492-511) and Website (lines 513-534) blocks with a 3-column grid: `grid grid-cols-3 gap-3`
- Each card: Send Email (left), Share This Card (center), Website (right)
- All three cards share the same styling: white background, gold border, rounded, icon circle on top or left, consistent padding

## 3. Technical Details

**File:** `src/pages/DigitalCard.tsx`

### Save buttons centering (lines 391 and 442):
Add `flex flex-col items-center` to both Company and Personal section wrapper divs so the `inline-flex` buttons naturally center.

### Three-card row (replace lines 492-534 and remove lines 626-636):
```text
<div className="grid grid-cols-3 gap-3 mb-3">
  {/* Send Email */}
  <a href="mailto:..." className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-white shadow-md hover:shadow-lg transition-all" style={{ border: '2px solid GOLD/50' }}>
    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background, border }}>
      <Mail icon />
    </div>
    <span className="text-sm font-semibold text-center">Send Email</span>
  </a>

  {/* Share This Card */}
  <button onClick={setShowShareOptions(true)} className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-white shadow-md hover:shadow-lg transition-all" style={{ border: '2px solid GOLD/50' }}>
    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background, border }}>
      <Share2 icon />
    </div>
    <span className="text-sm font-semibold text-center">Share Card</span>
  </button>

  {/* Website */}
  <a href={website} className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-white shadow-md hover:shadow-lg transition-all" style={{ border: '2px solid GOLD/50' }}>
    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background, border }}>
      <Globe icon />
    </div>
    <span className="text-sm font-semibold text-center">Website</span>
  </a>
</div>
```

- The old full-width black "Share This Card" button at the bottom (lines 626-636) is removed since it is now part of the 3-card row
- The share modal remains unchanged
- Each card uses a vertical layout (icon on top, label below) for a clean, premium, balanced appearance
