

# Comprehensive Fix: Extraction System & Project Detail Page Institutional Mirroring

## Problems Identified

### 1. Extraction Issues (Test Panel shows "Core Incomplete")
The current extraction fails to capture:
- **Mirrored Documents**: Brochure/floor plan PDFs not being downloaded
- **USP Bullets**: Not extracting the 8 unique selling points
- **Amenities**: Not capturing the 10 amenities (Outdoor Pool, Cinema, etc.)
- **Location Distances**: Not extracting the 12 distance items (5 min to Dubai Opera, etc.)
- **FAQs**: Not extracting the 6 FAQ items
- **Payment Breakdown**: Not capturing 10%/40%/50% structure
- **Images**: Only extracting some images, missing gallery images

### 2. Project Detail Page Missing Structure
Current page is missing the exact Provident layout:
- **Breadcrumb navigation**: Home / All Projects in Dubai / Downtown Dubai / [Project Name]
- **Hero section order**: Title → Developer link → Download Brochure + Register Interest buttons → Breadcrumb
- **Sticky nav tabs**: Details, Gallery, Floor Plans, Amenities, Location, Payment Plans, Brochure
- **CTA sections**: "The best deals are our expertise – register now" section
- **Newsletter section**: "Stay in the loop" email subscription section
- **Floor plan types with thumbnails**: Showing floor plan images with download capability

### 3. Test Panel Preview
- Should show a full preview of the listing as it will appear on the public page
- Clicking the listing or "more" should navigate to the internal project detail page

---

## Implementation Plan

### Phase 1: Fix Extraction Logic (Backend)

**File: `supabase/functions/_shared/provident/extract.ts`**

The extraction regex patterns need to be fixed to capture all sections from the Provident markdown output:

| Section | Current Issue | Fix |
|---------|--------------|-----|
| USP Bullets | Looking for `## Unique Selling Points` but content is under `Unique Selling Points` (no ##) | Update regex to match both formats |
| Amenities | Looking for `## Amenities` but content is inline after the heading | Parse line-by-line after "Amenities" heading |
| Location Distances | Regex `^-\s+\d+\s+Minutes?` doesn't match Provident format `- 5 Minutes – Dubai Opera` | Fix regex to handle en-dash and em-dash |
| FAQs | Looking for `## Useful Information` but uses `##` for Q and text for A | Parse Q/A pairs correctly |
| Payment Breakdown | Pattern expects `(\d+%?)\s*\n+Down Payment` but format is `10%\n\nDown Payment` | Adjust regex to handle double newlines |

```text
Specific fixes needed:

1. extractSection() - Make heading detection more flexible:
   - Accept "## Heading" or just "Heading" followed by newline
   - Handle multiline content blocks

2. Amenities extraction:
   - Current: Looks for `## Amenities` section
   - Fix: Parse lines between "## Amenities" and next heading
   - Each non-empty line that's not "All Amenities" is an amenity

3. USP extraction:
   - Current: extractSection(markdown, "Unique Selling Points")
   - Fix: Look for "Unique Selling Points" then parse:
     - ### headline
     - - bullet points (8 expected)

4. Location distances:
   - Current regex: /^-\s+\d+\s+Minutes?\s+[–-]\s+.+/gim
   - Source format: "- 5 Minutes – Dubai Opera"
   - Fix: Match "- N Minutes – Place" with en-dash (–)

5. Payment breakdown:
   - Source format:
     10%
     
     Down Payment
   - Fix regex to handle blank lines between percentage and label

6. FAQs:
   - Source format: ## Question\n\nAnswer text
   - Fix: Parse each ## as question, following text as answer
```

**File: `supabase/functions/batch-extract-pending/index.ts`**

Ensure the extracted data is properly mapped to database columns:
- `amenities_list` → `amenities` (JSON array)
- `usp_bullets` → JSON array
- `location_distances` → JSON array of {label, time}
- `faqs` → JSON array of {question, answer}
- `payment_breakdown` → JSON object with down_payment, during_construction, on_completion

### Phase 2: Add Breadcrumb Navigation (Frontend)

**File: `src/components/project-detail/ProjectDetailLayout.tsx`**

Add breadcrumb below hero buttons, matching Provident's structure:

```text
Home / All Projects in Dubai / [Area] / [Project Name]
```

Structure:
- "Home" → `/`
- "All Projects in Dubai" → `/properties`
- "[Area]" → `/properties?area=[slug]` (e.g., Downtown Dubai)
- "[Project Name]" → Current page (not linked)

### Phase 3: Enhance Floor Plans Section (Frontend)

**File: `src/components/project-detail/ProjectDetailLayout.tsx`**

Current floor plans show text buttons. Provident shows:
- Floor plan type buttons (1 Bedroom, 2 Bedroom, etc.)
- Floor plan image thumbnail
- "Download Floorplans" button

Add:
- Tab/button group for floor plan types
- Image preview showing floor plan image
- Download button for each type

### Phase 4: Add Missing CTA Sections (Frontend)

**File: `src/components/project-detail/ProjectDetailLayout.tsx`**

Add two new sections matching Provident:

1. **"The best deals are our expertise – register now" section**
   - Title: "Request a call back now" (variation from Provident's wording)
   - Subtitle: "Partner with Dubai's Leading Real Estate Brokerage. Share your details, and our off-plan property expert will call you back shortly."
   - Buttons: "Request a Call Back Now" | "Chat with us now" (WhatsApp)
   - Form: Same fields as Contact page (Name, Email, Phone, Preferred Language, Message)

2. **"Stay in the loop" section**
   - Before footer
   - Email subscription input
   - Links to Terms & Privacy

### Phase 5: Enhance Test Panel Preview (Frontend)

**File: `src/components/listing-admin/TestOneListingPanel.tsx`**

Current test preview shows:
- Small card with metadata checklist
- Basic info grid

Enhance to show:
1. **Full listing card preview** (same as ListingApprovalCard)
2. **Clickable "View Full Page"** button to open `/properties/[slug]` in new tab
3. **Side-by-side comparison**: Source URL iframe vs. extracted preview
4. **AI Audit section**: Use Lovable AI to compare extraction vs source and report missing fields

### Phase 6: Add AI Extraction Audit (Backend + Frontend)

**New File: `supabase/functions/audit-extraction/index.ts`**

Create an edge function that:
1. Takes the extracted data + source URL
2. Calls Lovable AI to compare
3. Returns a list of missing/incorrect fields
4. Suggests fixes

**File: `src/components/listing-admin/TestOneListingPanel.tsx`**

Add "Run AI Audit" button that:
1. Calls `audit-extraction` function
2. Shows audit results (what's missing, what needs fixing)
3. Option to "Auto-Fix" using AI suggestions

---

## Technical Details

### Extraction Regex Fixes

```text
Location Distances Pattern (current):
/^-\s+\d+\s+Minutes?\s+[–-]\s+(.+)/gim

Should be:
/^-\s+(\d+\s+Minutes?)\s+[–—-]\s+(.+)/gim
(Note: Add em-dash — to character class)

USP Section Pattern:
- Look for "Unique Selling Points" or "## Unique Selling Points"
- Parse "### headline" as uspHeadline
- Parse "- bullet" lines as uspBullets

Payment Breakdown Pattern (current):
/(\d+%?)\s*\n+Down Payment/i

Should be:
/(\d+)\s*%?\s*\n+\s*\n*Down Payment/i
(Handle optional blank line between number and label)
```

### Database Field Mapping

| Extracted Field | DB Column | Type |
|----------------|-----------|------|
| `amenities` | `amenities_list` | JSONB array |
| `uspBullets` | `usp_bullets` | JSONB array |
| `locationDistances` | `location_distances` | JSONB array |
| `faqs` | `faqs` | JSONB array |
| `paymentBreakdown` | `payment_breakdown` | JSONB object |

### Breadcrumb Component Structure

```text
<nav className="flex items-center gap-2 text-sm">
  <Link to="/">Home</Link>
  <span>/</span>
  <Link to="/properties">All Projects in Dubai</Link>
  <span>/</span>
  <Link to={`/properties?area=${areaSlug}`}>{areaName}</Link>
  <span>/</span>
  <span className="text-gold">{projectName}</span>
</nav>
```

---

## Files to Modify

### Backend (Edge Functions)
1. `supabase/functions/_shared/provident/extract.ts` - Fix all extraction regex patterns
2. `supabase/functions/batch-extract-pending/index.ts` - Verify field mapping
3. `supabase/functions/audit-extraction/index.ts` (NEW) - AI-powered extraction audit

### Frontend
1. `src/components/project-detail/ProjectDetailLayout.tsx` - Add breadcrumb, CTA sections, floor plan images
2. `src/components/listing-admin/TestOneListingPanel.tsx` - Full preview, clickable listing, AI audit
3. `src/components/project-detail/ProjectBreadcrumb.tsx` (NEW) - Reusable breadcrumb component
4. `src/components/project-detail/FloorPlanGallery.tsx` (NEW) - Enhanced floor plan display
5. `src/components/project-detail/CallToActionSection.tsx` (NEW) - "Best deals" CTA section
6. `src/components/project-detail/NewsletterSection.tsx` (NEW) - "Stay in the loop" section

---

## Validation Checklist

After implementation, verify:

1. **Test Extraction**:
   - Run test extraction on Inaura Hotels & Residences
   - Verify all 8 USP bullets are extracted
   - Verify all 10 amenities are extracted
   - Verify all 12 location distances are extracted
   - Verify 6 FAQs are extracted
   - Verify payment breakdown (10%/40%/50%) is extracted
   - Verify brochure PDF is mirrored

2. **Project Detail Page**:
   - Breadcrumb shows: Home / All Projects in Dubai / Downtown Dubai / Inaura Hotels & Residences
   - Hero has: Title → Developer → Download Brochure + Register Interest → Breadcrumb
   - Sticky nav tabs all work
   - Floor plans show images with download buttons
   - "Request a call back" CTA section present
   - "Stay in the loop" newsletter section before footer

3. **Test Panel**:
   - Shows full listing card preview
   - "View Full Page" opens internal URL
   - AI Audit shows comparison results

---

## Priority Order

1. **Critical (Phase 1)**: Fix extraction regex - Without this, no data flows to the page
2. **High (Phase 2-3)**: Breadcrumb + Floor plans - Core Provident parity features
3. **Medium (Phase 4-5)**: CTA sections + Test panel enhancements
4. **Nice-to-have (Phase 6)**: AI Audit for automated quality checks

