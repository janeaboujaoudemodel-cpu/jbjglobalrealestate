
# Business Card Designer — Real Gap Analysis & Fix Plan

## Audit Result: Core Features Already Exist

After reading all 1,983 lines of `BusinessCardDesigner.tsx`, the major features requested are **already implemented**:

- All 8 card shapes with `getShapeStyle()`, shape picker UI, and live preview
- QR code: 5 content types, color auto-sync to front color, AI styling prompt, size slider, 5 position options, live preview, appears on both PDF pages
- Drag-to-rearrange: `CardCanvas` with `startDrag` + `onFieldMove` for name/title/company and logo
- Voice input: on Name, Title, Company fields plus the QR AI styling prompt

## What Is Actually Missing (4 Real Gaps)

### Gap 1 — Touch drag doesn't work on mobile (Critical)
The drag system in `CardCanvas` uses only mouse events. `startDrag` attaches `window.addEventListener("mousemove")` and `"mouseup"`. On mobile, finger dragging of name/title/company/logo produces zero response. A parallel `touchstart`/`touchmove`/`touchend` handler is required.

### Gap 2 — Voice input missing on Phone, Email, Website, Address (UX)
The `fields` array marks only `name`, `title`, `company` with `voiceKey: true`. The other 4 fields (phone, email, website, address) have no mic button, even though voice input is wired and working for the others. Adding `voiceKey: true` to all fields is a 4-line change, but phone/email/website dictation is genuinely useful.

### Gap 3 — Email and Phone QR content types show no override input (UX)
When a user selects "Email" or "Phone" as QR content type, the panel shows only the vCard-style info message ("vCard QR uses your card info automatically"). There is no text input to let users override with a different email or phone number. Only `url` and `text` content types show an `<Input>`. This should be extended to show an override field for email and phone too.

### Gap 4 — Ticket shape has no specialised layout (Design)
The `ticket` shape (5:2 aspect ratio, `borderRadius: 8`) falls through to the default corporate template. It renders without error but misses an opportunity to use a ticket-specific layout: left stub with name/QR, right body with contact info, and a dashed perforation divider down the middle — matching the shape's purpose.

---

## Implementation Plan

### File: `src/components/corporate-suite/BusinessCardDesigner.tsx`

---

**Fix 1 — Mobile touch drag in `CardCanvas`** (lines 461–507)

Add a `startTouchDrag` handler that mirrors `startDrag` but reads `touch.clientX/clientY` from `TouchEvent`. Wire it to `onTouchStart` on each draggable element with `{ passive: false }` to allow `preventDefault()`.

```typescript
const startTouchDrag = (
  type: "field" | "logo",
  e: React.TouchEvent,
  field?: keyof typeof DEFAULT_FIELD_POSITIONS
) => {
  if (!editLayout) return;
  e.preventDefault();
  const touch = e.touches[0];
  const initX = type === "logo" ? logoPos.x : (field ? fieldPositions[field].x : 0);
  const initY = type === "logo" ? logoPos.y : (field ? fieldPositions[field].y : 0);
  dragging.current = { type, field, startX: touch.clientX, startY: touch.clientY, initX, initY };

  const onMove = (te: TouchEvent) => {
    if (!dragging.current || !containerRef.current) return;
    te.preventDefault();
    const t = te.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((t.clientX - dragging.current.startX) / rect.width) * 100;
    const dy = ((t.clientY - dragging.current.startY) / rect.height) * 100;
    let newX = Math.max(0, Math.min(88, dragging.current.initX + dx));
    let newY = Math.max(0, Math.min(88, dragging.current.initY + dy));
    // snap to center
    newX = Math.abs(newX - 50) < SNAP_THRESHOLD ? 50 : newX;
    newY = Math.abs(newY - 50) < SNAP_THRESHOLD ? 50 : newY;
    setShowHGuide(Math.abs(newY - 50) < SNAP_THRESHOLD);
    setShowVGuide(Math.abs(newX - 50) < SNAP_THRESHOLD);
    if (dragging.current.type === "logo") onLogoMove({ x: newX, y: newY });
    else if (dragging.current.field) onFieldMove(dragging.current.field, { x: newX, y: newY });
  };
  const onEnd = () => {
    dragging.current = null;
    setShowHGuide(false); setShowVGuide(false);
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", onEnd);
  };
  window.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("touchend", onEnd);
};
```

Each draggable element then gets:
```tsx
onTouchStart={e => startTouchDrag("logo", e)}
// or
onTouchStart={e => startTouchDrag("field", e, "name")}
```

---

**Fix 2 — Voice on all fields** (lines 1085–1093)

Change `voiceKey` from `true` to `true` on all 7 fields:

```typescript
const fields = [
  { key: "name",    ..., voiceKey: true },
  { key: "title",   ..., voiceKey: true },
  { key: "company", ..., voiceKey: true },
  { key: "phone",   ..., voiceKey: true },  // ADD
  { key: "email",   ..., voiceKey: true },  // ADD
  { key: "website", ..., voiceKey: true },  // ADD
  { key: "address", ..., voiceKey: true },  // ADD
];
```

---

**Fix 3 — Email and Phone QR content types get override input** (lines 1471–1488)

Extend the conditional from `url | text` to include `email | phone`:

```typescript
{(qrContentType === "url" || qrContentType === "text" || qrContentType === "email" || qrContentType === "phone") && (
  <div>
    <Label>
      {qrContentType === "url" ? "URL / Link" :
       qrContentType === "email" ? "Email Address (override)" :
       qrContentType === "phone" ? "Phone Number (override)" :
       "Custom Text"}
    </Label>
    <Input
      value={qrCustomContent}
      onChange={e => setQrCustomContent(e.target.value)}
      placeholder={
        qrContentType === "url" ? "https://yourwebsite.com" :
        qrContentType === "email" ? data.email || "email@example.com" :
        qrContentType === "phone" ? data.phone || "+971 50 123 4567" :
        "Custom message..."
      }
    />
    {/* small hint for email/phone: shows which value will be used */}
    {(qrContentType === "email" || qrContentType === "phone") && !qrCustomContent && (
      <p className="text-[9px] text-muted-foreground mt-1">
        Using card {qrContentType} · Type above to override
      </p>
    )}
  </div>
)}
```

Auto-populate `qrCustomContent` when switching to email or phone types (same pattern as URL):
```typescript
onClick={() => {
  setQrContentType("email");
  if (!qrCustomContent && data.email) setQrCustomContent(data.email);
}}
onClick={() => {
  setQrContentType("phone");
  if (!qrCustomContent && data.phone) setQrCustomContent(data.phone);
}}
```

---

**Fix 4 — Ticket shape gets dedicated layout** (lines 182–217 in `CardFace`)

Add a `ticket` branch in `CardFace` just before the `back` check:

```typescript
if (cardShape === "ticket" && side === "front") {
  return (
    <div style={{ ...baseStyle, background: "#fff", border: `2px solid ${primary}`, display: "flex", overflow: "hidden" }}>
      {/* Left stub: avatar + QR placeholder */}
      <div style={{
        width: "32%", background: primary, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: `${10 * scale}px ${8 * scale}px`, gap: 6 * scale,
      }}>
        <div style={{
          width: 32 * scale, height: 32 * scale, borderRadius: "50%",
          background: secondary, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 14 * scale, fontWeight: 800, color: primary }}>{initial}</span>
        </div>
        <p style={{ fontSize: 7 * scale, fontWeight: 700, color: secondary, opacity: 0.8, textAlign: "center", wordBreak: "break-word" }}>
          {company}
        </p>
      </div>
      {/* Perforation divider */}
      <div style={{
        width: 1, background: `repeating-linear-gradient(to bottom, ${primary}60 0, ${primary}60 6px, transparent 6px, transparent 12px)`,
        flexShrink: 0,
      }} />
      {/* Right body: name/title/contact */}
      <div style={{
        flex: 1, padding: `${10 * scale}px ${14 * scale}px`,
        display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 * scale,
      }}>
        <h2 style={{ fontSize: resolvedNameSize * 0.7, fontWeight: resolvedFontWeight, color: "#111", margin: 0 }}>{name}</h2>
        <p style={{ fontSize: 8 * scale, color: primary, fontWeight: 600, margin: 0 }}>{title}</p>
        <div style={{ borderTop: `1px solid ${primary}20`, paddingTop: 4 * scale, display: "flex", flexDirection: "column", gap: 2 * scale }}>
          {data.email   && <p style={{ fontSize: 7 * scale, color: "#666", margin: 0 }}>{data.email}</p>}
          {data.phone   && <p style={{ fontSize: 7 * scale, color: "#666", margin: 0 }}>{data.phone}</p>}
          {data.website && <p style={{ fontSize: 7 * scale, color: primary, margin: 0 }}>{data.website}</p>}
        </div>
      </div>
    </div>
  );
}
```

---

## Files Changed

| File | Lines | Change |
|---|---|---|
| `BusinessCardDesigner.tsx` | ~461–507 | Add `startTouchDrag` handler; wire `onTouchStart` to logo and 3 field draggables |
| `BusinessCardDesigner.tsx` | ~182–217 | Add ticket-specific layout in `CardFace` |
| `BusinessCardDesigner.tsx` | ~1085–1093 | Set `voiceKey: true` on all 7 fields |
| `BusinessCardDesigner.tsx` | ~1447–1488 | Extend QR input to email/phone types; auto-populate on type switch |

No new dependencies. No database changes. No edge functions.

---

## Summary of What Was Already Done vs. What This Adds

| Feature | Before This Plan | After This Plan |
|---|---|---|
| Card shapes (7 types) | ✅ Fully working | ✅ + Ticket gets dedicated layout |
| QR generator + auto color sync | ✅ Fully working | ✅ + Email/Phone types get input field |
| QR AI styling | ✅ Fully working | No change needed |
| Drag-to-rearrange (desktop) | ✅ Fully working | No change needed |
| Drag-to-rearrange (mobile touch) | ❌ Mouse-only | ✅ Touch events added |
| Voice input (Name/Title/Company) | ✅ Working | No change needed |
| Voice input (Phone/Email/Website/Address) | ❌ Missing | ✅ Added to all 4 fields |
| QR on both PDF pages | ✅ Fixed in last diff | No change needed |
| URL auto-fill in QR | ✅ Fixed in last diff | No change needed |
