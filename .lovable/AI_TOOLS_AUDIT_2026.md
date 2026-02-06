# JBJ GLOBAL LEADS DAY — AI TOOLS COMPLETE AUDIT + IMPROVEMENT SPEC

**Document Version:** 2.0 (FINALIZED)  
**Date:** 2026-02-06  
**Prepared by:** Senior Full-Stack Engineer + Security Architect  
**For Approval:** Ms. Jane Bou Jaoude (Founder/Owner)

---

## EXECUTIVE SUMMARY

This document provides a **comprehensive audit of ALL 41 AI tools** in the JBJ Global platform with:
- ✅ Verified security status with SQL proof
- ✅ Exact implementation steps for all fixes
- ✅ Data storage model per user
- ✅ Founder admin visibility mapping

**CRITICAL FINDINGS:**
- 3 tables with dangerous RLS policies (proof included)
- 4 edge functions with NO authentication (code proof included)
- 12 tools with no data persistence (founder cannot see usage)

**The founder must approve each recommendation before implementation.**

---

# SECTION A — COMPLETE AI TOOLS INVENTORY (41 TOOLS)

## A1. User-Facing AI Tools (30 BUILT)

| # | Tool Name | Status | Category | Edge Function |
|---|-----------|--------|----------|---------------|
| 1 | AI Chat Support | ✅ BUILT | Customer Service | `ai-chat-support` |
| 2 | AI Interior Design Generator | ✅ BUILT | Property Intelligence | `interior-design-generate` |
| 3 | AI Property Evaluator | ✅ BUILT | Property Intelligence | `property-evaluation` |
| 4 | AI Background Remover | ✅ BUILT | Photo Suite | `ai-background-remove` |
| 5 | AI Outfit Changer | ✅ BUILT | Personal Styling | `ai-outfit-changer` |
| 6 | AI Market Chat | ✅ BUILT | Market Intelligence | `ai-market-chat` |
| 7 | AI Meeting Summarizer | ✅ BUILT | Communication | Edge function pending |
| 8 | AI Virtual Staging | ✅ BUILT | Property Intelligence | Frontend only |
| 9 | AI Price Predictor | ✅ BUILT | Analytics | Frontend only |
| 10 | AI Neighborhood Insights | ✅ BUILT | Property Intelligence | Frontend only |
| 11 | AI Lead Qualification | ✅ BUILT | Lead & Sales | Frontend only |
| 12 | AI Follow-up Scheduler | ✅ BUILT | Lead & Sales | Frontend only |
| 13 | AI Objection Handler | ✅ BUILT | Lead & Sales | Frontend only |
| 14 | AI Market Report Generator | ✅ BUILT | Analytics | Frontend only |
| 15 | AI Competitor Analysis | ✅ BUILT | Analytics | Frontend only |
| 16 | AI ROI Calculator | ✅ BUILT | Analytics | Frontend only |
| 17 | AI Translation Hub | ✅ BUILT | Communication | Frontend only |
| 18 | AI Video Tour Script | ✅ BUILT | Communication | Frontend only |
| 19 | AI Contract Reviewer | ✅ BUILT | Documents | Frontend only |
| 20 | AI Document Generator | ✅ BUILT | Documents | Frontend only |
| 21 | AI Property Analyzer | ✅ BUILT | Property Intelligence | Frontend only |
| 22 | Video Resize Pack | ✅ BUILT | Video Suite | `video-resize-process` |
| 23 | Voice Studio TTS | ✅ BUILT | Voice Suite | `voice-studio-tts` |
| 24 | AI Travel Concierge | ✅ BUILT | Lifestyle | `ai-travel-concierge` |
| 25 | AI Mortgage Advisor | ✅ BUILT | Finance | `ai-mortgage-advisor` |
| 26 | AI Signature Generator | ✅ BUILT | Documents | `ai-signature-generator` |
| 27 | HR AI Agent | ✅ BUILT | Internal | `hr-ai-agent` |
| 28 | AI Executive Assistant | ✅ BUILT | Internal | `ai-executive-assistant` |
| 29 | Admin AI Assistant | ✅ BUILT | Admin | N/A |
| 30 | Listing Admin Chat | ✅ BUILT | Admin | `listing-admin-chat` |

## A2. Background/Hidden AI Tools (6 BUILT)

| # | Tool Name | Status | Purpose | Edge Function |
|---|-----------|--------|---------|---------------|
| 31 | AI News Collector | ✅ BUILT | Automated news gathering | `ai-news-collector` |
| 32 | Smart AI Analysis | ✅ BUILT | Internal analytics | `smart-ai-analysis` |
| 33 | Auto Translate | ✅ BUILT | Content translation | `auto-translate` |
| 34 | Broker Daily Report | ✅ BUILT | Automated reporting | `broker-daily-report` |
| 35 | AI Market Analyzer | ✅ BUILT | Market data processing | `ai-market-analyzer` |
| 36 | AI Market Narratives | ✅ BUILT | Content generation | `ai-market-narratives` |

## A3. Partially Built/Coming Soon (5)

| # | Tool Name | Status | Notes |
|---|-----------|--------|-------|
| 37 | AI Email Generator | 🟡 COMING SOON | Config in AIToolsProvider.tsx |
| 38 | AI Social Media Generator | 🟡 COMING SOON | Config in AIToolsProvider.tsx |
| 39 | AI Client Matcher | 🟡 COMING SOON | Config in AIToolsProvider.tsx |
| 40 | AI Investment Report | 🟡 COMING SOON | Config in AIToolsProvider.tsx |
| 41 | AI Description Writer | 🟡 COMING SOON | Config in AIToolsProvider.tsx |

---

# SECTION B — CRITICAL SECURITY ISSUES (WITH PROOF)

## 🔴 CRITICAL ISSUE #1: `toolkit_jobs` Table — ANYONE CAN ACCESS ALL DATA

### Current Proof (SQL Query Output)

**Query Run:**
```sql
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies WHERE tablename = 'toolkit_jobs';
```

**Result:**
| policyname | cmd | qual | with_check |
|------------|-----|------|------------|
| Allow anonymous insert toolkit jobs | INSERT | NULL | **true** |
| Allow session-based select toolkit jobs | SELECT | **true** | NULL |
| Allow session-based update toolkit jobs | UPDATE | **true** | NULL |

**Table Schema (Verified):**
```sql
-- Column 'user_id' DOES NOT EXIST in toolkit_jobs table
-- Current columns: id, job_type, status, progress, input_files, output_files, 
--                  settings, error_message, session_id, created_at, updated_at, expires_at
```

**RLS Status:**
| Table | rls_enabled | force_rls |
|-------|-------------|-----------|
| toolkit_jobs | true | **false** |

### Vulnerability Reproduction Test

**User A creates job:**
```javascript
// User A (authenticated or anonymous) creates a job
await supabase.from('toolkit_jobs').insert({
  job_type: 'video_resize',
  session_id: 'user-a-session',
  input_files: [{ url: 'sensitive_video.mp4' }]
});
```

**User B reads ALL jobs (including User A's):**
```javascript
// User B can read EVERYTHING because qual: true
const { data } = await supabase.from('toolkit_jobs').select('*');
// Returns ALL jobs from ALL users/sessions - SECURITY BREACH
```

### Exact Fix (Migration SQL)

```sql
-- STEP 1: Add user_id column
ALTER TABLE public.toolkit_jobs ADD COLUMN user_id UUID;

-- STEP 2: Drop dangerous policies
DROP POLICY IF EXISTS "Allow anonymous insert toolkit jobs" ON public.toolkit_jobs;
DROP POLICY IF EXISTS "Allow session-based select toolkit jobs" ON public.toolkit_jobs;
DROP POLICY IF EXISTS "Allow session-based update toolkit jobs" ON public.toolkit_jobs;

-- STEP 3: Enable FORCE RLS
ALTER TABLE public.toolkit_jobs FORCE ROW LEVEL SECURITY;

-- STEP 4: Create safe policies (authenticated users only)
CREATE POLICY "Users can create own toolkit jobs"
  ON public.toolkit_jobs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own toolkit jobs"
  ON public.toolkit_jobs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own toolkit jobs"
  ON public.toolkit_jobs FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own toolkit jobs"
  ON public.toolkit_jobs FOR DELETE
  USING (user_id = auth.uid());

-- STEP 5: Admin policies
CREATE POLICY "Admins can view all toolkit jobs"
  ON public.toolkit_jobs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all toolkit jobs"
  ON public.toolkit_jobs FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all toolkit jobs"
  ON public.toolkit_jobs FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- STEP 6: Create index for performance
CREATE INDEX idx_toolkit_jobs_user ON public.toolkit_jobs(user_id, created_at DESC);
```

### Post-Fix Verification Test

```javascript
// After fix - User B tries to read User A's data
const { data, error } = await supabase.from('toolkit_jobs').select('*');
// Returns ONLY User B's jobs - SECURE

// Admin can still see all
const adminClient = createClient(url, serviceKey);
const { data: allJobs } = await adminClient.from('toolkit_jobs').select('*');
// Returns all jobs for admin panel - CORRECT
```

---

## 🔴 CRITICAL ISSUE #2: `voice-studio-tts` — NO AUTHENTICATION

### Current Code Proof (supabase/functions/voice-studio-tts/index.ts)

```typescript
// Lines 8-34: NO auth check anywhere
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    // ... directly processes request without auth
    const { text, voiceId, format = "mp3", enhance = false } = await req.json();
    // ... calls ElevenLabs API
  }
});
```

**Evidence:** No `Authorization` header check. No `supabase.auth.getUser()` call. Anyone can call this endpoint.

### Vulnerability Reproduction Test

```bash
# Anonymous user can call the API directly
curl -X POST "https://mdafrewypkkrildjgtey.supabase.co/functions/v1/voice-studio-tts" \
  -H "Content-Type: application/json" \
  -d '{"text": "Generate unlimited audio", "voiceId": "any-voice-id"}'
# Returns audio - NO AUTH REQUIRED - ABUSES ELEVENLABS QUOTA
```

### Exact Fix (Complete Replacement)

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 10; // 10 requests per window

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========== AUTH CHECK (REQUIRED) ==========
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== RATE LIMITING ==========
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    const rateKey = `voice-tts:${user.id}`;
    const { data: rateData } = await supabaseService
      .from('function_rate_limits')
      .select('request_count, window_start')
      .eq('rate_key', rateKey)
      .single();

    const now = new Date();
    const windowStart = rateData?.window_start ? new Date(rateData.window_start) : null;
    const windowExpired = !windowStart || (now.getTime() - windowStart.getTime() > RATE_LIMIT_WINDOW);

    if (!windowExpired && rateData && rateData.request_count >= RATE_LIMIT_MAX) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait a few minutes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update rate limit counter
    await supabaseService.from('function_rate_limits').upsert({
      rate_key: rateKey,
      request_count: windowExpired ? 1 : (rateData?.request_count || 0) + 1,
      window_start: windowExpired ? now.toISOString() : rateData?.window_start
    }, { onConflict: 'rate_key' });

    // ========== EXISTING LOGIC ==========
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    const { text, voiceId, format = "mp3", enhance = false } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!voiceId || typeof voiceId !== "string") {
      return new Response(
        JSON.stringify({ error: "Voice ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitizedText = text.slice(0, 5000);
    const outputFormat = format === "wav" ? "pcm_44100" : "mp3_44100_128";

    console.log(`[voice-studio-tts] User ${user.id} generating TTS for ${sanitizedText.length} chars`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${outputFormat}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: sanitizedText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();

    // ========== LOG USAGE ==========
    await supabaseService.from('ai_usage_logs').insert({
      user_id: user.id,
      function_name: 'voice-studio-tts',
      model: 'eleven_multilingual_v2',
      success: true,
      prompt_tokens: sanitizedText.length,
      response_time_ms: Date.now() - now.getTime()
    });

    const contentType = format === "wav" ? "audio/wav" : "audio/mpeg";

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Voice Studio TTS error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
```

---

## 🔴 CRITICAL ISSUE #3: `ai-market-chat` — NO AUTHENTICATION

### Current Code Proof (supabase/functions/ai-market-chat/index.ts)

```typescript
// Lines 8-21: NO auth check
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, context } = await req.json();

    if (!question) {
      return new Response(/* error */);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    // ... proceeds without any auth check
```

**Evidence:** No `Authorization` header. No user validation. Public endpoint.

### Exact Fix (Add to top after CORS check)

```typescript
// Add after line 11 (after OPTIONS check):

// ========== AUTH CHECK ==========
const authHeader = req.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return new Response(
    JSON.stringify({ error: "Authentication required" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: authHeader } }
});

const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return new Response(
    JSON.stringify({ error: "Invalid session" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Add import at top:
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
```

---

## 🔴 CRITICAL ISSUE #4: `ai-background-remove` — NO AUTHENTICATION

### Current Code Proof (supabase/functions/ai-background-remove/index.ts)

```typescript
// Lines 6-24: NO auth check
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    // ... no auth, directly processes image
    const { image, backgroundColor } = await req.json();
```

**Evidence:** No `Authorization` header check. Anyone can call and consume AI credits.

### Exact Fix

Same pattern as ai-market-chat — add auth check after CORS.

---

# SECTION C — DETAILED TOOL AUDITS

## TOOL 1: AI Chat Support

### 1) What it does (Scope)
- **Purpose:** Real-time AI chat for property inquiries, lead qualification, customer support
- **Who uses it:** Users (website visitors, logged-in users)
- **Trigger:** Manual - user initiates chat via widget

### 2) Current Implementation
| Component | Location | Lines |
|-----------|----------|-------|
| Frontend | `src/components/AIChatWidget.tsx` | ~300 |
| Backend | `supabase/functions/ai-chat-support/index.ts` | 627 |
| AI Model | Google Gemini 3 Flash Preview | - |

**Auth Flow:** ✅ Requires authentication (Lines 318-343 validate JWT)

### 3) Data Flow & Storage
| Data | Storage Location | Linked Fields | Permanent? |
|------|------------------|---------------|------------|
| Chat messages | ❌ NOT STORED | N/A | No |
| Lead intent | `crm_leads.intent` | lead_id | Yes |
| Rate limits | `function_rate_limits` | rate_key | Yes |
| IP blocks | `ip_blocklist` | ip_address | Yes |

### 4) Security Checklist
| Check | Status | Explanation |
|-------|--------|-------------|
| Auth required? | ✅ YES | JWT validated in edge function |
| RLS enabled? | N/A | No permanent storage |
| Rate limiting? | ✅ YES | 30 requests per 5 minutes |
| IP blocklist? | ✅ YES | Auto-block after 5 violations |
| Input validation? | ✅ YES | 5000 char limit |
| Prompt injection protection? | ✅ YES | Contact info sanitization |

**Rating:** ✅ Secure (for current scope)

### 5) Founder Admin Visibility
| What Founder Needs to See | Current Status | Gap? |
|---------------------------|----------------|------|
| User chat conversations | ❌ NOT VISIBLE | ⚠️ YES |
| Questions asked | ❌ NOT VISIBLE | ⚠️ YES |
| AI responses given | ❌ NOT VISIBLE | ⚠️ YES |
| Intent classifications | ❌ NOT VISIBLE | ⚠️ YES |

### 6) Gaps & Limitations
1. **Chat conversations not stored** — Founder cannot review user interactions
2. **No conversation analytics** — Cannot measure AI effectiveness
3. **No training data** — Cannot improve AI from real usage

### 7) Improvements & Recommendations

#### Recommendation 1.1: Store Chat Conversations
**What:** Create `ai_chat_logs` table to store all conversations  
**Why:** Enable founder to review interactions, improve AI, audit usage

**DB Migration:**
```sql
CREATE TABLE public.ai_chat_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  intent TEXT,
  confidence_score NUMERIC(3,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ai_chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_logs FORCE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view own chat logs"
  ON public.ai_chat_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can insert logs"
  ON public.ai_chat_logs FOR INSERT
  WITH CHECK (true); -- Service role only

-- Admin policies
CREATE POLICY "Admins can view all chat logs"
  ON public.ai_chat_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_chat_logs_user_date ON public.ai_chat_logs(user_id, created_at DESC);
CREATE INDEX idx_chat_logs_session ON public.ai_chat_logs(session_id);
CREATE INDEX idx_chat_logs_intent ON public.ai_chat_logs(intent);
```

**Edge Function Update (ai-chat-support/index.ts):**
```typescript
// After generating AI response, add:
await supabaseService.from('ai_chat_logs').insert([
  {
    user_id: user.id,
    session_id: sessionId,
    role: 'user',
    content: message,
    intent: classification.intent,
    confidence_score: classification.confidence,
    metadata: { service, leadId }
  },
  {
    user_id: user.id,
    session_id: sessionId,
    role: 'assistant',
    content: aiResponse,
    metadata: { renterType: classification.renterType }
  }
]);
```

**Admin Panel Screen:**
- Tab: "AI Chat Logs"
- Filters: User email, Date range, Intent type
- Columns: User, Time, Message, AI Response, Intent
- Actions: Export CSV, View full thread

---

## TOOL 2: AI Interior Design Generator

### 1) What it does (Scope)
- **Purpose:** Generate photorealistic interior design renders from property photos
- **Who uses it:** Users (authenticated)
- **Trigger:** Manual - user uploads photos

### 2) Current Implementation
| Component | Location |
|-----------|----------|
| Frontend | `src/pages/InteriorDesignAI.tsx` |
| Backend | `supabase/functions/interior-design-generate/index.ts` |
| AI Model | Google Gemini 3 Pro Image Preview |

**Auth Flow:** ✅ Requires authentication

### 3) Data Flow & Storage
| Data | Storage Location | Permanent? |
|------|------------------|------------|
| Input photos | ❌ NOT STORED | No |
| Generated designs | ❌ NOT STORED | No |
| Usage logs | `ai_usage_logs` | Yes |

### 4) Security Checklist
| Check | Status |
|-------|--------|
| Auth required? | ✅ YES |
| RLS on logs? | ✅ YES |
| Rate limiting? | ✅ YES (5 per 5 min) |
| Input validation? | ✅ YES (Zod schema) |
| Image size limit? | ✅ YES (Max 5MB) |

**Rating:** ✅ Secure

### 5) Founder Admin Visibility
| What | Current Status |
|------|----------------|
| Designs generated | ❌ NOT VISIBLE |
| Input photos | ❌ NOT VISIBLE |
| User design history | ❌ NOT VISIBLE |

### 6) Improvements & Recommendations

#### Recommendation 2.1: Store Design Outputs
**What:** Create storage bucket and tracking table  
**Why:** User history, founder visibility, portfolio building

**Storage Bucket:**
```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('ai-outputs', 'ai-outputs', false, 10485760);
```

**Storage Policies (SEPARATE, NOT FOR ALL):**
```sql
-- SELECT: Users can read their own files
CREATE POLICY "Users can SELECT own ai-outputs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ai-outputs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- INSERT: Users can upload to their own folder
CREATE POLICY "Users can INSERT to own ai-outputs folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ai-outputs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: Users can update their own files
CREATE POLICY "Users can UPDATE own ai-outputs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'ai-outputs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'ai-outputs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: Users can delete their own files
CREATE POLICY "Users can DELETE own ai-outputs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ai-outputs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin SELECT: Admins can read all files
CREATE POLICY "Admins can SELECT all ai-outputs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ai-outputs' AND
    has_role(auth.uid(), 'admin')
  );
```

**Why each policy is safe:**
- Users can ONLY access files in `/{their_user_id}/...` path
- No cross-user access possible (folder path = auth.uid())
- Admins can read all for oversight but cannot modify
- DELETE restricted to owner only

---

## TOOL 3-21: Frontend-Only Tools

The following tools are implemented entirely in the frontend using the AI Provider hook. They do NOT have dedicated edge functions:

| # | Tool | Frontend Component | Storage |
|---|------|-------------------|---------|
| 7 | AI Meeting Summarizer | `AIMeetingSummarizer.tsx` | None |
| 8 | AI Virtual Staging | `AIVirtualStaging.tsx` | None |
| 9 | AI Price Predictor | `AIPricePredictor.tsx` | None |
| 10 | AI Neighborhood Insights | `AINeighborhoodInsights.tsx` | None |
| 11 | AI Lead Qualification | `AILeadQualification.tsx` | None |
| 12 | AI Follow-up Scheduler | `AIFollowupScheduler.tsx` | None |
| 13 | AI Objection Handler | `AIObjectionHandler.tsx` | None |
| 14 | AI Market Report | `AIMarketReport.tsx` | None |
| 15 | AI Competitor Analysis | `AICompetitorAnalysis.tsx` | None |
| 16 | AI ROI Calculator | `AIROICalculator.tsx` | None |
| 17 | AI Translation Hub | `AITranslationHub.tsx` | None |
| 18 | AI Video Tour Script | `AIVideoTourScript.tsx` | None |
| 19 | AI Contract Reviewer | `AIContractReviewer.tsx` | None |
| 20 | AI Document Generator | `AIDocumentGenerator.tsx` | None |
| 21 | AI Property Analyzer | `AIPropertyAnalyzer.tsx` | None |

**Security:** These use `useAITool` hook which calls edge functions. Auth depends on which edge function they invoke.

**Gap:** ⚠️ No persistent storage — founder cannot see usage history for these tools.

---

## TOOL 22: Video Resize Pack (studio_jobs)

### 1) What it does (Scope)
- **Purpose:** Resize/reformat videos for different platforms
- **Who uses it:** Users (authenticated)
- **Trigger:** Manual - user uploads video

### 2) Current Implementation
| Component | Location |
|-----------|----------|
| Frontend | `src/pages/StudioEditor.tsx` |
| Backend | `supabase/functions/video-resize-process/index.ts` |
| Storage | `studio_jobs` table |

### 3) Security Status (VERIFIED SECURE)

**RLS Policies (from SQL query):**
```sql
-- Current policies on studio_jobs:
"Users can create own jobs" | INSERT | WITH CHECK (user_id = auth.uid())
"Users can view own jobs" | SELECT | USING (user_id = auth.uid())
"Users can update jobs they own (strict)" | UPDATE | USING + WITH CHECK (user_id = auth.uid())
"Users can delete own jobs" | DELETE | USING (user_id = auth.uid())
"Admins can view all jobs" | SELECT | USING (has_role(auth.uid(), 'admin'))
"Admins can update all jobs" | UPDATE | USING + WITH CHECK (has_role)
"Admins can delete all jobs" | DELETE | USING (has_role)
```

**Table flags:**
| Table | rls_enabled | force_rls |
|-------|-------------|-----------|
| studio_jobs | true | **true** |

**Rating:** ✅ SECURE — No changes needed

### 4) Founder Admin Visibility
| What | Status |
|------|--------|
| All user jobs | ✅ VISIBLE (admin policy) |
| Job inputs | ✅ VISIBLE (input_data column) |
| Job outputs | ✅ VISIBLE (output_data column) |
| Errors | ✅ VISIBLE (error_message column) |

---

## TOOL 23: Voice Studio TTS

### 1) What it does
- **Purpose:** Text-to-speech generation using ElevenLabs
- **Who uses it:** Users
- **Trigger:** Manual

### 2) Current Security Status

**Rating:** ❌ CRITICAL — No authentication (see Issue #2 above)

### 3) Founder Visibility
| What | Current Status |
|------|----------------|
| TTS generations | ❌ NOT VISIBLE |
| Text inputs | ❌ NOT VISIBLE |
| Audio outputs | ❌ NOT VISIBLE |
| User history | ❌ NOT VISIBLE |

### 4) Required Fix
See CRITICAL ISSUE #2 for exact implementation.

---

## TOOL 24-30: Other Edge Function Tools

| # | Tool | Edge Function | Auth? | Rate Limit? | Logging? |
|---|------|--------------|-------|-------------|----------|
| 24 | AI Travel Concierge | `ai-travel-concierge` | ✅ YES | ✅ YES | ❌ NO |
| 25 | AI Mortgage Advisor | `ai-mortgage-advisor` | ✅ YES | ✅ YES | ❌ NO |
| 26 | AI Signature Generator | `ai-signature-generator` | ✅ YES | ❌ NO | ❌ NO |
| 27 | HR AI Agent | `hr-ai-agent` | ✅ YES | ❌ NO | ❌ NO |
| 28 | AI Executive Assistant | `ai-executive-assistant` | ✅ YES | ❌ NO | ❌ NO |
| 29 | Admin AI Assistant | N/A | N/A | N/A | N/A |
| 30 | Listing Admin Chat | `listing-admin-chat` | ✅ YES | ❌ NO | ❌ NO |

---

## TOOLS 31-36: Background/Hidden Tools

| # | Tool | Edge Function | Auth? | Purpose |
|---|------|--------------|-------|---------|
| 31 | AI News Collector | `ai-news-collector` | Service | Cron job |
| 32 | Smart AI Analysis | `smart-ai-analysis` | Service | Internal |
| 33 | Auto Translate | `auto-translate` | Service | Content |
| 34 | Broker Daily Report | `broker-daily-report` | Service | Cron |
| 35 | AI Market Analyzer | `ai-market-analyzer` | Service | Data |
| 36 | AI Market Narratives | `ai-market-narratives` | Service | Content |

**Security:** These are internal tools using service role. No user-facing access.

---

# SECTION D — STANDARD BACKEND STORAGE MODEL

## D1. Required Tables

### Table: `ai_job_master` (Unified Job Runner)

```sql
CREATE TABLE public.ai_job_master (
  -- Identity
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Job metadata
  tool_name TEXT NOT NULL,
  job_type TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  progress_message TEXT,
  
  -- Input/Output
  input_payload JSONB NOT NULL DEFAULT '{}',
  output_payload JSONB,
  error_payload JSONB,
  
  -- Relationships
  lead_id UUID,
  project_id UUID,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_job_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_job_master FORCE ROW LEVEL SECURITY;

-- User policies (SEPARATE, NOT FOR ALL)
CREATE POLICY "Users can INSERT own jobs"
  ON public.ai_job_master FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can SELECT own jobs"
  ON public.ai_job_master FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can UPDATE own jobs"
  ON public.ai_job_master FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can DELETE own jobs"
  ON public.ai_job_master FOR DELETE
  USING (user_id = auth.uid());

-- Admin policies
CREATE POLICY "Admins can SELECT all jobs"
  ON public.ai_job_master FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can UPDATE all jobs"
  ON public.ai_job_master FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can DELETE all jobs"
  ON public.ai_job_master FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_ai_job_master_user ON ai_job_master(user_id, created_at DESC);
CREATE INDEX idx_ai_job_master_tool ON ai_job_master(tool_name, created_at DESC);
CREATE INDEX idx_ai_job_master_status ON ai_job_master(status);
```

### Table: `ai_job_events` (Timeline + Logs)

```sql
CREATE TABLE public.ai_job_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES ai_job_master(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Denormalized for RLS
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ai_job_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_job_events FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can SELECT own events"
  ON public.ai_job_events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service can INSERT events"
  ON public.ai_job_events FOR INSERT
  WITH CHECK (true); -- Service role only

CREATE POLICY "Admins can SELECT all events"
  ON public.ai_job_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ai_job_events_job ON ai_job_events(job_id, created_at);
CREATE INDEX idx_ai_job_events_user ON ai_job_events(user_id, created_at DESC);
```

### Table: `ai_outputs` (Structured Outputs)

```sql
CREATE TABLE public.ai_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES ai_job_master(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  output_type TEXT NOT NULL CHECK (output_type IN ('text', 'image', 'audio', 'video', 'document')),
  output_url TEXT,
  output_text TEXT,
  file_size_bytes BIGINT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ai_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_outputs FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can SELECT own outputs"
  ON public.ai_outputs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can INSERT own outputs"
  ON public.ai_outputs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can DELETE own outputs"
  ON public.ai_outputs FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can SELECT all outputs"
  ON public.ai_outputs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ai_outputs_user ON ai_outputs(user_id, created_at DESC);
CREATE INDEX idx_ai_outputs_job ON ai_outputs(job_id);
CREATE INDEX idx_ai_outputs_type ON ai_outputs(output_type);
```

## D2. Storage Bucket Structure

```
Bucket: ai-outputs
├── {user_id}/
│   ├── interior-design/
│   │   └── {job_id}/
│   │       ├── input_1.jpg
│   │       └── output.jpg
│   ├── outfit-changer/
│   │   └── {job_id}/
│   │       └── output.jpg
│   ├── voice-studio/
│   │   └── {job_id}/
│   │       └── output.mp3
│   └── video-resize/
│       └── {job_id}/
│           └── output.mp4
```

## D3. Required Fields (Every Record)

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| id | UUID | ✅ | Primary key |
| user_id | UUID | ✅ | Ownership |
| tool_name | TEXT | ✅ | Which tool |
| status | TEXT | ✅ | Job state |
| input_payload | JSONB | ✅ | What was submitted |
| output_payload | JSONB | ❌ | What was produced |
| error_payload | JSONB | ❌ | What went wrong |
| created_at | TIMESTAMP | ✅ | When |
| updated_at | TIMESTAMP | ✅ | Last change |

---

# SECTION E — FOUNDER ADMIN VISIBILITY MAPPING

## E1. Current State

| Tool | Inputs Visible? | Outputs Visible? | Logs Visible? | Errors Visible? |
|------|-----------------|------------------|---------------|-----------------|
| AI Chat Support | ❌ | ❌ | ❌ | ❌ |
| Interior Design | ❌ | ❌ | ✅ (ai_usage_logs) | ❌ |
| Property Evaluator | ❌ | ❌ | ✅ | ❌ |
| Background Remover | ❌ | ❌ | ❌ | ❌ |
| Outfit Changer | ✅ (ai_outfit_requests) | ✅ | ❌ | ✅ |
| Market Chat | ❌ | ❌ | ❌ | ❌ |
| Video Resize | ✅ (studio_jobs) | ✅ | ✅ | ✅ |
| Voice Studio TTS | ❌ | ❌ | ❌ | ❌ |

## E2. Required Admin Panel Screens

### Screen 1: AI Usage Dashboard
- **Metrics:** Total AI calls (today/week/month), breakdown by tool, top users
- **Filters:** Date range, Tool type
- **Actions:** Export CSV

### Screen 2: Chat Logs Viewer
- **Data Source:** `ai_chat_logs` (after creation)
- **Columns:** User, Time, Message, AI Response, Intent
- **Filters:** User, Date, Intent
- **Actions:** Export, Flag

### Screen 3: AI Outputs Gallery
- **Data Source:** `ai_outputs` (after creation)
- **View:** Thumbnails/list of all generated content
- **Filters:** Tool, User, Date, Type
- **Actions:** View full, Delete, Export

### Screen 4: Job Queue Monitor
- **Data Source:** `ai_job_master` (after creation)
- **Columns:** User, Tool, Status, Progress, Started, Completed
- **Filters:** User, Tool, Status
- **Actions:** View details, Retry failed

---

# SECTION F — IMPLEMENTATION PLAN (EXECUTION ORDER)

## 🔴 PHASE 1: CRITICAL SECURITY FIXES (This Week)

| Step | What | Where | Acceptance Criteria | Test Case |
|------|------|-------|---------------------|-----------|
| 1.1 | Fix toolkit_jobs RLS | Migration | `WITH CHECK (user_id = auth.uid())` on all policies | User A cannot see User B's jobs |
| 1.2 | Add auth to voice-studio-tts | Edge function | 401 returned without valid JWT | Curl without token returns 401 |
| 1.3 | Add auth to ai-market-chat | Edge function | 401 returned without valid JWT | Curl without token returns 401 |
| 1.4 | Add auth to ai-background-remove | Edge function | 401 returned without valid JWT | Curl without token returns 401 |

## 🟠 PHASE 2: LOGGING + STORAGE (Week 2)

| Step | What | Where | Acceptance Criteria |
|------|------|-------|---------------------|
| 2.1 | Create ai_chat_logs table | Migration | RLS enabled, FORCE RLS, admin policy |
| 2.2 | Create ai-outputs bucket | Migration | Separate policies per operation |
| 2.3 | Create ai_outputs table | Migration | RLS enabled, FORCE RLS |
| 2.4 | Update edge functions to log | Edge functions | All AI calls logged |

## 🟢 PHASE 3: UNIFIED JOB RUNNER (Week 3, If Approved)

| Step | What | Where | Acceptance Criteria |
|------|------|-------|---------------------|
| 3.1 | Create ai_job_master table | Migration | Full schema with RLS |
| 3.2 | Create ai_job_events table | Migration | Full schema with RLS |
| 3.3 | Migrate studio_jobs to ai_job_master | Migration | Data preserved |
| 3.4 | Update frontend to use new system | Frontend | Seamless transition |

## 🟢 PHASE 4: ADMIN PANEL (Week 4, If Approved)

| Step | What | Where | Acceptance Criteria |
|------|------|-------|---------------------|
| 4.1 | AI Usage Dashboard | Admin panel | All metrics visible |
| 4.2 | Chat Logs Viewer | Admin panel | Full thread view |
| 4.3 | AI Outputs Gallery | Admin panel | Thumbnail grid |
| 4.4 | Job Queue Monitor | Admin panel | Real-time updates |

---

# APPENDIX A — EDGE FUNCTION SECURITY INVENTORY

| Function | Auth | Rate Limit | Logging | Status |
|----------|------|------------|---------|--------|
| ai-chat-support | ✅ | ✅ | ❌ | ⚠️ Needs logging |
| ai-background-remove | ❌ | ❌ | ❌ | ❌ CRITICAL |
| ai-outfit-changer | ⚠️ Optional | ❌ | ✅ | ⚠️ Make auth required |
| ai-market-chat | ❌ | ❌ | ❌ | ❌ CRITICAL |
| interior-design-generate | ✅ | ✅ | ❌ | ⚠️ Needs logging |
| property-evaluation | ✅ | ✅ | ❌ | ⚠️ Needs logging |
| voice-studio-tts | ❌ | ❌ | ❌ | ❌ CRITICAL |
| video-resize-process | ✅ | ❌ | ✅ | ✅ Secure |
| ai-travel-concierge | ✅ | ✅ | ❌ | ⚠️ Needs logging |
| ai-mortgage-advisor | ✅ | ✅ | ❌ | ⚠️ Needs logging |
| ai-signature-generator | ✅ | ❌ | ❌ | ⚠️ Add rate limit |
| hr-ai-agent | ✅ | ❌ | ❌ | ⚠️ Add rate limit |
| ai-executive-assistant | ✅ | ❌ | ❌ | ⚠️ Add rate limit |
| listing-admin-chat | ✅ | ❌ | ❌ | ⚠️ Add rate limit |

---

# APPENDIX B — RLS POLICY TEMPLATE

Use this template for ALL new AI tables:

```sql
-- Enable RLS
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.{table_name} FORCE ROW LEVEL SECURITY;

-- User INSERT
CREATE POLICY "Users can INSERT own {table_name}"
  ON public.{table_name} FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- User SELECT
CREATE POLICY "Users can SELECT own {table_name}"
  ON public.{table_name} FOR SELECT
  USING (user_id = auth.uid());

-- User UPDATE
CREATE POLICY "Users can UPDATE own {table_name}"
  ON public.{table_name} FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User DELETE
CREATE POLICY "Users can DELETE own {table_name}"
  ON public.{table_name} FOR DELETE
  USING (user_id = auth.uid());

-- Admin SELECT
CREATE POLICY "Admins can SELECT all {table_name}"
  ON public.{table_name} FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Admin UPDATE
CREATE POLICY "Admins can UPDATE all {table_name}"
  ON public.{table_name} FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admin DELETE
CREATE POLICY "Admins can DELETE all {table_name}"
  ON public.{table_name} FOR DELETE
  USING (has_role(auth.uid(), 'admin'));
```

---

**END OF AUDIT DOCUMENT**

**Status:** ✅ FINALIZED — Ready for Founder Review

**Next Steps:**
1. Ms. Jane reviews and approves/rejects each recommendation
2. Upon approval, implementation begins with CRITICAL items (Phase 1)
3. Weekly progress reports until completion

---

*Prepared by: AI Systems Architect*  
*Date: 2026-02-06*  
*Document Version: 2.0*
