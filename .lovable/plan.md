## Goal

Replace the 4-option "Region" dropdown (UAE / GCC / MENA / International) on the CRM Brokerages tab with a **searchable Country dropdown showing every country with its flag**, and apply the same upgrade to the Developer Registry tab if it has the same filter.

Also remove the per-row country flag I previously added next to each agency name (you didn't ask for that).

---

## Changes

### 1. `src/pages/CRMRelationships.tsx` — brokerage filters
- Remove `🇨🇨` flag chip rendered next to each agency row in the table/cards.
- Replace the "Region" `<Select>` (lines ~991-1003) with a **Country combobox**:
  - Source: full `COUNTRIES` list from `src/data/countries.ts` (already used by `CRMLeadModal`, contains all ~250 countries with flags).
  - Renders as a searchable popover (Command + CommandInput) so the user can type "Sing…" and pick **🇸🇬 Singapore**.
  - Each item: `{flag}  {name}  ·  {count}` (count = brokerages whose `country` matches).
  - Default option: **🌐 All countries · {total}**.
  - Selected value displays the flag + name in the trigger.
- Rename internal state `regionFilter` → `countryFilter`. Filter logic compares against `r.country` (fall back to `r.region === "UAE" ? "United Arab Emirates" : r.region`).
- Update active-filter chip + reset-all to use the new key/label.
- Keep the `Emirate` dropdown unchanged (UAE-specific sub-filter, only meaningful when country = UAE — optionally hide it when country ≠ UAE / All).

### 2. Developer Registry tab (same file, ~line 2030+)
- If the Developer view has an identical "Region" filter, apply the same Country combobox swap there for parity. If it doesn't, skip.

### 3. No backend changes
- No migration, no edge-function change. The `country` column already exists on `crm_brokerages` / `crm_developers` (used elsewhere in the file).

---

## Out of scope
- Per-row flags next to agency names (being removed, not re-added).
- Editing the `COUNTRIES` data file.
- Any email / template / RLS work.

---

## Files touched
- `src/pages/CRMRelationships.tsx` (one filter swap on brokerage tab, optional same swap on developer tab, remove inline flag chip from rows).

---

## Verification
- Open CRM → Brokerages → click "Country" → search "Sin" → see 🇸🇬 Singapore with count → select → list filters to Singaporean offices only.
- "All countries" restores the full list.
- Agency rows no longer show a flag next to the name.
- Developer Registry tab shows the same searchable country dropdown (if it had a region filter).
