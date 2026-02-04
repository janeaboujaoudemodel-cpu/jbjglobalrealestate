
# Comprehensive Project Detail Page Enhancement

## Issues Identified from Analysis

### Data Issues from Reelly API
| Issue | Root Cause | Impact |
|-------|-----------|--------|
| **Bedrooms: "Contact Us"** | `bedrooms_min`/`bedrooms_max` are NULL in Reelly data for Amalia | Shows fallback text |
| **Size: "Contact Us"** | `size_min`/`size_max` are NULL in Reelly data | Shows fallback text |
| **Only 1 gallery photo** | Reelly API only provides 1 cover image for this project | Gallery shows single image |
| **"Sold Out" not showing inside page** | `status_label` exists ("Sold Out") but not prominently displayed in hero/header |
| **Hashtags in description** | Description has "##### Project general facts" markdown headers | Renders literally |

### UI/UX Issues
| Issue | Current State | Required State |
|-------|--------------|----------------|
| **Page load slow** | Many components loading sequentially | Add lazy loading + skeleton optimization |
| **Developer section (Dar)** | Black background card | Use premium champagne layer styling |
| **Contact icons** | All using gold styling | WhatsApp=green, Call=blue, Email=gold circles |
| **Payment plan** | Has 3 colors but needs connecting line | Add horizontal timeline with dots |
| **About section markdown** | Showing raw "##### headers" | Parse and style as sections |
| **Finishing/Materials section** | No visuals | Add AI-generated premium photos |
| **Brochure section** | Only visible if brochure doc exists | Always show with inquiry CTA |
| **Location distances** | Exists but needs more prominence | Keep current grid layout |

### Missing Features
- Source links (Reelly + Provident URLs for comparison)
- "Sold Out" badge in page header/hero
- Finishing & Materials visual section with premium stock photos
- Developer detailed info (founded year, projects delivered, worth)

## Implementation Plan

### Phase 1: Data Display Fixes

#### 1.1 Show "Sold Out" Badge in Hero and Quick Facts
Add prominent sold-out status indicator when `status_label` contains "Sold Out":
- Hero section: Red "SOLD OUT" banner overlay
- Quick Facts Bar: Already shows status, ensure red styling
- File: `ProjectDetailLayout.tsx` (lines 399-500)

#### 1.2 Fix Description Markdown Parsing
The description contains raw markdown headers like "##### Project general facts". Update the parser:
- Strip leading `#####` headers and convert to styled section headings
- Add "Finishing and Materials" section with premium visuals
- File: `ProjectDetailLayout.tsx` (description section around line 612-628)

#### 1.3 Handle Missing Bedroom/Size Data Gracefully
When data is NULL, show "View Details" instead of "Contact Us":
- File: `ProjectDetailLayout.tsx` (lines 573-584)

### Phase 2: UI Premium Styling

#### 2.1 Developer Section - Remove Black Background
Update `DeveloperInfoCard.tsx` to use champagne layer styling:
- Change from `bg-premium-bg` (black) to `jj-layer-2` champagne gradient
- Add developer stats from database (founded_year, completed_projects)
- Fetch additional developer info including description

#### 2.2 Contact Us Section - Colored Icon Circles
Update the contact cards (lines 1044-1081):
- WhatsApp: Green circle (`bg-green-500/20`, icon `text-green-500`)
- Call: Blue circle (`bg-blue-500/20`, icon `text-blue-500`)
- Email: Gold circle (keep current `bg-gold/20`)

#### 2.3 Payment Plan Timeline
Update `PaymentPlanVisualization.tsx`:
- Add horizontal timeline with connected dots
- Three-color sections (green, gold, champagne)
- Connecting line between milestones

### Phase 3: Missing Sections

#### 3.1 Finishing & Materials Section
Create new component when description mentions finishing/materials:
- Parse description for "Finishing and materials" section
- Add 3-4 premium stock photos (kitchen, bathroom, flooring)
- Use AI-generated placeholder images for premium look

#### 3.2 Source Links for Comparison
Add "View on Reelly" and "View on Provident" buttons:
- Display in DataFreshnessIndicator component
- Show when `source_url` is available
- Link to original listing for comparison

#### 3.3 Always Show Brochure Section
Show brochure section even when no PDF exists:
- Display "Request Brochure" CTA
- Open inquiry form instead of download

### Phase 4: Performance Optimization

#### 4.1 Lazy Load Sections
Add lazy loading for below-fold sections:
- AI Analyzer
- Mortgage Calculator
- Map embed
- Use React.lazy() + Suspense

#### 4.2 Image Optimization
- Add loading="lazy" to gallery images
- Use skeleton loaders during image load

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/project-detail/ProjectDetailLayout.tsx` | Hero sold-out badge, description parsing, contact icon colors, missing data handling |
| `src/components/project-detail/DeveloperInfoCard.tsx` | Champagne styling, fetch full developer info |
| `src/components/project-detail/PaymentPlanVisualization.tsx` | Timeline with connecting line |
| `src/pages/ProjectDetail.tsx` | Pass developer details to layout |
| `src/hooks/useProjects.ts` | Include developer details in query |
| **NEW** `src/components/project-detail/FinishingMaterialsSection.tsx` | Premium finishing visuals |

## Technical Details

### Hero Sold Out Badge
```tsx
{/* Add after hero title */}
{(project.status_label?.toLowerCase().includes('sold') || 
  project.availability_status?.toLowerCase().includes('sold')) && (
  <div className="absolute top-24 right-4 md:right-8 z-30">
    <Badge className="bg-red-600 text-white px-4 py-2 text-sm font-bold uppercase">
      Sold Out
    </Badge>
  </div>
)}
```

### Contact Icon Colors
```tsx
{/* WhatsApp - Green */}
<div className="w-14 h-14 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center">
  <MessageCircle className="w-7 h-7 text-green-500" />
</div>

{/* Call - Blue */}
<div className="w-14 h-14 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center">
  <Phone className="w-7 h-7 text-blue-500" />
</div>

{/* Email - Gold (keep current) */}
```

### Developer Card Champagne Styling
```tsx
{/* Change from black to champagne */}
<div className="w-full jj-section-champagne border-y border-gold/20">
```

### Developer Query Enhancement
Include founded_year, completed_projects, description:
```typescript
developer:developers(id, name, slug, logo_url, founded_year, completed_projects, description, headquarters)
```

## Expected Results

After implementation:
- Sold Out projects clearly marked in hero + header
- "Contact Us" replaced with "View Details" for missing data
- Developer section uses premium champagne styling with full company info
- WhatsApp=green, Call=blue, Email=gold icon circles
- Payment plan has visual timeline with connecting line
- Description sections properly parsed with styled headings
- Finishing/Materials section with premium visuals
- Performance improved with lazy loading
- Source comparison links available
