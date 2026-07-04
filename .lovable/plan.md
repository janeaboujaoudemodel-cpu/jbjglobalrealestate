## Scope

Two separate global contrast problems, fixed one at a time with Playwright screenshot proof after each.

**Do NOT touch:** homepage, sidebar, horizontal header, footer, AI tools routes (`/ai-*`, `/rental-index`, `/toolkit/*`, `/ai-hub`, `/meeting-center`, `/voice-settings`, `/my-ai-history`), the emerald search input, the Contact Us CTA, filter chips/buttons themselves on project pages (only their opened dropdowns).

---

## Task 1 — Fix emerald surface contrast site-wide (project page + map)

**Problem:** On `/project/*` cards ("24/7 Security", "Central Smart", amenity/inclusion tiles) and on `/map` (list cards, hover cards, active layer/segment buttons), some surfaces still render flat green instead of the ink-emerald gradient (`#064E3B → #042C1C → #000`), and some text/icons render black on emerald instead of pure white.

**Approach:**
1. Run a Playwright audit on `/project/safa-two-de-grisogono-damac-53` and `/map` that walks every element, finds anything with an emerald-family background (green-dominant, low luminance) and reports:
   - background is flat vs. gradient
   - any descendant text/icon whose computed `color` is not white
2. From the audit output, identify the **winning CSS rules** (using `getMatchedCSSRules`-style enumeration already used in `tmp/inspect-winning-css.mjs`) that are:
   - painting flat emerald instead of the gradient, OR
   - forcing black text/icon color on emerald ancestors
3. Add a final PASS block at the end of `src/index.css` that:
   - Repaints any element whose background is emerald-family (`bg-emerald-*`, `bg-[#064E3B]`, `bg-[#065F46]`, `.jj-surface-emerald`, `[data-surface="emerald"]`, `.jj-pill-emerald*`, `.jj-map-*[data-active="true"]`, `.jj-map-list-card`, `.jj-map-hover-card`, `.jj-map-project-card`, `.jj-map-count-pill`) with the canonical `--gradient-ink` and gold hairline.
   - Forces `color:#FFFFFF !important` and `svg{color:#FFFFFF;stroke:#FFFFFF}` on all descendants of those surfaces, with higher specificity than existing Tailwind `text-*` / component rules (use `:where()` or attribute+class chains as needed to beat the current winners).
   - Explicitly excludes AI tools scope (`body[data-ai-tools-scope="true"]`), homepage (`body[data-route="/"]`), header, sidebar, footer, and `[data-ink-emerald-opt-out]`.
4. Re-run the audit; iterate until zero offenders on both routes at 1440, 1280, 1024, 820, 414 widths.
5. Save annotated screenshots to `/mnt/documents/task1-*.png` and only then report Task 1 done.

---

## Task 2 — Global form-dropdown skin (champagne body, emerald active row)

**Problem:** Header search dropdown is correct. All other Radix Select / Popover / DropdownMenu / cmdk poppers (header non-search dropdowns, project page filter dropdowns for Developer/Area/etc., forms across the site) must render:
- Body: champagne/gold gradient (`#FDFBF7 → #F7F2EA → #EFE6D6`), gold hairline, **black text and black icons**
- Hover / active / selected row: emerald→black gradient (`#064E3B → #042C1C → #010806`), **pure white text and white icons**

**Approach:**
1. Locate the existing "GLOBAL FORM DROPDOWN GOLD LOCK" and PASS 220 "Global Dropdown Champagne + Emerald Accent Lock" blocks in `src/index.css`. There's a conflict — the form-dropdown lock paints active rows with a *gold* gradient, contradicting PASS 220 which paints them emerald. Consolidate to a single rule that matches the memory `dropdown-champagne-emerald-accent-lock`.
2. Rewrite the champagne + emerald-accent lock so it targets:
   - `[data-radix-popper-content-wrapper] [data-radix-select-content]`
   - `... [data-radix-popover-content]` (except `[data-filter-dropdown]` on `/map` and except header search)
   - `... [data-radix-dropdown-menu-content]`
   - `[cmdk-list]`, `[role="listbox"]`
   With champagne surface + black ink + gold hairline.
3. Active/hover/selected row selector set:
   - `[data-state="checked"]`, `[data-highlighted]`, `[aria-selected="true"]`, `[data-selected="true"]`, `:hover`
   - Paint with `--gradient-ink`, force `color:#FFFFFF` and `svg{color:#FFFFFF}` on all descendants.
4. Preserve existing opt-outs: `[data-account-menu-content]` (header account stays emerald body), `body[data-ai-tools-scope="true"]` (all AI-tool poppers untouched), `[data-preserve-surface]`, `[data-jbj-preserve-surface]`. Also skip `[data-header-search]` popper (if not already excluded).
5. Delete or neutralize the conflicting "GLOBAL FORM DROPDOWN GOLD LOCK" active-row gold gradient so emerald wins on hover/active. Keep the champagne trigger styling only where triggers are inside `<form>` — untouched.
6. Playwright verification on:
   - `/project/safa-two-de-grisogono-damac-53` — open Developer and Area filter dropdowns, hover an option
   - A form route with Select (e.g. `/contact` or Request Callback modal) — open, hover, select
   - Header non-search dropdown (e.g. Discover menu) — open, hover
   - Verify AI tools popper on `/ai-hub` is unchanged (champagne must NOT apply)
   For each: capture background gradient, active row background, active row text/icon color; assert body=champagne+black-ink, active=ink-emerald+white.
7. Save screenshots to `/mnt/documents/task2-*.png`, iterate until all assertions pass, then report Task 2 done.

---

## Order & reporting

1. Task 1 first (project + map emerald surfaces). Report with proof screenshots.
2. Then Task 2 (dropdown skins). Report with proof screenshots.

No "fixed / done / complete" claim will be made without the corresponding screenshots + audit output showing zero remaining offenders.

## Files expected to change

- `src/index.css` — new final PASS block for Task 1; rewritten champagne+emerald dropdown lock and neutralized conflicting gold-active rule for Task 2.
- Possibly `src/components/ui/popover.tsx` if the `data-surface="emerald"` default on `[data-filter-dropdown]` conflicts with Task 2 (will be handled by scoping, no component change expected).

No changes to homepage, header, sidebar, footer, AI tools, or business logic.
