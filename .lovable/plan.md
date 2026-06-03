# Quiz Results — 4 Fixes

## 1. Add Badge dropdown — broken contrast (white on champagne)

**File:** `src/pages/QuizResults.tsx`

The `[data-aihf-menu]` CSS scoping fails because the dropdown contents render via Radix portal AND the items use banned faded-gold text classes (`text-[#B89555]`, `text-[#888]`, `text-[#CD7F32]`, `text-[#1A1A1A]/70`) which land on the global champagne popover background.

Fixes:
- Inject the AIHF style block once at the top of the page (via portal-root selector `[data-aihf-menu]` only — already global, no descendant scope). Verify `<style>{AIHF_RESULTS_STYLE}</style>` is rendered on body even when modals open (it is, via the main `<section>` mount).
- Force the navy/tiffany gradient on `DropdownMenuContent` with inline `style={{ background: '...', border: '1px solid rgba(94,234,212,0.55)', color: '#FFFFFF' }}` so it wins regardless of `bg-popover`.
- Replace per-item `text-[#B89555]/#888/#CD7F32/#1A1A1A]/70` classes with brand-tiffany medal colors (gold→`#FFD27A`, silver→`#E8F0FF`, bronze→`#FFB07A`, remove→`#FF8FA3`) so they pop on dark gradient AND don't trip the faded-gold guard.
- Strengthen `[data-aihf-menu] [role="menuitem"]` rule with `background-color: transparent !important` and `color: #FFFFFF !important` at rest; tiffany on hover.

## 2. Share dialog — white X close icon on champagne ring

**File:** `src/pages/QuizResults.tsx` + AIHF style block

The shadcn `DialogContent` ships a default `<X>` close button. Its hover state pulls `bg-accent` (champagne) under a white icon → white-on-light violation visible in screenshot 2.

Fix: in `AIHF_RESULTS_STYLE`, add:
```css
.aihf-results [data-radix-dialog-content] > button[aria-label="Close"],
[data-aihf-menu] ~ button {
  color: #5EEAD4 !important;
  background: rgba(94,234,212,0.10) !important;
  border: 1px solid rgba(94,234,212,0.45) !important;
  border-radius: 9999px !important;
  opacity: 1 !important;
}
.aihf-results [data-radix-dialog-content] > button[aria-label="Close"]:hover {
  background: rgba(94,234,212,0.22) !important;
  color: #67E8F9 !important;
}
.aihf-results [data-radix-dialog-content] > button[aria-label="Close"] svg {
  color: #5EEAD4 !important;
  stroke: #5EEAD4 !important;
}
```

## 3. WhatsApp / Email blocked when clicking Share

**File:** `src/pages/QuizResults.tsx`

`shareWithFile()` awaits `generateAndCachePdf()` (jsPDF render) BEFORE calling `window.open` → loses the synchronous user-gesture trust → popup blocker fires on Safari/Chrome → "blocked" toast/no window.

Fixes (zero API keys — all already client-side wa.me/mailto):
- Rewrite the 4 share handlers (`handleShareWhatsApp`, `handleShareEmail`, `handleShareToConsultant`, `handleConsultantWhatsApp`) to **open the link synchronously inside the click handler** via `openWhatsApp` / `openEmail` from `src/utils/contactActions.ts` (which creates an `<a target="_blank">` and clicks it inside the gesture).
- Kick off `generateAndCachePdf()` + `triggerDownload()` in the background AFTER opening the link, with a `.then()` chain — no `await` before the open.
- Drop the `navigator.share({ files })` Web Share path entirely (it's what was actually failing — many browsers reject PDFs in `canShare` and the fallback path runs too late). The user explicitly wants the plain wa.me / mailto links — no API.
- Confirm `JBJ_CONSULTANT_EMAIL` / `JBJ_CONSULTANT_WHATSAPP` constants stay as plain strings (no edge function call). Grep confirms only `wa.me/` and `mailto:` are used in this page — no email/WhatsApp secret to remove anywhere else for this flow.

## 4. PDF report broken (tables, glyphs, non-visible links)

**File:** `src/pages/QuizResults.tsx` (`buildPdf` function, lines ~440–640)

Root causes:
- **Unicode glyphs (`✓ ≈ ✗ ·`)** are not in jsPDF's built-in Helvetica → render as black boxes / garbled chars. User sees "completely broken content".
- **Listing URL cells** are technically `doc.link()`'d but the text is plain white — no underline, no color cue → user can't see they're clickable.
- **Tables look nothing like the dark UI cards** because alternateRowStyles + verdict fills leave heavy contrast jumps and cell padding is too tight at 6pt with 9pt text → cramped, no hierarchy.

Fixes:
- Replace glyphs: `✓`→`[OK]`, `≈`→`[~]`, `✗`→`[X]`, ` · `→` | `. Keep them in the legend line at top of "How each property matches" page.
- For every "Listing URL" / "Listing" cell, set `textColor: [94,234,212]` (tiffany) and post-process with `didDrawCell` to draw a 0.5pt tiffany underline rectangle below the text so the link is visibly highlighted and clickable, matching "glowing blue / underlined" request.
- Increase comparison + detail table `cellPadding: 10`, `fontSize: 10`, `minCellHeight: 22`, and switch `alternateRowStyles.fillColor` to a subtler `[5, 34, 30]` so rows aren't striped harshly. Keep tiffany header bar, ink text.
- Add a soft tiffany 0.4pt border around each detail-card table for the "premium" feel.
- Re-render the bottom footer with `[OK] AI-curated · jbj.ae` instead of unicode dots.

No business-logic changes (sold-out filter, off-plan priority, scoring all untouched).

## Files touched
- `src/pages/QuizResults.tsx` (CSS block, DropdownMenuContent inline style + item classes, 4 share handlers, `buildPdf` table styling + glyph substitution + link rendering)

## Verification
1. Open `/quiz/results` → click "Add Badge" → dropdown renders navy/tiffany with bright legible item text, hover glows tiffany.
2. Click "Share" → modal X button shows tiffany circular pill, hover stays tiffany. WhatsApp / Email / WhatsApp JBJ / Email JBJ all open new tab immediately (no popup-block), PDF downloads in background.
3. Open downloaded PDF → no black-box glyphs; tables breathe; "Listing URL" cells appear in tiffany with underline and click through to `/project/:slug`.
