
# Fix: AI Market Analyzer Incorrectly Flagging Short Delivery as "Extended"

## Problem

The `ai-market-analyzer` edge function passes the handover date to the AI model but gives it **zero guidance** on when a delivery timeline should be considered "extended." The AI sees a future date like "June 2027" and independently decides to flag it as a risk — even though it's only ~1.5 years away. 

Your rule: **Only flag delivery as "extended" if the handover is 4-5+ years from today.**

## Root Cause

In `supabase/functions/ai-market-analyzer/index.ts`, the system prompt (lines 47-55) has compliance rules but nothing about delivery timeline thresholds. The handover date is passed as raw text (line 66) without any context about what constitutes "extended."

## Fix

**File:** `supabase/functions/ai-market-analyzer/index.ts`

### Change 1: Add delivery timeline rules to the system prompt

Add these rules to the existing `IMPORTANT COMPLIANCE RULES` section:

```
DELIVERY TIMELINE RULES:
- Today's date is [dynamically injected current date]
- ONLY flag "extended delivery timeline" as a risk if the handover date is MORE than 4 years from today
- If handover is within 1-3 years, this is a NORMAL timeline — do NOT mention it as a risk
- If handover is within 1 year or already handed over, mention it as a POSITIVE factor (near-term or ready)
```

### Change 2: Inject today's date into the prompt

Currently the AI has no reference point for "how far away" a handover date is. Add `new Date().toISOString().split('T')[0]` to the system prompt so the model can calculate the difference.

### Change 3: Add the same rules to `ai-property-analyzer`

The same issue exists in `supabase/functions/ai-property-analyzer/index.ts` where the Cons section can also produce incorrect "extended delivery" risks. Add the same delivery timeline rules to its system prompt.

## Technical Summary

| File | Change |
|------|--------|
| `supabase/functions/ai-market-analyzer/index.ts` | Add delivery timeline threshold rules + inject current date into system prompt |
| `supabase/functions/ai-property-analyzer/index.ts` | Add same delivery timeline rules to system prompt |

Both edge functions will be redeployed automatically. No database or frontend changes needed.
