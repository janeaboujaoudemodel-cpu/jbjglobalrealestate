
# Voice Dubbing — Full Audio Track Assembly + Video Sync

## What Already Exists

The `handleDubAll()` function in `CaptionTranslator.tsx` already:
- Calls `voice-studio-tts` for each segment sequentially
- Stores individual MP3 blob URLs per segment under `sub.dubbedAudioUrl[langCode]`
- Shows per-segment `<audio>` playback widgets in the Translate tab

What is missing is **assembly**: these segment blobs are isolated clips. There is no mechanism to stitch them into a single audio file that respects the original video's timeline (with silence gaps between segments matching the original timecodes).

## Architecture of the New Feature

### Step 1 — Stitch Segments into a Gapped Audio Track (Web Audio API)

After dubbing all segments, the user clicks **"Assemble Dubbed Track"** (or it happens automatically after Dub All). The browser:

1. Fetches each segment's audio blob and decodes it via `AudioContext.decodeAudioData()`
2. Creates an `AudioBuffer` long enough to hold the entire video duration
3. Copies each decoded segment's audio data into the buffer at the correct time offset (using `seg.startTime` as the offset in seconds)
4. Segments that are longer than their timeslot are trimmed; gaps between segments are silence (zeroed buffer)
5. Encodes the assembled buffer as WAV (or WebM audio) using `MediaRecorder` on an `AudioBufferSourceNode` connected to a `MediaStreamDestination`
6. The result is a single `Blob` stored in state as `dubbedTrackUrl[langCode]`

### Step 2 — Preview: Play Video with Dubbed Audio

In the Preview tab, when a dubbed track is available and selected:
- The `<video>` element is muted (`video.muted = true`) so its original audio is silenced
- A second `<audio>` element (hidden) plays the assembled `dubbedTrackUrl[langCode]` blob
- Both are controlled by the same play/pause/seek controls — seeking the video also seeks the audio element to the same `currentTime`

### Step 3 — Export: Burn with Dubbed Audio

In the Export tab's "Burn Captions" flow, when a `dubbedTrackUrl` exists for the selected `burnLang`:
- Instead of capturing `AudioContext.createMediaElementSource(video)`, use a `MediaElementAudioSourceNode` from the dubbed audio `<audio>` element
- Route that into the `MediaStreamDestination` that feeds `MediaRecorder`
- Result: the burned WebM has the dubbed audio instead of the original

## What Changes

### File: `src/components/ai-video-studio/features/CaptionTranslator.tsx` only

All changes are in this one file. No new edge functions needed.

**New state:**
```typescript
const [dubbedTrackUrl, setDubbedTrackUrl] = useState<Record<string, string>>({});
const [isAssembling, setIsAssembling] = useState<string | null>(null);
const dubbedAudioRef = useRef<HTMLAudioElement>(null);
```

**New `assembleDubbedTrack(langCode)` function:**

This runs after Dub All (or on demand via a button). Uses Web Audio API:

```
For each segment (with dubbedAudioUrl[langCode]):
  1. fetch the blob URL → arrayBuffer → AudioContext.decodeAudioData()
  2. copyToChannel() at seg.startTime seconds into a master AudioBuffer
  
Then:
  3. Play master AudioBuffer via AudioBufferSourceNode → MediaStreamDestination
  4. Record via MediaRecorder → Blob
  5. Store URL in dubbedTrackUrl[langCode]
```

The master buffer length = `Math.ceil(lastSegment.endTime * sampleRate)` samples.

**Modified `handleDubAll()`:**

After successfully dubbing all segments, automatically call `assembleDubbedTrack(langCode)`.

**Modified Preview tab:**

When `dubbedTrackUrl[burnLang]` exists:
- `<video>` gets `muted` prop
- A hidden `<audio ref={dubbedAudioRef}>` is added with `src={dubbedTrackUrl[burnLang]}`
- Play/pause/seek controls also sync the dubbed audio element:

```typescript
const togglePreviewPlay = () => {
  const v = previewVideoRef.current;
  const a = dubbedAudioRef.current;
  if (!v) return;
  if (v.paused) {
    v.play();
    a?.play(); // sync dubbed audio
    setPreviewPlaying(true);
  } else {
    v.pause();
    a?.pause();
    setPreviewPlaying(false);
  }
};

const seekPreview = (delta: number) => {
  const v = previewVideoRef.current;
  const a = dubbedAudioRef.current;
  if (!v) return;
  const t = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
  v.currentTime = t;
  if (a) a.currentTime = t; // keep audio in sync
};
```

The seek bar `onChange` also syncs `dubbedAudioRef.current.currentTime`.

**Modified `burnCaptionsOnVideo()`:**

Detect if dubbed track exists for the selected `burnLang`:
- If yes: create a hidden `<audio>` element from `dubbedTrackUrl[burnLang]`, connect its audio to a `MediaStreamDestination`, mute the video element
- If no: use the original video audio (existing logic)

**New UI — Dubbed Track section in Translate tab:**

After Dub All completes, show an assembled track status card per language:

```
┌─ 🇸🇦 Arabic Dubbed Track ──────────────────┐
│  ✓ Assembled — 14 segments, 2m 34s         │
│  [▶ Play full track]  [⬇ Download MP3]     │
│  [🎬 Use in Preview]                        │
└─────────────────────────────────────────────┘
```

The "Play full track" button plays just the dubbed audio blob to let users verify the full dub before exporting.

**Voice selector for dubbing:**

Currently `handleDubAll` hardcodes `voiceId: 'JBFqnCBsd6RMkjVDRZzb'` (George). Add a voice picker (dropdown using `VOICE_OPTIONS` from types.ts) before the Dub All button so users can choose from the 14 available voices. This state goes into `const [dubVoiceId, setDubVoiceId] = useState('JBFqnCBsd6RMkjVDRZzb')`.

## Summary of All Changes

| Area | What Changes |
|---|---|
| State | +`dubbedTrackUrl`, `isAssembling`, `dubVoiceId`, `dubbedAudioRef` |
| `handleDubAll()` | After dubbing all segs, auto-calls `assembleDubbedTrack()` |
| `assembleDubbedTrack()` | NEW — Web Audio API: decodes all segment blobs, copies at correct timestamps into one AudioBuffer, records to Blob, stores in `dubbedTrackUrl[lang]` |
| Preview tab | If dubbed track exists for selected lang: mutes video, syncs hidden `<audio>` dubbed element with play/pause/seek |
| `burnCaptionsOnVideo()` | If dubbed track exists for selected `burnLang`: uses dubbed audio element as audio source instead of original video audio |
| Voice picker UI | Dropdown before Dub All button using `VOICE_OPTIONS` from types.ts |
| Dubbed track card UI | Shows assembled track status, playback + MP3 download per language |

Only `CaptionTranslator.tsx` is modified. No database, no new edge functions, no new dependencies.
