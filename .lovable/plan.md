

## Plan: AI Home Finder Premium UI, Error Boundary Fix, Navigation Arrows, Dashboard Quick Actions, Profile/Dashboard Borders, Chat Widget Auto-Minimize, Mobile Header, Visitor Tracking, Filter Bar Overlap, and Refresh Persistence

This plan addresses ~12 distinct issues raised. I'll group them by area.

---

### 1. AI Home Finder — Premium Champagne/Gold UI (Index.tsx)

The current AI Home Finder section (lines 329-392) uses a purple theme with `bg-purple-500/15`, `text-purple-400`, `border-purple-400/30`, etc.

**Changes:**
- Replace all purple ambient glows with champagne/gold equivalents (`bg-gold/8`, `bg-gold/5`)
- Replace card border from `border-purple-400/30` to `border-gold/30`
- Replace box-shadow purple glows with gold glows
- Replace badge from `bg-purple-500/15 border-purple-400/25 text-purple-400` to `bg-gold/15 border-gold/30 text-gold`
- Replace Sparkles icon color from `text-purple-400` to `text-gold`
- Replace gradient text from purple to gold: `from-gold via-[#E8DCC8] to-gold`
- Replace icon circle from purple to gold gradient
- Replace "Completely Free" icon background from black to champagne gold if present
- Grid pattern lines: change from purple to gold

### 2. DisplayModeIconToggle Explanation & Tooltips (HorizontalUtilityBar.tsx)

The TrendingUp and Briefcase icons are the "Investor Mode" and "Broker Mode" toggles. The user doesn't understand them.

**Changes in DisplayModeToggle.tsx:**
- Add better `title` attributes: "Switch to Investor View — See investment-focused content" and "Switch to Broker View — See broker tools and commissions"
- In `HorizontalUtilityBar.tsx`, wrap the `DisplayModeIconToggle` in a `Tooltip` with descriptive text: "User Mode: Switch between Investor and Broker views to customize your experience"

### 3. "We're Getting Things Ready" Error Boundary (AppErrorBoundary.tsx)

This screen appears when chunk loading fails. The error boundary auto-retries 2x then shows the fallback.

**Changes:**
- Increase retry count from 2 to 3
- Add longer delay between retries (2500ms instead of 1500ms)
- Before showing the error screen, add a final attempt using `import()` to pre-load the failed chunk
- Show a loading spinner for 5 seconds before showing the error message, giving lazy chunks more time to load
- This reduces false positives from slow networks

### 4. Navigation Arrows — Simplify to Scroll Only (PageNavigation.tsx + MainLayoutWrapper.tsx)

User wants: Remove the floating nav arrows completely. Keep only one arrow to scroll up (when scrolled down) and one to scroll down (when at top). Move them above the chat support. Add a back button on every page instead.

**Changes in PageNavigation.tsx:**
- Remove the "Go Back" button from the floating nav
- Keep only scroll-to-top and scroll-to-bottom (mutually exclusive — show up arrow when scrolled down, down arrow when at top)
- Position above the chat widget: change `bottom-20` to `bottom-24` to sit above chat
- Reduce to single arrow visible at a time

**Back button:** Each page should have its own inline back button (already present on most pages). No global floating back button.

### 5. Dashboard Quick Actions — Horizontal Layout (QuickActions.tsx)

Currently uses `grid grid-cols-2 sm:grid-cols-3` with vertical card layout. User wants horizontal cards, 2 per row.

**Changes:**
- Change grid to `grid grid-cols-1 sm:grid-cols-2 gap-3`
- Change card layout from `flex-col` to `flex-row items-center` — icon on left, text on right
- Remove description stacking, put label and description side by side
- Increase card width to fill the row properly

### 6. Dashboard & Profile — Remove Black Borders (MyDashboard.tsx, UserProfile.tsx)

**MyDashboard.tsx (line 278):** Uses `mx-3 md:mx-4 lg:mx-6 my-3 rounded-2xl border border-border` which creates black gap on sides.
- Change to `mx-0 my-0 rounded-none border-0` to stretch edge-to-edge, removing black borders

**UserProfile.tsx (line 456):** Uses `mx-3 md:mx-4 lg:mx-6 mb-6 mt-0 rounded-b-2xl rounded-t-none border border-t-0 border-border`
- Change to `mx-0 mb-0 mt-0 rounded-none border-0` — full stretch, no black borders
- Also remove the `h-[84px]` black header bar (line 448) per the dashboard standard — integrate title into champagne container

### 7. Chat Widget — Always Minimized on Mobile, Auto-Minimize on Desktop (MainLayout.tsx, AIChatWidget.tsx)

**Changes in MainLayout.tsx:**
- On mobile (`isMobile`), force `isChatCollapsed = true` always on mount
- On desktop, add a timer: after 8 seconds of the chat being open, auto-minimize it by calling `setIsChatCollapsed(true)`
- Label the collapsed button as "JBJ Support"

**Changes in AIChatWidget.tsx / CollapsedChatButton:**
- Update collapsed button text to show "JBJ Support" instead of generic icon

### 8. Mobile Header — Monogram & Hamburger Fix (GlobalHeader.tsx)

User reports: monogram not at extreme left edge, wordmark touching hamburger, hamburger cropped on some devices.

**Changes:**
- Ensure monogram has `ml-0` or `ml-1` (extreme left)
- Add `shrink-0` to hamburger icon container to prevent cropping
- Add `overflow-hidden` and `text-ellipsis` on company wordmark to prevent it from pushing into hamburger
- Add `min-w-0 flex-1` on the wordmark container so it shrinks before touching the hamburger
- Use `gap-2` between elements instead of fixed spacing

### 9. Filter Bar Overlap on Project Page (PropertiesReelly.tsx)

Line 273: The sticky filter bar uses `left-0 lg:left-[200px]` but doesn't account for horizontal utility bar height.

**Changes:**
- Change `top-0` to `top-[40px]` to sit below the horizontal utility bar on desktop
- Use the body class approach: `[body.jj-vertical-nav-active_&]:left-[200px] [body.jj-vertical-nav-collapsed_&]:left-[48px]` instead of hardcoded `lg:left-[200px]`

### 10. Visitor Tracking — Complete Wiring (useVisitorTracking.ts)

The hook already tracks device type, browser, OS, session, page views, time spent, events. But the user says it's not properly wired.

**Changes:**
- Ensure `useVisitorTracking()` is called in `MainLayout.tsx` (currently uses `useActivityTracker` — need to also call `useVisitorTracking`)
- Add `screen_resolution`, `viewport_size`, `language` to the session data
- Add `navigator.connection?.effectiveType` for network speed if available
- Track `time_on_page` per page (not just session total) — fire on route change with duration

### 11. Page Refresh — Stay on Same Page

React Router + SPA already preserves the URL on refresh. The "We're getting things ready" screen is the real culprit — when chunk loading fails, it reloads to `/` sometimes.

**Changes in AppErrorBoundary.tsx:**
- In `handleReload`, use `window.location.reload()` instead of `window.location.assign(url)` with `_retry` param — this preserves the exact current URL
- Remove the "Go Home" as default action — make "Refresh" the primary and only auto-action

### 12. Previous Incomplete Tasks Audit

From prior plans that may not be fully done:
- **Vertical nav utility bar removal:** Verify `VerticalNavUtilityBar` is fully removed
- **Monogram/wordmark enlargement:** Verify sizes in GlobalVerticalNav
- **Support buttons equalization:** Verify in GlobalVerticalNav

---

### Files to Edit

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | AI Home Finder section — purple → gold/champagne |
| `src/components/filters/DisplayModeToggle.tsx` | Better tooltips for mode icons |
| `src/components/navigation/HorizontalUtilityBar.tsx` | Wrap mode toggle in tooltip |
| `src/components/AppErrorBoundary.tsx` | Increase retries, use reload() instead of assign() |
| `src/components/PageNavigation.tsx` | Simplify to single scroll arrow, remove back button |
| `src/components/dashboard/QuickActions.tsx` | Horizontal 2-col layout |
| `src/pages/MyDashboard.tsx` | Remove mx/border for edge-to-edge |
| `src/pages/UserProfile.tsx` | Remove mx/border, merge header into champagne |
| `src/components/MainLayout.tsx` | Wire useVisitorTracking, auto-minimize chat |
| `src/components/AIChatWidget.tsx` | "JBJ Support" label on collapsed |
| `src/components/GlobalHeader.tsx` | Fix monogram/hamburger spacing |
| `src/pages/PropertiesReelly.tsx` | Fix filter bar top offset and left position |
| `src/hooks/useVisitorTracking.ts` | Add screen resolution, per-page time tracking |

