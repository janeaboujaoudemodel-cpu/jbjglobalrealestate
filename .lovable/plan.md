

## Plan: Fix Filter Overlay, My Account Scroll, Sidebar Borders, Shortcuts Panel, News Tabs & Missing Images

### Issue 1: News Category Filter Overlays Vertical Sidebar

**Root cause:** The sticky category filter bar on `/news` (line 310) uses `sticky top-16 z-20`. The vertical sidebar is `z-[9997]` but the filter bar renders on top of it because it's within the main content area that overlaps the sidebar's left edge.

**Fix in `src/pages/News.tsx` line 310:**
- Change `sticky top-16` to `sticky top-[40px]` (to account for the 40px horizontal utility bar)
- Add `ml-0` to ensure content doesn't bleed under the sidebar

### Issue 2: My Account Section Doesn't Auto-Scroll When Clicked

**Root cause:** In `GlobalVerticalNav.tsx` line 571-585, `toggleSection()` opens the accordion and navigates to the first item's route. But the accordion content expands below the visible scroll area, so users can't see the items without manual scrolling.

**Fix in `GlobalVerticalNav.tsx` `toggleSection()`:**
- After opening a section, use `setTimeout` + `scrollIntoView` on the section's DOM element to scroll it into view within the sidebar's `nav` scroll container.

### Issue 3: All Sub-Items Need Full Borders (Not Just MY ACCOUNT)

**Root cause:** In `getItemStyle()` line 644, default items use `border border-transparent hover:border-gold/15`. The user wants **visible** `border border-gold/20` on ALL items at all times (not just on hover), matching the MY ACCOUNT section style.

**Fix in `getItemStyle()` line 644:**
- Change `border border-transparent hover:border-gold/15` to `border border-gold/20 hover:border-gold/30`

### Issue 4: My Shortcuts Panel Content Cropped / Not Readable

**Root cause:** The shortcuts flyout (line 680) uses `max-h-[85vh]` but the inner `overflow-y-auto` container doesn't get enough height because the panel's top margin (`mt-4`) plus the horizontal bar (40px) reduces usable space. Also the `top: 0` doesn't account for the utility bar.

**Fix in `GlobalVerticalNav.tsx` shortcuts mega menu:**
- Change `style={{ left: sidebarWidth, top: 0, bottom: 0, right: 0 }}` to `top: '40px'`
- Change `max-h-[85vh]` to `max-h-[calc(100vh-60px)]`
- Ensure the inner scroll container gets proper `max-h` inheritance

### Issue 5: My Shortcuts Not Clickable on Mobile

**Root cause:** The shortcuts mega menu only renders in the desktop sidebar. The mobile `GlobalHeader.tsx` menu doesn't have the shortcuts panel.

**Fix in `GlobalHeader.tsx`:**
- Add a "My Shortcuts" expandable section in the mobile menu that mirrors the `SHORTCUT_GROUPS` data, listing all shortcut links as tappable items.

### Issue 6: Tools Section — Show All Tools Listed

The TOOLS section in the sidebar only has "Royal Tools Hub" (line 75). When clicked, it opens the `creative` mega menu. Need to verify all tools are accessible. The AI Tools mega menu (`ai-tools`) is separate and triggered from the highlighted AI Tools Hub item.

**Fix:** No missing tools — the mega menus already list all tools. The issue is the same as Issue 4 (content cropped in flyout). The `max-h` fix will resolve this.

### Issue 7: News Category Tabs Broken/Cropped

**Root cause:** The horizontal scroll container for category filter buttons (line 313) uses `overflow-x-auto scrollbar-hide` with `flex gap-2`. On narrow viewports (especially with sidebar), buttons get cut off.

**Fix in `src/pages/News.tsx`:**
- Add `flex-nowrap` to prevent wrapping
- Ensure buttons maintain `whitespace-nowrap` (already present)
- Add padding-right to the scroll container so the last button isn't clipped: `pr-4`

### Issue 8: News Articles Missing Photos — Re-fetch from Sources

**Root cause:** Some `market_news` rows have NULL `image_url` or broken URLs. The existing `fix-broken-news-images` edge function already handles re-fetching OG images from source URLs.

**Fix:**
- Invoke the existing `fix-broken-news-images` edge function to audit and repair broken/missing images
- Add a "Fix Images" admin button on the News page (or trigger automatically)
- For articles where no OG image can be found, keep the existing gradient placeholder (no stock/fake photos per brand rules)

### Issue 9: Horizontal Header Parity Across Devices

The horizontal utility bar is `hidden lg:flex` (line 91 of `HorizontalUtilityBar.tsx`). On mobile/tablet, it doesn't show.

**Fix in `HorizontalUtilityBar.tsx`:**
- Show a condensed version on tablet (md breakpoint): key icons only (Search, Buy, Rent, Sell, Account) without labels
- On mobile (<md), the `GlobalHeader.tsx` already handles navigation — add the shortcuts section there

### Files to Edit

| File | Changes |
|------|---------|
| `src/pages/News.tsx` | Fix sticky top offset for category filter, add `flex-nowrap pr-4`, trigger image fix |
| `src/components/navigation/GlobalVerticalNav.tsx` | Auto-scroll on section open, visible borders on all items, fix shortcuts panel height/top offset |
| `src/components/GlobalHeader.tsx` | Add My Shortcuts section to mobile menu |
| `src/components/navigation/HorizontalUtilityBar.tsx` | Show condensed bar on md+ (not just lg+) |

