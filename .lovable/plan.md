

# "Stay in the Loop" Newsletter System -- Full Implementation Plan

This is a comprehensive, multi-phase implementation covering smart subscription, welcome emails, real unsubscribe/resubscribe, wired account toggles, behavioral tracking, AI segmentation, and Excel export.

---

## Phase 1: Database Schema (New Tables + Alter Existing)

### 1A. Enhance `newsletter_subscribers` table
Add missing columns to the existing table:
- `full_name` (text)
- `phone` (text)
- `user_id` (uuid, nullable)
- `consent_version` (text, default '1.0')
- `gdpr_consent_at` (timestamptz)
- `last_email_sent_at` (timestamptz)
- `preference_tags` (jsonb, default '[]') -- stores category preferences like "new_launches", "market_intelligence", etc.
- `resend_message_id` (text) -- last welcome email message ID
- `unsubscribe_source` (text) -- "email_link", "settings_toggle", "support"

### 1B. Create `newsletter_events` table
Logs every subscribe/unsubscribe/toggle/preference change event:
- `id` (uuid PK)
- `email` (text, not null)
- `user_id` (uuid, nullable)
- `event_type` (text: subscribe, unsubscribe, resubscribe, toggle_off, toggle_on, preference_update)
- `source` (text: footer, popup, project_page, email_link, settings_toggle)
- `metadata` (jsonb)
- `created_at` (timestamptz)

RLS: Insert allowed for anon+authenticated (via edge function with service role). Select restricted to own user_id or service role.

### 1C. Create `user_profile_summaries` table
Stores AI-derived user intelligence:
- `id` (uuid PK)
- `email` (text, unique, not null)
- `user_id` (uuid, nullable)
- `full_name` (text)
- `phone` (text)
- `subscribed` (boolean)
- `subscribed_at` (timestamptz)
- `last_active_at` (timestamptz)
- `device_type` (text)
- `sessions_count` (integer)
- `avg_time_on_site` (integer)
- `top_areas` (text)
- `top_projects` (text)
- `avg_budget_estimate` (text)
- `preferred_bedrooms` (text)
- `preferred_property_type` (text)
- `viewed_count` (integer)
- `saved_count` (integer)
- `inquiries_count` (integer)
- `tools_used` (text)
- `intent_score` (text: low/medium/high)
- `engagement_score` (integer, 0-100)
- `segment_tag` (text: Luxury Buyer, Mid-Market Investor, Off-Plan Focused, etc.)
- `recommended_campaign_tag` (text)
- `ai_summary` (text)
- `preference_tags` (jsonb)
- `updated_at` (timestamptz)

RLS: Service role only for writes. Authenticated users can read their own row.

### 1D. Add `unsubscribe_token` to `newsletter_subscribers`
A unique token (uuid) for secure one-click unsubscribe links in emails. Generated on subscribe.

---

## Phase 2: Edge Functions (Backend Logic)

### 2A. Rewrite `newsletter-subscribe` (subscribe-newsletter)
Consolidate into one smart endpoint:
- Accept: `email`, `full_name`, `phone`, `source`, `page_source`, `gdpr_consent`
- Check if email exists in `leads` table (known user logic)
- Upsert into `newsletter_subscribers` with all fields, generate `unsubscribe_token`
- Log event in `newsletter_events` (type: "subscribe")
- Call `welcome-subscriber` to send welcome email
- Return `{ success, isKnownUser, requiresDetails }` -- tells frontend whether to show the detail modal

### 2B. Create `unsubscribe-newsletter` edge function
- Accept: `token` (unsubscribe_token from email link) OR `email` + auth
- Update `newsletter_subscribers`: `is_active = false`, `unsubscribed_at = now()`, `unsubscribe_source`
- Log event in `newsletter_events` (type: "unsubscribe")
- Update `profiles.marketing_consent = false` if user_id is linked
- Return success JSON

### 2C. Create `resubscribe-newsletter` edge function
- Accept: `email` or `token`
- Update `newsletter_subscribers`: `is_active = true`, `subscribed_at = now()`, clear `unsubscribed_at`
- Log event (type: "resubscribe")
- Return success

### 2D. Create `update-email-preferences` edge function
- Accept: `email` or auth user, `preferences` (array of category strings), `marketing_enabled` (boolean)
- Update `newsletter_subscribers.preference_tags`
- If `marketing_enabled` changed, update `is_active` and log toggle event
- Sync `profiles.marketing_consent` if authenticated
- Return success

### 2E. Upgrade `welcome-subscriber` edge function
Rebuild the welcome email HTML:
- Table-based layout (email-safe), 600px max-width
- JBJ dark gradient header with gold logo text
- Personalized greeting: "Dear {{First Name | Valued Member}}"
- Content listing the 6 benefit categories
- Two CTA buttons: [Manage Preferences] linking to `/email-preferences?token=...` and [Unsubscribe] linking to `/unsubscribe?token=...`
- Footer with compliance text, active support email
- From: `JBJ Global Real Estate <info@jbj.ae>`
- Reply-to: `contact@jbj.ae`
- Store `resend_message_id` in subscriber record

### 2F. Create `summarize-user-profiles` edge function (cron-triggered)
- Query `user_journey_events`, `user_activity_log`, `user_behavior_tracking`, `leads`, `newsletter_subscribers`
- For each unique email/user, compute:
  - Top areas/projects from page views
  - Budget estimate from price filters in event_data
  - Preferred bedrooms/property types from filter usage
  - Session count, avg time, device type
  - Intent score (based on inquiry count + time + recency)
  - Engagement score (0-100)
  - Segment tag classification
  - AI summary text
- Upsert results into `user_profile_summaries`

---

## Phase 3: Frontend -- Smart Subscribe Flow

### 3A. Rebuild `NewsletterBrevo` component with smart logic
Replace the current fire-and-forget approach:
1. User enters email, clicks Subscribe
2. Call `newsletter-subscribe` edge function
3. If response says `isKnownUser = true` -- show immediate success
4. If `isKnownUser = false` -- show detail-collection modal:
   - Title: "Email received successfully"
   - Subtitle: "To personalize what you receive, please add your details."
   - Fields: Full Name, Phone (with UAE +971 prefix, global allowed)
   - GDPR consent checkbox
   - On submit: call `newsletter-subscribe` again with full details
5. Show `SubscriptionSuccessModal` with updated copy ("You're In.")
6. Include note: "You can unsubscribe anytime from the email or from My Account > Settings"

### 3B. Create `/unsubscribe` page
- Route: `/unsubscribe?token=xxx`
- On load: call `unsubscribe-newsletter` with token
- Show confirmation: "You Have Been Unsubscribed" with premium styling
- Include [Resubscribe] button that calls `resubscribe-newsletter`
- Show success state after resubscribe

### 3C. Create `/email-preferences` page
- Route: `/email-preferences?token=xxx`
- Title: "Manage Your Email Preferences"
- 6 checkbox categories: New Project Launches, Market Intelligence, Investment Opportunities, Developer Promotions, Platform Updates, Event Invitations
- Master toggle: "Receive Marketing Emails"
- Save button calls `update-email-preferences`
- Toast confirmation on save

### 3D. Wire UserProfile settings toggle to real backend
Update `handleEmailNotificationsToggle` in `UserProfile.tsx`:
- Instead of only updating `auth.updateUser` metadata, also call `update-email-preferences` edge function
- Sync `newsletter_subscribers.is_active` with toggle state
- Log event in `newsletter_events`
- If toggling OFF: show confirmation "You will no longer receive marketing emails"
- If toggling ON: show "Marketing emails enabled. You can manage categories in Email Preferences."
- Add "Newsletter: Subscribed/Unsubscribed" status display
- Add "Manage Preferences" link to `/email-preferences`

---

## Phase 4: Admin -- Segmentation + Export

### 4A. Create "JBJ Global Research Users" admin panel
Add a new tab or section in the Owner dashboard:
- Table view of `user_profile_summaries` with all columns
- Filters: segment tag, budget band, area, device, engagement score, intent score
- Search by email/name
- Sort by any column

### 4B. Excel/CSV Export
- "Export Excel" button generates `.xlsx` using `exceljs` (already installed)
- "Export CSV" button generates `.csv`
- Filename: `JBJ-Global-Research-Users-YYYY-MM-DD.xlsx`
- All 23+ columns from user_profile_summaries
- Filtered export (only exports what matches current filters)

---

## Phase 5: Event Tracking Enhancement

### 5A. Enhance `useUserTracking` hook
Add batching logic:
- Queue events in memory, flush every 5 seconds or on page unload
- Track filter usage with structured data (price_range, bedrooms, area, property_type)
- Map anonymous session to email when user identifies (subscribe, lead capture, login)
- Store search queries with parameters

### 5B. Link tracking to subscriber identity
When a user subscribes via "Stay in the Loop":
- Retroactively update `user_journey_events` rows matching the session_id with the email
- Store the mapping in `newsletter_subscribers.user_id` if authenticated

---

## Phase 6: Compliance + Security

### 6A. GDPR consent
- Add consent checkbox to subscribe form: "I consent to receive marketing communications from JBJ Global Real Estate"
- Store `gdpr_consent_at` timestamp
- Include in email footer: "You are receiving this email because you opted in on jbj.ae"

### 6B. Campaign sending rules (built into edge functions)
- Before any marketing email send, check:
  - `newsletter_subscribers.is_active = true`
  - `profiles.marketing_consent = true` (if user exists)
  - Not in unsubscribed state
- Always include unsubscribe link

### 6C. RLS policies
- `newsletter_subscribers`: anon can insert (via edge function service role), authenticated can read/update own row
- `newsletter_events`: service role insert, authenticated can read own
- `user_profile_summaries`: service role write, authenticated read own, owner read all

### 6D. Rate limiting
- Subscription endpoint: max 5 per email per hour (handled in edge function)
- Prevent email enumeration: always return success regardless of known/unknown status to external callers

---

## Technical Details

### New files to create:
- `src/pages/Unsubscribe.tsx` -- unsubscribe landing page
- `src/pages/EmailPreferences.tsx` -- manage preferences page
- `src/components/admin/ResearchUsersPanel.tsx` -- admin segmentation view
- `supabase/functions/unsubscribe-newsletter/index.ts`
- `supabase/functions/resubscribe-newsletter/index.ts`
- `supabase/functions/update-email-preferences/index.ts`
- `supabase/functions/summarize-user-profiles/index.ts`

### Files to modify:
- `src/components/marketing/NewsletterBrevo.tsx` -- smart conditional logic
- `src/components/marketing/SubscriptionSuccessModal.tsx` -- updated copy
- `supabase/functions/newsletter-subscribe/index.ts` -- known-user detection
- `supabase/functions/welcome-subscriber/index.ts` -- premium table-based email with unsubscribe links
- `src/pages/UserProfile.tsx` -- wire toggle to real backend
- `src/hooks/useUserTracking.ts` -- event batching
- `src/App.tsx` or router file -- add `/unsubscribe` and `/email-preferences` routes
- Owner dashboard -- add Research Users tab

### Existing infrastructure leveraged:
- `RESEND_API_KEY` secret (already configured)
- `leads` table for known-user detection
- `user_journey_events` + `user_activity_log` + `user_behavior_tracking` for behavioral data
- `profiles` table for marketing_consent sync
- `exceljs` package (already installed) for Excel export
- `capture-lead` edge function (unchanged, still called in parallel)

### Verification steps after implementation:
1. Subscribe as unknown user -- confirm two-step flow (email then details modal)
2. Subscribe as known lead -- confirm single-step flow
3. Check welcome email received with correct layout and working unsubscribe/preferences links
4. Click unsubscribe link -- confirm landing page and database update
5. Resubscribe from landing page -- confirm reactivation
6. Toggle OFF in UserProfile settings -- confirm `is_active = false` in database
7. Toggle ON -- confirm resubscribe logged
8. Visit Email Preferences page -- save categories, confirm stored
9. Export "JBJ Global Research Users" as Excel -- verify all columns populated
10. Verify no marketing email sends to unsubscribed users

