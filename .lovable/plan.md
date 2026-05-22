## What's wrong

The launcher in `VoiceConciergeWidget.tsx` (lines 354-377) renders a cream/champagne gradient pill with stacked muddy-gold eyebrow (`text-[#8a6f2e]` — adjacent to the banned faded-gold range) plus two lines of small text. It reads as cheap on both desktop and mobile, and on small viewports the full two-line label crowds the screen.

## Fix (single file: `src/components/VoiceConciergeWidget.tsx`)

### Desktop / tablet — premium pill
- Replace the light champagne gradient with an **ink pill** (`bg-[#1A1A1A]`) + 1px gold hairline (`border border-[#B89555]/45`) + soft elevation shadow. This matches the site's premium ink-on-champagne language and is consistent with the existing payment-plan square / CTA system.
- Icon disc: small circular `bg-[#B89555]/15` with 1px gold hairline, gold phone icon (`text-[#B89555]`). Keeps "no gold fills" (it's a translucent tint, not a solid gold surface).
- Live indicator: tiny pulsing emerald dot (`#10B981`) in front of a single short label — replaces the stacked "Live · Free / Call our agent" two-liner.
- Single label, sentence-case: **"Call our agent — Free"** in cream (`text-[#FDFBF7]`), `text-[13px]`, `font-semibold`, tracked tight. No uppercase eyebrow.
- Hover: subtle scale 1.02, gold hairline brightens to `/70`, no color flip.
- Keep `aria-label`, `aria-expanded`, disabled state, and the connecting spinner inside the icon disc.

### Mobile — icon-only FAB
- Use Tailwind responsive utilities: text label wrapped in `hidden sm:inline-flex`, button padding compresses to `p-3` on mobile so the pill collapses into a perfect circular 44×44 ink FAB with just the gold phone icon (still meets a11y touch target).
- The connecting spinner and live dot stay visible on mobile (dot moves to the top-right of the FAB as a small ring badge so the "live/free" affordance isn't lost).
- The minimize "X" stays at `-top-2 -right-2` and the speaking ring keeps working.

### What does NOT change
- The connected/active state (line 379+), the WhatsApp side-panel, the underlying conversation logic, and props remain identical.
- The component is the only place this launcher lives, so the change propagates to every page that mounts the widget.

## Technical notes

- One file edited: `src/components/VoiceConciergeWidget.tsx` lines ~354-377.
- Colors used: `#1A1A1A` (ink), `#B89555` (canonical gold), `#FDFBF7` (cream), `#10B981` (emerald live dot). No banned muddy-gold hex; CI `check-faded-gold` will pass.
- "No gold fills" rule preserved: gold only as 1px hairline + icon stroke + 15%-tinted disc background.
- Tailwind only, no new deps, no CSS changes.
