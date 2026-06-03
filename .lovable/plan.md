# AI Home Finder — Results Page Fixes

Single file: `src/pages/QuizResults.tsx` (plus a small storage helper).

## 1. "Browse All Properties" button — Tiffany 3D glow

Replace the navy/gold button with the same Tiffany neon language used by Request Evaluation / Compare with AI:

- Gradient `#5EEAD4 → #22D3EE`, ink (`#02110F`) text/icon, `border: 1px rgba(103,232,249,0.80)`.
- 3D feel: layered shadow `0 18px 42px rgba(34,211,238,0.35), 0 0 24px rgba(94,234,212,0.55), inset 0 1px 0 rgba(255,255,255,0.35)`, subtle hover lift (`-translate-y-0.5`) + amplified glow on hover.
- Reuse the existing `.aihf-cta` class (already locked in `AIHF_RESULTS_STYLE`) and add a `.aihf-cta-glow` modifier with the extra outer glow + scale; apply to this button so it reads as a standalone hero CTA, not a row item.
- Same min-height/padding as Request Evaluation for visual parity.

## 2. PDF report — branded comparison table

Rewrite `buildPdf()` so it returns the PDF as a `Blob` (used by both download and share) and renders:

- **Cover band**: Tiffany gradient (`#5EEAD4 → #22D3EE → #0E7490`) full-width band with JBJ monogram (left) + wordmark `JBJ GLOBAL REAL ESTATE` and tagline `AI Home Finder — Personalized Recommendations`. Date right-aligned in ink.
- **Body**: deep-navy (`#02110F`) page background with Tiffany hairlines so it matches the on-screen tool palette (no champagne reset).
- **Top 3 ranking strip**: three Tiffany pills `#1 Best Match`, `#2 Strong Fit`, `#3 Good Fit` above the table.
- **Comparison table** (jspdf-autotable):
  - Columns: `Attribute | #1 <name> | #2 <name> | #3 <name>` (only render present columns).
  - Rows: Developer, Location, Community, Price From, Bedrooms, Size Range, Handover, Payment Plan, Sale Status, Listing URL.
  - Head fill = Tiffany `#22D3EE`, head text = ink; alternating row fill = `rgba(45,212,191,0.08)`; cell text = white when on dark bg, ink when on Tiffany bands; gold/champagne removed from this report.
- **Per-property detail cards** after the table (one block each) with the same Tiffany styling so the user gets both compare + detail.
- **Footer**: Tiffany hairline + `Powered by JBJ Global Real Estate — Brokerage | Dubai, UAE`, contact line, page numbers.
- Monogram: load `/jbj-monogram.png` (already in `public/`) via `doc.addImage`; embed once and reuse on every page.

Helper signature:
```ts
const buildPdf = (): { doc: jsPDF; blob: Blob; filename: string } | null
```

## 3. Download Report — actually downloads

`handleDownloadReport`:
1. Call `buildPdf()`.
2. Use `URL.createObjectURL(blob)` + temporary `<a download>` click instead of relying solely on `doc.save()` (some preview iframes drop `save()` — this is the "broken download" the user is seeing).
3. Toast success; open the share modal in `post-download` mode.

## 4. Share — auto-attaches the generated PDF

`handleOpenShare` becomes async:
1. Generate the PDF Blob (same `buildPdf()`).
2. Trigger the same download anchor automatically (so the file is on disk).
3. Upload the Blob to Supabase Storage bucket `ai-reports/` (public, signed URL, 7-day expiry) so email/WhatsApp can attach via link when the OS doesn't support file share.
4. Open the share modal — modal now shows: WhatsApp, Email, Copy Link, Send to JBJ Consultant. Each handler receives `{ blob, signedUrl, filename }`.

### Channel behaviour
- **WhatsApp**: if `navigator.canShare?.({ files: [file] })` → `navigator.share({ files: [file], title, text })` (true file attach on iOS/Android). Desktop fallback → `https://wa.me/?text=<msg + signedUrl>`.
- **Email**: same Web Share API path with files when available; otherwise `mailto:?subject=...&body=...<signedUrl>` so the recipient gets the actual PDF link. Body explains the attachment is the AI Property Recommendations PDF.
- **Copy Link**: copy the signed PDF URL (not the plain text summary).
- **Send to JBJ Consultant**: existing mailto, but body now includes the signed PDF link so the consultant receives the actual file.

### Storage
Use existing Supabase client. If the `ai-reports` bucket doesn't exist, create it via migration in build mode (public read, RLS insert for authenticated + anon for free flow). Filename: `JBJ-AI-Recommendations-<sessionId>-<timestamp>.pdf`.

## 5. E2E validation (build mode)

After implementation:
1. `browser--navigate_to_sandbox` `/quiz-results?projects=golf-point-emaar-properties-emaar-south,seagull-point-residences,in-albero&free=true`.
2. Screenshot — confirm Tiffany-glow Browse button.
3. Click Download Report → confirm file lands in download tray + share modal opens in post-download mode.
4. Click Share with Consultant → confirm modal, click Email/WhatsApp/Copy and confirm correct attach/link behaviour (Web Share API may not fire in headless; verify fallback URLs in network logs).
5. Open downloaded PDF (convert first page to image via pdftoppm) and verify: Tiffany band, monogram, comparison table with 3 columns, branded footer.

## Files touched
- `src/pages/QuizResults.tsx` (button class, PDF builder, download/share handlers, share modal copy).
- `supabase/migrations/<ts>_ai_reports_bucket.sql` (new bucket + policies) — build mode only.
