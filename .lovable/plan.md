
# Add "Hide Sold Out" Toggle to Properties Pages

## What It Does
Adds a simple toggle/switch on both the Properties and Properties Reelly pages that lets you hide all "Sold Out" projects from the listing with one click.

## Changes

### 1. Properties Page (`src/pages/Properties.tsx`)
- Add a `hideSoldOut` boolean to the extended filter state (default: `false`)
- Add a toggle switch (using the existing Switch component) next to the existing filter controls, labeled "Hide Sold Out" with a red dot indicator
- When enabled, filter out projects where `status_label` contains "Sold Out" or `is_sold_out` is true

### 2. Properties Reelly Page (`src/pages/PropertiesReelly.tsx`)
- Add a `hideSoldOut` boolean to the FilterState (default: `false`)
- Add the same toggle switch in the filter bar
- When enabled, filter out projects where `sale_status` contains "Sold Out"

### 3. Project Filters Hook (`src/hooks/useProjectFilters.ts`)
- Add `hideSoldOut` support: when true, exclude projects where `status_label` includes "sold" or "out of stock", or where `is_sold_out === true`

## Technical Details
- The toggle will be a small `Switch` component with a label, placed inline with the existing filter controls
- The filter is applied client-side on the already-fetched data, so it works instantly with no extra API calls
- The toggle state is included in the applied filters flow (same pattern as other filters)
- On the Reelly page, the filter is applied in the `sortedProjects` memo before rendering
