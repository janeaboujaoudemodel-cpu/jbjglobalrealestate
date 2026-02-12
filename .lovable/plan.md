

## Fix Plan: Database Restoration, Sidebar Branding, and Data Quality

### Issue 1: Projects Page Must Show ALL Database Projects (Including Those Without Images)

**Problem**: The previous change added `.not('cover_image_url', 'is', null)` to `useProjectsListing`, filtering out 607 projects. The user wants ALL 2,410 projects visible from the database, with or without images.

**Fix in `src/hooks/useProjects.ts`**:
- Remove the `.not('cover_image_url', 'is', null)` filter from `useProjectsListing()` (line 232)
- This restores the full 2,410 project count

**Fix in `src/components/ReellyProjectCard.tsx`**:
- Ensure cards without images show a graceful placeholder instead of breaking

---

### Issue 2: Vertical Sidebar Branding Fixes

**Problem**: Sidebar says "JBJ GLOBAL" instead of "JBJ GLOBAL REAL ESTATE", monogram is too small (w-8 h-8), "Contact Support" is barely readable, no "Raise a support ticket" option, and there's a useless small monogram at the bottom.

**Fix in `src/components/navigation/PropertiesVerticalNav.tsx`**:
- Change text from "JBJ GLOBAL" to "JBJ GLOBAL REAL ESTATE" (split across two lines for fit)
- Increase monogram size from `w-8 h-8` to `w-12 h-12`
- Make "Contact Support" more visible (larger text, bolder, gold color)
- Add "Raise a Support Ticket" link below it
- Remove the small monogram image at the bottom
- Add more navigation shortcuts (e.g., Favorites, Compare, AI Hub, Mortgage Calculator)

---

### Issue 3: Content Overlapping the Left Sidebar

**Problem**: The "Ready to Get Started" CTA section and other content extends under/touches the fixed left sidebar.

**Fix in `src/pages/PropertiesReelly.tsx`**:
- Ensure all sections (including footer-adjacent sections like CTABand) respect the sidebar offset when the sidebar is visible
- The main content wrapper should have `ml-[200px]` when the sidebar is active (filter fixed state)

---

### Issue 4: Sobha Seahaven "by Unknown" -- Fix Bad Data

**Problem**: Sobha Seahaven has `developer_name: "Unknown"` and no `developer_id`. The developer "Sobha Realty" exists in the developers table. This is a data issue in the database, not a code issue.

**Fix via SQL migration**:
- Update the `developer_name` for Sobha Seahaven to "Sobha Realty"
- Link the `developer_id` to the Sobha Realty developer record
- This is the only project with "Unknown" developer (confirmed: count = 1)

---

### Issue 5: Missing Price, Handover, Payment Plan on Many Listings

**Problem**: 612 projects have no `price_from`, 1,710 have no `payment_plan`/`payment_breakdown`, and some have no handover dates. These are data gaps from the Reelly API -- many projects genuinely don't have this data published yet.

**Fix in UI (code)**:
- Already handled: cards show "Price TBA", detail page shows "TBA" for missing fields
- No code change needed -- the data simply doesn't exist in the API source

**Fix for Sobha Seahaven specifically** (SQL):
- This specific project has rich data on Reelly that wasn't synced. A targeted data fix via SQL update will set its price, handover, and payment plan correctly.

---

### Summary of Changes

| File/Target | Change |
|-------------|--------|
| `src/hooks/useProjects.ts` | Remove `cover_image_url IS NOT NULL` filter from `useProjectsListing` |
| `src/components/navigation/PropertiesVerticalNav.tsx` | Fix branding text to "JBJ GLOBAL REAL ESTATE", bigger monogram, visible Contact Support, add Raise Support Ticket, remove bottom monogram, add more nav shortcuts |
| `src/pages/PropertiesReelly.tsx` | Ensure content sections don't overlap sidebar |
| SQL migration | Fix Sobha Seahaven: set correct developer_name and developer_id |

