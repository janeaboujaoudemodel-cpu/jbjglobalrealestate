
# Text Preset Visual Thumbnail Cards

## What's Changing

The presets section (lines 126–161 of `TextOverlayPanel.tsx`) currently renders plain `<button>` elements with just a label name and a sample text string. These will be replaced with miniature video-frame thumbnails — small dark canvases that render the text exactly as it will look on screen, using the same CSS properties (`fontFamily`, `fontSize`, `fontWeight`, `color`, `backgroundColor`, `textAlign`, `position`) from each preset definition.

No new files, no new dependencies. The entire change is self-contained inside `TextOverlayPanel.tsx`.

---

## Visual Design (CapCut/DaVinci-style)

Each card is a `16:9` mini preview at `aspect-video` (roughly 120×67px at 2-col grid width). The dark background simulates the video canvas, and the text is positioned to match the actual clip position (`top`, `center`, `bottom`).

**Card anatomy:**
```text
┌─────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░  │  ← dark bg (bg-black/slate gradient)
│                              │
│   ❮ Your Title Here ❯       │  ← text rendered at exact preset style (scaled down)
│                              │
│  Clean Title        [＋]    │  ← label bar + add button
└─────────────────────────────┘
```

On hover: an amber glow border appears (`border-amber-400 shadow-amber-500/30`).

When a preset is the last-applied one, it shows a golden ring (`ring-2 ring-amber-400`).

---

## How the Text is Rendered in Each Thumbnail

The preset data already contains all needed CSS values. A `TextPreviewThumbnail` sub-component (defined inline in the file) will:

1. Render a `relative bg-black rounded-md overflow-hidden aspect-video` container
2. Render a `<span>` inside it positioned with:
   - `position: 'absolute'` for `top`/`bottom` presets, `relative` + flex center for `center`
   - `fontFamily`, `fontWeight`, `color` from preset — unchanged
   - `fontSize` scaled down to ~18–22% of original (e.g., `fontSize: Math.max(7, preset.fontSize * 0.18)`)
   - `backgroundColor` from preset (the semi-transparent black box for Lower Third / Caption Box will be visible)
   - `textAlign`, `padding` as needed
3. A bottom label bar with the preset name and a `+` icon button

The scaling ratio is chosen so that the largest preset (Social Bold at 72px) renders at ~13px and the smallest (Caption Box at 24px) renders at ~6px — both readable at thumbnail scale.

---

## Preset-by-Preset Thumbnail Preview

| Preset | What the thumbnail shows |
|---|---|
| Clean Title | White bold Inter text, centered on black bg — looks like a cinema title card |
| Lower Third | White text left-aligned at bottom with dark `rgba(0,0,0,0.7)` bg bar — TV news style |
| Social Bold | Gold Impact text, centered, large — punchy social media look |
| Luxury Quote | Serif gold `#C8A766` text, centered, italic-ready — elegant quote card |
| Caption Box | Small white text centered at bottom with a dark translucent bar — subtitle style |

---

## Implementation: New `TextPreviewThumbnail` Sub-Component

A small inline component (added at the top of `TextOverlayPanel.tsx`, before the main export):

```typescript
function TextPreviewThumbnail({ preset, isActive, onClick }: {
  preset: typeof TEXT_PRESETS[0];
  isActive: boolean;
  onClick: () => void;
}) {
  const scaleFactor = 0.19;
  const scaledSize = Math.max(6, Math.round(preset.fontSize * scaleFactor));

  const textStyle: React.CSSProperties = {
    fontFamily: preset.fontFamily,
    fontSize: scaledSize,
    fontWeight: preset.fontWeight,
    color: preset.color,
    background: preset.backgroundColor !== 'transparent' ? preset.backgroundColor : 'transparent',
    padding: preset.backgroundColor !== 'transparent' ? '2px 5px' : 0,
    borderRadius: preset.backgroundColor !== 'transparent' ? 3 : 0,
    textAlign: preset.textAlign,
    whiteSpace: 'nowrap',
    maxWidth: '90%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.2,
  };

  return (
    <button onClick={onClick} className={`group flex flex-col rounded-lg overflow-hidden border transition-all ... `}>
      {/* Dark video bg area */}
      <div className="relative bg-[#0a0a0f] aspect-video w-full overflow-hidden">
        {/* Subtle film grain texture via CSS gradient */}
        <div className="absolute inset-0 opacity-20" 
             style={{ backgroundImage: 'url("data:image/svg+xml,...")' }} />
        
        {/* Position the text */}
        {preset.position === 'center' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={textStyle}>{preset.content}</span>
          </div>
        )}
        {preset.position === 'top' && (
          <div className="absolute top-1.5 left-0 right-0 flex justify-center">
            <span style={textStyle}>{preset.content}</span>
          </div>
        )}
        {preset.position === 'bottom' && (
          <div className="absolute bottom-1.5 left-0 right-0 flex" 
               style={{ justifyContent: preset.textAlign === 'left' ? 'flex-start' : 'center', paddingLeft: preset.textAlign === 'left' ? 4 : 0 }}>
            <span style={textStyle}>{preset.content}</span>
          </div>
        )}
      </div>

      {/* Label bar */}
      <div className="flex items-center justify-between px-1.5 py-1 bg-slate-800">
        <span className="text-[10px] font-semibold text-slate-200 truncate">{preset.label}</span>
        <Plus className="w-3 h-3 text-amber-400 shrink-0" />
      </div>
    </button>
  );
}
```

---

## Changes to the Presets Section JSX

Replace lines 126–161 in `TextOverlayPanel.tsx`:

**Before (plain text buttons):**
```tsx
<div className="grid grid-cols-2 gap-1.5">
  {TEXT_PRESETS.map(p => (
    <button key={p.label} onClick={...} className="flex flex-col items-start ...">
      <span className="font-medium text-white">{p.label}</span>
      <span className="text-slate-500 text-[10px]">{p.content}</span>
    </button>
  ))}
</div>
```

**After (visual thumbnail cards):**
```tsx
<div className="grid grid-cols-2 gap-2">
  {TEXT_PRESETS.map(p => (
    <TextPreviewThumbnail
      key={p.label}
      preset={p}
      isActive={lastAppliedPreset === p.label}
      onClick={() => { applyPreset(p); onAddTextClip(...); toast.success(...); }}
    />
  ))}
</div>
```

A `lastAppliedPreset` state (`useState<string | null>(null)`) tracks which preset was last clicked so it shows the golden ring highlight.

---

## Additional Visual Polish

- The card border in idle state: `border-slate-700 bg-slate-800/50`
- On hover: `border-amber-500/50 shadow-md shadow-amber-500/10 scale-[1.02]`
- Active/last-applied: `ring-2 ring-amber-400 border-amber-400`
- The `aspect-video` dark bg gets a very subtle `radial-gradient` from `#111` center to `#050508` edges to simulate the cinematic canvas feel
- The label bar uses `bg-slate-800` to create a clear visual separation from the preview area
- A "Presets — click to add" subtitle changes to "Presets" to keep it concise (the thumbnails are self-explanatory)
- The `Plus` icon in the label bar turns amber on hover to reinforce the add action

---

## File to Edit

| File | Change |
|---|---|
| `src/components/ai-video-studio/features/TextOverlayPanel.tsx` | Add `TextPreviewThumbnail` sub-component; add `lastAppliedPreset` state; replace the plain-button preset grid with thumbnail card grid |

No other files need changes — the click handler logic (`applyPreset` + `onAddTextClip`) stays identical, just called from within the new component.
