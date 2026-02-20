
# Typography Controls — Stamp Generator + Business Card + CV Builder

## Summary

The Stamp Generator already has a complete, fully-wired typography panel (Bold toggle, Italic toggle, Font Size +/− stepper with slider, Font Family picker — all feeding into `StampSVGRenderer` via props). The task is to replicate this same pattern in Business Card Designer and CV/Resume Builder, where no typography controls exist today.

---

## Current State Analysis

### Stamp Generator (COMPLETE — reference implementation)
- State: `fontBold`, `fontItalic`, `manualFontSize`, `fontFamily`
- UI: Bold B / Italic I toggle buttons (gold border when active), +/− size stepper with range slider, font family button list
- Rendering: All 4 props flow into `StampSVGRenderer` via regex replacements on the SVG source
- Location: "Fonts" tab of the left panel (lines 570–648)

### Business Card Designer (MISSING)
- `CardFace` component (line 170): `fontFamily` hardcoded to `'Helvetica Neue', Arial, sans-serif` inline in `baseStyle`
- No `fontBold`, `fontItalic`, `fontSize` state exists
- No typography panel in the left column
- Fix: Add 3 state variables, a new "Typography" collapsible panel in the left column, and pass the values into `CardFace` as props that override the `baseStyle.fontFamily` and adjust the `fontWeight`/`fontStyle` on the name element

### CV/Resume Builder (MISSING)
- `CVPreview` component (line 44): accepts `{ data, template, scale }` — no font props
- Each template hardcodes font families (Georgia for Executive, Helvetica for Modern, etc.)
- No `fontBold`, `fontItalic`, `fontSize` state exists
- Fix: Add 3 state variables, a typography collapsible panel, pass font props to `CVPreview`, and apply them in the preview renderer

---

## Implementation Plan

### File 1: `src/components/corporate-suite/BusinessCardDesigner.tsx`

**Step A — Add state (in the main component body, after existing state declarations ~line 893):**
```typescript
// Typography
const [cardFontFamily,  setCardFontFamily]  = useState("'Helvetica Neue', Arial, sans-serif");
const [cardFontBold,    setCardFontBold]    = useState(false);
const [cardFontItalic,  setCardFontItalic]  = useState(false);
const [cardFontSize,    setCardFontSize]    = useState<number | null>(null); // null = auto
```

**Step B — Update `CardFace` component signature to accept font props:**
```typescript
function CardFace({
  data, template, primary, secondary, accent, side, scale, shapeStyle, aiDesignData, cardShape,
  fontFamily, fontWeight, fontStyle, nameFontSize,
}: { ..., fontFamily?: string; fontWeight?: string; fontStyle?: string; nameFontSize?: number | null }) {
```

In the `baseStyle` object (line 164), replace the hardcoded `fontFamily` with the prop:
```typescript
fontFamily: fontFamily || "'Helvetica Neue', Arial, sans-serif",
```

For the name element in each template, add:
```typescript
fontWeight: fontWeight || "800"   // default per-template, overridden when bold is on
fontStyle:  fontStyle  || "normal"
fontSize:   nameFontSize ? nameFontSize * scale : 18 * scale  // existing sizes scaled by prop
```

**Step C — Add "Typography" collapsible panel in the left column** (insert between Brand Assets and the Scan/Card Info panels — after line 1283, before the `DocumentExtractorUpload` at line 1638):

The panel follows the exact same Collapsible pattern as the Colors panel:
- Collapsible header with a `Type` icon and "Typography" label
- Inside: Bold **B** toggle, Italic *I* toggle (same button style as Stamp Generator)
- Font size stepper: − / value / + buttons (min 8, max 18, step 0.5, null = auto)
- Font family quick-select: 5 compact options — Helvetica, Georgia, Garamond, Courier, Impact

**Step D — Pass props to all `CardFace` usages** in the JSX (there are multiple render sites for the front/back previews and the AI design mini-preview). Each needs:
```tsx
fontFamily={cardFontFamily}
fontWeight={cardFontBold ? "bold" : undefined}
fontStyle={cardFontItalic ? "italic" : undefined}
nameFontSize={cardFontSize}
```

---

### File 2: `src/components/corporate-suite/CVResumeBuilder.tsx`

**Step A — Add state (after `logoSize` state at line 701):**
```typescript
const [cvFontFamily,  setCvFontFamily]  = useState("");  // "" = use template default
const [cvFontBold,    setCvFontBold]    = useState(false);
const [cvFontItalic,  setCvFontItalic]  = useState(false);
const [cvFontSize,    setCvFontSize]    = useState<number | null>(null); // null = auto
```

**Step B — Update `CVPreview` component signature:**
```typescript
function CVPreview({
  data, template, scale,
  fontFamily, fontWeight, fontStyle, fontSizeOverride,
}: {
  data: CVData; template: Template; scale?: number;
  fontFamily?: string; fontWeight?: string; fontStyle?: string; fontSizeOverride?: number | null;
}) {
```

In each template's outer `<div>` style, apply the font family override when provided:
```typescript
fontFamily: fontFamily || (template === "executive" ? "Georgia, serif" : "'Helvetica Neue', Arial, sans-serif"),
```

For the `name` heading `h1`/`h2` in each template, apply:
```typescript
fontWeight: fontWeight || "700",
fontStyle: fontStyle || "normal",
fontSize: fontSizeOverride ? fontSize(fontSizeOverride) : fontSize(20),  // existing default
```

**Step C — Add "Typography" collapsible panel in the left column** (insert after the Template picker panel, before the Section tabs panel — around line 910):

Same pattern as Business Card — Collapsible with `Type` icon:
- Bold **B** / Italic *I* toggle buttons
- Font size stepper (min 8, max 24, null = auto per-template)
- Font family picker: 4 options — Helvetica, Georgia, Garamond, Custom (type-in)

**Step D — Pass font props to `CVPreview`** in the main JSX (the right column preview render) and in the `exportCVAsPDF` function to apply font settings to the PDF output as well.

---

## Font Family Options

Both tools will offer the same 5 clean font choices (compact button grid, no preview labels needed since the button text itself uses the font):

| Label | Value |
|---|---|
| Helvetica | `'Helvetica Neue', Arial, sans-serif` |
| Georgia | `Georgia, 'Times New Roman', serif` |
| Garamond | `Garamond, 'Palatino Linotype', serif` |
| Courier | `'Courier New', Courier, monospace` |
| Futura | `'Century Gothic', 'Trebuchet MS', sans-serif` |

---

## UI Pattern (matches Stamp Generator exactly)

```
┌─────────────────────────────────────────┐
│ ▲  TYPOGRAPHY                           │
├─────────────────────────────────────────┤
│ Style                                   │
│ ┌──────┐  ┌──────┐                     │
│ │  B   │  │  I   │  (toggle buttons)   │
│ └──────┘  └──────┘                     │
│                                         │
│ Font Size              Auto  [12pt]     │
│ [−]  ────────●──────────  [+]          │
│ Range: 8–18 pt · Auto = template default│
│                                         │
│ Font Family                             │
│ ┌────────────┐ ┌──────────────────────┐ │
│ │  Helvetica │ │  Georgia             │ │
│ └────────────┘ └──────────────────────┘ │
│ ┌──────────┐ ┌───────────┐ ┌────────┐  │
│ │ Garamond │ │  Courier  │ │ Futura │  │
│ └──────────┘ └───────────┘ └────────┘  │
└─────────────────────────────────────────┘
```

Active state: gold border + light gold background (matching existing `border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)]` pattern).

---

## Files Changed

| File | Changes | Scope |
|---|---|---|
| `src/components/corporate-suite/BusinessCardDesigner.tsx` | Add 4 state vars, update `CardFace` props, add Typography collapsible panel, pass to all render sites | ~60 lines added |
| `src/components/corporate-suite/CVResumeBuilder.tsx` | Add 4 state vars, update `CVPreview` props, add Typography collapsible panel, pass to preview + PDF export | ~60 lines added |

No edge function changes. No database changes. Stamp Generator is already complete and untouched.

---

## Key Behaviors After Implementation

1. **Stamp Generator** — unchanged, already works (Bold, Italic, Font Size, Font Family all wired up)
2. **Business Card** — new "Typography" collapsible in the left column. Toggling Bold makes the cardholder name and contact fields heavier. Italic adds slant. Font size slider adjusts the name element. Font family changes the card's entire typeface. All changes appear live in the preview.
3. **CV/Resume** — new "Typography" collapsible below the Template picker. Bold/Italic affect the name heading. Font family overrides the template's default face (e.g. switching Executive template from Georgia to Helvetica). Font size scales the name heading. All changes appear instantly in the live A4 preview.
