

## Plan: Developer Portal — Event Submissions, New Launch Uploads & Auto-Approve System

### Overview
Create a public-facing **Developer Portal** accessible from the homepage where real estate developers can:
1. **Submit event invitations** (launches, support events) — auto-creates a task + calendar event for the owner
2. **Upload new launch marketing materials** (PDFs, renders, brochures) — auto-generates a draft listing ready for owner approval
3. **Auto-Approve toggle** in the owner panel — when ON, generated listings are published automatically

---

### Database Changes (3 new tables + 1 setting)

**Table 1: `developer_submissions`** — stores event/invitation submissions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| developer_name | text | Required |
| developer_email | text | Required |
| developer_phone | text | |
| submission_type | text | 'event_invitation', 'new_launch', 'support_request' |
| event_title | text | |
| event_date | timestamptz | |
| event_location | text | |
| event_description | text | |
| attachments | jsonb | Array of file URLs |
| status | text | 'pending', 'reviewed', 'accepted', 'declined' |
| created_at | timestamptz | |
| reviewed_at | timestamptz | |
| notes | text | Owner notes |

RLS: INSERT open to public (anon + authenticated). SELECT/UPDATE/DELETE restricted to owner role only.

**Table 2: `developer_launch_uploads`** — stores new launch material submissions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| developer_name | text | Required |
| developer_email | text | Required |
| project_name | text | Required |
| project_description | text | |
| location | text | |
| launch_date | date | |
| uploaded_files | jsonb | Array of {name, url, type} |
| extraction_status | text | 'pending', 'processing', 'completed', 'failed' |
| generated_project_id | uuid | FK to projects (nullable) |
| auto_approved | boolean | false |
| status | text | 'pending_review', 'approved', 'rejected' |
| created_at | timestamptz | |

RLS: INSERT open to public. SELECT/UPDATE/DELETE restricted to owner.

**Setting:** Add `auto_approve_developer_listings` key to `app_settings` (value: 'true'/'false').

**Trigger:** On insert to `developer_submissions` where type = 'event_invitation', auto-insert into `admin_tasks` with category 'developer_event' and the event details.

---

### Frontend Changes

**1. New Page: `src/pages/DeveloperPortal.tsx`**
- Public page at `/developer-portal`
- Premium champagne/gold UI matching site branding
- Two main sections with tabs:
  - **Submit Event / Invitation**: Form with developer name, email, event title, date, location, description, file attachments
  - **Submit New Launch**: Form with project name, developer name, location, launch date, multi-file uploader (PDFs, renders, brochures up to 100MB via TUS)
- On submit (event): Inserts into `developer_submissions` + creates `admin_tasks` entry
- On submit (launch): Inserts into `developer_launch_uploads`, triggers the existing `universal-link-extractor` edge function to process files and auto-generate a project draft in `projects` table with `is_published = false`

**2. Homepage Section: `src/components/home/DeveloperPortalCTA.tsx`**
- Placed after the Developer Partners Marquee on the homepage
- Card with "Are You a Developer?" heading
- Two CTAs: "Submit Event Invitation" and "Submit New Launch"
- Links to `/developer-portal`

**3. Owner Panel Addition: Auto-Approve Toggle**
- In `src/pages/ListingAdmin.tsx`, add an "Auto-Approve" switch at the top of the approval queue
- Toggle writes `auto_approve_developer_listings` = 'true'/'false' to `app_settings`
- When ON: New listings generated from developer uploads get `is_published = true` automatically

**4. Route Registration**
- Add `/developer-portal` to `PublicRoutes.tsx`

**5. Calendar Integration**
- On event submission, also insert into the owner's calendar events (using the existing `AICalendar` localStorage pattern, or if a calendar_events table exists, insert there)

---

### Files to Create/Edit

| File | Action |
|------|--------|
| Migration SQL | Create `developer_submissions`, `developer_launch_uploads` tables + RLS |
| `src/pages/DeveloperPortal.tsx` | **Create** — full portal page with event + launch tabs |
| `src/components/home/DeveloperPortalCTA.tsx` | **Create** — homepage CTA card |
| `src/pages/Index.tsx` | **Edit** — add DeveloperPortalCTA after DeveloperPartnersMarquee |
| `src/routes/PublicRoutes.tsx` | **Edit** — add `/developer-portal` route |
| `src/pages/ListingAdmin.tsx` | **Edit** — add Auto-Approve toggle |
| `src/components/navigation/GlobalVerticalNav.tsx` | **Edit** — add Developer Portal link under relevant section |

