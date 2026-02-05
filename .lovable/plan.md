
# JBJ AI Video Studio™ (Free) — Implementation Plan

## Overview
Create a flagship CapCut-style professional web video editor at `/toolkit/ai-video-studio` with DaVinci Resolve/Final Cut Pro-inspired timeline UI. This tool will consolidate and elevate the existing video editing capabilities into a single, comprehensive platform.

---

## Architecture Summary

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│                              TOP BAR                                           │
│  Logo • Project Name • Render Status • Export Button • Settings               │
├──────────────┬─────────────────────────────────────────────┬───────────────────┤
│              │                                             │                   │
│   LEFT       │              CENTER                         │      RIGHT        │
│   PANEL      │              PREVIEW                        │      PANEL        │
│              │              PLAYER                         │                   │
│  ┌────────┐  │         ┌─────────────┐                    │  ┌─────────────┐  │
│  │ Media  │  │         │             │                    │  │ Inspector   │  │
│  │ Library│  │         │   Video     │                    │  │             │  │
│  │        │  │         │   Preview   │                    │  │ • Transform │  │
│  │ Upload │  │         │             │                    │  │ • Crop      │  │
│  │ Stock  │  │         └─────────────┘                    │  │ • Speed     │  │
│  │ AI Gen │  │                                             │  │ • Color     │  │
│  │ Templat│  │                                             │  │ • Audio     │  │
│  └────────┘  │                                             │  │ • Captions  │  │
│              │                                             │  │ • Export    │  │
│              │                                             │  └─────────────┘  │
├──────────────┴─────────────────────────────────────────────┴───────────────────┤
│                              TIMELINE EDITOR                                   │
│  ┌─ Tracks ────────────────────────────────────────────────────────────────┐  │
│  │ 🎬 Video Track 1   [═══clip═══][═══clip═══][ clip ]                    │  │
│  │ 🎬 Video Track 2   [    ][══overlay══]                                  │  │
│  │ 🎵 Audio Track 1   [══════music══════]                                  │  │
│  │ 🎤 Voiceover       [═══voiceover═══]                                    │  │
│  │ 📝 Text/Captions   [sub][sub][sub][sub]                                 │  │
│  │ ✨ Effects         [transition][filter]                                  │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│  [0:00]─────────[0:30]─────────[1:00]─────────[1:30]─────────[2:00]           │
├────────────────────────────────────────────────────────────────────────────────┤
│  EXPORT BAR: [9:16 Reels] [16:9 YouTube] [1:1 Feed] [4:5 Portrait] [ZIP All] │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```text
src/pages/toolkit/
  AIVideoStudio.tsx                      # Main page (orchestrator)

src/components/ai-video-studio/
  # Layout Components
  AIVideoStudioLayout.tsx                # Main 4-panel layout
  AIVideoStudioTopBar.tsx                # Header with project info + render status
  AIVideoStudioExportBar.tsx             # Bottom export presets bar
  
  # Left Panel - Media Library
  MediaLibraryPanel.tsx                  # Container for all media sources
  MediaUploadSection.tsx                 # Upload MP4/MOV/WebM/images/audio
  StockLibrarySection.tsx                # Free stock SFX/music browser
  AIGenerateSection.tsx                  # AI scene generation panel
  TemplatesSection.tsx                   # Lower-thirds, intros, outros
  
  # Center - Preview & Timeline
  VideoPreviewCanvas.tsx                 # Main video preview with playback
  TimelineEditor.tsx                     # Multi-track timeline component
  TimelineTrack.tsx                      # Individual track (video/audio/text)
  TimelineClip.tsx                       # Draggable clip with handles
  TimelinePlayhead.tsx                   # Current time indicator
  TimelineZoomControls.tsx               # Zoom in/out timeline
  
  # Right Panel - Inspector
  InspectorPanel.tsx                     # Container for all inspectors
  TransformInspector.tsx                 # Position, scale, rotation, opacity
  CropInspector.tsx                      # Crop, rotate, blur
  SpeedInspector.tsx                     # 0.5x-2x, reverse
  ColorInspector.tsx                     # Brightness, contrast, saturation, LUTs
  AudioInspector.tsx                     # Volume, normalize, fade, noise reduction
  CaptionsInspector.tsx                  # Transcribe, translate, style, export SRT/VTT
  EffectsInspector.tsx                   # Transitions, filters, overlays
  
  # Special Features
  TeleprompterPanel.tsx                  # Script teleprompter with recording
  VoiceoverRecorder.tsx                  # Record voiceover into timeline
  AIAudioCommandBox.tsx                  # Natural language SFX placement
  AISceneGenerator.tsx                   # Map animation, b-roll, storyboard
  SmartReframePanel.tsx                  # Per-shot AI reframing
  CaptionTranslator.tsx                  # Multi-language translation with RTL
  
  # Shared
  KeyframeEditor.tsx                     # Position/scale/rotation/opacity keyframes
  TransitionPicker.tsx                   # Fade, dissolve, wipe, zoom transitions
  SubtitleStylePicker.tsx                # Premium Clean, Social Bold, Highlight

supabase/functions/
  ai-video-studio-transcribe/index.ts   # Speech-to-text for captions
  ai-video-studio-translate/index.ts    # Multi-language translation
  ai-video-studio-tts/index.ts          # AI voice generation
  ai-video-studio-sfx/index.ts          # AI audio command processing
  ai-video-studio-scene/index.ts        # AI scene/map generation
  ai-video-studio-render/index.ts       # Final render queue processing
```

---

## Technical Implementation

### Phase 1: Core Layout & Timeline (Days 1-2)

**1. Main Page: `AIVideoStudio.tsx`**
- State management for project, timeline, selection
- Panel layout with resizable dividers
- Autosave to localStorage + optional cloud sync
- Keyboard shortcuts (space=play, cmd+s=save, del=delete)

**2. Timeline Data Model**
```typescript
interface VideoStudioProject {
  id: string;
  name: string;
  duration: number;          // Total timeline duration in seconds
  tracks: Track[];           // Multi-track array
  settings: ProjectSettings;
  createdAt: Date;
  autoDeleteAt: Date;        // 2 hours from creation
}

interface Track {
  id: string;
  type: 'video' | 'audio' | 'voiceover' | 'text' | 'effects';
  name: string;
  locked: boolean;
  muted: boolean;
  clips: Clip[];
}

interface Clip {
  id: string;
  trackId: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'subtitle' | 'effect';
  startTime: number;         // Position on timeline
  duration: number;          // Clip length
  source: {
    url: string;
    inPoint: number;         // Trim start in source
    outPoint: number;        // Trim end in source
  };
  transform: {
    x: number; y: number;
    scaleX: number; scaleY: number;
    rotation: number;
    opacity: number;
  };
  keyframes: Keyframe[];     // Animation keyframes
  effects: ClipEffect[];     // Applied effects
}

interface Keyframe {
  time: number;              // Relative to clip start
  property: 'x' | 'y' | 'scaleX' | 'scaleY' | 'rotation' | 'opacity';
  value: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}
```

**3. Timeline Component Features**
- Multi-track display with collapsible rows
- Drag-to-reorder clips
- Split tool (cut at playhead)
- Trim handles (adjust in/out points)
- Ripple delete (close gaps automatically)
- Snapping to playhead/other clips
- Zoom slider (fit view, 1s, 5s, 30s per screen)

### Phase 2: Media & Upload (Day 2)

**1. Media Upload**
- Accept: MP4, MOV, WebM, JPG, PNG, WebP, MP3, WAV
- Generate thumbnails for video
- Auto-detect duration
- Drag from library to timeline

**2. Stock Library Integration**
- Query existing `studio_stock_library` table
- Categories: Music (ambient, upbeat, cinematic), SFX (applause, cash, whoosh, camera click, UI sounds)
- Search and filter by tags
- Preview playback before adding

### Phase 3: Inspector Panel (Day 3)

**1. Transform Inspector**
- Position X/Y with numeric input and visual gizmo
- Scale (uniform or independent X/Y)
- Rotation (degrees with slider)
- Opacity (0-100%)
- Add keyframe buttons per property

**2. Crop Inspector**
- Crop handles on preview
- Presets: None, 16:9, 9:16, 1:1, 4:5
- Rotation: 0°, 90°, 180°, 270°
- Basic background blur toggle

**3. Speed Inspector**
- Speed slider: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
- Reverse toggle (optional)
- Duration preview update

**4. Color Inspector**
- Sliders: Brightness, Contrast, Saturation, Temperature
- LUT dropdown (optional): None, Cinematic, Warm, Cool, Vintage, Luxury Gold

**5. Audio Inspector**
- Volume slider (0-200%)
- Fade in/out duration
- Normalize toggle (basic)
- Noise reduction toggle (basic - uses ElevenLabs or AI)

### Phase 4: Captions & Translation (Day 4)

**1. Auto-Transcription**
- Button: "Auto-transcribe" 
- Uses existing `voice-to-text` edge function with ElevenLabs Scribe
- Creates subtitle clips on Text track aligned to audio
- Editable timeline segments

**2. Translation**
- Language selector: Global list from `SUPPORTED_LANGUAGES` + expanded
- Multi-select: Translate to Arabic, Hindi, Russian, Chinese, etc.
- RTL support: Arabic, Hebrew, Persian, Urdu
- Uses `auto-translate` edge function

**3. Subtitle Export**
- Export formats: SRT, VTT, ASS
- Burn-in toggle: Render subtitles into video

**4. Subtitle Styles**
- Premium Clean: White text, subtle shadow, bottom positioned
- Social Bold: Large text, colored background, animated word highlight
- Highlight: Karaoke-style word-by-word highlight

### Phase 5: Voiceover & Teleprompter (Day 5)

**1. Teleprompter Panel**
- Script input textarea
- Scroll speed slider (slow/medium/fast)
- Font size slider
- Mirror mode toggle (for recording setups)
- Countdown before start

**2. Voiceover Recording**
- Record button using MediaRecorder API
- Live waveform display
- Auto-adds to Voiceover track at playhead position
- Trim handles for recorded audio

**3. AI Voice Generation**
- Uses existing `voice-studio-tts` edge function
- Voice library: Roger, Sarah, George, Laura, Charlie, Lily, Liam, Matilda
- **Safety**: Consent checkbox required
- Text input from script or manual entry

### Phase 6: Audio Suite & AI Commands (Day 5-6)

**1. Stock SFX Library**
- Categories: Applause, Cash/Money, Whoosh, Camera Click, Notification, Success, Error, Nature, Urban
- Preview with waveform
- Drag to audio track

**2. AI Audio Command Box**
- Text input: "Add applause at 00:12" or "Add cash sound at this cut"
- Natural language parsing using Lovable AI
- Finds matching SFX from library
- Auto-places on timeline at specified time
- Confirmation toast with undo option

### Phase 7: Effects & Overlays (Day 6)

**1. Basic Filters**
- None, Warm, Cool, Cinematic, Vintage, Luxury Gold
- Apply per-clip via dropdown

**2. Transitions**
- Fade, Dissolve, Slide, Zoom, Wipe
- Duration: 0.25s, 0.5s, 1s
- Apply between adjacent clips

**3. Overlays**
- Logo overlay (upload or JBJ default)
- Position: Top-left, Top-right, Bottom-left, Bottom-right, Center
- Lower-thirds templates (JBJ luxury style: black/white + gold #C8A766)
- Text overlays with font selection

**4. Background Effects**
- Background blur (for portrait in landscape)
- Vignette overlay

### Phase 8: AI Generate Scene Panel (Day 7)

**1. Map Animation Clip**
- Input: Location text or map pin selection
- Generate: Animated zoom from Dubai overview to pin location
- Highlight plot, show label
- Uses Lovable AI image generation for frames
- Clearly labeled "AI Generated"

**2. AI B-roll / Drone Simulation**
- Input: Text prompt (e.g., "Aerial view of Dubai Marina at sunset")
- Optional: Uploaded reference photo
- Generate: AI video clip using Lovable AI
- **Watermark**: "AI Generated" badge

**3. Script-to-Storyboard**
- Input: Script text
- Output: List of suggested shots
- Generate: Placeholder clips or AI-generated clips
- Each clip marked as AI-generated

**Safety Requirements:**
- Face upload consent checkbox: "I confirm I have rights to use this face"
- Clear labeling: All AI content marked "AI Generated"
- Policy banner: "AI-generated footage is for creative purposes. Do not claim as real."

### Phase 9: Export System (Day 8)

**1. Export Presets**
- 9:16 1080x1920 (Reels/TikTok)
- 16:9 1920x1080 (YouTube)
- 1:1 1080x1080 (Instagram Feed)
- 4:5 1080x1350 (Instagram Portrait)

**2. Smart Reframing**
- Auto-detect original orientation
- Offer smart reframe with subject tracking (from VideoResizePack)
- Per-shot crop adjustment

**3. Download Options**
- Single format download
- "Download All as ZIP" (all presets)

**4. Job Queue System**
- Backend model for render jobs
- Queue position indicator
- Email notification when ready (optional)

### Phase 10: Fair Usage & Limits (Throughout)

**1. No Login Required**
- Session-based project storage
- LocalStorage for draft projects

**2. Fair Usage Limits**
- Max video length: 5 minutes per job
- Max jobs: 3 per hour (tracked via session)
- Max total storage: 500MB per session

**3. Temporary Storage**
- Auto-delete: 2 hours after creation
- Warning banner: "Projects auto-delete after 2 hours"
- Option to download before deletion

---

## Edge Functions

### New Edge Functions Required

| Function | Purpose |
|----------|---------|
| `ai-video-studio-transcribe` | Transcribe audio to subtitle segments using ElevenLabs Scribe |
| `ai-video-studio-translate` | Translate subtitles to multiple languages with RTL support |
| `ai-video-studio-sfx` | Parse natural language audio commands and find matching SFX |
| `ai-video-studio-scene` | Generate AI scenes (maps, b-roll, storyboards) |
| `ai-video-studio-render` | Queue and process final video renders |

### Reused Edge Functions
- `voice-studio-tts` - AI voice generation
- `voice-to-text` - Speech transcription (fallback)
- `auto-translate` - Translation with caching
- `elevenlabs-podcast-music` - AI music generation

---

## Database Schema Updates

### New Tables

**`video_studio_jobs`**
```sql
CREATE TABLE video_studio_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  project_data JSONB NOT NULL,
  status TEXT DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  output_urls JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '2 hours')
);

-- RLS: Session or user-based access
ALTER TABLE video_studio_jobs ENABLE ROW LEVEL SECURITY;
```

**`video_studio_assets`**
```sql
CREATE TABLE video_studio_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  duration_ms INTEGER,
  thumbnail_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '2 hours')
);
```

---

## UI Styling

- **Theme**: Dark mode (slate-950/900 background) with gold (#C8A766) accents
- **Typography**: Inter font, clean hierarchy
- **Cards**: Subtle glass-morphism (backdrop-blur, border-slate-700)
- **Buttons**: Gold primary, ghost secondaries
- **Timeline**: Dark track rows, colored clip backgrounds per type
- **Consistent with existing toolkit pages** (VoiceStudio, VideoResizePack)

---

## Implementation Order

1. **Phase 1**: Core layout + timeline data model + basic playback
2. **Phase 2**: Media upload + library integration
3. **Phase 3**: Inspector panels (transform, crop, speed, color, audio)
4. **Phase 4**: Captions (transcribe, translate, styles, export)
5. **Phase 5**: Voiceover + teleprompter
6. **Phase 6**: Audio suite + AI command box
7. **Phase 7**: Effects + overlays + lower-thirds
8. **Phase 8**: AI scene generation panel
9. **Phase 9**: Export presets + render queue
10. **Phase 10**: Fair usage limits + auto-cleanup

---

## Technical Notes

- **Secrets Available**: `ELEVENLABS_API_KEY`, `LOVABLE_API_KEY` for AI features
- **Existing Infrastructure**: `studio_stock_library` table, `studio_projects` table pattern
- **Audio Handling**: Use `fetch().blob()` pattern for binary audio (not supabase.functions.invoke)
- **Video Processing**: Client-side Canvas API for preview; server-side FFmpeg for final render
- **RTL Languages**: Arabic, Hebrew, Persian, Urdu require `dir="rtl"` on text elements
- **Keyboard Shortcuts**: Space (play/pause), Cmd+Z (undo), Cmd+S (save), Del (delete clip)






merge all the current video and sound related tools into this tool to make sure all the tools are in one place including voice tuning and filters for sound and different voice over and accent and all languages to speak the text with a teleprompter and live video recording