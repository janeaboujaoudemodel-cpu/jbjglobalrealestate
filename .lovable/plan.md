# Align Get Verified + Portal CTAs

The two stacked banner buttons (Get Verified, Open Developer/Broker/Investor Portal) currently differ in width and visual weight because each uses its own intrinsic text width and slightly different border/shadow treatment. Goal: make them visually identical — same width, same height, same radius, same border, same shadow — only the fill color differs (champagne vs navy).

## Files to edit

1. `src/components/verification/VerificationBanner.tsx` — Get Verified pill
2. `src/components/home/ModePortalBanner.tsx` — Open {Mode} Portal pill (covers developer/broker/investor automatically since it's one component driven by mode)

## Shared button spec (applied to both)

- Layout: `inline-flex items-center justify-center gap-2`
- Size: `h-11 min-w-[220px] px-6` (fixed height, fixed min width → both pills render identical box regardless of label length)
- Shape: `rounded-md`
- Border: `border border-[#B89555]/70` (1px gold hairline on both — currently only the navy pill has it)
- Shadow: unified `shadow-[0_2px_10px_rgba(0,0,0,0.20),inset_0_1px_0_rgba(255,255,255,0.25)]`
- Motion: keep existing `hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.99] transition-transform`
- Text: `text-sm font-semibold tracking-wide whitespace-nowrap`

Color rules (unchanged from current locked CTA system):
- Get Verified → champagne fill, ink label/arrow (`jj-cta-champagne`, `data-cta="champagne"`)
- Open … Portal → navy `#102540` fill (hover `#1a3d63`), white label/arrow (`jj-cta-dark`, `data-cta="dark"`, `data-allow-dark-cta`, `data-no-contrast-guard`, `allow-white` on inner span/icon)

## Implementation notes

- Only change className/style on the two button/Link elements — no logic, no copy, no surrounding layout changes.
- Do not touch the banner backgrounds, icons, or text columns.
- `ModePortalBanner` already swaps label per mode via `cfg.cta`, so the single edit covers Developer, Broker, and Investor portals.
- Respect the locked CTA primitive system (`mem://ui-ux/visual-standards/cta-primitive-system`) — keep `jj-cta-*` classes and `data-cta` attributes; only adjust sizing/border/shadow tokens.

## Verification

After build, visually confirm in preview at desktop width that the two stacked banner pills share identical bounding boxes (same width, height, corner radius, border). Spot-check mode switch (Developer → Broker → Investor) to confirm the portal pill keeps the same box for all three labels.
