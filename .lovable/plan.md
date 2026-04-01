

## Restore Handpicked Logo Style & Fix Continue Searching Separately

### Problem
The last change replaced `object-contain p-1.5 bg-white` with `object-cover` globally. This broke the Handpicked For You logos which were already perfect with the white background style.

### Solution — Two changes

**1. `src/components/ui/DeveloperLogo.tsx`** — Restore the locked default:
```
object-cover overflow-hidden  →  object-contain p-1.5 bg-white
```
This restores the exact style that was correct in Handpicked For You.

**2. `src/components/ContinueSearching.tsx`** — Override for this section only:
Pass `className="bg-transparent p-0 object-cover overflow-hidden"` to both `DeveloperLogo` instances so the Continue Searching cards get the full-fit look without white borders, while Handpicked and all other sections keep the white-background standard.

### Why this works
The `DeveloperLogo` component uses `cn()` which lets `className` overrides win. So the global default stays white-background (correct for Handpicked), and only Continue Searching gets the override.

