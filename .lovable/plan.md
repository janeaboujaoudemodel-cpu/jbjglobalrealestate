
# Business Card Designer — Full Upgrade: Card Shapes, QR Code, Drag-to-Rearrange, AI Customization

## What Exists Today

The Business Card Designer at `/toolkit/corporate-suite/business-card` currently has:
- 6 design templates (Modern, Classic, Minimal, Bold, Creative, Corporate) — all horizontal, standard 3.5"×2" ratio
- 8 color presets
- Brand asset library (logo/monogram upload)
- Front/back flip toggle
- PDF export via pdf-lib
- No QR code support
- No card shape options (all are standard horizontal rectangles)
- No drag-to-rearrange for text fields

The project already uses `api.qrserver.com` for QR code generation (used in Certificate Generator and Market Report). No new library needed.

---

## Everything This Plan Implements

### Part 1 — Card Shape System (New)

Add a `CardShape` type and a shape selector panel in the left sidebar. Each shape changes how the card's container is rendered in the preview.

**7 Card Shapes:**

| Shape | Aspect Ratio | Container Style |
|---|---|---|
| Horizontal | 3.5 / 2 | Standard rectangle (current default) |
| Vertical | 2 / 3.5 | Portrait rectangle |
| Square | 1 / 1 | Equal-width square |
| Rounded Square | 1 / 1 | Extra large border-radius (40px) |
| Wide | 4 / 1.5 | Ultra-wide panoramic |
| Digital Screen | 9 / 16 | Phone-sized, tall vertical |
| Ticket | 5 / 2 | Long horizontal like a boarding pass |

For each shape, the `CardFace` component adapts font scaling and layout. A new `shapeStyle` helper function returns the container dimensions and border-radius override. The shape setting is stored in a `cardShape` state variable.

Note: Triangle and true circle shapes would clip text unreadably — the design will offer "Rounded Square" (a squircle) as the closest practical rounded option, and digital screen format for modern vertical use cases.

### Part 2 — QR Code Generator (New)

Add a **QR Code** collapsible panel to the left sidebar with these controls:

**QR Content options:**
- URL / Website link
- Contact card (vCard data: name, phone, email, company)
- Custom text / message
- Email address
- Phone number

**QR Styling controls:**
- **Size slider**: 50px–200px
- **Color picker**: Auto-sync with card's primary color (default) OR manual hex override
- **Background color**: Transparent or white
- **Placement**: Bottom-right, Bottom-left, Top-right, Center
- **AI Describe**: A text field where user types e.g. "make it gold with rounded corners" → calls the `gemini-chat` edge function → returns updated color/size/style suggestions
- **On/Off toggle**: Show or hide QR on card preview

**QR Generation:** Uses the existing `api.qrserver.com` API with color parameters:
```
https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=...&color=C8A766&bgcolor=ffffff
```

The QR code is overlaid on the `CardFace` preview using `position: absolute` inside the card container wrapper. When exporting PDF, the QR image is fetched, converted to a data URL, embedded in the pdf-lib document, and drawn at the correct position.

**Auto-color sync:** When the user changes the card color preset, the QR code foreground color automatically updates to match `preset.primary` (stripped of the `#`).

### Part 3 — Drag-to-Rearrange Fields (New)

The card currently has a fixed layout per template. The user wants to move individual text elements (Name, Title, Company) around the card.

**Implementation approach — Draggable field overlays:**

Add a new state `fieldPositions` that stores `{ name: {x, y}, title: {x, y}, company: {x, y} }` as percentage offsets (0–100). A new `CardCanvas` wrapper renders the `CardFace` as a background and overlays draggable text labels on top using `position: absolute`.

Each draggable label uses React's `onMouseDown` / `onMouseMove` / `onMouseUp` events to track drag position. The labels render with a dashed border in "edit mode" and clean with no border in preview mode. A toggle button "Edit Layout" / "Lock Layout" switches between modes.

A "Reset Layout" button restores default positions.

For simplicity and robustness, the draggable fields are rendered as absolutely-positioned overlays on the card preview — the underlying `CardFace` continues to render with placeholder invisible text, while the overlays show the actual text. This avoids reimplementing all 6 templates from scratch.

### Part 4 — AI QR Customization (New)

In the QR Code panel, add an "AI Style" input field:
- User types a description (e.g. "dark blue, large, bottom right corner")
- Calls the existing `gemini-chat` edge function with a structured prompt
- AI returns JSON: `{ color: "#hex", bgColor: "#hex", size: number, position: "bottom-right" | ... }`
- Frontend parses response and applies settings automatically
- Voice input button (`VoiceInputButton`) on the AI describe field

### Part 5 — Voice Input on Key Fields

Add `VoiceInputButton` (already exists at `src/components/ui/VoiceInputButton.tsx`) to:
- Full Name input
- Job Title input
- Company input
- AI QR describe field

---

## Technical Architecture

### State additions to `BusinessCardDesigner.tsx`:

```typescript
type CardShape = "horizontal" | "vertical" | "square" | "rounded-square" | "wide" | "digital" | "ticket";

// QR Code state
const [qrEnabled, setQrEnabled] = useState(false);
const [qrContent, setQrContent] = useState(""); // URL or text
const [qrSize, setQrSize] = useState(80);
const [qrColor, setQrColor] = useState(""); // empty = auto-sync to preset
const [qrPosition, setQrPosition] = useState<"bottom-right" | "bottom-left" | "top-right" | "top-left" | "center">("bottom-right");
const [qrAiPrompt, setQrAiPrompt] = useState("");
const [isAiStylingQr, setIsAiStylingQr] = useState(false);

// Card shape
const [cardShape, setCardShape] = useState<CardShape>("horizontal");

// Drag rearrange
const [editLayout, setEditLayout] = useState(false);
const [fieldPositions, setFieldPositions] = useState({
  name:    { x: 10, y: 70 }, // % offsets
  title:   { x: 10, y: 55 },
  company: { x: 10, y: 42 },
});
```

### QR code URL builder:

```typescript
function buildQrUrl(data: string, color: string, size: number) {
  const colorHex = color.replace("#", "") || preset.primary.replace("#", "");
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size*2}x${size*2}&data=${encodeURIComponent(data)}&color=${colorHex}&bgcolor=ffffff&margin=2`;
}
```

### Shape style helper:

```typescript
function getShapeStyle(shape: CardShape): React.CSSProperties {
  const shapes: Record<CardShape, React.CSSProperties> = {
    "horizontal":    { aspectRatio: "3.5 / 2",  borderRadius: 12 },
    "vertical":      { aspectRatio: "2 / 3.5",  borderRadius: 12 },
    "square":        { aspectRatio: "1 / 1",    borderRadius: 12 },
    "rounded-square":{ aspectRatio: "1 / 1",    borderRadius: 40 },
    "wide":          { aspectRatio: "4 / 1.5",  borderRadius: 12 },
    "digital":       { aspectRatio: "9 / 16",   borderRadius: 24 },
    "ticket":        { aspectRatio: "5 / 2",    borderRadius: 8  },
  };
  return shapes[shape];
}
```

### PDF export update:

When QR is enabled, the export function:
1. Fetches the QR image URL → converts to data URL via `fetch` + `FileReader`
2. Embeds image bytes with `pdfDoc.embedPng()`
3. Draws QR at the correct position on the front page before saving

---

## Files to Edit

Only one file needs to change:

```
src/components/corporate-suite/BusinessCardDesigner.tsx   ← Full upgrade
```

No new edge functions needed (QR via qrserver.com API, AI via existing gemini-chat edge function). No database changes needed.

---

## Implementation Plan (in order within the file)

1. Add `CardShape` type and `CARD_SHAPES` array constant
2. Add new state variables (cardShape, qr*, editLayout, fieldPositions)
3. Update `CardFace` to accept `shapeStyle` prop and apply shape-based aspect ratio/radius
4. Add `CardCanvas` wrapper component that overlays draggable fields on `CardFace`
5. Add QR code overlay rendered on top of card preview (positioned per `qrPosition`)
6. Add "Card Shape" selector panel in left sidebar (before Template picker)
7. Add "QR Code" collapsible panel in left sidebar (after Brand Assets)
8. Add "Edit Layout" toggle button in the preview header area
9. Add voice input buttons on Name, Title, Company, and QR AI describe fields
10. Update `exportCardAsPDF` to embed QR code image when `qrEnabled && qrContent`
