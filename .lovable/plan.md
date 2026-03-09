

## Fix: Search Bar Gaps & Search Button Placement

**Problems identified:**
- `ml-auto` on the Search button pushes it to the far right, creating a huge gap after Filters
- `max-w-[340px]` on the keyword field caps its width, leaving dead space
- Search button has no left rounding or divider separating it from Filters

**Fix — single file `src/components/home/HeroSearchBar.tsx`:**

1. **Keyword field (line 718):** Remove `max-w-[340px]` — keep `flex-1 min-w-[200px]` so it absorbs all remaining space naturally, eliminating gaps everywhere.

2. **Search button (line 1289-1300):** Remove `ml-auto` so it sits directly next to Filters with no gap. Change `rounded-none rounded-r-2xl` to `rounded-2xl` so it has rounded borders on both left and right sides.

3. **Add divider before Search button (before line 1289):** Insert a gold gradient divider (same style as other dividers) between the Filters button and the Search button.

**Result:** All fields sit tight against each other with no dead space. The search button is snug next to filters with a divider, and has rounded corners on all sides.

