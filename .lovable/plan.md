

## Plan: Multi-Issue Fix — Data Accuracy, Dashboard Layout, Project Cards, Header UX

This plan addresses 8 distinct issues reported. Given the scope, this will be split across multiple files.

---

### Issue 1: Fake Service Charge Data

**Root Cause**: Two projects have `114-143 AED/sqft` service charges — clearly incorrect (UAE range is 2-80 AED/sqft max). The `HouseDetailsSection` displays whatever is in the DB without validation.

**Fix**:
- **`src/components/project-detail/HouseDetailsSection.tsx`**: Add a validation function that parses the numeric portion of `serviceCharge` and suppresses display if the value exceeds 80 AED/sqft (the ultra-luxury ceiling — Four Seasons DIFC is 70-80).
- **Database cleanup**: Run a migration to NULL out the two offending records (`Sunrise Haven`, `Marriott Residences by Dar Global`).

---

### Issue 2: Published Property Count (1456 vs 1800+)

**Finding**: The database currently has **1,456 published** and **795 unpublished** (total 2,251). The count of 1,400 is accurate — the "missing" ~400 projects are in the unpublished/draft bucket. No rendering bug. The user needs to review the 795 unpublished projects in the Listing Admin to determine which should be republished.

**Action**: No code fix needed — this is a data state issue. Will note this in the response.

---

### Issue 3: My Dashboard Layout — Tasks Position & Alignment

**Current layout** (`MyDashboard.tsx`):
- Row 1: Profile+Badges+AccountSettings | Notifications+QuickActions+Activity  
- Row 2: Tasks | Explore & Learn  
- Row 3: Favorites | Shortlists

**Requested layout**: Tasks should come right after Account Settings (before Quick Actions).

**Fix in `MyDashboard.tsx`**:
- Move `MyTasksCard` into the left column, directly after `AccountSettingsCard`
- Move `UsefulLinksCard` ("Explore & Learn") to a full-width section below, displayed as a horizontal scroll strip (like homepage) with an "Explore All Books" button, or 2x2 grid
- Keep Favorites and Shortlists side-by-side with equal height using `min-h` matching

---

### Issue 4: Project Card — Always Show Logo, Badges, Status

**Current behavior** (`ProjectCard.tsx` lines 188-199): Favorite and ShortlistBadge buttons have `opacity-0 group-hover:opacity-100` — they're hidden until hover.

**Fix in `ProjectCard.tsx`**:
- Remove `opacity-0 group-hover:opacity-100` from FavoriteButton and ShortlistBadgeButton wrappers (lines 190, 195)
- Make developer logo always visible (remove any hover-hide logic)
- Move sale status badge to **bottom-left** (`bottom-3 left-3`) instead of top-left under logo
- Remove `group-hover:opacity-0` from the sale status badge (line 280)
- Ensure monogram (developer logo) stays visible on hover — currently it does, but the sale status badge disappears — fix that
- For tooltip/hover on favorite/shortlist: change tooltip styling to white text on gold background instead of black

---

### Issue 5: Horizontal Header — Account Icon → Mode Selector, Settings Separation

**Current** (`HorizontalUtilityBar.tsx` lines 324-351): Both "Account" and "Settings" link to `/profile`.

**Fix**:
- **Account icon** (User icon): Change to open a mode selector dropdown (Investor, Broker, Developer, Investor+Broker) — similar to how `DisplayModeIconToggle` works but as a popover/dropdown
- **Settings icon** (gear): Keep linking to `/profile` for account settings — this is correct

---

### Issue 6: "Trending" and "Back" Buttons Between Inbox and Dashboard

**Finding**: Looking at the horizontal bar code, there are no "trending" or "back" buttons in `HorizontalUtilityBar.tsx`. These might be coming from the `DisplayModeIconToggle` component (which shows investor/broker mode selector icons) that the user doesn't recognize. 

**Fix**: Investigate `DisplayModeIconToggle` to ensure it has clear labels/tooltips. If it renders unfamiliar icons, add proper tooltips explaining their purpose.

---

### Issue 7: Advanced Filter → Opens Filter Panel Instead of Navigating

**Current** (`HorizontalUtilityBar.tsx` line 213): `<Link to="/properties?advanced=true">` — navigates away.

**Fix**: Replace the Link with a button that opens a filter modal/drawer in-place. Create an `AdvancedFilterModal` component that contains the same filter controls (area, price, bedrooms, property type, developer, handover) and on apply, navigates to `/properties` with the selected query params.

---

### Issue 8: Dashboard Shortcuts — Add All Missing Items

**Current** (`QuickActions.tsx`): Only shows 6 actions for owner role. Missing: Listing Admin, Admin Panel, Owner Command Center, Customer Happiness Center, CV Center, CRM, and more.

**Fix in `QuickActions.tsx`**: Expand `ownerActions` array to include all owner-accessible tools:
- Listing Admin → `/owner/listing-admin`
- Admin Panel → `/owner/admin`
- Owner Command Center → `/owner`
- Customer Happiness Center → `/ticket-hub`
- CV Center → `/owner/cv-center`
- CRM Dashboard → `/owner/crm`
- Analytics → `/owner/analytics`
- Marketing Hub → `/owner/marketing-hub`
- AI Assistant → `/owner/founder-assistant`
- Studio → `/owner/studio`
- Calendar → `/owner/crm/calendar`
- Team Chat → `/owner/team-chat`

Display in a scrollable grid (3-4 columns) to fit all items.

---

### Files to Edit

| File | Changes |
|------|---------|
| `src/components/project-detail/HouseDetailsSection.tsx` | Validate service charge values, suppress if > 80 AED/sqft |
| `src/components/ProjectCard.tsx` | Always show favorite/shortlist/logo/status badges; fix z-index and tooltip colors |
| `src/pages/MyDashboard.tsx` | Reorder layout: Tasks after AccountSettings, books as strip, align favorites=shortlist |
| `src/components/navigation/HorizontalUtilityBar.tsx` | Account icon → mode dropdown; Advanced Filter → modal; verify mystery buttons |
| `src/components/dashboard/QuickActions.tsx` | Expand owner shortcuts to include all admin/CRM/tools |
| Database migration | NULL out 2 projects with fake 114-143 AED/sqft service charges |

### Database Migration

```sql
UPDATE projects SET service_charge = NULL WHERE service_charge LIKE '%114-143%';
```

