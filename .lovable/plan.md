## Goal

Adopt the Market Intelligence page as the canonical template — same color system, contrast, typography, spacing, section shells, hero, dividers, and interaction states — across every Services and Company/Legal page. No custom deviations per page.

## Step 1 — Extract the Market Intelligence style into a reusable shell (single source of truth)

Create a shared layout module so every page below inherits identical tokens automatically. This is the only way to guarantee "no violation" across 32 pages.

- `src/components/layout/IntelPageShell.tsx` — page frame with:
  - `PAGE_BG` (solid dark emerald/black, no gradient drift)
  - Emerald hero band (dark → darker, short transition, matches Market Intel hero exactly)
  - Champagne body band for content, using `<PremiumSectionCard>`
  - White dividers only (no gold hairlines)
  - White text on emerald, `#1A1A1A` on champagne
- `IntelHero`, `IntelSection`, `IntelStatGrid`, `IntelFeatureGrid`, `IntelCTA` sub-components mirroring the exact blocks used on `/market-intelligence`.
- No new tokens. Reuses existing emerald / champagne CSS variables.

## Step 2 — Roll out order (one page per turn, validated before next)

Each turn: refactor page → run `tsgo` → drive Playwright to screenshot hero + one mid-section + CTA → attach screenshot → wait for user 👍 before proceeding.

**Services (20)** — in navigation order:
1. Buying Advisory
2. Selling Advisory
3. Rental Advisory
4. Investment Advisory
5. Property Management
6. Short Term Rentals
7. Snagging
8. Interior Design
9. Fit Out
10. Design & Build
11. Architecture
12. Concierge
13. Currency Exchange
14. Law Firm
15. Company Setup
16. Broker Certification
17. Signature Collection
18. Complaint Procedures
19. Customer Happiness Center
20. Testimonials

**Company & Legal (12)** — in sidebar order:
1. About
2. Founder
3. Contact
4. Awards
5. Company Profile
6. Terms of Service
7. Privacy Policy
8. Cookie Policy
9. Disclaimers
10. Intellectual Property
11. AML / KYC
12. Founders Assistant

## Step 3 — Per-page checklist (agent-side, not user-side)

Before marking any page done, verify:
- Hero uses `IntelHero` (no page-local gradient)
- No `bg-[#…]` hex fills outside the shell
- No `border-[#B89555]` / `border-champagne` — only white/emerald tokens
- Every button = primary emerald-metallic or secondary champagne (no ad-hoc styles)
- Dropdowns/pickers inherit global emerald select styling
- All text meets contrast: white on emerald, ink on champagne
- Playwright screenshot of hero + one content section + footer transition captured

## Technical notes

- Shell lives in `src/components/layout/`. Pages import once, wrap children.
- No content changes — only presentation layer. Every existing form, PDF, button, and link is preserved verbatim.
- `IntelPageShell` accepts `hero={{ eyebrow, title, subtitle, primary, secondary }}` and children sections.
- Sidebar/header stays global; shell only owns the route body.

## Delivery cadence

- **This turn:** build `IntelPageShell` + refactor Page 1 (Buying Advisory) + screenshot.
- **Every following turn:** one page, screenshot, wait for 👍.
- Total: 33 turns (1 shell + 32 pages). No batching, no skipping.

If you want a faster cadence (e.g. batch of 3–4 pages per turn without per-page screenshots), reply with the batch size before I start.
