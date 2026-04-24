# Plan: Fix Contrast — Cookie Banner, AI Hub Hero, and Global Icon/Text Visibility

## Issues identified (from screenshot `icon-contrast-screenshots/02-ai-hub.png`)

1. **Cookie banner "Manage Preferences" button is faded**
   - File: `src/components/CookiesConsentBanner.tsx` line 139–145
   - Current: `bg-white/80 border-black/20 text-black font-medium` — the 80% white + 20% border on a cream champagne banner reads as washed out next to the solid gold "Accept All" button.

2. **AI Hub hero video background too bright / text faded**
   - File: `src/pages/AIHub.tsx` lines 666–736
   - Video at `opacity=0.4` plus a light gradient overlay (`from-black/70 via-black/60`). The "JBJ Royal Tools Hub" title uses pure white but the subtitle `text-gray-600` (line 726) is invisible on the dark video. The "Free tools • Property analysis…" line is the "faded label" the user is seeing.

3. **Global pattern: black icons / black text landing on dark or tinted backgrounds across the site**
   - The previous CSS floor in `src/index.css` covered `[data-surface]` wrappers but many sections (AI Hub hero, ToolkitShowcaseCard, various CTAs) do not set `data-surface`. Need a second tier of defensive rules and targeted component fixes.

---

## Changes

### 1. `src/components/CookiesConsentBanner.tsx`
- Rewrite the "Manage Preferences" button to a **solid high-contrast secondary**: `bg-black text-white border-2 border-black hover:bg-gray-800`. Makes the pair read as Gold (primary) + Black (secondary) on the cream banner — clearly legible, matches brand CTA standard.
- Swap the `Accept All` button to explicit bg to avoid any brightness issues: keep gold but add `shadow-md` and `text-black`.
- Also bump body copy from `text-black/70` → `text-black/80` for AA compliance on the cream surface.

### 2. `src/pages/AIHub.tsx` (hero section, lines 666–736)
- Strengthen the hero overlay:
  - Replace `from-black/70 via-black/60 to-[#0D0D0D]` with `from-black/85 via-black/75 to-[#0D0D0D]`.
  - Reduce video `opacity` prop from `0.4` → `0.3` so text becomes the focal point, not the footage.
- Fix the faded subtitle line: change `text-gray-600` (line 726) → `text-white/75`. Pure gray-600 is unreadable on a dark video.
- Keep the premium label chip untouched (already high contrast).

### 3. `src/index.css` — broaden the icon/text contrast floor
Add defensive rules that fire even without `data-surface`:

```css
/* Any lucide icon placed inside a bg-black / bg-gray-900 / [style*="#0D0D0D"] must be white */
.bg-black svg.lucide,
.bg-gray-900 svg.lucide,
.bg-neutral-900 svg.lucide,
[class*="bg-[#0"] svg.lucide { color: #FFFFFF !important; opacity: 1 !important; }

/* Any lucide icon placed inside bg-white / bg-gray-50 / bg-card must be >= gray-700 */
.bg-white svg.lucide.text-white,
.bg-gray-50 svg.lucide.text-white,
.bg-card svg.lucide.text-white { color: hsl(0 0% 18%) !important; }

/* Global guard: text-gray-600 / text-gray-500 landing on a dark parent is lifted to white/70 */
[data-surface="dark"] .text-gray-600,
[data-surface="dark"] .text-gray-500,
.bg-black .text-gray-600,
[style*="#0D0D0D"] .text-gray-600 { color: rgba(255,255,255,0.75) !important; }
```

These rules are additive to the existing surface floors and target the specific failure mode the user is seeing (black text on dark video, gray-600 descriptions in hero sections).

### 4. Regenerate verification screenshots
Re-run the audit runner against `/`, `/ai-hub`, `/properties`, `/owner`, `/owner/recommendations`, `/toolkit` and save updated images to `/mnt/documents/icon-contrast-screenshots/`. Confirm:
- Cookie banner shows two solid buttons (gold + black).
- AI Hub hero text and subtitle are fully readable over the darkened video.
- No black-on-black or white-on-white icon instances remain in the captured frames.

---

## Files edited
- `src/components/CookiesConsentBanner.tsx`
- `src/pages/AIHub.tsx`
- `src/index.css`
- `/mnt/documents/icon-contrast-screenshots/*.png` (regenerated)

## Files NOT changed
- `src/components/ModeSwitcher.tsx` — already locked to premium chip/card standard.
- `src/components/Footer.tsx` — already locked to corporate monochrome standard.
- No feature removals (per "No Removal" policy).

Approve to implement.
