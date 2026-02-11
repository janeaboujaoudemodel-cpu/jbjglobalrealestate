

## Hide YouTube Recommendations and Show Logo After Video Ends

### Problem
The YouTube embeds on the Company Profile and Digital Card pages show recommended videos after the video finishes playing. The user wants the JBJ logo to appear instead when the video ends.

### Solution
Replace the simple YouTube `<iframe>` embeds with a custom wrapper component that:
1. Uses YouTube's `rel=0` parameter to minimize related videos (YouTube still shows some from the same channel)
2. Listens for the video "ended" event via the YouTube IFrame Player API
3. When the video ends, hides the iframe and overlays the JBJ logo on a branded background

### Changes

**1. New component: `src/components/YouTubeVideoPlayer.tsx`**
- Wraps a YouTube iframe embed with the `enablejsapi=1` and `rel=0` URL parameters
- Loads the YouTube IFrame Player API script
- Listens for the `onStateChange` event (state `0` = ended)
- When video ends: fades out the iframe and shows the JBJ monogram logo centered on a dark/champagne background
- Clicking the logo overlay restarts the video
- Props: `videoId`, `title`, `className`, `borderStyle` (optional)

**2. Update `src/pages/CompanyProfile.tsx` (~line 442-449)**
- Replace the raw `<iframe>` with `<YouTubeVideoPlayer videoId="lBXXdJ2kAtQ" title="JBJ Global Real Estate - Company Introduction" />`

**3. Update `src/pages/DigitalCard.tsx` (~line 380-386)**
- Replace the raw `<iframe>` with `<YouTubeVideoPlayer videoId="lBXXdJ2kAtQ" title="JBJ Global Real Estate - Company Introduction" />`

**4. Update `src/components/project-detail/ProjectMediaSection.tsx` (~line 122-128)**
- Apply the same treatment to project video modals: append `?rel=0&enablejsapi=1` to embed URLs

### Technical Details

- The YouTube IFrame API provides `YT.Player` with an `onStateChange` callback. State `0` means the video ended.
- `rel=0` restricts related videos to the same channel (YouTube no longer fully hides them, but this is the best available option).
- The logo overlay uses the existing `jbjMonogramDarkBg` asset from `@/assets/jbj-monogram-dark-bg.png`.
- A "replay" click handler calls `player.seekTo(0)` and `player.playVideo()` to restart.

