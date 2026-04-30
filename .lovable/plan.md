# Fix: Buttons & Text Rendering as Solid Black on Champagne/Gold Surfaces

## Root cause

`src/index.css` still contains a large legacy block (lines ~2380–2455) from the old **monochrome** era that aggressively kills the gold theme with `!important` rules. The current design system is **champagne + gold**, so these rules now actively break it.

Key offenders:

```css
/* line 2396–2405 */
.text-gold        { color: #111111 !important; }
.bg-gold          { background-color: #111111 !important; color: #fff !important; }
.border-gold      { border-color: #d4d4d4 !important; }
.fill-gold        { fill: #111111 !important; }

[class*="bg-gold\/"]      { background-color: rgba(0,0,0,0.05) !important; }
[class*="border-gold\/"]  { border-color: rgba(0,0,0,0.12) !important; }
[class*="text-gold\/"]    { color: rgba(0,0,0,0.85) !important; }
[class*="ring-gold"]      { --tw-ring-color: #d4d4d4 !important; }

/* line 2412–2424 */
svg.text-gold, [class*="text-gold"] > svg { color: #111111 !important; }

/* line 2438–2440 */
[class*="via-gold"]  { --tw-gradient-via: #e5e5e5 !important; }
[class*="from-gold"] { --tw-gradient-from: #e5e5e5 !important; }
[class*="to-gold"]   { --tw-gradient-to: #d4d4d4 !important; }

/* line 2443–2454 */
[style*="#D4AF37"], [style*="#C8A766"], [style*="#B8860B"] { color: #111 !important; border-color: #d4d4d4 !important; }
[class*="shadow-[0_..._rgba(200,167,102..."], [style*="rgba(200,167,102"] { box-shadow: ... !important; }
```

Every CRM and dashboard component built since the champagne migration uses `bg-gold`, `bg-gold/20`, `text-gold`, `from-gold`, etc. — these all get force-flattened to black/gray, producing the "filled with black" appearance the user sees on the Add Brokerage button hover/active state and similar gold pills, badges, gradient bars, and tab indicators across the site.

A second, narrower problem: `.bg-gold svg` (line 2430) forces icons inside *anything* with class `bg-gold` to white — fine for solid gold tiles, but the same selector now collides because `.bg-gold` itself was forced to `#111111` background (above), so any deliberate "champagne tile with dark icon" combination is corrupted.

## Plan

### 1. Delete the legacy "kill-gold" block

Remove lines ~2388–2455 in `src/index.css` (the entire "Tailwind gold utility class overrides", "Gold opacity variants", "Global icon contrast unification (gold)", "Gold gradient stops", "Inline style gold hex overrides", and "Gold shadow overrides" sections). These were written when the brand was monochrome and have no place in the current champagne/gold system.

What replaces them: the Tailwind theme tokens already render `bg-gold = #B89555`, `text-gold = #B89555`, etc., correctly. No override is required.

### 2. Replace with a tight, modern contrast guard

In the same location, add a small, surgical rule set that prevents the only legitimate failure modes:

- Solid-gold tile (`.bg-gold`, `bg-[#B89555]`, `bg-[#A68444]`) → force white text on direct text children (existing memory rule already covers this).
- Solid-ink tile (`.bg-[#1A1A1A]`, `bg-black`, `bg-zinc-900/950`) → force white text on direct text children.
- Faded text classes that are banned by the "Faded Gold Prohibition" memory (`text-gold/10..50`) → upgrade to solid `#1A1A1A` on champagne, solid `#FDE68A` on dark.

This keeps the protection the legacy block was originally trying to provide, but without nuking the entire gold theme.

### 3. Audit Button variants for the same trap

Verify in `src/components/ui/button.tsx`:
- `variant="gold"` → `bg-[#B89555] text-white` (correct, but uses arbitrary value so the new guard above is the safety net).
- `variant="primary"` → `bg-[#1A1A1A] text-white` (correct).
- `variant="hero"` hover state → `hover:bg-[#FDFBF7] hover:text-[#1A1A1A]` (correct, fix any cases where hover lacked an explicit text color).

No structural change — just confirm every variant pairs background + text + hover-text, so the global guard never has work to do.

### 4. Run the white-on-light + faded-gold static checks

The repo already ships two CI scripts:
- `scripts/contrast/check-white-on-light.mjs`
- `scripts/check-faded-gold.mjs`

Run both after the CSS changes; fix any new violations they flag (most likely a handful of `text-gold/40` → `text-[#1A1A1A]` swaps).

### 5. Smoke-test surfaces most likely affected

Visually verify:
- `/crm` Brokerages tab — Add Brokerage button (the reported case), tab pills, "UAE Directory" badges.
- `/owner/inbox` and Sent History tabs — the new tab strip.
- Property cards — price chip (orange), gold corner ribbon, developer logo container.
- Footer — gold hairline divider.
- Any hero with `data-surface="dark"` — buttons must stay white-on-dark.

## Technical details

Files touched:
- `src/index.css` — remove ~70 lines (legacy block), add ~25 lines (modern guard).
- `src/components/ui/button.tsx` — only if the variant audit finds a missing hover text color; otherwise untouched.

No DB changes. No component rewrites. The fix is purely a CSS regression caused by stale global overrides.

After this change, the "Add Brokerage" button (and every other `variant="gold"` CTA, gold badge, gold gradient, gold icon, and `text-gold` label) renders with the intended champagne-gold appearance and white text — no more black-fill artifacts on normal or hover states.