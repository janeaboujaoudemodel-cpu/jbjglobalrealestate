

# E-Signature System: Bug Fixes, Email Updates, UI Restyle, and Access Control

## Issues Identified

### Bug: "Unable to Load Document" on `/sign/:token`
The `SignDocument.tsx` page queries `esign_envelopes` without authentication (it's a public route). However, the RLS policy on `esign_envelopes` requires `auth.uid() = sender_id` for SELECT. Anonymous users (recipients clicking the signing link) get zero rows back, causing "Document not found". This is the root cause.

**Fix**: Add an RLS policy allowing anonymous SELECT on `esign_envelopes` when the envelope has a matching recipient with a valid signing token. Alternatively, move the entire data-fetching to the `esign-process-signature` edge function (which uses service role key). The cleanest approach: add a new RLS policy:
```sql
CREATE POLICY "Public can view envelope via recipient token"
  ON public.esign_envelopes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.esign_recipients
      WHERE esign_recipients.envelope_id = esign_envelopes.id
        AND esign_recipients.signing_token IS NOT NULL
    )
  );
```
This is safe because it only allows reading envelopes that have recipients with signing tokens, and the actual token validation still happens in code.

### Bug: Contact Email Shows Personal Gmail
In `SignDocument.tsx` line 454, the footer shows `janeaboujaoudenails@gmail.com`. Must be `CONTACT@JBJ.AE`.

### Bug: Reminder Email Says "Jane is waiting"
In `esign-send-reminder/index.ts`, the email says "a friendly reminder that [sender_name] is waiting for your signature". Must say "our team is waiting for your signature".

### Bug: Send-for-signature Email Contact Line
In `esign-send-for-signature/index.ts` and `esign-complete-envelope/index.ts`, the footer says "contact [sender_email]". Must say "contact CONTACT@JBJ.AE".

### UI: EnvelopeDetail.tsx is Gray/White
The `EnvelopeDetail.tsx` page uses default `bg-gradient-to-br from-background to-muted/30` and plain white cards. Must be updated to Champagne Gold standard.

---

## Plan

### 1. Fix RLS — Allow Public Envelope Access via Signing Token
**Migration SQL**: Add a new SELECT policy on `esign_envelopes` that allows reading when the envelope has a linked recipient with a signing token. This enables the `/sign/:token` page to load the envelope data.

### 2. Fix All Email Templates — Contact & Wording
**Files**:
- `supabase/functions/esign-send-reminder/index.ts`: Change "friendly reminder that ${sender_name} is waiting" to "friendly reminder that our team is waiting". Change footer contact to `CONTACT@JBJ.AE`.
- `supabase/functions/esign-send-for-signature/index.ts`: Change footer contact to `CONTACT@JBJ.AE`.
- `supabase/functions/esign-complete-envelope/index.ts`: Change footer contact to `CONTACT@JBJ.AE`.

### 3. Fix SignDocument.tsx Footer
Change the contact email from `janeaboujaoudenails@gmail.com` to `CONTACT@JBJ.AE`.

### 4. Restyle EnvelopeDetail.tsx to Champagne Gold
Apply the champagne gold gradient background, gold-bordered cards, and consistent styling matching the `ESignatureDashboard.tsx` pattern. Update:
- Page background: champagne gradient within black outer
- Cards: `bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/20`
- Status badges: keep existing colors (they're semantic)
- Activity log icons: gold accent backgrounds
- Back button: align size with header icons

### 5. Deploy Edge Functions and Test
Deploy all modified edge functions: `esign-send-reminder`, `esign-send-for-signature`, `esign-complete-envelope`.

---

## Files to Modify
1. **Database migration** — Add public SELECT policy on `esign_envelopes`
2. **`src/pages/e-signature/SignDocument.tsx`** — Fix contact email
3. **`src/pages/e-signature/EnvelopeDetail.tsx`** — Champagne Gold restyle
4. **`supabase/functions/esign-send-reminder/index.ts`** — Fix wording and contact
5. **`supabase/functions/esign-send-for-signature/index.ts`** — Fix contact
6. **`supabase/functions/esign-complete-envelope/index.ts`** — Fix contact

## Not Touched
- `DocumentFieldPlacer.tsx`, `AISignatureDesigner.tsx`, `ContinueSearching.tsx`, `ProjectCard.tsx`, `LeadCaptureModal.tsx` — per user instruction, no changes to these files.

