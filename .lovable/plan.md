

# Replace Digital Business Card Video with Approved YouTube Video

## What Changes

### 1. Replace self-hosted MP4 with YouTube embed in DigitalCard.tsx

The Company Introduction section in the digital business card currently uses a self-hosted MP4 file (`jbj-company-intro.mp4`). This will be replaced with the approved YouTube video (`lBXXdJ2kAtQ`) -- the same one used on the Company Profile page.

**Changes in `src/pages/DigitalCard.tsx`:**

- **Remove** the MP4 video import (line 16): `const jbjIntroVideo = new URL(...)` 
- **Remove** the monogram poster import (line 19) if no longer needed elsewhere
- **Remove** the `videoRef` (line 155) and `handleVideoEnd` function (lines 207-213) since they are only used for the MP4 player
- **Replace** the `<video>` element (lines 392-403) with a YouTube `<iframe>` embed pointing to `https://www.youtube.com/embed/lBXXdJ2kAtQ`
- The iframe will match the existing `aspect-video` container and rounded styling

**Before (MP4 player):**
```html
<video ref={videoRef} controls poster={...} onEnded={handleVideoEnd} playsInline>
  <source src={jbjIntroVideo} type="video/mp4" />
</video>
```

**After (YouTube embed):**
```html
<iframe
  className="absolute inset-0 w-full h-full"
  src="https://www.youtube.com/embed/lBXXdJ2kAtQ"
  title="JBJ Global Real Estate - Company Introduction"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowFullScreen
/>
```

### 2. Clean up unused references

- Remove the `Video` icon import only if it is not used elsewhere (it is used in the section header, so it stays)
- Remove `useRef` import if `videoRef` was the only ref in the component

## Summary

One file changed: `src/pages/DigitalCard.tsx`. The self-hosted MP4 video is replaced with the approved YouTube company introduction video (`lBXXdJ2kAtQ`), matching what appears on the Company Profile page. The digital card remains independent of the Founder Visibility toggle.
