
# NFC / Digital Card Mode — Business Card Designer

## What This Adds

When the user selects the **Digital** card shape, two enhancements activate:

1. **Phone mockup preview** — the card preview in the right panel is wrapped in an SVG-drawn phone frame (bezels, notch, home indicator), so the user sees exactly how their digital card looks on a handset screen.

2. **Export as HTML** — a new "Export HTML" button (visible only when shape is Digital) generates a complete, self-contained, mobile-optimised HTML file the user can download and host on any static hosting provider (GitHub Pages, Netlify, etc.) as their personal digital card landing page.

---

## Part 1 — Phone Mockup Preview

### Where it renders
Line ~2202–2256 in `BusinessCardDesigner.tsx` contains the card preview area:
```tsx
<div className="bg-white rounded-2xl border ... p-8 ... flex flex-col items-center gap-4">
  <div className="w-full max-w-[400px]">
    <AnimatePresence>
      <motion.div ...>
        <CardCanvas ... />
      </motion.div>
    </AnimatePresence>
  </div>
```

When `cardShape === "digital"`, we replace the plain `div.max-w-[400px]` wrapper with a new `PhoneMockup` component that draws the phone frame around the `CardCanvas`.

### PhoneMockup component (new, inline in the file)

Pure CSS/SVG — no extra dependency. The mockup is a `div` styled to look like a modern smartphone:

```
┌──────────────────────┐
│   ●  (notch/island)  │   ← top bar with time + camera
│                      │
│  ┌────────────────┐  │
│  │                │  │
│  │   CardCanvas   │  │
│  │   (9:16 card)  │  │
│  │                │  │
│  └────────────────┘  │
│         ▬            │   ← home indicator
└──────────────────────┘
```

Implementation approach:
- Outer shell: `div` with `border-[10px] border-[#1a1a1a] rounded-[36px] shadow-[0_0_0_2px_#333,0_30px_80px_rgba(0,0,0,0.5)] bg-[#1a1a1a] overflow-hidden relative`
- Top bar (status bar): `div` with flex, padding, tiny clock + camera pill — all non-interactive chrome
- Screen area: `div bg-black` that contains the `CardCanvas` directly
- Home indicator: short rounded white bar at bottom
- Volume buttons: `position:absolute` thin `div`s on the left edge
- Power button: thin `div` on the right edge

The phone frame adds ~44px top (status bar) + 20px bottom (home bar) + 12px sides of chrome padding.

The max width of the phone wrapper is `260px` to keep it proportional on the right panel.

### State change needed
No new state — only condition on `cardShape === "digital"` in the render at line 2203.

---

## Part 2 — Export as Mobile-Optimised HTML

### New `exportDigitalCardAsHtml()` function

A standalone function that takes all card state as arguments and returns a complete HTML string. The HTML string is then downloaded as a `.html` file using the standard `URL.createObjectURL(blob)` pattern already used by `exportCardAsPDF()`.

### HTML file contents

The exported file is **fully self-contained** — no external URLs except optional contact links. It renders identically to the live preview via inline CSS with no frameworks.

Structure of the generated HTML:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="${primaryColor}" />
  <title>${name} — Digital Card</title>
  <style>
    /* Reset + variables */
    /* Body: dark gradient bg matching SharedBusinessCard */
    /* Card: rendered via pure CSS matching the chosen template */
    /* Action buttons: phone/email/website/address clickable rows */
    /* Save Contact button: big gold CTA */
    /* Phone mockup CSS for the card preview section */
    /* PWA-ready: @media prefers-color-scheme etc. */
  </style>
</head>
<body>
  <!-- Header: name + company -->
  <!-- Card visual: template-specific HTML/CSS (no canvas, no React) -->
  <!-- Action links: tel:, mailto:, https:// -->
  <!-- Save Contact button: triggers inline base64-encoded .vcf download -->
  <!-- Footer: "Built with JBJ Business Card Designer" -->
  <script>
    // Inline vCard download — no external fetch needed
    function saveContact() { /* base64 vcf blob + anchor click */ }
  </script>
</body>
</html>
```

The vCard data is **baked inline as a base64 data URI** so the "Save Contact" button works even when hosted offline or without a server-side download endpoint.

### Template rendering in HTML

Each template is converted to an equivalent CSS-only representation:
- `modern` → `background: linear-gradient(135deg, ${primary} 0%, ...)` with white text
- `classic` → white background + left 6px border + primary color text
- `minimal` → `#fafafa` + centered layout + accent underline
- `bold` → dark `#0a0a0a` + primary colored name + uppercase styling
- `creative` → white + circle avatar + primary colored title
- `corporate` / `ai-design` / others → clean primary color gradient fallback

The card section in the HTML is a fixed-aspect `div` with `aspect-ratio: 9/16` matching the Digital shape ratio.

### Button placement

In the sticky header, alongside the existing "Export PDF" button, a new "Export HTML" button appears **only when `cardShape === "digital"`**:

```tsx
{cardShape === "digital" && (
  <Button
    onClick={handleExportHtml}
    disabled={isExportingHtml}
    variant="outline"
    className="gap-1.5 h-8 text-xs font-semibold border-blue-200 text-blue-700 hover:bg-blue-50"
  >
    {isExportingHtml ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
    {isExportingHtml ? "Exporting…" : "Export HTML"}
  </Button>
)}
```

A second, more prominent "Export HTML" button also appears inside the preview panel beneath the phone mockup (same way the Share button is duplicated in the preview area).

---

## Part 3 — Digital Mode NFC Tip Banner

When `cardShape === "digital"`, show a small informational banner below the phone mockup inside the preview area:

```
┌─────────────────────────────────────────────────────┐
│  📱 NFC / Digital Card Mode                         │
│  Export HTML to host as your digital card page.     │
│  Share the URL with an NFC tag to tap-to-connect.  │
└─────────────────────────────────────────────────────┘
```

This educates the user on the NFC use case without requiring any NFC chip integration (the app cannot write to NFC chips; that requires a native app — but we explain users can program any NFC tag with the hosted URL using any free NFC writer app).

---

## Files Changed

| File | Change |
|---|---|
| `src/components/corporate-suite/BusinessCardDesigner.tsx` | (1) Add `PhoneMockup` component (inline). (2) Wrap `CardCanvas` in `PhoneMockup` when `cardShape === "digital"`. (3) Add `handleExportHtml` + `exportDigitalCardAsHtml()` function. (4) Add "Export HTML" button to header + preview area. (5) Add NFC tip banner when Digital shape active. |

No backend changes. No new dependencies. No new files. No route changes.

---

## Implementation Order

1. Add `exportDigitalCardAsHtml()` function (pure function, can be done standalone)
2. Add `handleExportHtml` state + handler in the main component
3. Add `PhoneMockup` component (pure CSS, no props beyond `children`)
4. In the preview area (line ~2202): add condition `cardShape === "digital"` to swap the plain wrapper for `PhoneMockup`
5. Add the "Export HTML" button to the sticky header (condition-guarded)
6. Add the "Export HTML" button + NFC tip banner in the preview panel below the mockup
7. Add `isExportingHtml` state

---

## What the User Experiences

1. User selects "Digital" from the Card Shape grid
2. Preview area immediately changes to show the card inside a phone frame — they see the 9:16 portrait card sitting in a realistic handset
3. User customises the card (template, colors, typography, QR code etc.) seeing it exactly as a phone visitor would
4. User clicks "Export HTML" — a `.html` file downloads
5. User drags the file to Netlify, pushes to GitHub Pages, or uploads to any web host → instant digital card page at a public URL
6. User programs that URL into an NFC sticker (using any free NFC writer app) and attaches it to their physical card — tap the card → phone opens the digital card → tap "Save Contact"
