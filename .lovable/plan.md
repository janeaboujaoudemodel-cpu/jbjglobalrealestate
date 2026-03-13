

## Plan: Premium Stamp Generator with Upload, AI Refine, Signature Integration & Real Stamp Standard

### What the User Wants

Looking at the two reference stamps (Department of Culture and Tourism / ADN Commercial Brokers), the user wants:
1. The generated stamp to look like a **real UAE ministry/corporate stamp** — premium, clean, proper proportions
2. The stamp to be **auto-presented** to users upon generation as the standard
3. Users should be able to: **upload their own stamp**, **upload a signature overlay**, **AI-refine their stamp via prompt**, **manually edit/drag/move/lock elements**, and **regenerate**
4. Full edge function + AI model integration for stamp refinement from uploaded images

### Technical Changes

#### 1. Enhance `StampGeneratorPage.tsx` — Add Upload & Signature Section
- Add a new **"My Stamp"** tab to the left panel (alongside Colors, Fonts, Text, Art, Logo)
- In this tab:
  - **Upload Own Stamp** — file upload (PNG/JPG/SVG) that becomes the selected stamp preview (rendered as `<image>` inside an SVG wrapper or displayed directly)
  - **Upload Signature** — file upload to overlay a signature on the stamp preview (positioned at bottom-right by default)
  - **AI Refine Prompt** — text input + "Refine" button that sends the uploaded stamp image (base64) to the edge function for AI-powered modification
  - **Drag/Move/Lock controls** — position offset sliders for signature overlay (X, Y) and a lock toggle

#### 2. Enhance the Auto-Presentation Flow
- When stamps are generated, auto-select the Standard Model and show a **toast/banner** explaining: "Your official stamp is ready. You can edit text, change colors, upload your own stamp, or refine with AI."
- Add instructional tooltips on the preview area showing drag/edit/lock capabilities

#### 3. Create/Update Edge Function: `ai-stamp-generator` — Add `refine-image` Action
- New action `refine-image`: accepts a base64 image of the user's uploaded stamp + a text prompt
- Uses `google/gemini-2.5-flash-image` (image editing model) to modify the stamp based on the prompt
- Returns the modified stamp image as base64
- The existing `refine` action (SVG-based) remains unchanged

#### 4. Improve Visual Quality of Standard Template (`stampOfficialTemplate.ts`)
- Match the reference stamps' visual weight:
  - Outer ring stroke: 6px → **4px** (cleaner, less chunky — matches real stamps)
  - Add a thin decorative ring (0.5px) just inside the outer ring for the "ministry double-line" look
  - Middle ring: keep at 2.5px
  - Inner ring: keep at 1.2px
- Adjust ring gaps to better match reference proportions

#### 5. Add Stamp+Signature Composite Preview
- In the center preview, render the stamp SVG with an optional signature image overlaid
- Signature position controlled by X/Y sliders in the "My Stamp" tab
- Export includes the composite (stamp + signature) as a single image

### Files to Modify

| File | Change |
|------|--------|
| `src/components/stamp-generator/StampGeneratorPage.tsx` | Add "My Stamp" tab with upload stamp, upload signature, AI refine prompt, position controls, auto-presentation banner |
| `src/lib/stampOfficialTemplate.ts` | Adjust stroke weights and add decorative inner-outer ring for ministry look |
| `supabase/functions/ai-stamp-generator/index.ts` | Add `refine-image` action using Gemini image model for uploaded stamp refinement |

### Edge Function: `refine-image` Action Detail

```
POST body: { action: "refine-image", imageBase64: "data:image/png;base64,...", prompt: "Make the border thicker", projectId }
```

- Sends image + prompt to `google/gemini-2.5-flash-image` with `modalities: ["image", "text"]`
- Returns `{ imageUrl: "data:image/png;base64,..." }` — the modified stamp
- Uploads result to storage bucket for persistence
- Falls back gracefully if AI credits exhausted

### UI Flow

1. User opens Stamp Generator → Standard stamp auto-generated and selected
2. Banner: "Your official stamp is ready — customize colors, text, or upload your own"
3. Left panel "My Stamp" tab:
   - Upload Stamp (replaces generated SVG with uploaded image)
   - AI Refine: "Describe what to change..." → sends to edge function → returns modified image
   - Upload Signature → overlay on preview with X/Y position sliders
   - Lock toggle to prevent accidental moves
4. Export includes composite stamp+signature

