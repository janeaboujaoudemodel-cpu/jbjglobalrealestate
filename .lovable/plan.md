

## Fix Plan: AI Home Finder Floating + Chat Pulse Visibility

### Root Cause Analysis

**AI Home Finder — Float not working:**
- The `jbj-float` CSS animation is applied on the same `motion.div` that uses Framer Motion's `whileInView` and `whileHover`. Framer Motion takes control of the `transform` property, which **overrides and kills** the CSS keyframe animation entirely.
- **Fix:** Move the `animation: jbj-float` to an **inner wrapper div** (not the motion.div), so Framer Motion entry animation and the CSS float animation don't conflict.

**Chat Pulse — Not visible:**
- On desktop, `showAttentionPulse` is `true` after the scroll delay, which renders the **banner mode** (the wide card with text). The circle button with the pulse ring **only renders when `showAttentionPulse` is false** — meaning the pulse ring is never seen by the user on initial load.
- **Fix:** Add an elegant gold pulse ring to the **banner mode** as well, so the pulse is visible regardless of which mode is active. Also increase the pulse ring visibility (slightly larger scale, better opacity range).

---

### Files Modified

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Wrap card content in a new inner div with `jbj-float` animation; remove animation from the motion.div |
| `src/components/chat/CollapsedChatButton.tsx` | Add pulse ring div to the banner (showAttentionPulse) mode; increase circle pulse ring visibility |
| `src/index.css` | Adjust `jbj-pulse-ring` keyframe for better visibility (scale 1→1.35, opacity 0.7→0) |

### Technical Detail

**Index.tsx (lines 424-432):**
- Remove `animation: 'jbj-float ...'` from the `motion.div` style prop
- Add a new `<div style={{ animation: 'jbj-float 6s ease-in-out infinite' }}>` wrapping the inner card content

**CollapsedChatButton.tsx (lines 78-112):**
- Inside the banner mode's `<div className="relative">` (line 79), add a pulse ring: `<div className="absolute -inset-1 rounded-xl border-2 border-gold/30 animate-[jbj-pulse-ring_2s_ease-in-out_infinite]" />`
- On the circle mode pulse ring (line 116), increase from `inset-0` to `-inset-1` for better visibility beyond the button edge

**index.css (lines 1950-1954):**
- Change scale from `1.25` to `1.4` and starting opacity from `0.6` to `0.7` for a more noticeable pulse

