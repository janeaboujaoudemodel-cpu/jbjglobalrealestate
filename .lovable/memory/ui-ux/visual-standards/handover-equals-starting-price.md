---
name: Handover = Starting-price chrome
description: HandoverPill MUST mirror PricePill chrome (glass champagne + 1.5px gold hairline, ink text, 8px radius). Never filled metallic, never orange.
type: constraint
---

- `src/components/ui/HandoverPill.tsx` MUST render with: `background: rgba(253,251,247,0.55)`, `backdrop-filter: blur(14px) saturate(160%)`, `border: 1.5px solid #B89555`, `border-radius: 8px`, Inter ink text `#1A1A1A` weight 900 / 14px, tabular-nums, and the price-pill shadow stack.
- NEVER apply `.jj-cta-gold-metallic` (or any filled gold gradient) to HandoverPill — the page pattern is glass+gold-hairline for info chips, metallic only for action CTAs.
- `.jj-cta-gold-metallic` palette / size / animation MUST be byte-identical to `.jj-metallic-active` in `src/components/navigation/HorizontalUtilityBar.tsx` (sqft pill). No white diagonal sweep.
- Global popper-content lock MUST NOT use `revert !important` — it wipes inline `style.backgroundColor` to transparent. Dark popovers opt-in via `[data-on-dark]` with explicit dark tokens.
- `button[data-phone-code-trigger]` uses the same metallic surface + animation as `.jj-cta-gold-metallic` / sqft pill.
