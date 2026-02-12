

## Fix: Visual Separation Between Filters and Area Cards

### Problem
The filter area and the cards grid share the exact same champagne gradient background with no visual break between them. This makes the page look like one flat, undifferentiated layer. The `</section>` closing tag for the filter section was also accidentally removed in the last edit, breaking the HTML structure.

### Solution
Split them into two visually distinct zones:

1. **Filter zone** (search, pills, sort, shortcut bar): Keep the current lighter champagne gradient (`from-champagne-light via-champagne to-champagne-dark`)
2. **Gold divider line**: Add a thin `border-b border-gold/30` at the bottom of the filter section for a clean visual break
3. **Cards grid zone**: Use a slightly darker/warmer champagne tone (`from-[#F0E6D2] via-[#E8DCCA] to-[#DED0BC]`) so the two areas are clearly different layers

### Technical Changes

**File: `src/pages/AreaGuides.tsx`**

- **Close the filter `<section>` tag** properly after `FilterShortcutBar` (line 293) -- restore the `</section>` that was removed
- **Add `border-b border-gold/30`** to the filter section for a subtle gold line separator
- **Wrap the cards grid** in its own `<section>` with a slightly darker champagne gradient (`from-[#F0E6D2] via-[#E8DCCA] to-[#DED0BC]`) so it reads as a distinct layer
- Fix indentation of the grid `<div>` which is currently misaligned

This gives a clear two-tone layout: lighter champagne for controls, slightly warmer/darker champagne for results, separated by a thin gold line.

