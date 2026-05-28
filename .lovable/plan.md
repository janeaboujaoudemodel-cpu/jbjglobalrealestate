# Document Studio — Header Toolbar, Auto-Compose Preview, Clickable Stamp/Signature

Fix the three concrete gaps the user is hitting:

1. **Export & Print are buried inside the right-side "Send via Branded Email" panel.** Promote them to a persistent top toolbar so they are visible the moment Document Studio opens.
2. **The pre-composed structure (subject + AI intro + terms-of-employment table + commission table + signature block with owner sig/stamp + counterparty signature + date) is already produced by `renderStandardBody()` and wired to `setBodyHtml()`, but the user reports the preview is not showing it.** Audit and guarantee it renders on first template selection — even before "Generate" is clicked — for every template, and surface a clear "Composed template — body will follow selection" placeholder when an AI section is empty.
3. **Signature & stamp marks in the preview are not clickable.** Today `DraggableMark` only handles drag + a hover-× remove button. Make them tap/click-actionable.

## What changes

### A. Persistent top toolbar in Document Studio (`src/components/document-studio/DocumentStudio.tsx`)

A single sticky toolbar across the top of the editor surface, visible on every step ≥ 2:

```text
[← Templates] [Template name]      [Reset]  [Print]  [Export ▾]   [Send ▾]
```

- **Export ▾** dropdown: PDF, PNG, Word (.docx), PDF + PNG. Wired to existing `handleExport(...)`.
- **Print** button: wired to existing `handlePrint()`.
- **Send ▾** keeps the existing branded-email flow (Send via Branded Email, Send Test).
- Disable Export/Print when `bodyHtml` is empty; show spinner when `exporting !== null`.
- The right-side Email panel keeps its own Send button but loses the duplicated Export controls (single source of truth in the header).
- Champagne surface, gold hairline, ink text. No new colors. No black-CTA regression (navy lives in body, header buttons are champagne outline + ink).

### B. Guarantee auto-compose on template select

- Audit the `useEffect` at line 1002 (`renderStandardBody → setBodyHtml`). Confirm that for every template id (job_offer, employment_contract, commission_agreement, NDA, partners, RERA forms, etc.) `compose()` returns: subject line → date line → recipient block → AI intro slot → terms table (when applicable) → commission table (when applicable) → AI closing slot → `signatureBlock()` with stamp + parallel counterparty cell.
- For templates where `aiIntro`/`aiClosing` are deterministically built in `standardBody.ts`, leave as is. For templates where they currently fall back to empty, insert a neutral champagne placeholder block (`"Tap Generate with AI to draft this section, or type directly."`) so the structure never collapses into a blank page.
- Ensure `userEditedRef.current` does NOT block the very first compose on template switch (already handled, but verify the reset path in `handleSelectTemplate`).
- Verify the signature block appears in preview on the last page even when the body is short enough to fit on page 1 — the existing pagination logic in `DocumentStudio.tsx` ~line 372 marks it `[data-pdf-section][data-signature-block]` as atomic; ensure that marker survives composer output for every template id.

### C. Clickable signature / stamp (`src/components/document-studio/DraggableMark.tsx` + `DocumentStudio.tsx`)

- Add an `onClick` prop to `DraggableMark`. Treat a pointer-down + pointer-up with < 6px movement as a click (so drag-vs-click is unambiguous).
- In `DocumentStudio.tsx`, pass `onClick={() => setAssetDialog("signature")}` (or `"stamp"`) for each mark. This re-opens the existing `AssetLibraryDialog` so the user can swap, resize, or upload a new mark with one tap.
- Add a hover hint chip ("Click to change · Drag to move") so the affordance is discoverable.
- Add a small floating action bar attached to each mark on hover: `[ Change ] [ Resize ] [ Remove ]`. The Remove button already exists; Change reopens the asset picker; Resize cycles width presets (160 / 200 / 240 / 300).

## Files touched

- `src/components/document-studio/DocumentStudio.tsx` — add top toolbar, prune duplicated Export from email panel, wire `onClick` on each `DraggableMark`, guarantee placeholder for empty AI sections.
- `src/components/document-studio/DraggableMark.tsx` — add `onClick` + click-vs-drag discrimination + hover action bar.
- `src/templates/composers/standardBody.ts` — only if any template id is missing an intro/closing entry; add a neutral placeholder so structure is always visible.

## Out of scope

- No change to letterhead, locked footer, per-page signature strip, or signature+gold-divider lock (`renderPerPageUserSignature` stays byte-identical).
- No change to the composer's signature block layout (owner cell + stamp + parallel counterparty cell on the same row — already correct).
- No DB / edge function / SEO changes.
- No new templates.
