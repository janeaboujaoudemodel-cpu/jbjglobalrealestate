

# Chat Support - Final Fixes

## 1. Mobile Keyboard Bug (Root Cause Found)

The previous fix wrapped `ChatMessages` in `React.memo` and used a native `<input>`, but the **actual root cause** was never fixed:

In `AIChatWidget.tsx` line 785:
```
onInputChange={(val) => setInput(val)}
```

This creates a **new arrow function on every render**, which means `React.memo` on `ChatMessages` is completely bypassed -- the component still re-renders on every keystroke, causing the mobile keyboard to dismiss.

**Fix:** Replace the inline arrow with a stable reference -- either pass `setInput` directly or wrap it in `useCallback`. Same issue applies to the `onSend` and `onSubmitToTeam` handlers if they are not already stable.

## 2. CV Upload -- Already Fixed

The CV submission component already shows file name and size immediately upon selection (line 261-262) and uses a `Loader2` spinner instead of fake progress. No further changes needed here.

## 3. AI Knowledge Base -- Stream Endpoint Still Minimal

The `ai-chat-support` edge function has the full expanded knowledge base (areas, developers, buying/selling/rental processes, fees, Golden Visa, ROI). However, `ai-chat-stream` (the **primary** endpoint used for streaming responses) still has a **condensed 20-line version** of the knowledge base (lines 126-147). This means the AI gives less informed answers when streaming works (which is the default path).

**Fix:** Copy the full `WEBSITE_KNOWLEDGE` from `ai-chat-support` into `ai-chat-stream`.

## 4. Where to Find Saved Chats

All chat data is already being saved and an admin dashboard exists:

- **Admin Panel**: `/admin/chat-conversations` -- Shows all conversations with transcripts, user contact details, service type, and ratings
- **CV Submissions**: Stored in `hr_cv_submissions` table, files in the `documents` storage bucket under `cv-submissions/`
- **Lead Data**: `/admin/leads` -- All captured leads with full contact details
- **Chat History Logs**: `chat_history` table stores individual messages with session IDs

## Technical Changes

### File 1: `src/components/AIChatWidget.tsx`
- Wrap `onInputChange` in `useCallback` or pass `setInput` directly to prevent re-renders
- Ensure all callback props passed to memoized children are stable references

### File 2: `supabase/functions/ai-chat-stream/index.ts`
- Replace the condensed `WEBSITE_KNOWLEDGE` (lines 126-147) with the full expanded version from `ai-chat-support` (covering all areas, developers, processes, fees, FAQs)

These are the only two changes needed -- the mobile keyboard fix is a one-line change, and the knowledge sync is a copy-paste of the knowledge constant.

