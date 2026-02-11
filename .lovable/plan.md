

# Fix: Last 2 Files with Wrong Founder Name Spelling

## Current Status
- The app is **working** -- no crash, no LanguageProvider error
- The founder name "Jane Bou Jaoude" (capital B) is correct across all `src/` files
- Only **2 edge function files** still have the old lowercase "bou" spelling

## Files to Fix

### 1. `supabase/functions/clone-jane-voice/index.ts`
- Line 26: Comment `Jane bou Jaoude` -> `Jane Bou Jaoude`
- Line 28: String `Jane bou Jaoude - JBJ Global` -> `Jane Bou Jaoude - JBJ Global`
- Line 29: String `Jane bou Jaoude - refined...` -> `Jane Bou Jaoude - refined...`

### 2. `supabase/functions/owner-voice-generate/index.ts`
- Line 56: `"Jane bou Jaoude"` -> `"Jane Bou Jaoude"`

## Execution
Single batch: Fix both files and redeploy the edge functions.

## Technical Details
- Case-sensitive replace: `Jane bou Jaoude` to `Jane Bou Jaoude`
- Both edge functions will be redeployed automatically after changes
- No other files remain with the incorrect spelling

