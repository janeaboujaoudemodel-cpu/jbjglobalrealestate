# Phase 1 Audit — JBJ Design System

Generated: 2026-06-28. Read-only inventory. Nothing deleted yet.

## Scope reality

| Metric | Count | Implication |
|---|---|---|
| `src/index.css` lines | **17,977** | Largest single file in repo |
| Numbered PASS blocks | **77** (PASS 1 → PASS 88, with gaps) | Many supersede earlier passes but were never removed |
| Hardcoded color utilities in components (`text-white`, `bg-black`, `text-emerald-N`, `bg-[#…]`, etc.) | **14,783** occurrences across `src/components` + `src/pages` | Every one is a potential contract violation |
| Button-like primitives in `ui/` | **6** (`button`, `brand-button`, `hero-button`, `premium-hero-button`, `pearl-button`, `HandoverPill`) | Must consolidate to 1 + variants |
| Badge/chip/pill primitives | **5** (`badge`, `card-badge`, `price-badge`, `price-pill`, `HandoverPill`) | LOCKED: `PricePill`. Others candidates for merger |
| Icon-tile primitives | **3** (`icon-tile`, `themed-icon`, `SquareChatIcon`) | LOCKED: `IconTile` is canonical per memory |
| Sidebar implementations | **13** | Many are portal-specific by design (Broker, CRM, Owner, Developer-hub, FAQ floating, Founders chat). Only `GlobalVerticalNav` is the platform sidebar |

## Honest assessment

A complete tear-down and rebuild of a 17,977-line CSS file plus migration of ~14,783 hardcoded color usages cannot be done safely in a single turn. Attempting it risks:

1. Silently breaking LOCKED standards (Signature row, Phone+cmdk, Hero rule, Mortgage slider, Document Studio, Active Card Sheen, etc.) that are interleaved inside the PASS blocks.
2. A massive PR that no human can review — exactly the "stack more overrides" anti-pattern in reverse.
3. Regressions across portals (Broker, Owner, Developer, CRM) that we cannot validate visually in one pass.

## Recommended execution: split Phase 1 into 1.A → 1.D

Each sub-phase is shippable, validatable, and reversible.

### Phase 1.A — Tokens + new primitive layer (additive, zero deletions)
- Add a clean `--jjds-*` token namespace at the top of `index.css` that mirrors the existing tokens but with one authoritative definition each.
- Add new primitives `Button` v2, `Badge` v2, `HeaderControl`, `SidebarItem` under `src/components/ui/ds/` so existing pages are untouched.
- Document the variant matrix in `.lovable/ds-variants.md`.
- **No deletions. No migrations. No risk to LOCKED standards.**
- Validation: render a `/ds-preview` route that exercises every variant.

### Phase 1.B — Migrate Header + Sidebar primitives only
- Migrate `HorizontalUtilityBar` (Search, Filter, Heart, JB, AED, Mode, sqft) to `HeaderControl`.
- Migrate `GlobalVerticalNav` rows (including Contact, Support, Sign Out, Collapse) to `SidebarItem`.
- Delete only the PASS blocks proven obsolete by these two migrations (expected ~10 PASS blocks: 10, 12, 14, 15, 16, 21, 23, 24, 27, 28, 29, 31, 32, 56 — all sidebar/header specific).
- Validation: Playwright pass across Home / Careers / AI Home Finder / Market Intel / Broker Portal / Owner Portal on desktop + iPad + mobile.

### Phase 1.C — Migrate Buttons + Badges everywhere
- Codemod `brand-button`, `hero-button`, `premium-hero-button`, `pearl-button` usages to `<Button variant=…>`.
- Codemod ad-hoc `<button>` elements that use hardcoded color classes.
- Delete obsolete button PASS blocks (10, 11, 13, 17, 18, 29, 30, 33–46) once their selectors are unreachable.
- Validation: full-site Playwright pass.

### Phase 1.D — Surface contract cleanup
- Replace the remaining contrast PASS blocks (44, 47, 49, 50, 57, 60, 62) with the single `:where()` surface contract documented in the plan.
- Keep the LOCKED section verbatim.
- Final delete-list applied.
- Validation: full-site Playwright pass + diff screenshots against Phase 1.A baseline.

## LOCKED — DO NOT TOUCH in any sub-phase

Confirmed via `mem://index.md`:
- Signature+Gold Divider Lock
- Phone+cmdk Lock
- Hero Rule (`[data-hero-dark]` + video)
- Emerald Box Lock (own-background emerald → white)
- Champagne Band System (`.jj-band`)
- Universal Same-Tone Contrast Guard
- Mortgage Slider Final Parity (PASS 37, 44b, 47b/c/d)
- Active Card Sheen
- Document Terms Readability + Signature row
- Hardened PII / RLS / edge function selectors
- Header/Sidebar Alignment v11 (88px L-frame)
- Price Pill, Developer Link, IconTile primitives

## Candidate delete list (proven duplicates — for 1.B/1.C)

Reviewed via grep titles only. Confirmation required before deletion in the relevant sub-phase:

| PASS | Title (paraphrased) | Superseded by |
|---|---|---|
| 8 | Off-brand color neutralizer | Will be encoded as `:where` surface rules in 1.D |
| 9 | Ink-emerald gradient replacement | 1.D surface contract |
| 10 | White-on-emerald hard lock + premium float CTA | 1.D (rule survives, file moves) |
| 11 | Hero search + newsletter + emerald CTA lock | 1.C Button + 1.D |
| 12, 15, 16, 24, 27, 28 | Repeated sidebar emerald locks | 1.B SidebarItem |
| 13, 14 | Hero/newsletter polish | 1.C |
| 17 | Card CTA trio lock | 1.C Button variant |
| 18, 33, 34, 35, 36, 37, 39, 40, 41, 42, 45 | "Final emerald" iterations | 1.C / 1.D |
| 19, 20 | Hero/services tab locks | 1.C |
| 21, 23, 29, 29.1, 30, 30.1, 31, 31.1, 32 | Header chrome iterations | 1.B HeaderControl |
| 22 | Light surface wins globally | 1.D `:where` |
| 25 | Accordion chevron visibility | Keep until FAQ primitive ships in Phase 3 |
| 26 | Blue → emerald purge | 1.D color-purge rule |
| 46e, 47, 50 | "FINAL" guard overrides | 1.D `:where` |
| 49 | Dropdown/popover contrast | 1.C Dropdown variant |
| 56, 56B | Backend emerald/white | 1.B SidebarItem (backend shell) |
| 57 | Light-surface ink lock | 1.D `:where` |
| 60 | Single emerald lock | 1.D `:where` |
| 62 | Rail + emerald contrast root | Keep — defines page rails |
| 63–88 | Specificity hacks | Already noted as replaced by 62 |

## Next action

Ship Phase 1.A this turn (additive, zero risk). Surface the variant catalog + `/ds-preview` route for visual sign-off. Then proceed sub-phase by sub-phase with explicit go/no-go.
