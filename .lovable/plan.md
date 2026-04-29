# Targeted UI Fix Plan — Screenshots + Global Audit

Scope is limited to the bugs visible in your screenshots and the *exact same patterns* repeated elsewhere. No redesign, no removed features, no new components.

---

## 1. Pending Tasks Modal (IMG_4411 / IMG_4412)

**Files:** `src/components/owner-dashboard/OwnerTasksPopupAlert.tsx`, `src/components/notifications/UserTasksPopupAlert.tsx`

Bugs:
- Subtitle ("Daily action items require attention") and body line ("You have N pending items…") render too faint on the white card — the `text-muted-foreground` token reads near-light-gray on `bg-card`.
- The `bg-muted/40` body box is so pale it looks empty.
- The "Later" button is barely visible (outline-on-white).
- `UserTasksPopupAlert` has the same shape but uses a champagne gradient that worsens contrast and a hard-coded `text-gray-600` close button (basically invisible on the cream gradient).

Fixes:
- Bump body text from `text-muted-foreground` → `text-gray-700` and the count line span from `text-foreground` → keep but add `font-extrabold`.
- Replace `bg-muted/40` body card with `bg-gray-50 border-gray-200`.
- "Later" button: change from `variant="secondary"` → keep secondary but add explicit `border-gray-300 text-black` so it's always readable.
- Close (X) button: from `text-muted-foreground` → `text-gray-600 hover:text-black` (real contrast on white).
- `UserTasksPopupAlert`: drop the champagne gradient, switch to the same neutral white card so both modals match. Keep all functionality (ticket alerts, View Tasks, dismissal logic).

---

## 2. Relationships Hub layout (IMG_4413 / IMG_4414 / IMG_4415)

**File:** `src/pages/CRMRelationships.tsx`

Bugs:
- Header uses `flex-col md:flex-row items-center justify-between` with a centered title and a 180px spacer — produces the huge dead vertical band seen in IMG_4413 between the back button and the tabs.
- Active tab pill shows only the icon at narrow widths because the row overflows; "Brokerages" text is clipped under the active black pill (visible in IMG_4414 vs IMG_4415).
- "Add Brokerage" CTA appears washed out — actually it's a default primary button but it sits on the same `#FAF7F2` page surface and reads weak next to the bigger Export CSV outline. It needs the locked black/white treatment with proper weight.
- "No brokerages yet" empty card is `text-gray-500` on white — too faint.

Fixes:
- Restructure header: keep `Back to CRM Hub` flush-left, title left-aligned (not centered) with subtitle directly underneath, single row, no 180px spacer. Removes the empty band.
- Tabs: keep both triggers, add `min-w-fit` and ensure label is always rendered (no responsive hiding). Wrap `TabsList` in `overflow-x-auto` so on narrow screens the user scrolls instead of clipping.
- "Add Brokerage": explicit `variant="primary"` plus `shadow-md` so it's the dominant CTA in the row.
- Empty-state copy: `text-gray-700` (matches the contrast guard already in place).
- Reduce top padding from `pt-[112px]` to `pt-[96px]` so content sits closer to the header (still respects the 88px frame standard).

---

## 3. Global audit — same patterns to fix everywhere they appear

Run a single sweep replacing repeat offenders, no behavior changes:

| Pattern | Replace with |
|---|---|
| `text-muted-foreground` inside modal/dialog/popover bodies on light cards | `text-gray-700` |
| `bg-muted/40` info boxes | `bg-gray-50 border border-gray-200` |
| `text-gray-500` empty-state messages | `text-gray-700` |
| Hard-coded `text-gray-600 hover:text-gray-600` (no hover delta) | `text-gray-600 hover:text-black` |
| `variant="secondary"` ghost-on-white "Later/Cancel" buttons that disappear | add `border-gray-300 text-black` class override |

Files I will touch (verified by grep, only where the offending pattern is on a light surface):
- `src/components/owner-dashboard/OwnerTasksPopupAlert.tsx`
- `src/components/notifications/UserTasksPopupAlert.tsx`
- `src/pages/CRMRelationships.tsx`
- `src/components/notifications/*` (other popup alerts that mirror the same shape)
- `src/pages/AlertsDemo.tsx` (uses the same modal pattern)

I will NOT change:
- The contrast guard in `src/index.css` (it's already correct; I'll only adjust class usage in the components above).
- The button variant system in `src/components/ui/button.tsx`.
- Any backend, RLS, edge function, or routing.
- Any feature, tab, or section will be removed.

---

## Out of scope (per "no new features" rule)

- No new dashboards, no new metrics, no AI changes, no automation rewiring.
- No theme/token changes — all fixes use existing tokens and Tailwind utilities.

After approval I'll apply the changes in one pass and report exactly which files were edited.
