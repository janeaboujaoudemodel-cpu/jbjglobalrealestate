
# Admin Chat Intelligence - Complete Fix and Upgrade

## Problems Identified

### 1. CV Download Shows "Upstream Download Failed"
The `documents` storage bucket is set to **private**, but the CV submission code uses `getPublicUrl()` which generates a URL that only works for public buckets. When the admin dashboard tries to download via the proxy, the upstream fetch fails because the bucket requires authentication.

**Fix:** Make the `documents` bucket public (it stores CV files that need to be accessible), OR use signed URLs instead of public URLs.

### 2. Chat Transcripts Are Empty (messages: [])
All 6 existing conversations have `messages: []`. The `saveMessagesToDb` function works correctly and the RLS policy exists, but these conversations were created **before** the UPDATE policy was added. The messages were never saved because the database rejected the updates silently.

**Fix:** The save mechanism is now working for new conversations. For the admin dashboard, we need to also pull from `chat_history` table (which logs individual messages with session IDs) as a fallback data source when `chat_conversations.messages` is empty.

### 3. CV Not Showing Inline (Opens New Page with Error)
The current CV download link opens in a new tab (`target="_blank"`). You want the CV to display inline in the dashboard with AI summary and scoring, matching the CVCenter style in the Employee Hub.

**Fix:** Replace the download link with an inline CV viewer panel that shows:
- Candidate details (name, email, phone)
- AI-generated summary of the CV
- AI scoring/ranking
- Inline PDF preview using an iframe
- Action buttons (download, approve, reject)

### 4. CV Submissions Not Appearing in Employee Hub
The CVCenter component fetches from `hr_applications` table, but the chat widget saves to `hr_cv_submissions` table. These are two separate tables, so chat-submitted CVs never appear in the Employee Hub.

**Fix:** Modify CVCenter's `fetchCVs` function to ALSO query `hr_cv_submissions` and merge results into the same list. This ensures all CVs (from careers portal AND chat widget) appear in one unified view.

### 5. UI Styling Needs Gold/Champagne Theme
The current dashboard uses a dark zinc theme. Need to ensure active tab buttons are clearly visible and the overall aesthetic matches the platform's champagne gold standard.

**Fix:** Refine active tab styling with stronger gold borders and backgrounds. Ensure dropdown selects don't show blue hover states. Apply the champagne gold design system consistently.

---

## Technical Implementation

### File 1: Database Migration - Make Documents Bucket Public
- Update the `documents` storage bucket to `public = true`
- This allows CV PDF URLs to be accessible without authentication

### File 2: `src/pages/admin/AdminChatDashboard.tsx` (Major Rewrite)
- **CV Viewer Panel:** Replace the download link with an inline viewer modal that shows:
  - Candidate info card (name, email, phone, date, source)
  - Embedded PDF preview via iframe (using the direct storage URL)
  - AI summary section (generated on-the-fly via Gemini if not cached)
  - AI scoring with visual indicators
  - Action buttons: Download, Approve, Reject, Schedule Interview
- **Chat History Fallback:** When a conversation's `messages` array is empty, query the `chat_history` table using the conversation's time range and email to find logged messages
- **Active Tab Styling:** Ensure the active tab has a solid gold background with black text (not subtle gold/20 opacity), and inactive tabs show clear zinc styling without blue hover
- **Service Filter:** Ensure all service types render correctly with proper labels

### File 3: `src/components/crm/CVCenter.tsx`
- Modify `fetchCVs` to also query `hr_cv_submissions` table
- Transform `hr_cv_submissions` records to match the `CVEntry` interface
- Merge both data sources, deduplicate by email, sort by date
- Chat-widget CVs will appear with source label "Chat Widget"

### File 4: Edge Function or Inline Logic for CV AI Summary
- When viewing a CV in the admin dashboard, call the existing document-extractor or a lightweight Gemini function to:
  - Generate a 2-3 sentence summary of the candidate
  - Score the CV on a 1-10 scale based on relevance to real estate
  - Extract key skills and experience
- Cache the results in the `hr_cv_submissions` table (add `ai_summary`, `ai_ranking` columns if not present)

### Database Changes
1. Make `documents` bucket public: `UPDATE storage.buckets SET public = true WHERE id = 'documents'`
2. Add AI columns to `hr_cv_submissions` if missing: `ai_summary TEXT`, `ai_ranking INTEGER DEFAULT 0`
