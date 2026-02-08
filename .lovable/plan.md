
# Fix Meet The Team Hero Layout - Push Photos Below Header

## Issue Identified

The employee photo collage in the Meet The Team hero section is positioned too high, causing it to sit directly under the transparent header. The current layout has:

1. **Badge** → immediately starts content
2. **TeamHeroCollage** → placed right after badge, too close to top
3. **Title/CTA** → at the bottom

The hero uses `flex items-center justify-center` which centers all content vertically, but the collage needs more top spacing to clear the header area.

---

## Root Cause

In `src/pages/MeetTheTeam.tsx` (lines 301-322):
```tsx
<div className="container mx-auto px-4 relative z-10 py-16 md:py-24">
  <motion.div ... className="flex flex-col items-center">
    {/* Badge at top - minimal height */}
    <motion.div variants={fadeInUp} className="mb-6 text-center">
      <Badge>Our Team</Badge>
    </motion.div>

    {/* PHOTO COLLAGE - appears right after badge, too high */}
    <motion.div variants={fadeInUp} className="w-full mb-10">
      <TeamHeroCollage />
    </motion.div>
    ...
  </motion.div>
</div>
```

The container has `py-16 md:py-24` padding, but this isn't enough to push the collage below the transparent header (which overlays the hero).

---

## Solution

### Option A: Add Top Spacer (Recommended)

Add a dedicated spacer div before the badge to push all content down and ensure the video is visible at the top:

```tsx
<div className="container mx-auto px-4 relative z-10 py-16 md:py-24">
  <motion.div ... className="flex flex-col items-center">
    
    {/* SPACER - Push content below header area */}
    <div className="h-16 md:h-20 lg:h-24" />
    
    {/* Badge */}
    <motion.div variants={fadeInUp} className="mb-6 text-center">
      <Badge>Our Team</Badge>
    </motion.div>

    {/* Photo Collage - now properly spaced from header */}
    <motion.div variants={fadeInUp} className="w-full mb-10">
      <TeamHeroCollage />
    </motion.div>
    ...
  </motion.div>
</div>
```

### Option B: Increase Container Padding

Change the container padding to push content further down:
```tsx
<div className="container mx-auto px-4 relative z-10 pt-28 md:pt-36 lg:pt-40 pb-16 md:pb-24">
```

This ensures the top padding accounts for the header height (~80-100px) plus additional breathing room.

---

## Implementation Plan

### File: `src/pages/MeetTheTeam.tsx`

**Changes to lines 301-314:**

1. Increase top padding on the container from `py-16 md:py-24` to `pt-24 md:pt-32 lg:pt-36 pb-16 md:pb-24`
2. This provides sufficient clearance for the transparent header (which is ~80-100px tall)
3. The collage will now sit in the middle of the hero with video visible at the top

**Before:**
```tsx
<div className="container mx-auto px-4 relative z-10 py-16 md:py-24">
```

**After:**
```tsx
<div className="container mx-auto px-4 relative z-10 pt-24 md:pt-32 lg:pt-36 pb-16 md:pb-24">
```

This asymmetric padding (more on top) ensures:
- Video is visible at the very top (under the transparent header)
- Photo collage starts in the upper-middle area of the hero
- Title and CTA button appear in the lower portion
- Natural visual flow: Video → Photos → Title → CTA

---

## Visual Summary

**Before (Current - Broken):**
```
┌─────────────────────────┐
│ [Header - Transparent]  │
├─────────────────────────┤ ← Photos touching this line
│ Badge                   │
│ ○○○○○ ← Collage too high│
│ ○○○○○○                  │
│ ○○○○○○○                 │
│ Title: Meet Experts     │
│ [Contact Us Button]     │
│                         │
└─────────────────────────┘
```

**After (Fixed):**
```
┌─────────────────────────┐
│ [Header - Transparent]  │
│                         │ ← Video visible here
│                         │
│ Badge                   │
│ ○○○○○ ← Collage centered│
│ ○○○○○○                  │
│ ○○○○○○○                 │
│ Title: Meet Experts     │
│ [Contact Us Button]     │
└─────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/MeetTheTeam.tsx` | Increase top padding on hero container to push content below header |

---

## Technical Details

- Header height: ~80-100px (varies by viewport)
- Current top padding: 64px (py-16) / 96px (md:py-24)
- New top padding: 96px (pt-24) / 128px (md:pt-32) / 144px (lg:pt-36)
- This ensures ~50-60px of video is visible between header and content
