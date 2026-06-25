## Scope
Fix the AI Home Finder report — preview + PDF (single source of truth, `ReportEngine.tsx`). No other surfaces touched.

## 1. Website casing (global, report only per user wording: "rendering as www.jbj.ae in small letters")
Render the website as `WWW.JBJ.AE` (uppercase) wherever it appears in the report engine and footer:
- `PageFooter` website slot
- Contact page emerald CTA strip line (`COMPANY_CONTACT.phone · COMPANY_CONTACT.website`)
- "Prepared by" sidebar Website row
- Cover meta strip

Implementation: small `formatWebsite()` helper in `ReportEngine.tsx` that uppercases any value matching `*.jbj.ae`. Brand display data in `companyLegal.ts` / `companyNAP.ts` stays lowercase for SEO/links — only the rendered label is uppercased.

## 2. Last page ("Contact / Move from shortlist to verified opportunity") layout rebuild
Current layout is a 2-column grid (`1fr 270px`) where the right "Prepared by" rail is a tall vertical card, leaving a large empty band at the bottom of the page (red-boxed in screenshots).

New layout — full-width horizontal flow that fills the A4 page:

```text
┌───────────────────────────────────────────────────────────────┐
│ EYEBROW: Contact / consultant page                            │
│ H2: Move from shortlist to verified opportunity               │
│ Lead paragraph (full width)                                   │
├───────────────────────────────────────────────────────────────┤
│ 4-up step cards: 1 Confirm · 2 Shortlist · 3 Model · 4 Reserve│
├───────────────────────────────────────────────────────────────┤
│ PREPARED BY — horizontal rectangular card (full width)        │
│ ┌──────┬─────────────┬─────────────┬─────────────┬──────────┐ │
│ │ Photo│ Name / Role │ Phone /     │ Email /     │ License /│ │
│ │ 84px │ Company     │ WhatsApp    │ Website     │ Office   │ │
│ └──────┴─────────────┴─────────────┴─────────────┴──────────┘ │
├───────────────────────────────────────────────────────────────┤
│ EMERALD CTA STRIP (full width): Contact@JBJ.AE  ·  phone  ·  │
│ WWW.JBJ.AE                                                    │
└───────────────────────────────────────────────────────────────┘
```

Specifics:
- Replace `gridTemplateColumns: "1fr 270px"` wrapper with a vertical flex column, `gap: 18px`, `height: 100%`.
- Headline + intro: full width (no longer cramped in left half).
- Step cards: keep emerald-on-champagne styling, 4 columns (`repeat(4, 1fr)`), tighter padding so the row stays compact.
- "Prepared by" becomes a horizontal rectangle: photo/monogram 84×84 on left, then 4 equal info columns (Identity, Phone/WhatsApp, Email/Website, License/Office). Single gold hairline border, champagne surface. Eliminates vertical empty space.
- Emerald CTA strip stays at the bottom, full width, with `WWW.JBJ.AE` uppercase.

## 3. Verify
Run the existing Playwright QA script against `/ai-home-finder-results`, open Report Preview, scroll to last page, screenshot. Click Download PDF, render the last PDF page, screenshot. Confirm:
- No empty band on the contact page.
- "Prepared by" is rectangular/horizontal.
- Website renders as `WWW.JBJ.AE`.
- Preview and downloaded PDF are pixel-identical (same `ReportEngine`).

## Files touched
- `src/components/ai-home-finder/report/ReportEngine.tsx` — `ContactPage` rebuild + `formatWebsite` helper applied in footer, cover meta, contact strip, prepared-by sidebar.

No other files, no design-token changes, no business-logic changes.
