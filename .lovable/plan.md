
## Add Reelly-Style Filter Shortcut Buttons to Search Headers

### Overview
Add a row of interactive pill-shaped filter buttons (Price, Payments, Handover, Property Type, Bedrooms, Status, Reset All, Save Filter) below the main search input on both the homepage hero and the Properties listing page. Each button opens a popover with detailed filter controls, matching the style shown in the Reelly.io reference images.

### What Will Change

#### 1. New Shared Component: `FilterShortcutBar`
**New file: `src/components/filters/FilterShortcutBar.tsx`**

A reusable row of pill-shaped filter buttons, each opening a Popover with specific controls:

- **Price**: Popover with 3 tabs (Per unit / Per sqft / Per sqm), min/max input fields with currency suffix, and quick-select preset amounts (500K, 1M, 1.5M, 3M, 5M AED). "Apply filter" button at bottom.
- **Payments**: Popover with "Projects payment plan" title, 0-100% slider, "Maximum pre-handover" and "After handover" input fields, and a toggle for "Search projects only with post handover payment plans."
- **Handover**: Popover with "Project handover by" title, From/To date selects (quarter + year dropdowns).
- **Property Type**: Popover showing toggleable pills (Apartments, Villa, Townhouse, Duplex, Penthouse). Shows count badge when multiple selected (e.g., "Apartments +2").
- **Bedrooms**: Popover with toggleable pills (Studio, 1 BR, 2 BR, 3 BR, 4 BR, 5+ BR).
- **Status**: Popover with color-coded toggleable pills (Announced - pink, Presale EOI - green, Start of Sales - blue, On Sale - yellow, Out of Stock - gray).
- **Reset All**: Button with X icon, appears only when any filter is active. Pink/red background to stand out.
- **Save Filter**: Heart/bookmark icon button that opens a modal to name and save the current filter set.

Each button is styled as a rounded pill with border, showing a chevron when it has a dropdown. Active/selected buttons get a filled dark background with white text (like in the reference).

Props will include filter state and callbacks so parent pages can control the values.

#### 2. Homepage Hero Search Bar Enhancement
**File: `src/components/home/HeroSearchBar.tsx`**

- Add a third row below the existing search bar with the `FilterShortcutBar` component
- Style the buttons in the "glass" variant (semi-transparent white on dark background) to match the hero aesthetic
- Filter values are passed as URL params when the user clicks Search

#### 3. Properties Page Filter Bar Enhancement
**File: `src/pages/Properties.tsx`**

- Add the `FilterShortcutBar` row below the existing keyword search input (between the search input and the current dropdown filters row)
- Style in the "light" variant (champagne gradient background, gold borders) to match the existing filter section
- Connected to the existing `filters`/`setFilters` state so selections apply immediately or on Search click

#### 4. Save Filter Modal Component
**New file: `src/components/filters/SaveFilterModal.tsx`**

A dialog matching the Reelly reference:
- "Give name for your saved filter" heading
- Text input with clear (X) button
- Recommendation text: "Start with the customer's last name or first name or company name to easily identify who the file is for."
- Cancel and Save buttons
- Saves to localStorage (or database if user is authenticated)

### Visual Design

- **Light variant** (Properties page): Champagne gradient pills with gold/40 border, black text. Active state: black background, white text.
- **Dark variant** (Homepage hero): Glass pills with white/20 border, white text. Active state: white background, black text.
- **Popovers**: Champagne gradient background with gold border (matching existing platform standard), black text, gold accents.
- **Reset All**: Pink/red tinted pill, only visible when filters are active.
- **Active count badges**: Gold circle with count number (e.g., "+2") on property type and other multi-select filters.

### Technical Details

- The `FilterShortcutBar` component accepts a `variant` prop ('light' | 'dark') for styling context
- Filter state is managed by the parent page and passed down via props + callbacks
- Each popover uses the existing Radix `Popover` component with proper z-index (z-[9999]) and solid backgrounds
- The Save Filter feature uses localStorage with key `jbj-saved-filters` storing an array of `{ name, filters, createdAt }`
- No database changes needed -- filter saving is client-side for now
- The component is horizontally scrollable on mobile (overflow-x-auto with hidden scrollbar)

### Files Summary

| File | Action |
|------|--------|
| `src/components/filters/FilterShortcutBar.tsx` | New -- reusable filter shortcut pills row |
| `src/components/filters/SaveFilterModal.tsx` | New -- save filter name dialog |
| `src/components/home/HeroSearchBar.tsx` | Add FilterShortcutBar below search bar |
| `src/pages/Properties.tsx` | Add FilterShortcutBar below keyword search |
