# Fix: OwnerTasksPopupAlert contrast-guard regression

## Problem
`src/components/owner-dashboard/OwnerTasksPopupAlert.tsx` still has three elements that occasionally render with poor/invisible contrast:
1. The `AlertTriangle` icon inside the dark champagne tile (gold on near-black tile gets rewritten by the runtime guard).
2. The `X` close icon.
3. The "View Tasks" / "Later" button labels.

The component source already sets the right colors. The issue is the runtime `contrastGuard` (`src/utils/contrastGuard.ts`) walks the DOM after route changes / mutations and rewrites `color` on any descendant of the outer `role="dialog"` wrapper that doesn't carry `data-no-contrast-guard`. The inner card has the opt-out, but the outer wrapper does not, so the guard still traverses into it.

## Fix (single file: `src/components/owner-dashboard/OwnerTasksPopupAlert.tsx`)

1. Add `data-no-contrast-guard` to the outer `role="dialog"` wrapper (currently only the inner card has it).
2. Add `data-no-contrast-guard` + explicit `style={{ color: "#B89555" }}` on the `AlertTriangle` icon so its gold color survives on the near-black tile.
3. Re-confirm explicit `style={{ color: "#FFFFFF" }}` on the `View Tasks` label span and its `ArrowRight` svg (already present — verify after edit).
4. Re-confirm explicit `style={{ color: "#1A1A1A" }}` on the `X` svg (already present — verify after edit).

No other files touched. No CSS or guard-engine changes — this keeps the sitewide guard intact and only exempts this one modal where authored colors are already correct.

## Verification
- Open `/owner` with at least 1 pending task (or `/owner/crm/relationships` which mounts the same shell).
- Confirm: AlertTriangle visible (gold) on dark tile, X visible (ink) on champagne pill, "View Tasks" label visible (white) on ink button, "Later" label visible (ink) on champagne button.
- Screenshot before/after via `browser--screenshot`.
