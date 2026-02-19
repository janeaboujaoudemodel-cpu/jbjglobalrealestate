
# Market Intelligence Book — Remaining Interior Overhaul

This plan covers all the outstanding items from the approved plan that are not yet implemented in `src/pages/MarketReport.tsx`. The current file is 2,384 lines; all changes are surgical edits to the `html` template string inside `downloadBook()`.

---

## What Still Needs to Be Done

### 1. Rental Yield Chart Readability (Page 10 — lines ~1086–1093)

**Problem:** The Global Financial Centre Rankings bar chart uses `bar-fill` with `background: linear-gradient(90deg, #A8925A, #d4c4a0)` for New York, London, Hong Kong, Singapore — these are all identical gold fills. There is no contrast difference. The bars all look the same and bleed into each other.

**Fix:**
- New York: deep navy fill `#1a3464` with white text
- London: medium slate `#2d4a7a` with white text
- Singapore: muted teal `#2d6a7a` with white text
- Hong Kong: medium charcoal `#4a4a5a` with white text
- Dubai: gold gradient `#A8925A → #d4c4a0` with dark text (stands out as the premium highlight)

Each bar-fill also needs `padding: 0 10px` and `justify-content: space-between` so the label value is always visible even when the bar is narrow.

### 2. Due Diligence Checklist Page — Fill Right Column (Page 15 — lines ~1463–1477)

**Problem:** The right column only has "Ready Property Specific" checklist (6 items) and one highlight box. The page is visibly sparse on the right side.

**Fix:** Add two new sections inside the right column div after the highlight box:
- **Professional Team You Need** — checklist with RERA Broker, Property Lawyer, Mortgage Advisor, Snagging Inspector, Financial Planner
- **Red Flags to Avoid** — warning-box styled section with: Seller avoiding DLD checks, No RERA escrow on off-plan, Developer with no completed projects, Price significantly below market rate, Pressure to sign without legal review

### 3. Developer Transaction Volume Table (Page 13 — lines ~1356–1393)

**Problem:** The Developer Framework page lists tier 1/2 developers in bullet lists but has no transaction data. The plan calls for a "Top 5 Developers by Transaction Volume (2026 YTD)" table.

**Fix:** Insert a styled table after the tier 1/2 info cards and before the warning-box:

| Developer | Transactions | Volume (AED) | Tier |
|---|---|---|---|
| Emaar Properties | 12,450+ | AED 28.4B | Tier 1 |
| DAMAC Properties | 8,320+ | AED 15.7B | Tier 1 |
| Nakheel | 5,890+ | AED 14.2B | Tier 1 |
| Sobha Realty | 4,120+ | AED 11.9B | Tier 2 |
| Ellington Properties | 2,870+ | AED 9.4B | Tier 2 |

### 4. Market Outlook — 2025 Recap vs 2026 YTD (Page 16 — lines ~1483–1514)

**Problem:** Page 16 shows only 2026 outlook. The user wants a side-by-side 2025 vs 2026 comparison table.

**Fix:** Insert a two-column comparison block after the opening paragraph and before the stat-grid:

| Metric | 2025 Full Year | 2026 YTD |
|---|---|---|
| Transaction Value | AED 761B | (live: liveYtd.value) |
| Total Transactions | 226,000 | (live: liveYtd.transactions) |
| YoY Growth | +36% | (live: liveYtd.growth) |
| Off-Plan Share | 60% | (live: calculated %) |
| Top Area | JVC | (live: liveYtd.topArea) |

### 5. AI Property Matchmaker — CTA Button + Social Follow (Page 18 — lines ~1591–1603)

**Problem:** Page 18 has a QR section with a URL link but no direct clickable button. The user also wants a "Follow us / Stay in the Loop" social block.

**Fix:**
- Add a gold CTA button below the QR section: `Start AI Property Finder →` linking to `https://JBJ.AE/quiz`
- Add a "Stay in the Loop" social follow block with Instagram, TikTok, YouTube styled as bordered link pills

### 6. Featured Projects — Square Cards (Page 22 — line ~1701)

**Problem:** Project cover images use `height: 110px` — rectangular. User mandated square frames.

**Fix:** Change image style from `height: 110px` to `width: 100%; aspect-ratio: 1/1; object-fit: cover;` on both the `<img>` tag and the fallback `<div>`. Also change the fallback div from `height: 110px` to `style="aspect-ratio: 1/1"`.

### 7. Featured Areas — Square Image Cards (Page 20)

**Problem:** Area card images use `.area-card img { height: 100px }` — rectangular. Should be square to match the user's directive.

**Fix:** Change the CSS class `.area-card img` from `height: 100px` to `aspect-ratio: 1/1; object-fit: cover;` (remove fixed height). Also update the fallback `<div style="height: 100px">` inline styles to use `aspect-ratio: 1/1` instead.

### 8. Featured Developers — Square Card Containers (Page 21)

**Problem:** Developer card logo containers use `height: 90px` — rectangular.

**Fix:** Change `height: 90px` to `aspect-ratio: 1/1` for both the logo image container and the text-only fallback div.

### 9. Premium Book Footer (End of Page 23 — line ~1779)

**Problem:** Page 23 currently ends with a simple two-line copyright notice. User wants a full premium book footer.

**Fix:** Replace the plain `<div style="text-align: center; margin-top: 28px...">` copyright block with a full premium footer:
- Full-width gold top gradient border line (`4px`, `background: linear-gradient(90deg, transparent, #A8925A, transparent)`)
- JBJ monogram in 40px Playfair Display gold font, centered
- "JBJ Global Real Estate" in 11px spaced uppercase
- "Real Estate Brokerage · Downtown Dubai, UAE" in muted text
- Three-column grid: **Contact** (phone, email, address) | **Explore** (Properties, Areas, Developers, Market Intel) | **Social** (Instagram, TikTok, YouTube, LinkedIn)
- Gold separator line
- Copyright notice: `© 2026 JBJ Global Real Estate L.L.C S.O.C.`
- "Crafted in Dubai, UAE · For educational purposes only · Not financial advice"
- Full-width gold-to-transparent bottom gradient line

---

## Files Changed

| File | Changes |
|---|---|
| `src/pages/MarketReport.tsx` | 9 targeted edits inside the `downloadBook()` HTML template string |

---

## What Does NOT Change

- The React UI shell (hero, form, sidebar) — untouched
- The cover page (dark drama design) — untouched
- Pages 2–9, 11–12, 14, 17, 19 — untouched
- All other pages and components — untouched
- Database schema — no changes needed
- Edge functions — no changes needed
