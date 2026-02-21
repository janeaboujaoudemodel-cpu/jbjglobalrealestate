

# Owner Command Center -- Full Premium Champagne Gold UI Overhaul

This plan converts the entire Owner Command Center from its current dark zinc/black theme to the platform's premium **Champagne Gold** standard -- white/champagne backgrounds, gold borders, black text -- matching the listing portal style.

---

## Scope of Changes

### 1. Shell Layout (`OwnerDashboardShell.tsx`)
- **Sidebar**: Change from `bg-zinc-950` dark gradient to champagne linen gradient (`from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`) with gold borders
- **Top Header Bar**: Convert from dark `bg-zinc-950` to white/champagne with gold bottom border
- **Title text**: "Owner Command Center" becomes black text on light background
- **Owner Badge**: Keep gold accent but on champagne background
- **Bottom actions** (Return to Site, Sign Out): Dark text on champagne, gold hover states
- **Sidebar border**: Change from `border-zinc-800` to `border-gold/30`

### 2. Sidebar Navigation (`OwnerSidebarNav.tsx`)
- **Section labels**: Change from `text-zinc-500` to `text-gold` uppercase labels
- **Nav items (inactive)**: Change from `text-zinc-400 hover:bg-zinc-800` to `text-zinc-700 hover:bg-gold/10 hover:text-black`
- **Nav items (active)**: Keep `bg-gold/10 text-gold border-gold/20` (already correct)
- **Scrollbar**: Apply `jj-scrollbar-gold` class

### 3. Overview Page (`OwnerDashboardOverview.tsx`)
- **KPI Cards**: Convert from `bg-zinc-900 border-zinc-800` to `bg-white/80 border-2 border-gold/30` with black text values
- **KPI values**: Change from `text-white` to `text-black`
- **KPI labels**: Change from `text-zinc-400` to `text-zinc-600`
- **KPI icon containers**: Keep gold gradient styling (already correct)
- **Tab bar**: Convert from `bg-zinc-900 border-zinc-800` to `bg-white/80 border border-gold/30`
- **Tab triggers**: Already using `tab-trigger-champagne` class (keep as-is)
- **All Card containers** (Newest Leads, Follow-up, Conversations, All Leads, Flagged, VIP, Employees, Audit): Convert from `bg-zinc-900/80 border-zinc-800` to `bg-white/70 border-2 border-gold/30`
- **Card titles**: Change from `text-white` to `text-black`
- **Card descriptions**: Change from `text-zinc-400` to `text-zinc-500`
- **LeadRow component**: Convert from `bg-zinc-800/50 hover:bg-zinc-800` to `bg-[#FDFBF7] hover:bg-gold/5 border-gold/20`
- **ConversationRow**: Same champagne treatment
- **FollowUpItem**: Same champagne treatment
- **Empty states**: Change icon colors from `text-zinc-600` to `text-gold/40`, text from `text-zinc-500` to `text-zinc-600`
- **Header accent bar**: Keep gold gradient bar (already correct)
- **Welcome text**: Change from `text-zinc-400` to `text-zinc-600`
- **Page title**: Change from `text-white` to `text-black`

### 4. Quick Actions Grid (`QuickActionsGrid.tsx`)
- **Container**: Convert from `bg-zinc-900/80 border-zinc-800` to `bg-white/70 border-2 border-gold/30`
- **Title**: Change from `text-white` to `text-black`
- **Action buttons**: Convert from `bg-zinc-800/50 border-zinc-700` to `bg-[#FDFBF7] border-gold/20 hover:border-gold/50 hover:bg-gold/10`
- **Action labels**: Change from `text-zinc-400` to `text-zinc-600`

### 5. Department Shortcuts (`DepartmentShortcuts.tsx`)
- **Container**: Convert from `bg-zinc-900/80 border-zinc-800` to `bg-white/70 border-2 border-gold/30`
- **Title**: Change from `text-white` to `text-black`
- **Shortcut buttons**: Convert from `bg-zinc-800/50 border-zinc-700` to `bg-[#FDFBF7] border-gold/20`
- **Icon containers**: Change from `bg-zinc-700/50` to `bg-gold/10`
- **Labels**: Change from `text-white` to `text-black`, descriptions from `text-zinc-500` to `text-zinc-600`

### 6. Integration Widgets (`IntegrationWidgets.tsx`)
- **Containers**: Convert from `bg-zinc-900/80 border-zinc-800` to `bg-white/70 border-2 border-gold/30`
- **Titles**: Change from `text-white` to `text-black`
- **Event rows**: Convert from `bg-zinc-800/50` to `bg-[#FDFBF7]`
- **Quick action buttons**: Convert border colors from `border-zinc-700` to `border-gold/30`
- **Automations status row**: Convert from `bg-zinc-800/50` to `bg-[#FDFBF7]`

### 7. Main Page Background
- Change `OwnerDashboardShell.tsx` outer `div` from `bg-black` to `bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`
- Change main content area background accordingly

### 8. Missing Routes & Features to Add
Several sidebar nav items currently point to pages that may not exist or may be placeholder. Verify and ensure these are properly wired:
- `/owner/toolkit` -- AI Tools Hub (currently renders `RoyalToolsHub`, confirmed in routes)
- `/owner/automations` -- Workflow Automation (confirmed)
- `/owner/studio` -- Studio (confirmed)
- `/owner/kanban` -- Kanban Board (confirmed)
- `/owner/email-client` -- Email Client (confirmed)
- `/owner/team-chat` -- Team Chat (confirmed)
- `/owner/map` -- Property Map (confirmed)

All routes are already registered. No missing routes.

---

## Files Modified

| File | Changes |
|------|---------|
| `src/pages/OwnerDashboardShell.tsx` | Shell background, sidebar, header -- full champagne conversion |
| `src/pages/OwnerDashboardOverview.tsx` | All cards, KPIs, tabs, rows, empty states -- champagne gold |
| `src/components/owner-dashboard/OwnerSidebarNav.tsx` | Nav item colors, section labels |
| `src/components/owner-dashboard/QuickActionsGrid.tsx` | Container and button colors |
| `src/components/owner-dashboard/DepartmentShortcuts.tsx` | Container and card colors |
| `src/components/owner-dashboard/IntegrationWidgets.tsx` | Container and row colors |

No new files needed. No database changes. This is a pure UI theme conversion across 6 files.

