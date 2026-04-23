

## Already implemented — no code changes needed

This feature is already live. Here's where to find it:

### 1. Deep-link button on every slug row
`src/pages/owner/SeoReview.tsx` (lines 317–358) renders a **View** button in the rightmost column of the Summary table. Each row builds:

```
{canonicalPath}?seoHighlight=1
  &expectedTitle={encoded title}
  &expectedDescription={encoded description}
```

and opens it in a new tab.

### 2. Overlay that highlights the effective title + description
`src/components/SeoHighlightOverlay.tsx` is mounted once globally in `src/App.tsx` (line 86). On any `/services/*` page loaded with `?seoHighlight=1` it:

- Reads the live `<title>` and `<meta name="description">` after `<SEOHead />` injects them (re-reads on every head mutation).
- Compares them to the `expectedTitle` / `expectedDescription` query params and shows a fixed bottom-right inspector card with a **match / mismatch** badge per field.
- Adds a dashed primary-color outline around the first `<h1>` so the effective on-page title is visually located.
- Has a hide/show toggle so it doesn't block the layout.

### How to use it
1. Open `/owner/seo-review`.
2. Click **View** on any slug row → the corresponding `/services/<slug>` page opens in a new tab.
3. The SEO Inspector card appears bottom-right showing live vs. expected `<title>` and meta description, with the H1 outlined.

If you'd like an enhancement on top of this — for example, surfacing the inspector inline on the review page itself (without opening a new tab), highlighting additional elements (canonical link, og:tags), or batch-opening every slug — say which and I'll plan that change.

