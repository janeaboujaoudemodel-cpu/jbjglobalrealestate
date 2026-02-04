
# Enhanced Reelly-Style Project Detail Layout

## Overview
This plan enhances the project detail pages to fully replicate Reelly's project listing layout, optimized for investors (excluding commission and broker information). The implementation builds upon the existing hybrid design while adding missing Reelly-style sections.

## Analysis Summary

### What Reelly Provides (from API Documentation)
Based on the Reelly API documentation, their platform offers:

**Volume of Information:**
- Names of projects / developers
- Photo / video / PDF presentations  
- Typical layouts / floor plans / prices
- Facilities / apartment filling (amenities)
- Placement on the map / master plan
- Payment Plan
- Inventory overview
- House details
- Project Description
- Date of project addition / update

**For Investors (what we need):**
- Unit-level inventory with sizes, prices, availability
- Construction progress timeline with milestones
- Project media (videos, virtual tours, 3D assets)
- Investment metrics (ROI, rental yield estimates)
- Payment plan breakdown
- Floor plan types and PDFs
- Location with distances to key places

### Already Implemented
Your project detail pages already have:
1. **UnitInventorySection** - Unit types with sizes, prices, availability badges
2. **ConstructionTimelineSection** - Progress bar, milestones, visual timeline
3. **ProjectMediaSection** - YouTube/Vimeo video embedding, virtual tour modals
4. **InvestmentMetricsSection** - ROI, rental yield, estimated annual rental

### Missing/Enhancement Needed
To fully match Reelly's layout, the following additions are needed:

---

## Implementation Plan

### 1. Developer Information Section (New)
Add a dedicated section highlighting developer information with:
- Developer name and logo
- Link to developer profile page
- Number of projects by this developer
- Trust indicators (established date, project count)

### 2. Project Key Facts Bar (Enhancement)
Create a compact "quick facts" horizontal bar showing:
- Property type (Apartments, Villas, Townhouses)
- Total units count
- Building floors
- Availability status badge
- Launch/update date

### 3. Enhanced Payment Plan Visualization (Enhancement)
Improve the payment plan section with:
- Visual pie chart or progress segments showing payment breakdown
- Payment milestones timeline (e.g., 20% on booking, 40% during construction, 40% on handover)
- Post-handover payment option indicator if available

### 4. Master Plan Section (New)
Add a master plan visualization section:
- Display master plan image if available
- Interactive markers for key facilities within the community
- Community highlights and nearby developments

### 5. 3D Assets/Renders Gallery (Enhancement)
Enhance the gallery section to categorize images:
- Exterior renders tab
- Interior renders tab  
- Amenities tab
- Location/aerial views tab
- 3D walkthrough link if available

### 6. Key Distances Display (Enhancement)
Improve the location distances section with:
- Icon-based display (airport, metro, mall, beach, school)
- Driving time vs walking time
- Map visualization with distance markers

### 7. House Details Section (New)
Add a comprehensive "House Details" or "Project Specifications" section:
- Building specifications (floors, total units)
- Unit specifications (ceiling height, balcony sizes)
- Finishing standards
- Parking details
- Service charges

### 8. Data Freshness Indicator (New)
Add a subtle indicator showing:
- Last updated date
- Data source indicator

---

## Technical Implementation

### Database Fields (Already Available)
All required fields are already in the database:
- `unit_types` (jsonb)
- `construction_progress` (integer)
- `construction_start_date`, `expected_completion` (text)
- `video_url`, `virtual_tour_url` (text)
- `roi_estimate`, `rental_yield_estimate` (numeric)
- `total_units`, `available_units` (integer)
- `import_source`, `external_id` (text)

### New Components to Create
1. `DeveloperInfoCard.tsx` - Compact developer information card
2. `QuickFactsBar.tsx` - Horizontal quick facts display
3. `PaymentPlanVisualization.tsx` - Visual payment breakdown
4. `MasterPlanSection.tsx` - Master plan display
5. `HouseDetailsSection.tsx` - Project specifications
6. `DataFreshnessIndicator.tsx` - Update timestamp display

### Component Updates
1. `ProjectDetailLayout.tsx` - Integrate new sections
2. `ProjectDetailData` type - Add any missing fields
3. `useProjects.ts` - Ensure all fields are fetched

### Files to Create
```text
src/components/project-detail/DeveloperInfoCard.tsx
src/components/project-detail/QuickFactsBar.tsx
src/components/project-detail/PaymentPlanVisualization.tsx
src/components/project-detail/MasterPlanSection.tsx
src/components/project-detail/HouseDetailsSection.tsx
src/components/project-detail/DataFreshnessIndicator.tsx
```

### Files to Update
```text
src/components/project-detail/ProjectDetailLayout.tsx
src/pages/ProjectDetail.tsx
```

---

## Section Order (Matching Reelly Flow)

1. **Hero** - Full-screen image with project name, price, developer
2. **Quick Facts Bar** - Property type, units, status (NEW)
3. **Details** - About section with description
4. **Gallery** - Categorized image gallery
5. **Units & Availability** - Unit types grid (existing)
6. **Construction Progress** - Timeline and milestones (existing)
7. **Developer Info** - Developer card (NEW)
8. **USP Highlights** - Unique selling points
9. **Floor Plans** - Floor plan types and downloads
10. **House Details** - Specifications (NEW)
11. **Amenities** - Facilities list
12. **Media** - Video and virtual tour (existing)
13. **Location** - Map and distances
14. **Master Plan** - Community layout (NEW)
15. **Brochure** - Document download
16. **Payment Plan** - Visual breakdown (ENHANCED)
17. **Investment Metrics** - ROI and yields (existing)
18. **FAQ/Useful Info** - Common questions
19. **AI Analyzer** - Market analysis
20. **Mortgage Calculator** - Financing tool
21. **Contact/Inquiry** - Lead capture

---

## Visual Design Guidelines

Following your existing premium design system:
- **Layer 3 cards** (`jj-card-inner`) for all sections
- **Gold accents** for icons and highlights
- **Border styling**: `border-gold/30` with hover state `border-gold/60`
- **Typography**: Consistent with existing `text-h3-sm` for section headers
- **Spacing**: `mb-12` between major sections

---

## Data Mapping for Future API Integration

When Reelly API is connected, the following fields will be populated:

| Reelly API Field | Database Column | Component |
|------------------|-----------------|-----------|
| `project.name` | `name` | Hero |
| `project.developer` | `developer_id` (join) | DeveloperInfoCard |
| `project.units` | `unit_types` | UnitInventorySection |
| `project.constructionProgress` | `construction_progress` | ConstructionTimelineSection |
| `project.videos` | `video_url` | ProjectMediaSection |
| `project.virtualTour` | `virtual_tour_url` | ProjectMediaSection |
| `project.roi` | `roi_estimate` | InvestmentMetricsSection |
| `project.rentalYield` | `rental_yield_estimate` | InvestmentMetricsSection |
| `project.paymentPlan` | `payment_breakdown` | PaymentPlanVisualization |

---

## Benefits for Investors

This layout is optimized for investor needs:
- **Quick unit availability** - See what's available at a glance
- **Construction transparency** - Track project progress
- **Investment potential** - ROI and yield estimates prominently displayed
- **Payment flexibility** - Clear payment plan visualization
- **Due diligence** - All specifications in one place
- **No broker clutter** - Commission info excluded

---

## Estimated Effort

- **New Components**: 6 components (~2-3 hours)
- **Layout Integration**: Update ProjectDetailLayout (~1 hour)
- **Testing & Polish**: Visual refinements (~1 hour)

Total: ~4-5 hours of implementation work
