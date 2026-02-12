

# Fix Binghatti Logo Display Across Pages

**Scope**: Developer detail page and project detail page only. Homepage and developer strap are NOT touched.

## Problem
The Binghatti logo (`/developers/logos/binghatti-logo.webp`) is currently in the database but displays poorly on certain pages due to styling choices (black background, `object-cover` with `scale(1.2)`) that work for some logos but not this one.

## What Will Change

### 1. DeveloperDetail.tsx - Logo Frame Fix
The developer detail page currently uses a black background with `object-cover` and `scale(1.2)`, which crops/distorts the Binghatti logo. Will update the logo frame to:
- Use a **white background** instead of black (ensures the logo is readable regardless of its colors)
- Switch from `object-cover` to `object-contain` with proper padding (`p-2`) so the full logo is visible
- Remove the forced `scale(1.2)` transform

### 2. DeveloperInfoCard.tsx - Already Correct (Minor Check)
This component on project pages already uses `bg-white` and `object-contain`. No changes needed here -- the logo should display correctly already.

### 3. AreaDevelopersBar.tsx - No Changes Needed
This component pulls logos dynamically from the database and uses `object-contain`. It will automatically show the correct logo.

### 4. NOT Touched (Locked)
- `DeveloperPartnersMarquee.tsx` (homepage strap) -- locked, not modified
- `Index.tsx` (homepage) -- locked, not modified

## Technical Details

**File: `src/pages/DeveloperDetail.tsx`** (lines 162-181)
- Change `background: '#000000'` to `background: '#FFFFFF'`
- Change `className="w-full h-full object-cover p-0"` to `className="w-full h-full object-contain p-2"`
- Remove `style={{ transform: 'scale(1.2)' }}`

This is a universal improvement -- white background with `object-contain` and padding is the standard logo tile pattern used across the site (per the canonical directory standard).

