---
name: Global Dropdown + Metallic CTA Lock
description: All Radix Select/Popover/Combobox content renders champagne+soft-gold (never white-on-black). Metallic CTA palette/animation MUST match the sqft/sqm active pill (`.jbj-shimmer-champagne`).
type: constraint
---

- Every floating surface rendered via `[data-radix-popper-content-wrapper]` MUST use champagne fill (`#F7F2EA` → linear-gradient to `#FDFBF7`) and a 1px soft-gold hairline `rgba(184,149,85,.55)`. Opt-out only via `data-no-contrast-guard`, `data-on-dark`, or `.allow-white` on the content node.
- `<PhoneInput />` default `variant` is `'light'`. The dark variant must never be the implicit default.
- `.jbj-form-popover` MUST use `--t-surface` + soft-gold border. Never `--t-form-blue` border.
- `.jj-cta-gold-metallic` palette MUST be identical to `.jbj-shimmer-champagne` (`#E6D3A8 / #F5E9CC / #D8BE82`). Both the gradient drift (`jbj-champagne-shimmer 3s linear infinite`) AND the diagonal sweep (`metallicSweep 3.2s ease-in-out infinite`) MUST run continuously at rest; hover only speeds them up.
- `usePreviewAsVisitor()` defaults to `true` for owners so edit controls never open on first landing; choice persists explicitly (`"0"`/`"1"`).
