

## Plan: Expand TOOLS Section in Vertical Sidebar with All Tools Listed

### Problem
The TOOLS section in the vertical sidebar only has one item — "Royal Tools Hub" — which opens a mega menu flyout. The user wants all creative/corporate tools listed directly as sub-items in the sidebar, with "Royal Tools Hub" navigating to `/toolkit` and the section header "TOOLS" opening the discovery screen.

### Changes

**File: `src/components/navigation/GlobalVerticalNav.tsx`**

1. **Expand NAV_ITEMS** — Add all tools from the `creative` mega menu as individual sidebar items under the TOOLS section (after line 75):

| Tool | Icon | Route |
|------|------|-------|
| Corporate Suite | Building | /toolkit/corporate-suite |
| Real Estate Suite | Home | /toolkit/property-suite |
| Video Suite | Video | /toolkit/video-suite |
| Photo Suite | Image | /toolkit/photo-suite |
| Voice & Audio | Mic | /toolkit/voice-suite |
| PDF & Documents | FileText | /toolkit/pdf-suite |
| Stamp Generator | Stamp | /toolkit/stamp-generator |
| Business Card | CreditCard | /toolkit/corporate-suite/business-card |
| Logo Maker | Palette | /toolkit/corporate-suite/logo-creator |
| CV Builder | FileText | /toolkit/corporate-suite/cv-resume |
| Cover Letter | Pen | /toolkit/corporate-suite/cover-letter |
| Company Profile | Award | /toolkit/corporate-suite/company-profile |
| E-Sign | Globe | /e-signature |
| Scan & Sign | FileSearch | /toolkit/scan-sign |
| Brand Palette | Palette | /owner/brand-palette |

2. **Royal Tools Hub** keeps `megaMenu: 'creative'` removed (or kept for flyout), but clicking it navigates to `/toolkit` directly.

3. **Section header "TOOLS"** — When user clicks the TOOLS section header, it expands the section to show all sub-items (no navigation, matching the fix from the previous plan).

### Files to Edit

| File | Changes |
|------|---------|
| `src/components/navigation/GlobalVerticalNav.tsx` | Add 15 tool sub-items under TOOLS section after Royal Tools Hub |

