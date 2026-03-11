

## Plan: Enforce Login + Save Legal Agreements to Backend

### Problem
1. Visitors can browse the site without logging in — consent/agreement data is only stored in localStorage with an anonymous `visitor_id`, not tied to a real user account.
2. When users accept cookies, privacy policy, or terms, there's no legally-binding record linking the agreement to an authenticated user with the full document text.

### Solution

#### 1. Create `user_agreements` table (database migration)
Store every legal acceptance as a permanent, court-ready audit record:

```sql
CREATE TABLE public.user_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreement_type text NOT NULL, -- 'cookies_policy', 'privacy_policy', 'terms_conditions', 'content_license', 'business_card_privacy'
  agreement_version text NOT NULL DEFAULT '1.0',
  agreement_snapshot jsonb NOT NULL, -- full text of what they agreed to
  consent_details jsonb, -- e.g. cookie preferences, specific checkboxes
  ip_address text,
  user_agent text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_agreements ENABLE ROW LEVEL SECURITY;

-- Users can read their own agreements
CREATE POLICY "Users can view own agreements" ON public.user_agreements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can insert their own agreements  
CREATE POLICY "Users can insert own agreements" ON public.user_agreements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Owner can view all agreements (via security definer function)
CREATE POLICY "Owner can view all agreements" ON public.user_agreements
  FOR SELECT TO authenticated USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'janeaboujaoudenails@gmail.com'
  );
```

#### 2. Create `AuthGate` wrapper component
A component that wraps `MainLayoutWrapper` and checks if user is authenticated:
- **Not logged in** → Redirect to `/auth` with return URL
- **Logged in but no mode selected** → Redirect to `/welcome`
- **Logged in + mode selected** → Render children normally

This replaces the current open-access pattern. Auth page, welcome page, digital card, and sign document routes remain standalone (no gate).

**File**: `src/components/AuthGate.tsx` (new)

#### 3. Update `MainLayoutWrapper.tsx`
Wrap the outlet with `AuthGate` so all main layout routes require authentication.

#### 4. Update `CookiesConsentBanner.tsx`
- Instead of using anonymous `visitor_id`, use `auth.uid()` from the auth context
- On acceptance, insert into `user_agreements` with:
  - `agreement_type: 'cookies_policy'`
  - `agreement_snapshot`: Full cookies policy text (fetched or hardcoded version)
  - `consent_details`: The cookie preferences (essential/analytics/marketing)
  - `user_agent`, `accepted_at`
- Keep the `cookie_consents` table insert for backward compatibility

#### 5. Update `BusinessCardPrivacyNotice.tsx`
- On "Accept & Continue", save to `user_agreements` with `agreement_type: 'business_card_privacy'` and full privacy points text as snapshot.

#### 6. Update `ContentTermsAcceptance.tsx`  
- On acceptance, save to `user_agreements` with `agreement_type: 'content_license'` and full terms text as snapshot.

### Files

| File | Action |
|------|--------|
| Database migration | Create `user_agreements` table with RLS |
| `src/components/AuthGate.tsx` | New — force login for all main routes |
| `src/components/MainLayoutWrapper.tsx` | Wrap with AuthGate |
| `src/components/CookiesConsentBanner.tsx` | Save consent to `user_agreements` with user_id + full document text |
| `src/components/business-card/BusinessCardPrivacyNotice.tsx` | Save acceptance to `user_agreements` |
| `src/components/broker/ContentTermsAcceptance.tsx` | Save acceptance to `user_agreements` |
| `src/hooks/useAgreementSaver.ts` | New shared hook for saving agreements to backend |

### Key Design Decisions
- **Court-ready**: Every agreement stores the FULL text the user saw at the time of acceptance (snapshot), not just a reference
- **Auth-gated**: No anonymous browsing — all visitors must register/login first
- **Standalone exceptions**: `/auth`, `/welcome`, `/403`, `/card`, `/sign/:token`, `/ticket-survey` remain accessible without login
- **Backward compatible**: Existing `cookie_consents` table continues to receive data alongside the new `user_agreements` table

