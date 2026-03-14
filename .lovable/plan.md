

## Plan: Developer Portal — Deep Audit + Fixes (Round 2)

### Issues Found

**1. "Jane Abu Jaude Holding" appearing as developer name**
- Not hardcoded — the user likely sees the owner's name auto-filled from `developersList` or their `repProfile`. The real issue: the developer selection uses a plain `<Input>` with `<datalist>` (lines 971-981), which is a basic HTML autocomplete with no logos, no search, no proper dropdown. The user wants a rich searchable dropdown with developer logos.

**2. "Access our CRM pipeline" in Usage Rights text**
- Line 29: `USAGE_RIGHTS_TEXT` includes "Access our CRM pipeline for your submitted projects" — user says this is misleading. Developers don't access CRM. Remove this bullet.

**3. Developer company field — "locked, contact support to change"**
- Line 315: Says "Contact support to change it after registration." User wants developers to be able to edit it anytime, but editing triggers a re-approval cycle with new document uploads.

**4. Language multi-select missing flags**
- `LanguageMultiSelect` has no flags — just text buttons. User wants flags next to each language like the nationality dropdown.

**5. Registration validation too loose**
- `handleSubmit` (line 118) only requires `full_name`, `email`, `phone`. User says ALL fields are mandatory: nationality, gender, years_in_real_estate, languages, date_of_join.

**6. No role switching (developer ↔ broker) in profile**
- User wants developers to be able to switch to broker role (no approval needed) or broker to developer (requires re-approval). Currently no mechanism exists.

**7. Broker profile requirements missing**
- When switching to broker: needs company name, personal number, personal email, nationality, languages, years in real estate, date of joining company. No company number for brokers (only personal).

---

### Implementation Plan

#### Fix 1: Replace developer selector with rich searchable dropdown
- Replace `<Input>` + `<datalist>` with a custom searchable dropdown component
- Use `useDevelopers()` hook to fetch all developers with `logo_url`, `name`, `slug`
- Show developer logos next to names in the dropdown
- Include search/filter input inside the dropdown
- Apply in both the registration gate AND owner Quick Upload mode
- Pass selected developer as `developerName` prop to `SalesRepRegistration`

#### Fix 2: Remove "CRM pipeline" bullet from Usage Rights
- Remove line "Access our CRM pipeline for your submitted projects" from `USAGE_RIGHTS_TEXT`
- Replace with "Track submission status and receive updates on your projects"

#### Fix 3: Allow developer_name change with re-approval
- In profile edit, make `developer_name` editable (remove disabled)
- Add warning: "Changing your developer will require re-approval and new verification documents"
- When developer_name changes on save, automatically set `status = 'pending_review'` and flag for re-verification
- Use the same rich developer dropdown in the edit form

#### Fix 4: Add flags to LanguageMultiSelect
- Add a `LANGUAGE_FLAGS` mapping (language name → country flag emoji or ISO flag)
- Display flag next to each language button and selected tag
- Languages without a clear flag get a globe icon

#### Fix 5: Make ALL registration fields mandatory
- Update `handleSubmit` validation to require: `nationality`, `gender`, `years_in_real_estate`, `languages` (at least 1), `date_of_join`
- Add `*` indicators to all field labels
- Disable submit button until all mandatory fields are filled

#### Fix 6: Add role switching in Profile tab
- Add a "Switch Role" section in the Profile tab
- Options: "Developer Representative" (current) or "Broker"
- Developer → Broker: instant switch, no approval. Update profile type, show broker-specific fields
- Broker → Developer: triggers registration flow with approval required. Must select developer, upload documents
- Show current role prominently

#### Fix 7: Broker profile fields
- When user selects broker role: show company name (text input), personal number, personal email, nationality, languages, years in RE, date of joining company
- No company number field for brokers
- On submission/listing: show reminder "If your company or role has changed, please update your profile before submitting"

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/DeveloperPortal.tsx` | Replace datalist with rich dropdown, profile edit developer change, role switching, mandatory validation |
| `src/components/developer-portal/SalesRepRegistration.tsx` | Update USAGE_RIGHTS_TEXT, mandatory field validation, rich developer dropdown |
| `src/components/ui/language-multi-select.tsx` | Add flags to all languages |
| **New**: `src/components/developer-portal/DeveloperSelectDropdown.tsx` | Searchable dropdown with logos |

### Implementation Order
1. Create `DeveloperSelectDropdown` component (reusable)
2. Update `LanguageMultiSelect` with flags
3. Update `SalesRepRegistration` — remove CRM text, mandatory fields
4. Update `DeveloperPortal` — integrate new dropdown, profile editing, role switching

