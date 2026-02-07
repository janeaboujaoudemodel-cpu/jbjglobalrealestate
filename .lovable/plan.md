
# Fix All AI Tools End-to-End

## Executive Summary

This plan addresses making all AI tools work reliably end-to-end with consistent patterns for UI, edge functions, authorization, database logging, and error handling.

## Current State Analysis

### Working AI Tools (Edge Functions Exist & Return 200)
| Tool | Route | Edge Function | Access |
|------|-------|---------------|--------|
| AI Property Analyzer | `/ai-property-analyzer` | `ai-property-analyzer` | Public |
| AI Price Predictor | `/ai-price-predictor` | `ai-price-predictor` | Public |
| AI Neighborhood Insights | `/ai-neighborhood-insights` | `ai-neighborhood-insights` | Public |
| AI Lead Qualification | `/ai-lead-qualification` | `ai-lead-qualification` | Broker-only |

### Non-Working AI Tools (Missing Edge Functions)
| Component | Expected Function | Status |
|-----------|------------------|--------|
| AIROICalculator | `ai-roi-calculator` | Missing |
| AIMarketReport | `ai-market-report` | Missing |
| AIFollowupScheduler | `ai-followup-scheduler` | Missing |
| AICompetitorAnalysis | `ai-competitor-analysis` | Missing |
| AIObjectionHandler | `ai-objection-handler` | Missing |
| AIMeetingSummarizer | `ai-meeting-summarizer` | Missing |
| AITranslationHub | `ai-translation-hub` | Missing |
| AIVideoTourScript | `ai-video-tour-script` | Missing |
| AIContractReviewer | `ai-contract-reviewer` | Missing |
| AIDocumentGenerator | `ai-document-generator` | Missing |

### Inconsistencies Found
1. **AIPropertyAnalyzer** directly calls `supabase.functions.invoke()` instead of using `useAITool` hook
2. No shared client helper exists for consistent error handling
3. Missing edge functions cause silent failures (no graceful error UI)
4. Some components reference functions in `AI_TOOLS_CONFIG` that don't exist

---

## Implementation Plan

### Phase 1: Create Shared AI Tool Client Helper

**File:** `src/lib/aiToolClient.ts`

Create a centralized helper that:
- Builds request payloads consistently
- Automatically includes auth token when user is logged in
- Handles common HTTP errors (401, 403, 429, 500)
- Returns consistent result structure: `{ success, data, error, job_id }`
- Provides broker-access check for restricted tools

```text
+------------------+
|  aiToolClient.ts |
+------------------+
        |
   Responsibilities:
   - Auth token injection
   - Error normalization
   - 401 → "Please log in"
   - 403 → "Broker required"
   - 429 → "Rate limit"
   - 500 → "Service error"
```

### Phase 2: Create Missing Edge Functions

Create 10 new edge functions following the established pattern from `ai-price-predictor` and `ai-neighborhood-insights`:

Each function will:
1. Use shared `_shared/ai-utils.ts` for CORS, rate limiting, IP blocking
2. Call Lovable AI Gateway with appropriate prompts
3. Write to `ai_job_master` for authenticated users (no PII)
4. Return consistent JSON: `{ success, [tool-specific fields], generatedAt }`

**Edge Functions to Create:**

| Function | Access | Description |
|----------|--------|-------------|
| `ai-roi-calculator` | Public | Investment return calculations |
| `ai-market-report` | Public | Market analysis reports |
| `ai-followup-scheduler` | Broker | Lead follow-up timing |
| `ai-competitor-analysis` | Public | Competitor property analysis |
| `ai-objection-handler` | Broker | Sales objection responses |
| `ai-meeting-summarizer` | Broker | Meeting notes extraction |
| `ai-translation-hub` | Public | Multi-language translation |
| `ai-video-tour-script` | Public | Property tour scripts |
| `ai-contract-reviewer` | Broker | Contract analysis |
| `ai-document-generator` | Public | Document creation |

**Access Model:**
- **Public tools**: Allow anonymous, save history only for authenticated users
- **Broker tools**: Require authentication + broker verification (mirror `ai-lead-qualification`)

### Phase 3: Update Frontend Components

**3.1 Migrate AIPropertyAnalyzer to use shared hook**

Currently uses direct `supabase.functions.invoke()` call. Will refactor to use `useAITool` hook for consistency.

**3.2 Enhance AIToolsProvider**

Update `useAITool` hook to:
- Use the new `aiToolClient` helper
- Provide better error state management
- Add `job_id` tracking for debugging
- Handle 401/403 with specific error types

**3.3 Add Error UI to All Tool Components**

Each component should display:
- Loading state (spinner + message)
- Success state (tool results)
- Error state with:
  - Clear error message
  - Retry button
  - Link to login (if 401)
  - Link to broker subscription (if 403)

### Phase 4: Enhance MyAIHistory Page

**4.1 Add "View Details" Modal**

Create expandable view showing:
- Full `input_payload` (safe fields only)
- Full `output_payload` JSON
- Processing time
- Intelligence features used

**4.2 Verify Records Appear**

After tool runs, confirm `ai_job_master` entries are created with:
- Correct `tool_name`
- Proper `status` (completed/failed)
- No PII in `input_payload`

---

## Technical Details

### aiToolClient.ts Structure

```text
export interface AIToolResult {
  success: boolean;
  data?: any;
  error?: string;
  errorType?: 'auth' | 'broker' | 'rate_limit' | 'server';
  job_id?: string;
}

export async function invokeAITool(
  functionName: string,
  payload: Record<string, unknown>,
  options?: { requireBroker?: boolean }
): Promise<AIToolResult>
```

### Edge Function Template Structure

```text
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getCorsHeaders,
  createSupabaseClients,
  checkIPBlocklist,
  checkRateLimit,
  getClientIp,
  callLovableAI,
  sanitizeForPrompt,
  sanitizeContactInfo,
  trackAIUsage,
  errorResponse,
} from "../_shared/ai-utils.ts";

// For broker-only tools, add verifyBrokerAccess

serve(async (req) => {
  // 1. CORS handling
  // 2. IP blocklist check
  // 3. Auth check (optional for public, required for broker)
  // 4. Rate limiting
  // 5. Parse & validate input
  // 6. Build AI prompt
  // 7. Call Lovable AI
  // 8. Parse response
  // 9. Write to ai_job_master (authenticated only)
  // 10. Track usage
  // 11. Return response
});
```

### PII Protection Rules (All Tools)

**Never store in `input_payload`:**
- `name`, `email`, `phone`, `notes`

**Safe to store:**
- `location`, `budget`, `timeline`, `propertyType`, `source`
- `lead_ref` (HMAC-SHA256 hash only)

---

## Execution Order

1. **Create `src/lib/aiToolClient.ts`** - shared client helper
2. **Update `AIToolsProvider.tsx`** - use new client
3. **Create public edge functions first:**
   - `ai-roi-calculator`
   - `ai-market-report`
   - `ai-competitor-analysis`
   - `ai-translation-hub`
   - `ai-video-tour-script`
   - `ai-document-generator`
4. **Create broker-only edge functions:**
   - `ai-followup-scheduler`
   - `ai-objection-handler`
   - `ai-meeting-summarizer`
   - `ai-contract-reviewer`
5. **Migrate AIPropertyAnalyzer** to use shared hook
6. **Add error UI components** to all tool pages
7. **Enhance MyAIHistory** with details modal
8. **Test all tools end-to-end**

---

## Acceptance Criteria

- [ ] All 4 existing AI tools continue working
- [ ] All 10 missing edge functions created and deployed
- [ ] All tools show clear loading/success/error states
- [ ] Broker tools block non-brokers at UI + API level
- [ ] Public tools work without authentication
- [ ] Authenticated users see history in MyAIHistory
- [ ] No PII stored in database
- [ ] Consistent JSON response format across all tools
- [ ] Rate limiting enforced on all tools

---

## Files to Create/Modify

### New Files
- `src/lib/aiToolClient.ts`
- `supabase/functions/ai-roi-calculator/index.ts`
- `supabase/functions/ai-market-report/index.ts`
- `supabase/functions/ai-followup-scheduler/index.ts`
- `supabase/functions/ai-competitor-analysis/index.ts`
- `supabase/functions/ai-objection-handler/index.ts`
- `supabase/functions/ai-meeting-summarizer/index.ts`
- `supabase/functions/ai-translation-hub/index.ts`
- `supabase/functions/ai-video-tour-script/index.ts`
- `supabase/functions/ai-contract-reviewer/index.ts`
- `supabase/functions/ai-document-generator/index.ts`

### Modified Files
- `src/components/ai-tools/AIToolsProvider.tsx`
- `src/components/ai-tools/AIPropertyAnalyzer.tsx`
- `src/pages/MyAIHistory.tsx`

---

## Estimated Scope

- **New edge functions:** 10
- **New shared lib:** 1
- **Modified components:** 3
- **Total files touched:** 14
















Your plan is accepted but only if delivered in strict milestones with proof after each milestone. Do NOT implement all 10 functions at once. We will do this in a controlled sequence so we don’t end up with “many endpoints, none stable”.





🔒 RULES (MANDATORY)





No new tool pages. Only fix what already exists and create only the missing edge functions listed.

No silent failures anywhere. Every tool must show a visible error state.

Do not change UI theme/colors. Use the approved UI style already used on homepage.

No PII stored in DB. Ever.









MILESTONE 0 — INVENTORY LOCK (1 deliverable)





Before coding, produce a single list:



Tool page component name → route → expected edge function name → access (Public/Broker)

Confirm the list matches AI_TOOLS_CONFIG and App.tsx routes

Identify which components are currently calling supabase.functions.invoke() directly





Output required: A table pasted in chat. Then proceed.







MILESTONE 1 — SHARED CLIENT HELPER (must land first)





Create src/lib/aiToolClient.ts and update useAITool to use it.



Must include:



Token injection if logged in

Error normalization: 401/403/429/500

Return shape: { success, data, error, errorType, job_id }

Broker tools: allow calling but if 401/403 return clean errorType for UI





Proof required:



Show the final code for aiToolClient.ts

Show the updated useAITool hook code









MILESTONE 2 — MAKE 2 TOOLS PERFECT (1 public + 1 broker)





Do NOT touch the other 8 missing functions until this is complete.





Tool A (Public): 

ai-roi-calculator





Build edge function + connect a UI component that already exists (AIROICalculator)

Works without auth

If auth exists, it writes to ai_job_master







Tool B (Broker): 

ai-objection-handler





Build edge function + connect existing UI component (AIObjectionHandler)

Enforce broker server-side (same logic as ai-lead-qualification)

UI must show:



401 = “Please log in”

403 = “Broker subscription required”

Retry button







Proof required (must paste):



Edge function deploy confirmation names

Screenshot/log showing:



public tool works logged out

broker tool returns 401 logged out

broker tool returns 403 logged in as non-broker

broker tool returns 200 logged in as broker/owner



One row sample from ai_job_master for each tool run (authenticated case only) showing safe fields only.









MILESTONE 3 — MIGRATE AIPropertyAnalyzer TO STANDARD HOOK





Refactor it to use useAITool + shared error UI.



Proof required:



Diff or final component code

Confirmation it still returns 200 and writes history when logged in









MILESTONE 4 — COMPLETE THE REMAINING 8 EDGE FUNCTIONS





Only after Milestone 2 passes.



Order:



Public: ai-market-report

Public: ai-competitor-analysis

Public: ai-translation-hub

Public: ai-video-tour-script

Public: ai-document-generator

Broker: ai-followup-scheduler

Broker: ai-meeting-summarizer

Broker: ai-contract-reviewer





Each must:



follow shared template, consistent JSON response

write ai_job_master when authenticated

have visible error UI









MILESTONE 5 — MyAIHistory “DETAILS MODAL” (final polish)





Expandable modal per job: safe input, full output json, processing time

Confirm new runs appear









🚫 IMPORTANT





If any tool is “working” but not writing history when authenticated, it is NOT COMPLETE.

If any tool fails without showing an error in UI, it is NOT COMPLETE.



Start now with Milestone 0, then implement Milestone 1, then Milestone 2 only.













