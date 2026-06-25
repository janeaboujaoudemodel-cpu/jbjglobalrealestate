## Goal

Stop patching the report and fix the layout engine so the Live Preview is **pixel-identical** to the downloaded PDF, every page is a complete A4, headers/footers are locked, real property images load, and the visual quality matches McKinsey / CBRE / Savills.

## Root causes found in the current code

1. **Whitespace between pages in the preview** — `ReportEngine.tsx` wraps every `[data-report-page]` in a flex column with `gap: 24`. That 24px gap is rendered as champagne emptiness between pages, which reads as "footer detached", "header floating", "page ends halfway". The PDF capture loop ignores it, so preview and PDF diverge.
2. **Off-by-one preview height** — `ReportPreviewModal.tsx` computes `pageCount = 6 + min(previewProjects.length, 3)` against `projects.slice(0, 6)`, while `ReportEngine` only renders `projects.slice(0, 3)`. When fewer than 3 (or more than 3) projects come in, the absolute-positioned scaled report under-reserves or over-reserves vertical space → blank gap at the bottom and/or clipped last page.
3. **"PROJECT IMAGE PENDING" leaking to clients** — `PremiumImage` sets `crossOrigin="anonymous"` on every image. Any project image served without CORS headers (most CDN/dev URLs) triggers `onError` → the literal "Project image pending" copy renders. There is no second-chance fetch and no premium fallback.
4. **html2canvas window sizing** — capture passes `windowWidth/windowHeight = 794×1123`, but the offscreen host is the full report height (≈9× that). Chromium clips layout to the window box → some pages render with partial content or wrong header alignment in the PDF.
5. **Typography is ad-hoc** — heading sizes (29 / 30 / 32), eyebrow paddings, card paddings, and field-card min-heights are all hand-tuned per page. No single typography scale.
6. **Emerald recommendation cards are cramped** — `padding: 14–18`, text sits flush against the gold border, eyebrow uses `marginBottom: 7`. Reads as "black on dark green" because the eyebrow + body collapse together.
7. **Property cards on Matched / Comparison pages don't share a grid** — `224px 1fr` vs `1fr 252px` vs `repeat(3, 1fr)` with different inner paddings, so widths and right-rails visibly drift.

## What this plan changes

### A. One layout engine, locked A4 page container

- In `ReportEngine.tsx`, remove the `gap: 24` from `[data-report-root]`. Pages render edge-to-edge. Add a `[data-report-page] + [data-report-page] { margin-top: var(--page-sep, 0px) }` rule so the **preview** can opt-in to a thin shadow separator without changing PDF capture.
- Keep `PageFrame` as the only page primitive: fixed `794×1123`, `display: flex; flex-direction: column`, 90px header, 44px footer, `<main>` `flex: 1; overflow: hidden`. No page may exceed this — content that overflows is clamped, never spills.
- Standardize page padding to a single token: `padding: 28px 44px 22px` for every `<main>`. Same on every page, every property.

### B. Pixel-parity preview

- In `ReportPreviewModal.tsx`, compute `pageCount` from the **same source** the engine uses: `6 + safeProjects.length` where `safeProjects = projects.slice(0, 3)`. Use that for the scaled-container height.
- Set `--page-sep: 18px` only inside the preview wrapper (via inline style on the scaled root), so previews show a faint shadowed gap between sheets but the offscreen PDF host stays at `--page-sep: 0`.
- Replace the `position: absolute + transform: scale` trick with `transform-origin: top left; transform: scale(s)` on a normally-flowed child wrapped in a div whose height equals `naturalHeight * scale` — measured from the rendered DOM via a ref + ResizeObserver, not arithmetic. This eliminates the off-by-one whitespace at the bottom.

### C. Real property images, premium fallback, no "pending" copy

- Rewrite `PremiumImage`:
  1. Build a candidate list: proxied URL → raw URL → first item in `project.images[]` → `null`.
  2. Try them in order; only after all fail show the placeholder.
  3. Drop `crossOrigin="anonymous"` in `mode === "preview"`. Apply it only in PDF mode, and only on the final accepted URL (re-fetched through `proxyAnyDownloadUrl`, which we control and serves CORS).
  4. Premium fallback = champagne textured panel + centered JBJ monogram + small "Imagery on request" caption in muted ink. The phrase "Project image pending" is removed from the codebase.
- Pass `mode` from `ReportEngine` down to `PremiumImage` via a tiny React context so the same component branches without prop drilling.

### D. PDF capture parity

- In `renderReportToPdf.ts`:
  - Remove `windowWidth` / `windowHeight` from the `html2canvas` call (let it use the element's own box).
  - Add `scrollX: 0, scrollY: 0` and `foreignObjectRendering: false`.
  - Set `imageTimeout: 8000` so slow images don't get dropped mid-capture.
  - Render the report at `--page-sep: 0` inside the offscreen host so each captured page is exactly `794×1123` with no extra gap above/below.

### E. Unified typography + spacing tokens

- Extend `report/tokens.ts` with a single scale used by every page:
  ```
  type: {
    h1: 34/1.08/900, h2: 24/1.12/900, h3: 16/1.2/900,
    eyebrow: 9.5/1/900/0.18em-upper,
    body: 11.5/1.55/500, meta: 10/1.4/700,
    price: 15/1/900
  }
  spacing: { pad: 14, padLg: 20, gap: 12, gapLg: 16, radius: 9 }
  ```
- Every page swaps its hand-coded `fontSize: 29/30/32` for `TYPE.h1`. Eyebrows use one component. FieldCard, emerald block, property detail aside, contact aside all use the same `radius`, `pad`, `gap`.

### F. Emerald recommendation card contrast + padding

- Emerald blocks (`data-on-dark`) get `padding: 22 24`, `eyebrow marginBottom: 12`, body `lineHeight: 1.65`, and a 1px inner gold hairline (`box-shadow: inset 0 0 0 1px rgba(184,149,85,0.35)`) so text never touches the outer gold border. White-on-emerald already lives in the `<style>` block — keep it, add `letter-spacing: 0.005em` for legibility at PDF dpi.

### G. Grid alignment

- Matched Properties: lock the row to `grid-template-columns: 232px 1fr`, image rail `min-height: 188`, inner padding `16px 18px 16px 0`.
- Comparison Page: lock the property strip to `grid-template-columns: repeat(3, 1fr)` with a shared `min-height: 116` image, identical inner padding.
- Property Detail: lock the right rail to `260px` on every property page, with three stacked cards of identical width, padding `16`, gap `12`.

### H. Header / footer lock

- Header height: `92` (was 90 — pixel rounded to match `<main>` flex residue). Footer: `44`. Both `flex-shrink: 0`. Border-bottom on header is a single 1px gold line; no double border.
- Page label / date sit in a 1fr right cell; brand block in a 1fr left cell. Both vertically centered. This kills the "header detached" look on short pages.

## Files touched

- `src/components/ai-home-finder/report/tokens.ts` — add `TYPE`, `SP`, `RADIUS`, `SEP_VAR`.
- `src/components/ai-home-finder/report/ReportEngine.tsx` — remove root gap, add page-sep CSS var, refactor every page to use `TYPE`/`SP`, lock grids, add premium image fallback context, tighten header/footer.
- `src/components/ai-home-finder/ReportPreviewModal.tsx` — compute `pageCount` from `safeProjects`, measure scaled height with ref+ResizeObserver, set `--page-sep: 18px` only in preview.
- `src/utils/renderReportToPdf.ts` — drop window box, add `imageTimeout`, set `--page-sep: 0` on host.

## Out of scope (explicit)

- No new pages, no new sections, no copy rewrites beyond removing the "Project image pending" string.
- No changes to the global champagne/emerald contract or `src/index.css` — the report engine carries `data-no-contrast-guard` and remains immune.
- No changes to the rest of AI Home Finder (Quiz, Results page, filter panel).

## Verification

- Playwright: open `/ai-home-finder-results?...&free=true`, click "Download report", screenshot the preview pane, then trigger `renderReportToPdf` and convert the resulting PDF to images with `pdftoppm`. Diff page-by-page that header height, footer position, image boxes, emerald cards, and right rails are pixel-aligned. Confirm zero "Project image pending" occurrences across all 9 pages with real and missing images.
