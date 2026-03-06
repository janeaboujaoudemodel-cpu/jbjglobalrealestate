

## Plan: Fix Admin Properties Tab — Styling, Project Cards, and Data Completeness

### Issues to Fix

**1. SmartDocumentUploader — Dark theme in champagne admin**
- Currently uses `bg-zinc-900`, `border-zinc-800`, `text-white`, `bg-zinc-950` throughout
- The `SelectContent` dropdown is `bg-zinc-900` with `text-white` items
- The "Select Document" button is `border-zinc-700 text-white hover:bg-zinc-800` (gray)
- **Fix**: Restyle entire component to champagne gold theme: `bg-gradient-to-r from-[#FDFBF7] to-white`, `border-gold/30`, `text-black` throughout. Dropdown items in black text on champagne background. Button idle state gold-champagne instead of gray.

**2. Total Projects count capped at 1000**
- `useProjects()` has no `.limit()` but Supabase defaults to 1000 rows max
- The stat card shows `projects?.length` which maxes at 1000
- **Fix**: Use `useProjectsTotalCount()` (already exists, does `count: "exact", head: true`) for the stat card instead of `projects?.length`. This gives the real DB count without the 1000-row limit.

**3. Project cards show building icon fallback instead of images**
- Card checks `project.images?.[0]` but many projects have no `project_images` rows — they only have `cover_image_url` on the project itself
- **Fix**: Check `cover_image_url` first as primary image source, fall back to `project.images?.[0]`, then building icon as last resort.

**4. Dot separator in project subtitle**
- Line 770: `{project.developer?.name} • {project.location}` — the `•` shows even when developer or location is missing, leaving a lone dot
- **Fix**: Only show dot when both values exist. Replace the subtitle with richer info: description (truncated), payment plan, handover date, price range. Show "No description available" in muted text when missing.

**5. Missing preview button on project cards**
- User wants a square icon with arrow (external link) to preview the project page
- **Fix**: Add an `ExternalLink` icon button that opens `/project/{slug}` in new tab.

**6. Projects without photos/description should not be published**
- User wants visual indicator for incomplete projects
- **Fix**: Add a warning badge on cards missing cover image or description. Don't auto-unpublish (destructive), but show a prominent "Incomplete" warning badge so admin can act.

### Files to Modify

- `src/components/SmartDocumentUploader.tsx` — Restyle to champagne gold theme
- `src/pages/Admin.tsx` — Use `useProjectsTotalCount()` for stat, fix project card layout (image fallback, subtitle, preview button, incomplete badge)

