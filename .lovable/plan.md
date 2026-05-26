## Document Studio — fixes

### 1. Header (LockedLetterhead + topbar)
- `LockedLetterhead.tsx` / `jbjLockedChrome.ts`: enlarge monogram from `64px` → `96px`, push it to the far left (remove the centered-row gap, anchor it with `padding-left: 24px`), keep wordmark + "L.L.C · S.O.C" untouched (black, same size, same position).
- Topbar Signature / Stamp / Fullscreen buttons: currently sit inside the overlay but the AI right rail (`aside w-[360px]`) overlaps them on this viewport (1159px). Make the topbar `relative z-10` and let the right rail start *below* the topbar (already does) — real issue is that `Pages` + 4 buttons + close overflow at 1159px and wrap behind the AI panel. Fix by:
  - Reducing right-side button labels to icons-only under `lg:` (keep tooltips).
  - Wrapping the right cluster in `flex-wrap` is wrong for a topbar — instead `min-w-0` the stepper and `shrink-0` the right cluster so Signature/Stamp stay clickable.

### 2. Empty preview by default (remove forced AI generation)
- Remove the “Generate with AI” primary button from Step 2 footer. Keep only “Continue to Review & Send”.
- In the center A4 preview, when `bodyHtml` is empty, render a clean blank A4 body (no `<EmptyBody>` CTA) containing only the locked, draggable field placeholders:
  - Date (top-right of body, auto-fills today)
  - Party A signature line (left, bottom)
  - Party B signature line (right, bottom)
- The “Generate with AI” option moves into the right AI assistant panel only (already exists via `AiEditChatPanel`). Owner types content directly or asks AI from the side panel.

### 3. Draggable / removable fields on the page
- Replace the fixed `absolute left-12 bottom-12` signature/stamp blocks with a generic `<DraggableMark>` component:
  - Drag with pointer events; clamp inside the A4 body.
  - Hover shows a small `×` (red) top-right → calls `removeMark(kind)`.
  - Persist position in `marks[kind].x / y` (added to `DocumentMarks`).
- Field kinds rendered: `signature` (party A), `signatureB` (party B / applicant), `stamp`, `date`. Each is independently draggable and removable.
- When a kind is removed, topbar “Signature” / “Stamp” buttons re-add it at default coords (so the user can bring them back).

### 4. White block under footer
- Cause: `height: 1056 * pages - 220` in the body wrapper forces a tall body even when content is empty, leaving white space before `<LockedFooter />`. Fix:
  - When `pages === "auto"` and `bodyHtml` is empty, use `minHeight: 480` (just enough for the placeholder fields).
  - For fixed page counts, compute body height as `1123 * pages - headerH - footerH` measured at runtime instead of the hard-coded `-220`, eliminating the residual white strip.

### 5. Non-clickable Signature / Stamp / template buttons
- Root cause is the `AiEditChatPanel` overlay catching pointer events because the topbar cluster is hidden behind it at 1159px width. Fixed by the topbar layout change in (1).
- Also add `pointer-events-auto` + `z-20` to the topbar container, and `z-0` to the right `aside`.

### 6. Wording / labels
- “Generate with AI” button removed everywhere in left rail. AI panel header keeps “AI assistant”.
- Step 2 left-rail bottom: only “Continue to Review & Send” (always enabled — no AI gate).

### Technical notes
- Files touched:
  - `src/components/document-studio/DocumentStudio.tsx` — remove `<EmptyBody>` CTA + Generate button, add blank-template renderer with default `DraggableMark` placeholders, fix topbar layout + min-height math, wire `signatureB` + `date` into `marks`.
  - `src/components/document-studio/LockedLetterhead.tsx` + `src/templates/jbjLockedChrome.ts` — monogram size 96px, left padding 24px, gap reduced.
  - New `src/components/document-studio/DraggableMark.tsx` — generic drag + remove (`×`) primitive.
  - `src/components/document-studio/export/exporters.ts` — extend `DocumentMarks` with `signatureB`, `date`, and `x/y` positions so PDF/DOCX/print honor placement.
- No backend / RLS changes. Pure frontend.

### Out of scope (will not change)
- Wordmark text, color, or position.
- Footer content / colors.
- AI model, edge functions, template catalog.
