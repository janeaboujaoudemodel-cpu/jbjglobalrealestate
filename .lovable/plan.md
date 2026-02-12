

## Three Changes: Correct Filter Bar on Project Page, Source Tracking on All Forms, and Visual Highlights

### 1. Replace PropertySearchBar with FilterShortcutBar on Project Page Sticky Header

The project page currently uses `PropertySearchBar` (a simple search input) in Row 1 of the sticky header. The user wants the same filter bar used on the Developer page -- which is `ProjectFilters` + `FilterShortcutBar` (the pill-based filter system with Price, Payments, Handover, Property Type, Bedrooms, Status, Construction, Sorting, Hide Sold, and Save).

**File: `src/components/project-detail/ProjectDetailLayout.tsx`**

- Remove `PropertySearchBar` import, add imports for `FilterShortcutBar`, `ShortcutFilterState`, `defaultShortcutFilters`, and `ProjectFilters`
- Add `shortcutFilters` state: `useState<ShortcutFilterState>(defaultShortcutFilters)`
- Replace Row 1 (the `PropertySearchBar` section) with a `ProjectFilters` + `FilterShortcutBar` combo in the same champagne gradient container, matching the DeveloperDetail layout
- Keep Row 2 (the curated shortcuts bar with Details, Gallery, Developer, etc.) exactly as-is below it

### 2. Highlight "Hide Sold" in Red and "Save" Heart in Red

**File: `src/components/filters/FilterShortcutBar.tsx`**

- **Hide Sold Out button** (line ~204-210): When active (`filters.hideSoldOut === true`), apply a red-tinted style: red border (`border-red-500`), red text, and the `EyeOff` icon in red. When inactive, give it a subtle red border hint (`border-red-300/50`) so it stands out from other pills
- **Save button** (line ~213-219): Change the `Heart` icon to always render in red (`text-red-500`) for a premium look, regardless of state

### 3. Add Contextual Source Tracking to All Forms

Every form submission should record **which page type** and **which specific entity** (project name, developer name, area name) the form was submitted from. Forms to update:

| Form | File | Current Source | New Source Format |
|------|------|---------------|-------------------|
| ConsultationRequestForm | `src/components/ConsultationRequestForm.tsx` | `project-interest-{id}` or `properties-consultation` | Add `source_page` field with current URL path; include `projectName` in `source_details` |
| ProjectInquiryForm | `src/components/project-detail/ProjectInquiryForm.tsx` | `project_inquiry` with `source_details: projectName` | Already good -- add `source_page` with `window.location.pathname` |
| OffPlanInquiryCTA | `src/components/OffPlanInquiryCTA.tsx` | `offplan_cta` | Add `source_page: window.location.pathname` and `source_details` with context from URL (developer/area/project name) |
| DealRegistrationForm | `src/components/deals/DealRegistrationForm.tsx` | None | Add `source_page` metadata in notes or a dedicated field |
| VisitRequestForm | `src/components/developer-visits/VisitRequestForm.tsx` | None | Add `notes` with source page context |
| InquiryFormModal | `src/components/InquiryFormModal.tsx` | `source` prop passed in | Enhance to also pass `window.location.pathname` as `source_page` in the insert |
| LeadCaptureModal | `src/components/project-detail/LeadCaptureModal.tsx` | Brochure context | Add `source_page` to the lead capture insert |

For each form, the approach is:
- Include `window.location.pathname` as the `source_page` value in the database insert
- Where possible, also pass the entity name (project name, developer name, area name) as `source_details`
- This uses existing `crm_leads` columns (`source`, `source_details`) -- if `source_page` column doesn't exist, we store it in `notes` or `tags`

**Database check**: Verify if `crm_leads` has a `source_page` column. If not, add one via migration.

### Technical Summary

| File | Changes |
|------|---------|
| `src/components/project-detail/ProjectDetailLayout.tsx` | Replace PropertySearchBar with ProjectFilters + FilterShortcutBar; add shortcutFilters state |
| `src/components/filters/FilterShortcutBar.tsx` | Red styling for Hide Sold button and red Heart icon for Save |
| `src/components/ConsultationRequestForm.tsx` | Add source_page tracking |
| `src/components/project-detail/ProjectInquiryForm.tsx` | Add source_page tracking |
| `src/components/OffPlanInquiryCTA.tsx` | Add source_page and contextual source_details |
| `src/components/deals/DealRegistrationForm.tsx` | Add source page context |
| `src/components/developer-visits/VisitRequestForm.tsx` | Add source page context |
| `src/components/InquiryFormModal.tsx` | Add source_page to insert |
| `src/components/project-detail/LeadCaptureModal.tsx` | Add source_page to insert |
| Database migration (if needed) | Add `source_page` column to `crm_leads` |

