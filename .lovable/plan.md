

# Fix: Contact Forms -- Styling Consistency and Readability

## Problems Identified

After auditing all 6 contact/inquiry forms in the application, these issues were found:

### 1. ProjectInquiryForm (Project Detail Page)
**File:** `src/components/project-detail/ProjectInquiryForm.tsx`
- **Inconsistent input heights**: Name/Email/Phone use `h-12`, but Size input and combobox buttons use `h-14` -- creates visual mismatch
- **SelectTrigger for Emirate** uses `h-14` with no gold border styling -- looks out of place
- **Size input** uses `h-14 text-base px-5` without matching gold border classes
- **Developer/Location combobox buttons** use `h-14` without champagne gradient or gold borders
- **"Other" input fields** for Developer and Location use `h-14` without gold borders

**Fix:** Standardize all inputs to `h-12` with consistent `border-2 border-gold/50 hover:border-gold focus:border-gold` styling and champagne gradient backgrounds.

### 2. Contact Page Consultation Form
**File:** `src/pages/Contact.tsx`
- Inputs use `bg-white` which conflicts with the base Input component's built-in champagne gradient (double background)
- The champagne gradient from the base Input gets overridden by `bg-white`, creating inconsistency
- Success state uses dark zinc backgrounds that clash with the champagne form wrapper

**Fix:** Remove `bg-white` overrides from all inputs and let the base Input component's champagne gradient apply naturally. Keep only border and focus classes as overrides.

### 3. ContactGatingModal
**File:** `src/components/ContactGatingModal.tsx`
- Uses `bg-white` dialog and `border-gray-300` inputs -- completely off-brand from the premium champagne theme
- Select triggers use `border-gray-300` instead of gold
- No champagne gradient on any fields
- Button uses `bg-gold text-white` instead of the standard premium button pattern

**Fix:** Update dialog to champagne gradient background with gold borders. Update all inputs and selects to use champagne gradient + gold border styling.

### 4. TeamContactForm
**File:** `src/components/TeamContactForm.tsx`
- Form submission is fake (`setTimeout`) -- never saves data to the database
- Other than that, styling is mostly correct (champagne gradient inputs with gold borders)

**Fix:** Connect form submission to the existing `capture-lead` edge function instead of `setTimeout`.

### 5. LeadCaptureModal (Document Downloads)
**File:** `src/components/project-detail/LeadCaptureModal.tsx`
- Uses `bg-card border-gold/30` dialog -- dark themed, not matching champagne
- Input fields inherit base Input champagne styling but the dialog container is dark
- Inconsistent with the rest of the premium form experience

**Fix:** Update dialog background to champagne gradient with gold borders matching the premium theme.

### 6. NewsletterSection
**File:** `src/components/project-detail/NewsletterSection.tsx`
- Uses `bg-card border-border` on inputs -- dark themed, looks broken against the dark background
- Input text appears as black on dark background (from base Input's `text-black`)

**Fix:** Override input styling to use dark variant (`bg-zinc-900 border-gold/50 text-white`) since this section sits on a dark background (`bg-premium-bg`).

---

## Technical Changes

| File | Change |
|------|--------|
| `src/components/project-detail/ProjectInquiryForm.tsx` | Standardize all inputs/selects/comboboxes to `h-12` with gold border styling |
| `src/pages/Contact.tsx` | Remove `bg-white` overrides; let base champagne gradient show through |
| `src/components/ContactGatingModal.tsx` | Restyle dialog and all fields to champagne gradient + gold borders |
| `src/components/TeamContactForm.tsx` | Replace `setTimeout` with actual `capture-lead` edge function call |
| `src/components/project-detail/LeadCaptureModal.tsx` | Update dialog to champagne gradient background |
| `src/components/project-detail/NewsletterSection.tsx` | Override input to dark variant for dark background context |

All changes are styling and wiring fixes -- no new features, no database changes.

