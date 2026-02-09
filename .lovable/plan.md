

# Fix All Edge Function "Failed to Send Request" Errors

## Root Cause

Multiple edge functions used in the sync, extraction, and repair flows are **not registered** in `supabase/config.toml`. Without an entry, they default to `verify_jwt = true`, which is incompatible with the signing-keys gateway and causes every browser request to be rejected before your code runs.

Additionally, two of these functions use deprecated `esm.sh` imports that can cause deployment timeouts.

## Missing Functions (6 total)

These functions exist as deployed code but have no `config.toml` entry:

| Function | Used For |
|----------|----------|
| `batch-extract-pending` | Extract project data during sync |
| `reelly-backfill-projects` | Backfill missing Reelly projects |
| `repair-approved-projects` | Repair approved project metadata |
| `reelly-scrape` | Legacy Reelly import |
| `scheduled-extraction` | Scheduled data extraction jobs |
| `extract-developers-provident` | Extract developers from Provident |

## Changes

### 1. Register all 6 missing functions in config.toml
**File:** `supabase/config.toml`

Add entries with `verify_jwt = false`:

```toml
[functions.batch-extract-pending]
verify_jwt = false

[functions.reelly-backfill-projects]
verify_jwt = false

[functions.repair-approved-projects]
verify_jwt = false

[functions.reelly-scrape]
verify_jwt = false

[functions.scheduled-extraction]
verify_jwt = false

[functions.extract-developers-provident]
verify_jwt = false
```

### 2. Fix deprecated imports in 2 functions

**File:** `supabase/functions/batch-extract-pending/index.ts` (line 2)
- FROM: `import { createClient } from "https://esm.sh/@supabase/supabase-js@2";`
- TO: `import { createClient } from "npm:@supabase/supabase-js@2";`

**File:** `supabase/functions/repair-approved-projects/index.ts` (line 2)
- FROM: `import { createClient } from "https://esm.sh/@supabase/supabase-js@2";`
- TO: `import { createClient } from "npm:@supabase/supabase-js@2";`

(The other 4 functions already use `npm:` imports or don't need changes.)

## Files to Modify

| File | Change |
|------|--------|
| `supabase/config.toml` | Add 6 missing function entries |
| `supabase/functions/batch-extract-pending/index.ts` | Fix `esm.sh` to `npm:` import |
| `supabase/functions/repair-approved-projects/index.ts` | Fix `esm.sh` to `npm:` import |

