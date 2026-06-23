# Fix loading-logo centering + actually repaint green→emerald (screenshot-validated)

## 1. Center BrandedLoader in the live content area (excluding sidebar)

Root cause: `BrandedLoader` already reads `--app-content-left`, but that variable is only set inside `OwnerDashboardShell`. On `MainLayout` pages (incl. `/project/:slug`) it falls back to `0`, so the logo is centered over the whole viewport — overlapping the sidebar.

Fix in `src/index.css` (single block, no component edits):

```css
/* Drive content-left from the sidebar state set on <body> by GlobalVerticalNav */
:root { --app-content-left: 0px; }

@media (min-width: 640px) {
 body.jj-vertical-nav-collapsed { --app-content-left: 48px; }
 body.jj-vertical-nav-active   { --app-content-left: 200px; }
}
```

Result: on every `MainLayout` route, the "LOADING PROJECT…" monogram is geometrically centered between the right edge of the open/collapsed sidebar and the right edge of the viewport — matching what the user described.

## 2. Real visual audit + repaint (no more claims without screenshots)

Stop trusting the existing `.jj-emerald-action` cascade — the user has rejected three rounds of it. Drive Playwright at 1280×1800 against the running dev server, take screenshots, and read the computed style of every flagged element. For each one whose `background-image`/`background-color` is not the dark emerald metallic or whose descendant `color` is not pure white, patch it directly at the source (not via yet another global guard).

### Targets to capture (one screenshot each, cropped tight)

Route `/project/elwood-sobha-realty-dubailand`:
- Header: Search circle, sq ft/sq m toggle, AED selector, Mode chip, JB avatar
- Sidebar active item ("MY ACCOUNT")
- Hero CTAs
- Payment Plan tabs (active 60/40, On-Booking dot)
- Nearby map filter chips (All Nearby, Schools, etc.)
- Recommended Projects header star + "View All Projects"
- Developer Info "View All Projects"
- Mortgage card "Request Mortgage Introduction"
- Consultation form "Request Consultation"
- Brochure card primary CTA
- "Noticed something incorrect?" tile + "Report an issue" button
- ImageCarousel arrows
- `CompleteProfilePrompt`: Trophy badge, X close, "Take me there" CTA

Route `/`: any "View All" / star tiles on home.

### Per-violation fix protocol

For each element where computed style ≠ spec:
1. Resolve the exact JSX from the DOM `data-testid`/`class` shown in the screenshot.
2. Replace inline `bg-[#0E8A66]`, `jj-cta-gold-metallic`, `bg-emerald-*`, ad-hoc `linear-gradient(..., #0E8A66 ...)` etc. with a single locked utility class — no `!important` arms race, just one source:
 ```css
 .jj-emerald-locked{
 background:linear-gradient(135deg,#0A6B53 0%,#064E3B 60%,#042c1c 100%) !important;
 background-color:#064E3B !important;
 color:#fff !important;
 -webkit-text-fill-color:#fff !important;
 }
 .jj-emerald-locked :is(svg,path,span,strong,b,i,em){
 color:#fff !important;
 fill:currentColor !important;
 stroke:currentColor !important;
 -webkit-text-fill-color:#fff !important;
 }
 ```
 (Defined once in `index.css`; replaces the current `.jj-emerald-action` selector list which the user reports is not landing.)
3. Apply `className="jj-emerald-locked"` directly on the offending element (button, TabsTrigger active state via `data-[state=active]:jj-emerald-locked`, chip, icon tile, etc.).
4. Re-screenshot the same crop. Only mark fixed when the screenshot visually matches dark emerald + pure-white glyph.

### Validation deliverable

Save before/after pairs to `/tmp/browser/emerald-v4/<element>.png` and post the after-set in the reply. Do NOT declare success without the screenshot grid. If any element still shows the flat lighter green or black text, loop step 3 on that element only.

## 3. Out of scope

- No new components, no behavior changes, no route changes, no token edits beyond the two CSS blocks above.
- Existing emerald-correct surfaces (already verified) are not touched.

## Files expected to change

- `src/index.css` — add the `--app-content-left` rules + the `.jj-emerald-locked` primitive (remove the prior failed `.jj-emerald-action` block if it's the source of the no-op).
- A handful of component files where the audit shows a still-green or black-text element (concrete list produced from the audit; likely subset of: `PaymentPlanVisualization.tsx`, `ProjectNearbyPropertiesMap.tsx`, `RecommendedProjects.tsx`, `DeveloperInfoCard.tsx`, `MortgageCalculator.tsx`, `ConsultationRequestForm.tsx`, `ReportIssueButton.tsx`, `ImageCarousel.tsx`, `CompleteProfilePrompt.tsx`).
