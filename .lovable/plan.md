
# QR Code Generator — Status & Targeted Fixes

## Current State: Already Fully Built

The QR code generator in the Business Card Designer is **already fully implemented** with:

- 5 content types: URL, vCard, Phone, Email, Plain Text
- Color and background pickers (auto-synced to card primary color)
- Size slider (40–180px) with position picker (5 options)
- AI styling prompt ("dark blue, large, bottom-right" → auto-applies)
- Live preview showing QR on both the Front and Back card previews

The feature is accessible via the **QR Code** collapsible panel in the left sidebar. Enabling it shows the QR on both card sides in the live preview.

---

## Two Real Gaps Found

### Gap 1 (Critical): QR missing from PDF back page

In the `exportCardAsPDF` function, the QR image is correctly fetched and drawn onto `fp` (the front page) at line 775. However, the **back page** (`backPage`, lines 781–799) has zero `drawImage` calls — so when a user exports the PDF, the QR only appears on Page 1 (front) and is absent from Page 2 (back).

Fix: After drawing the back page background and company text, embed the same `qrImg` object (already fetched) onto `backPage` at the same position coordinates.

### Gap 2 (UX): URL field doesn't auto-populate from card data

When `qrContentType === "url"`, the URL input (`qrCustomContent`) starts empty. The user's website is already typed into the card data (`data.website`), but they have to re-type it manually into the QR URL field. The `buildQrData` function does fall back to `data.website` if `qrCustomContent` is empty — so the QR actually does use `data.website` correctly. But the input field shows as empty, creating confusion.

Fix: When a user switches to the `"url"` content type and `qrCustomContent` is empty, auto-fill it with `data.website`. A one-line `useEffect` or an `onClick` handler on the URL type button handles this.

---

## Implementation Plan

### File: `src/components/corporate-suite/BusinessCardDesigner.tsx`

**Fix 1 — PDF back page QR embed** (lines 759–799):

Move the QR fetch and embed into a shared block that draws on both pages:

```text
BEFORE:
  fp.drawImage(qrImg, ...)     ← front page only
  // Back page (no QR)

AFTER:
  fp.drawImage(qrImg, ...)     ← front page
  backPage.drawImage(qrImg, ...) ← back page (same position)
```

The `qrImg` PNG is already fetched into memory — we just reuse the same embedded image object on the second page. No extra network call needed.

**Fix 2 — Auto-fill URL from card website** (lines 1424–1442, the content type buttons):

When the user clicks the "URL" type button, if `qrCustomContent` is empty and `data.website` is set, populate `qrCustomContent` with `data.website`:

```typescript
onClick={() => {
  setQrContentType("url");
  if (!qrCustomContent && data.website) {
    setQrCustomContent(data.website);
  }
}}
```

This is a 3-line change on the existing button handler.

---

## What Changes

| File | Lines | Change |
|---|---|---|
| `BusinessCardDesigner.tsx` | ~775–799 | Draw QR on `backPage` after drawing it on `fp` |
| `BusinessCardDesigner.tsx` | ~1429–1433 | Auto-fill `qrCustomContent` from `data.website` when URL tab is selected |

No new dependencies. No database changes. No new edge functions.

---

## How the Back Page QR Looks in the PDF

```text
PDF Page 2 (Back of card):
┌──────────────────────────────────────┐
│                                      │
│         COMPANY NAME (faded)         │
│                                      │
│                              [QR ██] │  ← bottom-right (or whichever position user set)
│ www.website.com                      │
└──────────────────────────────────────┘
```

The QR size, position, and color are all exactly as the user configured in the QR panel — the same settings are reused on both pages.
