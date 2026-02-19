
# Real-Time Audio Waveform Visualizer for Sound FX Panel

## What We're Building

A CapCut-style waveform visualizer that replaces the current CSS `animate-bounce` fake bars. When a sound is playing, a canvas element renders real frequency data from the Web Audio API's `AnalyserNode` at 60fps — producing a live, responsive bar chart waveform just like CapCut's audio preview.

---

## Current State

The panel (`SoundEffectsPanel.tsx`) already has:
- `audioRefs` holding `HTMLAudioElement` instances per sound
- A simple 5-bar CSS bounce animation (fake, not real audio data)
- A thin progress bar below each card

The fake waveform looks like this:
```text
[▐▌▐▌▐] <-- 5 fixed bars, CSS bounce, no audio data
```

The real waveform will look like this (live FFT bars on a canvas):
```text
[▁▃▇▅▂▆▄▁▃▆▇▅▂▁] <-- 14 frequency bars driven by AnalyserNode, 60fps
```

---

## Architecture: Web Audio API Chain

When a user clicks Play, the current code just calls `new Audio(url).play()`. We need to route audio through the Web Audio API to tap real frequency data:

```text
HTMLMediaElementSourceNode
        ↓
   AnalyserNode  ←── reads frequencyData[] each animation frame
        ↓
AudioContext.destination (speakers)
```

The `AnalyserNode` runs `getByteFrequencyData(dataArray)` each `requestAnimationFrame` tick, populating a `Uint8Array` with frequency amplitude values (0–255). We sample ~28 buckets from this array and draw them as bars onto a `<canvas>` element.

---

## Implementation Plan

### 1. New hook: `useAudioAnalyser`

Create `src/components/ai-video-studio/hooks/useAudioAnalyser.ts`

This hook encapsulates all Web Audio API state so `SoundEffectsPanel` stays clean:

```typescript
// Returns per-soundId: { sourceNode, analyser }
// And draw function: drawWaveform(canvasEl, analyserNode)
```

**Key details:**
- Uses a single shared `AudioContext` (lazy singleton — created once on first play, reused)
- `MediaElementAudioSourceNode` is created once per `HTMLAudioElement` (Chrome throws if you wrap the same element twice — tracked via a `WeakMap`)
- `AnalyserNode` settings: `fftSize: 256` (gives 128 frequency bins), `smoothingTimeConstant: 0.75`
- `getByteFrequencyData()` reads into a `Uint8Array(analyser.frequencyBinCount)`
- We use bins 0–56 (lower half = audible frequencies) and sample every 4th bin → **14 bars**
- `requestAnimationFrame` loop is started on play and cancelled on stop via a `rafId` ref

### 2. New component: `SoundWaveform`

Create a small React component that accepts `{ analyser: AnalyserNode | null, isPlaying: boolean, width?: number, height?: number }`.

It owns a `<canvas>` ref and runs its own `useEffect`-based RAF loop when `isPlaying && analyser`:

```typescript
useEffect(() => {
  if (!isPlaying || !analyser || !canvasRef.current) return;
  const ctx = canvasRef.current.getContext('2d')!;
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  let rafId: number;
  const draw = () => {
    rafId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw bars from sampled frequency data with amber gradient
    ...
  };
  draw();
  return () => cancelAnimationFrame(rafId);
}, [isPlaying, analyser]);
```

When `!isPlaying`, it renders a flat idle state (14 thin bars at ~25% height, no animation).

**Visual design (CapCut-style):**
- Canvas size: `112px × 28px` (matches existing 5-bar space, scaled up)
- Bar width: `5px`, gap: `3px`, 14 bars
- Colors: amber gradient (`#f59e0b` bottom → `#fcd34d` top) when playing
- Idle: `#475569` (slate-600) flat bars at height 6px
- Bars smoothly animate using the `smoothingTimeConstant: 0.75` — no manual lerp needed

### 3. Update `SoundEffectsPanel.tsx`

**`handlePlay` changes:**
1. Resume `AudioContext` if it's in `suspended` state (Chrome autoplay policy requires user gesture)
2. Create/reuse `MediaElementAudioSourceNode` via `WeakMap` check
3. Create/reuse `AnalyserNode` per sound ID (stored in `analyserRefs`)
4. Chain: `sourceNode → analyser → audioCtx.destination`
5. Store `analyser` reference keyed by `sound.id` in `analyserRefs`

**Template changes:**
- Replace the 5-div fake bars with `<SoundWaveform analyser={analyserRefs.current[sound.id]} isPlaying={isPlaying} />`
- The progress bar below stays as-is (it's still useful for position)

**Cleanup:**
- On component unmount, cancel all RAF loops (handled by `SoundWaveform` cleanup)
- `stopAll` already pauses/resets audio elements — analyser nodes don't need cleanup (they stop producing data automatically)

---

## Files to Create/Edit

| File | Action | What Changes |
|---|---|---|
| `src/components/ai-video-studio/hooks/useAudioAnalyser.ts` | **Create** | Shared AudioContext singleton + per-element analyser setup |
| `src/components/ai-video-studio/features/SoundWaveform.tsx` | **Create** | Canvas-based 60fps waveform component |
| `src/components/ai-video-studio/features/SoundEffectsPanel.tsx` | **Edit** | Wire up hook, replace fake bars with `<SoundWaveform>` |

No backend changes, no new dependencies. Pure Web Audio API + React canvas.

---

## Edge Cases Handled

- **Safari iOS**: `AudioContext` requires `resume()` after user gesture — `handlePlay` calls `audioCtx.resume()` before playing
- **Chrome duplicate wrapping**: `WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>` prevents the "already connected to AudioContext" error
- **Panel unmount mid-play**: `SoundWaveform`'s `useEffect` cleanup cancels the RAF loop
- **Silent / zero data**: When frequency data is all zeros (before audio loads), bars render at idle height
- **Multiple simultaneous calls**: `stopAll()` is called before starting a new sound, so only one analyser is ever active at a time
