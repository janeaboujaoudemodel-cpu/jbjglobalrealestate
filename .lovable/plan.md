
## What’s happening (root causes found immediately)

### 1) “Stay in the Loop” email submit fails
There are **two different newsletter implementations** in the codebase, and both currently have breaking issues:

1) **Project detail newsletter** (`src/components/project-detail/NewsletterSection.tsx`)
- It inserts into `leads` with:
  - `source: "newsletter-project-detail"` (this source is **NOT allowed** by the current public insert policy)
  - `lead_type: "newsletter"` (**column does not exist** on `public.leads`)
- Result: the insert will throw an error, so the UI shows failure / “try again”.

2) **Global/footer newsletter** (`src/components/marketing/NewsletterBrevo.tsx`, used by Footer/NewsletterBand/CombinedContactNewsletter)
- It calls backend functions:
  - `capture-lead` (exists, but currently imports `esm.sh` for the backend client which has been a known bundling/deploy risk in this project)
  - `newsletter-subscribe` (**function is referenced by frontend but the backend function folder does not exist**, so the call will fail)
- Result: newsletter flow is not reliable; the UI can fail even if lead capture works, because the “subscribe to campaign” step is missing.

### 2) “Auto delete after 2 hours” is real and must be removed
Your backend schema and storage setup explicitly encode 2-hour expiry:
- `video_studio_jobs.expires_at DEFAULT now() + interval '2 hours'`
- `video_studio_assets.expires_at DEFAULT now() + interval '2 hours'`
- Storage bucket `video-processing-temp` has a cleanup function `cleanup_temp_video_files()` that deletes files older than 2 hours (and is intended to be run periodically).

This contradicts your requirement: **never delete unless user clicks delete + confirms permanent action**.

### 3) WhatsApp / Call / Email sometimes blocked or not opening
Across the app there is mixed behavior:
- Some places use `target="_blank"` links (often blocked in iframes / mobile)
- Some places use `window.open(...)` (often blocked by popup blockers)
- Some places correctly use `window.location.href` (most reliable on mobile/iframe)

To fix “blocked / not opening immediately”, we need to standardize to a single “direct navigation” behavior everywhere.

### 4) Footer alignment issues are caused by current footer layout structure
The footer nav grid currently uses **4 columns**, but each column contains **two stacked sections** (e.g., Properties + Services).  
You requested a clean layout where:
- Row 1 has 4 aligned categories (already conceptually true)
- Row 2 has another 4 aligned categories, with **Services next to Market Intelligence**, and **Broker Hub aligned next to Market Intelligence**, and **Careers in the same row alignment**
This requires restructuring the footer navigation into an actual **2-row × 4-column** section layout, with consistent title/divider heights.

---

## Delivery approach (no more “fix 1 thing, break 1 thing”)
We’ll implement this as a controlled set of “locking” changes:
1) Fix newsletter end-to-end with backend persistence + campaign sync
2) Remove all auto-expiry and auto-deletion for user projects/assets
3) Standardize external action buttons (WhatsApp/Call/Email) with reliable navigation
4) Only then proceed to visual alignment and larger tool consolidation work

Each phase includes a strict regression checklist before moving on.

---

## Phase A — Newsletter hotfix (must save in backend and work everywhere)

### A1) Fix project-detail newsletter to not break
Change `src/components/project-detail/NewsletterSection.tsx`:
- Remove invalid field `lead_type`
- Stop inserting directly into `public.leads` from the client
- Reuse the existing “backend lead capture” approach (same as global newsletter) so it consistently saves even with strict policies:
  - Call backend function `capture-lead` with:
    - `email`
    - `fullName` optional
    - `source: "newsletter"`
    - `subSource: "Project Detail"`
    - `pageSource: current pathname`
- Keep the same UX (loading state + success state + toast).

### A2) Implement the missing backend function for campaign sync: `newsletter-subscribe`
Create `supabase/functions/newsletter-subscribe/index.ts` that will:
- Validate input with strict schema:
  - email (required)
  - name (optional)
  - source, source_page
  - listId (optional; fall back to default secret)
- Save to backend table `newsletter_subscribers` (upsert by email, set `is_active=true`, record `source`, `source_page`, timestamps)
- Sync to Brevo using `BREVO_API_KEY` + `BREVO_LIST_ID` (already configured as secrets)
- Return success even if Brevo is temporarily down (but log it), so the user’s email is still saved in the backend.

### A3) Make lead capture backend function deployment-safe
Update `supabase/functions/capture-lead/index.ts`:
- Replace `https://esm.sh/@supabase/supabase-js@2` import with `npm:@supabase/supabase-js@2` (same fix pattern as other functions in this project)
- Add minimal structured logging for:
  - request accepted
  - leads upsert success/failure
  - crm_leads insert/update success/failure

### A4) End-to-end verification checklist (newsletter)
- Submit email from:
  - Footer “Stay in the Loop”
  - CombinedContactNewsletter
  - NewsletterBand
  - Project detail page newsletter
- Confirm backend inserts:
  - `leads` has the email
  - `crm_leads` created/updated
  - `newsletter_subscribers` created/updated
- Confirm UI:
  - Success modal opens (where applicable)
  - No console errors
- Confirm duplicates do not break (repeat same email twice).

---

## Phase B — Persistence & “Never auto delete” (video tools + creative suite)

### B1) Remove 2-hour expiry from user data tables
Database changes:
- Remove / neutralize `expires_at` behavior for:
  - `video_studio_jobs`
  - `video_studio_assets`
Options (we’ll implement the safest):
- Keep the column for compatibility but:
  - Set default to `NULL` (no expiry)
  - Remove any cleanup routines that delete based on it

### B2) Remove auto-delete cleanup for storage buckets
- Disable/replace `cleanup_temp_video_files()` so files are not deleted automatically.
- If we still need a “temp processing” bucket for intermediate files, we’ll:
  - Only delete intermediate files **after a successful export**, and only for those intermediate artifacts
  - Never delete the user’s project source assets

### B3) Introduce a persistent storage bucket for user projects/assets
Right now the only relevant buckets found:
- `video-processing-temp` (explicitly “temp”)
- `voice-samples`
There is no `studio-assets` bucket currently.

We will add:
- Bucket: `studio-assets` (private by default)
- Policies:
  - authenticated users can upload/read/update/delete their own assets (scoped by path conventions)
  - service role can manage processing outputs

### B4) Add explicit “Delete project” flow (with permanent confirmation)
Across any “project” style tool (Video Studio, Photo tools, etc.):
- Add a deletion modal:
  - Checkbox: “I understand this is permanent”
  - Button disabled until checked
- Deleting a project should delete:
  - database project record
  - associated assets (only those assets belonging to that project)
- Nothing else should be automatically deleted.

### B5) Verification checklist (persistence)
- Create a video project, upload assets, refresh page:
  - Project and assets still exist
- Wait > 2 hours (or simulate by changing timestamps in test):
  - Data still exists
- Delete project:
  - Confirm assets removed only after user confirmation

---

## Phase C — Fix WhatsApp / Call / Email blocked behavior (global audit)

### C1) Standardize to “direct navigation” action handlers
Use the existing helper: `src/components/ContactActions.tsx`
- Replace scattered `window.open(...)` and `target="_blank"` WhatsApp links with:
  - `openWhatsApp({ whatsappMessage })` → uses `window.location.href` (most reliable)
- For call/email:
  - always use direct `window.location.href = tel/mailto`

### C2) Add a premium fallback when blocked
If navigation fails (common inside embedded contexts):
- Show a small modal/toast with:
  - Copy phone number button
  - Copy WhatsApp message button
  - Show QR code (optional enhancement) to open WhatsApp on phone

### C3) Verification checklist (contact actions)
- Test on:
  - desktop browser
  - mobile Safari/Chrome
  - in-app/embedded contexts (where popup blockers are strict)
- Verify:
  - WhatsApp opens without “API blocked” behavior
  - call opens dialer
  - email opens mail client

---

## Phase D — Footer “navigator card” fill + alignment fixes

### D1) Make the internal champagne card fill to the gold border line
In `src/components/Footer.tsx`:
- Remove the inner layer’s side margins (`mx-4 sm:mx-6 ...`) so it reaches the border
- Keep padding inside, but align the container edge-to-edge within the gold frame

### D2) Restructure navigation into true 2-row × 4-col sections
Implement consistent footer nav sections:
- Row 1: Properties | Investor Hub | Guides | About
- Row 2: Services | Broker Hub | Market Intelligence | Careers
Each section:
- Same title height (min height)
- Same divider style
- Same spacing

### D3) Verification checklist (footer)
- Desktop + mobile:
  - titles and dividers line up perfectly
  - “Services / Broker Hub / Market Intelligence / Careers” are aligned on the same row

---

## Phase E — Toolkit restructuring + premium per-tool color theme (bigger feature work)

### E1) Merge Voice Studio + Captions/Translate + Beauty Filters into AI Video Studio
- Keep routes for backward compatibility, but redirect them into Video Studio sub-sections:
  - `/toolkit/voice-studio` → `/toolkit/ai-video-studio?tab=voice`
  - `/toolkit/captions-translate` → `...tab=captions`
  - `/toolkit/beauty-filters` → `...tab=beauty`
- AI Video Studio becomes the single “Video Master Tool” container.

### E2) Add a Tool Theme System (one accent color per tool)
Create a shared pattern:
- `ToolPageShell` + `TOOL_THEME` map
- Each tool page defines:
  - accent color
  - gradient background
  - border/button focus styles
- Apply to:
  - Toolkit hub pages
  - Property tools (keep current strong themed pages like Property Evaluator as reference)

### E3) “Empty tools” become real tools (MVP scope first)
Implement MVP versions:
- AI Virtual Staging (image in → staged image out, persistent storage)
- AI Investment Report (property inputs → structured report + downloadable PDF, saved)
- AI Image Generator (prompt → image output, saved)
All use backend AI calls (Lovable AI gateway), never client-side prompts.

---

## Phase F — Specific tool fixes requested

### F1) Business Card Scanner camera auto-opens and doesn’t close
Cause: `BusinessCardCamera` auto-starts the camera on mount, and Tabs may keep it mounted even when hidden.
Fix:
- Remove “auto-start on mount” behavior (or gate behind a user toggle)
- Stop camera when tab changes away from “Camera”
- Add explicit “Close Camera” button that always stops tracks

### F2) Video Meet microphone/meeting reliability
Likely issues:
- double media streams (page gets one stream, manager gets another)
- permissions and device selection edge cases
Fix:
- Make WebRTC manager accept and reuse the already-acquired local stream
- Add stronger device/permission error states
- Ensure leaving meeting always stops tracks

### F3) Calendar & Notes must save and show on date cells
Currently `AICalendar.tsx` uses localStorage; user wants backend persistence and visible event markers.
Fix:
- Add backend tables:
  - calendar_projects
  - calendar_events
  - calendar_notes
- Load per user; show event “dot/badge” on calendar day cells; highlight “today has events”

### F4) Broker-only visibility (Objection handler, broker tools)
- Gate these pages and nav entries by broker role / broker mode
- Ensure client/investor never sees them (UI + route guards + backend policies)

### F5) Admin-only AI Contract Reviewer (very large; separate epic)
We will implement as an admin-only secure workspace:
- Requires admin role (not email string checks)
- AI chat + voice input (voice-to-text) + contract upload
- Backend-only AI prompts, with:
  - Dubai-specific context
  - strong disclaimer that this is informational assistance (not a lawyer)
- Secure storage of uploaded documents
- Full audit logging of access

---

## Execution order (what we will implement first once you approve this plan)
1) Newsletter hotfix (A1–A4) — restores “Stay in the Loop” saving + campaign sync
2) Persistence changes (B1–B5) — remove auto deletion everywhere
3) WhatsApp/Call/Email audit + standardization (C1–C3)
4) Footer alignment + fill fixes (D1–D3)
5) Toolkit consolidation + theming (E1–E3)
6) Business card / video meet / calendar fixes (F1–F3)
7) Broker-only gating + Admin-only Contract Reviewer epic (F4–F5)

---

## Regression checklist we will run after each phase
- Newsletter submit from footer + project pages
- Support ticket submit still works
- No console errors on homepage + footer
- WhatsApp/Call/Email open from at least 3 key sections
- No layout shift in footer (mobile/desktop)
- No unexpected deletions of stored assets/projects
