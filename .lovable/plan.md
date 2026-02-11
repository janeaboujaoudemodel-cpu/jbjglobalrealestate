

## Remove Individual Card Backdrops, Add Unified Grid Background

### What Changes
Currently, each project card in `AreaProjectsGrid.tsx` is wrapped in a `motion.div` with its own champagne gradient background (`p-2` padding), creating visible black gaps between cards. The fix will:

1. **Remove the per-card champagne wrapper** -- strip the gradient background and padding from each individual `motion.div` (lines 82-83)
2. **Add a single continuous champagne background** behind the entire grid, so all cards sit on one unified surface with no black showing between them

### Technical Details

**File: `src/components/area-detail/AreaProjectsGrid.tsx`**

- Wrap the grid (`div` at line 74) inside a new container with the champagne gradient background (`linear-gradient(135deg, #FDFBF7, #F5F0E6, #EDE4D3)`), rounded corners (`rounded-2xl`), and padding (`p-6`)
- Remove the per-card `style={{ background: ... }}` and `p-2` / `rounded-2xl` from the `motion.div` wrapper (lines 82-83), keeping only `h-full` for layout
- The grid gaps will now show the unified champagne background instead of black

