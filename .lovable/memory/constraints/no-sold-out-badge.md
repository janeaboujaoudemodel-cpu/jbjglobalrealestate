---
name: No Sold-Out Badge on Public Cards
description: Sold-out / "Sold Out · Resale Available" badges must never render on public project cards or recommendation surfaces — secondary market keeps them discoverable.
type: constraint
---

# No Sold-Out Badge on Public Cards

NEVER render a "Sold Out" badge, pill, or label on a public-facing project card, recommendation strip, AI Home Finder result, or search/listing result.

**Why:** Even when a project is sold out with the developer, the same units remain available on the secondary market. Showing "Sold Out" kills conversion and contradicts our brokerage model. Our commercial focus is OFF-PLAN promotion (higher developer commission); ready-only options surface only when the user explicitly requests `Ready` status in filters / AI Home Finder.

**How to apply:**
- Do not add any UI element whose text/aria contains "Sold Out", "SoldOut", "Sold-out" on public cards.
- Sold-out off-plan rows are still filtered OUT of recommendation/result lists upstream (already enforced in `QuizResults`).
- Owner/admin internal CRM views may still display sold-out status (private surfaces only).
- If a card needs a state pill, prefer the sale-status frame (`available`, `selling`, `limited`, `launching`).

Enforced in `src/components/ProjectCard.tsx` (badge intentionally removed).
