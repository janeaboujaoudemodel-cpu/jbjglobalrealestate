## Part 1 — Fix the PDF export so it matches the on-screen preview

**Root cause**
`renderHtmlToPdfBlob()` rasterises the template HTML at 794 px wide and then scales the JPEG into a 595 pt A4 page. That works on its own, but the HTML being passed in is not always the *same* HTML the iframe shows:

- The "preview" iframe in `EnvelopeDetail.tsx` renders with the full option bag — `chrome`, `ownerSignatureUrl`, `ownerStampUrl`, `clientSignatureUrl`, `hiddenFields`, `renderMode: "final"`, `category`.
- The on-demand regen call (`useRegenerateEnvelopePdf`, line 246) passes those options.
- But the **initial** render in `useCreateEnvelopeFromTemplate` (line 119) calls `renderTemplateHtml(template.key, mergedValues)` with **no opts** → falls back to `renderMode: "edit"` chip rows, no signatures, no hidden-field filtering. That's the "another style" the user sees if they download before the first save/regenerate completes.
- Cache-busting + `dirty` guard masks this for edited envelopes but not for fresh ones.

**Fix**
1. In `useCreateEnvelopeFromTemplate`, build the same opts bag used by `useRegenerateEnvelopePdf` (default chrome from `companyLegal`, `renderMode: "final"`, current owner signature/stamp from `useOwnerSignatureAssets`, empty client signature, no hidden fields) and pass it to `renderTemplateHtml`.
2. In `renderHtmlToPdfBlob`, render at the true A4 pixel size (`794×1123` min-height, fixed) and pin `pdfHeight = 842 pt` so the export is **always** single-page A4 instead of an elongated screenshot. Add `useCORS:true, letterRendering:true, windowWidth:794` to `html2canvas` so embedded signature/stamp PNGs and Google fonts come through identically to the iframe.
3. In `EnvelopeDetail.handleDownload`, after a successful save, invalidate the bust-URL cache key so the next click reads the freshly regenerated PDF (already partly there — make it deterministic by awaiting the regenerate mutation result before resolving `ensureSavedBeforeDownload`).
4. Bump `PAA_LAYOUT_VERSION` 18 → 19 so existing envelopes auto-regenerate once.

---

## Part 2 — New "Blank Letter" template with AI body + drag-in signature/date/stamp

A second template alongside PAA & Listing Authorisation that gives the user a blank A4 with **only** the corporate header and footer and an AI-driven body.

### Template structure (`src/templates/jbjBlankLetter.ts`)

```text
┌──────────────────────────────────────────┐
│  HEADER  — JBJ wordmark · gold divider   │
│  Trade licence + doc number              │
├──────────────────────────────────────────┤
│                                          │
│   AI prompt strip (edit mode only):      │
│   ┌────────────────────────────────────┐ │
│   │ "Write a job offer for…"  [Generate]│ │
│   └────────────────────────────────────┘ │
│                                          │
│   Subject:  ____________________         │
│   Date:     12 May 2026                  │
│                                          │
│   <AI-generated body, editable           │
│    contenteditable HTML>                 │
│                                          │
│   ── signature divider ──                │
│   Name / Title / Signature / Stamp slot  │
│                                          │
├──────────────────────────────────────────┤
│  FOOTER  — clickable links, hairline     │
└──────────────────────────────────────────┘
```

- Header + footer reuse the exact components from PAA v18 so brand stays consistent.
- Body is a `contenteditable` div in edit mode, plain HTML in final mode.
- "Insert field" toolbar (chips): **Date**, **Signature**, **Initials**, **Stamp**, **Text field**, **Divider**. Click a chip → inserts a `<span data-field="…">` placeholder at the caret. In final mode each placeholder renders the resolved value (date today, owner saved signature/stamp, etc.).

### AI generation

- New edge function `letter-ai-generate` using **Lovable AI Gateway** (`google/gemini-3-flash-preview`).
- Input: `{ prompt, recipientName?, language?, tone? }`.
- Output: structured `{ subject, body_html }` via `Output.object({ schema })` so we never get free-form markdown.
- System prompt enforces JBJ tone, UAE business letter conventions, no fake legal text, no markdown fences.
- Quick-pick prompt presets the user can click instead of typing: **Job Offer**, **Warning Letter**, **VAT Exemption Letter**, **NOC**, **Salary Certificate**, **Termination**, **Reference Letter**, **Custom…**

### Stamp upload + place-on-click

- Reuse `owner_signature_assets` table + `useOwnerSignatureAssets("stamp")` (already exists).
- New "Stamp library" dropdown in the toolbar:
  - Lists saved stamps; `★ Default` flag; "Upload new" → inline `<input type=file>` → saves via `useSaveSignatureAsset({kind:"stamp", makeDefault?})`.
- Click "Stamp" tool → cursor switches to crosshair → next click on the document inserts the **default stamp** at that position as an absolutely-positioned `<img>` inside the body. Same flow for Signature.
- Stamps render with `mix-blend-mode: multiply` via the existing `<StampOverlay/>` so they look like real ink on export.

### Persistence + export

- Stored in `esign_envelopes` with `template_key = "jbj-blank-letter"`.
- `template_field_values` stores `{ subject, body_html, ai_prompt, placed_fields: [{type,x,y,page,assetId?}] }`.
- `renderTemplateHtml` gets a third branch:
  ```ts
  if (templateKey === "jbj-blank-letter") return buildBlankLetterHtml(values, opts);
  ```
- Export uses the **same** `renderHtmlToPdfBlob` (now A4-pinned from Part 1) so preview === download.

### New entry point

- "New letter" button on `/owner/e-signature/studio` next to the existing PAA / Listing Authorisation cards.
- Same envelope detail page (`EnvelopeDetail.tsx`) handles all three templates — only the body section swaps.

---

## Files to add / change

**New**
- `src/templates/jbjBlankLetter.ts` — `buildBlankLetterHtml(values, opts)`
- `src/components/e-signature/BlankLetterEditor.tsx` — contenteditable body, AI prompt strip, field toolbar, stamp-place-on-click
- `supabase/functions/letter-ai-generate/index.ts` — Lovable AI structured-output call
- `src/hooks/useLetterAiGenerate.ts`

**Edit**
- `src/hooks/useEsignTemplates.ts` — branch on `jbj-blank-letter`; pass full opts bag in `useCreateEnvelopeFromTemplate`; A4-pin export
- `src/templates/jbjPropertyAdvertisingAgreement.ts` — bump `PAA_LAYOUT_VERSION` to 19
- `src/pages/e-signature/EnvelopeDetail.tsx` — render `<BlankLetterEditor>` when `template_key === "jbj-blank-letter"`; ensure-saved fix
- `src/pages/e-signature/SignatureStudio.tsx` (or whichever lists templates) — add "Blank Letter" tile

## Where to test

- `/owner/e-signature/studio` → "New letter" → type "Write a job offer for Jane Doe as Senior Broker, AED 18,000/month, start 1 Jun 2026" → Generate → adjust → place stamp/signature → Download → confirm PDF == preview.
- Existing `/e-signature/810df24a-…` → Download PDF → confirm now identical to on-screen preview after Part 1 fix.
