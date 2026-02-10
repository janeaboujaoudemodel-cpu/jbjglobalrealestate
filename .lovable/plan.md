

# Fix Load More, Favorites/Shortlist Buttons, and Prices

## Problems Identified

### 1. Favorites and Shortlist buttons fail with UUID error
The `favorites` and `shortlists` database tables use `project_id` of type `uuid`. Reelly projects have **numeric IDs** (e.g., `4`, `123`). When `FavoriteButton` and `ShortlistBadgeButton` pass `String(project.id)` (e.g., `"4"`), the database rejects it with: `"invalid input syntax for type uuid: "4""`.

**Solution:** For Reelly projects, use guest/localStorage-based favorites and shortlist instead of the database. Modify `FavoriteButton` and `ShortlistBadgeButton` to detect non-UUID project IDs and always use the guest hooks for those. Additionally, when a user clicks "Add Badge" on a non-shortlisted project, automatically add it to the shortlist first, then assign the badge.

### 2. Load More is slow due to duplicate API call
The `useReellyProjects` hook makes **two requests** every time: first a wasted `supabase.functions.invoke('reelly-projects')` call (line 60-63), then the actual `fetch()` call with pagination params. The first call does nothing useful but doubles latency.

**Solution:** Remove the unused `supabase.functions.invoke` call. Only keep the `fetch()` with proper limit/offset params. Also pass filters as query parameters to the edge function so filtering happens server-side instead of client-side, which will significantly speed up subsequent loads.

### 3. Missing prices on some listings
Some Reelly projects have `null` for `price_from`. The card already handles this by only showing the price when it exists. No code bug here -- it's a data issue from the API. We can improve the UI by showing "Price on Request" when no price is available instead of showing nothing.

## Technical Changes

### File: `src/hooks/useReellyProjects.ts`
- Remove the dead `supabase.functions.invoke` call (lines 60-63) -- this fires a wasted request every time
- Pass `filters` as query parameters in the `fetch()` URL so the edge function can filter server-side
- This alone will cut load time roughly in half

### File: `src/components/FavoriteButton.tsx`
- Add a UUID detection helper: `const isUUID = (id: string) => /^[0-9a-f]{8}-/.test(id)`
- When `projectId` is not a UUID, always use the guest (localStorage) hooks regardless of auth state
- This prevents the database UUID error entirely

### File: `src/components/ShortlistBadgeButton.tsx`
- Same UUID detection: use guest shortlist for non-UUID project IDs
- When user clicks "Add Badge" on a non-shortlisted project, auto-add to shortlist first, then show the badge dropdown
- This ensures the badge button always works

### File: `src/components/ReellyProjectCard.tsx`
- Show "Price on Request" when `project.price_from` is null/0
- This gives users clear feedback instead of an empty space

## Files to Modify

| File | Change |
|---|---|
| `src/hooks/useReellyProjects.ts` | Remove duplicate API call, pass filters as query params |
| `src/components/FavoriteButton.tsx` | Use guest hooks for non-UUID project IDs |
| `src/components/ShortlistBadgeButton.tsx` | Use guest hooks for non-UUID IDs, auto-shortlist on badge add |
| `src/components/ReellyProjectCard.tsx` | Show "Price on Request" for missing prices |

## Execution Order

1. Fix `useReellyProjects.ts` -- remove duplicate call (speeds up Load More)
2. Fix `FavoriteButton.tsx` -- UUID detection for guest fallback
3. Fix `ShortlistBadgeButton.tsx` -- UUID detection + auto-shortlist on badge
4. Fix `ReellyProjectCard.tsx` -- "Price on Request" fallback

