

# Provident Extraction & Reelly Layout Alignment + Form Fixes

## Overview
This plan addresses three interconnected issues:
1. **Provident extraction alignment** - Ensure extracted data (FAQ, location distances, floor plans) flows correctly through the full pipeline and displays in the new Reelly-style layout sections
2. **Test Panel display fixes** - Show FAQ, location distances, and floor plan data in the test extraction result card
3. **Form fixes across all site forms** - Address any form styling/functionality issues

---

## Analysis Summary

### Current Architecture
The extraction pipeline works as follows:

```text
Source URL → Firecrawl Scrape → pagedata-detail.ts / extract.ts
                                       ↓
                              pending_project_imports table
                                       ↓
                              Approval (bulk-approve-imports)
                                       ↓
                              projects table + project_images + project_documents
                                       ↓
                              useProjects hook → ProjectDetailLayout
```

### Data Fields Being Extracted
The shared extraction module (`_shared/provident/extract.ts`) already extracts:
- `faqs` - Array of {question, answer}
- `locationDistances` - Array of {label, time}
- `floorPlanTypes` - Array of {label, pdfUrl?}
- `paymentBreakdown` - Object with down_payment, during_construction, on_completion
- `uspBullets`, `locationHeadline`, `locationDescription`, `amenities`

### Identified Issues

1. **TestOneListingPanel.tsx** (lines 68-97): Shows checklist but does NOT display the actual extracted data (FAQs, distances, floor plans) in a visible section - only shows boolean/count checks

2. **batch-extract-pending/index.ts**: Correctly extracts and saves all fields to `pending_project_imports`

3. **bulk-approve-imports/index.ts**: Correctly copies all extended fields to `projects` table

4. **ProjectDetail.tsx**: Correctly maps all fields from hook to layout

5. **ProjectDetailLayout.tsx**: Has sections for FAQs, Location, Floor Plans but they depend on data being present

---

## Implementation Plan

### Part 1: Fix Test Panel to Display Extracted Data

**File: `src/components/listing-admin/TestOneListingPanel.tsx`**

Add visual display sections for extracted data in the test result card:

1. Add a "Extracted Data Preview" section after the checklist showing:
   - FAQs list (question/answer pairs)
   - Location distances list (place/time pairs)
   - Floor plan types list
   - Payment breakdown visualization
   - USP bullets list
   - Amenities list

2. Parse and display these fields from `testResult.project`:
   - `faqs` - Show in accordion or list format
   - `location_distances` - Show as icon + label + time
   - `floor_plan_types` (from `floorPlanTypes` parse) - Show as chips/badges
   - `payment_breakdown` - Show as milestone cards
   - `usp_bullets` - Show as bullet list
   - `amenities_list` - Show as tag cloud

### Part 2: Verify Extraction Pipeline for Missing Fields

**File: `supabase/functions/_shared/provident/extract.ts`**

Review and enhance extraction patterns:

1. **FAQs extraction** (lines 523-570): Currently looks for "Useful Information", "FAQ", "FAQs" headings
   - Add fallback patterns for "Q&A", "Questions & Answers"
   - Improve bold question pattern matching

2. **Location distances** (lines 449-492): Currently handles "N Minutes – Place" patterns
   - Verify patterns match current Provident HTML structure
   - Add debug logging for extraction success/failure

3. **Floor plan types** (lines 373-425): Currently looks for "Floorplans" section
   - Add validation to ensure floor plan types aren't confused with location data
   - Improve bedroom pattern matching (Studio, 1BR, 2BR, etc.)

**File: `supabase/functions/_shared/provident/pagedata-detail.ts`**

Verify page-data.json parsing:

1. Check if `faqs`, `locationDistances`, `floorPlanTypes` are being extracted from Gatsby JSON
2. Add fallback paths for alternative JSON structures

### Part 3: Form Fixes Across All Site Forms

Based on the codebase, the forms that need attention include:

1. **LeadCaptureModal.tsx** - Download gate form (brochure/floor plan/payment plan)
2. **CallToActionSection.tsx** - Project inquiry form
3. **ConsultationRequestForm.tsx** - Consultation booking form
4. **MeetingBookingModal.tsx** - Meeting scheduling form
5. **RequestValuation.tsx** - Property valuation form
6. **JoinInvestorList.tsx** - Investor signup form
7. **LandlordListForm.tsx** - Landlord registration form
8. **Input.tsx** - Base input component

**Common Issues to Address:**
- Input text visibility (already has "text-black" lock in Input.tsx)
- Form validation feedback styling
- Mobile responsiveness
- Loading states during submission
- Success/error toast messages

---

## Technical Implementation Details

### 1. TestOneListingPanel Enhancements

```tsx
// Add after the checklist section (around line 500+)
// New section: Extracted Data Preview
{testResult.project && (
  <Card className="border-zinc-200 mt-4">
    <CardHeader>
      <CardTitle>Extracted Data Preview</CardTitle>
    </CardHeader>
    <CardContent>
      {/* FAQs */}
      {testResult.project.faqs?.length > 0 && (
        <div className="mb-4">
          <h4>FAQs ({testResult.project.faqs.length})</h4>
          {testResult.project.faqs.map((faq, i) => (
            <div key={i}>
              <strong>{faq.question}</strong>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      )}
      
      {/* Location Distances */}
      {testResult.project.location_distances?.length > 0 && (
        <div className="mb-4">
          <h4>Location Distances ({testResult.project.location_distances.length})</h4>
          {testResult.project.location_distances.map((d, i) => (
            <div key={i}>{d.time} - {d.label}</div>
          ))}
        </div>
      )}
      
      {/* Floor Plans */}
      {testResult.checklist?.floorPlanCount > 0 && (
        <div>Floor Plan Types: {testResult.checklist.floorPlanCount}</div>
      )}
    </CardContent>
  </Card>
)}
```

### 2. Extraction Pattern Improvements

**extract.ts - Enhanced FAQ extraction:**
```typescript
// Add more heading variations
const faqHeadings = [
  "Useful Information", 
  "FAQ", 
  "FAQs", 
  "Frequently Asked Questions", 
  "Q&A",
  "Questions and Answers",
  "Common Questions"
];

// Add pattern for colon-separated Q/A
// Pattern 3: "Q: Question\nA: Answer"
const colonPattern = /Q:\s*([^\n]+)\s*\n+A:\s*([^\n]+)/gi;
```

**extract.ts - Enhanced location distances:**
```typescript
// Add more distance patterns
// Pattern 4: "Place - N minutes" (reversed order)
const distPattern4 = /^-\s+([^–—\-]+?)\s*[–—\-]\s*(\d+\s+Minutes?)/gim;

// Pattern 5: "N km to Place"
const distPattern5 = /^-?\s*(\d+\s*km)\s+(?:to|from)\s+(.+)/gim;
```

### 3. Form Styling Consistency

**Shared form styling to apply:**
```tsx
// Ensure all form inputs use the locked Input component
// Input.tsx already has: "text-black focus:text-black"

// For select dropdowns, ensure similar styling:
"text-black bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]"

// For textareas:
"text-black placeholder:text-muted-foreground"
```

---

## Files to Modify

### New/Modified Files:

1. **`src/components/listing-admin/TestOneListingPanel.tsx`**
   - Add extracted data preview section
   - Display FAQs, location distances, floor plans, payment breakdown
   - Add visual indicators for data completeness

2. **`supabase/functions/_shared/provident/extract.ts`**
   - Enhance FAQ extraction patterns
   - Enhance location distance patterns
   - Add debug logging

3. **`supabase/functions/_shared/provident/pagedata-detail.ts`**
   - Verify extraction paths for Gatsby JSON
   - Add fallback extraction logic

4. **`src/components/project-detail/LeadCaptureModal.tsx`**
   - Review form styling consistency

5. **`src/components/project-detail/CallToActionSection.tsx`**
   - Review form styling consistency

6. **`src/components/ConsultationRequestForm.tsx`**
   - Review form styling consistency

7. **`src/components/MeetingBookingModal.tsx`**
   - Review form styling consistency

---

## Deployment Steps

1. Deploy updated edge functions:
   - `batch-extract-pending`
   - (pagedata-detail.ts and extract.ts are shared, auto-deployed)

2. Test extraction with the "Test One Listing" panel:
   - Verify FAQs appear in result card
   - Verify location distances appear
   - Verify floor plan types appear

3. Run extraction on a fresh listing to validate full pipeline

4. Check form inputs across site for consistent styling

---

## Success Criteria

1. **Test Panel**: Shows extracted FAQs, location distances, floor plans, payment breakdown, USPs, and amenities in the result card (not just checkmarks)

2. **Extraction**: Successfully extracts all Reelly-compatible fields from Provident pages

3. **Live Project Pages**: All sections display correctly with extracted data

4. **Forms**: All input fields have consistent black text on cream background, proper focus states, and work correctly on mobile

