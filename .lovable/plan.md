

# Implementation Plan

## Three Major Workstreams

---

## 1. FAQ Books — Replace "Question coming soon" with Real Content

**Problem**: 4 FAQ pages (BuyerFAQ, SellerFAQ, LandlordFAQ, TenantFAQ) have placeholder text "Question coming soon" instead of real FAQ content. InvestorFAQ and BrokerFAQ already have real content.

**Fix**: Populate all 4 FAQ pages with real, relevant questions and answers matching the same quality as InvestorFAQ (which has ~8 categories with 2+ real Q&As each). Each category will get 3-5 real questions based on UAE real estate domain knowledge.

**Files to edit**:
- `src/pages/BuyerFAQ.tsx` — Add real buying questions (mortgage, freehold, DLD fees, etc.)
- `src/pages/SellerFAQ.tsx` — Add real selling questions (NOC, pricing, agent fees, etc.)
- `src/pages/LandlordFAQ.tsx` — Add real landlord questions (Ejari, rental increases, RERA, etc.)
- `src/pages/TenantFAQ.tsx` — Add real tenant questions (deposits, rights, disputes, etc.)

**Layout consistency**: All FAQ pages already use the same structure (FAQHero + FAQFloatingSidebar navigator on right + FAQTableOfContents mobile sticky + edge-to-edge champagne sections). Will verify all 4 pages maintain this pattern identically, matching the InvestorFAQ gold standard.

---

## 2. AI Meeting Summarizer — Add Voice Recording, Duration Presets, Live Transcription

**Problem**: The current AIMeetingSummarizerPremium only accepts pasted text. No microphone, no recording, no live session capability.

**Changes to `src/components/ai-tools/premium/AIMeetingSummarizerPremium.tsx`**:

1. **Voice Recording with VoiceInputButton** — Add the existing `VoiceInputButton` component next to the notes textarea for quick voice-to-text (auto-translates any language)
2. **Live Session Recorder** — Add a "Start Recording Session" mode that uses `MediaRecorder` to continuously record and periodically transcribe chunks via the `voice-to-text` edge function. Shows live transcript as it listens.
3. **Duration Presets** — Replace free-text duration input with preset buttons: 5 min, 10 min, 15 min, 20 min, 30 min, 45 min, 60 min, Custom
4. **Auto-translation during recording** — Since `voice-to-text` already detects language and translates to English, show both original and translated text in real-time
5. **Auto-generated follow-up tasks** — After summarization, auto-create scheduled follow-up tasks (e.g., 3-day, 7-day, 14-day check-ins) with AI-generated messages based on meeting context
6. **AI response generation** — "Generate Response" button that creates contextual follow-up messages based on what the client requested

---

## 3. Meeting Intelligence Hub — Dedicated Owner Dashboard Section

**Problem**: Meeting Center exists at `/meeting-center` but is behind BrokerGuard. No dedicated owner hub for reviewing sessions, follow-ups, and task tracking.

**Changes**:

1. **Enhance `src/pages/MeetingCenter.tsx`** — Add it to owner navigation (currently broker-only). Add sections for:
   - Recorded sessions history (from `ai_job_master` where `tool_name = 'ai-meeting-summarizer'`)
   - Action items tracker (tasks created from meetings)
   - Follow-up timeline
   - AI-generated response suggestions

2. **Wire into Owner Command Center** — Add Meeting Hub link in the owner sidebar/quick actions alongside existing tools

3. **Route update in `src/App.tsx`** — Make Meeting Center accessible to owner (not just brokers)

---

## Summary of Files to Modify

| File | Change |
|------|--------|
| `src/pages/BuyerFAQ.tsx` | Replace placeholder with real FAQ content |
| `src/pages/SellerFAQ.tsx` | Replace placeholder with real FAQ content |
| `src/pages/LandlordFAQ.tsx` | Replace placeholder with real FAQ content |
| `src/pages/TenantFAQ.tsx` | Replace placeholder with real FAQ content |
| `src/components/ai-tools/premium/AIMeetingSummarizerPremium.tsx` | Add voice recording, live session, duration presets, auto-translation, follow-up generation |
| `src/pages/MeetingCenter.tsx` | Enhance with session history, task tracking, follow-up timeline |
| `src/App.tsx` | Allow owner access to Meeting Center |

