

## Fix YouTube Replay — Destroy and Recreate Player

### Problem
Neither `seekTo` nor `loadVideoById` reliably restart the video after it ends. YouTube's player transitions into a recommendations state that persists through both methods, showing music playlists and suggested videos (visible in the screenshot).

### Solution
Instead of trying to manipulate the existing player instance, **destroy it completely and create a fresh one** on replay. This is the only approach that guarantees no YouTube recommendations leak through.

### Changes to `src/components/YouTubeVideoPlayer.tsx`

**1. Extract player creation into a reusable function**

Move the `new window.YT.Player(...)` logic into a helper function (e.g., `createPlayer`) that can be called both on initial mount and on replay.

**2. Rewrite `handleReplay` to destroy and recreate**

```text
handleReplay:
1. Destroy current player instance (player.destroy())
2. Re-insert a fresh <div> with the same iframe ID into the container
3. Call createPlayer() to build a new YouTube player on that div
4. Set ended = false to hide the overlay
```

**3. Keep all existing playerVars intact**

The restrictive `rel: 0`, `modestbranding: 1`, `iv_load_policy: 3`, etc. stay in place for the fresh player instance.

### Technical Detail

The key insight: `player.destroy()` removes the iframe entirely, so we need to manually insert a new empty `<div>` element with the same ID before creating a new player. The component structure changes slightly:

- The container `ref` is used to append a fresh div
- `iframeId` stays consistent so the overlay positioning works
- The `onStateChange` handler is re-attached to the new player instance

### Files to edit
| File | Change |
|------|--------|
| `src/components/YouTubeVideoPlayer.tsx` | Extract player creation to helper function; rewrite `handleReplay` to destroy old player, insert fresh div, and create new player |
