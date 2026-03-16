

## Plan: Fix Layout, Mode, Verification & Homepage Issues

### Issues Identified (8 items)

---

### 1. AreaGuides Layout Broken — Content Shifting Right, Duplicated Filter Bar

**Problem**: AreaGuides has `lg:pl-[200px]` on multiple sections (lines 307, 339, 552, 559) which double-pads content since MainLayout already handles sidebar offset. Also has its own inline `FilterShortcutBar` duplicating the GlobalFilterBar.

**Fix** (`src/pages/AreaGuides.tsx`):
- Remove ALL `lg:pl-[200px]` from every section — the global layout already handles this.
- Remove the entire local `FilterShortcutBar` section (lines 284-300) and the spacer div (line 300). The GlobalFilterBar in the header already provides filtering.
- Remove the `pastHero` state and intersection observer since there's no local filter bar to fix.
- Wrap all content sections in proper `max-w-[1600px] mx-auto` containers for consistent centering.

---

### 2. Communities Page — No Proper Header/Title, Wrong Photos

**Problem**: Communities page uses `bg-black` as base with `jj-layer-2` inner wrapper. No hero section, minimal header. Photos come from database `image_url` — the wrong photo for Downtown Dubai is a data issue, but we can improve the page structure.

**Fix** (`src/pages/Communities.tsx`):
- Add a proper hero/header section with title and description matching the AreaGuides premium style.
- Add consistent champagne background to match other pages.

---

### 3. Mode Switcher Dropdown — Touches Right Edge

**Fix** (`src/components/ModeSwitcher.tsx`):
- Change `DropdownMenuContent` `align` from `"center"` to `"end"` and add `className` right margin/padding so it doesn't touch the viewport edge.

---

### 4. User Mode Reset Violation — Mode Changed Without Permission

**Problem**: The `normalizeMode` function defaults to `'investor'` for any unrecognized value. If localStorage gets cleared or the DB sync overwrites with a stale value, the mode silently resets. The code at line 72 (`if (!storedMode || storedSelection !== 'true')`) can overwrite the mode from DB when `storedSelection` isn't set.

**Fix** (`src/contexts/UserModeContext.tsx`):
- NEVER overwrite a stored mode with the DB value if `storedMode` is already set — regardless of `storedSelection` flag.
- Only adopt DB mode if `storedMode` is literally `null` (first visit / cleared storage).
- Add a console warning when mode would be changed, for debugging.

---

### 5. DeveloperPortalCTA Shown to Non-Developer Users

**Problem**: `DeveloperPortalCTA` shows for `isDeveloperMode || isOwner`. When mode is investor, `isDeveloperMode` is false BUT `isOwner` is true, so owner still sees developer-specific actions in investor mode.

**Fix** (`src/components/home/DeveloperPortalCTA.tsx`):
- Only show when `isDeveloperMode` is true. Remove the `isOwner` fallback — owner can switch to developer mode to see this.

---

### 6. IntroHeroSection Hidden Under Header

**Problem**: The section renders at the top but the fixed headers (utility bar + filter bar = ~88px) cover it.

**Fix** (`src/components/home/IntroHeroSection.tsx`):
- Add `pt-[88px] md:pt-[96px]` to the section to push content below the fixed headers.
- Upgrade visual quality: add champagne gold gradient matching header/sidebar, improve card styling with edge-to-edge sharp borders per visual standards.

---

### 7. VerificationBanner — Not Premium Enough + Console Error

**Problem**: Console shows "Function components cannot be given refs" from AnimatePresence in VerificationModal. Banner design needs to match platform premium aesthetic.

**Fix** (`src/components/verification/VerificationModal.tsx`):
- Wrap `motion.div` steps properly — the issue is AnimatePresence trying to pass refs to function components. Use `forwardRef` or remove AnimatePresence.

**Fix** (`src/components/verification/VerificationBanner.tsx`):
- Upgrade to champagne gold gradient matching the header/sidebar palette instead of dark zinc.

---

### 8. Verification System — Add AI-Based Liveness Detection Steps

**Problem**: User wants multi-step face verification (blink detection, head movement) not just photo upload.

**Fix** (`src/components/verification/VerificationModal.tsx`):
- Add a "liveness check" step between selfie upload and submission:
  - Step: Webcam capture with instructions ("Blink slowly", "Turn head left", "Turn head right")
  - Use `navigator.mediaDevices.getUserMedia` for webcam access
  - Capture 3 frames at prompted moments as proof-of-liveness
  - Upload liveness frames alongside ID and selfie
- Add ID back photo step (front + back of ID)

---

### Files to Edit
1. `src/pages/AreaGuides.tsx` — remove duplicate filter bar, remove `lg:pl-[200px]`, fix layout
2. `src/pages/Communities.tsx` — add proper hero header, fix styling
3. `src/components/ModeSwitcher.tsx` — fix dropdown right edge padding
4. `src/contexts/UserModeContext.tsx` — prevent unauthorized mode overwrite
5. `src/components/home/DeveloperPortalCTA.tsx` — only show for developer mode
6. `src/components/home/IntroHeroSection.tsx` — fix hidden under header, upgrade premium design
7. `src/components/verification/VerificationBanner.tsx` — premium champagne styling
8. `src/components/verification/VerificationModal.tsx` — fix console error, add liveness detection steps

