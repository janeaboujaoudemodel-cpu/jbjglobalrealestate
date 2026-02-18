
# CaptionTranslator End-to-End Test — Issues Found & Fixes

## Test Results Summary

After reading every relevant file, here is what works and what fails in the upload → transcribe → translate to Arabic → export SRT flow:

---

## What Works Correctly

- **SRT timestamp format** — `toSRTTime()` at line 57-61 is correct: produces `HH:MM:SS,mmm` with a comma separator, zero-padded to 3 digits for milliseconds. This is standard-compliant.
- **VTT timestamp format** — `toVTTTime()` correctly uses a `.` dot separator.
- **Arabic RTL text display** — In the Translate tab, translated segments render with `dir="rtl"` and `className="text-right"` applied when `lang.rtl === true`. The edit textarea also applies `dir={isRTL ? 'rtl' : 'ltr'}`.
- **`auto-translate` edge function** — Correctly handles Arabic (`ar`) with the full language name `"Arabic (Modern Standard Arabic - العربية)"`. Caches translations. Response parsing strips markdown.
- **Export flow** — The export tab correctly passes `langCode` to `exportSRT(lc)` which picks `sub.translations[lc]` over the original text.
- **ElevenLabs Scribe word grouping** — `groupWordsIntoSegments()` correctly skips `[LAUGHTER]`, `[MUSIC]` tags and groups into ≤12 words / ≤7 second segments.

---

## Critical Bug — File Size Exceeds Edge Function Body Limit

**The main blocking issue for the test:**

The frontend converts the entire audio file to base64 in one pass (lines 206-219) and sends it as a JSON body to the edge function. The payload is ~33% larger than the original file due to base64 encoding.

Edge functions enforce a **6MB request body limit** by default. This means:
- Files larger than ~4.5MB will produce a `413 Payload Too Large` error or silently time out
- The UI only shows a `>50MB` warning — it still tries to send the full file without chunking

**For real test with a typical audio file (MP3 interview, 3-10 min):**
- 1 min audio ≈ 1MB → 1.3MB base64 → **OK**
- 3 min audio ≈ 3MB → 4MB base64 → **borderline**
- 5 min audio ≈ 5MB → 6.5MB base64 → **FAILS**

---

## Secondary Bug — MIME Type for MP3 Files

When a `.mp3` file is uploaded, `uploadedFile.type` returns `audio/mpeg`. The edge function builds the filename as `audio.mpeg` in the FormData (line 94 of video-transcribe). ElevenLabs Scribe does accept MP3, but using `audio.mpeg` as extension instead of `audio.mp3` may cause unexpected failures on the Scribe API side since it uses file extension for format detection.

**Fix:** Map known MIME types to their proper extensions.

---

## Minor Issue — Burn Captions RTL Word-Wrap

The Canvas-based `drawCaptionText()` function splits text on spaces for word-wrapping. Arabic text renders right-to-left at the character level in Canvas (Unicode bidi is respected), but the word-wrap splits and measures using `ctx.measureText()` which does work for Arabic glyphs. The visual output will be centered correctly. This is not a blocking bug but the text alignment on Canvas could be improved by setting `canvas.direction = 'rtl'` before drawing RTL text.

---

## Fix Plan

### File 1: `src/components/ai-video-studio/features/CaptionTranslator.tsx`

**Fix 1: Chunked transcription to bypass 6MB limit**

Instead of sending the full file as one base64 blob, split the `ArrayBuffer` into chunks of 3MB (≤4MB base64 after encoding) and call the edge function once per chunk. The edge function already handles each chunk independently and returns segments with timestamps — stitch the results together client-side by offsetting timestamps by the cumulative duration of previous chunks.

Since we cannot know exact audio duration per chunk without decoding the audio, use a time-offset approximation: multiply `(chunkIndex * chunkByteSize / totalByteSize) * estimatedTotalDuration`. A better approach is to use the `endTime` of the last segment from the previous chunk as the start offset for the next chunk's timestamps.

The simplest reliable fix: **cap the base64 payload at 3MB by slicing the `ArrayBuffer`** before encoding, send sequential requests, and concatenate `segments[]` arrays. Adjust `startTime`/`endTime` of subsequent chunks by adding the `endTime` of the last segment from the previous chunk.

```typescript
const CHUNK_BYTES = 3 * 1024 * 1024; // 3MB binary = ~4MB base64
const totalChunks = Math.ceil(arrayBuffer.byteLength / CHUNK_BYTES);
let allSegments: SubtitleSegment[] = [];
let timeOffset = 0;

for (let c = 0; c < totalChunks; c++) {
  const slice = arrayBuffer.slice(c * CHUNK_BYTES, (c + 1) * CHUNK_BYTES);
  // encode, send, get segments
  // adjust timestamps: seg.startTime + timeOffset, seg.endTime + timeOffset
  // timeOffset += last segment's endTime from previous chunk
}
```

**Fix 2: MIME type → file extension mapping**

```typescript
const MIME_TO_EXT: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'audio/mp4': 'mp4',
  'audio/m4a': 'm4a',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};
```

Send `mimeType` to the edge function and use this map in the edge function when building the FormData filename.

**Fix 3: Canvas RTL direction for Arabic burn**

Before drawing Arabic (or any RTL) text on canvas:
```typescript
if (isRTLText) {
  (ctx as any).direction = 'rtl';
}
ctx.textAlign = 'center';
// draw...
(ctx as any).direction = 'ltr'; // reset
```

**Fix 4: Progress display for multi-chunk transcription**

Show per-chunk progress: "Transcribing chunk 2 of 4…" during multi-chunk uploads.

### File 2: `supabase/functions/video-transcribe/index.ts`

**Fix 5: Better MIME type → extension mapping in FormData**

```typescript
const MIME_TO_EXT: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'audio/mp4': 'mp4',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};
const ext = MIME_TO_EXT[mimeType] || mimeType.split('/')[1] || 'webm';
formData.append("file", audioBlob, `audio.${ext}`);
```

**Fix 6: Add `timeOffset` parameter support for chunked transcription**

Accept an optional `timeOffset: number` in the request body. When present, add it to every segment's `startTime` and `endTime` before returning:

```typescript
const { audio, mimeType = "audio/webm", language = "en", timeOffset = 0 } = await req.json();
// ...
segments = segments.map(s => ({
  ...s,
  startTime: s.startTime + timeOffset,
  endTime: s.endTime + timeOffset,
}));
```

---

## Files to Change

| File | What Changes |
|---|---|
| `src/components/ai-video-studio/features/CaptionTranslator.tsx` | Chunked transcription (3MB slices), MIME extension fix, RTL canvas direction, multi-chunk progress |
| `supabase/functions/video-transcribe/index.ts` | MIME→extension map fix, `timeOffset` parameter support |

---

## End-to-End Test Verification Checklist

After fixes, the flow should pass these checks:

1. Upload a 5-minute MP3 (≈5MB) — transcription completes without 413 error
2. Segments display with real `MM:SS.ms` timestamps in the Transcribe tab
3. Translate to Arabic — Arabic text appears right-to-left in the segment list
4. Edit an Arabic translation — textarea also shows RTL text correctly
5. Export SRT (Arabic) — file opens in a text editor, timestamps are `00:00:12,345 --> 00:00:15,678` format
6. Burn Captions with Arabic selected — Arabic renders center-aligned on the video canvas

---

## SRT Format Confirmation

The current `toSRTTime` function is already correct. Sample output for a 12.345s start, 15.678s end:
```
1
00:00:12,345 --> 00:00:15,678
مرحباً بكم في دبي
```
No change needed to the SRT formatter itself.
