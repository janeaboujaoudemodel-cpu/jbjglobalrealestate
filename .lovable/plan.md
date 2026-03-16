

## Company Profile — Premium Cover Generation & Standalone Strip

### What needs to happen

1. **Generate proper front & back covers** for the Company Profile using AI image generation (Lovable AI). The current `company-profile-cover.jpg` is a generic placeholder. We will generate a premium branded cover featuring "JBJ GLOBAL REAL ESTATE" / "Company Profile" with gold/black luxury styling, and a back cover with contact details and branding.

2. **Add back cover support** to the `BookData` type — add an optional `backCover?: string` field so the Company Profile (and future books) can reference a back cover image.

3. **Update the cover asset everywhere** — since the cover is imported from `src/assets/books/company-profile-cover.jpg`, replacing that file automatically updates all places: the marquee strip, the `CompanyProfileBrochure` 3D book, the guides library, etc.

4. **Separate Company Profile into its own premium strip** on the homepage marquee — remove it from the scrolling book strip and render it below in a dedicated, static premium row with larger sizing, 3D book treatment, and descriptive text (reusing `CompanyProfileBrochure`).

### Files to change

**`src/types/books.ts`**
- Add `backCover?: string` optional field to `BookData`

**`src/data/bookCollections.ts`**
- Add back cover import for company profile
- Set `backCover` on `companyProfileBook`

**`src/components/home/HomepageBookMarquee.tsx`**
- Filter out `Company Profile` from the scrolling marquee strip (like `Guides Library` is already filtered)
- Add a new premium standalone section below the marquee with a gold divider, featuring the `CompanyProfileBrochure` component centered on its own row with premium styling

**`src/components/books/CompanyProfileBrochure.tsx`**
- No structural changes needed — it already renders the 3D book. The new cover image will flow through automatically.

**AI Image Generation (edge function or inline)**
- Use Lovable AI (`google/gemini-3-pro-image-preview`) to generate:
  - **Front cover**: Black/gold luxury design — "JBJ GLOBAL REAL ESTATE" in gold, "Company Profile" subtitle, geometric/architectural elements, 18-page document feel
  - **Back cover**: Matching design with contact info placeholder, QR code area, gold accents
- Save generated images to Lovable Cloud storage, then download and place in `src/assets/books/`

### Implementation order

1. Generate front + back cover images via AI
2. Replace `company-profile-cover.jpg` and add back cover asset
3. Update `BookData` type and `bookCollections.ts`
4. Update `HomepageBookMarquee.tsx` to separate the Company Profile into its own premium row below the scrolling strip

