

## Plan: Premium Hub Labels, Borders, Support Stack, Sign In/Out, My Account Enhancements

### 1. Premium Hub Highlight Styling (AI Tools → Resale)

All 5 highlighted hubs need refined, premium pastel styling with visible but subtle borders. Replace current colors:

| Hub | New Inactive Style |
|-----|-------------------|
| AI Tools Hub | `bg-amber-50/80 text-amber-700 border border-amber-300/30` |
| AI Home Finder | `bg-violet-50/80 text-violet-500 border border-violet-300/25` |
| List Your Property | `bg-sky-50/80 text-sky-500 border border-sky-300/25` |
| Careers | `bg-rose-50/80 text-rose-500 border border-rose-300/25` (distinct from all others) |
| Resale Properties | `bg-emerald-50/80 text-emerald-600 border border-emerald-300/25` |

Active states use the same hue at full saturation with white text. Each hub keeps its border visible but soft.

**File:** `GlobalVerticalNav.tsx` lines 596-633 (`getItemStyle`) and 639-650 (`getIconStyle`)

### 2. Support Buttons — Stack Vertically (One After Other)

Change the `flex items-center gap-1.5` wrapper (line 1013) back to `space-y-1.5` vertical stack. Each button stays full-width.

**File:** `GlobalVerticalNav.tsx` lines 1011-1028

### 3. Add Sign In / Sign Out Button

Add a Sign In or Sign Out button below the support buttons in the bottom pinned section. Use `useAuth` to check session state:
- If signed in: show "Sign Out" button with `LogOut` icon
- If not signed in: show "Sign In" button with `User` icon, linking to `/auth`

**File:** `GlobalVerticalNav.tsx` — import `useAuth`, add button after support section

### 4. MY ACCOUNT — Add Profile & Settings Items

Add two new items to the MY ACCOUNT section in `NAV_ITEMS`:
- `{ label: "My Profile", href: "/profile", icon: User }`
- `{ label: "Settings", href: "/profile?tab=settings", icon: Settings }`

The Settings page already has account deactivation/reactivation functionality via the existing `ProfileSummaryCard` linking to `/profile?tab=settings`.

**File:** `GlobalVerticalNav.tsx` lines 118-123

### 5. Mirror Changes in Mobile Header

Update `GlobalHeader.tsx` mobile menu to match:
- Softer premium hub colors with borders
- Careers uses rose instead of teal
- Support buttons stacked vertically
- Sign in/out button
- My Profile & Settings in account section

### Files to Edit

| File | Changes |
|------|---------|
| `src/components/navigation/GlobalVerticalNav.tsx` | Premium hub colors with borders, vertical support stack, sign in/out, My Profile & Settings in MY ACCOUNT |
| `src/components/GlobalHeader.tsx` | Mirror all changes for mobile |

