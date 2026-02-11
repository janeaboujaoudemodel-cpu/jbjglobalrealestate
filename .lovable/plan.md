

## Adjust YouTube End Screen Overlay

### Changes to `src/components/YouTubeVideoPlayer.tsx`

**1. Make background fully opaque black**
- Change `bg-black/95` to `bg-black` on the overlay button (line 107) so nothing bleeds through from behind

**2. Increase logo size**
- Change `w-24 h-24 md:w-32 md:h-32` to `w-40 h-40 md:w-52 md:h-52` (line 113) to make the monogram significantly larger

**3. Push Replay button further down**
- Increase spacing between logo and replay from `mb-6` to `mb-12` (line 113) so the replay text/icon sits well below the logo
