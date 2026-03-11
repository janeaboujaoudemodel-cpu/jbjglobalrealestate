

## Plan: Enrich Mode Descriptions & Upgrade Header Icon Visibility

### Part 1: Richer Mode Descriptions (`src/components/ModeSwitcher.tsx`)

Update `MODE_CONFIG` descriptions to be more informative and premium:

- **Investor**: "Browse properties, access ROI tools, upload listings, explore guides & market insights"
- **Broker**: "CRM dashboard, education hub, sell properties, upload listings, coordinate with clients & close deals"  
- **Investor + Broker**: "Full access to investor tools, broker dashboard, CRM, listings, guides & market intelligence"
- **Developer**: "Submit projects, upload terraces & documents, manage launches, marketing materials & event calendar"

Also widen the dropdown from `w-56` to `w-72` so the longer descriptions breathe properly.

### Part 2: Premium Visible Header Icons (`src/components/navigation/HorizontalUtilityBar.tsx`)

Currently most icons use `text-gold/70` or `text-gold/60` — they're faded and hard to see. The ModeSwitcher stands out because it has a visible colored background pill.

**Fix**: Give each icon button a subtle bordered pill style matching the ModeSwitcher's premium feel:
- Change icon buttons (Favorites, Tasks, Notifications, Inbox, Dashboard, Settings, Advanced Filter) from bare `hover:bg-gold/10` to `border border-gold/20 bg-gold/5 hover:bg-gold/15 hover:border-gold/40`
- Bump icon colors from `text-gold/70` → `text-gold` for full visibility
- Add `h-7 px-1.5` consistent sizing with subtle gold borders

This gives all icons the same breathable, premium pill treatment as the sidebar toggle and mode switcher.

### Files

| File | Changes |
|------|---------|
| `src/components/ModeSwitcher.tsx` | Richer descriptions, wider dropdown |
| `src/components/navigation/HorizontalUtilityBar.tsx` | Upgrade all icon buttons to bordered gold pills with full-opacity icons |

