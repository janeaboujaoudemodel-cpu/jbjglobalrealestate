## What's actually broken

The user opened `company-profile_baseline.pdf` (the **diff** PDF produced by `pdf_export_gate.py`) and saw red/pink everywhere across pages 1–3. That pink isn't a corrupted PDF — it's the baseline gate's diff highlighter showing everything that didn't match the locked baseline. I rasterized the baseline diff and confirmed:

- The whole left sidebar (PROPERTIES / TOOLS / INSIGHTS / COMPANY …) leaked into the print page.
- The global filter bar (Bedrooms / Status / Construction / Newest / Map / Saved Filters) leaked in.
- The cookie consent banner sat across the bottom of the page.
- The `/company-profile` floating action stack (chat, phone, download FABs) showed in the upper-right.
- All of that flagged as "shifted regions" → red diff overlay.

The actual served PDF (`/documents/JBJ-Global-Real-Estate-Company-Profile.pdf`) is **fine**: 18 pages, 5.1MB, renders cleanly when opened directly. Verified by rasterizing pages 1–6 — no pink, no broken layout.

Root cause for the diff failure: the print-mode CSS targets selectors (`[data-chrome="header"]`, `[data-chrome="sidebar"]`, `[data-chrome="footer"]`, `.cookie-banner`, `[data-popup]`) that **no component actually sets**, and the in-page floating actions on `/company-profile` aren't tagged either. `MainLayoutWrapper` already short-circuits the global chrome when `?print=1`, so the live page is mostly clean today — but the floating FAB stack inside `CompanyProfile.tsx` still leaks, the cookie banner still leaks if it portals outside the wrapper, and the existing `data-chrome` rules are dead code.

## Fixes

1. **Tag the in-page leaks on `/company-profile`** (`src/pages/CompanyProfile.tsx`)
   - Add `data-chrome="floating-actions"` to the desktop FAB stack (line 414) and the mobile sticky action bar (line 1330).

2. **Make the existing print-mode CSS actually fire** — add the markers it expects:
   - `src/components/CookiesConsentBanner.tsx`: add `cookie-banner` class to the root `motion.div`.
   - `src/components/MainLayout.tsx`: add `data-chrome="sidebar"` to the sidebar wrapper, `data-chrome="utility-bar"` to the utility bar wrapper, `data-chrome="header"` to the mobile header wrapper, `data-chrome="footer"` to the footer wrapper. (Defense-in-depth — `MainLayoutWrapper` already hides them, but tagging means any future page that renders chrome outside the wrapper still gets cleaned up.)
   - Extend the `index.css` print-mode rule to also hide `[data-chrome="floating-actions"]` and `[data-chrome="utility-bar"]`.

3. **Refresh the broken baseline**
   - Boot Playwright against the now-clean `/company-profile?print=1`, render to PDF, replace `/mnt/documents/pdf_baselines/company-profile/baseline.pdf` and `pages/page_*.png`.
   - Re-run the diff gate against the served `/documents/JBJ-Global-Real-Estate-Company-Profile.pdf` — the existing tolerances file (`size_tol_mm: 0.5`, `pixel_fail_pct: 3.0`, etc.) stays unchanged.

4. **End-to-end QA from a user's perspective** (no code changes, just verification):
   - **Live page**: screenshot `/company-profile` (normal) and `/company-profile?print=1` (clean), confirm both render.
   - **Download button**: trigger the "Download Company Profile" button in headless Chromium, confirm the served file is the correct 18-page PDF.
   - **Static PDF**: rasterize all 18 pages of `/documents/JBJ-Global-Real-Estate-Company-Profile.pdf` and visually inspect each one for clipping, overlap, or missing content. Save the QA strip to `/mnt/documents/`.
   - **Owner export panel**: confirm the `CompanyProfileDownload` admin card's three buttons (Download / Open Clean PDF / Open Page Baseline) all resolve to the right URLs.
   - **AI Hub**: navigate `/ai-hub` and confirm nothing in that page links to the broken `_baseline.pdf` artifact (the user said they reached the bad PDF via AI Hub → Recent — that recent list is the file picker pointing into `/mnt/documents/`, not the live site).

5. **Deliverables to `/mnt/documents/`**
   - `company-profile_baseline_v2.pdf` — fresh clean baseline render.
   - `company-profile_qa_strip.pdf` — all 18 pages of the live downloadable PDF, rasterized for inspection.
   - `company-profile_print_mode.png` — screenshot proving the clean print layout.
   - `company-profile_diff_v2.pdf` — re-run diff after the fix, expected zero red overlay.

## Technical notes

- No data model changes, no edge function changes, no migrations.
- `MainLayoutWrapper` already correctly short-circuits chrome on `?print=1`; this work just makes the secondary CSS-based suppression actually do something and patches the in-page floating actions that aren't part of the wrapper.
- The 18-page served PDF is the static asset under `public/documents/` and is **not** regenerated — no risk to the official artifact.
- The `pdf-export-qa` GitHub Action will keep validating the served PDF against `thresholds.json` on every PR.
