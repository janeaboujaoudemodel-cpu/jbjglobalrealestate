

## Session 4 — Hero Video Fallback Replacement

### Current State

**File:** `src/pages/Index.tsx` lines 161-191
**Component:** Homepage hero section (inline, not a separate component)
**Route:** `/`

The current fallback is `hero-fallback-dubai.jpg` — a generic Dubai/villa image used as both:
1. The `<img>` shown immediately (line 164-170)
2. The `<video poster>` attribute (line 175)

When the video loads slowly, users see this unrelated villa photo with no branding context.

### Plan

**Replace the static fallback image with a branded welcome screen** built as a styled overlay div that renders instantly (no image download needed), then crossfades to video.

**What the fallback will display:**
- Dark gradient background matching the hero's existing `from-[hsl(38,35%,12%)]` palette (renders in 0ms, no network)
- JBJ full logo (`jbj-fulllogo-light.png`, already imported on line 13)
- Company tagline: "Your Gateway to Dubai's Finest Real Estate"
- Subtle gold decorative accents (reuses existing gold orb/line patterns)
- A gentle shimmer animation suggesting content is loading

This feels **intentional** — like a branded splash screen, not a random stock photo.

**Transition:** When video fires `onCanPlay`, the fallback fades out (opacity 0) over 0.8s (existing transition), revealing the video beneath.

### Changes

**Single file modified:** `src/pages/Index.tsx`

1. **Remove** the `<img src={heroFallbackDubai}>` element (lines 164-170)
2. **Replace** with a branded fallback div containing:
   - The existing gradient background (already on the parent div, line 163)
   - Centered JBJ logo (already imported as `jbjFullLogoLight`)
   - Tagline text
   - Subtle gold pulse animation
3. **Add fade-out** to the fallback div when video is ready (use the same `onCanPlay` pattern already on line 185)
4. **Keep** the video element and its existing crossfade logic unchanged
5. **Keep** the `heroFallbackDubai` import as the video `poster` attribute (browser-native fallback for the `<video>` tag itself)

### State Logic
- New state: `const [videoLoaded, setVideoLoaded] = useState(false)`
- `onCanPlay` sets both `e.currentTarget.style.opacity = '1'` (existing) AND `setVideoLoaded(true)`
- Fallback div: `opacity: videoLoaded ? 0 : 1` with `transition: opacity 0.8s`

### No Database Changes

### Testing Steps
1. Visit `/` — branded fallback (logo + tagline on dark gradient) appears instantly
2. Wait for video to load — smooth 0.8s crossfade to video
3. Throttle network to Slow 3G in DevTools — fallback stays visible longer, feels intentional
4. Disable video entirely — fallback remains as permanent display (no broken state)

