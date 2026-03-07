

# Fix E-Signature Field Placement, Drag, Display, Auto-Detect, Draw & Back Button Alignment

## Issues Identified

1. **Signature/Initials fields show label text instead of actual content** — In `DocumentFieldPlacer.tsx` lines 704-708, signature and initials fields render as `<Icon> + fieldConfig.label` (e.g. "Signature", "Initials" text). They should show the user's saved signature image or initials derived from the recipient's name.
2. **Drag repositioning is inaccurate** — `handleDragStart` doesn't capture the offset within the field where the user grabbed it, so `handleDrop` places the field's top-left at the cursor position instead of maintaining the grab offset. This causes the "jump" behavior.
3. **Auto-detect fields not working** — The edge function `esign-auto-detect-fields` passes `pdfUrl` which is a blob URL (from `URL.createObjectURL`). The AI gateway can't fetch blob URLs. Need to either upload the PDF first or send document text/metadata.
4. **No "Draw" option in the field placer** — User wants to draw a signature directly in the field box on the document.
5. **Back button misaligned with Upload icon** — In `CreateEnvelope.tsx` line 455, the Back button is small (`variant="ghost"`) while the title row has a `p-2 rounded-lg bg-zinc-900` icon box. Need to size the Back button to match.

## Plan

### 1. Show Actual Signature/Initials Content in Field Overlays

**File: `src/components/e-signature/DocumentFieldPlacer.tsx`**

In the field overlay rendering (lines 704-708), change the signature/initials fallback:
- **Signature fields**: Load user's saved signature from `ai_tool_projects` (favorite first). If a saved signature exists, render `<img src={savedSignatureUrl}>` filling the field box. If not, show a dashed placeholder saying "Click to sign".
- **Initials fields**: Render the recipient's initials (derived from `recipients.find(r => r.id === field.recipientId)?.name`) as large text, not the word "Initials".

Add state `savedSignatureUrl` loaded on mount from `ai_tool_projects` where `tool_type = 'signature_designer'` and `favorite = true`, same pattern already used for stamp.

### 2. Fix Drag Repositioning Accuracy

**File: `src/components/e-signature/DocumentFieldPlacer.tsx`**

- In `handleDragStart` (line 347): Calculate and store the offset between the cursor and the field's top-left corner using `e.clientX - fieldElement.getBoundingClientRect().left` and same for Y. Store in `e.dataTransfer` or a ref.
- In `handleDrop` (line 327): Subtract that offset when computing the new position so the field lands exactly where the user drops it, not shifted.

Use a `dragOffsetRef = useRef({x: 0, y: 0})` to store the grab offset since `dataTransfer` only supports string data.

### 3. Fix Auto-Detect — Handle Blob URLs

**File: `src/components/e-signature/DocumentFieldPlacer.tsx`**

The `handleAutoDetect` function sends `pdfUrl` to the edge function, but when it's a blob URL the AI can't access it. Fix:
- When `pdfFile` is available, read it as base64 and send `pdfBase64` to the edge function instead of `pdfUrl`.
- When only a remote URL is available, send `pdfUrl` as before.

**File: `supabase/functions/esign-auto-detect-fields/index.ts`**

- Accept optional `pdfBase64` field. When provided, mention in the prompt that it's a base64-encoded PDF (though the AI model can't actually read base64 binary). Since the AI can't truly analyze PDF content from base64 either, the practical fix is: use the fallback layout but make it smarter — apply it based on `recipientName` and `today` date. Log a warning. The auto-detect will produce smart defaults reliably instead of failing silently.

### 4. Add "Draw" Option for Signature Fields

**File: `src/components/e-signature/DocumentFieldPlacer.tsx`**

When user clicks on a placed signature field that has no content:
- Open a small modal/popover containing an `ESignaturePad` component.
- On signature drawn, store the data URL in the field's `value` property.
- Render `<img src={field.value}>` in the overlay when value is a data URL.

Add a state `drawingFieldId` and render a dialog with `ESignaturePad` when set.

### 5. Align Back Button with Title Icons

**File: `src/pages/e-signature/CreateEnvelope.tsx`**

Change the Back button (line 455) from `variant="ghost"` to include a matching icon container:
```
<Button variant="ghost" onClick={...} className="h-10 w-10 p-0 rounded-lg">
  <ArrowLeft className="w-5 h-5" />
</Button>
```
This makes it the same `h-10 w-10` as the `p-2 rounded-lg bg-zinc-900` icon box, creating visual alignment.

## Files to Modify

1. **`src/components/e-signature/DocumentFieldPlacer.tsx`** — Show real signatures/initials in fields, fix drag offset, fix auto-detect blob URL handling, add draw-in-field dialog
2. **`supabase/functions/esign-auto-detect-fields/index.ts`** — Accept `pdfBase64`, improve fallback behavior
3. **`src/pages/e-signature/CreateEnvelope.tsx`** — Align back button size

