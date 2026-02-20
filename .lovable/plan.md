
# Market Report Book — Full End-to-End Audit & Fix Plan

## Audit Summary

After a deep code review of `src/pages/MarketReport.tsx` (2,480 lines), I found **four concrete bugs** that break the experience. Everything else (champagne interior, company card, featured sections data loading, form validation, fallback viewer) is correctly wired.

---

## Bugs Found

### Bug 1 — iframe Sandbox Blocks All External Links (Critical)
**Location:** Line 2068

The fallback in-page book viewer uses:
```html
sandbox="allow-same-origin allow-scripts"
```
This is **missing `allow-popups`**. Every single `target="_blank"` link inside the book (area cards, developer cards, project cards, QR links, social links, footer links, AI Matchmaker CTA) is silently blocked by the browser sandbox. Users clicking any link see nothing happen.

**Fix:** Add `allow-popups allow-popups-to-escape-sandbox` to the sandbox attribute.

---

### Bug 2 — TOC Anchor Links Are Broken (Pages 5–23 Missing IDs)
**Location:** Lines 944–952 (TOC) vs. page divs

The Table of Contents generates links like `<a href="#page-5">`, `<a href="#page-6">` ... `<a href="#page-23">`. However, only pages 2, 3, and 4 have `id="page-N"` attributes. Pages 5 through 23 have **no id attributes at all**, so clicking any TOC item (from "2025 Full Year Market Review" onwards) scrolls nowhere.

**Fix:** Add `id="page-N"` to every `<div class="page">` for pages 5 through 23 in the HTML template string.

---

### Bug 3 — Area Card URL Pattern Mismatch
**Location:** Lines 1696, 1703

The book generates area links as:
```
https://JBJ.AE/area/${a.slug}
```
The live site routing at `App.tsx` line 424 confirms `/area/:slug` is correct — this one is actually fine. No change needed.

---

### Bug 4 — In-Page Viewer Missing `allow-top-navigation` for TOC Hash Navigation
**Location:** Line 2068

Hash anchor `#page-N` navigation within the same srcdoc iframe requires `allow-same-origin` (already present) but works correctly once the IDs exist (Bug 2 fix covers this). No additional sandbox flag needed for in-document anchors.

---

## Complete Fix Plan

### File: `src/pages/MarketReport.tsx`

**Change 1 — Sandbox attribute (line 2068)**
```diff
- sandbox="allow-same-origin allow-scripts"
+ sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
```
This unblocks all `target="_blank"` external links inside the book without compromising security (the book HTML is generated internally, not user-controlled third-party content).

**Change 2 — Add page IDs to all interior pages (lines 977–1773)**

Add `id="page-N"` to every page div that is referenced by the TOC but currently missing the attribute:

| Page | Current | After Fix |
|------|---------|-----------|
| 5 — 2025 Full Year Review | `<div class="page">` | `<div class="page" id="page-5">` |
| 6 — UAE GDP & Global Rankings | `<div class="page">` | `<div class="page" id="page-6">` |
| 7 — DLD Dashboard | `<div class="page">` | `<div class="page" id="page-7">` |
| 8 — Top Areas by Volume | `<div class="page">` | `<div class="page" id="page-8">` |
| 9 — Top Buyer Nationalities | `<div class="page">` | `<div class="page" id="page-9">` |
| 10 — Property Types & Rental Yields | `<div class="page">` | `<div class="page" id="page-10">` |
| 11 — Key Investment Indicators | `<div class="page">` | `<div class="page" id="page-11">` |
| 12 — Community Comparison | `<div class="page">` | `<div class="page" id="page-12">` |
| 13 — Developer Framework | `<div class="page">` | `<div class="page" id="page-13">` |
| 14 — Off-Plan vs Ready | `<div class="page">` | `<div class="page" id="page-14">` |
| 15 — Due Diligence Checklist | `<div class="page">` | `<div class="page" id="page-15">` |
| 16 — Market Outlook 2026 | `<div class="page">` | `<div class="page" id="page-16">` |
| 17 — Risk Management | `<div class="page">` | `<div class="page" id="page-17">` |
| 18 — AI Property Matchmaker | `<div class="page">` | `<div class="page" id="page-18">` |
| 19 — Latest Market News | `<div class="page">` | `<div class="page" id="page-19">` |
| 20 — Featured Areas | `<div class="page">` | `<div class="page" id="page-20">` |
| 21 — Featured Developers | `<div class="page">` | `<div class="page" id="page-21">` |
| 22 — Featured Projects | `<div class="page">` | `<div class="page" id="page-22">` |
| 23 — Explore All & Contact | `<div class="page">` | `<div class="page" id="page-23">` |

---

## What is Already Working (No Changes Needed)

- Champagne interior theme: Correctly applied with `background: linear-gradient(180deg, #FDFBF7 0%, #F5F0E6 100%)` on all `.page` elements
- Company Identity Card (dark luxe on champagne): Present on page 2 with monogram, contact rows, and social links
- Founder visibility toggling: `isFounderVisible` correctly gates the founder page (page 3), author box, and all "I/We" text
- Featured Areas, Developers, Projects: All query live database and render grids with image fallbacks and badges
- Form validation: All 5 fields required, lead captured to both `leads` and `crm_leads` tables
- Pop-up blocker fallback: `window.open("", "_blank")` is called on click (not after async), with `openInApp()` fallback to in-page viewer
- Print/PDF: Uses `window.print()` correctly, `@media print` hides share bar
- QR code: Correctly generated via qrserver.com API pointing to `/quiz`
- Email notification: Sent async (non-blocking) via `send-market-report-email` edge function

---

## Implementation Scope

**1 file, 2 targeted changes:**
- `src/pages/MarketReport.tsx` — sandbox attribute fix (1 line) + 19 page `id` additions
