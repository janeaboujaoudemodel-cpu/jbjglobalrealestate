## Scope

Three related fixes across the Owner/Broker Portal and website:

1. **CRM selected-row green tint** — remove the emerald row highlight when leads are selected (keep only the checkbox state).
2. **Swipe-back / overscroll hijack** — horizontal two-finger swipe inside scrollable panels currently triggers browser back-navigation. Lock this on all internal scroll containers site-wide.
3. **Responsive card overflow** — cards in CRM Pipeline, Careers Dashboard, Document Studio, KPI strips, etc. let content escape horizontally at narrower viewports. Enforce a global contain-and-adapt contract.

## Implementation

### 1. CRM row selection (no green fill)
- Audit `src/components/crm/LeadTable.tsx` (and any sibling `OwnerLeads`/`CrmLeadRow`) for `data-state=selected` / `aria-selected` styles applying `bg-emerald*` or `--state-active`.
- Replace selected-row background with `transparent` (keep checkbox emerald, keep hover hairline). Selection is communicated by the checkbox only.

### 2. Global swipe/scroll containment
Add to `src/index.css` under a new `PASS 53 — SCROLL CONTAINMENT`:
```css
html, body { overscroll-behavior-x: none; }
[data-scroll-x], .overflow-x-auto, .overflow-x-scroll,
[role="region"][aria-label*="table" i], .jj-card, .jj-page-shell {
  overscroll-behavior: contain;
  touch-action: pan-x pan-y;
}
```
- Apply `overscroll-behavior: contain` to the main shell scroll container in `OwnerDashboardShell.tsx` / `BrokerPortalLayout.tsx` so two-finger trackpad swipe stays inside the panel and never triggers history back.

### 3. Responsive card contract (site-wide)
Add to `src/index.css` `PASS 54 — CARD OVERFLOW CONTRACT`:
```css
.jj-card, [data-card], .metric-card {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;            /* clip escapes */
  display: flex; flex-direction: column;
  container-type: inline-size;
}
.jj-card > *, [data-card] > * { min-width: 0; max-width: 100%; }
.jj-card :is(h1,h2,h3,h4,p,span,div) { overflow-wrap: anywhere; }

/* KPI tiles: auto-stack when narrow */
@container (max-width: 220px) {
  .metric-card { flex-direction: column; align-items: flex-start; gap: 8px; }
  .metric-card [data-metric-icon] { margin-bottom: 4px; }
  .metric-card [data-metric-label] { white-space: normal; }
}

/* Action rows */
.jj-action-strip { flex-wrap: wrap; gap: 8px; }
@media (max-width: 640px) {
  .jj-action-strip > * { flex: 1 1 100%; }
}

/* Adaptive KPI grid */
.jj-kpi-grid { display: grid; gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(min(180px,100%), 1fr)); }
```
- Update `MetricCard.tsx` to wrap icon+value+label with `data-metric-*` attrs and remove any fixed widths; switch its container to flex with `min-width:0`.
- Update CRM KPI strip in `BrokerDashboardLanding`/`CRMPipeline` to use `.jj-kpi-grid` (replacing fixed 6-col grids).
- Update `ActionStrip.tsx` to use `.jj-action-strip` (already wraps; just ensure full-width on mobile).
- Update `DocumentStudio.tsx`, `CareersDashboard`, pipeline-by-stage chips to use `.jj-card` + adaptive grid.
- Replace `whitespace-nowrap` on long labels inside cards with normal wrap.

### 4. QA — Playwright visual sweep
Script `/tmp/browser/responsive-audit/run.py` captures `/owner`, `/owner/crm`, `/broker/crm`, `/owner/document-studio`, `/owner/careers`, `/` at widths 1920, 1440, 1280, 1024, 820, 768, 430, 390, 360, 320. Assert no element extends past its parent `.jj-card`. Save screenshots; report any remaining offenders.

## Out of scope
- Functional changes to selection, scrolling logic, or card data.
- New components beyond the existing `MetricCard`/`ActionStrip` primitives.
- Visual restyle beyond what these contracts enforce.
