

# Meeting Center Integration Plan

## Overview

This plan integrates the AI Call Summarizer and ElevenLabs Voice Concierge call logs directly into the Meeting Center, making it a unified hub for all communication summaries.

---

## Current State

| Component | Current Location | Database Storage |
|-----------|-----------------|-----------------|
| AI Meeting Summarizer | Standalone `/ai-meeting-summarizer` | `ai_job_master` (tool_name = 'ai-meeting-summarizer') |
| AI Call Summarizer | Standalone `/ai-call-summarizer` | `ai_job_master` (tool_name = 'ai-call-summarizer') |
| ElevenLabs Voice Calls | Widget only | `voice_call_logs` table |
| Meeting Center | View-only hub `/meeting-center` | Mock data only |

## Proposed Architecture

```text
+--------------------------------------------------+
|              MEETING CENTER                       |
|              /meeting-center                      |
+--------------------------------------------------+
|                                                  |
|  [Tabs]                                          |
|  - All | Meetings | Phone Calls | Voice AI Calls |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  [Quick Actions Bar]                             |
|  +-------------------+ +--------------------+    |
|  | New Meeting       | | New Call Summary   |    |
|  | Summary           | | (inline form)      |    |
|  +-------------------+ +--------------------+    |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  [Inline Call Summarizer Form]                   |
|  - Client Name                                   |
|  - Call Notes / Audio Upload                     |
|  - Summarize Button                              |
|  (Collapsed by default, expands on click)        |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  [Combined History List]                         |
|  - Loads from ai_job_master WHERE tool_name      |
|    IN ('ai-meeting-summarizer',                  |
|        'ai-call-summarizer')                     |
|  - Loads from voice_call_logs                    |
|  - Sorted by date descending                     |
|  - Type badges: Meeting / Call / Voice AI        |
|                                                  |
+--------------------------------------------------+
```

---

## Implementation Details

### 1. Database Queries

**Fetch Meeting & Call Summaries from ai_job_master:**
```sql
SELECT id, tool_name, input_payload, output_payload, created_at
FROM ai_job_master
WHERE tool_name IN ('ai-meeting-summarizer', 'ai-call-summarizer')
  AND user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 50
```

**Fetch ElevenLabs Voice Calls:**
```sql
SELECT id, conversation_id, started_at, ended_at, duration_seconds, metadata
FROM voice_call_logs
WHERE user_id = auth.uid()
ORDER BY started_at DESC
LIMIT 50
```

### 2. Component Changes

#### MeetingCenter.tsx - Major Refactor
**Current**: Uses mock data and links out to separate tools
**New**: 
- Fetches real data from `ai_job_master` and `voice_call_logs`
- Embeds the Call Summarizer form inline (collapsible)
- Adds "Voice AI" tab for ElevenLabs call history
- Shows actual summaries with expand/collapse
- Quick actions to view full details

#### Add Inline Call Summarizer
- Embed `AICallSummarizerPremium` form directly in Meeting Center
- When submitted, result appears in the list immediately
- Collapsible section to keep UI clean

#### Add Voice AI Calls Tab
- Shows history of ElevenLabs conversations
- Displays: start time, duration, conversation ID
- Future enhancement: transcripts when available

### 3. Data Model Mapping

**ai_job_master summary display:**
```typescript
interface SummaryItem {
  id: string;
  type: 'meeting' | 'call' | 'voice-ai';
  clientName: string;
  date: string;
  summary: string;
  actionItems: string[];
  source: 'ai_job_master' | 'voice_call_logs';
}

// Mapping from ai_job_master:
// - input_payload.clientName or input_payload.meetingTitle -> clientName
// - output_payload.summary -> summary
// - output_payload.actionItems -> actionItems
// - tool_name -> type ('ai-meeting-summarizer' -> 'meeting', 'ai-call-summarizer' -> 'call')

// Mapping from voice_call_logs:
// - conversation_id -> clientName (or "Voice AI Call")
// - started_at -> date
// - metadata.summary -> summary (if available)
// - type = 'voice-ai'
```

### 4. UI Enhancements

**Tab Structure:**
| Tab | Source | Icon | Color |
|-----|--------|------|-------|
| All | Combined | Calendar | Violet |
| Meetings | ai_job_master (meeting) | Video | Violet |
| Phone Calls | ai_job_master (call) | Phone | Orange |
| Voice AI | voice_call_logs | Mic | Gold |

**Inline Form:**
- Collapsible card at top of page
- "Add Call Summary" button expands the form
- After submission, collapses and refreshes list

**Summary Cards:**
- Expandable to show full details
- Quick actions: Copy, Generate Document, Schedule Follow-up
- Type badge with appropriate color

---

## Files to Modify

### Primary File
**`src/pages/MeetingCenter.tsx`**
- Remove mock data
- Add Supabase queries for real data
- Add tabs for different summary types
- Embed inline call summarizer form
- Add voice call logs display

### Supporting Changes
**`src/components/ai-tools/premium/AICallSummarizerPremium.tsx`**
- Export as embeddable component (not full page)
- Add `onSuccess` callback prop for parent notification
- Make hero section optional via prop

**`supabase/functions/ai-call-summarizer/index.ts`**
- Add logging to `ai_job_master` table for history persistence
- Include user_id from auth header

---

## Technical Implementation

### Step 1: Update Edge Function to Log Results

Add to `ai-call-summarizer/index.ts`:
```typescript
// After successful summarization, log to ai_job_master
const supabase = createClient(supabaseUrl, supabaseServiceKey);
await supabase.from('ai_job_master').insert({
  user_id: userId,
  tool_name: 'ai-call-summarizer',
  status: 'completed',
  input_payload: { clientName, hasAudio },
  output_payload: summary,
});
```

### Step 2: Create Unified Data Hook

New hook: `useMeetingCenterData.ts`
```typescript
export const useMeetingCenterData = () => {
  // Fetch from ai_job_master
  // Fetch from voice_call_logs
  // Combine and sort by date
  // Return unified list with refetch function
};
```

### Step 3: Refactor MeetingCenter Component

- Use the new data hook
- Add tab filtering logic
- Add inline form toggle state
- Render real data with proper mapping

---

## Expected Outcome

After implementation:
- Meeting Center shows ALL communication summaries in one place
- Users can add new call summaries directly from Meeting Center
- Voice AI call history is visible and filterable
- Real data from database, no more mock data
- Consistent with the premium dark theme
- Quick navigation to individual tool pages still available

