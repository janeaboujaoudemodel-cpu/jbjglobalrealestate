
# Add Price/Handover Badge to Top-Right Corner of Handpicked Cards

## What Changes

Add a premium badge in the **top-right corner** of each card's image area showing:
- **Starting price** (e.g., "From AED 1.2M") if available -- primary priority
- **Handover date** as fallback if no price exists
- Styled in a warm **amber/gold gradient** with a semi-transparent dark backdrop for readability

## Technical Details

**File:** `src/components/home/FeaturedListings.tsx`

Inside the `ProjectCard` component, add a new absolutely-positioned badge in the image container (lines 155-202), mirroring the developer logo on the left but placed at `top-3 right-3`:

```tsx
{/* Price or Handover badge - Top Right */}
{(project.price_from || project.handover_date) && (
  <div className="absolute top-3 right-3 z-10 px-2.5 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm border border-amber-500/50 shadow-lg">
    {project.price_from ? (
      <span className="text-amber-400 font-bold text-xs">
        From {formatPrice(project.price_from)}
      </span>
    ) : (
      <span className="text-amber-400 font-semibold text-[10px]">
        {project.handover_date}
      </span>
    )}
  </div>
)}
```

The badge uses `text-amber-400` (warm gold-orange) on a dark translucent background for premium contrast against the property photo. This complements the existing gold design language without competing with the developer logo on the left side.

| File | Change |
|---|---|
| `src/components/home/FeaturedListings.tsx` | Add top-right price/handover badge inside the image area of ProjectCard (after the developer logo block, before closing `</div>` of image container) |
