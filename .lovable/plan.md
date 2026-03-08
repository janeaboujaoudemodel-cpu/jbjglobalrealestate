

# Fix Meeting Center & AI Meeting Summarizer — UI, Voice, CRM Lead Integration

## Issues Identified

### Meeting Center (`MeetingCenter.tsx` + subcomponents)
1. **"Add Call Summary" hover text** — white text on dark bg with poor contrast on hover
2. **"View Details" button** — gray `text-zinc-400` blends into `bg-zinc-900` background
3. **Audio Upload/Record buttons** — `border-orange-500/50 text-orange-400` too faded on dark background
4. **All sections need champagne gold upgrade** — currently dark/violet theme, inconsistent with platform standard

### AI Meeting Summarizer (`AIMeetingSummarizerPremium.tsx`)
1. **Remove session duration presets** — only show duration AFTER session ends (already partially done, but clean up any remnants)
2. **Remove standalone VoiceInputButton next to textarea** — the Live Session Recorder should auto-populate notes, no separate mic needed
3. **Live session auto-generates notes** — transcript feeds directly into notes during recording
4. **Save sessions to backend** — store full transcript + audio reference in `ai_job_master` for Meeting Center history
5. **Translation toggle during recording** — user selects target language, live translation shown inline
6. **AI assistant always live during session** — show property suggestions, response drafts, action items in real-time

### CRM Lead Integration (NEW)
1. **Add Lead / Search Lead** — search `crm_leads` by name/phone, link to meeting
2. **Add New Lead** — if not found, auto-create from entered name/phone with pre-fill
3. **Auto-update lead** — after meeting, update lead with meeting date, notes, next steps
4. **Participant linking** — link meeting participants to CRM leads

---

## Implementation Plan

### 1. Fix Meeting Center UI (MeetingCenter.tsx + SummaryCard.tsx + InlineCallSummarizer.tsx)

**SummaryCard.tsx:**
- Change "View Details" button from `text-zinc-400` to `text-white bg-zinc-800 border border-zinc-600` for visibility
- Ensure all text is readable against dark backgrounds

**InlineCallSummarizer.tsx:**
- Change trigger button text/hover to high-contrast (white text, gold accents)
- Fix Upload/Record buttons: use solid `bg-orange-600 text-white` instead of faded outlines
- Fix all labels to be `text-zinc-200` not `text-zinc-300`

**MeetingCenter.tsx:**
- Upgrade all section styling for consistency with champagne gold where applicable on cards

### 2. Fix AI Meeting Summarizer (AIMeetingSummarizerPremium.tsx)

- **Remove VoiceInputButton** from textarea section — Live Session Recorder handles everything
- **Auto-populate notes from live transcript** (already done, just remove redundant mic)
- **Only show session duration after recording stops** (already implemented, verify clean)
- **Add translation language selector** — dropdown to pick target translation language during recording
- **Save session data** — after summarization, store full transcript in `ai_job_master.output_payload`

### 3. Add CRM Lead Search & Link (AIMeetingSummarizerPremium.tsx)

Add a new section in Meeting Details:
- **Search Lead** input — queries `crm_leads` by `full_name` or `phone_e164` with debounced search
- **Select Lead** — shows matching results, click to link as participant
- **Add New Lead** button — if no results, creates lead in `crm_leads` with name/phone from search input
- **Auto-update lead after meeting** — insert activity record and update `crm_leads.updated_at` with meeting context

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/meeting-center/SummaryCard.tsx` | Fix View Details button contrast |
| `src/components/meeting-center/InlineCallSummarizer.tsx` | Fix all button/text contrast, upgrade Upload/Record buttons |
| `src/pages/MeetingCenter.tsx` | Minor contrast fixes on hover states |
| `src/components/ai-tools/premium/AIMeetingSummarizerPremium.tsx` | Remove redundant VoiceInputButton, add CRM lead search/link, add translation selector, save sessions to backend |

