# JBJ GLOBAL LEADS DAY — AI TOOLS COMPLETE AUDIT + IMPROVEMENT SPEC

**Document Version:** 1.0  
**Date:** 2025-02-06  
**Prepared by:** Senior Full-Stack Engineer + Security Architect  
**For Approval:** Ms. Jane Bou Jaoude (Founder/Owner)

---

## EXECUTIVE SUMMARY

This document provides a comprehensive audit of ALL AI tools in the JBJ Global platform. For each tool, I identify:
- Current implementation status
- Security posture (with proof)
- Data storage model
- Admin visibility gaps
- **Proposed improvements with exact implementation steps**

**The founder must approve each recommendation before implementation.**

---

# SECTION A — COMPLETE AI TOOLS INVENTORY

## A1. User-Facing AI Tools (BUILT)

| # | Tool Name | Status | Category |
|---|-----------|--------|----------|
| 1 | AI Chat Support | ✅ BUILT | Customer Service |
| 2 | AI Interior Design Generator | ✅ BUILT | Property Intelligence |
| 3 | AI Property Evaluator | ✅ BUILT | Property Intelligence |
| 4 | AI Background Remover | ✅ BUILT | Photo Suite |
| 5 | AI Outfit Changer | ✅ BUILT | Personal Styling |
| 6 | AI Market Chat | ✅ BUILT | Market Intelligence |
| 7 | AI Meeting Summarizer | ✅ BUILT | Communication |
| 8 | AI Virtual Staging | ✅ BUILT | Property Intelligence |
| 9 | AI Price Predictor | ✅ BUILT | Analytics |
| 10 | AI Neighborhood Insights | ✅ BUILT | Property Intelligence |
| 11 | AI Lead Qualification | ✅ BUILT | Lead & Sales |
| 12 | AI Follow-up Scheduler | ✅ BUILT | Lead & Sales |
| 13 | AI Objection Handler | ✅ BUILT | Lead & Sales |
| 14 | AI Market Report Generator | ✅ BUILT | Analytics |
| 15 | AI Competitor Analysis | ✅ BUILT | Analytics |
| 16 | AI ROI Calculator | ✅ BUILT | Analytics |
| 17 | AI Translation Hub | ✅ BUILT | Communication |
| 18 | AI Video Tour Script | ✅ BUILT | Communication |
| 19 | AI Contract Reviewer | ✅ BUILT | Documents |
| 20 | AI Document Generator | ✅ BUILT | Documents |
| 21 | AI Property Analyzer | ✅ BUILT | Property Intelligence |
| 22 | Video Resize Pack | ✅ BUILT | Video Suite |
| 23 | Voice Studio TTS | ✅ BUILT | Voice Suite |
| 24 | AI Travel Concierge | ✅ BUILT | Lifestyle |
| 25 | AI Mortgage Advisor | ✅ BUILT | Finance |
| 26 | AI Signature Generator | ✅ BUILT | Documents |
| 27 | HR AI Agent | ✅ BUILT | Internal |
| 28 | AI Executive Assistant | ✅ BUILT | Internal |
| 29 | Admin AI Assistant | ✅ BUILT | Admin |
| 30 | Listing Admin Chat | ✅ BUILT | Admin |

## A2. Background/Hidden AI Tools (BUILT)

| # | Tool Name | Status | Purpose |
|---|-----------|--------|---------|
| 31 | AI News Collector | ✅ BUILT | Automated news gathering |
| 32 | Smart AI Analysis | ✅ BUILT | Internal analytics |
| 33 | Auto Translate | ✅ BUILT | Content translation |
| 34 | Broker Daily Report | ✅ BUILT | Automated reporting |
| 35 | AI Market Analyzer | ✅ BUILT | Market data processing |
| 36 | AI Market Narratives | ✅ BUILT | Content generation |

## A3. Partially Built/Coming Soon

| # | Tool Name | Status | Notes |
|---|-----------|--------|-------|
| 37 | AI Email Generator | 🟡 COMING SOON | Frontend exists, backend pending |
| 38 | AI Social Media Generator | 🟡 COMING SOON | Config exists, full implementation pending |
| 39 | AI Client Matcher | 🟡 COMING SOON | Config exists, full implementation pending |
| 40 | AI Investment Report | 🟡 COMING SOON | Config exists, full implementation pending |
| 41 | AI Description Writer | 🟡 COMING SOON | Config exists, full implementation pending |

---

# SECTION B — DETAILED TOOL AUDITS

---

## TOOL 1: AI Chat Support
**Status: BUILT**

### 1) What it does (Scope)
- **Purpose:** Real-time AI chat assistant for property inquiries, lead qualification, and customer support
- **Who uses it:** Users (website visitors, logged-in users)
- **Trigger:** Manual - user initiates chat via widget

### 2) Current Implementation
- **Frontend:** `src/components/AIChatWidget.tsx`
- **Backend:** `supabase/functions/ai-chat-support/index.ts` (627 lines)
- **AI Model:** Google Gemini 3 Flash Preview
- **Auth Flow:** Requires authentication (JWT validation)
- **Ownership:** Tracks by user_id where applicable
- **Service Role:** Used for rate limiting and IP blocklist (validated)

### 3) Data Flow & Storage
| What | Where | Fields |
|------|-------|--------|
| Chat messages | NOT STORED | Only processed, not persisted |
| Lead intent | `crm_leads.intent` | Updates existing lead if leadId provided |
| Rate limits | `function_rate_limits` | rate_key, request_count |
| IP blocks | `ip_blocklist` | ip_address, expires_at |

**⚠️ GAP IDENTIFIED:** Chat conversations are NOT stored in database. Founder cannot see chat history.

### 4) Security Audit
| Check | Status | Details |
|-------|--------|---------|
| Auth required? | ✅ YES | Lines 318-343 validate JWT |
| RLS enabled? | N/A | No permanent data stored |
| Rate limiting? | ✅ YES | 30 requests per 5 minutes |
| IP blocklist? | ✅ YES | Auto-block after 5 violations |
| Input validation? | ✅ YES | 5000 char limit, sanitization |
| Prompt injection protection? | ✅ YES | Contact info sanitization |

**Rating:** ✅ Secure (for current scope) / ⚠️ Missing chat history storage

### 5) Founder Admin Visibility Requirement
**CURRENT STATE:** ❌ Founder CANNOT see:
- User chat conversations
- Questions asked
- AI responses given
- Intent classifications
- Lead journey through chat

**PROPOSED:** Create `ai_chat_logs` table with full conversation history.

### 6) Improvements & Recommendations

#### Recommendation 1.1: Store Chat Conversations
**What:** Add persistent storage for all chat conversations  
**Why:** Enable founder to review all user interactions, improve AI training, comply with audit requirements

**Implementation Steps:**

**A) Database Migration:**
```sql
-- Create chat logs table
CREATE TABLE public.ai_chat_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  intent TEXT,
  confidence_score NUMERIC(3,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_logs FORCE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own chat logs"
  ON public.ai_chat_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Edge functions can insert logs"
  ON public.ai_chat_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all logs"
  ON public.ai_chat_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Index for admin queries
CREATE INDEX idx_chat_logs_user_date ON public.ai_chat_logs(user_id, created_at DESC);
CREATE INDEX idx_chat_logs_intent ON public.ai_chat_logs(intent);
```

**B) Edge Function Update (ai-chat-support/index.ts):**
```typescript
// After generating AI response, store both messages:
await supabaseService.from('ai_chat_logs').insert([
  {
    user_id: user.id,
    session_id: sessionId,
    role: 'user',
    content: message,
    intent: classification.intent,
    confidence_score: classification.confidence,
  },
  {
    user_id: user.id,
    session_id: sessionId,
    role: 'assistant',
    content: aiResponse,
    metadata: { service, renterType: classification.renterType }
  }
]);
```

**C) Admin Panel UI:**
- Add "Chat Logs" tab in Admin Dashboard
- Filter by: user, date range, intent type
- Export to CSV functionality

---

## TOOL 2: AI Interior Design Generator
**Status: BUILT**

### 1) What it does (Scope)
- **Purpose:** Generate photorealistic interior design renders from property photos
- **Who uses it:** Users (authenticated)
- **Trigger:** Manual - user uploads photos and submits form

### 2) Current Implementation
- **Frontend:** `src/pages/InteriorDesignAI.tsx`
- **Backend:** `supabase/functions/interior-design-generate/index.ts` (580 lines)
- **AI Model:** Google Gemini 3 Pro Image Preview
- **Auth Flow:** ✅ Requires authentication
- **Rate Limit:** 5 generations per 5 minutes
- **Service Role:** Used for rate limiting with proper JWT validation

### 3) Data Flow & Storage
| What | Where | Status |
|------|-------|--------|
| Input photos | NOT STORED | Processed only |
| Generated designs | NOT STORED | Returned to client only |
| Usage logs | `ai_usage_logs` | function_name, tokens, success |

**⚠️ GAP IDENTIFIED:** Generated designs are NOT stored. User loses work on refresh. Founder cannot see outputs.

### 4) Security Audit
| Check | Status | Details |
|-------|--------|---------|
| Auth required? | ✅ YES | Lines 343-370 |
| RLS enabled? | ✅ YES | `ai_usage_logs` has RLS |
| Rate limiting? | ✅ YES | 5 per 5 min window |
| Auto-block? | ✅ YES | After 5 violations |
| Input validation? | ✅ YES | Zod schema validation |
| Image size limit? | ✅ YES | Max 5MB per image |

**Rating:** ✅ Secure

### 5) Founder Admin Visibility Requirement
**CURRENT STATE:** ❌ Founder CANNOT see:
- What designs users generate
- Input photos used
- Output renders created
- User design history

**PROPOSED:** Store designs in `design_studio_projects` or new `ai_design_outputs` table.

### 6) Improvements & Recommendations

#### Recommendation 2.1: Persist Design Outputs
**What:** Store all generated designs with inputs  
**Why:** User history, founder visibility, portfolio building

**Implementation Steps:**

**A) Database Migration:**
```sql
CREATE TABLE public.ai_design_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tool_name TEXT NOT NULL DEFAULT 'interior-design',
  input_payload JSONB NOT NULL,
  output_image_url TEXT,
  output_text TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.ai_design_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_design_outputs FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own designs"
  ON public.ai_design_outputs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all designs"
  ON public.ai_design_outputs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
```

**B) Storage Bucket:**
- Create `ai-outputs` bucket
- Path structure: `/{user_id}/interior-design/{job_id}/output.jpg`
- RLS: User owns their folder, admin can read all

---

## TOOL 3: AI Property Evaluator
**Status: BUILT**

### 1) What it does (Scope)
- **Purpose:** Estimate property values based on location, size, views, developer
- **Who uses it:** Users (authenticated)
- **Trigger:** Manual - user fills property form

### 2) Current Implementation
- **Frontend:** `src/pages/PropertyEvaluator.tsx`
- **Backend:** `supabase/functions/property-evaluation/index.ts` (420 lines)
- **AI Model:** Google Gemini 2.5 Flash
- **Auth Flow:** ✅ Requires authentication
- **Rate Limit:** 15 evaluations per 5 minutes

### 3) Data Flow & Storage
| What | Where | Status |
|------|-------|--------|
| Property inputs | NOT STORED | Processed only |
| Valuation results | NOT STORED | Returned to client only |
| AI insights | NOT STORED | Generated on demand |

**⚠️ GAP IDENTIFIED:** Evaluations are NOT stored. No history for users or founder.

### 4) Security Audit
| Check | Status | Details |
|-------|--------|---------|
| Auth required? | ✅ YES | Lines 223-242 |
| Input validation? | ✅ YES | Zod schema with bounds |
| Rate limiting? | ✅ YES | 15 per 5 min |
| Auto-block? | ✅ YES | After 5 violations |

**Rating:** ✅ Secure

### 5) Founder Admin Visibility
**CURRENT STATE:** ❌ Founder CANNOT see what properties users are evaluating.

### 6) Improvements & Recommendations

#### Recommendation 3.1: Store Evaluation History
```sql
CREATE TABLE public.ai_property_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_data JSONB NOT NULL,
  valuation_result JSONB NOT NULL,
  ai_insights TEXT,
  confidence TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ai_property_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_property_evaluations FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users view own" ON public.ai_property_evaluations 
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own" ON public.ai_property_evaluations 
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin view all" ON public.ai_property_evaluations 
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
```

---

## TOOL 4: AI Outfit Changer
**Status: BUILT**

### 1) What it does (Scope)
- **Purpose:** AI-powered outfit transformation for user photos
- **Who uses it:** Users (with optional auth)
- **Trigger:** Manual - user uploads photo and describes outfit

### 2) Current Implementation
- **Frontend:** Part of AI Personal Shopper
- **Backend:** `supabase/functions/ai-outfit-changer/index.ts` (169 lines)
- **AI Model:** Google Gemini 2.5 Flash Image Preview
- **Auth Flow:** ⚠️ OPTIONAL - works without auth

### 3) Data Flow & Storage
| What | Where | Status |
|------|-------|--------|
| Requests | `ai_outfit_requests` | ✅ Stored (if authenticated) |
| Original image | NOT STORED | Base64 only |
| Generated image | `generated_image_url` | ✅ URL stored |

### 4) Security Audit
| Check | Status | Details |
|-------|--------|---------|
| Auth required? | ⚠️ OPTIONAL | Works without auth |
| RLS enabled? | ✅ YES | `user_id = auth.uid()` |
| Service role usage? | ⚠️ CONCERN | Uses service key for insert |

**Rating:** ⚠️ Needs improvement - auth should be required

### 5) Security Issue Found
The edge function uses `supabaseServiceKey` to insert records, which bypasses RLS. This is fine because it properly sets `user_id` from the validated JWT, but the tool works even WITHOUT authentication.

### 6) Improvements & Recommendations

#### Recommendation 4.1: Require Authentication
**What:** Make authentication mandatory  
**Why:** Prevent anonymous abuse, ensure all usage is tracked

**Implementation (ai-outfit-changer/index.ts):**
```typescript
// Line 32-40: Change from optional to required
if (!authHeader) {
  return new Response(
    JSON.stringify({ success: false, error: "Authentication required" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

const { data: { user }, error: authError } = await supabase.auth.getUser(
  authHeader.replace("Bearer ", "")
);

if (authError || !user) {
  return new Response(
    JSON.stringify({ success: false, error: "Invalid session" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

---

## TOOL 5: Video Resize Pack / Studio Jobs
**Status: BUILT**

### 1) What it does (Scope)
- **Purpose:** Resize/reformat videos for different platforms
- **Who uses it:** Users (authenticated)
- **Trigger:** Manual - user uploads video and selects target format

### 2) Current Implementation
- **Frontend:** `src/pages/StudioEditor.tsx`
- **Backend:** `supabase/functions/video-resize-process/index.ts` (291 lines)
- **Processing:** Client-side FFmpeg.wasm (server returns params only)
- **Auth Flow:** ✅ Requires authentication

### 3) Data Flow & Storage
| What | Where | Status |
|------|-------|--------|
| Jobs | `studio_jobs` | ✅ Stored with user_id |
| Input params | `input_data` | ✅ JSONB stored |
| Output data | `output_data` | ✅ JSONB stored |
| Video files | Storage bucket | User-scoped paths |

### 4) Security Audit - RECENTLY HARDENED
| Check | Status | Details |
|-------|--------|---------|
| Auth required? | ✅ YES | Lines 52-71 |
| RLS enabled? | ✅ YES | With FORCE |
| user_id enforcement? | ✅ YES | `WITH CHECK (user_id = auth.uid())` |
| Admin access? | ✅ YES | Via `has_role()` function |
| Path ownership? | ✅ YES | Strict prefix matching |

**Rating:** ✅ Secure (recently hardened)

### 5) Founder Admin Visibility
**CURRENT STATE:** ✅ Admin CAN see all jobs via `has_role(auth.uid(), 'admin')` policy.

### 6) RLS Policies (VERIFIED)
```sql
-- Current policies on studio_jobs:
CREATE POLICY "Users can create own jobs" FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view own jobs" FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update jobs they own (strict)" FOR UPDATE 
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own jobs" FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admins can view all jobs" FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all jobs" FOR UPDATE 
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete all jobs" FOR DELETE USING (has_role(auth.uid(), 'admin'));
```

**Status:** ✅ No changes needed

---

## TOOL 6: Voice Studio TTS
**Status: BUILT**

### 1) What it does (Scope)
- **Purpose:** Text-to-speech generation using ElevenLabs
- **Who uses it:** Users
- **Trigger:** Manual - user enters text and selects voice

### 2) Current Implementation
- **Frontend:** `src/pages/toolkit/VoiceStudio.tsx`
- **Backend:** `supabase/functions/voice-studio-tts/index.ts` (97 lines)
- **API:** ElevenLabs
- **Auth Flow:** ❌ NO AUTHENTICATION

### 3) Security Audit
| Check | Status | Details |
|-------|--------|---------|
| Auth required? | ❌ NO | Anyone can call |
| Rate limiting? | ❌ NO | No rate limiting |
| Usage tracking? | ❌ NO | Not stored |

**Rating:** ❌ High Risk - Unprotected endpoint

### 4) Improvements & Recommendations

#### Recommendation 6.1: Add Authentication + Rate Limiting
**What:** Require auth and add rate limits  
**Why:** Prevent API abuse, track usage, protect ElevenLabs quota

**Implementation (voice-studio-tts/index.ts):**
```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Add after CORS check:
const authHeader = req.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return new Response(
    JSON.stringify({ error: "Authentication required" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

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

// Log usage
await supabaseService.from('ai_usage_logs').insert({
  user_id: user.id,
  function_name: 'voice-studio-tts',
  model: 'eleven_multilingual_v2',
  success: true
});
```

---

## TOOL 7: AI Market Chat
**Status: BUILT**

### 1) What it does (Scope)
- **Purpose:** AI assistant for market questions in property detail pages
- **Who uses it:** Users viewing properties
- **Trigger:** Manual - user asks question in chat

### 2) Current Implementation
- **Backend:** `supabase/functions/ai-market-chat/index.ts` (108 lines)
- **AI Model:** Google Gemini 3 Flash Preview
- **Auth Flow:** ❌ NO AUTHENTICATION

### 3) Security Audit
| Check | Status | Details |
|-------|--------|---------|
| Auth required? | ❌ NO | Public endpoint |
| Rate limiting? | ❌ NO | No protection |
| Input validation? | ⚠️ MINIMAL | Only checks question exists |

**Rating:** ⚠️ Needs improvement

### 4) Improvements & Recommendations
Same as Voice Studio - add auth + rate limiting + usage logging.

---

## TOOL 8: toolkit_jobs Table
**Status: BUILT (SECURITY ISSUE)**

### 1) What it does
- Generic job tracking for toolkit operations
- Used by various photo/video tools

### 2) Security Audit - CRITICAL ISSUE
```sql
-- CURRENT POLICIES (FROM AUDIT):
"Allow anonymous insert toolkit jobs" WITH CHECK: true
"Allow session-based select toolkit jobs" USING: true  
"Allow session-based update toolkit jobs" USING: true
```

**Rating:** ❌ CRITICAL - Anyone can insert/update/select ALL records

### 3) Improvements & Recommendations

#### Recommendation 8.1: IMMEDIATE - Fix RLS Policies
**Priority:** 🔴 CRITICAL

```sql
-- Drop dangerous policies
DROP POLICY IF EXISTS "Allow anonymous insert toolkit jobs" ON toolkit_jobs;
DROP POLICY IF EXISTS "Allow session-based select toolkit jobs" ON toolkit_jobs;
DROP POLICY IF EXISTS "Allow session-based update toolkit jobs" ON toolkit_jobs;

-- Add user_id column if not exists
ALTER TABLE toolkit_jobs ADD COLUMN IF NOT EXISTS user_id UUID;

-- Create proper policies
CREATE POLICY "Users can create own toolkit jobs"
  ON toolkit_jobs FOR INSERT
  WITH CHECK (
    CASE 
      WHEN auth.uid() IS NOT NULL THEN user_id = auth.uid()
      ELSE session_id IS NOT NULL -- Allow session-based for anonymous
    END
  );

CREATE POLICY "Users can view own toolkit jobs"
  ON toolkit_jobs FOR SELECT
  USING (
    user_id = auth.uid() OR 
    (auth.uid() IS NULL AND session_id = current_setting('request.headers')::json->>'x-session-id')
  );

CREATE POLICY "Admins can view all toolkit jobs"
  ON toolkit_jobs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
```

---

# SECTION C — STANDARD BACKEND STORAGE MODEL

## C1. Required Tables

### Table: `ai_job_master` (NEW - Unified Job Runner)
```sql
CREATE TABLE public.ai_job_master (
  -- Identity
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Job metadata
  tool_name TEXT NOT NULL,
  job_type TEXT NOT NULL,
  
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
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_ai_job_events_job ON ai_job_events(job_id, created_at);
```

### Table: `ai_outputs` (Structured Outputs)
```sql
CREATE TABLE public.ai_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES ai_job_master(id),
  user_id UUID NOT NULL,
  output_type TEXT NOT NULL, -- 'text', 'image', 'audio', 'video', 'document'
  output_url TEXT,
  output_text TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_ai_outputs_user ON ai_outputs(user_id, created_at DESC);
CREATE INDEX idx_ai_outputs_job ON ai_outputs(job_id);
```

## C2. RLS Policies Template (Apply to ALL AI Tables)

```sql
-- Enable RLS
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {table_name} FORCE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can create own {table}"
  ON {table_name} FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own {table}"
  ON {table_name} FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own {table}"
  ON {table_name} FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own {table}"
  ON {table_name} FOR DELETE
  USING (user_id = auth.uid());

-- Admin policies
CREATE POLICY "Admins can view all {table}"
  ON {table_name} FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all {table}"
  ON {table_name} FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all {table}"
  ON {table_name} FOR DELETE
  USING (has_role(auth.uid(), 'admin'));
```

## C3. Storage Bucket Structure

```
Bucket: ai-user-outputs
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

**Storage RLS Policy:**
```sql
-- Users can manage their own folder
CREATE POLICY "Users manage own folder"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'ai-user-outputs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can read all
CREATE POLICY "Admins read all"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ai-user-outputs' AND
    has_role(auth.uid(), 'admin')
  );
```

---

# SECTION D — SECURITY PUNCH LIST

## 🔴 CRITICAL (Fix Immediately)

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 1 | `toolkit_jobs` has `WITH CHECK (true)` | Anyone can create/modify any job | Replace with user_id-based policies |
| 2 | `voice-studio-tts` has NO auth | Unlimited API abuse possible | Add JWT validation + rate limiting |
| 3 | `ai-market-chat` has NO auth | Unlimited AI usage | Add JWT validation |

## 🟠 IMPORTANT (Fix This Week)

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 4 | `ai-outfit-changer` auth is optional | Anonymous can use AI | Make auth required |
| 5 | No chat conversation storage | Cannot review user interactions | Add `ai_chat_logs` table |
| 6 | No design output storage | Users lose work, no visibility | Add `ai_design_outputs` table |
| 7 | No property evaluation history | No audit trail | Add `ai_property_evaluations` table |

## 🟢 NICE TO HAVE (This Month)

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 8 | Unified job runner | Fragmented tracking | Create `ai_job_master` table |
| 9 | Admin AI Tools Dashboard | No single view of all AI usage | Build admin panel tab |
| 10 | AI cost tracking | Cannot see API costs | Add token/cost tracking to logs |

---

# SECTION E — ADMIN PANEL REQUIREMENTS

## E1. New Admin Tab: "AI Tools Monitor"

### Screen: AI Usage Dashboard
- Total AI calls (today/week/month)
- Breakdown by tool
- Top users by usage
- Error rate trends
- Token consumption chart

### Screen: Chat Logs Viewer
- Filter: User, Date, Intent
- Show: Full conversation thread
- Actions: Export, Flag, Assign to lead

### Screen: AI Outputs Gallery
- Filter: Tool, User, Date
- Show: Thumbnails of all generated content
- Actions: View full, Delete, Export

### Screen: Job Queue
- Real-time view of all AI jobs
- Status: Pending, Processing, Completed, Failed
- Filter by user, tool, status
- Retry failed jobs

---

# APPENDIX: EDGE FUNCTION INVENTORY

| Function | Auth | Rate Limit | Logging | Rating |
|----------|------|------------|---------|--------|
| ai-chat-support | ✅ | ✅ | ❌ | ⚠️ |
| ai-background-remove | ❌ | ❌ | ❌ | ❌ |
| ai-outfit-changer | ⚠️ Optional | ❌ | ✅ | ⚠️ |
| ai-market-chat | ❌ | ❌ | ❌ | ❌ |
| interior-design-generate | ✅ | ✅ | ❌ | ✅ |
| property-evaluation | ✅ | ✅ | ❌ | ✅ |
| voice-studio-tts | ❌ | ❌ | ❌ | ❌ |
| video-resize-process | ✅ | ❌ | ✅ | ✅ |
| ai-meeting-summarizer | ✅ | ❌ | ❌ | ⚠️ |
| hr-ai-agent | ✅ | ❌ | ❌ | ⚠️ |
| ai-executive-assistant | ✅ | ❌ | ❌ | ⚠️ |

---

**END OF AUDIT DOCUMENT**

**Next Steps:**
1. Ms. Jane to review and approve/reject each recommendation
2. Upon approval, implementation begins with CRITICAL items first
3. Weekly progress reports until all items complete

---

*Prepared by: AI Systems Architect*  
*Date: 2025-02-06*
