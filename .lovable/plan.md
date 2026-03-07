

# Fix: Stop Auto-Populating Source URL from Saved Drafts

## Problem
When the Listing Generator loads, it restores the URL field from a previously saved cloud draft (`listing_extraction_queue.results.url`). The user sees a URL they didn't just type and interprets it as an auto-generated fake link. Per the user's policy: only they manually enter the source URL — it should never be pre-filled.

## Changes

### `src/components/listing-admin/ListingGenerator.tsx`
1. **Remove URL restoration from cloud draft** (line 207): Delete `if (result.url) setUrl(result.url);` — the URL field should always start empty.
2. **Remove URL from persisted state initialization** (line 118): Change `useState(persisted.current?.url || "")` to `useState("")` — never restore URL from sessionStorage either.
3. **Keep URL in the save-to-cloud logic** so draft records still track which URL was used for extraction history, but it won't be restored into the input field.

This ensures the Source URL input is always blank when the user opens the Listing Generator, requiring them to manually paste a URL each time.

