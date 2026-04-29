## Hairline Consistency Audit — Plan

Goal: bring **section-divider hairlines on dark backgrounds** across the codebase to the same adaptive opacity model now used in `<Footer />`, without touching decorative gradients (book covers, hero underlines, modal accents) that aren't dividers.

### What I found in the audit

The audit splits findings into 3 buckets:

**1. True section dividers on dark surfaces** — these match Footer's pattern (full-width or column-width `h-px` strokes that separate content zones on a dark background). Worth normalizing.

| File | Line | Element | Current alpha |
|---|---|---|---|
| `src/components/Footer.tsx` | (already done) | 5 hairlines | adaptive ✓ |
| `src/pages/toolkit/CorporateSuite.tsx` | 143 | Top-bar bottom hairline | gold 0.4 fixed |
| `src/pages/NewsDetail.tsx` | 83 | Article paragraph separator | gold/20 fixed |

**2. Hairlines inside isolated dark surfaces** (cards, modals, hero books) — these live on their own controlled background (a card, a modal panel, a 3D book cover). They are *not* responding to a page underlay; they're sized to look correct on their specific surface. Touching them risks visual regressions in unrelated UI. **Out of scope.** Examples: `Book3D`, `BookCoverFace`, `CompanyProfileBrochure`, `MarketReportHeroBook`, `StampPreviewModal`, modal frames (`WelcomeModal`, `ActionGateModal`, `AIAccessGate`, `RoleSelectionModal`, `OTPVerificationModal`, `InquiryFormModal`, `CookiesConsentBanner`, `GuidedTour`, `BusinessCardCamera`).

**3. Decorative underlines / chip dividers** (`w-8 h-px` accent under a heading, mini gold flourishes) — intentional brand details, not dividers between sections. **Out of scope.**

### Implementation

#### Step 1 — Extract a reusable `<AdaptiveHairline />` primitive

`src/components/ui/AdaptiveHairline.tsx`

```tsx
import { useRef } from "react";
import { useAdaptiveHairline } from "@/hooks/useAdaptiveHairline";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "accent" | "nav" | "soft";
  className?: string;
}

/**
 * Single source of truth for full-width divider hairlines on dark surfaces.
 * Alpha auto-adapts to the underlying background luminance.
 */
export const AdaptiveHairline = ({ variant = "nav", className }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const a = useAdaptiveHairline(ref);

  const ACCENT = "200,167,102";
  const WHITE = "255,255,255";

  const bg =
    variant === "accent"
      ? `linear-gradient(90deg, transparent 0%, rgba(${ACCENT},0) 8%, rgba(${ACCENT},${a.goldPeak}) 50%, rgba(${ACCENT},0) 92%, transparent 100%)`
      : variant === "soft"
        ? `linear-gradient(90deg, transparent, rgba(${WHITE},${a.whiteSoft}), transparent)`
        : `linear-gradient(90deg, transparent, rgba(${WHITE},${a.whiteSoft}) 20%, rgba(${ACCENT},${a.gold}) 50%, rgba(${WHITE},${a.whiteSoft}) 80%, transparent)`;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("h-px w-full", className)}
      style={{ background: bg }}
    />
  );
};
```

Variants:
- `accent` — restrained champagne with faded edges (Footer top/bottom style).
- `nav` — champagne center with white edges (Footer above/below-grid style).
- `soft` — pure white soft-fade (for places where champagne would be wrong).

#### Step 2 — Refactor `<Footer />` to use the primitive

Replace the 5 inline hairline `<div>`s (top accent, above-grid, below-grid, copyright `border-t`, bottom accent) with `<AdaptiveHairline variant="accent|nav" />`. Remove the local `accentHairline` / `navHairline` const builders. The `useAdaptiveHairline` call on the footer ref stays only for the copyright `border-t` (which is a real CSS border, not a div) and for exposing CSS vars to descendants.

#### Step 3 — Adopt at the 2 in-scope external sites

- **`src/pages/toolkit/CorporateSuite.tsx:143`** — replace the inline `<div ... style={{ background: 'linear-gradient(...rgba(184,148,62,0.4)...)' }} />` with `<AdaptiveHairline variant="accent" className="absolute bottom-0 left-0 right-0" />`.

- **`src/pages/NewsDetail.tsx:83`** — this is a string of HTML injected into article body via `dangerouslySetInnerHTML`, so React components don't help. Update the string to use a slightly stronger gradient that matches the new Footer baseline:
  ```html
  <div class="my-8 flex items-center justify-center gap-4">
    <div class="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(var(--gold))]/30 to-transparent"></div>
    <div class="w-1.5 h-1.5 rounded-full bg-[hsl(var(--gold))]/45"></div>
    <div class="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(var(--gold))]/30 to-transparent"></div>
  </div>
  ```
  (Article body is on the white `prose` surface — adaptive logic doesn't apply, but bumping `/20` → `/30` aligns with the new "never too faint" target.)

#### Step 4 — Document the standard

Append a short comment to `src/index.css` near the existing hairline tokens (if any) noting:
```
/* For section-divider hairlines on dark surfaces, prefer
   <AdaptiveHairline /> from @/components/ui — alphas auto-adapt
   to the underlying background luminance. */
```

#### Step 5 — Save a memory rule

`mem://ui-ux/visual-standards/adaptive-hairline-standard` — short note: "Section dividers on dark surfaces use `<AdaptiveHairline />`. Decorative underlines, modal/card internal strokes, and book-cover ornaments are exempt."

### Files

**Create**
- `src/components/ui/AdaptiveHairline.tsx`
- `mem://ui-ux/visual-standards/adaptive-hairline-standard`

**Edit**
- `src/components/Footer.tsx` — swap 4 inline hairline divs for `<AdaptiveHairline />`; keep the hook call only for the copyright `border-t` colour.
- `src/pages/toolkit/CorporateSuite.tsx` — 1 hairline.
- `src/pages/NewsDetail.tsx` — 1 string-template separator (alpha bump only).
- `src/index.css` — short policy comment.
- `mem://index.md` — add the new memory entry.

### Out of scope (with reason)

- All `via-white/X` and `via-gold/X` strokes inside modals, cards, books, and hero ornaments — they're surface-internal details, not page dividers, and changing them risks unrelated regressions.
- Any tailwind `border-t border-white/10` on light-text-on-dark cards — those are container chrome, not divider hairlines.
- No changes to `<Footer />` layout, copy, links, or ambient gradients (No-Removal Policy).

### Risk

Low. The primitive is additive; the only behavior change at adoption sites is alpha auto-scaling, which we've already validated in `/dev/footer-preview`. Article-body string change is a single `/20` → `/30` bump.