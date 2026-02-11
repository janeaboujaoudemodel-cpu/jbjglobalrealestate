

## Fix Suggestion Flash During Replay

### Problem
When clicking "Replay," the branded overlay is removed immediately (`setEnded(false)`) before the new YouTube player has finished loading. During that brief loading gap, YouTube's default state with suggestions/recommendations is visible for about a second before the video starts.

### Solution
Keep the branded overlay visible until the new player actually starts playing. Only hide the overlay inside the YouTube player's `onReady` event callback, where we also call `playVideo()`.

### Changes to `src/components/YouTubeVideoPlayer.tsx`

**1. Add an `onReady` callback parameter to `createPlayer`**

Modify `createPlayer` to accept an optional `onReady` callback. When the YouTube player fires its `onReady` event, it calls `playVideo()` and then invokes the callback.

**2. Update `handleReplay` to keep overlay until ready**

- Do NOT call `setEnded(false)` immediately
- Instead, pass a callback to `createPlayer` that calls `setEnded(false)` only after the player is ready and playing
- This ensures the branded logo overlay stays on screen, hiding YouTube's loading state and any brief suggestion flash

**3. Updated flow**

```text
User clicks Replay:
  1. Destroy old player, remove old div
  2. Insert fresh div (hidden behind the still-visible overlay)
  3. Create new player with onReady callback
  4. Player loads behind the overlay (user sees logo, not suggestions)
  5. onReady fires -> playVideo() + setEnded(false) -> overlay disappears, video is already playing
```

### Files to edit
| File | Change |
|------|--------|
| `src/components/YouTubeVideoPlayer.tsx` | Add `onReady` parameter to `createPlayer`; delay `setEnded(false)` until player is ready in `handleReplay` |

