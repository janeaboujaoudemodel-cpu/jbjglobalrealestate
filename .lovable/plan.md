

## Fix Corrupt Developer Logos in Database

### Root Cause

The code is working correctly — it faithfully reads `logo_url` from the database. The problem is that **18 developer records** in the database have their `logo_url` set to a property photo (`habtoor_polo_villas_faeaa3daa7.webp`) instead of the real developer logo. This is a **data corruption issue**, not a code issue.

### Affected Developers (all have the same wrong photo as logo)

Emaar (2 records), DAMAC (2), Sobha (2), Aldar (2), Binghatti (2), Meraas (2), Ellington (2), Azizi (2), Samana (1), Imtiaz (1)

### Fix: Database Migration

Update the `logo_url` for all 18 corrupted records using the correct logos from their duplicate entries that have real logos:

| Developer | Correct Logo Source |
|-----------|-------------------|
| Emaar Properties | From `emaar` slug record |
| DAMAC Properties | From `damac` slug record |
| Sobha Realty | From `sobha` slug record |
| Aldar Properties | From `aldar` slug record |
| Ellington Properties | From `ellington` slug record |
| Azizi Developments | From `azizi` slug record |
| Samana Developers | From `samana` or `samana-developers` slug record |
| Imtiaz Developments | From `imtiaz-developments` slug record |
| Binghatti | No correct record exists — set to NULL (the code already has a hardcoded fallback for Binghatti in FeaturedListings) |
| Meraas | No correct record exists — set to NULL (will show initial fallback) |

### SQL Migration

A single UPDATE statement per developer to replace the corrupt `habtoor_polo_villas` URL with the correct logo URL from the sibling record.

### What stays untouched
- All code files — no changes needed
- Logo container styling (bg-white/90) — stays as-is
- `getDeveloperLogoUrl` utility — correct
- All Supabase joins — already include `logo_url`

### Technical Details
- The corruption likely happened during a bulk import that set a default/placeholder image
- All 18 records share the exact same wrong URL: `habtoor_polo_villas_faeaa3daa7.webp`
- After the fix, `getDeveloperLogoUrl` will return the real logos automatically since the data pipeline is already correct

