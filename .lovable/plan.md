## Goals
1. **Stop tables/sections from being cropped across PDF pages** — slice on logical block boundaries, not fixed pixel intervals.
2. **Never lose form work** — persist Document Studio session (template, fields, owner info, signatories, etc.) to localStorage and restore automatically on reopen / refresh / accidental close.

## 1. Smart PDF page-breaks (no mid-table cuts)

### Mark every block that must stay together
In `src/templates/composers/index.ts` add `data-pdf-section` AND inline `page-break-inside:avoid; break-inside:avoid;` to every unbreakable block:
- `termsTable()` `<table>` wrapper
- `commissionTable()` `<table>` wrapper
- `quotation` table in Holiday Home (already has the style — add the attribute)
- `terms` `<ol>` block + each `<li>` gets `break-inside:avoid`
- Holiday Home `acknowledgement` box
- `signatureBlock()` outer `div` (already has `page-break-inside:avoid` — add `data-pdf-section`)
- Facility Management `standardTerms` + `scope` blocks
- `subjectLine`, `recipientBlock`, `dateLine`

### Replace the dumb pixel slicer in `src/components/document-studio/export/exporters.ts`
Rewrite `exportPdf` so that after `renderElementCanvas(page)` produces the full-height canvas, we:
1. Collect Y-coordinates of every `[data-pdf-section]` element relative to the captured page (using `getBoundingClientRect()` against the page root, multiplied by the canvas scale of 2).
2. Walk pages: target `sliceHpx = canvas.width * 297 / 210` per A4 page. For each page boundary, find the **largest section-end Y that is ≤ targetBoundary**. If no section fits before the boundary, fall back to the raw boundary (single block taller than a page — unavoidable). Always ensure progress (>0 px per page).
3. Draw each slice on a fresh A4-sized canvas with champagne background; remaining empty space at the bottom is intentional whitespace, not a cut row.
4. Re-add the locked footer onto every slice **except** the last (the captured page already has the footer at its bottom). Simpler: skip this and accept that the footer only appears on the last page — same as today. *(Keep it simple this pass.)*

Code skeleton:
```ts
const sectionBottoms = Array.from(page.querySelectorAll<HTMLElement>('[data-pdf-section]'))
  .map(el => (el.offsetTop + el.offsetHeight) * scale)
  .sort((a,b) => a - b);

let y = 0;
while (y < canvas.height) {
  const target = y + sliceHpx;
  let cut = target >= canvas.height
    ? canvas.height
    : (sectionBottoms.filter(b => b > y && b <= target).pop() ?? target);
  if (cut <= y) cut = Math.min(target, canvas.height); // single oversized block
  // draw slice [y, cut] onto an A4-sized canvas with champagne fill
  y = cut;
}
```

### Mirror in preview page-break overlays
Update the dashed-gold "Page X of N" overlays in `DocumentStudio.tsx` to use the same `sectionBottoms` computation so the visible breaks match what the PDF will produce. Computed in a `useEffect` watching `bodyHtml` + `measuredPageH`.

## 2. Persistent Document Studio session

### Storage shape
Key: `jbj:doc-studio:session:<catalog>` (separate keys for `staff` and `client`).

Payload:
```ts
{
  v: 2,
  templateId, fields, department, commissionRows, customFields,
  ownerName, ownerTitle, ownerDate, applicantDate,
  extraSignatories,
  hiddenFieldKeys: string[], fieldLabelOverrides, hiddenSections: string[],
  bodyHtml, userEdited,
  marks, // signature/stamp positions
  docLanguage,
  step,
  savedAt: ISO timestamp,
}
```

### Hooks in `src/components/document-studio/DocumentStudio.tsx`
- **On mount** (inside `StudioShell`): read the localStorage key for `catalog`; if present and `savedAt` < 30 days old, restore all state setters before any render that would overwrite. Show a single dismissable toast "Restored your last draft · [Discard]" so the user knows.
- **On every state change**: debounced (400 ms) writer using `useEffect` watching the persisted slice. Don't write while the initial restore is still hydrating (guarded by a `hydratedRef`).
- **On `beforeunload`**: flush a synchronous final write so closing the tab never loses the last keystroke.
- **On successful Send**: clear the key (the draft has shipped).
- **On user clicking "Discard draft"** in the restored toast: clear the key and reset state.
- **Cross-tab sync**: subscribe to the `storage` event; if another tab writes a newer `savedAt`, ignore (don't auto-clobber what the user is currently editing).

### Edge cases
- Quota / disabled storage → wrap reads/writes in try/catch; silently no-op.
- Template change resets fields (existing behavior) → still persist the new state.
- `marks` may contain blob URLs that don't survive reload; for signature/stamp, persist only the asset reference fields the user picked (URL strings from `useOwnerAssets` are signed URLs — they re-validate; OK to keep).

## Files touched
- `src/templates/composers/index.ts` — add `data-pdf-section` + `break-inside:avoid` to every unbreakable block (termsTable, commissionTable, quotation, terms, acknowledgement, signatureBlock, facility standardTerms, scope, subjectLine, recipientBlock).
- `src/components/document-studio/export/exporters.ts` — rewrite `exportPdf` slicing loop with section-aware cuts; expose helper used by preview.
- `src/components/document-studio/DocumentStudio.tsx` — add session persistence (load on mount, debounced save on change, beforeunload flush, restored-draft toast, cross-tab guard, sync preview page-breaks with the same section-bottom math).

## Out of scope
- DOCX page breaks (Word already paginates on its own).
- Re-rendering the footer on every PDF page (kept as last-page footer).
- Server-side draft sync (localStorage only — survives refresh, tab close, laptop sleep).
