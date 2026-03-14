

## Plan: AI Tool Analytics & Owner Audit Intelligence

### Overview

Create a new `ai_tool_usage_events` table to track every tool invocation, then build a comprehensive analytics dashboard at `/owner/ai-tools-analytics` with usage metrics, performance rankings, per-user analysis, health scores, audit intelligence, and fix recommendations.

### Database Migration

**New table: `ai_tool_usage_events`**
```
id (uuid PK), tool_id (text), user_id (uuid), user_role (text),
started_at (timestamptz), completed_at (timestamptz),
duration_ms (int), status (text: success/failure/abandoned),
error_message (text), response_time_ms (int),
created_at (timestamptz default now())
```
RLS: Authenticated users can INSERT their own rows; Owner-only SELECT for analytics.

**New table: `ai_tool_health_scores`** — Cached daily health scores per tool:
```
id (uuid PK), tool_id (text), score_date (date),
health_score (numeric), uptime_pct (numeric),
error_rate (numeric), completion_rate (numeric),
avg_response_ms (int), complaint_count (int),
created_at (timestamptz)
```
RLS: Owner-only SELECT/INSERT.

### Frontend: Tracking Hook

**New: `src/hooks/useAIToolTracking.ts`**
- `trackToolStart(toolId)` → inserts row, returns event ID
- `trackToolComplete(eventId, status, responseTimeMs)` → updates row
- Integrated into `useAITool` (AIToolsProvider.tsx) so every `invokeTool` call auto-tracks

### Frontend: Analytics Dashboard

**New: `src/pages/owner/AIToolAnalyticsDashboard.tsx`** — Owner-only page at `/owner/ai-tools-analytics`

**Layout — 5 tabs:**

| Tab | Content (Tasks covered) |
|-----|------------------------|
| **Overview** | KPI cards (total uses, unique users, avg response time, failure rate), top 10 tools chart, daily usage sparkline (Task 1, 2) |
| **Tool Rankings** | Sortable table: most used, fastest, slowest, most failed, least used, most improved, needs review. Each row shows tool name, category, usage count, avg response ms, failure %, health score badge (Task 2, 6) |
| **User Analysis** | Per-tool expandable rows showing user name, email, role, usage count, last used, success/fail ratio (Task 3) |
| **Audit Intelligence** | Flagged tools: repeated failures, traffic spikes (>3x avg), abuse patterns (single user >50 calls/day), low engagement (<5 uses/month). Auto-generated improvement recommendations (Task 4, 5) |
| **Change Impact** | Before/after comparison for tools with version changes: usage delta, failure delta, engagement delta pulled from `ai_tool_versions` + `ai_tool_usage_events` (Task 7) |

**Health Score (Task 6):**
Calculated client-side from usage data:
- `score = (completionRate * 0.3) + (uptimePct * 0.25) + ((1 - errorRate) * 0.25) + (speedScore * 0.1) + ((1 - complaintRate) * 0.1)`
- Displayed as color-coded badge: green (80-100), amber (50-79), red (<50)

**Fix Recommendation Engine (Task 5):**
Deterministic rules applied to analytics data:
- Error rate >15% → "Review error handling and prompt logic"
- Avg response >8s → "Optimize model routing or reduce payload"
- Usage <5/month → "Consider deprecation or UX improvement"
- Abandonment >40% → "Simplify input requirements"
- Failure spike after version change → "Revert to previous version"

### Route Registration

Add to `src/routes/OwnerRoutes.tsx`:
```tsx
<Route path="ai-tools-analytics" element={<AIToolAnalyticsDashboard />} />
```

### Integration with Existing `useAITool`

Update `src/components/ai-tools/AIToolsProvider.tsx` `invokeTool` to call tracking:
- Before invoke: `trackToolStart(functionName)`
- After success/error: `trackToolComplete(eventId, status, responseTimeMs)`

### Files Summary

| File | Change |
|------|--------|
| **Migration** | Create `ai_tool_usage_events` and `ai_tool_health_scores` tables with owner-only RLS |
| **New**: `src/hooks/useAIToolTracking.ts` | Usage event tracking hook |
| **New**: `src/pages/owner/AIToolAnalyticsDashboard.tsx` | Full analytics dashboard with 5 tabs |
| **Update**: `src/components/ai-tools/AIToolsProvider.tsx` | Auto-track every tool invocation |
| **Update**: `src/routes/OwnerRoutes.tsx` | Add analytics route |

### Implementation Order
1. Database migration
2. `useAIToolTracking` hook
3. Update `AIToolsProvider` with auto-tracking
4. Build `AIToolAnalyticsDashboard` (all 5 tabs)
5. Register route

