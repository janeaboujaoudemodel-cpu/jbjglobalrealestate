

# Unify All Header Dropdowns + Fix Positioning + Improve Search

## Three Issues to Fix

### 1. Match All Header Dropdown Colors
The main navigation menus (Buy, Sell, Rent, Projects, Areas, Developers, Insights) use `MegaMenuShell` which has a lighter gradient (`#FDFBF7, #F5F0E6, #EDE4D3`). The Search and Language dropdowns now use the deeper champagne gradient (`#F5EBD7, #E8DCC8, #D4C4A8`). All dropdowns need to use the same deeper champagne gradient.

**File: `src/components/header/mega-menu-primitives.tsx` (line 36)**
- Change the `MegaMenuShell` background from `linear-gradient(135deg, #FDFBF7, #F5F0E6, #EDE4D3)` to `linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)`

### 2. Fix Search and Language Dropdown Position
The Search and Language panels are positioned with `top: calc(100% + 12px)` which creates a visible gap below the header border. They should start right at the header border.

**File: `src/components/GlobalHeader.tsx` (line 1501)**
- Change `top: 'calc(100% + 12px)'` to `top: 'calc(100% + 4px)'` for the utility panel container (Search, Language, Account)
- Adjust the bridge zone height accordingly to maintain hover stability

### 3. Improve Search to Find Projects by Developer Name
When searching "Emaar", only the developer record shows up. The project search only checks `projects.name`, not `developer_name`. So Emaar's projects (Selvara, Rivana, Sunrise Bay, etc.) don't appear because "Emaar" isn't in their project name.

**File: `src/components/GlobalSearchModal.tsx` (lines 139-152)**
- Expand the projects query to also search by `developer_name` using an OR filter: `.or(`name.ilike.%query%,developer_name.ilike.%query%`)`
- This means searching "Emaar" will show Emaar the developer AND all Emaar projects

## Technical Details

| File | Line(s) | Change |
|------|---------|--------|
| `src/components/header/mega-menu-primitives.tsx` | 36 | Update gradient to `#F5EBD7, #E8DCC8, #D4C4A8` |
| `src/components/GlobalHeader.tsx` | 1501 | Change `calc(100% + 12px)` to `calc(100% + 4px)` |
| `src/components/GlobalSearchModal.tsx` | 145 | Add `.or()` filter to include `developer_name` in project search |

