## Goal
Make the AI Home Finder "Download Report" experience production-ready: auto-role from active mode, complete branded PDF (all sections), preview that visually matches the PDF, JBJ design-system compliance, and verified manually via Playwright with screenshots.

## Scope (single component + exporter)
Files to change:
- `src/components/ai-home-finder/ReportPreviewModal.tsx` — remove role tabs, auto-bind to active user mode, add License/Website/Address fields, full profile auto-fill (user + company), Premium luxury header/footer, fix color/contrast violations, render preview as a true 1:1 of PDF pages.
- `src/pages/QuizResults.tsx` — refactor `buildPdf(branding)` to emit the COMPLETE report: Cover, Prepared By, AI Summary, Comparison Table, Match Summary, per-property full pages (hero image, amenities, analysis, recommendation), footer on every page, closing page. High-DPI image embedding.
- Use existing `useUserMode` for role sync, existing `BRAND` tokens, and the official JBJ monogram asset (no recreation).

## Design-system compliance
- Primary CTA: `.jj-cta-emerald` (emerald metallic + WHITE text/icons).
- Secondary: champagne bg + emerald text.
- Header: ink-emerald gradient band with WHITE text + official monogram (no champagne-on-dark white text inside light areas).
- Footer: champagne band with ink text, gold hairline above. No black-on-emerald, no white-on-champagne.
- Use `<IconTile />` patterns and existing tokens — no hard-coded hexes outside BRAND constants.

## PDF completeness (jspdf)
For each selected project fetched from `unified_projects`:
1. Cover (branded hero + Prepared By strip).
2. AI Summary page (matchmaker prose).
3. Comparison Table (price, handover, bedrooms, location, developer).
4. Match Summary (why these 3).
5. Property pages (1–2 pages each): hero image, key facts, amenities grid, analysis paragraph, recommendation callout.
6. Closing page (next steps + contact block).
Every page: branded header strip + footer with page N/total.

## Manual validation (Playwright)
Drive the live preview at `localhost:8080`:
1. Restore Supabase session, navigate to `/ai-home-finder-results?...` (current URL).
2. Screenshot results page.
3. Click "Download Report" → screenshot modal (verify NO role tabs, role chip shows active mode).
4. Upload sample PNG photo + JPEG logo (generated in /tmp) → screenshot preview.
5. Click "Download PDF" → capture downloaded file, render each page to JPEG via `pdftoppm`, view every page image, confirm: no overlaps, correct page breaks, branding present, all sections rendered.
6. Test Share WhatsApp / Email / Copy text / Send to JBJ Consultant button states.
7. Switch viewport to mobile (390×844), repeat modal screenshot.
8. Repeat with role = Owner (toggle via mode picker) to prove auto-sync.

Deliver screenshots inline as proof.

## Out of scope
- No backend schema changes. No new edge functions. No changes to other report flows (Compare/Evaluator).
- Cross-browser beyond Chromium (sandbox limitation — will note).