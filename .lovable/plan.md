
# Full Caption Burn-on-Video Feature — Live Preview + Style Controls + Download

## Current State

The Export tab already has the skeleton for caption burning:
- A file picker for the burn video
- A `burnCaptionsOnVideo()` function that uses Canvas API + MediaRecorder
- A progress bar during burn
- A download trigger

**What's missing / needs to be built:**
1. **No live preview** — the Style tab shows a static dummy placeholder (a grey box with a Play icon). There is zero live playback with real captions overlaid
2. **Style controls are split** — settings live in the Style tab but the burn happens in the Export tab. Users can't see what the burn will look like *while* adjusting settings
3. **Font weight, outline/shadow, opacity, and animation** are not configurable — only size, color, bg, position, and speed exist
4. **Animation speed** setting exists in state but does nothing — the `drawCaptionText()` function doesn't use it at all
5. **The canvas burn is muted** — the MediaRecorder captures the canvas stream but audio from the original video is dropped (canvas.captureStream() doesn't include audio)
6. **No preview of captions before committing to burn** — users must burn and then watch the downloaded file to see if it looks right

## Architecture of the New Feature

### New "Preview" tab added between Style and Export

Instead of cramming live preview into Style tab (where it conflicts with the control panel layout), a dedicated **Preview** tab shows:
- The actual uploaded video (or the burn-target video) playing in a `<video>` element
- A `<canvas>` overlay positioned absolutely on top of it — same dimensions, pointer-events-none
- A `requestAnimationFrame` loop that reads `video.currentTime` and draws the active caption on the canvas each frame
- Play/Pause/Seek controls below

This gives users a **100% accurate preview** of exactly what the burned video will look like, because it uses the exact same `drawCaptionText()` function used during actual burning.

### Audio Preservation in Burned Video

The current `burnCaptionsOnVideo()` uses `canvas.captureStream(30)` which captures only video frames — no audio. Fix:

```typescript
// Capture both video+audio streams
const videoStream = canvas.captureStream(30);
const audioCtx = new AudioContext();
const source = audioCtx.createMediaElementSource(video);
const dest = audioCtx.createMediaStreamDestination();
source.connect(dest);
source.connect(audioCtx.destination); // keep local audio audible

// Merge canvas video tracks + audio tracks
const combinedStream = new MediaStream([
  ...videoStream.getVideoTracks(),
  ...dest.stream.getAudioTracks(),
]);
const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9,opus' });
```

### Animation Support (Caption Speed)

The `speed` setting currently exists but `drawCaptionText()` ignores it. We implement **fade-in/fade-out animation** per caption:

- Each segment has a natural start/end time
- Fade-in: first N ms of the segment, alpha goes 0 → 1
- Fade-out: last N ms of the segment, alpha goes 1 → 0
- Slow: 600ms fade, Normal: 300ms fade, Fast: 80ms fade (near-instant)

In `drawCaptionText()`, accept an `alpha: number` parameter and apply it via `ctx.globalAlpha`.

### Additional Style Controls

Add to `CaptionStyle`:
- `fontWeight: 'normal' | 'bold'` — toggles bold text
- `outlineWidth: number` — 0–4px stroke around each letter (great for readability)
- `outlineColor: string` — stroke color (default black)
- `bgOpacity: number` — 0–100% background opacity slider
- `fontFamily: 'Arial' | 'Georgia' | 'Impact' | 'Courier'` — 4 web-safe font choices that render consistently on canvas

## Files to Change

### Only `src/components/ai-video-studio/features/CaptionTranslator.tsx`

All changes are self-contained in this one file.

**1. Expand `CaptionStyle` interface:**
```typescript
interface CaptionStyle {
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontFamily: string;
  color: string;
  bgColor: string;
  bgOpacity: number;       // NEW: 0-100
  outlineWidth: number;    // NEW: 0-4
  outlineColor: string;    // NEW
  position: 'top' | 'center' | 'bottom';
  preset: string;
  speed: 'slow' | 'normal' | 'fast';
}
```

**2. Update `drawCaptionText()` to use new style fields + alpha:**
```typescript
function drawCaptionText(ctx, text, style, w, h, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}, sans-serif`;
  
  // Outline (stroke) text if outlineWidth > 0
  if (style.outlineWidth > 0) {
    ctx.strokeStyle = style.outlineColor;
    ctx.lineWidth = style.outlineWidth * 2;
    ctx.lineJoin = 'round';
    lines.forEach((line, i) => ctx.strokeText(line, x, y + i * lineH + fs));
  }
  
  // Background with opacity
  if (style.preset !== 'clean') {
    const bgAlpha = Math.round(style.bgOpacity / 100 * 255).toString(16).padStart(2, '0');
    ctx.fillStyle = style.bgColor + bgAlpha;
    // ...draw bg rect
  }
  
  ctx.fillStyle = style.color;
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineH + fs));
  ctx.globalAlpha = 1;
}
```

**3. Add new state for live preview:**
```typescript
const previewVideoRef = useRef<HTMLVideoElement>(null);
const previewCanvasRef = useRef<HTMLCanvasElement>(null);
const previewRafRef = useRef<number>(0);
const [previewPlaying, setPreviewPlaying] = useState(false);
const [previewTime, setPreviewTime] = useState(0);
const [previewDuration, setPreviewDuration] = useState(0);
const [previewVideoFile, setPreviewVideoFile] = useState<File | null>(null);
```

**4. Add `useEffect` for the canvas overlay draw loop:**
```typescript
useEffect(() => {
  if (activeTab !== 'preview') {
    cancelAnimationFrame(previewRafRef.current);
    return;
  }
  
  const video = previewVideoRef.current;
  const canvas = previewCanvasRef.current;
  if (!video || !canvas) return;
  
  const ctx = canvas.getContext('2d')!;
  
  const FADE_MS = { slow: 600, normal: 300, fast: 80 }[captionStyle.speed];
  
  const loop = () => {
    const t = video.currentTime;
    setPreviewTime(t);
    
    // Clear canvas (transparent — video element is behind)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const activeSeg = subtitles.find(s => t >= s.startTime && t <= s.endTime);
    if (activeSeg) {
      const text = burnLang && activeSeg.translations?.[burnLang]
        ? activeSeg.translations[burnLang]
        : activeSeg.text;
      
      // Compute fade alpha
      const elapsed = (t - activeSeg.startTime) * 1000;
      const remaining = (activeSeg.endTime - t) * 1000;
      const fadeMs = FADE_MS;
      const alpha = Math.min(
        elapsed < fadeMs ? elapsed / fadeMs : 1,
        remaining < fadeMs ? remaining / fadeMs : 1
      );
      
      drawCaptionText(ctx, text, captionStyle, canvas.width, canvas.height, alpha);
    }
    
    previewRafRef.current = requestAnimationFrame(loop);
  };
  
  previewRafRef.current = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(previewRafRef.current);
}, [activeTab, subtitles, captionStyle, burnLang]);
```

**5. Add NEW "Preview" tab in TABS array:**

Insert between Style and Export:
```typescript
const TABS = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'transcribe', label: 'Transcribe', icon: Wand2 },
  { id: 'translate', label: 'Translate', icon: Languages },
  { id: 'style', label: 'Style', icon: Palette },
  { id: 'preview', label: 'Preview', icon: Play },    // NEW
  { id: 'export', label: 'Export', icon: Download },
] as const;
```

**6. Preview tab JSX:**

```
┌──────────────────────────────────────────────────┐
│  ┌─ video file picker (if no burnVideoFile) ───┐  │
│  │  Uses uploadedFile as fallback              │  │
│  └────────────────────────────────────────────-┘  │
│                                                    │
│  ┌──── Video 16:9 ─────────────────────────────┐  │
│  │  <video ref={previewVideoRef} .../>          │  │
│  │  <canvas ref={previewCanvasRef}              │  │
│  │    className="absolute inset-0 pointer-      │  │
│  │    events-none" />                           │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  [◀◀ -5s] [▶ Play / ‖ Pause] [+5s ▶▶]            │
│  ━━━━━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━ 01:23/02:45  │
│                                                    │
│  Language: [Original] [🇸🇦 Arabic] [🇪🇸 Spanish]    │
└──────────────────────────────────────────────────┘
```

The `<video>` and `<canvas>` are wrapped in a `relative` container. Canvas uses `absolute inset-0` with `pointer-events-none`. Both share the same width/height so canvas pixels map 1:1 to video pixels visually.

**7. Update `burnCaptionsOnVideo()` to include audio + use alpha fade:**

The burn loop now:
1. Computes the same fade alpha as the preview loop
2. Calls `drawCaptionText()` with the alpha value
3. Captures audio via `AudioContext.createMediaElementSource()` + `createMediaStreamDestination()`
4. Combines canvas video tracks + audio destination tracks into a `MediaStream`
5. Uses `video/webm;codecs=vp9,opus` for combined A/V output

**8. Add new style controls in the Style tab:**

New controls added after the existing ones:
- **Font Family** — 4 buttons: Arial | Georgia | Impact | Courier
- **Font Weight** — Bold toggle button
- **Text Outline** — slider 0–4px + color picker
- **BG Opacity** — slider 0–100% (replaces hardcoded `CC` hex suffix)

## Tab Layout After Change

```
Upload → Transcribe → Translate → Style → Preview → Export
```

The Preview tab is the validation step before committing to export. Style changes made in Style tab are immediately visible in Preview since both use the same `captionStyle` state.

## Summary

| What | Change |
|---|---|
| New "Preview" tab | Live video + canvas overlay, RAF draw loop, play/pause/seek |
| `CaptionStyle` interface | +fontWeight, fontFamily, bgOpacity, outlineWidth, outlineColor |
| `drawCaptionText()` | +alpha fade, outline/stroke, font family, font weight, bg opacity |
| Burn audio | AudioContext merge fixes silent burned video |
| Caption speed | Fade-in/fade-out actually implemented in both preview and burn |
| Style controls | +font family, bold toggle, outline slider, bg opacity |

Only `CaptionTranslator.tsx` is modified. No new edge functions or database changes needed.
