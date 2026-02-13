

## Fix All Broken/Missing News Article Images

### Issues Found

| # | Article | Problem |
|---|---------|---------|
| 1 | "CapitaLand Investment opens office at DIFC" | `image_url` is NULL |
| 2 | "The real story told by Dubai's cooling property market" | `image_url` is NULL |
| 3 | "Private Islands in Dubai" | `image_url` is NULL |
| 4 | "DLD launches Phase II of Real Estate Tokenisation Project" | `image_url` is the WAM site logo, not an article image |
| 5 | "The Residences, DIFC Zabeel District..." | `image_url` is a Zawya page URL, not an image file |
| 6 | "10 Most Common Dubai Real Estate Buzzwords" | `image_url` is the literal string `don't_remove` |
| 7 | "Daleel co-founder on why Dubai's property market needs AI" | `image_url` is a JSON array string, not a URL |

**Total: 7 articles with broken or invalid images**

Additionally, 487 articles still use external image URLs (not yet mirrored to storage). These are not broken today, but are at risk of hotlink blocking. Mirroring them is a separate batch operation.

### Fix Plan

**Step 1: Direct database updates for the 7 broken articles**

Using data gathered from scraping and web search:

- **Article 1 (CapitaLand/DIFC)**: Set to NULL (WAM blocks scraping; the UI gradient fallback will render a themed placeholder)
- **Article 2 (Dubai cooling market)**: Set to the OG image extracted from The National: `https://www.thenationalnews.com/resizer/v2/2VE63RR4UFCY3NFDQSPJIZVEHI.jpg?smart=true&auth=...&width=1200&height=630`
- **Article 3 (Private Islands)**: Scrape Property Finder blog page for the featured image and set it
- **Article 4 (DLD Tokenisation)**: Set to NULL (WAM logo is not an article image; fallback placeholder is better)
- **Article 5 (Residences DIFC)**: Set to NULL (a page URL was stored instead of an image)
- **Article 6 (Buzzwords)**: Set to NULL (literal string "don't_remove" is not an image)
- **Article 7 (Daleel/AI)**: Extract the second URL from the JSON array (the actual article image) and set it as the image_url

**Step 2: Run mirror-news-images to permanently host the fixed images**

After updating the URLs, invoke the `mirror-news-images` edge function to download and re-host any new external images in storage, preventing future hotlink failures.

### No Code Changes Required

All fixes are data-only (UPDATE statements). The existing UI already handles NULL images with a premium gradient fallback card, so setting broken entries to NULL is the correct approach when no real image can be found.

