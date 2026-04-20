
This appears to be a stale/duplicate approval message — the white-on-light global audit plan was already approved and implemented earlier in this conversation (CSS safety net in `src/index.css` + hardened Radix primitives with `data-surface="light"` on dialog, popover, select, input, textarea).

Since the user re-sent the same approval, I'll re-verify the implementation is intact and run a fresh sweep for any missed `text-white` on light-surface offenders, then patch them.

## Scope of this pass

1. **Verify existing safety net** in `src/index.css` (the `[data-surface="light"]` rules + `bg-white/bg-champagne/bg-gold` descendant color enforcement) is still present and correct.
2. **Verify primitive hardening** — `data-surface="light"` still applied on `dialog.tsx`, `popover.tsx`, `select.tsx`, `input.tsx`, `textarea.tsx`. Add to `dropdown-menu.tsx`, `command.tsx`, `tooltip.tsx` if missing.
3. **Fresh component sweep** — grep `src/**` for `text-white` co-located with light surface classes (`bg-white`, `bg-champagne`, `from-[#FDFBF7]`, `from-[#F7F2EA]`, `from-[#EFE6D6]`, `bg-gold`). Patch the worst offenders (forms, modals, badges).
4. **Visual proof** — screenshot 3 surfaces: LeadCapturePopup with open Select dropdown, one auth/contact form, one CRM modal. Confirm zero white-on-light.

## Files likely touched
- `src/components/ui/dropdown-menu.tsx`, `command.tsx`, `tooltip.tsx` (add `data-surface="light"` if missing)
- 3–8 component files surfaced by the sweep
- `src/index.css` only if a gap is found in the existing safety net

## Deliverable
- Confirmation the global rule is intact
- List of additional components patched in this pass
- 3 screenshots proving readability on light surfaces
