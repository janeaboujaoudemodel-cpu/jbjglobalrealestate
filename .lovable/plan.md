

## Plan: Fix White Gap Below Horizontal Header

**Problem:** The body/html background is white (`--background: 0 0% 100%`), so when scrolling, a white strip is visible between the fixed horizontal utility bar and the page content.

**Fix:** Add a matching champagne background color to the `body` element on `md+` screens so the area behind/below the fixed header matches instead of showing white.

**File:** `src/index.css` (lines 12-18)

Add `background-color` to the body that matches the horizontal bar's champagne gradient on desktop:

```css
@media (min-width: 768px) {
  body {
    background-color: #E8DCC8;
  }
}
```

This ensures any exposed area behind the fixed header or between it and content matches the champagne tone instead of white. The page content sections already have their own backgrounds so they'll render on top correctly.

**Single file change, 3 lines added.**

