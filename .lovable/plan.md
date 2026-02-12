
## Limit Initial Project Display on Developer Pages

### Problem
When a user opens a developer page (e.g., `/developer/binghatti`), all projects load and display at once, which can be overwhelming for developers with 50+ projects.

### Solution
Show only the first **9 projects** (3 rows x 3 columns) initially, with a premium "Explore All [Developer] Projects" button at the bottom. Clicking it reveals the full list.

### Changes

**File: `src/pages/DeveloperDetail.tsx`**

1. Add a `showAll` state (`useState(false)`) to track whether all projects are displayed
2. Create a `displayedProjects` variable:
   - When `showAll` is `false`: slice `filteredProjects` to the first 9
   - When `showAll` is `true`: show all `filteredProjects`
3. Reset `showAll` to `false` whenever filters change or the developer slug changes
4. Replace the grid rendering (line 383-386) to use `displayedProjects` instead of `filteredProjects`
5. After the grid, add a "View All [Developer] Projects" button when there are more than 9 projects and `showAll` is false:
   - Button text: `Explore All {filteredProjects.length} {developerName} Projects`
   - Styled as a champagne gold bordered button (`border-2 border-gold/40`) with gold text, centered below the grid
   - On click: set `showAll(true)` and smoothly scroll to keep the user's position

### Technical Details

```text
filteredProjects (e.g. 47 projects)
        |
        v
  showAll = false?
   /          \
  Yes          No
   |            |
 All 47     First 9
              + "Explore All 47 Binghatti Projects" button
```

- The count text (line 370-373) will always show the total count of filtered projects, not just the displayed ones
- When filters are applied and reduce the list to 9 or fewer, the button naturally disappears
- The skeleton loading state remains at 6 items (unchanged)

### Files Summary

| File | Action |
|------|--------|
| `src/pages/DeveloperDetail.tsx` | Add `showAll` state, slice to 9 initially, add "Explore All" CTA button |
