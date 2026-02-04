
# Company Profile Page - Complete Overhaul Plan

## Summary of Issues to Fix

1. **Founder content not wrapped with FounderContent** - All founder references (name, title, bio, photo) must be wrapped with `<FounderContent>` so they hide when the admin toggle is off
2. **No Footer on page** - Company Profile page doesn't include the Footer component
3. **Service areas shows "Dubai" only** - Should be "GCC & Globally"
4. **PDF generation fails** - Need a robust PDF with proper design, images, table of contents, front/back covers
5. **No photos in sections** - Page needs premium visuals to make it more appealing/book-like
6. **Founder photo missing** - Use the uploaded professional photo (IMG_6707_4.jpg)
7. **Download should show 3D book preview** - When clicking download, show a visual book mockup

---

## Technical Implementation

### Phase 1: Add Founder Photo & Wrap Founder Content

**File: Copy uploaded image to project**
```
user-uploads://IMG_6707_4.jpg → src/assets/founder-company-profile.jpg
```

**File: `src/pages/CompanyProfile.tsx`**

1. **Add imports:**
   - Import `FounderContent` from `@/components/FounderContent`
   - Import `useFounderVisibility` from `@/contexts/FounderVisibilityContext`
   - Import `Footer` from `@/components/Footer`
   - Import `MainLayout` from `@/components/MainLayout`
   - Import founder photo: `import founderCompanyProfile from "@/assets/founder-company-profile.jpg"`

2. **Update PROFILE_CONTENT constant:**
   - Change `serviceAreas: "Dubai"` → `serviceAreas: "GCC & Globally"`

3. **Wrap founder-related content with `<FounderContent>`:**
   - Hero subtitle (`Founder & CEO, Jane Bou Jaoude`) - wrap with fallback to "Company Profile"
   - Section 11 (Founder Profile) - wrap entire section
   - PDF cover page founder subtitle
   - PDF page 11 (Founder Profile page)

4. **Add Footer at the end of the page** (before mobile sticky actions)

---

### Phase 2: Add Premium Visuals to Each Section

**Section-by-Section Visual Enhancement:**

| Section | Visual Addition |
|---------|-----------------|
| Hero | Keep existing luxury-villa-hero.jpeg (full-screen background) |
| Executive Summary | Add side image of Dubai skyline or office interior |
| Brand Story | Add side image of premium real estate |
| Vision/Mission/Values | Add background subtle pattern or Dubai aerial view |
| Services | Add relevant icons (already present) + subtle background image |
| Process | Timeline visual with connecting lines (already present) |
| Differentiators | Keep icon-based cards |
| Areas of Focus | Add Dubai map visual or area thumbnails |
| Client Experience | Keep checkmark icons |
| Trust & Compliance | Keep shield icon |
| Founder Profile | **Add the uploaded founder photo** (wrap in FounderContent) |
| Company Snapshot | Keep info layout |
| CTAs | Keep card layout |
| Download Module | **Add 3D book mockup visual** |

**Images to use:**
- `founder-company-profile.jpg` (uploaded) - Founder section
- `luxury-villa-hero.jpeg` - Hero (existing)
- `dubai-landmarks-hero.mp4` or `burj-khalifa-day-to-night.mp4` - Background video option
- Generate or use existing Dubai skyline images

---

### Phase 3: Enhanced PDF Generation with Images & Book Style

**Complete PDF Rewrite with:**

1. **Table of Contents (Page 2)**
   - List all 12 sections with page numbers

2. **Front Cover (Page 1)**
   - Black background with gold accents
   - JBJ monogram/logo
   - "Company Profile" title
   - Founder name/title (conditionally shown based on visibility)
   - Year

3. **Content Pages (Pages 3-13)**
   - Each page matches web section
   - Consistent header with JBJ branding
   - Page numbers
   - Professional typography

4. **Founder Page (Page 11)**
   - Include founder photo embedded as base64/blob
   - Only generate this page if founder is visible
   - Skip page entirely if founder is hidden

5. **Back Cover (Page 14)**
   - Contact information
   - QR code (optional)
   - Social links
   - Legal disclaimer

**PDF Library Enhancement:**
- Use pdf-lib for base structure
- Embed images by fetching and converting to Uint8Array
- Founder photo only embedded when visible

---

### Phase 4: 3D Book Preview Download Section

**Create a visual book mockup component:**

```
┌────────────────────────────────────────────────────────────────┐
│                    Download Company Profile                     │
│                                                                 │
│              ┌─────────┬─────────┐                              │
│              │         │         │ ← 3D book mockup             │
│              │  JBJ    │  PAGE   │   with pages visible         │
│              │  COVER  │  PEEK   │                              │
│              │         │         │                              │
│              └─────────┴─────────┘                              │
│                                                                 │
│              [Download PDF]  [View Online]                      │
│                                                                 │
│         "12-page A4 Landscape • Professional Format"            │
└────────────────────────────────────────────────────────────────┘
```

**Implementation:**
- Create CSS 3D transform book mockup
- Animate on hover (book opens slightly)
- Show page count and format info

---

### Phase 5: Footer & Layout Integration

**Wrap page in MainLayout or add Footer manually:**

Option 1 (Preferred): Add `<Footer />` after the last section but before mobile sticky actions

Option 2: Wrap entire content in `<MainLayout>` (may affect hero styling)

**Add Footer import and component at end of page:**
```tsx
import Footer from "@/components/Footer";

// ... at end before mobile sticky actions
<Footer />
```

---

## Files to Modify

1. **New file**: Copy `user-uploads://IMG_6707_4.jpg` → `src/assets/founder-company-profile.jpg`

2. **`src/pages/CompanyProfile.tsx`** (complete overhaul):
   - Add imports (FounderContent, Footer, founder photo)
   - Wrap all founder references in `<FounderContent>`
   - Update serviceAreas to "GCC & Globally"
   - Add founder photo to Section 11
   - Enhance PDF generation:
     - Add Table of Contents page
     - Add Back Cover page
     - Embed founder photo (when visible)
     - Conditionally skip founder page when hidden
   - Add 3D book preview component
   - Add Footer before mobile sticky actions

---

## Founder Visibility Logic

When founder visibility toggle is OFF:
- Hero subtitle: "Company Profile" (instead of "Founder & CEO, Jane Bou Jaoude")
- Section 11 (Founder Profile): Completely hidden
- PDF Cover: No founder mention
- PDF Page 11: Not generated / skipped
- PDF Back Cover: No founder mention

When founder visibility toggle is ON:
- All founder content visible with photo
- PDF includes full founder page with embedded photo

---

## Visual Book Style Elements

To make the page feel like a "company profile book":

1. **Page numbering** - Add subtle "Section X of 14" to each section
2. **Gold chapter dividers** - Gold line under each section title
3. **Book spine visual** - Left border gold accent on content cards
4. **Premium typography** - Already using Poppins
5. **Section backgrounds** - Alternating champagne/pearl layers (already present with jj-layer-2)

---

## Testing Checklist

- [ ] Page loads with founder content visible (toggle ON)
- [ ] Toggle OFF in admin: all founder content hidden
- [ ] Footer appears at bottom of page
- [ ] Service areas shows "GCC & Globally"
- [ ] Founder photo appears in Section 11 (when visible)
- [ ] PDF downloads successfully
- [ ] PDF includes Table of Contents
- [ ] PDF includes founder page with photo (when visible)
- [ ] PDF skips founder content (when hidden)
- [ ] 3D book preview displays in download section
- [ ] Mobile responsive layout works
- [ ] All sections have visual enhancement
