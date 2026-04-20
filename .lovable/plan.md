

## Fix: Hero overlap & ghosted "Your Gateway…" headline

### Root cause (confirmed in `src/pages/Index.tsx`)
Two layers render the same copy at the same vertical position:

1. **Fallback layer** (lines 166–201, `z-[1]`) — shows while `videoLoaded === false`. Renders the centered monogram + the words **"Your Gateway to Dubai's Finest Real Estate"** + "Loading experience…".
2. **Hero content layer** (lines 250+, `z-10`) — always rendered. Contains the eyebrow + the SAME headline **"Your Gateway to Dubai's Finest Real Estate"** + 5 CTA pills + 3 pillar cards.

Because the fallback has no opaque cover and the gold-gradient headline is semi-transparent, the fallback's centered tagline ghosts through the live headline → the doubled "Your Gateway…" effect visible in your screenshot. The eyebrow also visually overlaps the fading monogram watermark behind it. On the 1041px viewport the 5 CTAs wrap into a tight cluster against the headline.

### Fix

**File: `src/pages/Index.tsx`**

1. **De-duplicate the fallback** — remove the tagline and "Loading experience…" copy from the fallback layer. Keep only the pulsing monogram + shimmer line so the loading state stays branded but never collides with the real headline.
   - Delete lines ~185–199 (tagline `<p>` + shimmer + loading micro-label)
   - Keep the monogram (lines 175–183) and a single subtle shimmer bar
   
2. **Hide the fallback the moment hero content mounts** — wrap the fallback in `{!videoLoaded && ...}` (already there) AND add a fast fade-out by rendering the live hero with a slightly delayed-in opacity so users never see both stacked. Simpler fix: give the fallback `z-[1]` and ensure the real content sits on a faint backdrop blur card so any leftover bleed-through is invisible.

3. **Tighten the CTA grid on tablet (768–1100px)** — the current `sm:flex sm:flex-wrap sm:justify-center` lets the 5 buttons wrap awkwardly. Change to:
   - Mobile: `grid grid-cols-2` (keep)
   - Tablet (sm–lg): `grid grid-cols-3` with the 4th & 5th items spanning to center
   - Desktop (lg+): `flex flex-wrap justify-center`
   
   This eliminates the "5 buttons crammed into one line under the headline" crowding visible at 1041px.

4. **Add vertical breathing room** between eyebrow → headline → CTAs at the tablet breakpoint:
   - Change `space-y-5 sm:space-y-6` to `space-y-5 sm:space-y-7 md:space-y-8`
   - Reduce `pt-[max(14vh,96px)] sm:pt-[22vh]` slightly so the whole stack doesn't push pillars off-screen

5. **Eyebrow contrast** — the "DUBAI'S TRUSTED REAL ESTATE TECHNOLOGY PLATFORM" line currently relies on `text-white` + textShadow but the giant fallback monogram glow behind it muddies it. Once step 1 removes the centered fallback elements that overlap, this becomes legible. Add a tighter `letter-spacing` and a stronger `textShadow: '0 2px 16px rgba(0,0,0,0.85)'` for safety.

### Files touched
- `src/pages/Index.tsx` (hero section only, lines ~162–327)

### Deliverable
- No ghosted/doubled headline at any viewport (mobile 390, tablet 1024/1041, desktop 1440)
- No overlap between eyebrow and the monogram watermark
- 5 CTA pills lay out cleanly at every breakpoint (no awkward 4+1 wrap on tablet)
- Loading fallback stays branded (monogram + shimmer) but no copy that competes with the real headline
- Live screenshots at 390×844, 1041×769, and 1440×900 confirming the fix

