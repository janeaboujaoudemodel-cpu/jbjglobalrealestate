

## Fix: UX Issues — Header Scroll, Spacing, Sidebar, Chat Shortcuts, AI Home Finder

This is a large multi-file fix covering 10 distinct issues. Here's the plan organized by file.

---

### 1. Header Horizontal Scroll Bug + Navigation Arrows (`src/components/navigation/HorizontalUtilityBar.tsx`)

**Problem:** Row 1 (`overflow-x: auto`, line 224) allows swipe gestures that trigger browser back navigation on macOS/trackpad.

**Fix:**
- Add `overscroll-behavior-x: contain` to the Row 1 scroll container — this CSS property prevents horizontal scroll from chaining to the browser's back/forward gesture.
- Add `touch-action: pan-x` to isolate touch scrolling.
- Add left/right gold arrow buttons at the edges of Row 1, visible only when overflow exists. Use a small component inline with `useRef` + scroll detection (same pattern as `PremiumHorizontalScrollHint`). Arrows: `ChevronLeft`/`ChevronRight` (already imported), gold styled, 28px circles, positioned at edges.

### 2. Header Visual Structure — Row Divider (line 502-504)
- Add a thin gold divider (`h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent`) between Row 1 and Row 2 to visually separate navigation from filters.

### 3. Header Item Alignment (line 224)
- Increase horizontal padding on Row 1: `px-2 sm:px-4 xl:px-5` → `px-3 sm:px-5 xl:px-6`.
- Add `gap-0.5` to the inner rail divs for consistent micro-spacing.

### 4. Chat Shortcuts Panel — Top Offset (`src/components/AIChatWidget.tsx`)

**Problem:** The chat panel starts at `top-24 sm:top-28 lg:top-32` (line 831) but the header is 88px fixed. On desktop `top-32` = 128px, which is correct. But the shortcuts content may be clipped.

**Fix:** Change to `top-[88px]` to exactly match header height across all breakpoints. Adjust height to `h-[calc(100dvh-88px)]`.

### 5. Chat Shortcuts — Owner Mode Items (`src/components/chat/ChatShortcuts.tsx`)

Add these items to `OWNER_SHORTCUTS` array:
- Dashboard → `/owner` (LayoutDashboard icon)
- Listings Manager → `/owner/listing-admin` (ClipboardList)
- CV Center → `/owner/cv-center` (FileUser — import needed)
- Inbox / Messages → `/owner/inbox` (Inbox)
- Applications → `/owner/applications` (FileText)
- Property Management → `/owner/property-management` (Building2)
- AI Tools Hub → `/toolkit` (Sparkles)

Remove duplicates with existing entries. Update the panel max-width from `w-full sm:w-[380px]` to `sm:w-[420px]` in AIChatWidget for slightly wider layout.

### 6. Sidebar Divider Above Contact/Support (`src/components/navigation/GlobalVerticalNav.tsx`)

**Current (line 1225):** `via-gold/35` — still too subtle.

**Fix:** Match the top sidebar divider style. Change to:
```
h-[1px] my-2 bg-gradient-to-r from-gold/10 via-gold/50 to-gold/10
```
Also apply same treatment to collapsed sidebar divider (line 1320): increase from `via-gold/20` to `via-gold/50`.

### 7. Sidebar Bottom Section — Rounded Borders (line 1226)
- Add `rounded-xl overflow-hidden` to the bottom container (`div.px-2.5.py-2`) to prevent visual clipping at the bottom.

### 8. Company Profile Text Readability (`src/pages/CompanyProfile.tsx`)
- Search for dark-background sections with low-contrast text. Increase text colors from `text-white/60` or similar to `text-gold-light/90` or `text-[#E8DCC8]` for readability on the dark luxury brown backgrounds.

### 9. AI Home Finder — Hover Polish (`src/pages/Index.tsx`)
- Already has `whileHover` on the motion.div. Enhance the card `div` (line 438) with `transition-all duration-300` and `hover:shadow-[0_0_80px_hsl(var(--gold)_/_0.3)]` for a subtle glow on hover.
- Add a one-time subtle scale pulse on first viewport entry via the existing `motion.div` — add `initial` scale 0.97 → animate to 1.0.

### 10. No Changes To
- Layout structure, section order, brand colors, sidebar width, header height (88px)

### Files Modified
1. `src/components/navigation/HorizontalUtilityBar.tsx` — scroll bug fix, arrows, divider, padding
2. `src/components/AIChatWidget.tsx` — panel top offset, wider width
3. `src/components/chat/ChatShortcuts.tsx` — owner shortcut items
4. `src/components/navigation/GlobalVerticalNav.tsx` — divider strength, rounded bottom
5. `src/pages/CompanyProfile.tsx` — text contrast
6. `src/pages/Index.tsx` — hover glow polish

