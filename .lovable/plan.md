

## Plan: Developer Portal Overhaul — Registration Gate, Enhanced Registration, and Homepage CTA Fix

### Problem Summary

1. **Homepage CTA shows "Command Center"** when owner is in developer mode — should show developer view
2. **No registration gate on direct navigation** — clicking CTA links goes straight to tabs without requiring registration
3. **"Interest Registrations" concept is confusing** — remove it from owner CTA; rename to meaningful labels
4. **Registration form is incomplete** — missing: "Other" role with custom text, document uploads for Owner/CEO, nationality dropdown with flags, phone with country codes, secondary contacts, on-leave feature
5. **Icon styling** — gold gradient feels flat; switch to champagne-gold/premium tones

---

### Changes

#### 1. Fix Homepage `DeveloperPortalCTA.tsx`

- **When owner + developer mode**: Show developer actions (not owner command center). Title: "Developer Portal" not "Command Center"
- **When owner + NOT developer mode**: Show a small owner shortcut row (Quick Upload, Manage Developers, Review Launches — no "Interest Registrations")
- Remove "Interest Registrations" and "Listing Admin" from CTA entirely
- Replace owner actions with: "Quick Upload", "Manage Launches", "Review Submissions", "Manage Developers"
- Change icon container gradient from `from-gold to-[#C4A87A]` to champagne-gold: `from-[#D4B896] to-[#C9A87C]` with a subtle border glow

#### 2. Enhance Registration Form (`SalesRepRegistration.tsx`)

**Role selection:**
- Add `{ value: 'other', label: 'Other', description: 'Please specify your role' }` to ROLE_OPTIONS
- When "Other" selected, show mandatory text input: "Please provide your role"

**Document uploads for Owner/CEO/Founder:**
- When role is `owner_ceo`, require: ID upload, Passport upload, Trade License upload, RERA document upload (4 separate file inputs)
- Block submission until all 4 are uploaded for that role

**Nationality with flags:**
- Replace plain text `Input` with a `Select` dropdown using a comprehensive nationality list with flag emojis (reuse pattern from `PhoneInputWithCountry`)

**Phone with country codes:**
- Replace plain `Input` for phone with `PhoneInputWithCountry` component (already exists)
- Add secondary phone field (also with country code)

**Contact fields restructure:**
- Company Email (required), Personal Email (optional)
- Company Phone (required, with country code), Personal Phone (optional, with country code)
- Mark personal fields as "restricted" with a lock icon and tooltip

**Languages:**
- Already uses `LanguageMultiSelect` — keep as-is, it supports add/remove

**On-Leave feature:**
- Add to the profile edit view (not registration): "Mark as On Leave" toggle
- When toggled on, show date pickers for "Leave Start" and "Expected Return"
- Save to `developer_representatives` table (new columns: `is_on_leave`, `leave_start_date`, `leave_end_date`)

#### 3. Enforce Registration Gate in Portal

Currently the gate exists at line 924: `!hasRepProfile && !isOwner && !loadingRep` shows only registration. This is correct for non-owners.

**Change**: When owner is in developer mode (`isDeveloperMode && isOwner`), treat them like a developer — show the full developer flow including registration gate if they don't have a rep profile. Add a small "Switch to Owner View" link.

**All CTA links from homepage** already navigate to `/developer-portal?tab=X`. The portal already gates non-registered users. No additional gate needed — the existing gate at line 924 handles it.

#### 4. Database Migration

Add columns to `developer_representatives`:
```sql
ALTER TABLE developer_representatives 
  ADD COLUMN IF NOT EXISTS is_on_leave boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS leave_start_date date,
  ADD COLUMN IF NOT EXISTS leave_end_date date,
  ADD COLUMN IF NOT EXISTS personal_phone text,
  ADD COLUMN IF NOT EXISTS company_phone text,
  ADD COLUMN IF NOT EXISTS custom_role_title text,
  ADD COLUMN IF NOT EXISTS passport_document_url text,
  ADD COLUMN IF NOT EXISTS trade_license_url text,
  ADD COLUMN IF NOT EXISTS rera_document_url text;
```

#### 5. Owner Management Enhancements

The existing "Manage" tab and auto-approve toggle on rep profiles already exist. Add to the manage tab:
- "Restrict Access" button per developer (sets `status = 'restricted'`)
- "Revert to Manual Approval" button (sets `auto_approve_uploads = false`)

---

### Files Summary

| File | Change |
|------|--------|
| `src/components/home/DeveloperPortalCTA.tsx` | Show developer view when in dev mode; remove "Interest Registrations"; champagne-gold styling |
| `src/components/developer-portal/SalesRepRegistration.tsx` | Add "Other" role + custom text, Owner/CEO doc uploads (4 files), nationality dropdown with flags, phone with country codes, secondary contacts |
| `src/pages/DeveloperPortal.tsx` | Owner in dev mode sees developer flow; profile edit adds on-leave toggle; manage tab gets restrict/revert buttons |
| **Migration** | Add columns to `developer_representatives` |

### Implementation Order
1. Database migration (new columns)
2. Homepage CTA fix + styling
3. Registration form enhancements
4. On-leave feature in profile edit
5. Owner management restrict/revert controls

