

## Fix Company Profile PDF Download and Add Owner Download Controls

### Problem
1. The "Download Company Profile" button fails with "Failed to generate PDF, please try again"
2. The Owner needs the ability to download **two versions** from the Admin Panel: one with founder details, one without
3. The public website download should always respect the Founder Visibility toggle

### Root Cause of PDF Failure
The `generatePDF` function in `CompanyProfile.tsx` (line 290-698) uses `pdf-lib` to build a 13-page A4 landscape PDF entirely client-side. The most likely failure point is at the font embedding or page drawing stage -- `pdf-lib`'s `StandardFonts.Helvetica` should work, but certain special characters (like the checkmark "✓" on line 593 of the PDF code) are NOT supported by standard PDF fonts and will throw an encoding error. This is the bug: the Client Experience page uses `"✓"` which is outside the WinAnsi encoding range supported by `StandardFonts.Helvetica`.

### Plan

**1. Fix the PDF generation error** (`src/pages/CompanyProfile.tsx`)
- Replace the `"✓"` character (used in the Client Experience page, PDF page 10) with a supported alternative like `">"` or a bullet `"*"` that is within WinAnsi encoding
- This is the change that will fix the "Failed to generate PDF" error

**2. Add a `generatePDF` parameter for founder inclusion** (`src/pages/CompanyProfile.tsx`)
- Refactor `generatePDF` to accept an optional `includeFounder: boolean` parameter
- When called from the public page, it uses the current `isFounderVisible` value (respects the global toggle)
- Export the PDF generation logic as a standalone function so it can be reused from the Admin Panel

**3. Create Admin download controls** (`src/components/admin/CompanyProfileDownload.tsx`)
- New component placed alongside the existing `FounderVisibilityToggle` in the Admin Panel settings tab
- Two download buttons:
  - "Download Company Profile (Standard)" -- generates PDF **without** founder pages
  - "Download Company Profile (With Founder)" -- generates PDF **with** founder pages, regardless of global toggle
- Both use the same PDF generation logic from step 2

**4. Wire into Admin Panel** (`src/pages/Admin.tsx`)
- Import and place `CompanyProfileDownload` in the settings tab, next to the existing `FounderVisibilityToggle` and `PodcastVisibilityToggle` grid

### Technical Details

| File | Change |
|------|--------|
| `src/pages/CompanyProfile.tsx` | Replace `"✓"` with `">"` in PDF generation (line ~593). Refactor `generatePDF` to accept `includeFounder` boolean parameter. Extract as exportable utility. |
| `src/utils/generateCompanyProfilePDF.ts` | New file: extracted PDF generation function that accepts `{ includeFounder: boolean }` |
| `src/components/admin/CompanyProfileDownload.tsx` | New component: card with two download buttons (with/without founder) |
| `src/pages/Admin.tsx` | Import and add `CompanyProfileDownload` to the settings tab grid |

### How It Works
- **Public website**: The download button calls `generatePDF()` which checks the global `isFounderVisible` toggle -- when the toggle is OFF, the founder page is excluded from the PDF automatically (this already works in the existing code)
- **Admin Panel**: Two explicit buttons bypass the global toggle -- one always includes founder, one always excludes
- **Founder Visibility toggle**: When toggled ON, the founder section appears on the website AND in the public PDF. When OFF, both are hidden. The Admin Panel always offers both options regardless of toggle state.
