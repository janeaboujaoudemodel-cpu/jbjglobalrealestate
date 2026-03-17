

## Fix: Ultra Calm Chat Pulse

The current `jbj-glow-pulse` animation at 7.2s is still too fast and aggressive. The user wants an "ultra calm" effect — barely perceptible, like a slow breathing glow.

### Changes

**`src/index.css` (lines 1956-1976) — Replace `jbj-glow-pulse` keyframes:**
- Increase cycle to **12s** (very slow breathing)
- Reduce max shadow spread from 18px/34px to **8px/16px**
- Reduce max opacity from 0.24 to **0.12** at start, fading to 0 at peak
- Use only 2 stages (0% → 50% → 100%) for a smooth sine-wave feel, not 3 choppy stages
- Result: a gentle, almost imperceptible gold glow that slowly breathes in and out

New keyframes:
```css
@keyframes jbj-glow-pulse {
  0%, 100% {
    box-shadow:
      0 0 0 0 hsl(var(--gold) / 0),
      0 4px 16px -8px hsl(var(--gold-dark) / 0.1);
  }
  50% {
    box-shadow:
      0 0 0 8px hsl(var(--gold) / 0.08),
      0 0 0 16px hsl(var(--gold-light) / 0.03),
      0 8px 24px -8px hsl(var(--gold-dark) / 0.12);
  }
}
```

**`src/components/chat/CollapsedChatButton.tsx` (lines 84, 120):**
- Change animation duration from `7.2s` to `12s`
- Change easing from `cubic-bezier(0.16,1,0.3,1)` to `ease-in-out` (smoother sine wave for slow animations)

Both the banner mode (line 84) and circle mode (line 120) get updated.

### Result
A barely-there, ultra-slow gold glow that breathes every 12 seconds — premium and calming, no eye strain.

