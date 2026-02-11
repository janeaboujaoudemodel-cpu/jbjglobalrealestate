

## Enhance Digital Business Card: Mobile Consistency and Premium Description

### Changes to `src/pages/DigitalCard.tsx`

**1. Upgrade the company description (line 363-365)**

Replace the current single-line description:
> "A licensed Dubai brokerage delivering investor-led real estate advisory, market intelligence, and end-to-end property execution across the UAE."

With a richer, premium paragraph that highlights:
- Licensed RERA brokerage status
- Core services: Buy, Sell, Rent
- AI-powered tools and market intelligence
- End-to-end advisory approach

New text:
> "A RERA-licensed Dubai brokerage powering smarter real estate decisions through AI-driven market intelligence, predictive analytics, and a full suite of 50+ professional tools. We deliver end-to-end advisory across Buy, Sell, and Rent -- from property sourcing and valuation to negotiation and closing -- backed by data, not guesswork."

**2. Ensure mobile UI matches desktop styling**

The current layout already shares the same component for all screen sizes, but a few elements need tightening for visual parity on phones:
- Action buttons (Call, WhatsApp, Send Email, Share Card, Website) currently use `bg-white` with gold borders -- these are consistent and will remain
- Ensure the 3-column action grid (Send Email / Share Card / Website) does not collapse or shrink icons on small screens by adjusting gap and padding for `grid-cols-3` on mobile
- Standardize button text sizes to `text-sm` across all breakpoints (already mostly done, just verify no breakpoint overrides)

No major structural changes needed -- the desktop and mobile already use identical markup. The visual consistency request is mainly about ensuring the champagne card, gold borders, and button colors render identically, which they do. Minor padding tweaks will be applied where mobile gets slightly cramped.

### Files to edit
| File | Change |
|------|--------|
| `src/pages/DigitalCard.tsx` | Rewrite the Professional Intro paragraph (lines 358-366) with premium copy. Minor mobile padding adjustments on action buttons. |

