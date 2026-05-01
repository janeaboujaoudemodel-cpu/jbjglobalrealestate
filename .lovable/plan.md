
# Relationship Hub: Full UAE Directory + Prefilled Contacts

## What's broken today

After investigating the database directly:

- `crm_brokerages` has **73 rows total** — but they're all owned by a single owner (`72ca2405-…`). The two other owners (you included) see **0** because RLS scopes rows by `owner_id`. That's why the Brokerage tab shows "All · 0".
- Of those 73 brokerages, only **47** have phone/email/website/office address filled. The rest are name-only stubs.
- `crm_developer_registry` has 774 rows for the same single owner. Phone fill rate is **32%**, email **34%**, website **59%**, office address barely tracked at all.
- There is no real "UAE-wide directory" today — what exists is one owner's partially-enriched personal list.

You want: **every brokerage in the UAE** and **every developer in the UAE**, prefilled with office location, email, phone, website — visible to all owners, not just one.

## Plan

### 1. Make the directory shared, not per-owner

Today every owner sees a private list. The fix is to treat brokerages and the developer registry as a **shared UAE directory** that every owner sees, with each owner still able to add private notes / status / outreach.

- Add a new `is_directory` flag (boolean) on `crm_brokerages` and `crm_developer_registry`.
- Mark the 73 + 774 existing directory rows as `is_directory = true` and detach them from a single `owner_id` (set to `NULL` for directory rows).
- Update RLS:
  - Directory rows: readable by **all authenticated owners**.
  - Owner-private fields (status, notes, AI summary, outreach state) move to a sibling `crm_brokerage_state` / `crm_developer_state` table keyed by `(owner_id, brokerage_id)` so each owner's pipeline stays private.
- The list query joins the shared directory + the current owner's private state.

Effect: every owner instantly sees the full directory and counts go from 0 → real numbers.

### 2. Bulk-load every brokerage in the UAE

Right now there are 73 brokerages. We'll grow this to the full RERA-licensed brokerage population across all 7 emirates by combining three sources:

- **DLD / RERA Dubai broker registry** — public, has license, office, phone, email, website (~3,000+ Dubai firms).
- **Abu Dhabi DMT brokerage list**.
- **Sharjah, Ajman, RAK, Fujairah, UAQ municipality real-estate broker lists** (smaller but completable).

Approach:

- New edge function `seed-uae-brokerage-directory` runs server-side with the service role.
- It fetches each emirate's source via Firecrawl (already wired in this project), normalizes the schema, and upserts into `crm_brokerages` with `is_directory = true`.
- Idempotent: re-running updates the row if RERA license matches, never duplicates.
- Captures into the existing columns: `company_name`, `rera_license`, `office_address`, `office_location`, `office_map_url`, `phone`, `email`, `website`, `linkedin_url`, `emirate`, `logo_url`. `field_sources` jsonb tracks where each field came from.
- For rows that come back missing a field, the existing `enrich-developer-data`-style flow (Perplexity + Firecrawl) fills the gaps.

A new **"Sync UAE Directory"** button on the Brokerages tab (admin-only) triggers the function and shows live progress (scanned / inserted / enriched / failed).

### 3. Bulk-load every developer in the UAE

The `developers` master catalog already has **631** rows but they're not propagated into the registry for new owners, and contact fields are sparse.

- The existing **"Import all developers"** action already pulls from `developers` → `crm_developer_registry`. After step 1's RLS change it'll act on the shared directory once instead of per-owner.
- Add a companion **"Enrich missing contacts"** bulk action that, for any directory developer where phone/email/website/HQ is empty, runs the existing `enrich-developer-registry` edge function in batches (rate-limited, resumable).
- Same `field_sources` jsonb so each filled field shows where it came from (master catalog, AI web research, website scrape, AI inferred, manual). This is already wired in the UI.

### 4. UI tightening on the Relationship Hub

- Remove the "Sync UAE Directory" / "Import all developers" buttons from the per-owner toolbar and put them under an **"Admin · Directory tools"** section (visible only to `admin` / `is_jbj_owner`).
- Replace the misleading **"All · 0"** counter behavior: when the directory hasn't been loaded yet for the signed-in owner, show a "Directory loading…" skeleton instead of a zero count.
- Add the missing **office address column** to the brokerage table view (today `office_address` is in the DB but only shown inside the edit dialog).
- Add **emirate-grouped counts** at the top: "Dubai 1,842 · Abu Dhabi 410 · Sharjah …" so the UAE-wide coverage is visible at a glance.

### 5. Permissions & costs

- The Firecrawl + Perplexity calls run server-side; both keys are already configured.
- Bulk enrichment is rate-limited (50 rows / batch, 1 s spacing) and chunked so a full UAE sweep doesn't blow credits.
- Admins can pause / resume the run from the UI.

## Technical details

```text
crm_brokerages              <- shared directory rows (is_directory=true, owner_id=NULL)
                                + per-owner additions (is_directory=false, owner_id=uid)
crm_brokerage_state         <- NEW: (owner_id, brokerage_id) -> status, notes, outreach, reminders, AI fields
crm_developer_registry      <- shared directory rows + per-owner adds (same pattern)
crm_developer_state         <- NEW: (owner_id, developer_id) -> per-owner pipeline state

Edge functions:
  seed-uae-brokerage-directory   NEW   pulls RERA / DMT / municipality lists via Firecrawl
  enrich-brokerage-directory     NEW   fills missing phone/email/web/office on directory rows
  enrich-developer-registry      EXISTING (reused for the developer side)

Migrations:
  1. add is_directory boolean default false to crm_brokerages, crm_developer_registry
  2. backfill existing 73 brokerages + 774 dev rows as directory (owner_id -> NULL)
  3. create crm_brokerage_state, crm_developer_state with RLS (owner can only see own state)
  4. update brokerage / registry RLS: SELECT allowed if is_directory OR owner_id = auth.uid()
                                      INSERT/UPDATE/DELETE only on own rows; directory rows admin-only
  5. helper view crm_brokerage_with_state and crm_developer_with_state that left-join state for the current owner
```

The two list hooks (`useBrokerages`, `useDeveloperRegistry`) switch to read from the joined views so the UI keeps the same shape — no large refactor in `CRMRelationships.tsx`.

## What you'll see after this ships

- Brokerage tab: every UAE brokerage we can find (target ≥ 3,500 across emirates), with office, phone, email, website prefilled where the source provides them; the rest filled in by AI enrichment with a source pill on each value.
- Developer Registry tab: full UAE developer set (631+ today, growing as the master catalog grows), prefilled the same way.
- The "0" count disappears for every owner — directory is shared.
- Your private pipeline (statuses, notes, outreach) stays private to you.
