## Plan: AI Home Finder result/report fixes

1. **Fix the slow / unreliable result transition**
   - Update the quiz submit flow so the lead form button immediately shows a clear loading state and cannot double-submit.
   - Make result navigation resilient: always send 3 valid project slugs when available, even if the strict matching filters return too few.
   - Remove the image-only hard filter that can cause valid projects to disappear from results.

2. **Fix missing property previews on the results page**
   - Make `/quiz-results` fetch the selected projects reliably from the database.
   - Add a visible empty/error state if no projects are returned instead of leaving the page blank.
   - Ensure each selected property card shows a real preview image, developer, location, price, bedrooms, and link.
   - Replace external placeholder image URLs with an internal branded fallback so previews never break.

3. **Fix Download Report**
   - Repair the PDF generator so it cannot fail because of missing assets or empty result data.
   - Generate a branded JBJ PDF with:
     - Company brand/header
     - The three selected properties: Top 1, Top 2, Top 3
     - A side-by-side comparison table
     - Individual property preview/detail sections
     - Proper footer and report date
   - Keep the robust blob download method so clicking **Download Report** immediately downloads the PDF.

4. **Restyle “Share with Consultant” modal to AI Home Finder colors**
   - Replace champagne/gold styling with the same Tiffany/neon dark theme used by AI Home Finder.
   - Make modal text, icons, buttons, borders, and hover states readable and white/Tiffany.
   - Keep the existing share actions, but ensure they generate/cache the same PDF before opening Email/WhatsApp/share fallbacks.

5. **Validate end-to-end**
   - Test the full flow from **Get Free Analysis → quiz fields → lead form → AI-selected properties**.
   - Test **Download Report** on the results page.
   - Test opening **Share with Consultant** and the share channel buttons.
   - Capture browser screenshots of the fixed results page and share modal, and inspect the generated PDF visually for branding/readability.