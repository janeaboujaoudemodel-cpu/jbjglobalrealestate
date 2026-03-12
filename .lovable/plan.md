

## Deep Audit & Fix Plan — Navigation, Filters, Shortcuts, Mode Consistency, Property Evaluator, Broker Verification, and More

This plan addresses every issue raised, organized into actionable groups.

---

### 1. My Shortcuts — Add All Missing Items

**Current state**: The `SHORTCUT_GROUPS` array in `GlobalVerticalNav.tsx` (lines 569-641) has 6 groups with limited items. The mobile header (GlobalHeader.tsx lines 731-748) only has 4 shortcuts.

**Fix**: Expand `SHORTCUT_GROUPS` to include all owner/admin tools that the user previously requested:
- **My Tasks** group: Add Calendar, Activity Log
- **CRM** group: Add Leads Inbox, CRM Notes, CRM Reminders, CRM Calendar, Employees
- **Owner Command Center** group: Add Team Chat, Studio, Documents, Employee Hub, HR Dashboard, Agenda, Creative Suite
- **AI & Tools** group: Add all AI pages (Description Writer, Email Generator, Property Analyzer, ROI Calculator, Social Media, Translation Hub, etc.)
- **Dashboards** group: Add Owner Dashboard, Investor Dashboard, JBJ Analytics, HR Dashboard
- **Account** group: Add Shortlist, Compare, Email Preferences
- Add new **Productivity** group: Spreadsheet, Presentations, QR Generator, Documents, Meeting Center, Video Meeting, Whiteboard, Mind Map
- Add new **Creative & Marketing** group: Video Builder, Business Card, Logo Maker, Stamp Generator, Image Resize, Background AI
- Add new **Listings** group: Submit Listing, My Listings, Listing Admin, Property Evaluator, Rental Index

Also update mobile header `GlobalHeader.tsx` My Shortcuts section to include the most critical shortcuts (8-10 items instead of 4).

**Files**: `src/components/navigation/GlobalVerticalNav.tsx`, `src/components/GlobalHeader.tsx`

---

### 2. Project Count — Fix `is_published` Filter to Include Newly Approved Projects

**Current state**: `useProjectsListing()` queries `is_published = true`. The `AdvancedFilterPanel` count query also filters `is_published = true`. If the user approved ~650 pending listings but those records don't have `is_published = true`, they won't appear.

**Fix**: 
- Run a database query to check how many projects have `is_published = true` vs `false`/`null` to diagnose the gap
- If the listing admin approval flow doesn't set `is_published = true`, fix the approval logic so newly approved projects become published
- Ensure `AdvancedFilterPanel` count accurately reflects all published projects (no 1000-row limit — already using `head: true` with `count: 'exact'`, which is correct)

**Files**: `src/hooks/useProjects.ts` (verify pagination), listing admin approval logic

---

### 3. Favorite Button Not Working on Offline/Non-UUID Projects

**Current state**: `FavoriteButton.tsx` line 10 checks `isUUID(projectId)`. For Reelly numeric IDs, it falls through to guest mode — which should work. The issue may be that the `onClick` handler isn't properly wired or the button styles aren't showing feedback.

**Fix**: Debug the FavoriteButton for non-UUID IDs, ensure `toggleGuestFavorite` fires correctly and the toast/UI updates. Add a visual pulse animation on click for immediate feedback.

**Files**: `src/components/FavoriteButton.tsx`, `src/hooks/useGuestFavorites.ts`

---

### 4. Horizontal Header Search — Fix Right-Side Cropping

**Current state**: `HorizontalUtilityBar.tsx` line 112 uses `overflow-x-auto overflow-y-hidden` with `px-4 lg:px-5`. When too many items are present, the right edge gets cramped.

**Fix**: Add `pr-6` padding-right to prevent content from touching the edge. Ensure the search modal trigger doesn't get clipped.

**Files**: `src/components/navigation/HorizontalUtilityBar.tsx`

---

### 5. Fixed Filter Bar — Prevent Duplication, Merge Into 2 Rows

**Current state**: On the Properties page, when the user scrolls, `isFilterFixed` triggers a portal copy of the filter bar (line 1139). This creates duplicated elements (Favorites, Filter, Currency, Mode) that already exist in the HorizontalUtilityBar.

**Fix**:
- When `isFilterFixed` is true, the fixed bar should ONLY show the property-specific filter row (FilterShortcutBar) — NOT duplicate the search/mode/favorites/currency already in HorizontalUtilityBar
- The fixed bar should render below the HorizontalUtilityBar (top offset = 48px)
- Add `backdrop-blur-md` to the fixed filter bar background
- Ensure content doesn't slide under the fixed bar (proper spacer div)
- Remove the duplicated mode/currency/favorites elements from the portal

**Files**: `src/pages/Properties.tsx` (lines 1138-1206)

---

### 6. Mode Dropdown Consistency — Match First Row Style in Second Row

**Current state**: The FilterShortcutBar has its own mode display (green "Developer" text) that differs from the HorizontalUtilityBar's `ModeSwitcher` component (amber/orange for Developer). The dropdown styles also differ.

**Fix**:
- In FilterShortcutBar, use the same `ModeSwitcher` component or replicate its exact dropdown with the 4 color-coded categories (Investor=emerald, Broker=blue, Dual=purple, Developer=amber)
- Ensure the mode label format is consistent: "Mode: Developer" everywhere
- Remove the separate mode display from the FilterShortcutBar when it's shown in the fixed position (since HorizontalUtilityBar already shows mode)

**Files**: `src/components/filters/FilterShortcutBar.tsx`, `src/components/ModeSwitcher.tsx`

---

### 7. Areas Dropdown Hidden Under Fixed Filter

**Current state**: When clicking "Areas" in the filter, the dropdown appears behind the fixed filter bar due to z-index conflicts.

**Fix**: Ensure all Radix `SelectContent` / `PopoverContent` components within the fixed filter use `z-[10050]` or higher to sit above the fixed bar (`z-[9998]`).

**Files**: `src/pages/Properties.tsx`, `src/components/filters/FilterShortcutBar.tsx`

---

### 8. Vertical Sidebar Scroll — Fix Cropped Items and Expand-in-Place

**Current state**: When clicking "Submit Listing" or "My Listings" in a collapsed sidebar section, the view scrolls down instead of expanding in place. Items at the bottom get cropped.

**Fix**:
- Change the section expand behavior to use CSS `max-height` animation without auto-scrolling
- When a section expands, DO NOT scroll the sidebar — keep the section header pinned and expand content below it
- Ensure the scrollable nav area (`overflow-y-auto`) allows full content visibility
- Auto-scroll to bring the active section into view ONLY if it's completely off-screen

**Files**: `src/components/navigation/GlobalVerticalNav.tsx`

---

### 9. Broker Verification — Full Flow Implementation

**Current state**: `ListingPortalMyListings.tsx` has a basic RERA number field. No ID upload, photo upload, face verification, or verification badge system exists.

**Fix**:
- Create/update `broker_verifications` table to include: `id_document_url`, `rera_photo_url`, `rera_number`, `company_name`, `full_name`, `face_photo_url`, `verification_status` (pending/approved/rejected), `is_anonymous`
- Build a multi-step verification form: Step 1 (ID upload + RERA photo + RERA number), Step 2 (company name + full name), Step 3 (face photo capture), Step 4 (confirmation + anonymous option)
- On approval: send email notification, add blue tick badge to broker profile, add to verified brokers gallery
- Gallery page shows only photo + first name (no email/phone unless they pay to advertise)
- Wire backend to store documents in storage bucket

**Files**: New component `src/components/broker/BrokerVerificationFlow.tsx`, update `src/pages/JBJAcademy.tsx`, database migration for `broker_verifications` table updates

---

### 10. Property Evaluator — Premium Blue Theme & Model Upgrade

**Current state**: Dark zinc/black theme with `bg-zinc-900`, `border-zinc-800`, white text on dark backgrounds. Some text is unreadable (white on light areas).

**Fix**:
- Retheme entire page to premium blue: `bg-blue-50/white` cards with `border-blue-200`, `shadow-sm`
- Change dark text to `text-gray-800` / `text-gray-600` for readability
- All dropdowns: blue-premium style (`bg-white border-blue-300`)
- Specifications card: blue accent (`border-blue-300 bg-blue-50`)
- Property photos section: blue matching
- Property Condition & Modifications section: blue theme
- AI Disclaimer section: clean blue/white
- Fix all white text → black/gray text
- Connect evaluation to edge function that uses Lovable AI (Gemini) for market analysis instead of relying on DLD API
- Ensure form data is saved to database
- Wire the owner details section to backend

**Files**: `src/pages/PropertyEvaluator.tsx`

---

### 11. Advanced Filters — Add More Options & AI Integration

**Current state**: `AdvancedFilterPanel.tsx` has basic filters. No integration with AI Home Finder or saved filters/favorites.

**Fix**:
- Add "AI Recommendations" button that links to `/quiz` (AI Home Finder) pre-filled with current filter state
- Add "Compare Selected" button for shortlisted projects
- Add link to saved favorites/shortlist within the filter panel
- Add more filter options: ROI estimate range, rental yield range, developer tier, handover year range

**Files**: `src/components/filters/AdvancedFilterPanel.tsx`

---

### 12. SEO & Sitemap Updates

**Fix**: After all changes, update sitemap entries for any new pages (verified brokers gallery if new route is added). Ensure PropertyEvaluator and all new routes have proper `<SEOHead>` components.

**Files**: `src/pages/Sitemap.tsx`, affected page files

---

### Implementation Priority

Due to the massive scope, this will be implemented in batches:
1. **Batch 1** (Critical UX): My Shortcuts (#1), Fixed filter deduplication (#5), Mode consistency (#6), Search cropping (#4), Sidebar scroll (#8)
2. **Batch 2** (Data): Project count fix (#2), Favorite button (#3), Areas z-index (#7)
3. **Batch 3** (Features): Property Evaluator retheme (#10), Advanced filters (#11), Broker verification (#9)
4. **Batch 4** (Polish): SEO (#12)

### Files Changed (Summary)
| File | Changes |
|------|---------|
| `src/components/navigation/GlobalVerticalNav.tsx` | Expand shortcuts, fix sidebar scroll |
| `src/components/GlobalHeader.tsx` | Expand mobile shortcuts |
| `src/components/navigation/HorizontalUtilityBar.tsx` | Fix right padding |
| `src/pages/Properties.tsx` | Fix fixed filter dedup, z-index, merge to 2 rows |
| `src/components/filters/FilterShortcutBar.tsx` | Mode consistency |
| `src/components/FavoriteButton.tsx` | Fix non-UUID clicks |
| `src/pages/PropertyEvaluator.tsx` | Full blue theme rewrite |
| `src/components/filters/AdvancedFilterPanel.tsx` | Add AI links, more options |
| `src/components/broker/BrokerVerificationFlow.tsx` | New file |
| `src/pages/Sitemap.tsx` | SEO updates |
| Database migration | broker_verifications table |

