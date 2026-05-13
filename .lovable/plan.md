## E-Signature tool — debug, repair, and end-to-end verification

The user uploaded a contract into the e-signature template (Property Advertising Agreement — Leasing, envelope `810df24a…`) and reports: the document text is rendering flipped/inverted, the loading spinner is broken, and the overall flow is unreliable. I confirmed in the DB that the envelope is `template_key=jbj-paa-leasing`, `status=draft`, `document_url` points to a stored PDF in the `esign-documents` bucket. The preview is wedged with a Lovable proxy 502 right now, so the visual fix has to be verified once the sandbox is back.

### 1. Fix the preview rendering ("flipped text")
Files: `src/pages/e-signature/EnvelopeDetail.tsx`, `src/hooks/useEsignTemplates.ts`, `src/templates/jbjPropertyAdvertisingAgreement.ts`, `src/templates/letterheadChrome.ts`.

- The preview iframe has two branches: a) `previewSrcDoc` rendered from `renderTemplateHtml(template_key, …)`, b) fallback `<iframe src=document_url>` when the HTML branch is null.
- `renderTemplateHtml` only matches a few keys explicitly and falls through to `buildPAAHtml` for everything else; for `jbj-paa-leasing` this is the intended path, but if the upload pipeline writes the wrong key or a stale `template_field_values`, the iframe falls back to the storage PDF — and any later auto-rerender via html2canvas can mirror the page when CSS includes `direction: rtl` or `transform` from injected chrome. Add an explicit allow-list for `jbj-paa-leasing` (and the variants `…-selling`, `…-letterhead`) and assert `direction:ltr; unicode-bidi:isolate; transform:none` on the outer wrapper of every template builder so no inherited style can flip glyphs.
- In the `srcDoc` shell (lines 774-819), force `<html dir="ltr">`, `body{direction:ltr; transform:none; writing-mode:horizontal-tb}` and remove the existing `body > div[style*="min-height:1123px"]` reset that depends on inline-style substring matching (brittle; templates change pixel values).
- For the PDF fallback iframe (lines 985-990), append `#toolbar=0&navpanes=0&view=FitH` and use the `download-file` proxy with `disposition=inline` so private bucket reads are authenticated and the browser's native PDF viewer renders the file natively (no html2canvas, so no flip risk).
- Re-examine `renderHtmlToPdfBlob` (`scale:3`, fixed 794×1123 capture) for any negative scale; lock `scale: Math.abs(devicePixelRatio||2)` and add a unit smoke test that checks the rendered canvas pixel at (0,0) vs (W,0) so a future regression that mirrors the canvas fails CI.

### 2. Fix the broken loading spinner
- Audit every `<Loader2 className="animate-spin" />` use in `EnvelopeDetail.tsx` — several spinners are gated behind `regenerate.isPending` only; switch them to `regenerate.isPending || isLoading` so the initial fetch shows progress and the post-save spinner clears when the React-Query invalidate completes.
- Wrap the page in a single `<Suspense fallback={<EnvelopeSkeleton/>}>` and replace the bespoke skeleton block with the existing `<Skeleton>` primitives.
- Verify `useQuery` `enabled:!!id` and add a `refetchOnWindowFocus:false, staleTime:30_000` to stop the spinner from re-firing on tab refocus.

### 3. Fix the upload → template pipeline
Files: `src/components/e-signature/SmartFillDropzone.tsx`, `supabase/functions/esign-auto-detect-fields/index.ts`, `supabase/functions/esign-load-document/index.ts`, `supabase/functions/esign-contract-analyzer/index.ts`.

- Confirm that uploads land in the correct bucket path and that the row that's written sets `template_key` to one of the known builder keys; reject unknown keys server-side.
- Check the OCR/auto-detect output isn't injecting RTL marks (U+200F/U+202E) into `template_field_values` — sanitize values on insert with a `stripBidiMarks()` helper.
- Add a 20 MB upload guard, MIME allow-list (`application/pdf`), and a friendly error toast on failure.

### 4. Place / sign / share fields
- The current `srcDoc` listens for `jbj-edit-field` / `jbj-set-field` / `jbj-hide-field` postMessages. Audit `EnvelopeDetail.tsx` lines 690-770 and ensure the message handler still mounts when `editing=false` so the click-to-restore overlays work outside edit mode.
- Verify the signature/stamp/initial/date pickers render (`SendForSignatureDialog`, `apply-adopt-signature`, `ai-signature-generator`, `ai-stamp-generator`). For each: confirm role gating in the edge function, CORS headers, and that the preview returns the saved asset URL into `useOwnerSignatureAssets`.
- Tighten the rule in `EnvelopeDetail.tsx` lines 100-107: owner signature/stamp must NOT be auto-applied to a draft, but they MUST be applied once the recipient signs (`status==='completed'`). Add a guard that warns when previewing a completed envelope without an asset.

### 5. Share / download / print
- Re-verify `handleDownloadCurrentPdf`, `handleOpenCurrentPdf`, `handlePrint`, and `handleDownloadBlank` against the rebuilt `previewHtml` so all four produce byte-identical output to the iframe.
- `SendViaEmailDialog` and `openWhatsApp` paths: confirm they use the freshly regenerated PDF URL and not the stale one.
- Re-run the `esign-send-for-signature`, `esign-send-reminder`, `esign-complete-envelope`, `esign-process-signature`, `esign-send-signer-thanks` edge functions through `supabase--curl_edge_functions` against a throwaway envelope to confirm 200 responses and audit-log writes.

### 6. Redeploy and end-to-end test
- Redeploy: `esign-auto-detect-fields`, `esign-load-document`, `esign-contract-analyzer`, `esign-process-signature`, `esign-send-for-signature`, `esign-send-reminder`, `esign-complete-envelope`, `esign-send-signer-thanks`, `apply-adopt-signature`, `ai-signature-generator`, `ai-stamp-generator`, `ai-stamp-extract`.
- Walk the full flow once the preview is back:
  1. Upload a PDF via SmartFillDropzone → confirm upright, readable preview in the iframe.
  2. Edit a field → save → preview updates, no spinner stuck, PDF re-rendered, no flipped glyphs.
  3. Apply signature, stamp, initials, date fields manually.
  4. Send for signature to the test recipient `infoo.jane@gmail.com` — confirm the recipient link opens `SignDocument`, signs, completes; envelope flips to `completed`.
  5. After completion, reopen detail page — owner signature/stamp now visible in preview, downloadable signed PDF + audit certificate.
  6. Share via WhatsApp + Send via Email both deliver the freshly rendered PDF.

### Verification checklist for the response
- DB: confirm envelope row's `template_key`, `template_field_values`, and `document_url` after each step.
- Network: every edge function returns 2xx with the expected `audit_log` row appended.
- UI: spinner clears after every async action; iframe is upright, scrollable, and exports match.
- Browser screenshot of upright preview attached as proof.

### Out of scope
- Migrating the e-sign tool to a new PDF engine (e.g. PDFTron/PSPDFKit).
- Restructuring the dashboard UI; only the preview/spinner/upload defects + edge function reliability are in scope.
