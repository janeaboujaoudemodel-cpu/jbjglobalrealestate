# Global UI/UX Audit — Phased Fix Plan

## Why phased, not "fix everything in one shot"

Your project memory has hard rules I must respect:
- **No Removal Policy** — features and content cannot be deleted during restyling.
- **White-on-Light Contrast Guard**, **CTA System**, **Monochrome Design Standard**, **Header/Sidebar Alignment v11 (locked)**, **Premium Price Orange**, **Footer Corporate Standard**, **AI Premium Purple** — these are locked design contracts.
- The codebase has 3,330 lines of design tokens in `index.css` and dozens of locked feature standards.

A single sweeping pass risks breaking locked standards and producing more regressions than it fixes. Instead, I'll execute the audit as **5 sequential, verifiable passes**, each scoped, each globally applied, each safe to ship on its own.

You approve this plan once; I then execute Pass 1 → 5 in order, reporting after each.

---

## Pass 1 — Text contrast & label wrapping (highest impact, lowest risk)

Global, token-level fixes that propagate everywhere automatically.

1. **Badge / pill word-breaking** ("Sale-s", "Partn-er")
   - Add `whitespace-nowrap` + `min-w-fit` to the base `badge.tsx` variants.
   - Add a global `.no-break` utility and apply to tab triggers, chips, and stage labels.
2. **Hover-disappearing text in sidebar & menus**
   - Audit `--sidebar-accent-foreground` and `[data-state=active]` rules in `index.css`.
   - Ensure every hover/active pair has explicit `foreground` set (no inherited white-on-light).
3. **White-on-Light / Black-on-Black guard**
   - The existing runtime guard already exists (memory: white-on-light-contrast-guard). Extend its static lint patterns to also catch `text-white` on `bg-background|bg-card|bg-popover|bg-muted` and `text-foreground` on `bg-foreground|bg-primary|bg-black`.
4. **Disabled state legibility** — set `disabled:opacity-60` (not 30) globally on `button.tsx`.

## Pass 2 — Button system normalization

Single source of truth = `src/components/ui/button.tsx`.

- **Primary**: `bg-foreground text-background` (already correct — verify no override classes leak).
- **Secondary**: `bg-secondary text-secondary-foreground border border-border`.
- **Accent (gold/champagne)**: ensure no text color is gold-on-gold (Memory: CTA System Standard already forbids gold text in buttons — re-verify after migration).
- **Ghost & outline hover**: explicit `hover:bg-accent hover:text-accent-foreground`.
- Run a repo grep for ad-hoc `<button className="bg-white text-white …">` style mistakes and fix in place.

## Pass 3 — CRM / Relationships Hub tabs & modals

Targeted to the actual broken pages.

1. **Tabs missing labels (icon-only)** — locate the CRM hub, restore `<span>` labels next to icons; add `sr-only` fallback only if intentionally collapsed at a breakpoint.
2. **"Brokerages / Leads & Clients / Developer Registry"** — verify all three tabs render, active state visible (`data-state=active` styling on `tabs.tsx`).
3. **Add buttons looking disabled** — replace muted-on-muted with primary variant.
4. **Pending Tasks modal** — restore visible content, button borders, close button. Investigate which Dialog instance is broken (likely missing `DialogFooter` styling or `bg-background` override).
5. **Search field** — ensure `Input` uses `bg-background border-input text-foreground placeholder:text-muted-foreground`.

## Pass 4 — Layout, sidebar hover, support widget, icons

1. **Sidebar hover regression**
   - Default: `text-sidebar-foreground` on `bg-sidebar`.
   - Hover: `bg-sidebar-accent text-sidebar-accent-foreground` (light beige + dark text).
   - Active: `bg-sidebar-primary text-sidebar-primary-foreground` (dark + white).
   - Icons inherit `currentColor` — fixes black-on-black automatically.
2. **Support chat bubble position** — locate the floating widget; adjust `bottom-*` offset so it sits below any floating action bar, still bottom-right, no overlap with the cookie banner / scroll-to-top.
3. **Page width / centering** — audit pages that have giant right-side gutters: usually a missing `max-w-screen-2xl mx-auto` on the page-level wrapper. Apply consistently without breaking the locked 88px L-shaped frame.
4. **Footer & developer logos** — verify `DeveloperLogo.tsx` white-padded standard (memory v7-locked) is still used; replace any faded `<img>` with the component.

## Pass 5 — Metrics, charts, and final QA

1. **Score / metrics color hierarchy** — apply the locked Data Visualization Standard:
   - Positive: emerald, with ↑ icon
   - Negative: red, with ↓ icon
   - Neutral: muted-foreground, with — icon
   - Touch dashboard tiles, market intelligence bars, CRM stats cards.
2. **Market Dashboard chart bars** — pass `fill="hsl(var(--primary))"` + accent series colors instead of grey defaults.
3. **Final QA sweep** — visually walk through: CRM, Relationships Hub, Dashboard, Market Intelligence, Careers, Join, Sidebar, Header filters, Cards, Modals, Forms. Report screenshots of any remaining issues for a follow-up pass.

---

## What I will NOT do

- Add new features, pages, components, or sections.
- Delete any existing feature, button, link, or content (No Removal Policy).
- Touch locked surfaces (Footer Corporate Standard, AI Premium Purple, Header/Sidebar v11) beyond the contrast/hover fixes specified above.
- Change brand colors, typography family, or the L-shaped frame geometry.
- Migrate to a different component library or restructure routes.

## Deliverable per pass

After each pass I'll report: files touched, what was fixed, anything that turned out to be already-correct (false positive), and anything that needs your decision before continuing.

---

**Approve this plan to start Pass 1.** If you'd rather I jump straight to a specific pass first (e.g., "Pass 3 CRM modal is blocking me, do that first"), tell me which pass to lead with and I'll re-order.
