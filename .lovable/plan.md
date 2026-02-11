

## Restyle "Recommended for You" Popup to Champagne Theme

### Current State
The popup uses a dark theme (`from-[#1a1a1a]`, `bg-zinc-800`, dark borders) which is inconsistent with the platform's champagne gold design language.

### Changes to `src/components/PropertyRecommendationPopup.tsx`

**Outer container:**
- Replace dark gradient `from-[#1a1a1a] via-[#0d0d0d] to-[#1a1a1a]` with champagne gradient `from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`
- Keep `border-gold/50` and gold shadow

**Header bar:**
- Replace `border-zinc-800` with `border-gold/30`
- Title text from `text-white` to `text-black`
- Close button from `text-zinc-500 hover:text-white` to `text-zinc-400 hover:text-black`

**Context line ("Based on your interest in..."):**
- From `text-zinc-400` to `text-zinc-600`

**Project cards:**
- Background from `bg-zinc-800/60 hover:bg-zinc-700/80` to `bg-white/70 hover:bg-white`
- Border stays gold-based (`border-gold/20 hover:border-gold/50`)
- Project name from `text-white` to `text-black`, hover stays `text-gold`
- Area text from `text-zinc-400` to `text-zinc-500`
- Fallback icon container from `bg-zinc-700` to `bg-gold/10`
- Arrow icon from `text-zinc-600` to `text-zinc-400`

**CTA button:**
- Keep the gold gradient button with black text (already on-brand)

