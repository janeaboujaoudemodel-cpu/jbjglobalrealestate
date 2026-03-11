

## Plan: User Intelligence Panel — Full Upgrade with Per-Page Timing, Demographics & Edge Function Deployment

### What This Delivers
A fully upgraded Intelligence Panel showing **every detail** about each user: full demographics (country, nationality, language, age), session timelines with login/logout times, per-page time-on-page breakdowns, and a redeployed edge function with the latest AI model.

---

### Phase 1: Upgrade `compute-user-scores` Edge Function

**File:** `supabase/functions/compute-user-scores/index.ts`

Current issues: function has no logs (likely not deployed or stale). Needs:
- Redeploy with latest infrastructure
- Add per-page time calculation from `visitor_events` (already tracks `time_on_previous_page_seconds` in `event_data`)
- Store per-page time breakdown in `user_interest_profile` (new JSONB column `page_time_breakdown`)
- Pull demographic data from `user_role_selections` (nationality, country, city, language, age_range) and store on the profile for fast reads
- Upgrade model reference for any AI calls to `google/gemini-3-flash-preview`

**New columns on `user_interest_profile`:**
- `page_time_breakdown` (jsonb) — `{ "/properties": 245, "/about": 30, ... }` seconds per page
- `nationality` (text)
- `country` (text)
- `city` (text)
- `preferred_language` (text)
- `age_range` (text)
- `login_history` (jsonb) — array of `{ started_at, ended_at, duration_seconds }` from `user_sessions`

---

### Phase 2: Upgrade AdminIntelligence UI — User Detail Dialog

**File:** `src/pages/admin/AdminIntelligence.tsx`

Add new sections to the user detail dialog:

1. **Demographics Card** — Show nationality, country, city, language, age range (from `user_role_selections` data now stored on profile)

2. **Session History Timeline** — Query `user_sessions` for the selected user, display each session as a row:
   - Login time → Logout time (or "Active")
   - Duration
   - Device / Browser / OS
   - Pages visited count

3. **Per-Page Time Breakdown** — Visual bar chart or ranked list showing:
   - Page path
   - Total seconds spent
   - Number of visits
   - Derived from `visitor_events` where `event_data->time_on_previous_page_seconds` exists

4. **Add columns to main table**: Country, Category (role)

5. **Upgrade loadUserDetails()**: Also fetch `user_sessions` with `started_at`, `ended_at`, `duration_seconds`, `device_type`, `browser`, `pages_visited` for the session history view

---

### Phase 3: Auth Enforcement Verification

The platform already enforces `AuthGate` on all main routes and requires category selection via `/welcome`. This is confirmed working:
- `AuthGate` wraps `MainLayoutWrapper` — redirects unauthenticated users to `/auth`
- After login, users without `jj_mode_selected` go to `/welcome` for category selection
- Categories: Investor, Broker, Developer (stored in `user_role_selections`)

No changes needed here — just confirming the restriction is already in place.

---

### Database Migration

```sql
ALTER TABLE user_interest_profile 
  ADD COLUMN IF NOT EXISTS page_time_breakdown jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS preferred_language text,
  ADD COLUMN IF NOT EXISTS age_range text,
  ADD COLUMN IF NOT EXISTS login_history jsonb DEFAULT '[]';
```

---

### Files Modified

| File | Changes |
|------|---------|
| DB migration | Add 7 columns to `user_interest_profile` |
| `compute-user-scores/index.ts` | Add demographics pull, per-page time calc, login history, redeploy |
| `AdminIntelligence.tsx` | Demographics card, session timeline, per-page time breakdown, extra table columns |

