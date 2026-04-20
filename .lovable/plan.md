
The user is reporting that the LeadCapturePopup ("Exclusive Access") still has unreadable fields — likely white text on white background. They want a systemic fix so it never happens anywhere on the site.

Looking at `LeadCapturePopup.tsx`:
- Container: `bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]` (LIGHT champagne)
- Inputs: `bg-white text-black placeholder:text-black/50` — should be fine on its own
- BUT — `src/index.css` has dark-surface rules that force `text-white` on descendants when nested under `[data-surface="dark"]` ancestors. The popup is rendered as a portal at `z-[20000]` over `bg-black/60` backdrop. If any wrapper sets `data-surface="dark"` on body/html or the portal root inherits it, the inputs flip to white-on-white.
- The "Light Island Escape Hatch" added previously targets `.bg-white, .bg-champagne, [class*="from-[#FDFBF7]"]` — but only `bg-gradient-to-br from-[#FDFBF7]` matches via the arbitrary class, NOT `bg-white` (the inputs). The escape hatch works on the OUTER container, but the INNER inputs use `bg-white` which is matched — so it should re-assert. Need to verify why it's still failing.
- Likely cause: the SelectContent dropdowns are portaled to `document.body` (Radix), so they escape the `from-[#FDFBF7]` parent and don't get the escape hatch. The escape hatch checks ancestor class — Radix portals break ancestry.

Also: Select trigger value text, SelectItem text in dropdown, and placeholder visibility are all suspect.

## Goal
Make the "Exclusive Access" popup fully readable AND establish a global rule that prevents white-on-white anywhere — front end and back end.

## Root causes to fix
1. **LeadCapturePopup inputs/selects** — lock explicit dark text + white bg with inline styles (immune to global CSS).
2. **Radix Select dropdowns** — portaled to body, escape the parent's "light island" scope. Fix at the primitive level (`src/components/ui/select.tsx`) so SelectContent/SelectItem always render dark text on white, regardless of ancestor.
3. **Global safety net in `src/index.css`** — add a final rule: any `<input>`, `<textarea>`, `<select>` with `bg-white` (or no explicit bg) gets `color: #111` forced, and any element with both light bg + light text gets corrected. Also add a rule for Radix portals (`[data-radix-popper-content-wrapper]`) to default to dark-on-white.

## Implementation steps
1. **Patch `src/components/LeadCapturePopup.tsx`**
   - Add `data-surface="light"` to the modal card.
   - Lock every Input with inline `style={{ backgroundColor: '#fff', color: '#111' }}` and explicit placeholder via className.
   - Lock SelectTrigger inline to white bg + dark text; lock SelectValue with dark color.
   - Lock heading/subtitle/labels/privacy text explicit dark.

2. **Patch `src/components/ui/select.tsx`**
   - SelectContent: force `bg-white text-[#111]` with inline fallback.
   - SelectItem: force dark text, hover bg gray-100, selected state visible.
   - SelectTrigger placeholder: ensure `data-[placeholder]` color is dark gray, not white.

3. **Patch `src/components/ui/input.tsx` and `textarea.tsx`**
   - Already mostly OK but add a hard `text-black` and `bg-white` baseline that survives global overrides via `!` important utility or inline style fallback.

4. **Patch `src/index.css`** — add the universal anti-white-on-white safety net at the very end:
   ```css
   /* HARD STOP: never allow white text on white/light bg anywhere */
   :is(input, textarea, select):where(.bg-white, [class*="bg-white"]),
   :is(input, textarea, select):not([class*="bg-"]) {
     color: #111 !important;
     background-color: #fff !important;
   }
   :is(input, textarea, select)::placeholder {
     color: rgba(17,17,17,0.5) !important;
   }
   /* Radix portals default to dark-on-white */
   [data-radix-popper-content-wrapper] [role="listbox"],
   [data-radix-popper-content-wrapper] [role="menu"],
   [data-radix-popper-content-wrapper] [role="dialog"] {
     color: #111 !important;
   }
   [data-radix-popper-content-wrapper] [role="option"],
   [data-radix-popper-content-wrapper] [role="menuitem"] {
     color: #111 !important;
   }
   ```

5. **Audit sweep** — search for any other components using `bg-white`/`bg-champagne` + Select/Input combos that might be affected: `LeadCaptureModal`, `MeetingBookingModal`, `ContactGatingModal`, `Contact.tsx`, owner forms. The primitive-level fix in step 2-4 covers them all without per-file changes.

6. **Verify** — open the popup in browser, screenshot, confirm all fields readable + dropdowns readable.

## Files to edit
- `src/components/LeadCapturePopup.tsx` (explicit locks on every field)
- `src/components/ui/select.tsx` (Radix portal dark-on-white default)
- `src/components/ui/input.tsx` (hard baseline)
- `src/components/ui/textarea.tsx` (hard baseline)
- `src/index.css` (universal anti-white-on-white safety net + portal rule)

## Deliverable
- Screenshot of the popup with all 7 fields readable
- Screenshot of an open Select dropdown showing dark-on-white items
- Confirmation that the safety-net CSS prevents white-on-white anywhere site-wide
