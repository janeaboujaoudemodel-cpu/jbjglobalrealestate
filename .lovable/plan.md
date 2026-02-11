

# Fix: Developer Logo White Border Edges (All Locations)

## Problem

The developer logo image has `p-1` (4px padding) applied to it inside a white-background container with a gold border. This padding creates visible white edges between the logo and the gold border frame. This has been requested multiple times and the previous plan noted the fix but it was never implemented.

## Root Cause

Line 69 in `DeveloperInfoCard.tsx`: `className="w-full h-full object-contain p-1"` -- the `p-1` adds internal padding, pushing the logo away from the container edges and exposing the white background underneath.

This same `p-1` pattern exists in **7 files** across the codebase, causing the same issue everywhere developer logos appear.

## Fix

Remove `p-1` from the logo `<img>` element in ALL files where developer logos are displayed. The logo will then fill the entire container edge-to-edge while `object-contain` still preserves aspect ratio.

### Files to Update

| File | Line | Change |
|------|------|--------|
| `src/components/project-detail/DeveloperInfoCard.tsx` | 69 | `object-contain p-1` to `object-contain` |
| `src/components/DeveloperCard.tsx` | 90 | `object-contain p-1` to `object-contain` |
| `src/components/DeveloperSearchModal.tsx` | 97 | `object-contain p-1` to `object-contain` |
| `src/components/home/FeaturedListings.tsx` | 180 | `object-contain p-1` to `object-contain` |
| `src/components/ProjectCard.tsx` | 201 | `object-contain p-1` to `object-contain` |
| `src/components/ReellyProjectCard.tsx` | 156 | `object-contain p-1` to `object-contain` |
| `src/components/project-detail/PremiumBrochureCard.tsx` | 153 | `object-contain p-1` to `object-contain` (this is a JBJ monogram, same fix) |

Each change is a single class removal -- `p-1` is deleted, everything else stays the same.

