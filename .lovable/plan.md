
## Goal (what will be “fixed”)
When you open **Create Support Ticket**, both dropdowns:
- **Service with Issue**
- **Priority Level**
must visibly open a menu every time, and selections must be clickable (no “nothing happens”, no hidden menu).

---

## What I found in code (why this can still fail even after z-index tweaks)
### 1) The dropdown menu is rendered in a Radix “Popper portal” outside the dialog
Your Select menu (`@radix-ui/react-select`) renders its menu in a portal and wraps it in an element with:
- `data-radix-popper-content-wrapper`

This is correct, but it creates a common failure mode inside modals: **the dialog can treat the dropdown menu as “outside” the modal** and dismiss/interrupt interaction. The result can look like:
- click trigger → menu flashes or never appears
- click does “nothing”
- menu exists but is unclickable/blocked

### 2) SupportTicketBox still overrides SelectContent styling in a risky way
In `src/components/SupportTicketBox.tsx` both dropdowns use:
- `SelectContent className="bg-white border border-zinc-200 shadow-lg ..."`

This overrides the shared Select styling (including the premium background/border conventions). Even if it technically opens, on your light dialog background it can be hard to perceive, and it increases risk of CSS conflicts.

### 3) We need a fix that is not “guessing”
To stop this loop, we’ll implement the fix in a way that:
- prevents modal dismissal during dropdown interaction (root interaction bug)
- guarantees the dropdown is above the modal overlay (visual bug)
- then we will actually test the interaction end-to-end in the preview

---

## Implementation plan (do all of this in one pass)

### A) Harden all dialogs against Radix popper portals (core fix)
**File:** `src/components/ui/dialog.tsx`

Add a default guard to `DialogContent` so that when a user clicks inside any Radix Popper portal (Select, DropdownMenu, Popover, etc.), the dialog does **not** treat it as an “outside click”.

Concretely:
- In `DialogPrimitive.Content`, add `onPointerDownOutside` (and/or `onInteractOutside`) handler that:
  - checks `const target = e.target as HTMLElement`
  - if `target.closest('[data-radix-popper-content-wrapper]')` is true → `e.preventDefault()`
  - otherwise allow default behavior (clicking outside closes dialog as usual)

Important detail:
- We will **compose** this with any existing `onPointerDownOutside` / `onInteractOutside` passed by callers so we don’t break special dialogs that already have custom logic (e.g., “don’t close while submitting”).

Why this is the right fix:
- It directly addresses the “dropdown is outside modal” interaction issue rather than only changing z-index.

---

### B) Make Select menus unmistakably visible above modals (visual + safety)
**File:** `src/components/ui/select.tsx`

Adjust `SelectContent` to be safely above dialogs:
- raise the SelectContent z-index above dialog overlay/content (keep it below toasts if needed)
- keep a solid, non-transparent premium background and clear border/shadow

This ensures that even if another overlay exists, the dropdown cannot end up behind it.

---

### C) Remove risky overrides in SupportTicketBox and use the system Select styling
**File:** `src/components/SupportTicketBox.tsx`

For both dropdowns:
- Remove the custom `SelectContent className="bg-white border border-zinc-200 shadow-lg ..."` overrides
- Use the default `<SelectContent>` styling from `src/components/ui/select.tsx`
- If we still want a smaller menu height, keep only safe sizing overrides (e.g., `max-h-60`) but do not override background/border/z-index.

Also add small UX polish:
- Ensure trigger feels clickable: add `cursor-pointer` on `SelectTrigger`
- Ensure items show pointer: add `cursor-pointer` to `SelectItem` via className or adjust base SelectItem style if desired

---

## Testing plan (I will actually test it, not assume)
After implementing A+B+C, I will verify in the Preview environment:

1) **Homepage**
- Open “Create Support Ticket”
- Click “Service with Issue” → confirm menu appears
- Select an option → confirm field updates and dialog remains open
- Click “Priority Level” → confirm menu appears
- Select “Normal” → confirm it updates

2) **/contact**
- Repeat dropdown open + select for both fields

3) **/services/customer-happiness-center**
- Repeat dropdown open + select for both fields

4) **Submission sanity**
- Fill required fields minimally
- Submit once to confirm no regressions

If any of these fails, I will immediately apply the fallback below.

---

## Fallback (only if needed)
If Radix Select still behaves inconsistently on a specific device/browser, we will replace just these two dropdowns in the ticket modal with a Popover-based menu (you already use Popover successfully in `HeroSearchBar.tsx`). This avoids the Select+Dialog edge-cases entirely while preserving the same UI.

---

## Files that will be changed
- `src/components/ui/dialog.tsx` (interaction guard for Radix popper portals)
- `src/components/ui/select.tsx` (ensure menu is always above modals, strong background)
- `src/components/SupportTicketBox.tsx` (remove risky SelectContent overrides; make triggers/items clearly clickable)

---

## Definition of Done (your acceptance criteria)
- You can open the ticket modal and the dropdown menus are visible and selectable every time.
- Selecting an item does not close the dialog.
- This works on all pages where the ticket modal exists (home, contact, customer-happiness-center).
