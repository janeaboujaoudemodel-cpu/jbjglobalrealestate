

## Fix Area Guides Page: Add Vertical Nav + Header Replacement (matching Properties page)

The Area Guides page (`/areas`) already has the sticky filter bar and `filter-bar-fixed` body class logic, but it's missing the **PropertiesVerticalNav sidebar** that appears on the left when the filter bar becomes fixed -- the same behavior that works on the Properties page and Area Detail page.

### What's Missing

The Properties page (`PropertiesReelly.tsx`) and Area Detail page (`AreaDetail.tsx`) both show a fixed vertical navigation sidebar on the left when scrolled past the filter sentinel. The Area Guides page does not.

### Changes

**File: `src/pages/AreaGuides.tsx`**

1. **Import `PropertiesVerticalNav`** component.

2. **Wrap the page content in a flex container** (like AreaDetail does) so the vertical nav and main content sit side by side.

3. **Render `PropertiesVerticalNav`** when `isFixed && !bottomReached` on desktop (`hidden lg:block`, fixed left, full height, `z-[9997]`).

4. **Add `lg:ml-[200px]` to main content** when the vertical nav is visible, with a smooth transition.

5. **Offset the fixed filter bar portal** to `lg:left-[200px]` (instead of `left-0`) so it doesn't overlap the vertical nav -- matching how AreaDetail and Properties handle it.

### Technical Details

```text
Current AreaGuides layout:
+---------------------------+
|       GlobalHeader        |
+---------------------------+
|     Filter Bar (fixed)    |
+---------------------------+
|       Areas Grid          |
+---------------------------+

After fix (when scrolled):
+------+--------------------+
| Vert |  Filter Bar (fixed)|
| Nav  +--------------------+
| 200px|    Areas Grid       |
|      |                     |
+------+--------------------+
```

This exactly mirrors the Properties page and Area Detail page behavior -- the GlobalHeader hides, the vertical nav slides in on the left, and the filter bar + content shift right to accommodate it.

