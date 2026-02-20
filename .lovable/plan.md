
# Signature Pad in Brand Asset Library

## What We're Building

A fully integrated **draw-your-signature** panel inside the `BrandAssetLibrary` component. When a user is on the "Signature" tab, instead of seeing only a file upload button, they will see a live canvas pad where they can draw with a mouse (desktop) or their finger (mobile). After drawing, they click **Save to Library** — the canvas is converted to a transparent PNG, uploaded to the `brand-assets` storage bucket, saved to `design_assets` with `asset_type = "signature"`, and auto-selected. The saved signature then appears in the asset grid and can be inserted into any document exactly like a logo.

---

## Architecture Overview

```text
BrandAssetLibrary
├── Tabs: [Monogram] [Logo] [Signature] [Stamp]
│
└── Signature Tab (NEW)
    ├── Draw Pad (canvas) — 280 × 130px, transparent bg
    │   ├── Mouse: mousedown/mousemove/mouseup
    │   └── Touch: touchstart/touchmove/touchend (e.preventDefault)
    ├── Stroke Style: dark navy ink, 2.5px round cap
    ├── Toolbar: [Clear] [Save to Library ▶]
    ├── "Or upload an image" file picker fallback (existing)
    └── Saved signatures grid (existing BrandAsset grid)
```

---

## Where Saved Signatures Appear

Once saved, a signature asset can be applied in:

| Tool | How signature is used |
|---|---|
| **Cover Letter Generator** | Rendered as an `<img>` in the sign-off block above "Yours sincerely," (replaces the plain underline) |
| **Business Card Designer** | Already accepts `"signature"` in `assetTypes` — appears on card as a draggable image |
| **Company Profile Builder** | Can be added via Brand Assets panel as a visual element |
| **CV/Resume Builder** | Can be inserted in the header or footer (same logo mechanism) |

The sign-off upgrade in **Cover Letter Generator** is the highest-value insertion point — it is the only document that has a dedicated signature line. We will wire it there as a concrete demonstration.

---

## Technical Details

### Change 1 — `BrandAssetLibrary.tsx` (primary file)

**New state inside the component (only active when `activeType === "signature"`):**
```typescript
const canvasRef    = useRef<HTMLCanvasElement>(null);
const containerRef = useRef<HTMLDivElement>(null);
const [isDrawing, setIsDrawing] = useState(false);
const [hasDrawing, setHasDrawing] = useState(false);
const [savingDrawing, setSavingDrawing] = useState(false);
```

**Canvas init** (called on mount and on resize, only when signature tab is active):
- Sets canvas dimensions using `devicePixelRatio` for crisp Retina rendering (same pattern as existing `ESignaturePad.tsx`)
- Fills background as **transparent** (no `fillRect`) so the saved PNG has a clear background — critical for placing on any document color

**Drawing handlers** (copy from the production-tested `ESignaturePad.tsx` that already exists):
- `startDrawing`, `draw`, `stopDrawing` — mouse + touch dual support
- `e.preventDefault()` on touch events to prevent scroll conflicts on mobile
- Stroke style: `#1a1a1a`, `lineWidth: 2.5`, `lineCap: "round"`, `lineJoin: "round"`

**`saveDrawnSignature()` function:**
```typescript
const saveDrawnSignature = async () => {
  const canvas = canvasRef.current;
  if (!canvas || !hasDrawing || !user) return;
  setSavingDrawing(true);
  
  // Convert canvas to Blob (PNG with transparency preserved)
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const name = `Signature — ${new Date().toLocaleDateString("en-GB")}`;
    const path = `${user.id}/signature/${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(path, blob, { contentType: "image/png", upsert: false });
    if (uploadError) { toast.error("Save failed"); setSavingDrawing(false); return; }
    
    const { data: urlData } = supabase.storage.from("brand-assets").getPublicUrl(path);
    
    const { data: inserted, error: dbError } = await supabase
      .from("design_assets")
      .insert({ user_id: user.id, name, asset_type: "signature", file_url: urlData.publicUrl, thumbnail_url: urlData.publicUrl })
      .select().single();
    if (dbError) { toast.error("DB save failed"); setSavingDrawing(false); return; }
    
    setAssets(prev => [inserted as BrandAsset, ...prev]);
    if (inserted) onSelect(inserted as BrandAsset);
    clearCanvas();
    toast.success("Signature saved to Brand Library!");
    setSavingDrawing(false);
  }, "image/png");
};
```

**UI rendered when `activeType === "signature"`:**

```text
┌──────────────────────────────────────────────┐
│  Draw your signature below                   │
│ ┌────────────────────────────────────────┐  │
│ │                                        │  │
│ │         [canvas drawing area]          │  │
│ │  _____________________________         │  │
│ │    Sign above this line                │  │
│ └────────────────────────────────────────┘  │
│  [Clear]          [Save to Library  →]       │
│                                              │
│  — or upload an image —                      │
│  [Upload signature file]                     │
└──────────────────────────────────────────────┘
```

Below this panel, the existing **asset grid** shows all previously saved signatures (both drawn and uploaded).

**One important UX detail**: The canvas is only initialized when `activeType === "signature"`. A `useEffect` with `[activeType]` dependency calls `initCanvas()` only then, and a `ResizeObserver` on `containerRef` keeps dimensions correct when the panel is collapsed/expanded.

---

### Change 2 — `CoverLetterGenerator.tsx` (signature insertion)

**New state:**
```typescript
const [signatureUrl, setSignatureUrl] = useState("");
const [signatureSize, setSignatureSize] = useState(80);
```

**Update the `BrandAssetLibrary` call** inside the Brand Assets collapsible panel to include signatures, and add a second `onSelect` callback that handles `asset_type === "signature"` separately from logos:

```typescript
<BrandAssetLibrary
  assetTypes={["monogram", "logo", "signature"]}
  selectedUrl={logoUrl || signatureUrl}
  onSelect={asset => {
    if (asset.asset_type === "signature") {
      setSignatureUrl(asset.file_url);
    } else {
      setLogoUrl(asset.file_url);
    }
  }}
  ...
/>
```

**Update `LetterPreview`** — add `signatureUrl` and `signatureSize` props. In the sign-off block (currently line ~182–191), replace the plain underline with:

```tsx
{/* Sign-off */}
{letter && (
  <div style={{ marginTop: sp(16) }}>
    <p style={{ fontSize: fs(10.5) }}>Yours sincerely,</p>
    {signatureUrl ? (
      <img
        src={signatureUrl}
        alt="Signature"
        style={{ height: sp(signatureSize * 0.6), maxWidth: sp(180), objectFit: "contain", display: "block", margin: `${sp(6)}px 0 ${sp(4)}px` }}
      />
    ) : (
      <div style={{ marginTop: sp(10), borderTop: `1px solid ${cfg.dividerColor}`, paddingTop: sp(8), width: 140 }} />
    )}
    <p style={{ fontSize: fs(12), fontWeight: 700, color: cfg.accentColor }}>
      {form.yourName || "Your Name"}
    </p>
  </div>
)}
```

**Update PDF export** (`exportPDF` function, currently around line 437–440): where `page.drawLine` draws the signature underline, add an image embed when `signatureUrl` is set:
```typescript
// If signature image exists, embed it above the typed name
if (signatureUrl) {
  const sigImageBytes = await fetch(signatureUrl).then(r => r.arrayBuffer());
  const sigImage = await pdfDoc.embedPng(sigImageBytes);
  const sigDims = sigImage.scale(signatureSize / 160);
  page.drawImage(sigImage, { x: margin, y: y - sigDims.height + 10, width: sigDims.width, height: sigDims.height });
  y -= sigDims.height + 4;
} else {
  page.drawLine({ start: { x: margin, y }, end: { x: margin + 140, y }, thickness: 0.8, color: accent });
  y -= 14;
}
```

---

## Files Changed

| File | Type of Change |
|---|---|
| `src/components/corporate-suite/BrandAssetLibrary.tsx` | Add signature draw pad with canvas, save-to-library flow, conditional rendering when signature tab active |
| `src/components/corporate-suite/CoverLetterGenerator.tsx` | Add `signatureUrl`/`signatureSize` state; update `LetterPreview` sign-off block; update PDF export to embed signature image |

**No database migration needed** — `design_assets` table already has `asset_type` as a freeform text column and `"signature"` is already a known value in the codebase. The `brand-assets` storage bucket already exists.

---

## Mobile Behaviour

The canvas uses `touch-none` CSS class to disable browser scroll interference during drawing. The `touchstart`/`touchmove`/`touchend` handlers call `e.preventDefault()` to fully capture finger input. The canvas height is set to `130px` — tall enough to write comfortably on mobile without taking over the screen.

---

## Implementation Sequence

1. Update `BrandAssetLibrary.tsx` — add canvas refs, drawing state, `initCanvas`, drawing handlers, `saveDrawnSignature`, conditional UI block for signature tab
2. Update `CoverLetterGenerator.tsx` — add signature state, update `BrandAssetLibrary` call, update `LetterPreview` sign-off, update PDF export
