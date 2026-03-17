

## Fix Plan: Chat Pulse + AI Home Finder Float

### Problem 1: Chat Pulse — Rectangle expanding outward
The current `jbj-pulse-ring` animation uses `transform: scale()` on a bordered div. This scales the entire element including its rectangular/rounded shape, creating an ugly box that grows and shrinks. This is not a pulse — it's a scaling rectangle.

**Fix:** Replace the border-based scale approach with a proper **box-shadow glow pulse**. Instead of scaling a bordered div, use a single element with `box-shadow` that radiates outward like a real pulse. No separate pulse div needed — apply directly to the button container.

- Remove the separate `absolute -inset-1 rounded-xl border-2 border-gold/30 animate-[...]` div entirely (both banner and circle modes)
- Apply a `box-shadow` pulse animation directly on the interactive element
- New keyframe `jbj-glow-pulse`: alternates between `box-shadow: 0 0 0 0 rgba(200,167,102,0.5)` and `box-shadow: 0 0 20px 10px rgba(200,167,102,0)` — a radial gold glow that fades outward
- For the banner (rounded-xl): glow radiates smoothly from the card edges
- For the circle (rounded-full): glow radiates as a perfect circle

### Problem 2: AI Home Finder Float — Not visibly floating
`translateY(-8px)` over 6s is too subtle to notice. The animation also fights with `translateZ(20px)`.

**Fix:** Make the float premium and obvious:
- Increase amplitude: `translateY(0)` → `translateY(-14px)` (nearly double)
- Reduce period: 6s → 4s (faster = more noticeable)
- Add a **shadow shift** that follows the float: when card floats up, shadow grows larger and softer (simulating lifting off surface)
- New keyframe combines Y movement + shadow: at 50% position, `box-shadow` expands from `0 8px 30px rgba(200,167,102,0.15)` to `0 20px 50px rgba(200,167,102,0.25)`
- Remove `translateZ(20px)` from the keyframe (unnecessary, causes issues)

### Files to modify

| File | Change |
|------|--------|
| `src/index.css` | Replace `jbj-pulse-ring` with `jbj-glow-pulse`; enhance `jbj-float` amplitude + shadow |
| `src/components/chat/CollapsedChatButton.tsx` | Remove separate pulse ring divs; add glow-pulse class to the button elements directly |
| `src/pages/Index.tsx` | Update float animation reference if keyframe name changes; adjust shadow on float wrapper |

