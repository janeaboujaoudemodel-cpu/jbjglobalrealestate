

# Session 11 — E-Signature Flow Completion + Review & Send

## Current State

The 4-step workflow (Upload → Recipients → Place Fields → Review & Send) exists and is structurally complete. The edge function `esign-send-for-signature` correctly uploads to storage, inserts into `esign_envelopes`/`esign_recipients`/`esign_fields`, sends emails via Resend, and creates audit logs.

### Issues Found

1. **DocumentPreviewSummary field overlay positioning is broken**: The PDF canvas is rendered at 200% width then CSS-scaled to 50% (`transform: scale(0.5)`). Field overlays use `field.x * 0.5` as percentage positions — but they're positioned in the *outer* container (not inside the scaled div), so they don't align with the PDF content. The overlays need to be *inside* the scaled container, or the math needs to account for the transform.

2. **Preview clips at 400px**: `maxHeight: 400px` with `overflow: hidden` cuts off the bottom of most documents. The scaled PDF canvas has `minHeight: 800px` → at 50% scale that's 400px, so barely fits and fields near the bottom are invisible.

3. **Step 4 lacks recipient detail**: Only shows count of recipients. Doesn't show names, emails, signing order, or per-recipient field breakdown.

4. **No asset indicators**: Step 4 doesn't show which stamp/signature assets are loaded or will appear on the document.

5. **Step 4 has no confirmation gate**: User can click "Send for Signature" without reviewing — no checkbox or explicit acknowledgment.

## Implementation Plan

### 1. Fix DocumentPreviewSummary Field Positioning

Move field overlays *inside* the scaled container so they naturally align with the PDF:
```tsx
<div style={{ transform: "scale(0.5)", transformOrigin: "top left", width: "200%" }}>
  <PdfPageCanvas ... />
  {/* Fields rendered HERE, inside the scaled container */}
  {pageFields.map(field => (
    <div style={{ position: "absolute", left: `${field.x}%`, top: `${field.y}%`, width: field.width, height: field.height }} />
  ))}
</div>
```
Increase `maxHeight` to 500px to prevent clipping.

### 2. Enhance Step 4 Summary

Replace the minimal summary card with a comprehensive review section:
- **Document**: name, file size, page count
- **Recipients table**: name, email, signing order, field count per recipient, field types
- **Assets Used**: show stamp/signature thumbnails if loaded
- **Expiry**: "7 days from now" with actual date

### 3. Add Confirmation Checkbox

Add a checkbox before the "Send for Signature" button: "I have reviewed the document, recipients, and field placements." Button stays disabled until checked.

### 4. Show Recipient Field Breakdown in Preview

Update `DocumentPreviewSummary` to show per-recipient breakdown with color-coded badges showing field types and page numbers.

## Files Modified

| File | Changes |
|------|---------|
| `DocumentPreviewSummary.tsx` | Fix field overlay positioning (move inside scaled container), increase maxHeight, enhance recipient breakdown |
| `CreateEnvelope.tsx` | Add confirmation checkbox, enhance Step 4 summary with recipient table + asset indicators + expiry date |

