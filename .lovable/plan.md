

## Plan: Developer Portal Upgrade — Personalization, Owner Mode, and Launch Interest

### What Changes

#### 1. Personalized Greeting (DeveloperPortalCTA + DeveloperPortal hero)
- **DeveloperPortalCTA.tsx**: Replace "Welcome Back, Developer" with user's actual name from `user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]`. Use a warmer message like "Here's your portal, {Name}" or "Good to see you, {Name}".
- **DeveloperPortal.tsx hero section**: Same — personalize the subtitle with the user's name.

#### 2. Owner Skip Mode on Developer Portal
- Detect `isOwner` from `useAuth()` in `DeveloperPortal.tsx`
- When owner is detected:
  - Hide the "Developer / Company Name" and "Email" card entirely (auto-fill from owner identity)
  - Show an **Owner Mode banner** with two buttons: "Developer Experience" (to see the normal flow) and "Quick Upload" (skips name/email, shows just developer name dropdown + file upload)
  - In Quick Upload mode: show a single "Developer Name" input (with autocomplete from `developers` table), then directly show the upload area — no email, no registration needed
  - The submit still inserts into `developer_launch_uploads` but with the owner's email and the selected developer name
  - Owner can also submit events/launches the same way (skip email/name)

#### 3. Launch "Register Interest" System
- **Database migration**: Create `launch_interest_registrations` table:
  - `id` (uuid PK), `user_id` (uuid, references auth.users), `event_id` (uuid, references developer_submissions), `user_email` (text), `user_name` (text), `user_phone` (text), `interest_type` (text: 'general' | 'private_tour' | 'eoi'), `notes` (text), `created_at` (timestamptz)
  - RLS: users can insert their own, owner can read all
- **Events tab enhancement**: Query `developer_submissions` with `submission_type = 'event_invitation'` and show upcoming events as cards
- Each event card shows a "Register Interest" button
- Clicking opens a modal with options: General Interest, Private Tour Request, Submit EOI
- Stores in `launch_interest_registrations` and notifies owner via `admin_tasks`

#### 4. Homepage CTA Card Upgrade
- **DeveloperPortalCTA.tsx**: Add more action cards: "Request Briefing", "My Agreements", "Register as Rep"
- Upgrade card styling — add subtle descriptions under each card label
- Show owner-specific cards when `isOwner` (e.g., "Manage All Launches", "View Interest Registrations")

### Files Changed

| File | Changes |
|---|---|
| `src/components/home/DeveloperPortalCTA.tsx` | Personalized greeting with user name, more action cards, owner-specific cards |
| `src/pages/DeveloperPortal.tsx` | Owner mode detection + skip flow, personalized hero, events tab with Register Interest, developer name autocomplete for owner |
| New migration | Create `launch_interest_registrations` table with RLS |

### Technical Details

- User name sourced from `user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]`
- Owner detection via existing `isOwner` from `useAuth()`
- Developer name autocomplete queries `developers` table for owner mode
- Interest registration modal uses a `Dialog` component with radio group for interest type
- Events query: `developer_submissions` where `submission_type = 'event_invitation'` and `event_date >= now()`

