

## Fix: Eliminate Gap in Search Bar

**Root cause:** The outer search bar container uses `w-full`, stretching it to the full width of its parent. Since the keyword field is capped at `max-w-[280px]` and all other elements have fixed widths, the leftover space creates visible gaps inside the flex container.

**Fix — single change in `src/components/home/HeroSearchBar.tsx`:**

Change the outer desktop search bar container (line 716) from `w-full` to `w-fit`. This makes the bar shrink-wrap its contents, eliminating all internal dead space.

```
// Line 716: Change w-full → w-fit
<div className="hidden sm:flex items-center w-fit bg-gradient-to-r ...">
```

That's it — one class change. The bar will hug its contents tightly with zero gaps.

