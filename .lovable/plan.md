

## Fix Remaining Inconsistent Developer Logos

Three components still use legacy inline logo rendering instead of the unified `DeveloperLogo` component. All need to be updated for global consistency.

### Changes

**1. `src/components/DeveloperCard.tsx`**
- Replace the `w-16 h-16 bg-white/90 rounded-lg p-1.5` wrapper + inline `<img>` with `<DeveloperLogo>` component
- Use standard `w-14 h-14` size, no white frame

**2. `src/components/developer/RecommendedDevelopers.tsx`**
- Replace the `SafeImage` inside the `h-28 bg-white/50` container with `<DeveloperLogo>` component
- Keep the centered layout but remove the white background wrapper

**3. `src/components/ContinueSearching.tsx`**
- Replace the `w-9 h-9 rounded-lg bg-white ring-1` wrapper + inline `<img>` with `<DeveloperLogo>`
- Note: These cards are smaller, so we may use a smaller className override like `w-9 h-9 rounded-xl` to fit the card proportion while still using the shared component

### Technical Details

All three files will import `DeveloperLogo` from `@/components/ui/DeveloperLogo` and use it with the standard frameless, rounded-2xl, object-cover styling. The `DeveloperLogo` component already handles error states and lazy loading internally.

| File | Current Style | After |
|------|--------------|-------|
| `DeveloperCard.tsx` | `w-16 h-16`, white frame, `object-contain` | `DeveloperLogo` w-14 h-14, no frame |
| `RecommendedDevelopers.tsx` | SafeImage in white container | `DeveloperLogo` centered, no white bg |
| `ContinueSearching.tsx` | `w-9 h-9`, white frame + ring | `DeveloperLogo` w-9 h-9 override, no frame |

