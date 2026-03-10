

## Plan: Listing Portal Rename, Mobile Header Upgrade, Navigation Polish, Stamp Generator Fixes, Edge-to-Edge Audit, Analytics Daily Charts, and MY ACCOUNT Icon Colors

This plan covers ~10 areas across navigation, stamp tool, analytics, and global layout fixes.

---

### 1. Rename "Listing Portal" → "List Your Property" in Vertical Nav

**File: `GlobalVerticalNav.tsx`**
- Line 58: Change `{ label: "Listing Portal", ...}` → `{ label: "List Your Property", ...}`
- Line 66: Change `{ label: "List Property", ...}` → `{ label: "List for Sale / Rent", ...}`
- Add tooltip/description via a `title` attribute: "List your property for sale or rent on our portal"
- In `MEGA_MENU_LINKS.sell` (line 139): Change `'Listing Portal'` → `'List Your Property for Sale / Rent'`
- In `MEGA_MENU_LINKS.creative` (line 248): Already says "E-Sign" — no change needed
- In mobile menu (`GlobalHeader.tsx` line 723-724): Change "Listing Portal" → "List Your Property"
- Also update `mobileSellLinks` (line 397) and `mobilePartnerLinks` (line 459)

### 2. Mobile Header — Mirror Desktop Vertical Nav Logic

The desktop uses `GlobalVerticalNav` with accordion sections + mega menus. The mobile uses `GlobalHeader` with a separate set of collapsible sections. User wants them identical.

**Changes in `GlobalHeader.tsx`:**
- The mobile menu already mirrors the desktop sections (Properties, Tools, Insights, Services, Company, My Account, Legal). The structure is the same.
- Add **Guides** section (currently missing from mobile — desktop has a GUIDES section)
- Add the same highlighted hubs at the top: AI Tools Hub, List Your Property, Careers & Join, Resale Properties (partially done at lines 720-732 but missing AI Tools Hub label)
- Add section header borders matching desktop: each `CollapsibleTrigger` gets `border border-transparent hover:border-gold/20` like the desktop section headers
- Add the gold tree-line border-l-2 to sub-items (already present)

### 3. "Careers & Join" → Separate "Clear" Button

User says "the clear section, just make it clear. Don't make it on the join." This likely refers to the Careers/Join highlight in the vertical nav being too prominent or merged. 

**Changes in `GlobalVerticalNav.tsx`:**
- Keep "Careers & Join" as a highlight item but make it visually distinct from property-related items
- If user means a "Clear filters" button somewhere, clarify — but based on context, the instruction is to make "Careers & Join" clearly separated from the property listing items in the sidebar

### 4. MY ACCOUNT Section — Gold Icons, Black Text

**File: `GlobalVerticalNav.tsx`**
- Lines 602-605: The `getItemStyle` for MY ACCOUNT already does gold borders. But `getIconStyle` (line 624) returns `text-black/60` for inactive items.
- Change line 624: inactive MY ACCOUNT icons from `text-black/60` → `text-gold` (all icons gold, text stays black)
- This means: `return shouldHighlight ? 'text-gold' : 'text-gold';` — icons always gold in MY ACCOUNT

### 5. Section Header Borders — All Sections Get Gold Borders

**File: `GlobalVerticalNav.tsx`**
- Line 933: Each section header button already has `border` class with `border-gold/40` when highlighted and `border-transparent hover:border-gold/20` when not.
- Verify this is working consistently for ALL sections. The code at line 933 does apply this. ✓ Already done.

### 6. Stamp Generator — Layout Fixes

**Files: `src/components/stamp-generator/StampExportPage.tsx`, related stamp components**
- Fix: Content overflowing outside circle in luxury bank style designs
- Fix: Clicking a design should auto-reflect in live preview (not just on "Select" click)
- Fix: When clicking "Select", layout hiding under vertical header — add proper `left` offset accounting for sidebar width
- Fix: Zoom and expand not working in live preview
- Fix: Stamp on business card positioned too high / layout broken at bottom
- Fix: Standard colors section — add premium color swatches (ombré selections, 3-color picker), keep ink color as default standard
- These require reading the stamp generator editor components in detail

### 7. Edge-to-Edge Audit — Pages with Black Borders

Pages still using `mx-3 md:mx-4 lg:mx-6` with borders (from search results):
- `MyDashboardProgress.tsx` (line 93)
- `e-signature/SignatureStudio.tsx` (line 27)
- `e-signature/ESignatureDashboard.tsx` (line 165)
- `e-signature/CreateEnvelope.tsx` (line 467)
- `e-signature/ContractReview.tsx` (line 68)

**Fix for all:** Change `mx-3 md:mx-4 lg:mx-6 mb-6 mt-0 rounded-b-2xl rounded-t-none border border-t-0 border-border` → `mx-0 mb-0 mt-0 rounded-none border-0` to match MyDashboard and UserProfile standards.

### 8. Quick Actions — Equal Aligned Cards

**File: `QuickActions.tsx`**
- Currently uses `grid grid-cols-1 sm:grid-cols-2 gap-3` with flexible height buttons
- Add `h-[72px]` or similar fixed height to each button to ensure equal sizing
- Ensure all cards are the same dimensions regardless of text length

### 9. Analytics Dashboard — Daily Visitor Chart + More Data

**File: `JBJAnalyticsDashboard.tsx`**
- Currently shows aggregated stats but no daily chart
- Add a "Daily Visitors" line/bar chart using Recharts (already installed)
- Query `visitor_events` or `user_activity_sessions` grouped by date
- Add columns: Country, Device, Time Spent, Pages Viewed
- Add a "Visitors" tab alongside "Tool Usage" and "Issue Reports"
- Show daily visitor count trend with a BarChart + area overlay

### 10. AI Home Finder Internal UI Suggestion

**File: `Quiz.tsx`**
- Currently a multi-step quiz with question cards. User wants suggestions for premium UI internally.
- Upgrade the quiz step UI: add progress bar with gold gradient, premium card styling with champagne gradients, animated transitions between steps
- Add a "Results Preview" sidebar showing selected preferences as the user fills out the quiz
- This is a visual upgrade only — no content changes

---

### Files to Edit

| File | Changes |
|------|---------|
| `src/components/navigation/GlobalVerticalNav.tsx` | Rename Listing Portal, MY ACCOUNT gold icons |
| `src/components/GlobalHeader.tsx` | Rename Listing Portal in mobile, add Guides section, section borders |
| `src/components/dashboard/QuickActions.tsx` | Fixed height cards for alignment |
| `src/pages/MyDashboardProgress.tsx` | Edge-to-edge layout |
| `src/pages/e-signature/SignatureStudio.tsx` | Edge-to-edge layout |
| `src/pages/e-signature/ESignatureDashboard.tsx` | Edge-to-edge layout |
| `src/pages/e-signature/CreateEnvelope.tsx` | Edge-to-edge layout |
| `src/pages/e-signature/ContractReview.tsx` | Edge-to-edge layout |
| `src/pages/JBJAnalyticsDashboard.tsx` | Add daily visitors chart with Recharts |
| `src/pages/Quiz.tsx` | Premium UI upgrade for quiz steps |
| `src/components/stamp-generator/StampExportPage.tsx` | Layout fixes for sidebar offset, preview auto-update |
| Stamp generator editor components | Fix zoom, expand, business card positioning |

