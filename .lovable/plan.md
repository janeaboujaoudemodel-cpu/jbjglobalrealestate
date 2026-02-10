

# Sort Available Projects First, Sold Out Last

## Change

Add a final sort step in the `sortedProjects` memo (in `src/pages/PropertiesReelly.tsx`, around line 201-227) that always pushes sold-out projects to the bottom of the list, regardless of the selected sort order.

After any existing sort (price, name, newest), apply a stable partition:
- Projects where `sale_status` or `status_label` includes "sold" or "out of stock" go to the end
- All other (available/active) projects stay at the top, preserving their relative order

## Technical Detail

In `src/pages/PropertiesReelly.tsx`, after the `switch` block (line 224), add:

```typescript
// Always show available projects first, sold out last
sorted.sort((a, b) => {
  const aIsSold = (a.sale_status || a.status_label || '').toLowerCase();
  const bIsSold = (b.sale_status || b.status_label || '').toLowerCase();
  const aSold = aIsSold.includes('sold') || aIsSold.includes('out of stock');
  const bSold = bIsSold.includes('sold') || bIsSold.includes('out of stock');
  if (aSold === bSold) return 0;
  return aSold ? 1 : -1;
});
```

## Files Changed

- **`src/pages/PropertiesReelly.tsx`** -- Add sold-out-last sorting after existing sort logic

