

## Plan: Ensure /card is fully de-indexed from Google

### Current State
The `/card` page already has three layers of protection, but there's a **critical bug** undermining them:

1. **robots.txt** — `Disallow: /card` ✅ (already present)
2. **DigitalCard.tsx** — Manual `noindex, nofollow` meta tags injected via useEffect ✅
3. **sitemap.xml** — `/card` is NOT listed ✅

### The Bug
In `SEOHead.tsx` line 97-98, `googlebot` and `bingbot` meta tags are **always** set to `index, follow` — even when `noIndex=true`. This means any page using SEOHead with `noIndex` has a contradictory signal: `robots` says noindex but `googlebot` says index. While DigitalCard.tsx uses its own manual meta injection (not SEOHead), the SEOHead component runs globally and could override the manual tags.

### Changes

**1. Fix SEOHead.tsx (line 97-98)** — Make `googlebot` and `bingbot` respect the `noIndex` flag:
```typescript
setMetaTag('googlebot', noIndex ? 'noindex, nofollow' : 'index, follow');
setMetaTag('bingbot', noIndex ? 'noindex, nofollow' : 'index, follow');
```

**2. Add X-Robots-Tag HTTP header equivalent** — In `DigitalCard.tsx`, also set a `<link rel="canonical">` removal to prevent any canonical from leaking, and add an extra `noarchive, nosnippet, noimageindex` to the existing robots tag to be maximally restrictive.

**3. Verify robots.txt** — Already has `Disallow: /card` — no change needed.

This fixes the bug for ALL noIndex pages (executive dashboards, broker training, etc.) while ensuring `/card` remains completely invisible to search engines.

