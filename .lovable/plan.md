

# Comprehensive Fix & Enhancement Plan

This is a very large set of requests. I will break them into prioritized phases to implement systematically.

---

## Phase 1: Critical Fixes — AI Meeting Summarizer

### 1A. Fix "Generate Response" failure
The `handleGenerateResponse` calls `supabase.functions.invoke('lovable-ai')` — but no `lovable-ai` edge function exists. Must create it or reroute to the AI gateway directly via a new edge function.

**Fix**: Create `supabase/functions/lovable-ai/index.ts` — a general-purpose AI proxy that accepts `model`, `messages`, and `prompt` parameters and forwards to `https://ai.gateway.lovable.dev/v1/chat/completions`.

### 1B. Fix blinking recording indicator
Replace `animate-pulse` on the Stop Recording button with a stable red state. Keep the small dot pulsing but make the button itself stable.

### 1C. Add Pause/Resume to recorder
Add a `isPaused` state. On pause, call `mediaRecorder.pause()`. On resume, call `mediaRecorder.resume()`. After stop, show "Session ended" with duration and date.

### 1D. Fix transcription speed — reduce chunk interval from 15s to 5s
Change `14000` ms threshold to `4000` ms for faster chunk processing. Also upgrade the model in `voice-to-text` from `gemini-2.5-flash` to `gemini-2.5-pro` for better accuracy.

### 1E. Add Save/Delete/Draft logic
After recording stops, show Save and Delete buttons. If saved, persist to `ai_job_master`. If deleted, discard. If neither (abandoned), auto-save as draft with 30-day expiry.

### 1F. Fix property search showing irrelevant/zero-price results
Add `NOT NULL` and `> 0` filters on `price_from`. Only show properties if meeting notes contain property-related keywords.

### 1G. Show Properties/Mortgage/Response LIVE during recording (not after)
Move the CRM Tools Tabs (properties, mortgage) and AI Response Generator above the results section so they're visible during the recording session, not only after summarization.

### 1H. Add ALL languages to translation selector
Expand from 10 languages to 30+ (add Portuguese, Italian, Japanese, Korean, Thai, Vietnamese, Indonesian, Malay, Urdu, Tagalog, Bengali, Swahili, Dutch, Polish, Ukrainian, Romanian, Czech, Greek, Hebrew, etc.)

---

## Phase 2: Role Selection & Onboarding Enhancement

### 2A. Enhance `StandardUserDashboard.tsx` role selection
- Add "Broker + Investor (Both)" as a 5th card option
- For Broker: add RERA number field + expiry date validation
- For Investor: add optional document upload (SPA + Emirates ID)
- For Both: require broker RERA + investor document upload

### 2B. Post-selection verification flow
- After role selection, if broker → show RERA upload prompt
- If investor → show optional SPA + Emirates ID upload with "Verify Later" option
- Store verification status in a new `user_verifications` table

### 2C. Verified badge system
- Verified broker (active RERA) → blue tick
- Verified investor (SPA + Emirates ID + face match) → blue tick + "Verified Investor" label
- Award 100 points on verification completion

### 2D. Face verification (simplified)
- Use device camera to capture a selfie
- Compare against the uploaded Emirates ID photo using AI (Gemini vision)
- Require liveness check: prompt user to blink or turn head
- Create `supabase/functions/ai-face-verification/index.ts` edge function

### 2E. Verification email notifications
- On submission: "Your verification is under review"
- On approval: "Congratulations! Your profile is now verified"
- Use existing email infrastructure

---

## Phase 3: Role-Based Content in AI Hub

### 3A. Broker-specific content
- If user role = broker, show "Join JBJ Broker Hub" CTA
- Show broker profile card (registered vs not registered status)
- Show broker guides, RERA resources, points/tier
- Show recommended broker education content

### 3B. Investor-specific content
- If user role = investor, show investor guides, ROI tools
- Show verification status and benefits of verifying

### 3C. Combined mode
- If both, show both sets of content

---

## Phase 4: Owner Sidebar & Shortcut Updates

### 4A. Update `OwnerSidebarNav.tsx`
Add missing shortcuts:
- AI Meeting Summarizer → `/ai-meeting-summarizer` (under AI & TOOLS)
- Marketing Hub → `/admin/marketing-hub` (verify correct path)
- CRM Employees → `/crm/employees` (under ADMIN)

---

## Phase 5: Create `lovable-ai` Edge Function

This is blocking multiple features (Generate Response, Admin AI Assistant, Campaign Editor).

**File**: `supabase/functions/lovable-ai/index.ts`
- Accept `prompt` or `messages` + optional `model`
- Forward to `https://ai.gateway.lovable.dev/v1/chat/completions`
- Return the AI response
- Handle 429/402 errors

---

## Files to Create/Modify

| File | Change |
|------|--------|
| `supabase/functions/lovable-ai/index.ts` | **CREATE** — General AI proxy edge function |
| `supabase/functions/voice-to-text/index.ts` | Upgrade model to `gemini-2.5-pro` for accuracy |
| `src/components/ai-tools/premium/AIMeetingSummarizerPremium.tsx` | Fix blinking, add pause/resume, reduce chunk interval, save/delete/draft, show tools during recording, expand languages, fix property search |
| `src/components/dashboard/StandardUserDashboard.tsx` | Add "Both" role, RERA/document upload fields, verification flow |
| `src/components/owner-dashboard/OwnerSidebarNav.tsx` | Add missing nav shortcuts |
| `supabase/config.toml` | Add `lovable-ai` function config |

### Database Migration Needed
- `user_verifications` table (user_id, type, document_urls, face_photo_url, status, verified_at, expires_at)
- Points award on verification

---

## Priority Order
1. **Phase 5** — Create `lovable-ai` edge function (unblocks Generate Response)
2. **Phase 1A-1H** — Fix all Meeting Summarizer issues
3. **Phase 4** — Update sidebar shortcuts
4. **Phase 2** — Role selection & verification
5. **Phase 3** — Role-based AI Hub content

