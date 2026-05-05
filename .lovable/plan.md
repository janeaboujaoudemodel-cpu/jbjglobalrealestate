## Goal

Fix the four issues in the Brokerage Ledger dialog (`Deal Ledger — {brokerage}`):

1. **Custom Range** picker is unusable — replace with explicit From / To inputs plus a clean two‑month calendar with Day / Month / Year navigation.
2. **Individual Deals** column headers (Date, Agent, Project / Unit, Client, Developer, Value, Commission) wrap onto two lines. Force single‑line headers and consistent row sizing.
3. The four summary KPI cards (Deals, Gross value, Commission, Avg deal size) are uneven — values sit at different vertical positions. Align to a single baseline grid with equal heights and centered numbers.
4. Closing the dialog (X button) feels laggy / glitchy.

## Files to change

- `src/components/analytics/DateRangeFilter.tsx` — full rewrite of the custom-range UX.
- `src/components/crm/BrokerageLedgerDialog.tsx` — header `whitespace-nowrap`, KPI card layout, dialog close behaviour.

## Detailed changes

### 1. `DateRangeFilter.tsx` — proper custom range

Replace the single popover with a richer custom-range editor that appears inline next to the preset select when `Custom Range` is chosen:

- **From** and **To** as two separate `Popover + Calendar` controls, each labelled and showing `dd MMM yyyy`.
- Inside each `Calendar`, add `captionLayout="dropdown-buttons"` with `fromYear={2015}` and `toYear={currentYear + 1}` so users get **Day / Month / Year dropdowns** at the top of the calendar (months back/forward + jump to any year).
- `numberOfMonths={1}` per popover (cleaner than the cramped two-month range picker), `mode="single"`, `pointer-events-auto` wrapper class so it works inside the dialog.
- A small **Apply** button next to the inputs that calls `onRangeChange({ start: startOfDay(from), end: endOfDay(to) })`. Disable Apply until both dates are set and `from <= to`.
- Validation: if `to < from`, show inline error text and don't fire `onRangeChange`.
- Persist the selected `from` / `to` in component state so re-opening the dialog keeps the previous custom range.
- Keep all existing presets and labels untouched (no removal).

### 2. `BrokerageLedgerDialog.tsx` — headers and cards

**Individual Deals table headers** (lines 220–230) and the **Period rollup** headers (lines 175–181):
- Add `whitespace-nowrap` to every `<th>` so "Date", "Project / Unit", "Commission", etc. never break across lines.
- Add `whitespace-nowrap` to the date cell (already present) and the value/commission cells.
- Use `tabular-nums` on numeric columns so digits align.

**Summary KPI cards** (lines 143–162):
- Make each card a `flex flex-col items-center justify-center text-center min-h-[96px]` block, so all four cards have identical height regardless of value length.
- Label uses `text-[10px] uppercase tracking-wider` (kept), centered.
- Value uses `text-xl md:text-2xl font-bold tabular-nums leading-tight whitespace-nowrap` and centered, so the digit baseline of "0", "AED 0", and "AED 1,234,567" all sit on the same line.
- Wrap the long currency values in a single line with `truncate` + `title={formatted}` tooltip fallback so big numbers don't push card height.
- Change the grid to `grid grid-cols-2 md:grid-cols-4 gap-3 items-stretch` (the cards already stretch, but make this explicit).

**Dialog close lag**:
- Root cause is the ledger's React Query (`brokerage-deals`) keeps refetching/staying mounted while the dialog animates out, and `BrokerageDealModal` is rendered as a sibling inside the same fragment, which keeps a second portal alive.
- Wrap close in a stable handler:
  ```ts
  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setAddOpen(false);
      setRange(null);
      setAgentFilter("");
    }
    onOpenChange(v);
  };
  ```
  Pass `handleOpenChange` to `<Dialog onOpenChange={...}>`.
- Gate the inner `useQuery` with `enabled: open && !!brokerageId` (already in place — keep) and add `staleTime: 30_000` so the panel doesn't re-fetch on every open/close cycle.
- Render `<BrokerageDealModal />` only when `addOpen` is true (`{addOpen && <BrokerageDealModal ... />}`) so it doesn't keep an extra Radix portal mounted behind the ledger, which is what makes the X feel sluggish.

## Out of scope / preserved

- No DB schema changes.
- All existing presets, columns, actions (Register Deal, Delete) and styling tone (champagne + gold hairline) preserved per the No‑Removal policy.
- No changes to `BrokerageDealModal` itself.

## Verification

After edits, in the preview:
1. Open a brokerage's Deal Ledger.
2. Pick **Custom Range** → confirm From/To popovers show with Day/Month/Year dropdowns; pick a from and to date; confirm Apply triggers a refresh.
3. Confirm "Date", "Project / Unit", "Commission" headers are single-line at desktop and on a 1024px viewport.
4. Confirm the four KPI cards are vertically centered and the values are baseline-aligned.
5. Click the X — dialog should close immediately with no flash of a second overlay.