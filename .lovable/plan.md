
# Chat Support - Comprehensive Upgrade Plan

## Issues Identified

### 1. Mobile Keyboard Bug (Critical)
The chat input uses a standard `<Input>` component that re-renders and loses focus on mobile when the parent component state updates (e.g., from `onInputChange` triggering `setInput` in the parent). On mobile, this causes the keyboard to close every time the user types.

**Root Cause:** The `Input` in `ChatMessages.tsx` (line 236-243) and `ChatConversationalCollect.tsx` inputs lose focus because:
- Parent state updates cause the entire `AIChatWidget` component tree to re-render
- Mobile browsers dismiss the keyboard when the focused element re-mounts
- The `autoFocus` attribute only works on initial mount, not re-renders

**Fix:**
- Add `inputMode="text"` and `enterKeyHint="send"` to all chat inputs for better mobile keyboard behavior
- Wrap `ChatMessages` and input handlers in `React.memo` to prevent unnecessary re-renders
- Use `useRef` for the input value instead of controlled state to prevent re-renders on every keystroke, syncing back to parent only on blur/send
- Add `autoComplete="off"` to prevent mobile browser autocomplete interference

### 2. CV Upload Slow + No File Name Display
The CV upload in `ChatCVSubmission.tsx` works but:
- Doesn't show the PDF file name immediately upon selection (it actually does show it on line 264, but only after the file passes validation)
- The upload feels slow because the progress bar is fake (simulated percentages at lines 83-137)
- No file size display

**Fix:**
- Show file name and size immediately after selection (before upload)
- Remove fake progress percentages -- use an indeterminate progress spinner instead
- Add file metadata display (name, size, type icon)

### 3. AI Knowledge Base Too Limited
The edge functions (`ai-chat-support` and `ai-chat-stream`) have a very small hardcoded knowledge base (lines 256-286 and 126-134 respectively). The AI doesn't know about specific projects, areas, team members, pricing, or detailed services.

**Fix:**
- Expand `WEBSITE_KNOWLEDGE` in both edge functions with comprehensive data:
  - All major Dubai areas with descriptions
  - Key developers and their flagship projects
  - JBJ service details (buying process, selling process, rental process)
  - Common FAQs (DLD fees, Golden Visa, payment plans, ROI expectations)
  - Company values, team structure, and USPs
  - Holiday homes and short-term rental info
  - Partner service details (mortgage, legal, visa, company setup)
- Upgrade the AI model from `gemini-2.5-flash-lite` to `gemini-2.5-flash` in `ai-chat-support` for better reasoning
- Increase `max_tokens` from 300/400 to 500 for more complete answers

### 4. Chat Data Storage and Where to Find It
All chat data is already saved to the database. Here's where everything lives:

| Data | Table | Key Columns |
|------|-------|-------------|
| Full chat transcripts | `chat_conversations` | `messages` (JSONB), `user_email`, `user_name`, `user_phone` |
| Service selected | `chat_conversations` | `service_type`, `shortcut_selected` |
| Rating/Feedback | `chat_conversations` | `rating`, `rating_feedback`, `feedback_type` |
| CV submissions | `hr_cv_submissions` | `full_name`, `email`, `phone`, `cv_url`, `chat_session_id` |
| Lead data | `leads` / `crm_leads` | Captured via `capture-lead` edge function |
| Chat history logs | `chat_history` | `session_id`, `role`, `message`, `source` |

**You can view all this from the Admin Panel:**
- `/admin/leads` -- All leads with contact details
- `/admin/chat-history` -- All chat conversations (if this page exists, otherwise we'll add a link)

**Fix:** Add an **Admin Chat Dashboard** section at `/admin/chat-conversations` that shows:
- All conversations with user name, email, phone, service type
- Full transcript viewer
- CV submissions with download links
- Filter by date, service, status
- Export to CSV

### 5. Overall Performance Improvements
- Reduce the `simulateTyping` delay in `ChatConversationalCollect.tsx` from 800ms to 400ms
- Remove unnecessary `framer-motion` animations on individual message bubbles that cause layout thrashing on mobile
- Lazy-load the chat widget components to reduce initial bundle size

---

## Technical Implementation Details

### Files to Modify

1. **`src/components/chat/ChatMessages.tsx`**
   - Wrap component in `React.memo`
   - Add `inputMode="text"`, `enterKeyHint="send"`, `autoComplete="off"` to input
   - Use internal ref-based input to prevent parent re-renders on keystroke
   - Simplify message animations for mobile performance

2. **`src/components/chat/ChatConversationalCollect.tsx`**
   - Same mobile input fixes
   - Reduce `simulateTyping` delays from 800ms to 400ms
   - Wrap in `React.memo`

3. **`src/components/chat/ChatCVSubmission.tsx`**
   - Show file name/size immediately on selection
   - Replace fake progress bar with indeterminate spinner during upload
   - Add mobile input optimizations

4. **`supabase/functions/ai-chat-support/index.ts`**
   - Expand `WEBSITE_KNOWLEDGE` with comprehensive JBJ data
   - Upgrade model from `gemini-2.5-flash-lite` to `gemini-2.5-flash`
   - Increase `max_tokens` to 500

5. **`supabase/functions/ai-chat-stream/index.ts`**
   - Expand `WEBSITE_KNOWLEDGE` to match the non-streaming version
   - Increase `max_tokens` to 500

6. **`src/components/AIChatWidget.tsx`**
   - Memoize callbacks (`handleSend`, `handleSelectService`) with `useCallback`
   - Prevent unnecessary re-renders that cause mobile keyboard dismissal

7. **New: `src/pages/admin/AdminChatDashboard.tsx`** (or add to existing admin)
   - Table view of all `chat_conversations`
   - Click to view full transcript
   - Link to CV submissions
   - Filter by date/status/service
   - Export button

### Where to Find Saved Chats (For Your Reference)

After implementation, you'll be able to access all chat data from:
- **Admin Panel** -- A new "Chat Conversations" section showing all transcripts, user details, and uploaded CVs
- **Database tables** -- `chat_conversations` stores the full message history as JSON, along with user contact info (email, phone, name) and the service they inquired about
- **CV files** -- Stored in the `documents` storage bucket under `cv-submissions/` folder, linked via `hr_cv_submissions` table
