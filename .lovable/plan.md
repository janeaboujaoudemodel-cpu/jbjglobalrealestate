

## Plan: Fix Market Intelligence Hero, Guides Page Scroll, Shortcuts Role Filtering & Dashboard Layout

### Issue 1: Market Intelligence Hero — No Video & Faded Buttons

**Root cause:** The hero uses a static `<img>` tag (line 116-120) instead of a video. The buttons use `variant="media"` and `variant="secondary"` which blend into the dark background.

**Fix in `src/pages/MarketIntelligence.tsx`:**
- Replace the `<img>` hero background with a `<video>` element (Dubai skyline/aerial video from Pexels, same pattern as Guides page)
- Replace `variant="media"` and `variant="secondary"` buttons with `<PremiumHeroButton>` components for consistent visible styling
- **Founder button:** In `src/components/FounderPhilosophySection.tsx` line 69-76, change the button to use a larger size, bold text, and the nude/champagne gold color (`#D4B896`) matching the "REAL ESTATE" header wordmark

### Issue 2: Guides Library — Main Hub Not Visible on Load

**Root cause:** The hero is full-screen (`jj-hero-fullscreen`), pushing the actual guides grid below the fold. When navigating from sidebar, the user lands at the top of the hero and must scroll past it.

**Fix in `src/pages/Guides.tsx`:**
- After the hero, move the "Explore Guides" section (the book grid at `#guides-library`) higher — reduce the "How This Library Works" section padding
- Add `useEffect` on mount: if navigated from sidebar (no hash), auto-scroll to `#guides-library` after a short delay so users see the guides immediately
- Keep the hero for SEO/branding but ensure guides are visible quickly

### Issue 3: Shortcuts Showing "Broker Dashboard" for Investor Users

**Root cause:** `SHORTCUT_GROUPS` (line 321-393) is static — it shows all groups including "Dashboards" with "Broker Dashboard" regardless of user role. No role filtering.

**Fix in `src/components/navigation/GlobalVerticalNav.tsx`:**
- Import `useUserRole` hook
- Filter `SHORTCUT_GROUPS` based on user role before rendering:
  - **Investor role:** Hide "Broker Dashboard", "CRM", "Owner Command Center" items
  - **Broker role:** Show broker items, hide owner-only items
  - **No role/visitor:** Show only public shortcuts (My Tasks, AI & Tools, Account)
- Replace "Broker Dashboard" with "Investor Dashboard" (`/investor-dashboard`) in the Dashboards group when role is investor

### Issue 4: Dashboard Cards Cropped + Layout — Two Per Row

**Root cause:** `MyDashboard.tsx` uses a 3-column grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`). The "My Tasks" section is full-width below. User wants a 2-column grouping.

**Fix in `src/pages/MyDashboard.tsx`:**
- Change main grid from 3-column to 2-column: `grid-cols-1 lg:grid-cols-2`
- Group 1 (left): Profile + Badges + Account Settings
- Group 2 (right): Notifications + Quick Actions
- Row 2: My Tasks + Activity Overview (side by side, 2-col)
- Row 3: Favorites + Shortlists (already 2-col)
- Remove `xl:grid-cols-3` to prevent 3-col layout
- Ensure all cards have `overflow-visible` or proper `min-h` to prevent cropping

### Issue 5: Market Intelligence Cards Alignment

**Fix in `src/pages/MarketIntelligence.tsx`:**
- Ensure the `MarketOverviewDashboard` and other card sections use consistent grid alignment with equal card heights via `h-full` on all cards

### Files to Edit

| File | Changes |
|------|---------|
| `src/pages/MarketIntelligence.tsx` | Replace img with video, use PremiumHeroButton |
| `src/components/FounderPhilosophySection.tsx` | Larger founder button with champagne gold color |
| `src/pages/Guides.tsx` | Auto-scroll to guides grid on mount |
| `src/components/navigation/GlobalVerticalNav.tsx` | Role-filter SHORTCUT_GROUPS |
| `src/pages/MyDashboard.tsx` | 2-column layout, fix card cropping |

