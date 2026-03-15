

## Company Profile Unification Plan

### What the PDF contains (18 pages)
1. Cover page (front)  
2. Company Overview  
3. Platform Positioning  
4. Founder & CEO  
5. Our Mission  
6. Our Vision  
7. Core Values  
8. Services (8 services)  
9. AI Tools & Creativity  
10. Real Estate Marketplace  
11. Dubai as a Destination  
12. Prime Areas of Focus (8 areas)  
13. Platform Benefits  
14. Portfolio Highlights  
15. Investor Journey  
16. Partner Network  
17. Back cover (branded)  
18. Contact page  

### Two-track approach

**Track A: Downloads** -- Every "Download Company Profile" button across the entire platform will serve this exact uploaded PDF file as-is, no generation, no editing. The old `generateCompanyProfilePDF()` function (which builds a PDF from code using pdf-lib) will be replaced with a simple fetch-and-download of the static file.

**Track B: Web page** -- The `/company-profile` page keeps its current structure (table of contents, sectioned layout). The `PROFILE_CONTENT` object will be updated/merged with the new content from the PDF (new sections like Platform Positioning, AI Tools, Marketplace, Dubai Destination, Prime Areas, Platform Benefits, Portfolio Highlights, Investor Journey, Partner Network). Existing sections (Executive Summary, Brand Story, Vision, Mission, Values, Services, Process, Areas, Client Experience, Trust, Founder, Snapshot) will have their text updated to match the PDF where different.

### Affected files and changes

**1. `public/documents/JBJ-Global-Real-Estate-Company-Profile.pdf`**  
- Copy the uploaded PDF here as the single source of truth for all downloads.

**2. `src/assets/books/company-profile-cover.jpg`**  
- Replace with page 1 screenshot from the PDF (the front cover image) so the 3D book cover everywhere matches the new PDF.

**3. `src/utils/generateCompanyProfilePDF.ts`**  
- Gut the entire pdf-lib generation logic.
- Replace with a simple function that fetches `/documents/JBJ-Global-Real-Estate-Company-Profile.pdf` and triggers a browser download.
- Remove the `includeFounder` parameter (single file, no variants).

**4. `src/pages/CompanyProfile.tsx`**  
- Update `PROFILE_CONTENT` to merge new PDF content:
  - Update `executiveSummary` with Company Overview text from PDF page 2
  - Update `vision` and `mission` from pages 5-6
  - Update `values` with the 5 values from page 7 (Transparency, Client Focus, Market Knowledge, Professional Execution, Long-term Relationships)
  - Update `services` to include all 8 from page 8 (add Client Onboarding, Mortgage & Legal Coordination)
  - Add new sections: Platform Positioning, AI Tools & Creativity, Real Estate Marketplace, Dubai Destination, Prime Areas of Focus, Platform Benefits, Portfolio Highlights, Investor Journey, Partner Network
  - Update `founderProfile` with page 4 content and founder principles
  - Update areas list to match page 12 (Downtown Dubai, Business Bay, Dubai Marina, Palm Jumeirah, Dubai Hills Estate, MBR City, Dubai Creek Harbour, Jumeirah Bay Island)
- Update `generatePDF` to call the new simple download function (no `isFounderVisible` parameter).
- Update the download section text (remove "13/12 page A4 Landscape" -- replace with "18-page Company Profile").
- Update table of contents to reflect all new sections.

**5. `src/components/admin/CompanyProfileDownload.tsx`**  
- Remove the two-button (Standard/With Founder) approach.
- Single "Download Company Profile" button that downloads the static PDF.

**6. `src/data/bookCollections.ts`**  
- Update `companyProfileBook.tableOfContents` to reflect the 18-page PDF chapters.

**7. `src/components/books/CompanyProfileBrochure.tsx`**  
- No logic change needed (it already uses `companyProfileBook.cover` which will point to the new cover image).

**8. `src/components/home/OverseasInvestorsBanner.tsx`**  
- No change needed (uses `CompanyProfileBrochure` component which auto-updates).

**9. Global audit log**  
- Log this change via `logGlobalAudit` with action `company_profile_replaced`, documenting the switch from generated PDF to static PDF.

### What stays the same
- The `/company-profile` web page structure and design (sections, animations, styling)
- The 3D book component and its usage across homepage marquee, overseas banner, press kit
- The `/toolkit/corporate-suite/company-profile` (CompanyProfileBuilder) -- this is a separate generic tool, not the JBJ company profile
- Footer links, navigation routes

### Summary of scope
- 6 files modified, 2 new assets added (PDF + cover image)
- All download paths converge to one static PDF
- Web page enriched with new content sections from PDF
- Book cover updated to match PDF front page
- Audit trail logged

