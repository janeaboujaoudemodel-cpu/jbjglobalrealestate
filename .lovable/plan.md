
## Fix DLD Market Intelligence Background Layer

### Problem
The outer background section behind the "Dubai Market Intelligence" widget is a square rectangle with no rounded corners, while the inner card has rounded corners and a gold border. The background layer needs matching rounded corners and a gold border. Additionally, the section is touching adjacent listing cards due to insufficient padding.

### Changes

**File: `src/components/shared/DLDMarketWidget.tsx`** (line 78)

Update the outer `<section>` element:

1. **Add rounded corners**: Change from a flat rectangle to `rounded-2xl` (or `rounded-3xl` to be slightly larger than the inner card's `rounded-2xl`)
2. **Add gold border**: Apply `border-2 border-gold/30` to the outer section to match the platform's card standard
3. **Increase vertical padding**: Change `py-12` to `py-16` to add more breathing room so the widget does not touch adjacent listing cards
4. **Add horizontal margin**: Apply the `jj-layer-2` margin class (or `mx-1 sm:mx-2 md:mx-3 lg:mx-4`) so the background layer aligns with other page content and does not go edge-to-edge
5. **Add overflow-hidden**: Ensure the gradient background respects the rounded corners

The updated section wrapper will change from:
```
<section className="py-12" style={{ background: '...' }}>
```
To:
```
<section className="py-16 my-8 rounded-3xl border-2 border-gold/30 overflow-hidden mx-1 sm:mx-2 md:mx-3 lg:mx-4" style={{ background: '...' }}>
```

This adds vertical margin (`my-8`) between the widget and surrounding sections so listing cards do not touch the widget edges.

### Files Summary

| File | Action |
|------|--------|
| `src/components/shared/DLDMarketWidget.tsx` | Update outer section: add rounded corners, gold border, increased padding/margin |
