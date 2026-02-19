
# Caption Panel — Linear Step-by-Step Wizard Redesign

## Problem Analysis

The current `CaptionTranslator.tsx` has these UX issues:

1. **Clickable step chips** — users can jump to any step at any time, breaking the expected linear flow
2. **Language grid hidden by default** — on Step 3 (Translate), all 28 languages are collapsed behind a "All 28 languages" toggle button. Users must click to see them
3. **Style and Preview are split into two separate tabs** — Step 4 is "Style" and Step 5 is "Preview", requiring two tab switches to see styled captions on video
4. **6 internal tabs vs 5 logical steps** — `activeTab` has values: `upload | transcribe | translate | style | preview | export` creating conceptual confusion
5. **No clear "locked" state** — later steps show empty-state fallbacks but never properly lock the user from clicking ahead

## Solution: Strict Linear Wizard

Replace the current tab-chip navigation with a **numbered step indicator** that:
- Shows step numbers (1–5), not clickable chips
- Marks completed steps with a green check
- Only highlights the current step in amber
- Allows going **back** to any previous step, but not forward past the current step
- Merges Style + Preview into a single Step 4

### Step Map

| Step | Label | Unlocked when |
|------|-------|---------------|
| 1 | Upload | Always |
| 2 | Transcribe | File uploaded |
| 3 | Translate | Subtitles exist |
| 4 | Style & Preview | Subtitles exist |
| 5 | Export | Subtitles exist |

## Key Changes Per Step

### Step 1 — Upload
- Same drop zone + file info card
- Language picker for "spoken language" stays here
- CTA: "Start Transcription →" button auto-advances to Step 2

### Step 2 — Transcribe
- Same transcription logic (chunked, ElevenLabs Scribe)
- Progress bar with stage label
- Editable segment list after transcription
- CTA: "Translate to Other Languages →" button auto-advances to Step 3

### Step 3 — Translate (Fixed: All Languages Always Visible)
- **Remove the `showLangGrid` toggle entirely**
- Show all 28 languages in a scrollable 3-column grid, always visible
- Selected language highlighted in amber
- "Translate" button → after translation complete, show translated segments inline
- Multiple languages can be translated sequentially (each adds to the list)
- CTA: "Style & Preview →" button advances to Step 4

### Step 4 — Style & Preview (Merged)
- Two-column-like layout within the same panel:
  - **Left/top**: Style controls (preset, font, size, position, color, opacity, outline, animation speed)
  - **Right/bottom**: Live CSS preview box (not canvas — a real-time HTML preview that updates instantly as user changes style settings)
- If user uploaded a video file, also show the video upload + canvas overlay preview (same as current "Preview" tab)
- Language selector to pick which translation to preview
- CTA: "Export Subtitles →" advances to Step 5

### Step 5 — Export
- SRT/VTT download for original + all translated languages (same as current Export tab)
- Burn captions on video section (same logic)
- No CTA needed — this is the final step

## Step Indicator Redesign

Replace the current button-row with a cleaner progress indicator:

```
● 1 Upload  →  ✓ 2 Transcribe  →  ● 3 Translate  →  ○ 4 Style  →  ○ 5 Export
```

- Circle with number: not yet started
- Amber filled circle: current step
- Green check circle: completed
- Connecting lines turn green as steps complete
- **Clicking a step only works if that step is already done or is the current step** (no skipping forward)

## Internal State Simplification

The `activeTab` union type changes from:
```typescript
'upload' | 'transcribe' | 'translate' | 'style' | 'preview' | 'export'
```
to:
```typescript
1 | 2 | 3 | 4 | 5
```

This eliminates the conceptual mismatch between 6 tab values and 5 displayed steps.

The `previewSource` logic (video for preview canvas) stays: if user uploaded a video file originally OR selects a separate video in Step 4, it's shown in the preview.

## Files to Edit

| File | Action |
|------|--------|
| `src/components/ai-video-studio/features/CaptionTranslator.tsx` | Full rewrite — single file change |

No other files need to change. The component interface (`props`) stays identical so `IntegratedToolsPanel.tsx` requires no update.

## Implementation Details

- Step indicator: fixed at the top, `flex` row, 5 numbered circles with connector lines
- Steps 3's language grid: `grid grid-cols-3` with `max-h-56 overflow-y-auto` — always expanded
- Step 4's live preview: the same CSS `<span>` preview box (already in the "style" tab) stays — updates in real-time as style state changes. The canvas-based video preview stays below it, reactivated by the same `activeStep === 4` condition (replaces `activeTab === 'preview'`)
- Back navigation: each step panel (except Step 1) has a small "← Back" link in the top-left that decrements `activeStep`
- Auto-advance: after transcription completes → `setActiveStep(3)`, after translation → `setActiveStep(4)` is offered but not forced
