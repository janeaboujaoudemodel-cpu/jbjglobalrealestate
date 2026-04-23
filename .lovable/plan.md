

## Goal

Add a "Print Mode" baseline so the Company Profile PDF (and any printable comparison view) renders without the cookie banner, popups, or persistent header/sidebar — leaving only the document content for clean visual comparison.

## Context

The Company Profile is a static PDF served from `/documents/JBJ-Global-Real-Estate-Company-Profile.pdf` and downloaded via `src/utils/generateCompanyProfilePDF.ts`. The download itself is already overlay-free (it's a binary file). The overlay problem only applies when the user **previews** the PDF in-browser or compares it against another rendered page — the cookie banner, `PopupLayer`, header, and sidebar all sit on top.

We'll introduce a global `?print=1` (alias `?baseline=1`) URL flag that suppresses all chrome and overlays for any route, then wire a "Open clean preview" action next to the existing download button.

## Changes

### 1. Global print-mode detection — `src/hooks/usePrintMode.ts` (new)
Tiny hook reading `?print=1` / `?baseline=1` from the URL and adding `data-print-mode="1"` to `<html>` so CSS can react globally.

### 2. Suppress overlays in `src/components/PopupLayer.tsx`
Early-return `null` when print mode is active — hides cookie banner, lead capture popup, recommendation popup, mode selection modal, and task alerts.

### 3. Hide header + sidebar in `src/components/MainLayoutWrapper.tsx`
When print mode is active, render `<Outlet />` only (no header, no sidebar, no footer). Apply white background and remove the 88px L-frame offset.

### 4. CSS print-mode reset — append to `src/index.css`
```css
html[data-print-mode="1"] {
  /* hide any fixed/sticky chrome that escapes the React tree */
  [data-chrome="header"], [data-chrome="sidebar"],
  [data-chrome="footer"], .cookie-banner, [data-popup] { display: none !important; }
  background: #fff !important;
}
html[data-print-mode="1"] body { padding: 0 !important; margin: 0 !important; }
```
(Also add `data-chrome` attributes to header/sidebar/footer roots as a safety net.)

### 5. Wire the baseline button — `src/components/admin/CompanyProfileDownload.tsx`
Add a secondary "Open Clean Preview" button next to the download CTA:
- Opens `/documents/JBJ-Global-Real-Estate-Company-Profile.pdf` in a new tab (PDF is already overlay-free).
- Plus a third "Open page baseline" button that opens the current route with `?print=1` so HTML→PDF comparisons render without chrome.

### 6. Mount the hook once in `src/App.tsx`
Add `<PrintModeBoundary />` (a 1-line component using `usePrintMode`) inside `BrowserRouter` so the flag is active on every route.

## Files touched

- `src/hooks/usePrintMode.ts` (new)
- `src/components/PrintModeBoundary.tsx` (new, 5 lines)
- `src/components/PopupLayer.tsx` — early return when print mode
- `src/components/MainLayoutWrapper.tsx` — skip header/sidebar/footer when print mode
- `src/components/admin/CompanyProfileDownload.tsx` — add "Open Clean Preview" + "Open page baseline" buttons
- `src/index.css` — print-mode reset block
- `src/App.tsx` — mount `<PrintModeBoundary />`

## Out of scope

- No changes to the PDF file or `generateCompanyProfilePDF.ts` (binary is already chrome-free).
- No removal of any popup, banner, or chrome — they only hide when `?print=1` is present.
- No changes to the corporate-suite generator (`companyProfileExport.ts`) — it already produces a self-contained PDF.

