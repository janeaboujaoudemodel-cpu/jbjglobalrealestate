
# FAQ Gold Styling, Book System, Company Profile, and WhatsApp Fix

This plan addresses four major areas: FAQ active state styling, consistent book system across pages, company profile premium overhaul, and WhatsApp/contact link blocking fix.

---

## 1. FAQ Accordion -- Gold Active State (Title and Arrow)

**Problem:** When an FAQ item is expanded, the title and chevron arrow remain the default color instead of turning gold.

**Fix in `src/components/ui/accordion.tsx`:**
- Add `[&[data-state=open]]:text-[#C8A766]` to the `AccordionTrigger` className (line 25) so that when open, both the trigger text and the ChevronDown icon turn champagne gold
- Also add `[&[data-state=open]>svg]:text-[#C8A766]` to explicitly color the arrow gold
- This is a global change -- every Accordion across every page (Golden Visa FAQ, Portfolio FAQ, Report Access FAQ, Snagging FAQ, etc.) will automatically inherit the gold active styling

---

## 2. Consistent Book System Across All Pages

**Problem:** Books are only rendered on InvestorHub and BrokerHub via `BookShelf`. The user wants the same books to appear on every page that has related guide/content, using the same covers and titles everywhere.

### 2a. Add a `NEWS_BOOKS` collection and `companyProfileBook` export

**Fix in `src/data/bookCollections.ts`:**
- Add a new `newsBook` entry with title "News & Updates", a cover image, href `/news`, and category `report`
- Export a new `NEWS_BOOKS` collection containing the news book
- The `COMPANY_BOOKS` collection already exists with `companyProfileBook` -- export it individually too for single-book usage

### 2b. Add BookShelf to pages that have guide/book content

Add the `BookShelf` component to these pages (importing from `bookCollections.ts`):

| Page | Books to Show |
|------|--------------|
| `/guides` (GuidesPage) | Full `INVESTOR_BOOKS` collection (all guides + FAQs) |
| `/guides/golden-visa-uae` (GoldenVisaGuide) | `goldenVisaBook` single + related guides |
| `/buyer-guide` | `buyerGuideBook` + related |
| `/seller-guide` | `sellerGuideBook` + related |
| `/landlord-guide` | `landlordGuideBook` + related |
| `/rent-guide` | `rentGuideBook` + related |
| `/tenant-guide` | `tenantGuideBook` + related |
| `/company-profile` | `COMPANY_BOOKS` collection |
| `/news` (News page) | `NEWS_BOOKS` collection |

Each page will import `BookShelf` and render it near the top or after the hero, using the same book data and covers as everywhere else.

### 2c. Upgrade BookShelf visual style

**Fix in `src/components/books/BookShelf.tsx`:**
- Upgrade the book card container from dark zinc to a premium champagne/pearl style matching the site theme
- Add a subtle gold border around each book cover
- Add a slight shadow and hover glow effect for premium feel
- The book covers remain the same images -- consistent across all pages

---

## 3. Company Profile Page -- Premium Overhaul

**Problem:** Huge gaps between sections, plain styling, no table of contents, book cover needs founder photo with Downtown/Burj Khalifa background.

### 3a. Reduce Section Padding

**Fix in `src/pages/CompanyProfile.tsx`:**
- Change `SectionShell` padding from `py-12 md:py-16` (line 46) to `py-8 md:py-10` to tighten spacing between all sections
- This eliminates the large gaps the user reported

### 3b. Add Table of Contents

- Add a sticky or anchor-based Table of Contents section after the hero, listing all sections (Executive Summary, Brand Story, Vision/Mission/Values, Services, Process, etc.)
- Each item links to its section via anchor IDs

### 3c. Upgrade Book Cover with Founder Photo

**Fix in the `BookPreview3D` component (line 221-285):**
- Replace the plain black/JBJ text cover with a premium cover that includes:
  - Background: Downtown Dubai skyline with Burj Khalifa (using existing hero image or a CDN photo)
  - Foreground: Founder photo overlay (using `founderCompanyProfile` import already in the file)
  - Gold "COMPANY PROFILE" title text overlay
  - Gold accent bars top and bottom
- Wrap founder photo display in `FounderContent` so it only shows when founder visibility is enabled

### 3d. Add Visuals and Photos

- Add a premium Dubai skyline divider image between major sections
- Use the existing `luxuryVillaHero` and `founderCompanyProfile` assets more prominently
- Add gold gradient dividers between sections instead of plain spacing

### 3e. Add BookShelf with Company Profile Book

- Import `BookShelf` and `COMPANY_BOOKS` from `bookCollections`
- Render the BookShelf section near the PDF download area

---

## 4. WhatsApp and Contact Links -- Fix Blocking

**Problem:** `window.open('https://wa.me/...', '_blank')` gets blocked by popup blockers and iframe sandboxing. The `ContactActions.tsx` helper already uses `window.location.href` which works, but many pages still use `window.open`.

### 4a. Fix Contact page

**Fix in `src/pages/Contact.tsx` (line 206):**
- Change `window.open(getWhatsAppUrl(), '_blank')` to `window.location.href = getWhatsAppUrl()`

### 4b. Fix all other public-facing pages using `window.open` for WhatsApp

Replace `window.open(...wa.me..., '_blank')` with `window.location.href = ...` in these files:
- `src/pages/Compare.tsx` (line 684)
- `src/pages/Favorites.tsx` (line 201)
- `src/pages/PropertyEvaluator.tsx` (line 1180)
- `src/pages/VideoMeeting.tsx` (lines 503, 1462)
- `src/pages/DigitalCard.tsx` (lines 143, 227)

Admin/CRM pages (CRMLeadDetail, CRMLeadsInbox, KanbanPipeline, etc.) can keep `window.open` since those are internal tools not subject to iframe/popup restrictions.

### 4c. Fix component-level WhatsApp calls

Replace `window.open` with `window.location.href` in these public-facing components:
- `src/components/ChatTracker.tsx` (line 44)
- `src/components/FloatingWhatsApp.tsx` -- already uses `window.location.href` (confirmed correct)
- `src/components/jbj-broker/SecureLeadCard.tsx` (line 60)

### 4d. Ensure Google Maps links are not blocked

Search for any Google Maps `window.open` calls and convert to `window.location.href` or proper `<a>` tags with `target="_blank"` and `rel="noopener noreferrer"`.

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/components/ui/accordion.tsx` | Add gold text + arrow color on `[data-state=open]` |
| `src/data/bookCollections.ts` | Add `NEWS_BOOKS`, export individual books for single-page use |
| `src/components/books/BookShelf.tsx` | Premium visual upgrade to match champagne theme |
| `src/pages/CompanyProfile.tsx` | Reduce section padding, add TOC, upgrade book cover with founder photo, add visuals/dividers |
| `src/pages/Contact.tsx` | Fix WhatsApp `window.open` to `window.location.href` |
| `src/pages/Compare.tsx` | Fix WhatsApp link |
| `src/pages/Favorites.tsx` | Fix WhatsApp link |
| `src/pages/PropertyEvaluator.tsx` | Fix WhatsApp link |
| `src/pages/VideoMeeting.tsx` | Fix WhatsApp links (2 locations) |
| `src/pages/DigitalCard.tsx` | Fix WhatsApp links (2 locations) |
| `src/components/ChatTracker.tsx` | Fix WhatsApp link |
| `src/components/jbj-broker/SecureLeadCard.tsx` | Fix WhatsApp link |
| Multiple guide pages | Add `BookShelf` component with consistent book collections |
