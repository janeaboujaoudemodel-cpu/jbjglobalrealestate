
# Global JBJ Design System Correction — Phased Execution Plan

Goal: fix the **shared primitives and global CSS** (not page-by-page patches) so contrast, button system, header, sidebar, cards, badges, dropdowns and forms behave consistently across every page, portal, tool and viewport. After every phase I will manually navigate the live preview with Playwright, capture screenshots, and only then move to the next phase.

## Guardrails (apply to all phases)

- No redesign, no layout changes beyond fixing alignment / spacing / clipping / contrast.
- No new colors. Palette = Emerald gradient · Champagne / Gold-champagne · Mother-of-pearl · White · Charcoal.
- Contrast contract:
  - Emerald / dark gradient → pure white text + pure white icons only.
  - Champagne / beige / MOP / white → charcoal or dark-emerald only.
- Preserve every LOCKED standard: Signature row, Mortgage slider, Phone+cmdk, Document Studio, Hero rule, sq ft / sq m toggle, JB metallic avatar.
- Consolidate conflicting CSS instead of stacking another override layer.

---

## Phase 1 — Audit & CSS consolidation (foundation)

1. Inventory conflicting rules in `src/index.css` (PASS 1–88, emerald-pill, surface contract, hero-search, ink-emerald guards).
2. Build a single **Surface Contract** map (emerald / dark / champagne / light / mop / white) using `:where()` so component-level styles can win.
3. Remove duplicate / fighting rules; keep one canonical contrast lock.
4. Define canonical CSS custom props for: button height tiers (h-9 chip, h-11 control, h-12 CTA), radii, paddings, icon sizes, badge sizes.

Validation: diff CSS size, build passes, Playwright screenshots of Home / Careers / Market Intel before continuing.

## Phase 2 — Shared primitive rebuild

Update **shared components only** (no page edits yet):

- `Button` (variants: emerald-primary, champagne-secondary, ghost-light, ghost-dark, icon-circle, icon-square).
- `Badge` / chip (emerald-solid, champagne-solid, outline-dark, outline-light).
- `IconTile` (emerald → white glyph; champagne → emerald glyph).
- `Card` (light / emerald / mop variants; single border, no duplicate inner border).
- `HeaderControl`, `HeaderSegmented`, `SidebarItem`, `JbjAvatar`, `NotificationBadge` already exist — verify and harden.
- `DropdownMenu` / `Select` / `Popover` hover = soft champagne hover with charcoal text, OR emerald with white. Remove green / blue / navy.
- `FAQAccordion` arrow tile primitive.

Validation: `/ds-preview` screenshots + Playwright visit Home, Careers, Market Intel, Broker Portal.

## Phase 3 — Header + Sidebar live migration

- Confirm all header controls use the new primitives at the same h-11 baseline; circular for Search / Filter / Heart / JB, pill for AED / Mode, segmented for sq ft / sq m (restore previous clean shape).
- JB avatar = emerald metallic + spinner, dropdown opens instantly, hover rows = emerald-fill + white content.
- Sidebar: every item — including Broker Portal, AI Home Finder, List Your Property, Careers, Resale, Contact, Support, Sign Out, Collapse — uses the same `SidebarItem` primitive (small icon, same axis, single active). No oversized boxes. Collapsed state stays aligned.

Validation: Desktop + iPad + iPhone screenshots, expanded + collapsed, dropdowns opened.

## Phase 4 — Homepage corrections

Hero search, Explore Our Services, Handpicked For You (titles charcoal, Ad badge smaller, heart/shortlist aligned), Continue Searching icon-only buttons, Explore Our Guides (View Library), Explore JBJ Tools, AI Property Comparison (Start Exploring white icon), Compare to Bank Rates (remove duplicate inner border), Top Areas in Dubai title.

Validation: full Home scroll screenshots Desktop / iPad / iPhone.

## Phase 5 — Careers page

Jessica card (real assistant visual, label "Interview Assistant"), Open Positions emerald section with white content, search input without gold border, job cards (dark titles on light, unified Featured/Partner/Top-Opportunity/Selected/Apply badge system, single-select Selected), Application Form (emerald step pill, white Continue text/icon, no navy), FAQ arrows aligned + emerald-active, Why JBJ / Broker Growth icon tiles unified.

Validation: full Careers walk-through, every step of application form, every FAQ row.

## Phase 6 — Market Intelligence / Dashboards

Metric card alignment, delta-chip spacing, Quarterly Trends icon, animated bars, area cards alignment (Downtown / Marina / Palm / Business Bay / JVC / Creek Harbour / Arabian Ranches), unified "View Area Details" button position, Demand/Supply emerald fills.

Validation: Market Intel and Owner Dashboard screenshots.

## Phase 7 — AI Home Finder + AI Tools visibility

- Restore correct surfaces (no all-black page).
- Add `published` filter to public AI tools registry so unpublished tools are hidden on Web, mobile menu, hamburger, and sitemap. Backend admin still sees all.

Validation: public vs admin view of AI tools list on Desktop + Mobile.

## Phase 8 — Property cards / Listings / Global labels

Unified badge + heart + shortlist + add-badge + contact pill system; no overlapping image labels; consistent spacing across Resale, Off-Plan, Handpicked, Favorites, Compare.

Validation: each listing surface screenshot.

## Phase 9 — Responsive + performance + document QA

- Walk Desktop / MacBook / iPad / Tablet / iPhone / Android viewports through: Home, Careers, AI Home Finder, Market Intel, Broker Portal, Owner Portal, Documents & Forms, Services, Insights & Guides, Broker & Academy, Company & Legal, Sitemap, hamburger menu.
- Verify dropdown open latency, no horizontal overflow, no clipped labels.
- Export one document (Offer Letter) + download one PDF report; compare preview vs export pixel-for-pixel.

Final deliverable: a screenshot index in `/mnt/documents/global-audit/` grouped by phase and viewport, with a short pass/fail table per acceptance criterion.

---

## Technical notes

- Touch points: `src/index.css` (consolidation), `src/components/ui/*` (Button, Badge, Card, DropdownMenu, Select, Popover), `src/components/ui/ds/*` (HeaderControl, SidebarItem, JbjAvatar, NotificationBadge, FAQAccordion), `src/components/layout/GlobalVerticalNav.tsx`, `src/components/layout/HorizontalUtilityBar.tsx`, careers / market-intel / home section components, AI tools registry (`published` flag filter on public query).
- No business-logic changes outside the AI-tools `published` filter (required to satisfy the "hide unpublished tools" rule).
- Validation harness: Playwright scripts under `/tmp/browser/global-audit/<phase>/` writing PNGs to `/mnt/documents/global-audit/<phase>/`.
- Each phase ends with: (a) build green, (b) screenshots captured, (c) pass/fail table, (d) explicit "ready for next phase" note — no phase skipping.

If you approve, I will start Phase 1 immediately and report back with screenshots before moving to Phase 2.
