

# Fix: Increase Developer Logo Container Size

## Problem
On the `/developers` page, the logo containers in the developer cards are too small (`w-24 h-14` = 96px × 56px), causing some developer logos to appear broken, cropped, or poorly displayed.

## Solution
Increase the logo container dimensions in `DeveloperCard.tsx` to better accommodate all developer logos while maintaining visual consistency with the card design.

---

## Current vs. Proposed Dimensions

| Location | Current Size | Proposed Size |
|----------|-------------|---------------|
| `DeveloperCard.tsx` (logo overlay) | `w-24 h-14` (96×56px) | `w-32 h-20` (128×80px) |

For reference, other places use even larger containers:
- `DeveloperDetail.tsx`: `w-40 h-24` (160×96px)
- `DeveloperInfoCard.tsx`: `w-44 h-28` (176×112px)

---

## Changes Required

### File: `src/components/DeveloperCard.tsx`

**Line 86** - Update logo container dimensions:

```typescript
// BEFORE:
className="w-24 h-14 rounded-lg flex items-center justify-center overflow-hidden"

// AFTER:
className="w-32 h-20 rounded-lg flex items-center justify-center overflow-hidden"
```

**Line 97** - Increase internal padding for better logo display:

```typescript
// BEFORE:
className="max-w-full max-h-full object-contain p-1.5"

// AFTER:
className="max-w-full max-h-full object-contain p-2"
```

**Line 101** - Increase fallback icon size proportionally:

```typescript
// BEFORE:
<Building2 className="w-5 h-5 text-zinc-400" />

// AFTER:
<Building2 className="w-6 h-6 text-zinc-400" />
```

---

## Visual Result

The logo container will increase by approximately 33% in width and 43% in height:
- **Before**: 96px × 56px with 6px padding
- **After**: 128px × 80px with 8px padding

This provides more space for logos to display properly without cropping or appearing squished, while still fitting well within the card's photo section overlay.

---

## Additional Consideration

The larger container will maintain consistency with the premium design system while ensuring all developer logos (regardless of aspect ratio) display correctly. The `object-contain` property ensures logos are never cropped or stretched.

