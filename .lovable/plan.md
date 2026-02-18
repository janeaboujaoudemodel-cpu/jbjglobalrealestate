
# JBJ AI Video Studio — Complete Fix & Feature Expansion

## Root Cause Analysis

### Problem 1: Header Collision
The route `/toolkit/ai-video-studio` sits inside `MainLayoutWrapper` → `MainLayout`, which:
- Injects the `GlobalHeader` (fixed at top, ~64–112px tall depending on screen size)
- Adds `pt-16 sm:pt-20 md:pt-24 lg:pt-28` to the `<main>` container
- `AIVideoStudio.tsx` uses `h-screen` for its root container — but `h-screen` = 100vh of the *viewport*, and the component is sitting inside a container that already has top padding

**Fix**: The `AIVideoStudioPage.tsx` wrapper needs to use a full-viewport escape: wrap in a `fixed inset-0 z-40` layer, or restructure the layout to use `calc(100vh - header-height)`. The cleanest approach for a DAW-style full-frame tool is to apply `overflow-hidden` and use `h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] md:h-[calc(100vh-96px)] lg:h-[calc(100vh-112px)]` to match the exact responsive header heights defined in GlobalHeader.

### Problem 2: Faded/Invisible Buttons
All buttons in `AIVideoStudioExportBar.tsx` and throughout the studio use `variant="outline"` or `variant="ghost"` with `border-slate-700 text-slate-300` — on a `bg-slate-900/80` backdrop with `backdrop-blur`, the slate-700 borders are nearly invisible. The `bg-slate-900/80` backdrop makes the export bar extremely similar in color to the button borders and text.

**Fix**: Upgrade button contrast. Active/primary buttons → gold fill `bg-amber-500 text-black`. Secondary buttons → visible outline `border-amber-400/60 text-amber-300 hover:bg-amber-400/10`. Destructive → red. All ghost buttons in the preview controls → `text-white` with proper hover.

### Problem 3: Stop/Play Button Layout in Preview Controls
The `VideoPreviewCanvas` transport controls are missing explicit button backgrounds — they use `variant="ghost"` which on the dark slate-900/50 background renders near-invisible. Play button is correct (gold circle), but skip/volume/fullscreen buttons all disappear.

### Problem 4: Captions Panel Not Integrated
The `CaptionTranslator` inside `IntegratedToolsPanel` is squished into a small side column. The integrated tools panel needs to be surfaced more prominently as a bottom strip (CapCut-style) so the captions tool has full-width space.

### Problem 5: Missing Features Requested
- Sound effects panel (ElevenLabs SFX via `elevenlabs-sfx` function)
- Map integration with 3D vanishing effect (Leaflet map with CSS 3D perspective animation)
- Money/currency particles effect
- AI Auto-Editor (smart clip detection, highlight reel generator)
- Real estate project integration (link from project pages)
- Save/load projects (persist to backend)
- Recent projects panel

---

## Complete Plan

### File 1: `src/pages/toolkit/AIVideoStudioPage.tsx`
**Fix header collision** by making the studio page break out of MainLayout's padding using a negative-margin escape approach:

```tsx
export default function AIVideoStudioPage() {
  return (
    <div className="-mt-16 sm:-mt-20 md:-mt-24 lg:-mt-28 h-screen overflow-hidden">
      <AIVideoStudio />
    </div>
  );
}
```

This counteracts the `pt-16 sm:pt-20 md:pt-24 lg:pt-28` from MainLayout, giving the studio the full viewport without needing to escape the route hierarchy.

### File 2: `src/components/ai-video-studio/AIVideoStudio.tsx`
- Add a **Sound Effects** tab to `IntegratedToolsPanel` wiring
- Add a **Map Effect** panel wiring
- Add a **Recent Projects** sidebar section
- Add a **project integration** function (`handleLoadFromProject`) that fetches a real estate project's photos and metadata
- Wire the new `SoundEffectsPanel` component into the toolbar

### File 3: `src/components/ai-video-studio/layout/AIVideoStudioLayout.tsx`
**Redesign to CapCut-style layout:**

- Desktop: 3-column top (Left Media | Center Preview | Right Inspector), then a **horizontal tools strip** between preview area and timeline (instead of a 4th right column), then the timeline below
- The tools strip is a full-width horizontal tab bar with icons: `Captions | Voice | Beauty | SFX | Effects | Resize`
- Each tool tab expands into a panel that slides up from the bottom tools bar
- This gives the caption tool full width, not a narrow 200px column

```text
┌──────────────────────────────────────────────────────┐
│  TOP BAR (Project name, Undo/Redo, Export)           │
├────────────┬─────────────────────────┬───────────────┤
│  MEDIA     │  VIDEO PREVIEW          │  INSPECTOR    │
│  LIBRARY   │  (canvas + controls)    │  (clip props) │
│            │                         │               │
│            │                         │               │
├────────────┴─────────────────────────┴───────────────┤
│  TOOLS BAR: [Captions][Voice][SFX][Effects][Beauty]  │
│  ▼ Active Panel (full width, collapsible)            │
├──────────────────────────────────────────────────────┤
│  TIMELINE EDITOR                                     │
├──────────────────────────────────────────────────────┤
│  EXPORT BAR                                          │
└──────────────────────────────────────────────────────┘
```

### File 4: `src/components/ai-video-studio/layout/AIVideoStudioTopBar.tsx`
Fix button colors:
- "Export" button → `bg-amber-500 hover:bg-amber-400 text-black font-bold`
- "New" and "Save" → `border border-amber-400/50 text-amber-300 hover:bg-amber-400/15 hover:text-white`
- Undo/Redo → `text-slate-300 hover:text-white hover:bg-slate-700`

### File 5: `src/components/ai-video-studio/layout/AIVideoStudioExportBar.tsx`
Fix all faded buttons:
- Format preset buttons (inactive): `border border-slate-600 text-slate-300 bg-slate-800 hover:border-amber-400 hover:text-amber-300`
- Format preset buttons (active): `border border-amber-400 bg-amber-400/20 text-amber-300 font-semibold`
- Download button: `border border-amber-400/60 text-amber-300 hover:bg-amber-400/10`
- Download All ZIP: `bg-amber-500 text-black font-bold hover:bg-amber-400`

### File 6: `src/components/ai-video-studio/preview/VideoPreviewCanvas.tsx`
Fix transport control button visibility:
- Skip buttons: `text-white hover:text-amber-300 hover:bg-slate-700`
- Volume/Fullscreen buttons: `text-white/80 hover:text-white hover:bg-slate-700`
- Add stop button for music/playback

### File 7: `src/components/ai-video-studio/features/SoundEffectsPanel.tsx` — NEW
New component with ElevenLabs SFX integration:
- Category grid: Transitions, Ambient, Nature, Real Estate, Luxury, Money/Finance, Comedy
- Text prompt input: "Type a sound description..."
- "Generate SFX" button → calls `elevenlabs-sfx` edge function
- Generated sounds appear in a list with Play/Add-to-Timeline/Download
- Pre-made real estate sound pack: door chimes, applause, elevator, city ambience, ocean view

### File 8: `src/components/ai-video-studio/features/MapEffectPanel.tsx` — NEW
Map integration with 3D vanishing effect:
- Property address input or "Link from Project" button (dropdown of recent projects)
- Leaflet map renders the location in satellite view
- "Record Map Fly-in" button: animates the map with a CSS 3D perspective transition (zoom in, then `perspective: 800px; rotateX(60deg)` → the map appears to vanish forward)
- Canvas capture: uses `html2canvas` approach to render the map animation frames as a clip
- "Add to Timeline" inserts the animated clip

### File 9: `src/components/ai-video-studio/features/OverlayEffectsPanel.tsx` — NEW
Visual overlay effects:
- **Money Rain**: CSS particle animation generating 💵 emojis + golden coins falling from top
- **Confetti Burst**: celebration effect
- **Gold Glow**: luxury shimmer overlay
- **Text Pop**: animated text pop-in effect
- "Preview" button shows effect on the canvas overlay
- "Add to Timeline" creates an effect clip at current playhead position

### File 10: `src/components/ai-video-studio/features/AIEditorPanel.tsx` — NEW
AI Auto-Editor:
- **"Analyze Clips"** button: scans all clips in timeline, uses the Lovable AI gateway (`google/gemini-3-flash-preview`) to analyze metadata and suggest highlight moments
- **"Generate Highlight Reel"**: automatically selects the best N seconds from each clip and assembles a short reel
- **"Smart Template"**: applies a preset editing template (Property Tour, Social Reel, YouTube Intro)
- Template saving: "Save as Template" stores the current track/clip arrangement as a reusable template in backend
- Display: list of templates with load/delete controls

### File 11: `src/components/ai-video-studio/features/ProjectIntegrationPanel.tsx` — NEW
Real estate project integration:
- Fetches user's recent real estate projects from the database
- Each project shown as a card with thumbnail + name
- "Create Video Ad" button: pulls all project images, creates image clips on the timeline automatically, applies a preset "Property Ad" template with music, lower-third text overlay with project name/price/location
- The video title auto-fills with the project name

### File 12: `src/components/ai-video-studio/hooks/useVideoStudioProject.ts` — Update
Add project persistence via backend:
- `saveProject()`: saves current project state to a `video_studio_projects` table
- `loadProject(id)`: loads saved project
- `getRecentProjects()`: returns last 10 projects

### Backend: New Edge Function `supabase/functions/elevenlabs-sfx/index.ts`
Sound effects generation:
```typescript
// Calls ElevenLabs /v1/sound-generation
// Accepts: { prompt: string, duration: number }
// Returns: MP3 audio binary
```

### Backend: Database migration
Create `video_studio_projects` table for project persistence:
```sql
CREATE TABLE video_studio_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  project_data JSONB NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: user_id = auth.uid()
```

---

## Priority Order of Implementation

1. **Header collision fix** (`AIVideoStudioPage.tsx`) — 5 lines
2. **Button contrast fix** (ExportBar, TopBar, VideoPreviewCanvas) — high visual impact
3. **Layout redesign** (AIVideoStudioLayout.tsx) — CapCut horizontal tools bar
4. **SoundEffectsPanel + edge function** — new feature, ElevenLabs SFX
5. **OverlayEffectsPanel** — money rain, confetti, gold glow
6. **MapEffectPanel** — location 3D vanish
7. **AIEditorPanel** — AI auto-edit + templates
8. **ProjectIntegrationPanel** — link real estate projects
9. **Project persistence** — save/load backend

---

## Summary of Files

| File | Type | Change |
|---|---|---|
| `AIVideoStudioPage.tsx` | Edit | Fix header collision with negative margin offset |
| `AIVideoStudio.tsx` | Edit | Wire new panels into layout, add project integration |
| `AIVideoStudioLayout.tsx` | Edit | CapCut horizontal tools bar, full-width tool panels |
| `AIVideoStudioTopBar.tsx` | Edit | Fix button colors/contrast |
| `AIVideoStudioExportBar.tsx` | Edit | Fix all faded buttons |
| `VideoPreviewCanvas.tsx` | Edit | Fix transport button visibility, add stop |
| `SoundEffectsPanel.tsx` | Create | ElevenLabs SFX generator + real estate sound pack |
| `MapEffectPanel.tsx` | Create | Leaflet map + 3D vanish animation clip |
| `OverlayEffectsPanel.tsx` | Create | Money rain, confetti, gold glow overlay effects |
| `AIEditorPanel.tsx` | Create | AI auto-editor, highlight reel, templates |
| `ProjectIntegrationPanel.tsx` | Create | Link real estate projects → auto-create video ads |
| `elevenlabs-sfx/index.ts` | Create | Backend SFX generation edge function |
| `useVideoStudioProject.ts` | Edit | Add save/load project persistence |
| DB migration | Create | `video_studio_projects` table with RLS |
