

# Fix Plan: Enhanced Register Interest Form + Contact Card Hover Reversal

## 1. Enhance the "Register Interest" Form (ConsultationRequestForm)

**Problem:** The Register Interest form on project detail pages is too wide/stretched and lacks the qualification fields that exist in the "Request a Callback" section (preferred language, preferred time to call, preferred contact method). The user wants more lead qualification and consistent source tracking.

**File:** `src/components/ConsultationRequestForm.tsx`

**Changes:**
- **Narrower layout:** Add `max-w-lg mx-auto` to the form container to pull it in from the edges
- **Add qualification fields** from CallToActionSection pattern:
  - Nationality dropdown (same list as LeadCapturePopup)
  - Preferred Language dropdown (with flag icons, from `getLanguageList()` -- already imported pattern from CallToActionSection)
  - Preferred Time to Call (Morning/Afternoon/Evening/Anytime)
  - Preferred Contact Method (Phone Call/WhatsApp/Email/Video Call)
  - Budget Range (optional text input)
  - Purchase Timeline (already exists as "Timeline" -- keep it)
- **Source tracking:** The form already passes `source` as `project-interest-{projectId}` or `properties-consultation`. Ensure these are saved properly in `crm_leads`. The `captureLead` function via the edge function already handles this.
- **Update form schema** with zod to include the new optional fields
- **Update `captureLead` call** to pass nationality and language data

## 2. Reverse WhatsApp and Call Us Card Hover Logic

**Problem:** In DirectContactCTA (used globally), WhatsApp and Call Us cards are currently elevated with shadow by default (`shadow-[0_8px_25px_...] -translate-y-1`) and flatten on hover (`hover:shadow-none hover:translate-y-0`). User wants the reverse: flat by default, elevated on hover.

### File A: `src/components/DirectContactCTA.tsx` (lines 130-159)

**WhatsApp card (line 132):** 
- Current: `shadow-[0_8px_25px_rgba(16,185,129,0.4)] -translate-y-1 hover:border-emerald-500 hover:shadow-none hover:translate-y-0`
- New: `hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] hover:-translate-y-1 border-emerald-500/40 hover:border-emerald-500`

**Call Us card (line 148):**
- Current: `shadow-[0_8px_25px_rgba(59,130,246,0.4)] -translate-y-1 hover:border-blue-500 hover:shadow-none hover:translate-y-0`
- New: `hover:shadow-[0_8px_25px_rgba(59,130,246,0.4)] hover:-translate-y-1 border-blue-500/40 hover:border-blue-500`

### File B: `src/components/CombinedContactNewsletter.tsx` (lines 21-42)

**WhatsApp card:**
- Current: `border-emerald-500/40 hover:border-emerald-500` and `hover:shadow-emerald-500/20`
- New: `border-emerald-500 shadow-lg shadow-emerald-500/20 hover:border-emerald-500/40 hover:shadow-none`

**Call Us card:**
- Current: `border-blue-500/40 hover:border-blue-500` and `hover:shadow-blue-500/20`
- New: `border-blue-500 shadow-lg shadow-blue-500/20 hover:border-blue-500/40 hover:shadow-none`

---

## Summary of Files to Change

| File | Change |
|------|--------|
| `src/components/ConsultationRequestForm.tsx` | Narrower layout; add nationality, language, preferred time, contact method fields; ensure source tracking |
| `src/components/DirectContactCTA.tsx` | Reverse WhatsApp and Call Us card hover states (flat default, elevated on hover) |
| `src/components/CombinedContactNewsletter.tsx` | Reverse WhatsApp and Call Us card hover states (highlighted default, flat on hover) |

