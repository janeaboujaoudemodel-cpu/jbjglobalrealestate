
# Fix JBJ E-Sign: Full Rebuild of Document Field Placer + Auto-Detect Fields

## Root Cause Analysis — Every Bug Identified

### Bug 1: PDF Never Renders in the Document Preview (Critical)
In `DocumentFieldPlacer.tsx` lines 181–188, the "document preview" area is just a static placeholder div with a `<PenTool>` icon and text "Document Preview / Drag fields to position them." The `pdfUrl` prop is accepted but **never used** — no `<iframe>`, no `<embed>`, no PDF rendering at all. This is why uploading a PDF shows nothing.

### Bug 2: Clicking "Signature / Initials / Date / Text" Does Nothing Visible (Critical)
The field type selector buttons at lines 148–161 only set `selectedFieldType` state — they don't add a field. The user must then click "Add Field" as a separate step. Users are clicking the field type buttons expecting a field to appear immediately (like DocuSign), but nothing happens. The UX flow is broken and unintuitive.

### Bug 3: "Add Field" Text Box Cannot Be Typed Into (Critical)
When a field IS added via "Add Field," it renders as an absolutely-positioned `<div>` with a colored background and label. It has no `<input>` inside it, so naturally nothing can be typed. Text fields need an actual input element.

### Bug 4: No Auto-Detect Fields Feature
There is no AI-assisted field detection at all. When "Auto Detect" is clicked, nothing exists.

---

## Complete Fix Plan

### Fix 1: Render the PDF in the document area
Replace the static placeholder in `DocumentFieldPlacer.tsx` with a proper PDF viewer using an `<iframe>` pointing to `pdfUrl`. This renders the actual uploaded PDF so the user can see the document and place fields visually on top of it.

```
<div className="relative" style={{ height: '700px' }}>
  <iframe src={pdfUrl} className="w-full h-full border-0" title="Document Preview" />
  {/* Fields overlay on top of the iframe */}
  {pageFields.map(field => <FieldOverlay ... />)}
</div>
```

### Fix 2: Make field-type buttons immediately place a field on click
Remove the separate "Add Field" button — or keep it but make clicking any field type button (Signature, Initials, Date, Text) immediately add that field at a smart default position. This matches DocuSign's UX where clicking the field type adds it instantly.

Alternate approach (better): Keep the field type buttons as "selected type" and make the document area clickable — clicking anywhere on the PDF adds a field at that position. This is the most intuitive approach.

**Implementation**: Add an `onClick` handler to the PDF wrapper div that:
1. Calculates x/y as percentages of the wrapper
2. Creates a new field at that position with the currently selected type
3. Immediately shows it on the overlay

### Fix 3: Make text fields interactive with actual input elements
In the field overlay rendering (lines 196–223), replace the static colored div content with:
- For `type === "text"`: render a transparent `<input>` inside the field box with a white/light background so it's typeable
- For `type === "signature"` / `type === "initials"`: keep the colored indicator but make it clearly draggable
- For `type === "date"`: render a small `<input type="date">` or auto-fill with today's date

### Fix 4: Add Auto-Detect Fields button
Add a new "Auto Detect Fields" button to the toolbar. When clicked, it uses **Lovable AI (Gemini)** to analyze the PDF and intelligently place common contract fields:

**Backend edge function** (`supabase/functions/esign-auto-detect-fields/index.ts`):
- Accepts `{ pdfUrl, recipientId }` 
- Uses `google/gemini-2.5-flash` with vision to analyze the document page screenshot
- Returns an array of detected fields: `{ type, x, y, width, height, label, suggestedValue }`
- Field types detected: signature lines, date fields, name fields, initials boxes, checkboxes, address fields, phone fields

**Frontend**: The "Auto Detect" button shows a spinner while analyzing, then places all detected fields on the overlay with proper positioning and auto-fills text fields with available data (recipient name, today's date).

---

## Detailed Implementation

### Files to Create/Modify

**1. `src/components/e-signature/DocumentFieldPlacer.tsx` — Complete rewrite**

Key changes:
- Render `<iframe src={pdfUrl}>` as the document base
- Add click-to-place logic on the document overlay
- Make text fields have actual `<input>` elements
- Add page navigation (Previous/Next page) since PDFs can be multi-page
- Add "Auto Detect Fields" button in toolbar
- Visual improvements: field labels with recipient color indicator, resize handles
- All buttons fully visible (no faded styling)

**2. `supabase/functions/esign-auto-detect-fields/index.ts` — New edge function**

Uses Gemini vision to analyze a screenshot/page of the PDF and return detected field positions. Falls back to a smart template-based detection (standard contract fields: Signature at bottom, Date next to it, Name at top, etc.) if vision analysis fails.

**3. `src/pages/e-signature/CreateEnvelope.tsx` — Minor fix**

- The Step 3 condition `{currentStep === 3 && pdfUrl && (` is correct, but need to ensure the `DocumentFieldPlacer` container has proper height so the iframe can render
- Add styling so the field placer card doesn't clip the PDF

---

## UI/UX Design for the Rebuilt Field Placer

```text
┌─────────────────────────────────────────────────────────────┐
│ TOOLBAR                                                     │
│ [Select Recipient ▾] [✍ Signature] [AB Initials] [📅 Date] │
│ [T Text] | [🔍 Auto Detect Fields] [🗑 Clear All]          │
└─────────────────────────────────────────────────────────────┘
┌──────────────────────────────┐ ┌──────────────────────────┐
│ PDF DOCUMENT AREA            │ │ PLACED FIELDS LIST       │
│                              │ │                          │
│  [actual PDF iframe here]    │ │ ✍ Signature - John Smith │
│                              │ │ 📅 Date - John Smith     │
│  ← Click anywhere to place  │ │ T Name - John Smith      │
│    selected field type →     │ │                          │
│                              │ │ RECIPIENTS LEGEND        │
│  [draggable field overlays]  │ │ ● John Smith (3 fields)  │
│                              │ │ ● Jane Doe (2 fields)    │
└──────────────────────────────┘ └──────────────────────────┘
│ Page: ← 1 of 3 → │
```

---

## Auto-Detect Fields Logic

When "Auto Detect" is clicked:

1. **Gemini Vision Analysis**: Send the PDF URL to the edge function with prompt:
   > "Analyze this contract document and identify all signature fields, date fields, name fields, initial boxes, checkboxes, and text input areas. Return their approximate positions as percentages (0-100) of page width/height."

2. **Smart Field Placement**: Based on the AI response, place fields:
   - Signature lines → `type: "signature"` field
   - "Date:" labels → `type: "date"` field with today's date auto-filled
   - "Name:" / "Print Name:" labels → `type: "text"` with recipient name auto-filled
   - "Initials:" boxes → `type: "initials"` field
   - Checkbox areas → `type: "text"` with "☑" suggested value

3. **Auto-fill available data**: 
   - Recipient name → prefill text fields labeled "name"
   - Today's date → prefill date fields
   - Leave signature/initials for manual drawing

4. **Result**: Fields appear positioned on the document, labeled, color-coded by recipient — user just needs to review and drag to fine-tune.

---

## Implementation Order

1. Rewrite `DocumentFieldPlacer.tsx` with PDF iframe + click-to-place + interactive text inputs
2. Create `esign-auto-detect-fields` edge function 
3. Wire Auto Detect button to edge function in the field placer
4. Test end-to-end: upload PDF → see PDF → click to place fields → type in text fields → auto-detect

---

## No Database Changes Required
All existing tables (`esign_fields`, `esign_recipients`, `esign_envelopes`, `esign_audit_log`) already have the correct schema. This is purely a frontend + new edge function change.
