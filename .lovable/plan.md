
## Add Lead / Client modal — fix + upgrade

Scope: `src/components/crm/CRMLeadModal.tsx` only. No business logic / schema changes.

### Root cause of the dropdown bugs

The Dialog renders at `z-index: 10050` (per `src/config/z-index.ts`), but every `SelectContent` and `PopoverContent` inside this modal is forced to `z-[200]` — so the menus open **behind** the dialog overlay/content and look unresponsive. This explains:

- Lead Type dropdown invisible
- Status / "New" dropdown not opening
- Nationality / Preferred Language appearing slow or not opening (first click lands behind dialog, second click finally registers)

Other portaled menus on the page work because they use the default `z-[10200]` from `popover.tsx` / `select.tsx`.

### Fixes

1. Z-index — remove every hardcoded `z-[200]` in this file. Let `SelectContent` / `PopoverContent` use their default portal z-index so they render above the dialog. Applies to: Lead Type, Currency, Property Type, Bedrooms, Buying Purpose, Lead Source, Status, Priority, Lead Score, Preferred Language, Nationality, Country of Residence.

2. Tier / Pool spacing — `<Label>` sits flush against the segmented control. Add `mb-1.5` to those two Labels (and Crown/Users2 icon row) and `mt-1` on the segmented wrapper so they match the rest of the form's label/field rhythm.

3. Exit/Cancel bug — `<Dialog onOpenChange={onClose}>` calls `onClose()` with no boolean, and `setFormData(initial)` only runs after a successful submit. So when the user cancels (Esc, overlay click, X, Cancel) the next open shows stale data and any half-typed required state can throw on re-validate. Fix:
   - Wrap close in a single `handleClose()` that resets `formData`, all `*Open` popover flags, and `loading`.
   - Use `onOpenChange={(o) => { if (!o) handleClose(); }}` and point the Cancel button at `handleClose`.

4. Nationality / Language perceived slowness — once z-index is fixed the first click opens them. Additionally:
   - Add `position="popper"`, `sideOffset={6}`, and `align="start"` to both `PopoverContent` so they anchor to the trigger instantly without collision recalculation.
   - Memoise the `LANGUAGES_WITH_FLAGS` / `ALL_NATIONALITIES` arrays (already module-level — confirm no per-render rebuild) and pass a stable `value` string to `CommandItem`.

### Deep upgrade (visual + UX, no schema changes)

- Promote the existing modal to a `max-w-4xl` layout with a sticky header and sticky footer (Cancel / Create Lead) so the action bar is always reachable on small laptops.
- Add a thin gold hairline divider under the tab bar (matches Champagne-Gold standard).
- Convert the two segmented controls (Tier, Pool) to share one reusable inline `SegmentedToggle` block with consistent `rounded-lg`, `h-10`, `gap-0`, and proper active-state ring (cream `#EFE6D6` + ink + 1px gold hairline, per design memory).
- Required-field affordance: show a small red dot next to `Lead Name *`, and on submit, scroll the first invalid tab into view and switch to it (currently a missing name on the Contact tab is silent if the user is on Pipeline).
- Lead Source / Status: render the colored dot in the trigger, not just inside the menu, so the selected pipeline category is visible at a glance.
- Phone / WhatsApp: add a "Same as phone" link under WhatsApp that copies the phone value.
- Email: add a lightweight `type="email"` + pattern hint and inline duplicate-warning placeholder (no backend call — just the slot, so a future check can plug in).
- Tags: replace the comma-separated input with a chip input (Enter / comma to add, X to remove). Stored value still serialised as a comma-separated string for the existing insert payload — zero schema impact.
- Tab indicator: add a small count badge per tab showing filled-vs-required (e.g. Contact 2/3) to guide the user before submit.
- Keyboard: add `Cmd/Ctrl+Enter` to submit from anywhere in the form.

### Out of scope (call out, do not implement now)

- New DB columns, RLS changes, or new lead fields beyond what `formData` already carries.
- Changes to `BrokerCombobox`, `PhoneInputWithCountry`, or the unified picker.
- Any change to other CRM modals/screens.

### Files touched

- `src/components/crm/CRMLeadModal.tsx` (only)

### Verification

- Open `/owner/crm` → Add Lead → confirm every dropdown opens above the dialog on first click.
- Tab through Contact / Requirements / Pipeline / Notes; confirm Tier & Pool labels have breathing room.
- Open modal, type a name, press Esc, reopen → form is empty.
- Submit with missing Lead Name from the Pipeline tab → auto-switches to Contact and focuses the field.
