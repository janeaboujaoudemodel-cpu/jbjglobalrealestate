# Why brokerages disappeared

Your data is safe. The database still has **10,558 brokerages** (verified: `SELECT count(*) FROM crm_brokerages` → 10558). Nothing was deleted.

## Root cause

In the last performance fix I switched `useBrokerages` from `select("*")` to a slim, explicit column list (`BROKERAGE_LIST_COLUMNS` in `src/hooks/useCRMRelationships.ts`). That list contains `"country"`, but `crm_brokerages` has **no `country` column** (it has `emirate` and `region` only).

PostgREST rejects the whole request with a 400 error → React Query throws → the page renders with `data = []` → the UI shows "No brokerages match these filters" and every counter reads zero. The filters and the database are fine; the SELECT itself is failing.

## Fix

Edit `src/hooks/useCRMRelationships.ts` and remove `"country"` from `BROKERAGE_LIST_COLUMNS` (lines 9–26). Country is already derived in the filter code as `r.country || (r.region === "UAE" ? "United Arab Emirates" : r.region)` — `region` is already in the SELECT, so the country dropdown keeps working with no other change.

While I'm in that file I'll also:
- Add a defensive `console.error` + toast on the brokerages query so a future column typo is visible immediately instead of silently emptying the list.
- Re-verify every column name in the slim list against the live schema (the other 40+ columns I checked all exist).

## Verification after fix

1. Open `/owner/crm/relationships` → Brokerages tab should show all ~10,558 rows.
2. Emirate, country, status, source filters should all populate counts again.
3. No PostgREST 400 in the network tab for `crm_brokerages?select=...`.

No DB migration, no other files touched.
