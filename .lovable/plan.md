

# Fix Remaining 19 Edge Functions with Incomplete CORS Headers

## What needs fixing

19 edge functions still have the short `Allow-Headers` string (`"authorization, x-client-info, apikey, content-type"`) instead of the full string that includes `x-supabase-client-*` headers. The shared `_shared/cors-utils.ts` is already correct.

## Two patterns to fix

### Pattern A: Simple `corsHeaders` const (17 files)
Replace the short header string with the full one:
- `fix-developer-photos`
- `ai-find-developer-logos`
- `rls-proof-anon-dev-sales-reps`
- `rls-hardening-proof`
- `ai-mortgage-advisor`
- `scrape-developer-logos`
- `sync-all-listings`
- `security-proof-studio-projects`
- `auto-find-developer-images`
- `elevenlabs-podcast-segment-tts`
- `fix-developer-feature-images`
- `restore-developer-photos`
- `generate-area-images`
- `firecrawl-scrape`
- `reelly-developers-sync`

### Pattern B: Custom `getCorsHeaders()` function (2 files)
These define their own local `getCorsHeaders()` with short headers:
- `validate-discount-code` (line 22)
- `ai-market-narratives` (line 25)

Same fix — replace the short string inside the function return.

## Implementation
For all 19 files, the change is identical: replace `"authorization, x-client-info, apikey, content-type"` with `"authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version"`.

This completes the CORS standardization across all 109+ edge functions.

