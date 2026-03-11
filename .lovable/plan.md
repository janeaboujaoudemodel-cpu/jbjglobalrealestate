

## Plan: Developer Portal & Admin Developers — Full UI Upgrade, Workflow Fix & Broker Briefing Access

### Problem
1. **AdminDevelopers** (`/admin/developers`) uses a dark `bg-black` / `bg-zinc-900` theme that violates the champagne-gold admin standard
2. **BriefingManagement** sub-component also uses dark zinc theme
3. Developers list doesn't show all integrated developers with expandable sales reps clearly
4. Brokers (approved employees) can't request briefings from the admin side — only approved developer reps can on the developer portal side
5. No notification to owner alerts when a broker requests a briefing through the portal
6. AI integration not wired (no AI-assisted briefing summaries or automation)

### Phase 1: AdminDevelopers UI Overhaul → Champagne Gold Standard

**File:** `src/pages/AdminDevelopers.tsx`

- Replace `bg-black`, `bg-zinc-900`, `border-zinc-800`, `text-white` with champagne-gold system:
  - Page: `bg-gradient-to-b from-[hsl(40,33%,98%)] via-[hsl(38,30%,93%)] to-[hsl(36,25%,88%)]`
  - Header: champagne gradient with gold borders
  - Cards: `bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/30`
  - Stats cards: gold-bordered champagne
  - Text: `text-foreground` instead of `text-white`
  - Tabs: champagne gradient tab list with `data-[state=active]:bg-white`
- DeveloperCard: champagne card with gold border, reps always visible (no toggle), contact buttons styled with gold accents
- Dialogs: champagne background instead of zinc-900

### Phase 2: BriefingManagement UI Overhaul

**File:** `src/components/admin/BriefingManagement.tsx`

- Same champagne-gold conversion for all cards, stats, tabs, dialogs
- Stats row: champagne cards with gold text
- Sub-tabs: champagne background
- Briefing cards, attendance, leaderboard, WhatsApp logger — all converted
- WhatsAppLogger sub-component: champagne inputs

### Phase 3: Developer Card Expansion — Sales Reps Always Visible

**File:** `src/pages/AdminDevelopers.tsx` (DeveloperCard component)

- Reps expanded by default (remove collapsed state)
- Each rep shows: name, title, phone (clickable), WhatsApp (clickable), email (clickable), primary badge
- Add "Request Briefing" button per developer that opens briefing form pre-filled with developer name
- Show developer website link, description, location prominently

### Phase 4: Broker Briefing Access from Developer Portal

**File:** `src/pages/DeveloperPortal.tsx`

- Currently only approved developer reps can see the Briefing tab
- Add a new flow: **approved company brokers** (users with broker_profiles where `verification_status = 'verified'` or employees in `hr_employees`) can also see the Briefing tab
- They can browse developer sales reps, contact them, and request a briefing
- On briefing request submission, insert into `user_notifications` for the owner with action_url pointing to `/admin/developers` Briefings tab

### Phase 5: Owner Alert Notifications

**Files:** `BriefingRequestForm.tsx`, `DeveloperPortal.tsx`

- When any user (rep or broker) submits a briefing request, insert into `user_notifications` for the owner:
  - type: `briefing_request`
  - title: `New Briefing Request: {project_name}`
  - message with developer name, date, time, location
- This already creates an `admin_tasks` entry — add the notification as well
- Wire to existing `useUserAlerts` hook (already queries `user_notifications`)

### Phase 6: AI Integration — Briefing Summary

- After briefing is approved, add an "AI Summary" button in BriefingManagement detail dialog
- Calls `lovable-ai` edge function with briefing details + notes to generate a summary
- Summary stored in briefing notes field
- Uses `google/gemini-3-flash-preview` model

### Files Modified

| File | Changes |
|------|---------|
| `AdminDevelopers.tsx` | Full champagne-gold UI, reps always visible, briefing request button |
| `BriefingManagement.tsx` | Full champagne-gold UI, AI summary button |
| `BriefingRequestForm.tsx` | Add owner notification on submit |
| `DeveloperPortal.tsx` | Allow approved brokers to access briefing tab |

