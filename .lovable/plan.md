

## Plan: Unified Photo Studio Pro Hub — All-in-One Suite

### Current State
- `BeautyFilters.tsx` (917 lines) has 6 separate tabs (Edit, Face, Body, Hair, Outfit, Grid), each requiring its own photo upload — this is the core problem
- `PhotoSuite.tsx` is a separate wrapper with 9 more tabs (Background AI, Beauty, Resize, etc.) — also fragmented
- AI features are simulated (`simulateAI` just shows a toast with setTimeout) — not wired to real edge functions
- Edge functions exist: `ai-background-remove`, `remove-background`, `ai-outfit-changer` — but are not connected to BeautyFilters
- Remaining emojis in section labels (`💄`, `🧖`, `💪`, `✂️`, `🎨`, `👗`, `🧹`) and BackgroundAI presets

### Architecture Change

**Merge everything into one unified component** with a single photo upload at the top, a persistent preview canvas in the center, and a collapsible tool sidebar. No more per-section upload prompts.

### Changes

#### 1. Refactor `BeautyFilters.tsx` → Unified Photo Studio Pro
- Remove `!image ? uploadZone` check from every tab — show upload zone ONLY at the very top, once
- All tabs share the same `imagePreview` and `canvasRef`
- Add new tabs: **Background**, **Create** (Canva-like: story/post/grid), **Share**
- Remove all emoji section labels (`💄`, `🧖`, `💪`, `✂️`, `🎨`, `👗`, `🧹`) → Lucide icons
- Wire `simulateAI` calls to actual edge functions:
  - Face/Hair/Makeup/Body → `ai-background-remove` with `mode: "edit"` + image prompt
  - Background removal → `ai-background-remove` (already built)
  - Outfit change → `ai-outfit-changer` (already built)

#### 2. Wire Real AI Processing
- Replace `simulateAI` function with `processWithAI(action, prompt)` that:
  - Converts canvas to base64
  - Calls the appropriate edge function
  - Receives modified image back
  - Renders result on canvas
- Actions: `remove-bg`, `change-outfit`, `change-hair`, `apply-makeup`, `reshape-body`, `change-background`
- All use `ai-background-remove` edge function (already supports `mode` and `generationPrompt`)

#### 3. Add Social Sharing & Export Panel
- New "Share" tab with:
  - Download (already exists)
  - Share by Email (mailto link with attachment or copy link)
  - Social platform buttons: Instagram, Facebook, Snapchat, TikTok, WhatsApp, Twitter/X, LinkedIn, Telegram
  - Each generates platform-optimized format (story 9:16, post 1:1, landscape 16:9)
  - Copy to clipboard, Web Share API for mobile
- Format presets: Instagram Story (1080x1920), Instagram Post (1080x1080), Facebook Cover (820x312), Snapchat (1080x1920), WhatsApp Status (1080x1920)

#### 4. Add "Create" Tab (Canva-like)
- Quick actions: "Create Instagram Story", "Create Post", "Create Grid"
- AI prompt field: "Describe what you want to create today"
- Uses `ai-background-remove` with `mode: "generate"` and prompt
- Animate photo option (placeholder for future video generation)

#### 5. Retire PhotoSuite.tsx Fragmentation
- Keep `PhotoSuite.tsx` as an entry point but make "Beauty" tab load the unified BeautyFilters which now contains everything
- Remove redundant Background AI / Resize tabs from PhotoSuite since they're now integrated

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/toolkit/BeautyFilters.tsx` | Major refactor: single upload, unified preview, real AI calls, share tab, create tab, remove emojis |
| `src/pages/toolkit/PhotoSuite.tsx` | Simplify — unified entry to BeautyFilters as main tool |
| `src/pages/toolkit/BackgroundAI.tsx` | Remove emoji presets (`⬜`, `🔵`) → use color swatches |

### Key Technical Details

**Real AI call replacing simulateAI:**
```typescript
const processWithAI = async (action: string, prompt: string) => {
  if (!canvasRef.current) return;
  setIsProcessingAI(true);
  const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
  const { data, error } = await supabase.functions.invoke('ai-background-remove', {
    body: { mode: action, image: base64, generationPrompt: prompt }
  });
  if (data?.resultImage) {
    // Load result back onto canvas
    const img = new Image();
    img.onload = () => { canvasRef.current.getContext('2d').drawImage(img, 0, 0); };
    img.src = `data:image/png;base64,${data.resultImage}`;
  }
  setIsProcessingAI(false);
};
```

**Share via Web Share API:**
```typescript
const handleShare = async (platform: string) => {
  const blob = await new Promise<Blob>(r => canvasRef.current.toBlob(r, 'image/png'));
  const file = new File([blob], 'photo.png', { type: 'image/png' });
  if (navigator.share) {
    await navigator.share({ files: [file], title: 'Photo Studio Pro' });
  }
};
```

This consolidation eliminates the fragmented per-section uploads, connects real AI processing, and adds full social media sharing — all in one unified hub.

