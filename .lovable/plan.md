

## Plan: Developer Portal Deep Audit + Fixes

### Issues Found

After thorough code review, here are the specific problems and gaps:

**1. Homepage CTA still shows owner-specific items when NOT in developer mode**
- The CTA correctly shows developer actions when `isDeveloperMode` is true
- But when owner is NOT in developer mode, it still shows "Quick Upload", "Manage Launches", "Review Submissions", "Manage Developers" — which the user doesn't want labeled that way. The user wants to remove confusing labels like "Interest Registrations" (already removed) and "Listing Admin" (already removed). This part looks correct now.

**2. Registration gate has a gap — owner NOT in developer mode bypasses it**
- Line 924: `!hasRepProfile && (!isOwner || isDeveloperMode) && !loadingRep` — this correctly gates developers and owner-in-dev-mode
- BUT when owner is NOT in dev mode AND clicks "Developer View" button (ownerSkipMode=false), they still see the full portal tabs without registration
- The `ownerSkipMode` toggle on line 891-903 lets owner toggle between "Developer View" and "Quick Upload", but in "Developer View" they still skip the gate

**3. Profile edit form is using plain `Input` for nationality instead of `NationalitySelect`**
- Line 1456: `<Input value={editForm.nationality}` — should use the flag dropdown
- Phone edit also uses plain `Input` instead of `PhoneInputWithCountry`

**4. Profile edit allows editing developer_name (line 1452)**
- Developer name input is editable in the edit form but the save handler on line 183 doesn't send it — inconsistent UX. Should be locked/disabled with a note.

**5. "Interest Registrations" tab still exists for owner**
- Lines 1041-1044: Owner-only "Interest" tab still exists — user explicitly said "there is nothing called interest registrations"
- Lines 1783-1828: Full "All Interest Registrations" tab content still renders
- The concept of "Interest Registrations" as a standalone tab should be removed; this data belongs inside the Launches tab

**6. On-leave toggle works but profile edit doesn't include languages, personal contacts**
- The edit form (lines 1433-1458) only has: full_name, position, email, phone, developer_name, nationality
- Missing: languages, personal_email, personal_phone, company_phone

**7. Manage tab has no Restrict Access or Auto-Approve controls**
- The manage tab (lines 1831-1928) only manages launches/events submissions
- No developer representative management (restrict access, toggle auto-approve, revert to manual)

**8. Important Notice text needs update**
- Line 20 already includes employer verification clause — good
- But needs the exact wording: "JBJ Global Real Estate reserves the right to verify with the employer about his identity or about the project's information details"

**9. Emoji usage violation**
- Line 1354: `📍` emoji used for location
- Line 1626: `📋` emoji used for "Register Your Sales Team"  
- Line 1888: `📍` emoji in manage tab
- Must be replaced with Lucide icons per visual standards

---

### Implementation Plan

#### Fix 1: Remove "Interest" tab, merge into Launches
- Remove the owner-only "Interest" TabsTrigger (lines 1042-1044)
- Remove the Interest TabsContent (lines 1783-1828)
- Move interest registration list into the Manage tab as a collapsible section

#### Fix 2: Enhance Profile Edit form
- Replace plain nationality `Input` with `NationalitySelect`
- Replace plain phone `Input` with `PhoneInputWithCountry`
- Add `personal_email`, `personal_phone`, `languages` fields to edit form
- Lock `developer_name` field (show as disabled with lock icon)
- Wire all new fields to the save handler

#### Fix 3: Add Developer Management to Manage tab
- Fetch all `developer_representatives` for owner
- Show list with: name, company, role, status, auto_approve flag
- Add "Toggle Auto-Approve" button per rep
- Add "Restrict Access" button (sets status to 'restricted')
- Add "Revert to Manual Approval" button

#### Fix 4: Update Important Notice wording
- Update `IMPORTANT_NOTICE_TEXT` to include the exact employer verification clause

#### Fix 5: Replace all emoji usage with Lucide icons
- `📍` → `<MapPin />` 
- `📋` → `<ClipboardList />`

#### Fix 6: Tighten registration gate for owner in Developer View
- When owner has `ownerSkipMode = false` (Developer View), enforce the same registration gate as a regular developer

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/DeveloperPortal.tsx` | Remove Interest tab, enhance profile edit, add dev management to Manage tab, fix emojis, tighten gate |
| `src/components/developer-portal/SalesRepRegistration.tsx` | Update Important Notice text |

### Implementation Order
1. SalesRepRegistration — update notice text
2. DeveloperPortal — remove Interest tab, fix emojis, enhance profile edit, add dev management, tighten gate

