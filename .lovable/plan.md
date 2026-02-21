

# Fix AI Price Predictor Accuracy and Global Branded Loader

## Problem 1: Price Predictor Not Using Uploaded Data

The `runPricePredictor` function in `ListingPortalSubmit.tsx` (line 309) calls `property-evaluation` instead of `ai-price-predictor`, and critically:
- Falls back to "Dubai Marina" when location is empty (line 312) instead of using the actual extracted location
- Does NOT send: developer name, project name, purchase price (Opia price), payment plan, handover date, amenities, or listing category
- The result shows "Untitled Listing" and "Unidentified" developer because none of that data reaches the AI

### Fix (ListingPortalSubmit.tsx - `runPricePredictor` function)

Switch from `property-evaluation` to `ai-price-predictor` and pass ALL extracted form data:

```
body: {
  location: form.location || form.area,
  propertyType: form.property_type,
  bedrooms: form.bedrooms,
  size: form.area_sqft,
  developerName: form.developer_name,
  projectName: form.project_name,
  completionYear: form.handover_date,
  currentPrice: form.price,
  paymentPlan: form.payment_plan,
  amenities: form.amenities,
  keyFeatures: form.key_features,
  listingCategory: listingCategory,
  furnishing: form.furnishing,
  bathrooms: form.bathrooms,
  emirate: form.emirate,
}
```

Then map the response fields (`estimatedPrice`, `confidenceBand`, etc.) to the `PricePrediction` interface.

### Fix (Edge Function - `ai-price-predictor/index.ts`)

Update the edge function to:
- Accept new fields: `projectName`, `paymentPlan`, `amenities`, `keyFeatures`, `furnishing`, `bathrooms`, `emirate`, `listingCategory`
- Enrich the AI prompt with ALL these details so the prediction considers: project name, developer tier, actual purchase/Opia price, appreciation timeline, construction progress, payment plan structure, amenities premium, and furnishing status
- Use `google/gemini-2.5-flash` for speed (already configured)
- Add appreciation analysis: calculate from purchase date/Opia price to current market value

### Updated AI Prompt Structure

The system prompt will instruct the AI to:
1. Identify the exact project and developer (not generic area averages)
2. Calculate appreciation from Opia/purchase price to current market value
3. Factor in construction progress and handover timeline
4. Consider amenities and furnishing premium
5. Provide project-specific comparables (not just area-wide)
6. Assess payment plan attractiveness vs market standard

---

## Problem 2: Global Branded Monogram Loader

Currently only 5 files use `BrandedLoader`. Many pages still use generic `Loader2` spinning icons for loading states.

### Changes

Replace `Loader2` with `BrandedLoader` in ALL loading states across the application:

1. **`src/pages/Onboarding.tsx`** (line 215): Replace `Loader2` spinner with `BrandedLoader`
2. **`src/pages/ListingPortalSubmit.tsx`**: Already has monogram for extracting phase; ensure the price predictor loading button also shows the monogram inline
3. **All admin/backend pages**: Audit and replace any `Loader2`-based full-page loading states with `BrandedLoader`

The `BrandedLoader` component (already built) uses `jbj-monogram-light-transparent.png` with pulse animation and gold drop-shadow -- this will be the universal loading indicator.

For inline/button loading states where a full `BrandedLoader` is too large, create a compact `BrandedLoaderInline` variant: a small (24x24) monogram with pulse, usable inside buttons and cards.

---

## Technical Execution Order

1. Update `ai-price-predictor/index.ts` edge function -- accept all new fields, enrich prompt with project-specific intelligence
2. Update `runPricePredictor` in `ListingPortalSubmit.tsx` -- switch to `ai-price-predictor`, pass all form data
3. Update `PricePrediction` interface to include new fields (appreciation, project name, developer)
4. Add `BrandedLoaderInline` variant to `BrandedLoader.tsx`
5. Replace `Loader2` full-page loading states with `BrandedLoader` across: Onboarding, Admin pages, and any other pages using generic spinners
6. Deploy updated edge function

