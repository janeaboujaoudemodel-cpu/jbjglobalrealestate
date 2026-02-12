

## Add Search Bar Header + Shortcut Sub-Nav to Project Page Scroll Header

### Current State
The project page sticky header currently shows only one row: the curated 8-item shortcut bar (Details, Gallery, Developer, etc.) in a champagne gradient. The main GlobalHeader hides on scroll (already working). However, other pages like Area and Developer pages show the **search/filter bar** as the scroll header -- the user wants the same pattern on the project page.

### What Needs to Change

The sticky header on the project page should have **two rows**:
1. **Row 1 (Search bar)**: The `PropertySearchBar` component in compact mode -- same search bar used across the platform, providing keyword search + filters
2. **Row 2 (Shortcuts)**: The curated 8-item navigation (Details, Gallery, Developer, Location, Brochure, AI Analyzer, Mortgage, Register Interest) in a slightly darker champagne background. "Register Interest" gets a highlighted gold CTA button style to stand out.

### Changes

**File: `src/components/project-detail/ProjectDetailLayout.tsx`**

#### 1. Import PropertySearchBar
Add import for `PropertySearchBar` (compact mode) at the top of the file.

#### 2. Restructure the sticky nav into two rows

Replace the current single-row champagne bar with:

**Row 1 -- Search Bar**
- Background: main champagne gradient (`from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`)
- Contains: `PropertySearchBar compact` for quick property search
- Padding: `py-2 px-4`

**Row 2 -- Curated Shortcuts**
- Background: darker champagne gradient (`from-[#EDE0C8] via-[#E2D4B8] to-[#D4C4A8]`)
- Contains: The 8 curated shortcuts (Details through Register Interest)
- "Register Interest" rendered as a highlighted gold button (gold gradient bg, black text, glow effect) instead of a plain text tab
- Compact single line, horizontally scrollable on mobile

#### 3. Register Interest button highlight

"Register Interest" will be separated from the other 7 items and styled as a prominent CTA:
- Gold gradient background (`from-gold to-gold-dark`)
- Black bold text
- Subtle glow shadow (`box-shadow: 0 0 15px rgba(200,167,102,0.4)`)
- Positioned at the right end of the bar

### Visual Layout

```text
+---------------------------------------------------------------------------+
| [Search icon] Search properties...        [Location v] [Developer v] SEARCH |  <-- Row 1: Search bar (light champagne)
+---------------------------------------------------------------------------+
| Details | Gallery | Developer | Location | Brochure | AI | Mortgage | [REGISTER INTEREST] |  <-- Row 2: Shortcuts (darker champagne)
+---------------------------------------------------------------------------+
```

### Files Summary

| File | Action |
|------|--------|
| `src/components/project-detail/ProjectDetailLayout.tsx` | Add PropertySearchBar import; restructure sticky nav into 2 rows; highlight Register Interest as gold CTA button |

