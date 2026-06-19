---
name: Form Fields — No Boxed Frame
description: Single form fields render as clean inputs with the global 1px gold hairline only. Never wrap a single field in `bg-[#FDFBF7] border-2 border-[#B89555]/…`. Multi-select pill groups may carry a wrapper but must keep ≥16px inner padding so the border never touches the pills or labels.
type: constraint
---

# Rule

## Single fields (input / select trigger / textarea / combobox)
- MUST be `bg-transparent` with NO `border-2` recipe.
- Rest/hover/focus borders are painted by the global soft-gold hairline lock in `src/index.css` (`:root:not(.dark) input/textarea/select/[role=combobox]`).
- Forbidden recipe: `bg-[#FDFBF7] border-2 border-[#B89555]/50 hover:border-[#B89555] focus:border-[#B89555]` and any `bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]` on a field trigger.

## Multi-select pill groups (Bedrooms, Preferred Size, etc.)
- Wrap the pill row in `rounded-xl border border-[#B89555]/35 p-4 md:p-5`.
- The hairline must never touch a pill or numeric label — ≥16px of internal padding is required.

## Outer form panel / dialog
- The form's outer container (e.g. `ConsultationRequestForm` champagne panel, `LeadCaptureModal` DialogContent) is NOT a "field" and may keep its champagne fill + gold border.
