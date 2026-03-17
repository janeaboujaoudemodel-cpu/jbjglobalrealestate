

## SESSION — Rebuild Developer Hub to Premium Platform Standard

### Problems Identified

1. **Shell (`DeveloperHubShell.tsx`)**: White/light `bg-gradient-to-br from-background via-muted to-muted/50` — disconnected from the dark premium brown palette used across public pages.
2. **Sidebar**: Starts at `top-0`, overlaps the 48px global horizontal nav. Uses light `from-background via-muted` gradient — no premium feel.
3. **Header**: `sticky top-[48px]` uses `bg-card/80` (white translucent) — should use the champagne header gradient matching other platform pages.
4. **Overview page**: Only 4 cards. Missing: Projects Submitted, Projects Pending, Notifications. No developer identity/company name display. Title hidden behind header overlap.
5. **Sidebar footer**: "Return to Site" and "Sign Out" use `bg-background` — visually indistinguishable from nav area.
6. **Card styling**: Uneven — numbers and badges have no consistent height/alignment. No gold accents.

### Plan — 3 Files Modified

#### File 1: `src/pages/developer-hub/DeveloperHubShell.tsx`
**Changes:**
- **Page wrapper**: Replace `bg-gradient-to-br from-background via-muted to-muted/50` with the platform dark brown gradient: `bg-gradient-to-br from-[hsl(38,35%,12%)] via-[hsl(36,30%,16%)] to-[hsl(34,25%,12%)]`
- **Sidebar (desktop)**: Change `top-0` to `top-[48px]` and `h-full` to `h-[calc(100vh-48px)]` so it sits below the global nav. Apply dark brown gradient background with gold border.
- **Sidebar header**: Use champagne gradient `bg-gradient-to-r from-[#F5EBD7] to-[#D4C4A8]` with `text-black/80` title text.
- **Sidebar nav area**: Dark background `bg-[hsl(38,35%,12%)]` with gold-tinted text.
- **Sidebar footer section**: Distinct darker background block with `border-t border-gold/30`, rounded-lg inner container, clear visual separation from navigation items.
- **Main header**: Replace `bg-card/80` with champagne gradient `bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]` and `border-gold/30`, matching other platform page headers. Stick at `top-[88px]` (48px global nav + 40px filter bar).
- **Content area**: Keep `max-w-[1800px]` padding, no changes.
- **Mobile Sheet**: Apply same dark brown background to sheet content.

#### File 2: `src/components/developer-hub/DeveloperHubSidebarNav.tsx`
**Changes:**
- **Active item**: Replace `bg-primary/15 text-primary` with `bg-gold/15 text-gold font-semibold border-l-2 border-gold` for a clear premium active state.
- **Inactive items**: `text-[#E8DCC8]/70` (cream on dark) with hover `text-gold hover:bg-gold/10`.
- **Icon sizing**: Ensure all icons are `w-5 h-5` (already correct, confirm no cropping).

#### File 3: `src/pages/developer-hub/DeveloperHubOverview.tsx`
**Changes:**
- **Top section — Developer identity block**: Add queries for `developer_registrations.company_name` and user email. Display:
  - Page title: "Developer Hub" in `text-[#E8DCC8]` (cream)
  - Developer company name from registration (or "Complete Registration")
  - User email
  - Account status badge (from registration status)
- **Cards section — Expand from 4 to 7 cards**:
  1. Company Registration Status (existing)
  2. Projects Submitted — query `projects` where `developer_id` or `developer_name` matches
  3. Projects Pending Approval — subset of above where `is_published = false`
  4. Launch Events (existing)
  5. CRM Contacts (existing)
  6. Agreements (existing)
  7. Notifications — placeholder count (0) pointing to overview
- **Card styling**: Dark card background `bg-[hsl(38,35%,14%)]/80` with `border-gold/20`. Title in `text-[#E8DCC8]/70`, value in `text-gold text-3xl font-bold`. Equal heights via `min-h-[120px]`. Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
- **Responsive grid**: 1 col mobile, 2 col tablet, 3-4 col desktop.

### Database Changes
None. All data already exists in `developer_registrations` (company_name, status) and `projects` (developer_name, developer_id, is_published).

### Route
- `/developer-hub` — Shell + Overview
- All child routes inherit the shell styling

### Testing Steps
1. Navigate to `/developer-hub` — verify dark premium background, no white areas
2. Verify page title and cards are fully visible below header (no cropping)
3. Verify sidebar has gold active state, dark background, separated footer
4. Verify all 7 cards render with aligned heights and gold values
5. Test on mobile (375px) — verify sheet sidebar uses dark theme
6. Test on tablet (768px) — verify 2-column card grid

