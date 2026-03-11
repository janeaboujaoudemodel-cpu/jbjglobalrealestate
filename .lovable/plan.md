

## Plan: Fix Sidebar Cropping, Section Auto-Scroll, Icons to Gold, Chat Widget Sizing, Mobile Scroll & Wordmark Styling

### Issue 1: Sidebar Sections Cropped (FAQ Hub not visible, Company/Services items hidden)

**Root cause:** The collapsible section animation uses `max-h-[500px]` (line 989). For sections with many items (GUIDES has 10 items), 500px is insufficient. Also, `toggleSection` scrolls the section header into view but doesn't scroll it to the **top** of the nav — so expanded items below remain hidden.

**Fix in `GlobalVerticalNav.tsx`:**
- Line 989: Change `max-h-[500px]` to `max-h-[2000px]` to ensure all items are visible when expanded
- Line 586-589: Change `scrollIntoView({ block: 'nearest' })` to `block: 'start'` so the clicked section scrolls to the top of the nav viewport, making all sub-items visible below it

### Issue 2: Clicking Services/Company/Legal Should Expand AND Show Items (Not Navigate Away)

**Root cause:** `toggleSection` (line 580-584) navigates to the first item's route when opening. This causes a page navigation which can be disorienting. The user wants the section to simply expand and show items in place.

**Fix in `GlobalVerticalNav.tsx` line 580-584:**
- Remove the `navigate(firstItem.href)` call — clicking a section header should only expand/collapse, not navigate
- Keep the mega menu opening if applicable

### Issue 3: All Sub-Item Icons Should Be Gold (Not Black)

**Root cause:** `getIconStyle` (line 662) returns `text-black/60` for non-highlighted, non-active items.

**Fix in `GlobalVerticalNav.tsx` line 662:**
- Change `return shouldHighlight ? "text-gold" : "text-black/60"` to `return "text-gold"`

### Issue 4: Gold Scrollbar Always Visible in Sidebar

Already using `jj-scrollbar-always-visible` on the nav (line 904). The scrollbar CSS uses `width: 5px` which may be too thin.

**Fix in `src/index.css`:**
- Increase `.jj-scrollbar-always-visible::-webkit-scrollbar` width from `5px` to `7px`
- Increase thumb opacity from `0.5` to `0.7` so it's more visible

### Issue 5: "REAL ESTATE" Wordmark Color — Change to Nude/Champagne

**Current:** Line 896 uses `text-gold` for "REAL ESTATE"

**Fix in `GlobalVerticalNav.tsx` line 896:**
- Change `text-gold` to `text-[#D4B896]` (a warm nude/champagne tone)

### Issue 6: Chat Widget Too Big on Mobile

**Root cause:** `CollapsedChatButton.tsx` line 87 renders a full expanded button with text on mobile (`max-w-[240px]`). User wants it minimized (icon only) on mobile.

**Fix in `CollapsedChatButton.tsx`:**
- On mobile (`isMobile`), always render the compact circle button (line 117-126), never the expanded text version, regardless of `showAttentionPulse`

### Issue 7: Mobile Scroll Stuck/Blocked

**Root cause:** Multiple `overflow: hidden` rules and `overscroll-contain` can trap scroll on mobile. The main culprit is likely `touch-action` interference or the `overscroll-contain` on the main layout wrapper.

**Fix in `src/index.css`:**
- Add `-webkit-overflow-scrolling: touch` to the body for mobile
- Ensure no `overflow: hidden` on `html` or `body` for vertical scrolling

### Issue 8: Header Padding — Buttons Too Close to Edge

**Root cause:** The logo area in the sidebar (line 889) uses `p-4`. The wordmark text is cramped.

**Fix in `GlobalVerticalNav.tsx` line 889-898:**
- Change `p-4` to `p-4 px-5` for more horizontal breathing room
- Add `gap-3` instead of `gap-2.5` between monogram and text

### Issue 9: Section Header Icons Should Also Be Gold

**Current:** Line 980 shows section icons as black when highlighted, gold otherwise. User wants them always gold.

**Fix in `GlobalVerticalNav.tsx` line 980:**
- Change to always `text-gold`

### Files to Edit

| File | Changes |
|------|---------|
| `src/components/navigation/GlobalVerticalNav.tsx` | Fix max-h, scrollIntoView block:start, remove navigate on section click, gold icons everywhere, wordmark color, header padding |
| `src/components/chat/CollapsedChatButton.tsx` | Force compact circle on mobile regardless of attention pulse |
| `src/index.css` | Scrollbar width/opacity increase, mobile scroll fix |

