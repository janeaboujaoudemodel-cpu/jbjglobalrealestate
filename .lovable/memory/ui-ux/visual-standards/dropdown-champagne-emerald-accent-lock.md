---
name: Global Dropdown Champagne + Emerald Accent Lock
description: Site-wide dropdown standard — champagne luxury surface with ink text; emerald→black accent with pure white ink on hover/active/selected. Account dropdown follows this too.
type: constraint
---

## The rule (locked)

**All dropdowns** (Select, Combobox, Popover with options, DropdownMenu, Command palette) MUST render on a **champagne/gold luxury surface** with dark ink text.

**Hover / active / selected row** MUST use the emerald→black metallic gradient with **pure white text and white icons**:
```
background-image: linear-gradient(135deg, #064E3B 0%, #042C1C 55%, #010806 100%);
color: #FFFFFF; svg { color: #FFFFFF; }
```

Champagne surface:
```
background-image: linear-gradient(180deg, #FDFBF7 0%, #F7F2EA 55%, #EFE6D6 100%);
border: 1px solid rgba(184,149,85,0.42);
```

## Exceptions (opt-out)

- The horizontal-header user account dropdown also follows the champagne luxury surface with ink text. It is not an emerald exception.
- `body[data-ai-tools-scope="true"]` — ALL AI tool routes (`/ai-*`, `/rental-index`, `/toolkit/*`, `/ai-hub`, `/meeting-center`, `/voice-settings`, `/my-ai-history`) render every popper in the emerald account-menu skin, NO champagne. Enforced by PASS 221 in `src/index.css` and driven by `<AIToolsScopeMarker />` in `src/App.tsx`.
- `[data-preserve-surface]` / `[data-jbj-preserve-surface]` — escape hatch for calendars or custom UI.
- **Non-popper elements are NOT affected**: the emerald filter search bar (input) and the Contact Us CTA (button) keep their existing emerald styling.

## Where enforced

`src/index.css` — PASS 220 block at the bottom of the file. Rules use `:not(:has(> [data-account-menu-content]))` etc. to skip the opt-outs.

## How to apply for new dropdowns

Just use Radix `Select` / `Popover` / `DropdownMenu` / `cmdk` primitives — the lock handles surface + accent automatically. Do NOT hard-code emerald or dark backgrounds on option rows. Do NOT re-add gold gradient hover rules.

## Header attachment and currency row lock

- Horizontal-header dropdowns must stay attached to the clicked control: use Radix trigger positioning, `side="bottom"`, `align` per trigger, and `sideOffset={22}` so the content starts exactly at the 88px header bottom divider.
- Never force `[data-radix-popper-content-wrapper] { top: ... }`; that detaches the popper and pushes it into the hero.
- Currency rows match account-menu rows: no selected/highlighted box on open. Idle/selected rows are transparent with ink text; only a real hover/focus-visible state may turn emerald with pure white text/icons.
- Header search is a compact anchored panel under the search button and must not cross the vertical sidebar.
- Form poppers/selects must use a z-index above dialogs and open immediately without transitions/animations, so country, nationality, time, preferred time, and contact-method pickers never hide behind fields.

## Never do

- Do not add another global `[data-radix-popper-content-wrapper]` background rule that fights this one.
- Do not set `data-on-dark` on a new popper content unless you truly want a dark surface (which will still render champagne under this lock — only `[data-account-menu-content]` opts out).
- Do not paint filter chips or hero pills with this rule; it is scoped strictly to popper content.
