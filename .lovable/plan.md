
The user approved a plan to globally audit and fix white-on-light contrast issues across the entire site, with screenshots as proof.

## Scope
Audit every component using light surfaces (white, champagne `#FDFBF7`/`#F7F2EA`/`#EFE6D6`, gold tints) for white or near-white text on top. Fix at the root via global CSS + component primitives so no individual fix is ever needed again.

## Approach

### 1. Global safety net (`src/index.css`)
Add a final, top-priority CSS layer that mathematically prevents white-on-light:
- Any `[data-surface="light"]` subtree → force text to `#111`, placeholders to `rgba(17,17,17,0.55)`.
- Any element with light bg utility (`bg-white`, `bg-champagne`, `bg-[#FDFBF7]`, `bg-[#F7F2EA]`, `bg-[#EFE6D6]`, `bg-gold/*`) → force descendant text away from white/near-white. Use a CSS rule that maps any `color: rgb(255,255,255)` or `color: rgba(255,...)` descendant to `#111` via `color-mix` fallback.
- Inputs/textareas/selects with no explicit dark bg → force `bg:#fff color:#111`.
- Radix portals (`[data-radix-popper-content-wrapper]`) default to dark-on-white (popovers, dropdowns, selects, tooltips that render on body).
- Toast/sonner light variants → dark text.

### 2. Primitive hardening
- `src/components/ui/input.tsx` — already mostly OK, add `data-surface="light"` baseline.
- `src/components/ui/textarea.tsx` — already black text, keep + add baseline.
- `src/components/ui/select.tsx` — SelectContent/SelectItem locked to `bg-white text-[#111]` regardless of ancestry (covers Radix portal escape).
- `src/components/ui/dialog.tsx` — DialogContent gets `data-surface="light"` so all descendants inherit dark-text rule.
- `src/components/ui/popover.tsx`, `dropdown-menu.tsx`, `command.tsx`, `tooltip.tsx` — same treatment for portaled surfaces.

### 3. Component sweep (audit + fix any explicit `text-white` on light containers)
Search across `src/**` for the anti-pattern: `text-white` siblings or descendants of `bg-white|bg-champagne|bg-gold/*|from-[#FDFBF7]|from-[#F7F2EA]|from-[#EFE6D6]`. Fix the worst offenders explicitly (forms, modals, cards, badges).

Targets to verify:
- `LeadCapturePopup.tsx` (already partially patched)
- `LeadCaptureModal.tsx` (project-detail)
- `MeetingBookingModal`, `ContactGatingModal`, `ActionGateModal`
- `Contact.tsx` form
- Owner forms (CRM, Marketing Hub, Document Editor)
- Auth pages (login, signup, forgot password)
- Settings/profile forms
- Footer, header dropdowns on white surfaces

### 4. Visual proof
After fixes, capture screenshots of:
- LeadCapturePopup with all 7 fields visible + open dropdown
- One auth form
- One CRM/admin form
- One contact/gating modal
Confirm zero white-on-light remaining.

## Files to edit
- `src/index.css` (the master safety net — the single source of truth)
- `src/components/ui/select.tsx`, `dialog.tsx`, `popover.tsx`, `dropdown-menu.tsx`, `command.tsx`, `tooltip.tsx`, `input.tsx`, `textarea.tsx` (primitive hardening)
- ~5–10 specific component files where `text-white` is hardcoded on light surfaces (identified via search sweep, fixed in batch)

## Deliverable
- Universal CSS rule that makes white-on-light mathematically impossible
- Hardened Radix primitives that survive portaling
- Screenshots of 3–4 key surfaces proving readability
- Brief written confirmation of the global rule for future-proofing
