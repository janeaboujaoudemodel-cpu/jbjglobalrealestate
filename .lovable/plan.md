

## Fix YouTube Replay -- Prevent Recommendations and Ensure Proper Restart

### Problem
When clicking "Replay," YouTube shows music/video recommendations instead of replaying the original video. The `seekTo` + `playVideo` approach fails because once the video ends, YouTube's player transitions to a recommendations state that overrides the seek command.

### Root Cause
The YouTube IFrame API does not reliably restart a video with `seekTo(0)` after it has fully ended and entered the "related content" state. Additionally, the current `playerVars` are missing key parameters that suppress all post-video suggestions.

### Fix in `src/components/YouTubeVideoPlayer.tsx`

**1. Add restrictive playerVars to block all suggestions (lines 65-68)**

Add these parameters to completely lock down the player:
- `fs: 0` -- disable fullscreen button (optional, reduces UI clutter)
- `iv_load_policy: 3` -- hide video annotations
- `disablekb: 0` -- keep keyboard controls
- `showinfo: 0` -- hide video title bar
- `controls: 1` -- keep playback controls

**2. Replace `seekTo` with `loadVideoById` in handleReplay (lines 85-92)**

Instead of trying to seek within a dead player, use `player.loadVideoById(videoId)` which forces a full reload of the same video. This bypasses YouTube's recommendation state entirely:

```
const handleReplay = useCallback(() => {
  const player = playerRef.current;
  if (player?.loadVideoById) {
    player.loadVideoById({ videoId, startSeconds: 0 });
  }
  setEnded(false);
}, [videoId]);
```

This method tells the player to load a fresh instance of the same video from second 0, which is far more reliable than seeking within a finished video.

### Files to edit
| File | Change |
|------|--------|
| `src/components/YouTubeVideoPlayer.tsx` | Add restrictive `playerVars`, replace `seekTo`/`playVideo` with `loadVideoById` in `handleReplay` |

