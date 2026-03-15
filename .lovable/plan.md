

# Creative Video Suite — Advanced Features (Continued)

## Assessment of NOT IMPLEMENTED Items

After reviewing the full codebase (18 tool panels, 884-line AIVideoStudio.tsx, layout with proper wiring), here is what CAN and CANNOT be built now:

### Implementable This Session

1. **Background Remover Panel** (`BackgroundRemoverPanel.tsx`)
   - Canvas-based image background removal using luminance threshold + chroma key
   - User uploads image → selects removal method (Auto, Green Screen, White BG) → preview result → add cleaned image to timeline
   - Pure browser: uses `CanvasRenderingContext2D.getImageData()` pixel manipulation
   - NOT video frame-by-frame removal (that requires ML/MediaPipe)

2. **Scene Planner / Storyboard Panel** (`ScenePlannerPanel.tsx`)
   - User describes overall video concept in a prompt
   - AI (Lovable AI via edge function) generates a scene-by-scene breakdown: scene description, suggested duration, transition type, text overlay
   - Each scene card shows: scene number, description, duration slider, transition picker
   - "Build Timeline" button converts the storyboard into actual timeline clips
   - This is the "scene-by-scene prompt control" adapted to what's technically possible

3. **Chart Overlay Panel** (`ChartOverlayPanel.tsx`)
   - Predefined chart templates: Bar chart, Pie chart, Line chart, Score card
   - User enters data (labels + values) or selects from presets (ROI, Price Trend, Area Comparison)
   - Renders chart as SVG overlay on the preview canvas
   - Adds chart as a text/image clip to timeline with configurable duration

4. **Project Sharing via DB** (enhancement to `SharePanel.tsx`)
   - Save project state to `video_projects` table
   - Generate shareable project ID
   - Team members can load shared projects

### NOT Implementable (confirmed)

- **Real video background removal** — Requires MediaPipe/ONNX segmentation model (heavy ML, not available)
- **AI video frame generation** — No video generation model in Lovable AI roster
- **Full DaVinci-level editing** — Requires FFmpeg/WASM for real frame rendering
- **ElevenLabs voice cloning** — Requires API key connector (separate session)

## Implementation Plan

### Files to Create
| File | Purpose |
|------|---------|
| `BackgroundRemoverPanel.tsx` | Canvas pixel manipulation for image BG removal |
| `ScenePlannerPanel.tsx` | AI storyboard generation + timeline builder |
| `ChartOverlayPanel.tsx` | Data visualization overlays for video |

### Files to Edit
| File | Changes |
|------|---------|
| `AIVideoStudioLayout.tsx` | Add 3 new tabs: `bg-remove`, `scene-plan`, `chart-overlay` |
| `AIVideoStudio.tsx` | Wire 3 new panels with timeline callbacks |
| `VideoSuite.tsx` | Add "Storyboard" tab at suite level |

### Technical Details

**BackgroundRemoverPanel**: Uses `canvas.getContext('2d').getImageData()` to read pixels, applies threshold-based removal (configurable sensitivity slider), outputs transparent PNG blob. Three modes: Auto (luminance), Chroma Key (green/blue screen), Solid Color (white/black BG removal with tolerance).

**ScenePlannerPanel**: Calls existing AI infrastructure (Lovable AI via `supabase.functions.invoke('ai-video-scene-planner')`) to generate scene breakdown from a text prompt. Each scene becomes a timeline clip with duration, transition, and text overlay. Edge function uses `google/gemini-2.5-flash` for fast scene planning.

**ChartOverlayPanel**: Renders charts as inline SVG strings, converts to data URLs, adds as image clips to the video track. Preset data templates for real estate metrics (ROI, price trends, area comparisons).

