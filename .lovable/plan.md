
The user selected the "Noticed something incorrect?" text in `ReportIssueButton.tsx`. The banner uses `backdrop-blur-sm` on a semi-transparent red gradient — but the parent section likely has its own backdrop blur, causing text to appear blurred/washed out.

Looking at the current code (line 81):
```tsx
<div className={`rounded-2xl border-2 border-red-500/50 bg-gradient-to-br from-red-950 via-red-900/95 to-red-950 p-5 ... backdrop-blur-sm ...`}>
```

The issue: `backdrop-blur-sm` blurs whatever is BEHIND the element. When the parent already has a blurred background (or the section has `backdrop-blur`), stacking blurs makes child text appear muddy. Also `bg-red-900/95` is semi-transparent which lets the blur bleed through.

## Root cause
`backdrop-blur-*` on text-bearing containers + transparent backgrounds = blurred/illegible text overlays. This is the same family of bug as the white-on-light sweep — a global readability anti-pattern.

## Fix scope

### 1. Immediate fix — `ReportIssueButton.tsx`
- Remove `backdrop-blur-sm` from the banner
- Make background fully opaque: `bg-red-900` instead of `via-red-900/95`
- Ensure text has solid contrast (no opacity tricks on the heading)

### 2. Site-wide audit — find all `backdrop-blur` on containers holding readable text
Search for the anti-pattern:
- `backdrop-blur-*` combined with text content (not just decorative overlays)
- Especially on cards/banners/modals where the parent is already blurred or has gradient overlays

Likely offenders to check:
- Other report/alert banners
- Floating cards on hero sections
- Modal headers over blurred backdrops
- Glass-morphism cards on project detail / property detail pages

### 3. Global safety net (`src/index.css`)
Add a rule alongside the existing white-on-light safety net:
- Any element with `backdrop-blur-*` AND containing text should have a minimum background opacity floor (e.g., `bg-opacity ≥ 0.92`) OR remove the blur if the text would be unreadable.
- Practically: target known patterns and force `backdrop-filter: none` on text-heavy containers nested inside already-blurred parents.

## Files to edit
1. `src/components/project-detail/ReportIssueButton.tsx` — remove blur, opaque bg
2. Sweep `src/**` for `backdrop-blur` + text combos and patch the worst offenders (banners, alerts, info cards)
3. `src/index.css` — add a rule preventing nested `backdrop-blur` stacking on text containers

## Deliverable
- Crisp, fully readable "Report an Issue" banner
- List of other components patched
- Global CSS rule preventing future blur-on-blur readability bugs
