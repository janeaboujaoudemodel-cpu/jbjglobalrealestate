
# AI Logo Creator — Route Fix, Dedicated Edge Function & Full Enhancement

## Current State Analysis

### What Already Exists
The `LogoCreator.tsx` component is complete at `src/components/corporate-suite/LogoCreator.tsx` (401 lines) and is already imported in `App.tsx`. It has:
- Company name + description inputs with VoiceInputButton
- 9 industry tones (Real Estate, Tech, Fashion, Healthcare, etc.)
- 6 visual styles (Modern, Minimalist, Bold, Vintage, Luxury, Playful)
- 8 color presets
- Download SVG + Download PNG (512px)
- Regenerate button

### Root Issues Found

**Issue 1 — Missing Route (Critical)**
The route `/toolkit/corporate-suite/logo-creator` is NOT registered in `App.tsx`. Lines 710–715 show the Corporate Suite routes:
```
/toolkit/corporate-suite
/toolkit/corporate-suite/business-card
/toolkit/corporate-suite/cv-resume
/toolkit/corporate-suite/cover-letter
/toolkit/corporate-suite/landing-page
```
Logo Creator is completely missing. Navigating to it returns a blank/404 page.

**Issue 2 — Missing Edge Function (Critical)**
The component calls `supabase.functions.invoke("gemini-chat", ...)` — but **no `gemini-chat` function exists** in `supabase/functions/`. This means every "Generate Logo" click fails silently, falling back to the placeholder SVG. Multiple other components (`BusinessCardDesigner`, `CompanyProfileBuilder`) have the same broken dependency.

**Issue 3 — No Logo Generator Edge Function**
The current approach sends raw SVG generation prompts directly through a generic chat function. A dedicated `ai-logo-generator` edge function will produce far better, more reliable results by:
- Using a specialized system prompt optimized for SVG logo generation
- Enforcing strict JSON structure for logo elements rather than raw SVG text
- Handling multi-variation generation (seed-based regeneration)
- Proper 402/429 error surfacing

---

## Everything Being Built

### Fix 1 — Add the Missing Route (App.tsx)
Add one line to the Corporate Suite routes block in `App.tsx`:
```tsx
<Route path="/toolkit/corporate-suite/logo-creator" element={<LogoCreator />} />
```

### Fix 2 — Create `ai-logo-generator` Edge Function
Create a new dedicated edge function at `supabase/functions/ai-logo-generator/index.ts` that:
- Accepts: `{ name, industry, style, colors: { primary, secondary, accent }, description, seed }`
- Uses `LOVABLE_API_KEY` to call `https://ai.gateway.lovable.dev/v1/chat/completions`
- Uses `google/gemini-2.5-flash` (best for structured creative output)
- System prompt specializes in professional SVG logos within a `200×200` viewBox
- Returns clean SVG string extracted from AI response
- Surfaces 402/429 errors properly back to the client

**System prompt strategy for better logos:**
```
You are a world-class SVG logo designer. Create a complete, self-contained SVG logo.
Rules:
- viewBox="0 0 200 200", width="200" height="200"
- Use ONLY these colors: Primary ${primary}, Secondary ${secondary}, Accent ${accent}
- No external fonts — only: Georgia/serif, Arial/sans-serif, "Courier New"/monospace
- Include a creative logomark (abstract shape, icon, geometric) AND the company name
- Self-contained: no external references, no <image> tags, no xlink:href to external URLs
- Make it professional, scalable, and distinctive for the ${industry} industry
- Style: ${style}
Return ONLY the SVG element — start with <svg and end with </svg>. No explanation.
```

### Fix 3 — Update `LogoCreator.tsx` to Use New Edge Function
Update the `generate()` function to call `ai-logo-generator` instead of `gemini-chat`. Also add:

**Enhanced Prompt History Panel**
Add a "Variations" strip below the main preview that stores the last 3 generated logos as thumbnails. Clicking a thumbnail restores that version. Uses local state `logoHistory: LogoData[]`.

**Custom Color Wheel**
Add an `<input type="color">` color wheel for each of the 3 colors (Primary, Secondary, Accent) alongside the preset swatches. Allows fully custom color combinations beyond the 8 presets.

**Font Style Selector**
Add a "Typography" section with 4 font choices:
- Serif (Georgia) — classic, premium
- Sans-serif (Arial) — modern, clean
- Monospace (Courier) — tech, coding
- Script (Palatino) — creative, fashion

The selected font is passed to the edge function and reflected in the SVG.

**Responsive Layout on Mobile**
The current layout uses `lg:grid-cols-[420px_1fr]` which breaks on tablet. Add proper `md:grid-cols-1` fallback.

**"Save to Brand Assets" Button**
After generation, show a "Save to Brand Assets" button. This stores the SVG in the `design_assets` table (already used by BusinessCardDesigner and CompanyProfileBuilder) so the logo appears in the BrandAssetLibrary across all Corporate Suite tools.

---

## Technical Architecture

### New Edge Function: `supabase/functions/ai-logo-generator/index.ts`

```typescript
// Input shape
{
  name: string;          // Company/person name
  industry: string;      // e.g. "real-estate"
  style: string;         // e.g. "modern"
  font: string;          // e.g. "Georgia, serif"
  colors: {
    primary: string;     // e.g. "#C8A766"
    secondary: string;   // e.g. "#1a1a1a"
    accent: string;      // e.g. "#ffffff"
  };
  description?: string;  // Optional additional context
  seed: number;          // For variation — included in prompt to force AI variation
}

// Output shape
{
  svgContent: string;    // Complete SVG element
  error?: string;        // Error message if failed
}
```

### Updated State in `LogoCreator.tsx`

```typescript
// New state additions
const [logoHistory, setLogoHistory] = useState<LogoData[]>([]);
const [customColors, setCustomColors] = useState({
  primary: "",
  secondary: "",
  accent: "",
});
const [fontChoice, setFontChoice] = useState("Georgia, serif");
const [saving, setSaving] = useState(false);
```

### Logo History Logic
```typescript
// After successful generation:
setLogoHistory(prev => [newLogo, ...prev].slice(0, 3));
```

### Save to Brand Assets
```typescript
const handleSaveToAssets = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { toast.error("Please log in to save assets"); return; }
  
  await supabase.from("design_assets").insert({
    user_id: session.user.id,
    asset_type: "logo",
    name: `${name} Logo`,
    svg_content: logo.svgContent,
  });
  toast.success("Saved to Brand Assets!");
};
```

---

## Files to Create/Edit

| File | Action | Change |
|---|---|---|
| `supabase/functions/ai-logo-generator/index.ts` | **Create** | Dedicated edge function with proper AI gateway integration |
| `src/components/corporate-suite/LogoCreator.tsx` | **Edit** | Point to new edge function, add history panel, custom color wheel, font selector, save-to-assets button |
| `src/App.tsx` | **Edit** | Add missing route for `/toolkit/corporate-suite/logo-creator` |

No database migrations needed — the `design_assets` table already exists with an `asset_type` column.

---

## Implementation Order

1. Create `supabase/functions/ai-logo-generator/index.ts` with proper LOVABLE_API_KEY integration
2. Edit `src/App.tsx` — add the missing route (one line)
3. Edit `src/components/corporate-suite/LogoCreator.tsx`:
   a. Change `supabase.functions.invoke("gemini-chat")` → `supabase.functions.invoke("ai-logo-generator")`
   b. Add `fontChoice` state + Typography selector panel
   c. Add `customColors` state + color wheel inputs alongside presets
   d. Add `logoHistory` state + Variations thumbnail strip in preview panel
   e. Add "Save to Brand Assets" button in export section
4. Deploy and test all three changes together
