

## Restore All Developer Logos

### What Went Wrong
The previous "fix broken URLs" action incorrectly set `logo_url` to NULL for ~238 developers. Additionally, some remaining logo URLs (like Binghatti's) now return "Access Denied" from the S3 storage. The logos were NOT supposed to be touched -- only the feature photos (main card images) needed fixing.

### Current State
- **537 total developers**
- **299 have logos** (but some URLs are broken, like Binghatti's returning "Access Denied")
- **238 are missing logos** (incorrectly nulled)
- Azizi has a working logo URL in the database but it may fail in-browser due to CORS

### Plan

#### Step 1: Re-sync All Developer Logos from Reelly API
Run the existing `reelly-developers-sync` edge function in "full" mode. This function:
- Fetches ALL developers from the Reelly API (which is the original source of logo data)
- For existing developers with missing data, it updates `logo_url` (line 366: `if (mapped.logo_url) updateData.logo_url = mapped.logo_url`)
- This will restore logos for the ~238 developers that were incorrectly nulled
- It will also fix Binghatti's broken S3 URL if Reelly has a fresh one

#### Step 2: Verify and Fix Remaining Broken Logos
After the sync, check which logos are still broken (Access Denied or 404). For any remaining broken ones:
- Search for alternative logo URLs from Reelly API or from known good sources
- For key developers (Binghatti, Azizi, Damac, Emaar, etc.), manually verify each logo loads correctly

#### Step 3: Fix Azizi Logo Display
Azizi's logo URL is a cloudfront URL that works when fetched server-side. If it still doesn't display in the browser after sync, replace it with a fresh URL from Reelly or a known working source.

#### Step 4: Ensure White Frame for Specified Developers
Verify that `logo_bg_color = '#FFFFFF'` remains set for: Binghatti, Azizi, Imtiaz, H&H, and Beyond -- per your previous instruction.

### What Will NOT Be Touched
- Feature images (main card photos) -- no changes
- Card layout/design code -- no changes
- Any developer data other than `logo_url` restoration

### Technical Details

**Files that may need changes:**
- No code file changes expected -- the existing `reelly-developers-sync` edge function handles the restoration
- Database `developers` table: `logo_url` column will be updated for ~238+ developers

**Edge function to invoke:**
- `reelly-developers-sync` with `{ "mode": "full" }` to paginate through all Reelly developers and restore missing logos
- If any logos remain broken after sync, individual database updates with verified working URLs

