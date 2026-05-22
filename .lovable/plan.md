## Plan: Hide Hero Action Pills on Phone View

### Current Behavior
The hero action pills (Browse Properties, AI Home Finder, Market Intelligence, News, Broker Toolkit, Careers) render on all screen sizes. On mobile, they display as a horizontally scrollable single-row strip with snap scrolling.

### Requested Change
- **Hide** the pills on phone view (`< 768px`)
- **Keep** the pills visible on tablet (iPad) and desktop (`≥ 768px`)

### Implementation
Single-line change in `src/pages/Index.tsx` at line 275:

Replace the `<div>` className from:
```
flex items-center gap-1.5 sm:gap-2 flex-nowrap sm:flex-wrap ...
```

To:
```
hidden md:flex items-center gap-1.5 sm:gap-2 flex-nowrap sm:flex-wrap ...
```

This adds `hidden md:flex` so the container is `display: none` below 768px and `display: flex` at 768px and above. The existing responsive classes (`sm:`, `md:`) continue to work within the visible range.

### Files to Edit
- `src/pages/Index.tsx` — 1 line className update

### Estimated Effort
Trivial — one className addition.