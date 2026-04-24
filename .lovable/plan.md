## Goal

Make the mode dropdown look genuinely premium and color-coded, and make the closed trigger button **clearly reflect** the selected mode color in every placement (header utility bar, footer, account mega-menu).

The previous fix only changed text color and used a near-white pastel background, which is why all four rows still look the same gray/white in the screenshots you saw.

---

## 1. Rebuild the dropdown rows so each mode is unmistakable
**File:** `src/components/ModeSwitcher.tsx`

Visual problems in the current build:
- All four row backgrounds are near-white (`#FFF7ED`, `#EFF6FF`, `#F0FDF4`, `#F5F3FF`) → on a white panel they all read identical.
- Default border color uses the very pale `iconBorder` token → no chromatic edge.
- `gap-2` (8px) is too tight for "premium card stack" feel.
- No per-mode visual anchor (no left accent bar, no tinted icon halo, no active ribbon).

Changes:
- Increase the row container spacing to `gap-3` (12px) and add `py-1` padding inside the menu so cards visibly breathe.
- Replace the soft `lighter` row background with a stronger 2-stop tinted fill per mode:
  - Investor: linear-gradient from `#FFF1E0` → `#FFE0BF` (warm orange wash)
  - Broker: linear-gradient from `#E8F0FE` → `#CFE0FB` (clear blue wash)
  - Investor + Broker: linear-gradient from `#E5F8EC` → `#C7EFD3` (clear green wash)
  - Developer: linear-gradient from `#F1ECFE` → `#DDD0FB` (clear purple wash)
- Always show the full saturated `base` color on the row border (`borderColor: config.base`), not just on hover/active.
- Add a 4px left accent bar inside each card (using `boxShadow: inset 4px 0 0 ${config.base}`) so even when the panel is small the mode color reads from the edge.
- Strengthen the icon container: solid `config.base` background, white icon, soft halo `0 0 0 4px ${config.base}22` so it pops against the tinted card.
- Active row gets a stronger ring: `0 0 0 2px white, 0 0 0 4px ${config.base}` and a "Selected" pill in the bottom-right using `config.base` background + white text + `config.label.shortLabel`. The check icon stays.
- Hover stays in the same hue family — slightly darker tint of the row (`config.light`) so it never washes out to gold or gray (no Tailwind classes that fight the inline style).
- Bump row height a little (`py-3`) and use `text-[13px]` for the title with bolder weight so each card has clear typographic hierarchy.

Result: when you open the dropdown you immediately see four distinctly colored cards with real spacing between them and an obvious selected state.

---

## 2. Make the closed trigger fully reflect the active mode
**File:** `src/components/ModeSwitcher.tsx`

Today the closed trigger uses `lighter` (e.g. `#FFF7ED`) which on the champagne header background looks almost identical across all four modes. The user explicitly wants the closed trigger to look orange / blue / green / purple.

Changes:
- Switch the trigger to a real "color chip" treatment:
  - Background: `linear-gradient(135deg, ${config.base} 0%, ${darken(config.base, 8%)} 100%)` (solid colored pill)
  - Text + chevron + icon: white (`#FFFFFF`) for high contrast on the saturated chip
  - Border: `1px solid ${config.dark}40` (subtle darker rim)
  - Shadow: `0 2px 6px ${config.base}55, inset 0 1px 0 rgba(255,255,255,0.25)` for the premium "glassed" look
- Keep the existing icon, label `Mode: <X>`, and chevron, but recolor them all to white inside the chip.
- Open state: chevron rotates 180° as today; add a subtle `ring-2 ring-${config.base}/30` glow so it reads as "active."
- The `compact` variant gets the same chip treatment at smaller scale.

Because the chip uses a solid mode color (not a pastel), the closed trigger will visibly reflect the selected mode in:
- the horizontal utility header bar (light champagne surface)
- the footer (dark obsidian surface)
- the account mega-menu card (light gray surface)

No changes are required in `HorizontalUtilityBar.tsx`, `Footer.tsx`, or `MegaMenuAccount.tsx` — they already consume the shared `ModeSwitcher` and this fix is centralized.

---

## 3. Force the dropdown panel to stay readable inside the dark footer
**File:** `src/components/ModeSwitcher.tsx`

The dropdown content is portaled to `document.body`, so the `data-surface="light"` wrapper around the trigger doesn't cover it. That's why footer-opened dropdowns can still inherit `[data-surface="dark"]` text rules (white text override) on inner spans.

Changes:
- Add `data-surface="light"` directly on the `DropdownMenuContent` (Radix passes data attrs through). This gives the portaled panel its own light-surface scope so titles, descriptions, and "Select your mode" text are guaranteed black on the white panel — no more white-on-white in the footer dropdown.
- Confirm the panel's z-index (`z-[10001]`) and `side="top"` from the footer call site keep it above the page content and above the header.

---

## 4. Premium spacing + header card inside the dropdown
**File:** `src/components/ModeSwitcher.tsx`

Refine the panel chrome itself so the rows aren't crammed against the header:
- Widen the panel from `w-80` to `w-[340px]` for breathing room.
- "Select your mode" header card gets a thin champagne hairline (`border-b border-gray-200`) and slightly more bottom margin (`mb-3`).
- Add `p-3` (instead of `p-2`) on the panel and `gap-3` on the row stack so the four colored cards never touch and form a clear "list of premium options."

---

## 5. Update memory with the new visual standard
**File:** `mem://design/mode-color-palette`

Append the new "premium chip + tinted card" rules so this never regresses:
- Trigger = solid mode-color chip with white text/icon.
- Dropdown rows = tinted gradient card + saturated border + 4px inset left accent + colored icon halo + active ring + Selected pill.
- Spacing: `gap-3` between rows, `p-3` panel padding, `w-[340px]` width.
- Centralized in `ModeSwitcher.tsx`; never overridden by placement components.

---

## 6. Strengthen the regression test
**File:** `src/components/__tests__/ModeSwitcher.colors.test.tsx`

Extend the existing test to also assert:
- The closed trigger's `backgroundColor` matches `config.base` (not the old pastel `lighter`).
- The trigger's text/icon `color` is white.
- Each dropdown row's `borderColor` matches its `config.base` even in the idle (non-hover, non-active) state.
- Row backgrounds are NOT all equal (guards against the "all four look the same" regression you reported).

---

## What the user will see after this

- **Dropdown open:** four clearly distinct premium cards — orange / blue / green / purple — with real spacing, a colored icon badge on the left, a thin colored accent bar, and an obvious "Selected" indicator on the active one.
- **Dropdown closed (header / footer / account menu):** the trigger button is a solid colored pill that visibly matches the selected mode. Switching to Investor turns it orange, Broker turns it blue, Investor + Broker turns it green, Developer turns it purple — same look in every placement.
- **Footer:** dropdown opens upward (already configured) and stays readable because the panel now declares its own light surface scope.

## Out of scope
- No changes to footer link columns, copy, or layout (those were already restructured).
- No changes to mode logic, persistence, or routing.
- Tailwind color family remap is not touched — we continue using inline hex via `MODE_CONFIG`.
