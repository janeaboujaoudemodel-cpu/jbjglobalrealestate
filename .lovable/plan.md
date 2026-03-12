

## Plan: One-Time Registration Flow + Profile-Linked Submissions + Tab Border Fix

### Problem Summary
Currently, reps must enter developer name and email on every submission. The system should work like this: register once → all submissions auto-linked to your profile. Also, tab borders are cropped in the header, and there's no verification document upload or scam warning.

### Changes

#### 1. Fix Cropped Tab Borders (Immediate)
**File: `src/pages/DeveloperPortal.tsx`** (lines 539-592)
- The `TabsList` uses `inline-flex w-auto min-w-full` which causes overflow clipping
- Fix: add `overflow-x-auto` to the ScrollArea wrapper, remove `min-w-full`, add proper padding so border-radius isn't clipped (`p-1` on TabsList already exists but the outer container clips it)
- Add `whitespace-nowrap` and ensure the ScrollArea allows horizontal scroll without cropping rounded corners

#### 2. One-Time Registration → Profile-Based Access
**File: `src/pages/DeveloperPortal.tsx`**
- When `repProfile` exists and is approved (or even pending): auto-fill `devName` from `repProfile.developer_name` and `devEmail` from `repProfile.email`
- Hide the top "Developer / Company Name + Email" card entirely when user has a rep profile
- All submission functions (`handleSubmitProject`, `handleSubmitEvent`) use `repProfile.developer_name` and `repProfile.email` automatically
- Show a small profile summary bar instead: "Submitting as: {name} · {developer} · {email}" with an "Edit Profile" link

#### 3. Registration Enhancements
**File: `src/components/developer-portal/SalesRepRegistration.tsx`**
- Add personal email field (separate from company email)
- Add ID/employee card upload field (file upload to storage bucket `documents/rep-verification/`)
- Add a prominent red warning banner: "All information you upload must be accurate. Uploading misleading, false, or fraudulent information will result in permanent ban from the platform. JBJ Global reserves the right to verify your identity with your employer."
- Make company email required, personal email optional

#### 4. Profile Edit Mode
**File: `src/pages/DeveloperPortal.tsx`** (Register tab, lines 869-916)
- When `hasRepProfile`: show the current profile details with an "Edit Profile" button
- Clicking "Edit" opens an inline form pre-filled with current data
- On save: update `developer_representatives` row, notify owner via `admin_tasks` insert ("Rep {name} updated their profile — fields changed: {list}"), and show toast
- Auto-sync: when rep updates email/phone, the same values propagate (they're already stored in one place)

#### 5. Owner Notification on Profile Updates
- When a rep saves profile edits, insert an `admin_tasks` entry: `"Profile Update: {rep_name} changed {fields}"` with priority `medium` and category `rep_profile_update`
- The existing owner notification system will surface this

#### 6. Download Change Tracking (CRM Page)
**File: `src/pages/CRM.tsx`**
- Store last download timestamp in `localStorage` key `crm_last_download_ts`
- Before downloading, query count of `developer_representatives` where `updated_at > lastDownloadTs`
- Show an alert banner: "⚠️ {N} records updated since your last download on {date}. Downloading latest version."
- After download, update the localStorage timestamp
- Always download fresh data (already does this)

### Files Changed

| File | Changes |
|---|---|
| `src/pages/DeveloperPortal.tsx` | Fix tab borders, auto-fill from rep profile, hide dev name/email card when profile exists, add profile edit mode, owner notification on update |
| `src/components/developer-portal/SalesRepRegistration.tsx` | Add personal email field, ID upload, scam warning banner |
| `src/pages/CRM.tsx` | Add download change tracking with timestamp alerts |

### Technical Details
- Tab border fix: change `TabsList` className to remove `min-w-full` and add `overflow-visible` on the wrapper, plus `p-1.5` padding on TabsList for border breathing room
- Profile auto-fill uses existing `repProfile` query data — no new queries needed
- ID upload goes to `documents/rep-verification/{user_id}/{filename}` in existing storage bucket
- Profile update detection: compare old vs new field values to generate a diff for the owner notification

