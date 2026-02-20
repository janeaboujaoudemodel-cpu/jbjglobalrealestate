
# Business Card Designer — 6-Bug Fix + Feature Enhancements

## Problems Identified (from code review + user feedback)

---

### Bug 1 — AI Design generator always fails (Critical)

`handleGenerateDesign` (line 961) calls `supabase.functions.invoke("gemini-chat")` — this function **does not exist** in `supabase/functions/`. Every single "Generate Design" click fails with "Design generation failed." 

**Fix:** Create a new dedicated `supabase/functions/ai-card-design-generator/index.ts` edge function that calls the Lovable AI gateway directly (same pattern as `ai-logo-generator`), and update `BusinessCardDesigner.tsx` to call it.

---

### Bug 2 — Back color default mismatch (UX confusion)

The default state has `backColorIdx = 6` (Onyx black) but the user reports seeing navy blue. The fundamental UX problem is: when the user picks a color, it's unclear if it targets "front" or "back." The Colors panel has two separate sections but the visual connection to the front/back toggle isn't clear.

**Fix:** 
- Add a **"Match Front Color"** shortcut button in the Back Color section
- Add a **"Match Back Color"** shortcut button in the Front Color section
- Make the Front/Back toggle tabs in the preview **clickable color dots** that open the color panel and scroll to the relevant picker
- Add a pure black preset to the presets: currently `Onyx = #111827` (dark gray, not true black). Add `#000000` pure black option.

---

### Bug 3 — Emoji icons look cheap in AI Design panel (UX)

Lines 1517–1534: Tone selectors use raw emoji characters (`⚡`, `✦`, `◈`, `○`). Industry selectors use emoji prefixes (`🏙`, `💻`, `👗`, etc.). These render inconsistently across devices and look amateurish.

**Fix:** Replace all emoji with clean text-only labels. Use a small Lucide icon from the existing import set (e.g., `Zap`, `Star`, `Cpu`, `Circle` for tone), and text-only industry labels.

---

### Bug 4 — Vertical card appears too large in preview (UX)

The preview container is `max-w-[400px]`. The vertical card (`2/3.5` ratio) at 400px wide becomes 700px tall — way outside the visible area.

**Fix:** Add a `maxHeight` constraint on the card preview container, capped at `340px`. When the aspect ratio is "taller than wide" (vertical, digital), scale the card width down so it fits within the height cap instead.

---

### Feature 1 — "Select as Front" / "Select as Back" on template cards

Currently the "All Templates Preview" grid (lines 1774–1810) only applies a template to BOTH sides with one click. The user wants to mix and match — e.g., "Modern" front with "Minimal" back.

**Implement:**
- Split template state into `frontTemplate` and `backTemplate` (replacing single `template`)
- Each mini-card in the grid shows two pill buttons on hover: **"Set Front"** and **"Set Back"**
- The main preview shows `frontTemplate` when `side === "front"` and `backTemplate` when `side === "back"`
- The left panel Template picker shows the currently active side's template
- A small badge on each mini-card shows "F" (gold) and/or "B" (dark) indicators

---

### Feature 2 — Email Signature as a card shape/format

Add "Email Signature" as an additional format option in the Card Shape section. This gives the business card info as an email-friendly horizontal banner.

**Implement:**
- Add `"email-signature"` to `CardShape` type
- Add it to `CARD_SHAPES` array with a `Mail` icon and ratio `"600 / 200"` (3:1 landscape)
- Add a special `CardFace` render path for `email-signature` shape that uses HTML-styled email-safe layout (name bold, contact details inline)
- In the preview when `email-signature` is selected, show a helpful tooltip: "Email signature format — use the HTML export option"
- Auto-suggest a "Regenerate" button specifically for email signature format

---

## Technical Implementation

### New Edge Function: `supabase/functions/ai-card-design-generator/index.ts`

```typescript
// Replaces the broken "gemini-chat" call
// Accepts the same payload as handleGenerateDesign builds
// Returns JSON: { elements: AiSvgElement[], bgColor, textColor, accentColor, colors[] }
```

Uses `google/gemini-2.5-flash` via the Lovable AI gateway with a strict JSON schema prompt (same pattern as `ai-logo-generator/index.ts`).

### State Changes in `BusinessCardDesigner.tsx`

```typescript
// Replace:
const [template, setTemplate] = useState<Template>("modern");

// With:
const [frontTemplate, setFrontTemplate] = useState<Template>("modern");
const [backTemplate, setBackTemplate] = useState<Template>("bold");

// Derived active template for the preview:
const activeTemplate = side === "front" ? frontTemplate : backTemplate;
```

### Color Presets — Add Pure Black

```typescript
{ primary: "#000000", secondary: "#C8A766", label: "Pure Black", accent: "#C8A766" },
```
Add this to `COLOR_PRESETS` so users can select true `#000000`.

### Template Card UI — Front/Back assignment

```tsx
// Each template mini-card in "All Templates Preview" gets:
<div className="absolute inset-0 opacity-0 group-hover:opacity-100 ...">
  <button onClick={() => setFrontTemplate(t.id)}>Set Front</button>
  <button onClick={() => setBackTemplate(t.id)}>Set Back</button>
</div>
// Plus indicator badges:
{frontTemplate === t.id && <span>F</span>}
{backTemplate === t.id && <span>B</span>}
```

### Vertical Card Preview Height Fix

```tsx
// In the card preview container (line 1720):
const isVertical = ["vertical", "digital"].includes(cardShape);
// Apply max-height: 340px and auto width scaling
<div style={{ maxHeight: isVertical ? 340 : undefined, width: isVertical ? "auto" : "100%" }}>
```

---

## Files Changed

| File | Action | Change |
|---|---|---|
| `supabase/functions/ai-card-design-generator/index.ts` | **Create** | New edge function replacing broken `gemini-chat` call |
| `supabase/config.toml` | **Edit** | Register new edge function with `verify_jwt = false` |
| `src/components/corporate-suite/BusinessCardDesigner.tsx` | **Edit** | Fix all 6 bugs + features above |

### Key changes to `BusinessCardDesigner.tsx`:
1. Split `template` → `frontTemplate` + `backTemplate`
2. Fix `handleGenerateDesign` to call `ai-card-design-generator` instead of `gemini-chat`
3. Fix `handleAiQrStyle` similarly (also calls `gemini-chat`) — replace with direct AI gateway call or reuse the new edge function
4. Remove all emoji from Tone + Industry selectors → clean text + Lucide icons
5. Add pure black `#000000` preset to `COLOR_PRESETS`
6. Add "Match Front/Back" shortcut buttons in color pickers
7. Fix vertical card preview height with `maxHeight` constraint
8. Add `"email-signature"` shape to `CARD_SHAPES` + `CardFace` render path
9. Update "All Templates Preview" grid with "Set Front" / "Set Back" hover buttons and F/B badges

No database migrations needed.
