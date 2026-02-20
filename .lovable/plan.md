
# Business Card Designer — End-to-End Verification Plan

## What Will Be Tested (And What the Code Shows)

This plan walks through every scenario the user asked to verify, with findings from the source code audit, identified bugs, and the exact fixes needed.

---

## Scenario 1 — Touch Drag on Mobile (Name / Title / Company)

### How it works in code
The `CardCanvas` component has a `startTouchDrag()` handler (lines 564–612) that:
1. Captures `e.touches[0]` as the start point
2. Attaches `touchmove` and `touchend` to `window` with `{ passive: false }` (required to call `e.preventDefault()`)
3. Converts pixel delta to percentage positions relative to the container `getBoundingClientRect()`
4. Snaps to center at ±5% threshold and shows gold guide lines

The draggable field overlays (lines 670–685) wire up `onTouchStart` to `startTouchDrag` for `name`, `title`, and `company`.

**One bug found:** Touch drag only works when `editLayout === true`. But the **"Edit Layout" button is only visible in the sticky header at the top of the page** — on mobile this header scrolls offscreen. Once the user scrolls down to the card and tries to drag, `editLayout` is `false` and `startTouchDrag` returns immediately (line 569: `if (!editLayout) return`). 

**Fix needed:** Repeat the "Edit Layout" toggle button directly above the card preview in the right panel (already at line 1974 there is a label but no button). Add a small "Edit Layout" toggle button next to the "Front / Back" side switcher in the preview section so it's always reachable on mobile without scrolling up.

---

## Scenario 2 — Voice Input on All 7 Fields

### How it works in code
`fields` array (lines 1193–1201) defines 7 entries — name, title, company, phone, email, website, address — all with `voiceKey: true`.

The render loop (lines 1944–1965) maps over `fields` and renders a `VoiceInputButton` for every entry where `f.voiceKey === true`. Since all 7 have `voiceKey: true`, all 7 get voice buttons.

**Status: Fully implemented.** No fix needed.

The `VoiceInputButton` component uses the `voice-to-text` edge function and correctly appends transcript to the specific field via `onTranscript={t => setData(prev => ({ ...prev, [f.key]: t }))}`.

---

## Scenario 3 — Enable QR → Switch to Email Type → Override Input Appears

### How it works in code
Lines 1550–1630 control this flow:

1. Toggle `Switch` → sets `qrEnabled = true`
2. Content type grid (lines 1579–1602) has Email as a valid option. Clicking Email calls `setQrContentType('email')` and auto-populates `qrCustomContent` from `data.email` if it exists
3. The override input renders at line 1605 via this condition:
   ```
   {(qrContentType === "url" || qrContentType === "text" || qrContentType === "email" || qrContentType === "phone") && (
   ```
   
This correctly includes `"email"` so the override `Input` field will appear.

4. The helper text at line 1624 shows "Using card email · Type above to override" when `qrContentType === "email"` and `!qrCustomContent` — giving the user clear feedback.

**Status: Fully implemented.** No fix needed.

**One UX improvement found:** The `buildQrData()` function (line 131–133) uses `custom || data.email`. When the user clicks "Email" and their email field is already set, `qrCustomContent` is pre-populated with `data.email` (line 1590). This means the input is pre-filled, which is correct and helpful.

---

## Scenario 4 — Switch to Ticket Shape → Stub Layout Renders

### How it works in code
The `CardFace` component (lines 215–253) has a dedicated `if (cardShape === "ticket" && side === "front")` branch rendering:
- A **left stub** (32% width, `primary` background, initial avatar circle + company name)
- A **perforated divider** (1px wide, dashed linear-gradient)
- A **right body** (flex-1, name/title/contact info)

The shape is selectable in the Card Shape grid (line 1306–1320) via the `CARD_SHAPES` constant (line 100: `{ id: "ticket", label: "Ticket", icon: <Ticket size={14} />, ratio: "5 / 2" }`).

**One bug found:** The `backTemplate` for the Ticket shape falls through to the generic `back` face renderer (line 255–271), which renders the primary color with the watermark company name in the center — this is correct. However, the ticket shape's back doesn't have a dedicated layout (no `if (cardShape === "ticket" && side === "back")` branch). The generic back is fine visually but doesn't maintain the ticket aesthetic (no stub on the back). This is a cosmetic gap, not a blocking bug.

**Second bug found:** `resolvedNameSize` for the ticket uses `nameFontSize * scale` or `18 * scale` (line 181). But on ticket shape the right body uses `resolvedNameSize * 0.7` (line 243). When `scale = 1`, this renders the name at ~12.6px which is correct for the narrow right panel. No issue.

**Status: Structurally correct.** Renders with the correct 3-column stub layout.

---

## Summary of Bugs Found and Fixes Required

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | "Edit Layout" button only in sticky header — scrolls offscreen on mobile, making touch drag unreachable | Medium | Add a compact "Edit Layout" toggle button alongside the "Front / Back" switcher inside the card preview area (visible without scrolling) |
| 2 | Ticket back side uses generic `primary` color block, no ticket-specific stub layout | Low (cosmetic) | Add `if (cardShape === "ticket" && side === "back")` branch in `CardFace` mirroring the stub aesthetic but reversed |

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/corporate-suite/BusinessCardDesigner.tsx` | (1) Add "Edit Layout" toggle button in the preview area header row (line ~1971, alongside Front/Back switcher). (2) Add Ticket-back branch in `CardFace`. |

No backend changes. No new dependencies. No edge function changes.

---

## Implementation Order

1. Add the "Edit Layout" toggle to the preview area (makes mobile touch drag actually reachable)
2. Add the Ticket back-side layout (completes the Ticket shape's both-sides consistency)
3. Both changes are in the same file — can be done in one pass
