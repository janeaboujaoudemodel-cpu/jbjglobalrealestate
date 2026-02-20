
# Wire Business Card QR into CV Builder — Footer QR Toggle

## Summary

Add a "QR Code" collapsible panel to the CV Builder's left controls panel. When enabled, it generates the same vCard QR code as the Business Card Designer (using the same `buildQrData` / `buildQrUrl` utility functions, copied/extracted into the CV Builder) and appends it to the bottom-right corner of every CV template preview and both PDF and image exports.

The QR is a branded vCard type by default — encoding name, title, company (if set), phone, email, and website — matching the Business Card's vCard QR encoding exactly.

---

## Architecture

```text
CVResumeBuilder.tsx
│
├── NEW state: cvQrEnabled, cvQrColor, cvQrSize (small controls)
│
├── NEW local helpers: buildQrData(), buildQrUrl()  ← same logic as BusinessCardDesigner
│
├── CVPreview component
│   └── NEW prop: qrEnabled, qrUrl (pre-built img URL)
│   └── NEW: QR footer strip appended at bottom of EVERY template
│       └── <img src={qrUrl} /> + "Scan to connect" label + thin accent divider line
│
├── exportCVAsPDF() 
│   └── NEW params: qrEnabled, qrData, qrColor
│   └── Fetches QR image as bytes, embeds it in bottom-right corner of the PDF page
│
├── exportCVAsImage()
│   └── No change needed — html2canvas captures the preview div including the QR footer
│
└── NEW Collapsible "QR Code" panel in left controls
    ├── Toggle Switch — enable/disable
    ├── Colour picker — QR dot colour (defaults to template accent colour)
    ├── Size slider — 48–120px
    └── Live preview of the QR src to confirm it resolves
```

---

## Detailed Changes — `CVResumeBuilder.tsx` only

No new files, no backend changes, no new dependencies.

### 1. Utility functions to add (near top of file, after imports)

Extract the same two pure helpers from `BusinessCardDesigner.tsx`:

```typescript
function buildCVQrData(data: CVData): string {
  return [
    "BEGIN:VCARD", "VERSION:3.0",
    `FN:${data.name}`,
    data.title    && `TITLE:${data.title}`,
    data.email    && `EMAIL:${data.email}`,
    data.phone    && `TEL:${data.phone}`,
    data.website  && `URL:${data.website}`,
    data.location && `ADR:;;${data.location};;;;`,
    "END:VCARD",
  ].filter(Boolean).join("\n");
}

function buildCVQrUrl(qrData: string, color: string, size: number): string {
  const colorHex = color.replace("#", "");
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&data=${encodeURIComponent(qrData)}&color=${colorHex}&bgcolor=ffffff&margin=2`;
}
```

These are self-contained — no shared module required.

### 2. New state in `CVResumeBuilder` component

```typescript
const [cvQrEnabled, setCvQrEnabled] = useState(false);
const [cvQrSize,    setCvQrSize]    = useState(64);   // px in preview
const [cvQrColor,   setCvQrColor]   = useState("");   // "" = use template accent
const [cvQrOpen,    setCvQrOpen]    = useState(false);
```

And a derived value computed from current data and selected template accent:
```typescript
const cvQrData = data.name || data.email ? buildCVQrData(data) : "";
const cvQrColor_ = cvQrColor || TEMPLATES.find(t => t.id === template)!.accent;
const cvQrUrl  = cvQrEnabled && cvQrData ? buildCVQrUrl(cvQrData, cvQrColor_, cvQrSize) : "";
```

### 3. `CVPreview` component — new props + footer strip

**New props added:**
```typescript
qrEnabled?: boolean;
qrUrl?: string;
qrSize?: number;
qrAccent?: string;
```

**Footer strip** — appended inside every template's outer wrapper `div`, just before the closing tag. For all 12 templates this is a consistent 3-element row:

```tsx
{qrEnabled && qrUrl && (
  <div style={{
    borderTop: `1px solid ${accent}20`,
    marginTop: 12 * scale,
    padding: `${8 * scale}px ${px}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8 * scale,
    background: `${accent}04`,
  }}>
    <div style={{ textAlign: "right" }}>
      <p style={{ fontSize: 7 * scale, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: accent, opacity: 0.7 }}>Scan to Connect</p>
      {data.email && <p style={{ fontSize: 6.5 * scale, color: "#9ca3af", marginTop: 1 * scale }}>{data.email}</p>}
    </div>
    <img
      src={qrUrl}
      alt="QR"
      crossOrigin="anonymous"
      style={{ width: (qrSize ?? 64) * scale, height: (qrSize ?? 64) * scale, flexShrink: 0 }}
    />
  </div>
)}
```

**Challenge with templates that use `display: flex` with a sidebar (executive, timeline, europass, twocol):** These templates render their outer wrapper as a horizontal flex row, so appending a footer inside that would sit alongside the sidebar rather than below the content. The fix is to wrap each such template's current outer `div` content in a new inner `div style={{ display: "flex", flexDirection: "column", flex: 1 }}` and then append the footer strip as a sibling at the bottom. Since each template returns its own self-contained JSX, this is straightforward to handle per-template.

For the **academic** (default `return`) and other full-width templates, the footer strip appends naturally.

### 4. All call sites of `CVPreview` — pass new props

Two call sites currently exist:
1. Line 1351 — the main live preview in the right panel
2. Line 1374 — the template mini-thumbnails grid (12 small previews)

For the **main preview** (line 1351): pass all four new props:
```tsx
<CVPreview
  ...existing props...
  qrEnabled={cvQrEnabled}
  qrUrl={cvQrUrl}
  qrSize={cvQrSize}
  qrAccent={cvQrColor_}
/>
```

For the **mini-thumbnail grid** (line 1374): pass `qrEnabled={false}` always — we don't want a QR visible in the tiny 20%-scale thumbnails.

### 5. `exportCVAsPDF()` — embed the QR image in the PDF

The function currently takes `(data: CVData, template: Template)`. Extend the signature:

```typescript
async function exportCVAsPDF(
  data: CVData,
  template: Template,
  options?: { qrEnabled?: boolean; qrData?: string; qrColor?: string; qrSize?: number }
)
```

Inside, after the existing page drawing is complete (line 763, just before `const pdfBytes = await pdfDoc.save()`), add:

```typescript
if (options?.qrEnabled && options?.qrData) {
  try {
    const qrImgUrl = buildCVQrUrl(options.qrData, options.qrColor || "#000000", 200);
    const resp = await fetch(qrImgUrl);
    const buf  = await resp.arrayBuffer();
    const qrPdfImage = await pdfDoc.embedPng(new Uint8Array(buf));
    const qrPx = Math.max(48, Math.min(120, options.qrSize ?? 64)) * 1.0;
    // Bottom-right corner with 20px margin
    page.drawImage(qrPdfImage, {
      x: W - qrPx - 20,
      y: 16,
      width: qrPx,
      height: qrPx,
    });
    // Tiny "Scan to connect" label above it
    page.drawText("SCAN TO CONNECT", {
      x: W - qrPx - 20,
      y: qrPx + 22,
      size: 6,
      font: bold,
      color: hex(options.qrColor || "#9ca3af"),
      opacity: 0.6,
    });
  } catch {
    // QR embed failed silently — don't block PDF export
  }
}
```

### 6. Update `handleExport` to pass QR options

At line 903, change:
```typescript
await exportCVAsPDF(data, template);
```
to:
```typescript
await exportCVAsPDF(data, template, {
  qrEnabled: cvQrEnabled,
  qrData: cvQrData,
  qrColor: cvQrColor_,
  qrSize: cvQrSize,
});
```

### 7. New "QR Code" collapsible panel in the left controls

Added after the Typography collapsible (after line 1106) and before the Template picker. Uses the existing `Collapsible` + `Switch` component pattern already present in the file:

```tsx
<Collapsible open={cvQrOpen} onOpenChange={setCvQrOpen}>
  <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
    <CollapsibleTrigger asChild>
      <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
        <div className="flex items-center gap-2">
          <QrCode size={13} className="text-[hsl(var(--gold))]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">QR Code</span>
          {cvQrEnabled && <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold))]" />}
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <Switch checked={cvQrEnabled} onCheckedChange={setCvQrEnabled} />
          <ChevronDown size={13} className={`... ${cvQrOpen ? "rotate-180" : ""}`} />
        </div>
      </button>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div className="px-4 pb-4 pt-3 border-t border-[hsl(var(--border))] space-y-4">
        
        {/* Info banner */}
        <div className="bg-[hsl(var(--gold)/0.05)] border border-[hsl(var(--gold)/0.2)] rounded-xl p-3 text-[10px] text-[hsl(var(--muted-foreground))]">
          Adds a vCard QR code to the CV footer. Recipients can scan to save your contact instantly — same branding as your Business Card.
        </div>

        {/* QR size slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">QR Size</p>
            <span className="text-[10px] font-mono">{cvQrSize}px</span>
          </div>
          <input type="range" min={40} max={120} step={4} value={cvQrSize}
            onChange={e => setCvQrSize(Number(e.target.value))}
            className="w-full h-1.5 accent-[hsl(var(--gold))]" />
        </div>

        {/* Colour picker */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))] mb-2">QR Colour</p>
          <div className="flex items-center gap-3">
            <input type="color" value={cvQrColor_} onChange={e => setCvQrColor(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-[hsl(var(--border))]" />
            <button onClick={() => setCvQrColor("")}
              className="text-[9px] text-[hsl(var(--gold-dark))] hover:underline">
              Reset to template colour
            </button>
          </div>
        </div>

        {/* Live QR preview */}
        {cvQrEnabled && cvQrUrl && (
          <div className="flex justify-center">
            <img src={cvQrUrl} alt="QR preview" className="rounded-lg border border-[hsl(var(--border))]"
              style={{ width: cvQrSize, height: cvQrSize }} />
          </div>
        )}

      </div>
    </CollapsibleContent>
  </div>
</Collapsible>
```

### 8. Import additions needed

Add to the existing lucide-react import line:
- `QrCode` icon (for the panel header)
- `Switch` from `@/components/ui/switch` (for the enable toggle)

`Switch` is already a shared component; `QrCode` is available in `lucide-react` v0.462 (already installed).

---

## Summary of Lines Touched

| Location | Change |
|---|---|
| Top of file (after imports, ~line 19) | Add `buildCVQrData()` and `buildCVQrUrl()` pure helpers |
| Import line 4–9 | Add `QrCode` to lucide-react imports |
| Import line 18 | Add `Switch` import from `@/components/ui/switch` |
| `CVPreview` props interface (~line 137–141) | Add 4 new optional props |
| Each template's JSX (~12 return blocks) | Append QR footer strip before closing tag |
| `CVResumeBuilder` state (~line 810) | Add 4 new state variables |
| After state, computed values | Add `cvQrData`, `cvQrColor_`, `cvQrUrl` derived values |
| `exportCVAsPDF` signature (~line 660) | Add optional `options` param |
| `exportCVAsPDF` body (~line 762) | Add QR image embed block |
| `handleExport` (~line 903) | Pass QR options to `exportCVAsPDF` |
| Left controls panel (~line 1106) | Add new QR collapsible panel |
| Main `CVPreview` call (~line 1351) | Pass QR props |
| Mini-thumbnail `CVPreview` calls (~line 1374) | Pass `qrEnabled={false}` |

---

## What Does NOT Change

- Business Card Designer — untouched
- No shared state / store between the two tools — each is self-contained
- No database changes — the QR is generated client-side from the form data
- No new files — all changes in `CVResumeBuilder.tsx`
- Export PNG/JPEG path — works automatically because html2canvas captures the live preview DOM including the QR footer image
