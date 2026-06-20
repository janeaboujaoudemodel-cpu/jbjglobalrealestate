# Premium Gold Polish: Consultation Form + Global Checkbox + Eyebrow Pills

Targeted polish to make CTAs feel premium/metallic, fix the missing checkmark, and align the terms row with the submit button. Reuses the existing `jj-cta-gold-shimmer` keyframes already in `index.css` — no new animations.

## 1. Soft-gold borders on every input/select in the consultation form

`src/components/ConsultationRequestForm.tsx`

- Replace every input/select trigger ring (currently dark `#1A1A1A` outlines after contrast-guard repaint) with **1px `rgba(184,149,85,0.55)` hairline + champagne `#FDFBF7` fill + ink label**.
- Hover/focus → gold `#B89555` border + soft gold glow `0 0 0 3px rgba(184,149,85,0.15)`.
- Apply to: Full Name, Email, Phone Number text input, Service Needed, Timeline, Nationality, Preferred Language, Preferred Time, Contact Method, Budget Range, Additional details.
- `data-no-contrast-guard` on each `<SelectTrigger />` so the global black-CTA guard never re-fills them to ink.

## 2. Animated metallic-gold treatment for premium controls

Reuse the existing `.jj-pill-active` / `jj-cta-gold-shimmer` recipe. Introduce **one** new utility class `.jj-gold-metallic` in `src/index.css`:

```css
.jj-gold-metallic {
  background: linear-gradient(135deg,#F7EFDC 0%,#E9D9B2 30%,#D7BE7E 55%,#E9D9B2 80%,#F7EFDC 100%);
  background-size: 220% 220%;
  border: 1px solid rgba(184,149,85,0.65);
  color: #1A1A1A;
  box-shadow: 0 6px 18px -8px rgba(184,149,85,0.55), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(184,149,85,0.35);
  animation: jj-cta-gold-shimmer 4.5s ease-in-out infinite;
}
.jj-gold-metallic:hover { filter: brightness(1.04); }
```

Apply it to:
- The **+971 country-code button** (currently rendered as a black pill — the obvious place per the user's screenshot).
- The **Request Consultation submit button** (with ink text + a Send icon already on the right).
- The **GET EXPERT GUIDANCE eyebrow pill** and any equivalent eyebrow-pill primitive used across other pages (search for the same component / class — e.g. `EXPERT CONSULTATION` chip, `EXCLUSIVE`, `PREMIUM ACCESS` eyebrows). One global swap.

## 3. Checkbox: visible 3D gold tick (global)

`src/components/ui/checkbox.tsx`

Today the box is 16×16, champagne fill, gold stroked check — the check is barely visible and gets clipped by the small box. Replace with:

- **20×20** rounded box, 1.5px gold border, champagne fill at rest.
- On `data-[state=checked]`: fill with the `.jj-gold-metallic` gradient (no animation here — static gold to feel like a stamp), inset shadow `inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 6px rgba(184,149,85,0.35)` for the 3D pop.
- Tick: white `Check` icon, `strokeWidth={4}`, drop-shadow `drop-shadow(0 1px 0 rgba(0,0,0,0.25))`.
- Keep `data-no-contrast-guard` so the global guard cannot strip the tick colour.

Result: every checkbox site-wide (forms, T&Cs, filter toggles using `<Checkbox />`) gets the premium 3D gold-tick.

## 4. Align "I agree to terms" inline with the submit button

`src/components/ConsultationRequestForm.tsx` — currently the terms row sits as a separate `FormItem` above the button. Restructure the footer:

```text
[ ✓ ] I agree to the Terms and Privacy Policy *      [  Request Consultation →  ]
```

- Wrap the terms `FormItem` + submit `<Button>` in a single `flex flex-wrap items-center justify-between gap-4` row.
- On mobile (< 640px) the terms wrap above the button (`flex-col sm:flex-row`).
- `FormMessage` for the checkbox still renders directly under the terms text.

## 5. Files

- `src/index.css` — add `.jj-gold-metallic` utility once.
- `src/components/ui/checkbox.tsx` — bigger box, gold fill when checked, white tick + drop-shadow.
- `src/components/ConsultationRequestForm.tsx` — gold borders, `.jj-gold-metallic` on +971 button + submit, terms aligned next to submit.
- `src/components/PageEyebrow.tsx` (or whichever component renders "GET EXPERT GUIDANCE" / "EXPERT CONSULTATION" — I will locate during build) — swap base style to `.jj-gold-metallic`.

## Out of scope

- Mass-converting every CTA across all 200+ pages to metallic gold. We apply it on the consultation form + the eyebrow pill primitive used globally; other primary CTAs (`.jj-cta-dark`) stay black per the locked CTA system unless you call them out.

Reply **Approve** to build.