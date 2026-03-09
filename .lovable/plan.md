

## Fix: Hero Search Bar Spacing & Alignment

**Problem:** The search bar has large gaps — between the keyword field and Beds, and between Search button and the bar's end. Fields don't distribute evenly across the bar width.

**Root Cause:** The keyword input has a fixed width (`w-[380px] lg:w-[420px]`) which is too large on some screens, while the rest of the bar has leftover space that isn't filled. The container is `w-full` but no element absorbs the remaining space.

**Solution — Single file edit (`src/components/home/HeroSearchBar.tsx`):**

1. **Keyword field (line 718):** Change from fixed `w-[380px] lg:w-[420px] shrink-0` to `flex-1 min-w-[240px]`. This lets it grow to fill available space naturally, ensuring the placeholder text is readable while eliminating the gap before Beds.

2. **Filter fields (Beds, Price, Emirates, Developer, Filters):** Reduce horizontal padding from `px-4`/`px-5` to `px-3` uniformly so fields are compact and evenly spaced.

3. **Search button (line 1288-1300):** Keep `shrink-0` but add `ml-0` and ensure it's snug against the Filters button. The `rounded-2xl` on the button with the container's `rounded-2xl` + `overflow-hidden` should make it flush to the right edge — change button to `rounded-none rounded-r-2xl` so it fills to the edge seamlessly.

4. **No changes** to dividers, dropdown contents, or any other layout outside this bar.

