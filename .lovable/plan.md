

## Root cause

Global CSS rule **1b** in `src/index.css` (lines ~2299–2314) force-darkens any `.text-white` element sitting inside a light container (`.bg-white`, `.bg-card`, champagne gradients, etc.). The rule has a self-only escape hatch: it skips elements that carry `.bg-black`/`.bg-gold`/`.bg-gray-900` **on themselves**.

The trap: when a dark `<Button class="bg-black text-white">` wraps content in a child `<span class="text-white">` (very common pattern for icons + label), the span has no `bg-*` class of its own, so the rule applies and turns it black — black text on a black button = invisible.

The selected element on `SupportTicketBox.tsx` line 498 is exactly this case:
```tsx
<Button className="bg-black text-white …">
  <span className="flex items-center gap-2">
    <PremiumHeadsetIcon … />
    <span className="text-white font-bold">Create Support Ticket</span>  ← force-darkened
  </span>
</Button>
```

This same trap fires on every `bg-black`/`bg-gray-900`/`bg-zinc-900` button across the app whose label is wrapped in a nested `<span class="text-white …">` — that's the "globally broken contrast" the user is seeing.

## Fix — global, one-shot, no per-component churn

### 1. Patch CSS rule 1b in `src/index.css` to honor the nearest ancestor

Change the `:not(.bg-black)…` self-only exclusions into ancestor-aware exclusions using `:where(…) *` so any descendant of a dark surface is left alone:

```css
/* BEFORE — only checks the element itself */
:root:not(.dark) :is(.bg-white, .bg-card, …):not([data-surface="dark"])
  :is(.text-white, [class*="text-white/"])
    :not(.bg-black):not([class*="bg-black"]):not(.bg-gold)…

/* AFTER — also skip if any ancestor is a dark surface */
:root:not(.dark) :is(.bg-white, .bg-card, …):not([data-surface="dark"])
  :is(.text-white, [class*="text-white/"]):not(.bg-black):not([class*="bg-black"])…
{ … }

/* Restore white inside any dark ancestor (button, badge, pill, chip) */
:root:not(.dark) :is(
  .bg-black, [class*="bg-black"],
  .bg-gray-900, .bg-gray-950, .bg-zinc-900, .bg-zinc-950,
  .bg-slate-900, .bg-slate-950,
  .bg-primary, .bg-foreground,
  [data-surface="dark"]
) :is(.text-white, [class*="text-white/"]) {
  color: #FFFFFF !important;
  opacity: 1 !important;
  --tw-text-opacity: 1 !important;
}
```

That second block is the global "white survives inside dark ancestors" rescue. Because it lives in the same cascade layer and is more specific (descendant selector with explicit dark surface), it overrides the force-darken rule for every button/badge/chip whose ancestor is dark — without us having to touch any component.

Same patch applied to rule **1d** (champagne gradient white-text override) for the same reason.

### 2. Mirror the rescue for icons/SVGs

Add an equivalent rule so `text-gold`, `text-white/80`, etc. inside dark ancestors aren't pulled to gray by the global "force solid" SVG rules around line ~2200. Just add the same dark-ancestor scope.

### 3. Tighten the gold→black force-rule for buttons

The rules at lines 2187–2196 turn `.text-gold` everywhere into near-black. That's correct on light surfaces but breaks gold icons inside dark buttons. Add the dark-ancestor escape:

```css
:where(.bg-black, [class*="bg-black"], .bg-gray-900, .bg-zinc-900, [data-surface="dark"]) :is(.text-gold, [class*="text-gold/"]) {
  color: hsl(var(--gold)) !important;
}
```

This restores gold accents inside dark CTAs (e.g. the InvestorDashboard "Create Support Ticket" row that uses `<HelpCircle className="text-gold">` on a non-dark button — that one will fall back to black, which is still readable; no regression).

### 4. Audit + cleanup pass on known offenders (no behavior change)

Quick sweep of components matching `bg-black.*text-white` button + nested `<span class="text-white">` so they keep working even if step 1 ever regresses. Targets identified so far:

- `src/components/SupportTicketBox.tsx` (line 498) — the selected element
- Any `Button` in components that wrap the label in `<span className="text-white …">` — search will enumerate during implementation; I'll either remove the redundant `text-white` on the inner span (it inherits from the button) or add `bg-transparent` won't help, so the rule rewrite in step 1 is the real fix and these become belt-and-suspenders.

No labels, icons, or layouts change. Just removing the redundant `text-white` on inner spans where the parent already enforces it — purely defensive.

### 5. QA matrix

After the change I'll mentally walk these surfaces to confirm no regressions:

| Surface | Expected |
|---|---|
| `bg-black` Button on white card | White label, gold icon visible |
| `bg-black` Button on dark hero | White label (already worked) |
| White `Button variant="primary"` on white card | Black label (unchanged) |
| Champagne hero with white H1 (no inner bg) | Force-darkened to black (unchanged — rule 1d still applies since H1 has no dark ancestor) |
| Toast / dialog buttons (`bg-zinc-800`) | White label (newly fixed) |
| Badges with `bg-gray-900 text-white` inside light cards | White label (newly fixed) |

## Files touched

- **`src/index.css`** — rewrite rules 1b, 1d, the gold force-rule, and add the "dark-ancestor rescue" block. ~30 lines.
- **`src/components/SupportTicketBox.tsx`** — drop redundant `text-white` from inner span on line 498 (defensive, optional).
- A focused `code--search_files` sweep during implementation will surface any other inner `<span class="text-white">` inside dark buttons; trivial defensive cleanup only if found, no functional changes.

## Out of scope

- No changes to the Button variants in `src/components/ui/button.tsx` — they're correct.
- No changes to dark-surface rules (section 2) — they already work.
- No changes to brand colors, layout, or any component logic.
- No removal of any features per the No-Removal policy.

