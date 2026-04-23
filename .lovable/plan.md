

## Homepage Hero Cleanup & Balanced 6-Tile CTA Grid

### 1. Remove logo from hero loading state
In `src/pages/Index.tsx`, the branded fallback (shown while the hero video buffers) currently renders the JBJ monogram centered on screen, which overlays the "Your Gateway to Dubai's Finest Real Estate" headline on phones.

Changes:
- Delete the `<img src={jbjMonogramLightTransparent} ... />` block and its loading shimmer line from the `!videoLoaded` fallback (lines ~166–188).
- Keep only the dark gradient + soft gold orbs as the loading background, so the headline and CTAs remain clean and unobstructed.
- Remove the now-unused `jbjMonogramLightTransparent` import.
- Keep the `heroFallbackPulse` / `heroFallbackShimmer` `<style>` block only if still referenced; otherwise drop it too.

### 2. Six balanced hero CTA pills on every device
Currently `heroActions` has 5 entries which forces an awkward 2+2+1 / 3+2 layout on mobile and tablet. We will make it exactly 6 to render as a clean 3×2 on phones and 3×2 (or 6 in a row) on larger screens.

Changes in `src/pages/Index.tsx`:
- Add a 6th entry to the `heroActions` array. Proposal: **"Submit Complaint"** → `/ticket-hub`, using the `MessageSquareWarning` lucide icon (matches the existing Support Ticket Hub route already in the project).
- Update the lucide import to include `MessageSquareWarning`.
- Simplify the pills wrapper from the special-cased 5-item layout to a clean responsive grid:
  - Phone: `grid-cols-3` (3×2)
  - Tablet: `sm:grid-cols-3` (3×2)
  - Desktop: `lg:grid-cols-6` (single row of 6) — or keep `lg:flex lg:flex-wrap lg:justify-center` if we want them to wrap naturally; grid-cols-6 keeps perfect symmetry.
- Remove the `idx === 3` / `idx === 4` conditional class hack since 6 items divide evenly.
- Tighten pill padding/icon size slightly on mobile so 3 fit per row without truncation (`px-2.5` mobile, keep `sm:px-5`; icon stays `w-3 h-3`).

### Final 6 Hero Actions
| # | Label | Icon | Route |
|---|---|---|---|
| 1 | Sell Your Property | Building2 | /sell |
| 2 | AI Home Finder | Home | /quiz |
| 3 | Explore AI Tools | Brain | /ai-hub |
| 4 | Create Your CV | FileText | /toolkit/cv-builder |
| 5 | Update Profile | UserCircle | /profile |
| 6 | Submit Complaint | MessageSquareWarning | /ticket-hub |

### Files touched
- `src/pages/Index.tsx` (only file)

### Out of scope (explicitly preserved)
- Video, headline copy, pillars row, scroll indicator, and all sections below the hero remain untouched (per the No-Removal policy).

