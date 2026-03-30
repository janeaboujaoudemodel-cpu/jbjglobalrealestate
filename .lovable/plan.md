

# Fix External Access Route + Restore Owner Shortcuts in Account Dropdown

## Issues Found

1. **External Access 404**: The route is registered at `/owner/external-access` but the user navigated to `/external-access` (without the `/owner/` prefix). The sidebar link is correct, but there's no redirect for the bare path.

2. **Console error**: `auditor_sessions` table has an `ON CONFLICT` clause but no matching unique constraint — causing session tracking to fail.

3. **Owner Shortcuts in Account Dropdown**: Currently shows 8 links (Command Center, Admin Panel, Customer Happiness, CRM, Listing Admin, CV Center, Team Chat, My Assistant). Missing key shortcuts like: HR Dashboard, Properties, Security Console, External Access Management, Analytics, Developer Hub, Event Management.

---

## Plan

### 1. Add `/external-access` redirect route
Add a top-level redirect from `/external-access` → `/owner/external-access` in the router so the user can reach it from either path.

### 2. Fix `auditor_sessions` unique constraint
Add a unique constraint on `auditor_sessions` (likely on `auditor_user_id` + `session_start` or add a proper upsert key) so the `ON CONFLICT` in `useAuditorTracking.ts` works. Alternatively, fix the hook to use a plain `INSERT` instead of `upsert`.

### 3. Restore and expand Owner Shortcuts in MegaMenuAccount
Update the `adminLinks` array (lines 248-257) to include the full set of owner shortcuts:

- Command Center (`/owner`)
- CRM Dashboard (`/owner/crm`)
- Admin Panel (`/owner/admin`)
- Listing Admin (`/owner/listing-admin`)
- Customer Happiness (`/admin?tab=customer-happiness`)
- HR Dashboard (`/hr-dashboard`)
- Properties (`/owner/properties`)
- Analytics (`/owner/analytics`)
- Security Console (`/owner/safety`)
- External Access (`/owner/external-access`)
- Team Chat (`/owner/team-chat`)
- CV Center (`/hr-dashboard?tab=cv-center`)
- Event Management (`/owner/event-management`)
- Developer Hub (`/developer-portal`)
- My Assistant (`/founder-assistant`)

### 4. Hide email from account dropdown
Line 313 shows `user.email` in the header. Per previous instructions, emails should never be displayed. Replace with the user's role/title or remove entirely.

### Files to modify
- **Router config** (App.tsx or route file) — add `/external-access` → `/owner/external-access` redirect
- **`src/components/header/MegaMenuAccount.tsx`** — expand `adminLinks`, remove email display
- **`src/hooks/useAuditorTracking.ts`** — fix upsert/ON CONFLICT issue
- **Database migration** — add unique constraint to `auditor_sessions` if needed

