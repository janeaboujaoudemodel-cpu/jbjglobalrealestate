# Fix Pending Tasks popup — visible buttons + close icon

The "Pending Tasks" modal on `/owner` has three invisible interactive elements: the **View Tasks** label + arrow (white-on-dark stripped), the **Later** label, and the **X** close icon. Confirmed via screenshot — the dark button shows only an arrow ghost, the secondary button is empty, and the close circle is empty.

Cause: the modal wrapper has `data-no-contrast-guard` but the `<Button>` children and lucide icons render through the global contrast guard (and the same-tone guard) which strips text/stroke colors when it can't resolve their underlay. The current code uses the shared `<Button variant="primary|secondary">` which doesn't carry per-element opt-outs.

## Fix (single file: `src/components/owner-dashboard/OwnerTasksPopupAlert.tsx`)

Replace the three buttons with hand-styled `<button>` elements that:

- carry `data-no-contrast-guard` on the button, on every label `<span>`, and on every lucide icon
- pin colors via inline `style` (so guards / Tailwind purges can't override): black bg + white text for "View Tasks", champagne bg + ink text for "Later" and the X
- pin icon stroke via inline `style={{ color, stroke, opacity: 1 }}` and `strokeWidth={2.5}` so the X and ArrowRight render solid
- keep the existing handlers (`handleViewTasks`, `handleClose`), keep keyboard focus rings, keep rounded shape and hover states (View Tasks → `#2A2A2A` + gold border; Later/X → `#EFE6D6` + gold border)
- preserve the modal layout, copy ("View Tasks", "Later", "Pending Tasks", count line) and existing dialog semantics — no removals

After editing, verify by navigating to `/owner` in the browser and capturing a screenshot to confirm all three controls are fully legible at rest and on hover.
