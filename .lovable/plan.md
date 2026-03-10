

## Plan: Collapsible Nav Sections, Wider Flyout, Color-Coded Shortcuts & Premium Minimizer

### Problem Summary
1. **Nav sections show everything at once** — Properties, Tools, Insights, Company should be collapsed by default and expand on click (accordion-style) within the sidebar itself
2. **"My Shortcuts" flyout crops labels** — "Owner Comm…" is truncated at 360px width; needs to be wider so all labels are readable
3. **Shortcuts need color-coded categories** — Tasks, CRM, Owner Command Center etc. should each have a distinct color (like the old account dropdown)
4. **Sidebar text is hard to read** — needs better contrast/visibility
5. **Collapse/expand toggle needs premium redesign** — the small circle button should be more visible and luxurious

---

### 1. Convert Nav Sections to Collapsible Accordions

**File**: `GlobalVerticalNav.tsx`

Currently all `NAV_ITEMS` render as a flat list with section headers. Change to:
- Group items by their `section` field into collapsible sections
- Only the section header is visible by default (e.g., "PROPERTIES ▸")
- Clicking the header expands/collapses to show child items
- Use Radix Collapsible or simple state toggle
- Items without a `megaMenu` navigate directly; items with `megaMenu` still open the flyout panel
- The highlighted hub items at the top (Buy Properties, AI Tools Hub, etc.) stay always visible above the accordion sections

**Behavior**: Multiple sections can be open simultaneously. The section containing the active route auto-opens on mount.

---

### 2. Widen "My Shortcuts" Flyout & Show Full Labels

**File**: `GlobalVerticalNav.tsx`

Change the flyout panel width from `w-[360px]` to `w-[440px]` so labels like "Owner Command Center" are fully readable without truncation.

---

### 3. Color-Coded Shortcut Categories

**File**: `GlobalVerticalNav.tsx`

Currently the `shortcuts` mega menu links are a flat list. Group them into colored categories:

| Category | Color | Items |
|----------|-------|-------|
| **My Tasks** | Emerald | My Tasks, Notifications |
| **CRM** | Blue | CRM Dashboard, Customer Happiness |
| **Owner Command Center** | Gold | Owner Command Center, Admin Panel, Listing Admin |
| **AI & Tools** | Purple | AI Tools, AI Calendar, My Assistant, AI History |
| **Dashboards** | Rose | My Dashboard, Broker Dashboard |
| **Account** | Zinc | My Profile, Settings, Favorites, Support Tickets |

Each group gets a colored left border and tinted header label. Render via a special grouped layout when `activeMegaMenu === 'shortcuts'`.

---

### 4. Improve Sidebar Text Visibility

**File**: `GlobalVerticalNav.tsx`

- Increase base text color from `text-black/70` to `text-black/90` for nav items
- Increase section header opacity from `text-gold/60` to `text-gold/80`
- Increase font size from `text-[13px]` to `text-[13.5px]` or `text-sm` (14px)

---

### 5. Premium Collapse/Expand Toggle

**File**: `GlobalVerticalNav.tsx`

Replace the small 24px circle toggle with a more visible design:
- **Expanded state**: A 32px pill-shaped button with a gold gradient background, positioned at the right edge of the sidebar with a subtle shadow and the `«` icon
- **Collapsed state**: The expand button in the 48px strip gets a gold gradient background with the `»` icon and a subtle glow effect
- Both states use `shadow-lg` and `border border-gold/50` for premium feel

---

### Files Changed

| File | Changes |
|------|---------|
| `GlobalVerticalNav.tsx` | Collapsible sections, wider flyout, color-coded shortcuts, better text contrast, premium toggle |

