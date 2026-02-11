

## Fix YouTube Video Replay

### Problem
When clicking "Replay" after the video ends, the overlay disappears but the video doesn't restart -- just a black screen remains. The `seekTo` call is missing its required second parameter, and there may be a timing issue between hiding the overlay and restarting playback.

### Root Cause
The YouTube IFrame API's `seekTo(seconds, allowSeekAhead)` method requires a second boolean parameter set to `true` to perform the seek. Without it, the seek may silently fail. Additionally, the overlay is removed immediately while the player may not yet be playing, causing a brief black flash.

### Fix in `src/components/YouTubeVideoPlayer.tsx`

**1. Fix `seekTo` call (line 89)**
- Change `player.seekTo(0)` to `player.seekTo(0, true)` to ensure the seek actually executes

**2. Reverse the order of operations in `handleReplay` (lines 85-92)**
- Call `player.seekTo(0, true)` and `player.playVideo()` first
- Then set `setEnded(false)` to remove the overlay only after playback has been triggered
- This prevents the user from seeing a black frame between overlay removal and video start

