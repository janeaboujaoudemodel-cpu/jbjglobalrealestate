## Goal

1. Make the downloaded PDF match the on-screen preview exactly (same champagne header/footer, no blank space below the footer).
2. Save the current PAA chrome (champagne header + champagne footer band) as the **standard JBJ letterhead** that's used for any Leasing document.
3. Add a second saved template that is the same letterhead but with an **empty, plain‑text body** (not HTML) so it can be filled in any time as normal text.

---

## Why preview ≠ download today

`buildPAAHtml` wraps everything in a `<div style="…padding:24px 36px 14px;min-height:1123px;">`.

- The **header** and **footer** champagne bands use negative margins (`margin:-24px -36px 14px` and `margin:14px -36px 0`) to bleed into that padding.
- The wrapper's **bottom padding of 14px** is plain white (`background:#FFFFFF` from `chrome.surface`). That is the white strip the user sees under the gold footer band in the downloaded PDF.
- The on-screen iframe hides this gap because `EnvelopeDetail.tsx` injects extra CSS (`min-height:auto !important`, `margin-top:18px`) **only in the preview iframe** — the PDF capture container in `renderHtmlToPdfBlob` does not get that override, so the export still shows the gap.
- The "different colors" report is the same root cause: the stored PDF on Supabase was generated with an older `PAA_LAYOUT_VERSION` (no champagne bands). Auto‑regen only fires when `stored < PAA_LAYOUT_VERSION`, so bumping the version forces a fresh render that now matches the preview byte‑for‑byte.

---

## Changes

### 1. PAA template — single source of truth, no white strip

`src/templates/jbjPropertyAdvertisingAgreement.ts`

- Drop the wrapper's bottom padding (`padding:24px 36px 0`) so the footer's champagne band sits flush against the page bottom.
- Change the footer's outer margin to `margin:14px -36px 0` + add `padding-bottom:14px` inside the champagne band, so the gold/champagne fill extends all the way to the A4 edge.
- Bump `PAA_LAYOUT_VERSION` from `20` → `21` so every existing draft auto-regenerates on next open and the stored PDF picks up the fix.

### 2. Capture path mirrors preview

`src/hooks/useEsignTemplates.ts` (`renderHtmlToPdfBlob`)

- Set the off-screen capture container to `width:794px; height:1123px; overflow:hidden; background:#FFFFFF` so the document is clipped exactly at A4 — no extra page, no trailing white below the footer.
- No other rendering knobs change; html2canvas already runs at scale 3 with `useCORS` so the rasterised output equals the iframe.

### 3. Save the chrome as the official letterhead

Extract the PAA header + footer markup into a new shared module:

```
src/templates/letterheadChrome.ts
  - buildLetterheadHeader({ docNumber, title?, subtitle?, reraPermit? })
  - buildLetterheadFooter()
  - LETTERHEAD_PAGE_OPEN / LETTERHEAD_PAGE_CLOSE  (the A4 wrapper used by PAA today)
```

`buildPAAHtml` and `buildBlankLetterHtml` both consume this module so leasing PAAs and any letter share the same champagne header/footer pixel-for-pixel. No PAA wording, fields or behavior changes.

### 4. Upgrade the blank letter to the same letterhead + plain‑text body

`src/templates/jbjBlankLetter.ts`

- Replace the current header/footer with the shared `letterheadChrome` so the saved letterhead matches the PAA exactly.
- Replace `body_html` with **`body_text`** (plain text). Rendering: `esc(body_text)` inside `<pre style="white-space:pre-wrap;font-family:Inter;font-size:12px;line-height:1.65;">`. No HTML editor, no sanitiser path.
- Keep `subject`, `recipient`, `date`, `signer_name`, `signer_title` as plain inputs.
- Bump `BLANK_LETTER_LAYOUT_VERSION` to `2`.

### 5. Register the two saved templates

Run a Supabase migration that upserts two `esign_templates` rows so they appear in the e‑signature template picker:

```text
key                          | name                              | category
---------------------------- | --------------------------------- | --------
jbj-letterhead-leasing       | JBJ Letterhead — Leasing          | leasing
jbj-letterhead-blank         | JBJ Letterhead — Blank (fillable) | other
```

Both keys route through `buildBlankLetterHtml` in `renderTemplateHtml`. The Leasing one prefills `subject` empty and is filed under Leasing in the template list. The Blank one opens with no fields filled, ready to type plain text into `body_text`.

### 6. Editor UI tweak

`src/pages/e-signature/EnvelopeDetail.tsx`

- When `template_key` starts with `jbj-letterhead-`, show a single multi-line `<Textarea>` bound to `body_text` instead of the rich-HTML editor used for AI letters. Subject / recipient / date / signer name / signer title remain as simple inputs. No other panels change.

---

## Verification

1. Open the existing envelope `/e-signature/810df24a-…`. Auto‑regen kicks in (v21) → reload → click **Download PDF** → confirm header + footer show champagne bands, no white strip below the footer, and the file looks identical to the iframe.
2. From the e-signature template picker, create a new envelope from **JBJ Letterhead — Leasing** → confirm letterhead renders, body textarea is plain text, download PDF matches preview.
3. Same check for **JBJ Letterhead — Blank (fillable)** with an empty body.

## Out of scope

- No changes to the email send flow, signing flow, AI copilot, or any non-letterhead template.
- No wording or field changes in the PAA itself — only the bottom-padding fix and version bump.
