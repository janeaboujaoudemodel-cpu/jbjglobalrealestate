

## Fix Logo Consistency Across All Sections

### Problem
The `DeveloperLogo` component uses `bg-white p-1.5` which creates a visible white border/padding around logos. On the smaller "Continue Searching" cards (160-200px wide), this white padding appears more prominent compared to the larger "Handpicked For You" cards, making them look inconsistent. The user wants logos to appear "full fit" without white borders.

### Root Cause
The `bg-white` background and `p-1.5` padding in the `DeveloperLogo` component creates a white frame around every logo. Logos that already have their own white/transparent background get double whitespace, appearing smaller and with noticeable white borders.

### Solution
Update `DeveloperLogo` to remove the white background and padding, making the logo image fill the container fully:

**`src/components/ui/DeveloperLogo.tsx`** — Change the className from:
```
w-14 h-14 rounded-xl object-contain p-1.5 bg-white shrink-0 shadow-md
```
to:
```
w-14 h-14 rounded-xl object-cover overflow-hidden shrink-0 shadow-md
```

- `object-contain` → `object-cover`: fills the container without leaving white space
- Remove `p-1.5`: no internal padding that creates white borders
- Remove `bg-white`: no white background visible around the logo
- Add `overflow-hidden`: clips content cleanly to the rounded corners

This single change applies globally across all pages: Handpicked For You, Continue Searching, ProjectCard, DeveloperCard, RecommendedDevelopers, RecommendedProjects, etc.

### Note
Some logos with large transparent areas may get slightly cropped with `object-cover`. If the user prefers `object-contain` (no cropping) but without the white frame, the alternative is `object-contain` with `bg-transparent p-0` instead.

