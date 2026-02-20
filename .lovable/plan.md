
# Business Card Designer — Full Overhaul: Logo on Card, QR on Preview, Draggable Logo, Per-Side Colors, AI Design Templates, Alignment Guides

## Issues Identified (Root Causes)

### Bug 1 — Logo Not Showing on Card Preview
In `CardCanvas` (line 382), the logo only renders when `side === "front"`:
```typescript
{logoUrl && side === "front" && (
```
This means clicking "Back" hides the logo. Also the logo is a simple fixed-position overlay but is not passed to `CardFace` at all — so it never appears inside the card's own rendering. **Fix:** Show logo on both front and back, and make it independently draggable (separate from the text field drag system).

### Bug 2 — QR Code Not Showing on Card Preview
Looking at `CardCanvas` line 424:
```typescript
{qrEnabled && qrUrl && side === "front" && (
```
The QR renders on the card canvas — but the `AnimatePresence` key includes the card state (template/color/side/shape), which causes a re-render that can reset or flicker the QR overlay. More critically, the QR image is a cross-origin fetch from `api.qrserver.com` which may fail silently. The QR also only appears on the `"front"` side. **Fix:** Enable QR on both front and back sides, ensure the image loads correctly with proper error handling, and add a visible loading state.

### Bug 3 — No Per-Side Color System
Currently there is a single color preset (`colorIdx`) applied to both sides. The back side (`side === "back"` in `CardFace`) uses `primary` as background and `secondary` as text — this is the same color as the front.

## Everything Being Built

### Fix 1 — Logo On Card (Both Sides) + Draggable Logo
- Separate logo state from draggable text fields
- Add `logoPos` state: `{ x: number, y: number }` as percentage (default top-right: `{ x: 80, y: 5 }`)
- Logo is always shown on BOTH front and back — user can drag it independently
- In edit layout mode, the logo also gets a dashed border and grab cursor
- Logo drag uses the same mouse event system as text fields

### Fix 2 — QR Code on Preview (Both Sides, Reliable)
- Remove the `side === "front"` restriction — QR shows on both front and back
- Add `onLoad` / `onError` handlers to the QR `<img>` so the user sees a spinner while loading
- Show a placeholder outline box with "QR Loading..." text until image loads
- Ensure the AnimatePresence key does NOT force QR to re-mount unnecessarily (separate QR key from card key)

### Fix 3 — Per-Side Color System with Color Wheel
- Add `frontColorIdx` and `backColorIdx` as separate state variables (default: both 0)
- The front/back toggle buttons become color-aware — show a colored dot to indicate the current side's color
- In the Color section of the left panel, show two pickers: **"Front Color"** and **"Back Color"**, each with the 8 preset swatches AND a `<input type="color">` color wheel for fully custom color
- The `CardCanvas` receives `backPrimary`, `backSecondary`, `backAccent` props and uses them when `side === "back"`
- The QR auto-sync color uses the front card's primary color

### Fix 4 — AI-Generated Design Templates
Add a new `"ai-generated"` template option. When selected:
- A sidebar panel shows: **Industry** selector (Real Estate, Tech, Fashion, etc.), **Style** selector (Geometric, Lines, Minimalist, Futuristic, Organic), and a **Generate** button
- Clicking Generate calls `gemini-chat` edge function with a prompt asking for SVG path data and design instructions
- AI returns JSON with: `{ shapes: [...], colors: {...}, layout: "..." }` — describes geometric/decorative SVG elements
- The `CardFace` for the `"ai-generated"` template renders these shapes as inline SVG on top of the card background
- A **Regenerate** button re-calls AI with a different seed for variety
- AI template is labeled `"AI Design"` in the template grid with a ✨ badge

### Fix 5 — Alignment Guides
When dragging any element (logo, name, title, company):
- Show dashed alignment guide lines when the dragged element is within 5% of center (horizontal and vertical)
- A horizontal center guide: a thin dashed line across the full card width at 50% height
- A vertical center guide: a thin dashed line down the full card height at 50% width
- Guides appear with a label "CENTER" and snap the element into place if within 5% distance
- Color: gold dashed lines with 50% opacity

### Fix 6 — Save and Adapt Button
Add a **"Save Card"** button in the preview panel header that:
- Saves the current card settings (data, template, colors, QR config, logo URL, shape) to the `design_assets` table as a JSON blob with `asset_type = "stamp"` (reusing existing infrastructure)
- Shows a toast: "Card saved! You can reload it from Brand Assets."

### Fix 7 — QR on Back Side
- When `side === "back"` and `qrEnabled`, the QR also renders on the back of the card
- User controls remain the same — position and size apply to both sides

## Technical Architecture

### New State Variables:
```typescript
// Per-side colors
const [frontColorIdx, setFrontColorIdx] = useState(0);
const [backColorIdx, setBackColorIdx] = useState(0);
const [frontCustomColor, setFrontCustomColor] = useState(""); // hex override
const [backCustomColor, setBackCustomColor] = useState("");

// Logo dragging
const [logoPos, setLogoPos] = useState({ x: 78, y: 4 }); // % offsets

// AI template
const [aiTemplateStyle, setAiTemplateStyle] = useState("geometric");
const [aiTemplateIndustry, setAiTemplateIndustry] = useState("real-estate");
const [aiDesignData, setAiDesignData] = useState<null | { svgPaths: string[]; colors: string[] }>(null);
const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);
```

### CardCanvas Changes:
```typescript
// Props now include:
backPrimary: string;
backSecondary: string;
backAccent: string;
logoPos: { x: number; y: number };
onLogoMove: (pos: { x: number; y: number }) => void;
showAlignGuides: boolean; // true when dragging and near center
```

### Alignment Snap Logic:
```typescript
const SNAP_THRESHOLD = 5; // % distance
const snapX = Math.abs(newX - 50) < SNAP_THRESHOLD ? 50 : newX;
const snapY = Math.abs(newY - 50) < SNAP_THRESHOLD ? 50 : newY;
const showHGuide = Math.abs(newY - 50) < SNAP_THRESHOLD;
const showVGuide = Math.abs(newX - 50) < SNAP_THRESHOLD;
```

## Files to Edit

Only one file changes:
```
src/components/corporate-suite/BusinessCardDesigner.tsx   ← Full upgrade
```

No new edge functions, no database changes.

## Implementation Order Within The File

1. Add `frontColorIdx`, `backColorIdx`, `frontCustomColor`, `backCustomColor` state variables
2. Add `logoPos` state and logo drag handler using same mouse event system
3. Update `CardCanvas` to accept `backPrimary/Secondary/Accent`, use correct colors per side, show logo on BOTH sides, enable QR on BOTH sides, add alignment guide lines during drag
4. Update `CardFace` `side === "back"` to accept and use `backPrimary`, `backSecondary`, `backAccent` 
5. Add AI template type to `TEMPLATES` array and add `CardFace` rendering branch for it
6. Add Color panel update: split into "Front Color" and "Back Color" sections with preset swatches + `<input type="color">` color wheel for each
7. Add AI Design panel (new collapsible) with industry/style selector and Generate button
8. Update `CardCanvas` call site to pass all new props
9. Add "Save Card" button to header
10. Fix QR preview: add `onError` handler, remove `side === "front"` restriction
