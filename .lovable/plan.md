

## Restore Developer Logos to White Background Style

The user wants logos to be fully readable, not cropped, on a white background — the classic contained logo style.

### Change

**`src/components/ui/DeveloperLogo.tsx`** — Update the className from the current cropped style to a contained, white-background style:

- `object-cover` → `object-contain` (no cropping, full logo visible)
- Add `bg-white` and `p-1.5` (white canvas with padding for readability)
- Keep `rounded-xl`, `shadow-md`, `w-14 h-14`

This single change propagates everywhere the component is used (ProjectCard, RecommendedProjects, DeveloperCard, RecommendedDevelopers, ContinueSearching, FeaturedListings, etc.).

