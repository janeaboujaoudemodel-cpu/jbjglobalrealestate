## Goal
Lift the Broker CRM to a premium standard, mirror the same shell into Developer and Investor portals (CRM + dashboard parity), then run a final global pass to eliminate any remaining black-on-emerald / wrong-eyebrow contrast issues across the site.

## Phase 1 — Broker CRM restyle (`/broker/crm` + pipeline)
1. Page shell
   - Wrap in `PremiumSectionCard` blocks, champagne band background, consistent 24/32px rhythm.
   - Unified emerald eyebrow pill at the top of every panel (`Pipeline`, `Filters`, `AI Suggestions`, `Stage column headers`) using the locked `data-section-label` / `data-no-contrast-guard` / `data-allow-dark-cta` / `data-surface="emerald"` chain so they always render white-on-emerald.
2. Kanban
   - Stage column header → small emerald chip with white count badge (no black text on emerald, no arrows).
   - Lead card → champagne raised card, 1px gold hairline, ink title, price pill, emerald CTA "Open lead" with white icon. Hover: gentle lift + champagne wash, never flips text to black.
   - Empty states: emerald `IconTile` + ink heading + ink helper, matching "No leads in your scope yet" pattern.
3. Filters & toolbar
   - Replace bare selects with champagne pills; active filter chip = emerald metallic with white text.
   - "AI Next-Best-Action" sidebar — same component as dashboard, white-on-emerald confirmed.
4. Lead drawer
   - Tabs (Overview / Timeline / Notes / Files) → champagne strap with emerald active = white icon+label, idle = ink.
   - Stage progress, action buttons (Call / Email / WhatsApp / Schedule) → emerald pill with white icon + white label, never black.

## Phase 2 — Developer Portal parity
Mirror the Broker shell into `/developers-portal/*`:
- Dashboard: same KPI strip (no arrows), `ConciergeGreeting` (Sarah voice), `NextBestActionCard` wired to developer leads, eyebrow pills (`DEVELOPER WORKSPACE`, `INVENTORY PULSE`, `LIVE ENQUIRIES`, `BROKER NETWORK`, `DATA ACCESS`).
- CRM (developer enquiries): same Kanban primitives as broker, lead source = inbound enquiries from project pages.
- Sidebar uses the smaller-icon emerald tiles already locked in `BrokerPortalSidebar`.

## Phase 3 — Investor Portal parity
Mirror the same shell into `/investor-dashboard`:
- Replace ad-hoc tab strap and panels with the standardized `SectionHeader` eyebrow + `PremiumSectionCard`.
- KPI tiles match broker (no arrows, emerald glyph, ink number, ink label).
- `ConciergeGreeting` + `NextBestActionCard` (investor variant: next viewing, next payment, next milestone).
- Vault / Favorites / Browsing History panels reuse the same shell.

## Phase 4 — Global contrast & eyebrow sweep
1. Add `data-section-label` + the lock chain to every remaining eyebrow across:
   - Owner back-end (DMS, Marketing Hub, Meetings, Legal Hub, Document Studio)
   - Broker sub-pages (Listings, Smart Inbox, Email Setup, Team & HR, Calendar, Tasks, Deals & Commission, Developer Visits, Forms & Agreements, JBJ Academy, Marketing Toolkit, AI Sales Assistant, Notifications, Brand Profile, Settings)
   - Developer & Investor sub-pages
   - Marketing pages eyebrows (News, Intel, Guides, FAQ)
2. Promote the working `.jj-section-eyebrow` block in `index.css` to also auto-apply the white-ink-on-emerald lock without needing every consumer to add the attribute chain — by raising the rule's class-specificity above the global Ink Lock (using a long `:is(...).jj-section-eyebrow` chain that out-specifies the `:not()` ladder).
3. E2E drive via Playwright headless across: `/broker/portal`, `/broker/crm`, `/broker/listings`, `/developers-portal`, `/developers-portal/crm`, `/investor-dashboard`, `/owner`, `/`, `/projects`, `/news`, `/guides`. Screenshot each, scan eyebrows + KPI tiles + CTAs for black-on-emerald, patch any offender.

## Technical notes
- All work is presentation-only. No schema, no edge function changes.
- Reuses existing primitives: `PremiumSectionCard`, `SectionHeader`, `IconTile`, `NextBestActionCard`, `ConciergeGreeting`, `.jj-section-eyebrow`, `.jj-pill-emerald-metallic`.
- New tiny primitive: `CrmKanbanColumn` + `CrmLeadCard` shared by broker and developer CRMs (in `src/components/crm/`).
- Specificity-raise for `.jj-section-eyebrow` lives at the end of `src/index.css` (no new file).
- Verification: Playwright screenshots saved under `/tmp/browser/crm-pass/` per route.

## Out of scope
- No backend, schema, edge function, RLS, or data model changes.
- No new features beyond presentation parity.
- Owner portal restyle (already done in earlier passes) — only contrast fixes here.
