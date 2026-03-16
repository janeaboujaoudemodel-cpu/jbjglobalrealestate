

## Plan: Replace Champagne Gold Backgrounds with Dark Luxury Brown Globally

### The Color

The target is the **dark luxury brown** from the Developer Center section:
```
bg-gradient-to-br from-[hsl(38,35%,12%)] via-[hsl(36,30%,16%)] to-[hsl(34,25%,12%)]
```
This is a deep, warm brown — not the light champagne gold that was mistakenly applied.

### What Changes

**All 111+ page files** currently using `bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]` as page-level backgrounds will be switched to the dark brown gradient. Text on these pages reverts to light colors (`text-white`, `text-zinc-300`, etc.) since the background is now dark again.

### Footer — Specific Treatment

The footer is mostly kept as-is (champagne). Only two sections change:

1. **Monogram + Company Name section** (lines 452-513): Gets the dark brown background (`from-[hsl(38,35%,12%)] via-[hsl(36,30%,16%)] to-[hsl(34,25%,12%)]`). Text stays light/gold — the "JBJ GLOBAL REAL ESTATE" heading reverts to white/gold gradient, "Excellence in Real Estate" gold stays visible.

2. **"Licensed ✦ BUY ✦ SELL ✦ RENT ✦ REAL ESTATE" text** (lines 588-623): Currently uses `text-white` which is invisible on champagne. Fix: change to `text-black` or `text-zinc-900` since this section sits inside the champagne 3D card. The gold gradient text for "Licensed" and "UAE" stays as-is. The paragraph below (line 621) changes from `text-zinc-400` to `text-zinc-600`.

3. **Everything else in footer** (property service guide cards, legal disclaimer, newsletter "Stay in the Loop" card) — **untouched**.

### Text Contrast Adjustments (Pages)

Since backgrounds go from champagne (light) back to dark brown (dark):
- `text-black` / `text-zinc-900` → `text-white` / `text-zinc-100`
- `text-zinc-600/700` → `text-zinc-300/400`
- Gold text stays gold (works on dark)

### Implementation — Batches

Due to 111+ files, executed in batches:
1. **Batch 1**: Footer.tsx (monogram section + buy/sell/rent text fix), Index.tsx, NewsletterBand.tsx, PageLoader.tsx
2. **Batch 2**: High-traffic pages (Contact, About, Services, Guides, FAQ, Awards, etc.)
3. **Batch 3**: All remaining pages alphabetically until zero champagne page backgrounds remain

### Files Summary
- ~111 files in `src/pages/` — replace champagne page wrappers with dark brown + revert text to light
- `src/components/Footer.tsx` — monogram section gets dark brown, buy/sell/rent text contrast fix
- `src/components/NewsletterBand.tsx` — dark brown background
- `src/components/PageLoader.tsx` — dark brown background

