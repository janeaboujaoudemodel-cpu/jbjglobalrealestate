

# Complete Task List and Fix Plan

Below is every task extracted from your message, organized by priority.

---

## Task 1: Marketing Hub -- Complete Overhaul with AI Tools
**Current state:** The Marketing Hub (`/admin/marketing-hub`) only has campaigns, templates, and subscribers tabs. It lacks AI tools, email suggest reply, AI assistant, and admin shortcuts.

**Fix:**
- Add a sidebar navigation on the left with shortcuts to all AI tools and admin sections
- Add right-side quick action shortcuts
- Integrate AI Email Generator directly into the hub (already exists as a component but not embedded)
- Add AI Suggest Reply, AI Assistant, Email Client, Social Media, and all platform tools as accessible tabs/links
- Make it a full-featured intelligent command center with campaign analytics, AI content generation, subscriber management, and quick-access links to all admin tools

**Files:** `src/pages/admin/MarketingHub.tsx`, possibly new sidebar component

---

## Task 2: Search Icon Dropdown Behavior in Header
**Current state:** The search icon (line ~1426 in GlobalHeader.tsx) opens `GlobalSearchModal` on hover via `onMouseEnter`, which overlays on top of the header. It does NOT close when the cursor moves away.

**Fix:**
- Change the search icon to open a dropdown panel (same behavior as the language dropdown -- appears below the nav bar, not as a modal overlay)
- Keep the same search UI/color/buttons -- only change the opening/closing behavior
- Add `onMouseLeave` to close the dropdown when cursor moves away (matching language dropdown behavior)
- Remove the `GlobalSearchModal` overlay approach for the desktop header search icon

**Files:** `src/components/GlobalHeader.tsx`

---

## Task 3: My Dashboard -- Fix Cards, Content Overflow, and Layout
**Current state:** Dashboard cards use `border-border` and content can overflow card boundaries. Favorites and Shortlist link to `/project/{id}` which may show "No project found."

**Fix:**
- Add `overflow-hidden` and `word-break: break-word` to all dashboard cards
- Fix card borders to use `border-gold/40` per the premium standard
- Ensure all text stays within card boundaries on all devices
- Fix grid alignment for responsive breakpoints

**Files:** `src/pages/MyDashboard.tsx`, `src/components/dashboard/FavoritesCard.tsx`, `src/components/dashboard/ShortlistCard.tsx`, and other dashboard card components

---

## Task 4: Favorites and Shortlist -- Fix Routing to Project Details
**Current state:** `FavoritesCard.tsx` links to `/project/{project.id}` (UUID). The project detail page likely expects a slug, not an ID.

**Fix:**
- Fetch the `slug` field alongside `id, name, location` in the favorites query
- Change link from `/project/${project.id}` to `/project/${project.slug}`
- Apply the same fix to `ShortlistCard.tsx`
- This applies to ALL listing links across the platform -- verify all project links use slugs

**Files:** `src/components/dashboard/FavoritesCard.tsx`, `src/components/dashboard/ShortlistCard.tsx`

---

## Task 5: Area Page -- Auto-Sync Project Counts
**Current state:** Area cards show `property_count` from the `areas` table, but this number is static and not auto-updated when projects are added.

**Fix:**
- Create a database function or query that counts actual published projects per area in real-time
- Update the area cards to show the live count rather than the static `property_count` column
- Alternatively, create a trigger that updates `areas.property_count` whenever a project is added/removed

**Files:** `src/pages/AreaGuides.tsx`, `src/hooks/useAreas.ts`, database migration

---

## Task 6: Emirates -- Fix Duplicates, Add Umm Al Quwain, Ensure 7 Only
**Current state:** Database has duplicate emirates: "Abu Dhabi" + "Abu Dhabi Emirate", "Ajman" + "Ajman Emirate", "Sharjah" + "Sharjah Emirate", and "Ras Al Khaimah" + "Ras al-Khaimah". Total shows 10 instead of 7.

**Fix:**
- Database migration to normalize all emirate names to the standard 7: Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain
- Update all variants ("Abu Dhabi Emirate" to "Abu Dhabi", "Ras al-Khaimah" to "Ras Al Khaimah", etc.)
- Add Fujairah if missing
- Add Umm Al Quwain to the filter and search bar (already exists in DB with 2 areas)

**Files:** Database migration, `src/pages/AreaGuides.tsx`

---

## Task 7: Area Cards -- Full Fit, No Gaps at Bottom
**Current state:** Area cards have variable height content sections causing gaps at the bottom (especially JVC, Arjan, Abu Dhabi areas).

**Fix:**
- Make all area cards use `h-full` with `flex flex-col` and `flex-1` on the content section
- Ensure the content section fills all remaining space so cards are equal height with no empty borders
- The card already has `flex flex-col h-full` but `min-h-[130px]` on content may not stretch enough

**Files:** `src/pages/AreaGuides.tsx` (lines 284-391)

---

## Task 8: Area Cards -- Use Community/Master Plan Photos, Not Project Photos
**Current state:** Area cards use `area.image_url` which may contain individual project photos instead of master plan/community photos.

**Fix:**
- Use `area.hero_image_url` as primary (typically master plan), fall back to `area.image_url`
- For areas with project-level photos, prioritize `hero_image_url` which should contain community-level imagery
- This follows the existing memory rule about area-level imagery

**Files:** `src/pages/AreaGuides.tsx`

---

## Task 9: Homepage "Handpicked For You" -- Add Description and "More" Button
**Current state:** Featured listing cards show project name, price, and basic details but no description text.

**Fix:**
- Add 2-3 lines of project description below the project name on each card
- Add an orange "More" button (same color as handover date) that expands/navigates to full details
- Style the description in black text

**Files:** Homepage featured listings component

---

## Task 10: Listing Cards -- Fix Handover Date, Price, Developer Name Styling
**Current state:** Handover dates wrap to 2 lines. Price and developer name are small.

**Fix:**
- Handover date: Force single line with `whitespace-nowrap`, increase font size
- Price: Style in gold color
- Developer name ("by Damac"): Make larger/more prominent
- Project name: Gold color
- Description: Black color
- Apply to ALL listing cards platform-wide

**Files:** Project card components

---

## Task 11: Missing Prices on Cards (Palm Jebel Ali, Binghatti Vintage)
**Current state:** Some projects don't show prices on the external card.

**Fix:**
- Check if `starting_price` is populated for these projects in the database
- If missing, add the correct prices via database update
- Ensure the card always shows price when available

**Files:** Database update, card component

---

## Task 12: Auto-Enrich Listings from Provident
**Current state:** The enrichment pipeline exists but requires manual triggering from Listing Admin.

**Fix:**
- This was addressed in the previous plan with Force Re-fetch. The backend functions work but need manual activation from the Listing Admin panel.
- No additional automated sync is being proposed here as it would require significant infrastructure changes.

---

## Task 13: "Find Your Starting Point" Section -- Premium Mobile Layout
**Current state:** The section layout on mobile is not visually comfortable.

**Fix:**
- Redesign the mobile view with premium card layout, proper spacing, and gold accents
- Ensure proper padding and visual hierarchy on small screens

**Files:** The component rendering "Find Your Starting Point" section on homepage

---

## Task 14: Footer -- Add Currency, Language, and Search Shortcuts
**Current state:** Footer doesn't have quick-access currency/language/search controls.

**Fix:**
- Add a utility row in the footer with currency switcher, language switcher, and search shortcut
- Use square/compact styling consistent with the footer design

**Files:** Footer component

---

## Task 15: Homepage AI Property Comparison -- Verify ROI and Price Data
**Current state:** The comparison section shows example ROI and price data that may be inaccurate.

**Fix:**
- Cross-reference the displayed data (Emaar, Sobha, DAMAC examples) with actual project data from the database
- Update static comparison values to reflect real or realistic market data
- If data comes from static arrays, update them with verified numbers

**Files:** AI Property Comparison component on homepage

---

## Task 16: Market Intelligence Book -- Dynamic Data and Premium Design
**Current state:** Per memory, the book should already auto-sync from DLD data and market_news.

**Fix:**
- Verify the book generation pulls latest DLD stats, top developers, trending areas, supply/demand data
- Add company branding (logo, email, phone, website) on every page
- Add a disclaimer modal before download: "I understand and agree not to steal, reproduce, or redistribute this content. All content is internationally registered intellectual property."
- Premium visuals with area photos, charts, insights

**Files:** `src/pages/MarketReport.tsx`, market report generation logic

---

## Task 17: "Access Denied" and "useLanguage must be used within a LanguageProvider" Error
**Current state:** The `AppErrorBoundary` catches the error but the error itself shouldn't happen. The error message "useLanguage must be used within a LanguageProvider" means a component using `useLanguage()` is rendering outside the `<LanguageProvider>` tree.

**Fix:**
- Check `AppErrorBoundary` -- it renders outside `LanguageProvider` in the component tree (line 319 of App.tsx: `<AppErrorBoundary>` wraps everything including `<LanguageProvider>`)
- When the error boundary catches an error, its fallback UI renders OUTSIDE `LanguageProvider`, so if any component in the fallback tries to use `useLanguage()`, it crashes
- Fix: Ensure the error boundary fallback UI does NOT use any context-dependent hooks
- Also investigate what triggers the initial crash (likely the Listing Admin access check or a race condition)
- Improve the error boundary UI to match the premium black/gold standard

**Files:** `src/components/AppErrorBoundary.tsx`, `src/App.tsx`

---

## Task 18: Listing Admin -- Access Denied Issue
**Current state:** The user reports getting kicked out and seeing "Access Denied" on the listing admin screen.

**Fix:**
- The `ListingAdminGuard` already waits for both `authLoading` and `ownerLoading`
- Check if session token is expiring or if the owner verification is failing intermittently
- Add better error recovery -- if the check fails due to a network error, retry instead of denying access

**Files:** `src/components/ListingAdminGuard.tsx`

---

## Implementation Priority (grouped into phases)

**Phase 1 -- Critical Fixes (errors and broken functionality):**
- Task 17: Fix LanguageProvider error boundary crash
- Task 18: Fix Listing Admin access denied
- Task 4: Fix favorites/shortlist routing
- Task 6: Fix emirates duplicates (database migration)

**Phase 2 -- UI/Layout Fixes:**
- Task 2: Search icon dropdown behavior
- Task 3: Dashboard cards overflow
- Task 7: Area cards full fit
- Task 10: Listing card styling (handover, price, developer)
- Task 13: Mobile "Find Your Starting Point"

**Phase 3 -- Feature Enhancements:**
- Task 1: Marketing Hub overhaul with AI tools
- Task 5: Auto-sync project counts
- Task 8: Area community photos
- Task 9: Handpicked description + More button
- Task 14: Footer utility controls
- Task 16: Market Report book enhancements

**Phase 4 -- Data Fixes:**
- Task 11: Missing prices
- Task 15: Verify comparison data
- Task 12: Provident enrichment

---

## Technical Notes

- **Database migration needed** for Task 6 (emirate normalization): `UPDATE areas SET emirate = 'Abu Dhabi' WHERE emirate = 'Abu Dhabi Emirate'; UPDATE areas SET emirate = 'Sharjah' WHERE emirate = 'Sharjah Emirate'; UPDATE areas SET emirate = 'Ajman' WHERE emirate = 'Ajman Emirate'; UPDATE areas SET emirate = 'Ras Al Khaimah' WHERE emirate = 'Ras al-Khaimah';`
- **No edge function changes needed** for most tasks -- these are primarily UI fixes
- **AppErrorBoundary** uses inline styles (no Tailwind) because it renders outside the normal component tree -- this is correct and should stay this way, but the UI can be improved with better inline styles
- The Marketing Hub overhaul (Task 1) is the largest single task and will require creating a new sidebar navigation component with links to all 52+ AI tools

