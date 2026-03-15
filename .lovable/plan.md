

## Explanation of the Mode Dropdown Question

Here is what that question was about, in simple terms:

Your platform has **two places** where the user can switch modes (Investor / Broker / Developer / etc.):

1. **Top utility bar** (first row) — uses `ModeSwitcher.tsx`. This dropdown shows each mode with its **unique icon** (User, Briefcase, Users, Building2), **unique color** (green, blue, purple, amber), and a **description** of what each mode does.

2. **Filter bar** (second row, the black connected bar) — uses `ConnectedModeButton` inside `FilterShortcutBar.tsx`. This dropdown looks **almost the same** but uses the **same generic icon** (Users) for all four modes instead of the unique icons per mode.

**The question was simply:** Should I make dropdown #2 use the **exact same icons per mode** as dropdown #1 (User icon for Investor, Briefcase for Broker, Building2 for Developer, etc.)?

**Current status:** In the last edit, I already aligned the descriptions and colors. The only remaining inconsistency is the **per-mode icons** — the filter bar uses the generic `Users` icon for all modes instead of the distinct icons from `ModeSwitcher.tsx` (User, Briefcase, Users, Building2).

### Plan

**Single fix** — Update `ConnectedModeButton` in `FilterShortcutBar.tsx` to use the correct per-mode icons:
- Investor → `User` icon (person)
- Broker → `Briefcase` icon
- Investor + Broker → `Users` icon (two people)
- Developer → `Building2` icon

This matches exactly what the top bar shows. No other changes needed — colors, descriptions, and layout are already aligned.

**File:** `src/components/filters/FilterShortcutBar.tsx` — `ConnectedModeButton` function (lines 906-996)

