

## Plan: Multi-Portal System — Investor, Broker, Developer Portals + Event Management Hub

This is a large multi-phase build. Given file size constraints, I'll implement it in focused batches. This plan covers **Phase 1** — the most critical items the user highlighted.

---

### Phase 1 Scope

#### 1. Fix Registration Label
- `SalesRepRegistration.tsx` line 294: Change "Register as Developer Representative" → "Register as Developer / Representative"
- `DeveloperPortalCTA.tsx` line 27: Change "Register as Rep" → "Register as Developer / Representative"

#### 2. Rename Developer Portal Tab
- `DeveloperPortal.tsx` line 1037: Rename "Profile" tab → "Update Profile" (value stays `register`)

#### 3. Build Investor Portal Page (Full Rebuild)
Replace the existing `InvestorDashboard.tsx` (833 lines, mostly mock data) with a comprehensive tabbed portal matching the developer portal's champagne-gold styling:

**Tabs:** Dashboard | My Properties | Documents | Profile | Inbox | Alerts | Calendar

**Dashboard tab:** KPI cards (watchlist, saved searches, reports, active requests), recent activity feed
**My Properties tab:** Favorited/shortlisted properties with status badges
**Documents tab:** Investor document vault (already exists as component)
**Profile tab:** Full editable profile (name, nationality, phone, email, languages, gender, experience) — same premium form as developer portal
**Inbox tab:** Messages/notifications from JBJ
**Alerts tab:** Event invitations, launch notifications, submission status updates
**Calendar tab:** Events calendar showing JBJ events/invitations relevant to investors

**Approval Timeline Component** (shared): A reusable `ApprovalTimeline` component showing the 3-step approval with photos (Admin → MD → Owner) for any submission — listings, profile changes, applications. Shows status per step (pending/approved/rejected with reason).

#### 4. Build Broker Portal Enhancement
Enhance existing `BrokerPortal.tsx` (476 lines) with the same tabbed structure:

**Tabs:** Dashboard | My Listings | Documents | Profile | Inbox | Alerts | Calendar

**Profile tab:** Company name, personal number, personal email, nationality, languages, years in RE, date of joining company. No company number for brokers.
**My Listings tab:** Submitted listings with approval timeline. Before submitting, show reminder: "If your company or role has changed, please update your profile before submitting."
**Calendar tab:** Events/invitations from JBJ for brokers

#### 5. Shared Approval Timeline Component (New)
`src/components/shared/ApprovalTimeline.tsx`
- Takes `steps` array with approver photo, name, title, status (pending/approved/rejected), rejection reason
- Renders as a vertical timeline with connector lines
- Uses the existing `UNIFIED_APPROVAL_WORKFLOW` data (3-step: Sarah → David → Jane)
- Shows congratulations or rejection message with reason at the end

#### 6. Profile Section Enhancements (All Portals)
In the Profile tab of all portals, show:
- Brand assets (stamp, logo, business card) if they exist — link to manage
- Favorites/shortlisted properties count + link
- Watched properties history
- AI tools used history
- Draft applications
- Notes
- Calendar link

#### 7. Role Switching in Profile
- Developer → Broker: Instant, no approval. Show broker fields (company name, personal details)
- Broker → Developer: Requires re-approval. Triggers registration flow with document uploads
- Show current role prominently with a "Switch Role" section

#### 8. Owner Event Management Hub (New)
**Route:** `/owner/event-management`

**Features:**
- Create events (title, description, date, location, type, target audience category)
- Select target audience: All users, Investors only, Brokers only, Developers only, or custom selection
- Generate invitation (email template)
- Send invitations by email to selected categories
- Include/exclude specific users
- Track RSVPs and attendance
- Events appear in user calendars based on their role/category

**Database:** `events` table with `id`, `title`, `description`, `event_date`, `location`, `event_type`, `target_categories` (text[]), `created_by`, `status`, `invitation_template`

`event_invitations` table with `id`, `event_id`, `user_id`, `user_email`, `status` (invited/accepted/declined/attended), `sent_at`, `responded_at`

---

### Files to Create/Modify

| File | Action |
|------|--------|
| **New**: `src/components/shared/ApprovalTimeline.tsx` | Reusable approval timeline with photos |
| **New**: `src/pages/owner/EventManagementHub.tsx` | Owner event creation/management |
| **New**: `src/hooks/useEventManagement.ts` | Event CRUD hooks |
| **Migration** | Create `events` + `event_invitations` tables |
| **Update**: `src/pages/InvestorDashboard.tsx` | Full rebuild as tabbed portal |
| **Update**: `src/pages/BrokerPortal.tsx` | Add tabs (Profile, Listings, Calendar, Alerts, Inbox) |
| **Update**: `src/pages/DeveloperPortal.tsx` | Rename tab, integrate ApprovalTimeline |
| **Update**: `src/components/developer-portal/SalesRepRegistration.tsx` | Fix registration label |
| **Update**: `src/components/home/DeveloperPortalCTA.tsx` | Fix CTA label |
| **Update**: Owner routes | Add `/owner/event-management` route |

### Implementation Order
1. Database migration (events + event_invitations tables)
2. `ApprovalTimeline` shared component
3. Fix registration labels + tab rename (SalesRepRegistration, DeveloperPortalCTA, DeveloperPortal)
4. Rebuild `InvestorDashboard` as full Investor Portal
5. Enhance `BrokerPortal` with tabbed structure + profile
6. `EventManagementHub` + hooks + route wiring
7. Integrate ApprovalTimeline into DeveloperPortal submissions

