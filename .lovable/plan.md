# Fixes — Project Detail Page Pass

All work is CSS + presentation. No behavior, no colors, no layout sizes change. Every task ends with a Playwright screenshot in `/mnt/documents/`.

## Task 1 — Developer logo card
File: `src/components/project-detail/owner/DeveloperLogoUploader.tsx`
- Remove the full-card black overlay "Change logo" button.
- Keep the logo image centered as-is (no size / frame / animation change).
- Replace with a small pencil icon floated **outside** the top-right of the card (same pattern as the pencil next to "Majid Al Futtaim Properties"): 24px round, champagne bg, gold hairline, black pencil. Clicking still opens the file picker.
- Hidden `<input type="file">` stays.

## Task 2 — Replace all "Edit section" buttons with a pencil-only affordance
Scope: every `Edit section` / `Edit …` button on the project detail page (Owner Portal sections: About Developer, Project Location, Payment Plan, Brochure, Mortgage, etc.).
- Grep for `Edit section` and any large owner edit buttons in `src/components/project-detail/**` and swap the button rendering to the same pencil primitive used by `InlineEditable` (24px, champagne bg, gold border, black pencil). No label text.
- Keep onClick handler intact.

## Task 3 — Emerald contrast: force pure white text + icons on remaining offenders
File: `src/index.css` (extend the existing terminal PASS)
Targets that still render dark ink on emerald:
- Map layer buttons "Satellite / Street / Terrain"
- "Click to enable map interaction" overlay pill
- Payment Plan tab pill (`Payment Plan (…)` active row) + icon
- "Register Interest" tab pill + icon
- "Visible" toggle button (brochure row) + eye icon
- Any `.jj-surface-emerald`, `[data-surface="emerald"]`, `.bg-emerald-*` button/pill/tab descendant

Add a single ultra-high-specificity block:
```
html body :is(button,a,[role="tab"],[role="option"],.jj-surface-emerald,[data-surface="emerald"]):where(.bg-emerald-900,.bg-emerald-800,.jj-surface-emerald,[data-surface="emerald"],[data-state="active"].jj-tab-emerald) ,
html body :is(...) * {
  color:#FFFFFF !important;
}
html body :is(...) svg { color:#FFFFFF !important; stroke:#FFFFFF !important; }
```
Exclude `body[data-ai-tools-scope="true"]` and `[data-preserve-surface]`.

## Task 4 — Brochure "Project Documents" card
File: brochure/documents card component under `src/components/project-detail/**`
- The lower half of the card currently shows a champagne band with "DISTRIKT / Brochure / VIEW".
- Fill the entire lower band with the same ink-emerald gradient used by the "BROCHURE" chip, with pure white text.
- For every additional document (floor plan, payment plan, etc.) render the same card style: hero image on top, ink-emerald band on bottom with the doc type label + VIEW.

## Task 5 — Brochure bullet circles (Full floor plan / Detailed specs / Payment plan breakdown)
File: `src/components/project-detail/brochure/*` (bullet list)
- Circles are currently squished ovals with no icon.
- Enforce `w-8 h-8 rounded-full shrink-0 grid place-items-center` + `aspect-square`.
- Add the matching Lucide icon (`FileText`, `ClipboardList`, `Wallet`) in pure white.

Same treatment for "Generate Presentation" bullets (currently emerald circles with sparkle icons but squished on some viewports) — enforce `aspect-square` + white icon.

## Task 6 — Mortgage stat tile icons
File: mortgage calculator stat tiles component
- The small icon badges on Property Price / Down Payment / Loan Amount / Monthly Payment / Interest / Total Cost render vertically squished.
- Enforce `w-10 h-10 aspect-square rounded-lg` (square, not oval), keep ink-emerald bg, white icon.

## Verification
For each task, Playwright at 1440 + 820 widths, screenshots to `/mnt/documents/pass-final-taskN-*.png`, and view them before claiming done.

## Out of scope (do not touch)
- Colors, gradients, spacing, animations, box sizes, card edges
- AI Tools scope (`body[data-ai-tools-scope="true"]`)
- Any behavior/handlers
