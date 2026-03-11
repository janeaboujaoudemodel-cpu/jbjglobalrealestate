

## Plan: Developer Briefing Management System with Broker Attendance & Rep Scoring

Upgrades the existing Developer Portal, BriefingRequestForm, and AdminDevelopers into a full briefing lifecycle system.

---

### Phase 1: Database Migration

Add new tables and columns:

**New table: `briefing_attendance`**
- `id`, `briefing_request_id` (FK → briefing_requests), `broker_id` (FK → auth.users), `rsvp_status` (attending/not_attending/late), `late_reason`, `expected_arrival_time`, `confirmed_attended` (boolean), `selfie_url`, `gps_latitude`, `gps_longitude`, `gps_address`, `confirmed_at`, `points_earned` (default 10), `created_at`

**New table: `briefing_broker_lists`**
- `id`, `name`, `description`, `broker_ids` (uuid[]), `created_by`, `is_active`, `created_at`

**Alter `briefing_requests`** — add columns:
- `location_type` (text, default 'developer_office', options: 'developer_office' | 'our_office')
- `location_address` (text)
- `approved_at`, `approved_by` (uuid)
- `calendar_locked` (boolean default false)
- `broker_list_id` (FK → briefing_broker_lists, nullable)
- `developer_logo_url` (text)

**Alter `developer_representatives`** — add columns:
- `languages` (text[], default '{}')
- `whatsapp_group_number` (text)
- `activity_score` (integer, default 0)
- `response_time_avg_hours` (numeric)
- `total_briefings_hosted` (integer, default 0)
- `total_updates_submitted` (integer, default 0)
- `last_active_at` (timestamptz)

**New table: `rep_activity_log`**
- `id`, `representative_id` (FK), `activity_type` (briefing_hosted | project_updated | availability_updated | brochure_uploaded | event_submitted | whatsapp_message | whatsapp_response), `description`, `points_earned`, `response_time_minutes`, `created_at`

RLS: Owner can manage all. Reps can view own activity. Brokers can view own attendance.

---

### Phase 2: Upgrade BriefingRequestForm

File: `src/components/developer-portal/BriefingRequestForm.tsx`

- Add **location type** radio: "Developer Sales Office" (enabled) | "Our Sales Office" (disabled, badge: "Under Renovation — Coming Soon")
- Add **location address** text input when "Developer Sales Office" selected
- Add **languages spoken** multi-select for the rep (reuse `LanguageMultiSelect` component)
- Replace date input with a **calendar picker** (DayPicker in a popover) so reps visually pick a day
- On submit, insert into `briefing_requests` with new fields + create `admin_tasks` entry

---

### Phase 3: Owner Briefing Management Dashboard

New component: `src/components/admin/BriefingManagement.tsx`

Integrated as a new tab in `AdminDevelopers.tsx` (tab: "Briefings")

Features:
- **Calendar view** showing all briefing requests (pending = yellow, approved = green, rejected = red)
- **Approval workflow**: Click a briefing → approve/reject. On approve: set `approved_at`, `calendar_locked = true`, trigger notification
- **Broker list manager**: Create/edit named broker lists (select brokers from profiles). Assign a list to a briefing so all brokers on the list get notified
- **Attendance dashboard**: For each briefing, show RSVP status, selfie thumbnails, GPS location, confirmation status
- **Rep activity leaderboard**: Rank all developer reps by `activity_score`. Show total briefings hosted, updates submitted, avg response time. Top rep highlighted with gold badge
- **Developer search**: Search by developer name → see all associated reps with their languages, activity scores, contact info

---

### Phase 4: Broker Attendance Portal

New page: `src/pages/BriefingAttendance.tsx` at route `/briefing-attendance/:briefingId`

Flow (linked from email):
1. **RSVP section**: Attending / Not Attending / Will Be Late (+ reason + expected time)
2. **Post-briefing confirmation**: "Confirm Attendance" button appears after briefing time
3. **Selfie + GPS capture**: Opens device camera (`navigator.mediaDevices.getUserMedia`), captures photo, gets GPS via `navigator.geolocation.getCurrentPosition`, overlays developer logo watermark
4. Uploads selfie to `documents/briefing-attendance/` bucket, saves GPS + confirmation to `briefing_attendance` table
5. Awards points to broker's loyalty account

Route added to `PublicRoutes.tsx` (authenticated but not owner-guarded).

---

### Phase 5: Rep Activity Scoring & Manual WhatsApp Logging

**Auto-scoring triggers** (in the existing portal code):
- When rep submits a project upload → +5 points, log to `rep_activity_log`
- When rep requests a briefing → +3 points
- When rep submits an event → +3 points
- When rep updates availability/brochures → +5 points

**Manual WhatsApp activity panel** in AdminDevelopers:
- Log entries: message sent/received, response time in minutes
- Calculates `response_time_avg_hours` on the rep profile
- Shows message count + responsiveness rating (Excellent / Good / Slow)

**Owner calendar integration**: When briefing is approved, auto-insert into `admin_tasks` with calendar date, set notifications. Wire to existing AI Calendar alerts system.

---

### Phase 6: Notifications & Sitemap

- When briefing approved → notify all brokers on the assigned broker list (insert into `user_notifications`)
- When broker RSVPs → notify owner
- When selfie uploaded → notify owner with GPS confirmation
- Update `Sitemap.tsx` with `/briefing-attendance`

---

### Files Modified/Created

| File | Action |
|------|--------|
| DB migration | New tables + columns |
| `BriefingRequestForm.tsx` | Add location, calendar picker, languages |
| `AdminDevelopers.tsx` | Add "Briefings" tab with calendar + approval + attendance + leaderboard |
| `BriefingAttendance.tsx` | New page — RSVP + selfie + GPS |
| `DeveloperPortal.tsx` | Activity scoring on submit actions |
| `PublicRoutes.tsx` | Add briefing attendance route |
| `Sitemap.tsx` | Add new routes |

