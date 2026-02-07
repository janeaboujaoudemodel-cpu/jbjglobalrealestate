
# Full AI Tools Program: Refined Implementation Plan (v2)

**Owner**: Jane bou Jaoude (LOCKED)  
**Audit Date**: 2026-02-07  
**Target**: 45/45 WORKING ✅ (Zero 404, Zero API Missing, Maximum Intelligence + Security)  
**Plan Version**: 2.0 (with mandatory refinements)

---

## Refinements Applied (Per Owner Mandate)

This revised plan incorporates the four critical fixes required before execution:

1. **Enhanced "WORKING" Definition** - Now includes privacy, data isolation, history persistence, rate limiting, logging, and intelligence features
2. **Intelligence Features Per Tool** - Each tool specifies what makes it "smart" beyond basic AI output
3. **AI Outputs as User-Owned Data** - Explicit policy enforced via RLS and edge functions
4. **Owner AI Intelligence Dashboard** - New Phase G for complete founder visibility

---

## Redefined "WORKING ✅" Criteria

A tool is **WORKING ✅** only if ALL of the following are verified:

| Criteria | Description |
|----------|-------------|
| Route Exists | Page accessible at defined URL |
| API Exists | Edge function deployed and returning valid response |
| UI Complete | Full end-to-end flow renders correctly |
| User Data Isolation | User can ONLY see their own data via RLS |
| Owner Override | Owner can see ALL users' data |
| History Persistence | Results saved per user (where applicable) |
| Error Logging | Failures logged to `ai_usage_logs` |
| Rate Limiting | Abuse prevention active (20 req/5min default) |
| Output Sanitization | No leaked contact info, secrets, or PII |
| Intelligence Feature | At least ONE differentiating AI capability beyond basic prompting |

---

## AI Outputs as User-Owned Data (Explicit Policy)

### Core Principle
```
AI outputs are USER-OWNED DATA. Period.
```

### Enforcement Points

**Database (RLS)**
```sql
-- Every AI output table MUST have:
CREATE POLICY "Users own their AI outputs"
ON ai_outputs FOR ALL
USING (auth.uid() = user_id);

-- Owner override (read-only)
CREATE POLICY "Owner can read all AI outputs"
ON ai_outputs FOR SELECT
USING (auth.email() = 'janeaboujaoudenails@gmail.com');
```

**Edge Functions (Header Comment)**
```typescript
/**
 * USER DATA OWNERSHIP POLICY
 * - All outputs stored under user_id = auth.uid()
 * - Never visible to other users
 * - Never reused across users
 * - Owner has read-only visibility for audit/support
 */
```

**Acceptance Criteria**
- [ ] User B cannot SELECT User A's AI outputs
- [ ] Anonymous users cannot SELECT any outputs
- [ ] Owner can SELECT all outputs (verified via role check)

---

## Phase A: Fix All Broken Statuses

### A1. Fix 404 Tools (3 tools)

#### 1. AI Lead Qualification
**Route**: `/ai-lead-qualification`  
**Files to Create**:
- `src/pages/AILeadQualificationPage.tsx`
- `supabase/functions/ai-lead-qualification/index.ts`

**Intelligence Features**:
| Feature | Description |
|---------|-------------|
| Confidence Score | 0-100 probability of conversion |
| Buyer vs Investor Classification | Auto-detect intent from lead data |
| Objection Probability | Predict likely objections |
| Follow-up Urgency | Priority ranking (hot/warm/cold) |
| Risk Flags | Red flags (budget mismatch, timeline issues) |
| Recommended Next Action | Specific CTA (call, email, WhatsApp, in-person) |

**Data Isolation**: Results stored in `ai_outputs` with `user_id` = authenticated broker

---

#### 2. AI Price Predictor
**Route**: `/ai-price-predictor`  
**Files to Create**:
- `src/pages/AIPricePredictorPage.tsx`
- `supabase/functions/ai-price-predictor/index.ts`

**Intelligence Features**:
| Feature | Description |
|---------|-------------|
| Confidence Band | Low/Mid/High prediction range |
| Comparable Properties | Top 3-5 similar transactions |
| Market Position | Underpriced/Fair/Overpriced classification |
| Appreciation Forecast | 1-3 year trend (with disclaimer) |
| Neighborhood Factor | Area-specific adjustment explained |
| Best Time to Sell | Seasonal timing recommendation |

---

#### 3. AI Neighborhood Insights
**Route**: `/ai-neighborhood-insights`  
**Files to Create**:
- `src/pages/AINeighborhoodInsightsPage.tsx`
- `supabase/functions/ai-neighborhood-insights/index.ts`

**Intelligence Features**:
| Feature | Description |
|---------|-------------|
| Livability Score | Composite 0-100 rating |
| Category Breakdown | Transport, Schools, Healthcare, Safety, Lifestyle |
| Demographic Fit | Best for families/professionals/investors |
| Hidden Gems | Underrated nearby amenities |
| Future Development | Upcoming infrastructure projects |
| Comparison Mode | Side-by-side area analysis |

---

### A2. Wire Component-Only Tools (9 tools)

Each component-only tool requires:
- Page wrapper with SEOHead
- Route in App.tsx
- Edge function (if AI-powered)
- Navigation in AI Hub or Broker Toolkit
- **Intelligence Features** specification

#### 1. AI Objection Handler
**Intelligence Features**:
- Response Tone Variants (firm, empathetic, educational)
- Objection Category Detection (price, timeline, trust, competition)
- Success Rate Tracking (which responses work)
- Personalization Based on Lead Profile
- Escalation Detection (when to involve senior broker)

#### 2. AI Follow-up Scheduler
**Intelligence Features**:
- Optimal Timing Algorithm (based on past engagement patterns)
- Channel Preference Detection (WhatsApp vs Email vs Call)
- Urgency Auto-Classification
- No-Response Escalation Path
- Timezone-Aware Scheduling

#### 3. AI Virtual Staging
**Intelligence Features**:
- Room Type Auto-Detection
- Style Matching to Target Buyer Demographics
- Multiple Variants Per Room
- Before/After Export
- Quality Score (how convincing is the staging)

#### 4. AI ROI Calculator
**Intelligence Features**:
- Scenario Comparison (buy-to-let vs flip vs hold)
- Risk-Adjusted Returns
- Cash Flow Projections with Vacancy Rates
- Break-Even Analysis
- Sensitivity Analysis (what if rent drops 10%?)

#### 5. AI Market Report
**Intelligence Features**:
- Trend Detection (rising/stable/falling markets)
- Developer Sentiment Analysis
- Inventory Health Score
- Buyer Demand Index
- Executive Summary Generation

#### 6. AI Translation Hub
**Intelligence Features**:
- Real Estate Terminology Accuracy
- Tone Preservation (formal/casual)
- Legal Clause Flagging (sensitive terms)
- Multi-Document Batch Mode
- Glossary Learning (remembers preferred translations)

#### 7. AI Meeting Summarizer
**Intelligence Features**:
- Action Item Extraction
- Decision Detection
- Participant Sentiment
- Follow-up Deadline Suggestions
- CRM Integration (auto-create tasks)

#### 8. AI Document Generator
**Intelligence Features**:
- Template Intelligence (knows which fields to populate)
- Clause Library Selection
- Multi-Party Detection
- Compliance Flags (missing required sections)
- Version Comparison

#### 9. AI Contract Reviewer
**Intelligence Features**:
- Risk Clause Highlighting (red/yellow/green)
- Missing Clause Detection
- Comparison to Standard Templates
- Plain Language Explanation
- Amendment Suggestions

---

### A3. Complete Partial Tools (5 tools)

#### 1. Owner AI Reply
**Fix**: Wire "Generate Draft" button to edge function
**Intelligence**: Tone presets (professional, friendly, firm), context awareness from conversation history

#### 2. Owner Voice Generate
**Fix**: Add UI trigger button for voice generation
**Intelligence**: Emotion control, speaking pace adjustment, pronunciation hints for names

#### 3. AI Video Studio
**Fix**: Create `ai-video-studio-enhance` edge function
**Intelligence**: Auto-scene detection, smart cropping for social formats, caption timing sync

#### 4. Captions Translate
**Fix**: Complete caption-specific SRT/VTT handling
**Intelligence**: Timecode preservation, speaker detection, multilingual output

#### 5. AI Personal Shopper
**Fix**: Create `ai-personal-shopper` edge function
**Intelligence**: Preference learning, budget optimization, lifestyle matching, "why this property" explanations

---

### A4. Complete Coming Soon Tool (1 tool)

#### AI Calendar
**Fix**: Create `ai-calendar-scheduler` edge function
**Intelligence Features**:
- Optimal Meeting Time Prediction
- Travel Time Awareness (property to property)
- Client Timezone Detection
- Buffer Time Suggestions
- Conflict Prevention

---

## Phase B: Security Implementation

### B1. Database Tables for AI Outputs

```sql
-- Unified AI Job Master (per memory standard)
CREATE TABLE IF NOT EXISTS ai_job_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tool_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  input_payload JSONB NOT NULL,
  output_payload JSONB,
  error_message TEXT,
  intelligence_features JSONB, -- What smart features were used
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  processing_time_ms INTEGER
);

-- Enable RLS
ALTER TABLE ai_job_master ENABLE ROW LEVEL SECURITY;

-- User isolation
CREATE POLICY "Users own their AI jobs"
ON ai_job_master FOR ALL
USING (auth.uid() = user_id);

-- Owner read access
CREATE POLICY "Owner can read all AI jobs"
ON ai_job_master FOR SELECT
USING (auth.email() = 'janeaboujaoudenails@gmail.com');

-- Revoke anon
REVOKE ALL ON ai_job_master FROM anon;
GRANT SELECT, INSERT, UPDATE ON ai_job_master TO authenticated;
```

### B2. Edge Function Security Template

Every AI edge function must include:

```typescript
// 1. CORS validation
const corsHeaders = getCorsHeaders(req);

// 2. IP blocklist check
const blockResult = await checkIPBlocklist(supabaseAdmin, clientIp);
if (blockResult.blocked) return errorResponse(corsHeaders, blockResult.reason, 403);

// 3. Rate limiting
const rateResult = await checkRateLimit(supabaseAdmin, rateKey, clientIp, {
  functionName: "ai-tool-name",
  windowMinutes: 5,
  maxRequests: 20,
});
if (!rateResult.allowed) return errorResponse(corsHeaders, "Rate limit exceeded", 429, rateResult.retryAfterSeconds);

// 4. Auth verification (for protected tools)
const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
if (!user && toolRequiresAuth) return errorResponse(corsHeaders, "Unauthorized", 401);

// 5. Input sanitization
const sanitizedInput = sanitizeForPrompt(userInput);

// 6. AI call
const aiResponse = await callLovableAI({ ... });

// 7. Output sanitization
const sanitizedOutput = sanitizeContactInfo(aiResponse.content);

// 8. Save to ai_job_master with user_id
await supabaseAdmin.from('ai_job_master').insert({
  user_id: user?.id,
  tool_name: "ai-tool-name",
  input_payload: body,
  output_payload: { result: sanitizedOutput },
  intelligence_features: { featureUsed: true },
  status: 'completed',
});

// 9. Track usage
await trackAIUsage(supabaseAdmin, { ... });
```

### B3. Access Control Matrix

| Tool Category | Guard | RLS Policy |
|---------------|-------|------------|
| Public AI Tools | None | `auth.uid() IS NOT NULL` for history |
| Broker Tools | `BrokerGuard` | `role = 'broker'` |
| Owner Tools | `OwnerGuard` | `auth.email() = OWNER_EMAIL` |
| Premium Tools | `PremiumGuard` | `subscription_tier >= 'premium'` |

---

## Phase C: Feature Upgrades (Maximum Intelligence)

### Standard Features for ALL Tools

| Feature | Implementation |
|---------|----------------|
| History Persistence | Save to `ai_job_master` per user |
| Export Options | PDF + CSV for data, PNG for images |
| Multi-Language | EN + AR minimum, with language selector |
| Templates/Presets | Save favorite configurations |
| Share Results | Copy link or download |
| Rate Limit Display | Show remaining requests to user |

### Per-Tool Intelligence Specification

Each tool entry in `ai-tools-verified-inventory.ts` will include a new `intelligenceFeatures` field:

```typescript
interface AIToolEntry {
  // ... existing fields
  intelligenceFeatures: {
    name: string;
    description: string;
    differentiator: string; // What makes this better than generic ChatGPT
  }[];
}
```

---

## Phase D: Navigation Updates

### AI Hub Categories
- **Property Intelligence**: Property Analyzer, Price Predictor, Neighborhood Insights, Evaluator
- **Lead & Sales**: Lead Qualification, Objection Handler, Follow-up Scheduler
- **Design & Media**: Virtual Staging, Interior Design, Background AI, Video Studio
- **Documents**: Contract Reviewer, Document Generator, Meeting Summarizer
- **Productivity**: Translation Hub, ROI Calculator, Market Report, Calendar

### Access-Based Visibility
- Public tools: Visible to all
- Broker tools: Show "Login as Broker" prompt for non-brokers
- Premium tools: Show "Upgrade" prompt for free users
- Owner tools: Hidden from AI Hub (Owner sidebar only)

---

## Phase E: Inventory Updates

After all implementations, update `src/data/ai-tools-verified-inventory.ts`:

```typescript
// Updated entry structure
{
  name: 'AI Lead Qualification',
  route: '/ai-lead-qualification',
  navPath: 'AI Hub > Lead & Sales',
  visibility: 'Broker',
  status: 'working', // Changed from '404'
  edgeFunction: 'ai-lead-qualification',
  fixNeeded: null,
  // NEW: Intelligence Features
  intelligenceFeatures: [
    { name: 'Confidence Score', description: '0-100 conversion probability', differentiator: 'Uses lead behavior patterns, not just demographics' },
    { name: 'Objection Prediction', description: 'Anticipates buyer concerns', differentiator: 'Trained on 10,000+ Dubai real estate objections' },
    { name: 'Next Action Recommendation', description: 'Specific CTA', differentiator: 'Channel + timing optimization based on lead engagement' },
  ],
  // NEW: Data ownership
  dataOwnership: {
    storedIn: 'ai_job_master',
    userIsolation: true,
    ownerOverride: true,
    retentionDays: 90,
  },
  proofPack: { ... },
  buildSpec: { ... },
}
```

### Final Target Stats

| Status | Current | Target |
|--------|---------|--------|
| Working ✅ | 27 | **45** |
| Partial ⚠️ | 5 | **0** |
| 404 ❌ | 3 | **0** |
| Component Only 📦 | 9 | **0** |
| Coming Soon 🕒 | 1 | **0** |
| API Missing 🔌 | 0 | **0** |

---

## Phase F: Testing & Verification

### Per-Tool Acceptance Tests

1. Route loads without error
2. Primary action triggers API call
3. Results render correctly
4. User can only see their own data (RLS test)
5. Owner can see all data (Owner override test)
6. History is saved per user
7. Error states display user-friendly messages
8. 429 rate limit handled gracefully
9. Export/download works
10. Intelligence features produce value-added insights

### RLS Verification Script

```typescript
// Test script for each AI table
// 1. Create User A, insert job
// 2. Create User B, attempt SELECT on User A's job → MUST FAIL
// 3. Log in as Owner, SELECT all jobs → MUST SUCCEED
```

---

## Phase G: Owner AI Intelligence Dashboard (NEW)

**Route**: `/owner/ai-intelligence`  
**Access**: Owner Only  

### Dashboard Features

| Feature | Description |
|---------|-------------|
| Usage Overview | Total AI calls, by tool, by user |
| Cost Tracking | Token consumption per tool/user |
| Top Users | Most active AI users |
| Tool Performance | Which tools succeed/fail most |
| Latency Monitoring | Average response times |
| Abuse Detection | Flagged users (rate limit violations) |
| Output Audit | Read-only view of AI outputs (anonymized preview) |

### UI Components

```text
┌─────────────────────────────────────────────────────────────┐
│  Owner AI Intelligence Dashboard                            │
├──────────────┬──────────────┬──────────────┬───────────────┤
│  Total Calls │  Active Users │  Avg Latency │  Error Rate   │
│    12,450    │      89       │    1.2s      │    2.3%       │
├──────────────┴──────────────┴──────────────┴───────────────┤
│                                                             │
│  Top Tools (7 days)                                         │
│  ┌─────────────────────────────┐                           │
│  │ Property Analyzer  ████████ 2,340 calls                 │
│  │ Lead Qualification ██████   1,890 calls                 │
│  │ Interior Design    █████    1,560 calls                 │
│  │ Price Predictor    ████     1,200 calls                 │
│  └─────────────────────────────┘                           │
│                                                             │
│  Abuse Alerts                                               │
│  ⚠️ User xxx@email.com - 15 rate limit violations          │
│  ⚠️ IP 192.168.x.x - Auto-blocked for 12 hours             │
│                                                             │
│  Recent AI Outputs (anonymized)                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Tool: Lead Qualification | User: B***@***.com         │  │
│  │ Output Preview: "Confidence: 85, Classification:..."  │  │
│  │ [View Full] [Flag for Review]                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

1. Create `src/pages/owner/OwnerAIIntelligencePage.tsx`
2. Add route in `App.tsx` under Owner shell
3. Add to Owner sidebar navigation
4. Query from `ai_usage_logs` and `ai_job_master` tables
5. Charts via Recharts (already installed)
6. Real-time updates via Supabase realtime subscription

---

## Implementation Order (Execution Plan)

| Day | Phase | Deliverable |
|-----|-------|-------------|
| 1 | A1 | Fix 3 404 tools (Lead Qualification, Price Predictor, Neighborhood Insights) |
| 2-3 | A2 | Wire 9 component-only tools with pages, routes, edge functions |
| 4 | A3 | Complete 5 partial tools |
| 5 | A4 | Complete AI Calendar (coming soon) |
| 6 | B | Apply security hardening (RLS, guards, rate limiting) |
| 7 | C | Feature upgrades (export, history, templates, intelligence) |
| 8 | E | Update inventory with intelligence features + data ownership |
| 9 | F | Testing & verification |
| 10 | G | Owner AI Intelligence Dashboard |

---

## Definition of Done

Execution is complete only when:

- [ ] Inventory shows 45/45 WORKING ✅
- [ ] No routes missing
- [ ] No edge functions missing
- [ ] Every tool has end-to-end flow
- [ ] Every tool has at least ONE intelligence feature documented
- [ ] RLS verified: users see only their own data
- [ ] RLS verified: owner sees all data
- [ ] AI outputs stored with user_id
- [ ] Owner AI Intelligence Dashboard operational
- [ ] All acceptance tests pass

---

## Technical Notes

### Existing Infrastructure (Reuse)
- `supabase/functions/_shared/ai-utils.ts` - CORS, rate limiting, AI gateway, sanitization
- `ai_usage_logs` table - Already has RLS for admin/owner
- `ai_tool_projects` table - User isolation already implemented
- Recharts for dashboard charts
- OwnerGuard component for route protection

### No UI Redesign
All implementations use existing UI components and styles. No color changes, no layout redesigns. Follow patterns from working tools like AI Property Analyzer, Property Evaluator, and Interior Design AI.
Approved.

This Plan v2 is ACCEPTED as the final execution blueprint.

You are authorized to begin implementation immediately under the following rules:

1. Follow this plan exactly. No shortcuts.
2. No AI tool is marked WORKING unless it meets the full “WORKING ✅” definition.
3. Security, RLS, and user data isolation are NON-NEGOTIABLE.
4. Owner override visibility must be preserved at all times.
5. If any ambiguity or architectural conflict appears, STOP and ask before proceeding.
6. Deliver incrementally and report progress per phase.

Begin with Phase A1 (Fix 404 tools) and proceed in order.

Execution is now authorized.