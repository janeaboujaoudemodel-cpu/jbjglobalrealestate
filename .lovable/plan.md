

## Plan: Registration-First Portal, Role Expansion, Usage Rights Agreement, Developer Name Lock, Bug Fixes

### Problem Summary
1. Registration should be the **gateway** — new users see registration first, not tabs. Only after registering do they unlock the portal.
2. Role select needs more options: Owner/CEO, Admin, Sales Rep, Channel Partner.
3. Important Notice must say "JBJ GLOBAL REAL ESTATE" (full name, never abbreviated).
4. Need a Usage Rights section explaining benefits + T&C agreement saved to backend.
5. "Position Title" and "Your Role" should be a single combined field.
6. Developer name should auto-populate from selection and be **locked** (non-editable) after initial registration.
7. Language multi-select bugs need fixing.

### Changes

#### 1. Registration-First Gate in DeveloperPortal.tsx
**Current behavior**: Registration is just one tab among many. Users can browse all tabs without registering.

**New behavior**: If `!hasRepProfile` and user is not owner (or owner in developer view), show **only** the SalesRepRegistration component as the main page content — no tabs visible. After registration completes, tabs unlock.

**Implementation** (lines 812-916 area):
- Before the `<Tabs>` block, check: if `!hasRepProfile && !isOwner` (or owner in dev view without rep profile) → render only the `SalesRepRegistration` component full-width, no tabs
- After `hasRepProfile` is truthy → show the profile summary bar + tabs as normal

#### 2. Expand Role Options in SalesRepRegistration.tsx
Replace the current 2-option role select (admin, sales_representative) with:
- `owner_ceo` — Owner / CEO
- `admin` — Admin / Manager  
- `sales_representative` — Sales Representative
- `channel_partner` — Channel Partner

Merge "Your Role" and "Position / Title" into a single "Your Role / Position" field. Remove the separate position input. The role select IS the position.

#### 3. Fix Important Notice — Full Company Name
Line 108 in SalesRepRegistration.tsx: Change "JBJ Global" to "JBJ GLOBAL REAL ESTATE" everywhere. Lock this as a constant.

#### 4. Add Usage Rights Section
Next to the Important Notice banner, add a "Usage Rights & Benefits" card explaining:
- What the portal does for them (submit projects, track listings, request briefings, manage launches)
- How it benefits them (direct access to JBJ broker network, fast-track project visibility, briefing scheduling)

Below both notices, add a checkbox: "I agree to the Terms & Conditions, Usage Rights, and Important Notice" — save to `user_agreements` table via `useAgreementSaver` hook. Registration button disabled until this is checked.

#### 5. Lock Developer Name After Selection
In `SalesRepRegistration`, the `developerName` prop is passed in. Currently it comes from `devName` state which is editable. 

**Fix**: In the registration form, show the developer name as a **read-only** field with a lock icon. The user selects the developer BEFORE registration (from the dev name input or autocomplete). Once they submit registration, it's locked in `developer_representatives.developer_name` and the profile edit form should NOT allow changing it (remove `developer_name` from editForm fields, or show it as read-only).

In `handleStartEditProfile` (line 137): make `developer_name` read-only in the edit form.

#### 6. Fix Language Multi-Select
The `LanguageMultiSelect` component works but the styling uses gold colors that may not render well on the registration form's light background. The component itself is functional — the main issue is likely that the language buttons overflow or the search doesn't properly filter. 

**Fix**: Ensure the component renders correctly within the registration card context. Add `className` overrides for better contrast. Also verify the `languages` column in `developer_representatives` accepts the array format being sent.

### Files Changed

| File | Changes |
|---|---|
| `src/pages/DeveloperPortal.tsx` | Gate all tabs behind registration, lock developer_name in edit form, show registration as main landing |
| `src/components/developer-portal/SalesRepRegistration.tsx` | Expand roles, merge role+position, full company name, add usage rights section, add T&C checkbox with backend save, lock developer name display |

### Technical Details
- Registration gate: wrap the entire `<Tabs>` section in a conditional — `hasRepProfile ? <Tabs>...</Tabs> : <RegistrationLanding />`
- T&C agreement saved via `useAgreementSaver` with `agreementType: 'developer_portal_usage'` containing snapshot of both Important Notice and Usage Rights text
- Developer name locked: render as `<Input readOnly disabled value={developerName} />` with lock icon in registration form; in edit profile, exclude `developer_name` field or show it read-only with explanation text
- Role values stored in `developer_representatives.role` column (text) — new values `owner_ceo` and `channel_partner` are just strings, no migration needed

