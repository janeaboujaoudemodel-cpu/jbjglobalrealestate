

## Fix Logo Background Color Matching (Server-Side Approach)

### Why the Current Approach Fails

The client-side canvas color extraction requires CORS headers from the image CDN. Most developer logos are hosted on `reelly-backend.s3.amazonaws.com` which does NOT return `Access-Control-Allow-Origin` headers. This means:
- The hidden CORS image always fails to load
- The background always stays white
- White edges are visible around every logo

Client-side canvas extraction will NEVER work for these images. We need a server-side solution.

### Solution: Pre-Compute Logo Colors Server-Side

**Step 1: Add `logo_bg_color` column to `developers` table**

A new text column to store the pre-computed background color (e.g., `"rgb(0,0,0)"` for Emaar's black logo, `"rgb(200,30,30)"` for Noob's red logo).

**Step 2: Create a backend function `extract-logo-colors`**

This function will:
- Fetch all developers that have a `logo_url` but no `logo_bg_color`
- For each logo, fetch the image server-side (no CORS restrictions on the server)
- Decode the image and sample the 4 corner pixels to find the dominant background color
- Store the result in the `logo_bg_color` column
- Uses the `imagescript` Deno library for image decoding

**Step 3: Update `DeveloperCard.tsx` to use pre-computed colors**

- Remove the dual-load CORS approach entirely (no more hidden Image objects)
- If `developer.logo_bg_color` exists, set the logo container background to that color directly
- No canvas, no CORS, no runtime image processing -- just read the color from the database
- Keep `p-1` padding on the logo image for clean spacing
- Keep `object-contain` so logos are never cropped

**Step 4: Fix Binghatti logo**

The Binghatti logo is at `/developers/logos/binghatti-logo.webp` (local file). Verify it exists and renders. Since it's same-origin, the canvas approach would work for it, but with the server-side solution it will be handled uniformly with all other logos.

### Technical Implementation

| # | Type | Change |
|---|------|--------|
| 1 | Database | Add `logo_bg_color TEXT` column to `developers` table |
| 2 | Backend Function | Create `extract-logo-colors` function that batch-processes all developer logos server-side, decodes images, extracts corner pixel colors, and stores results |
| 3 | Frontend | Update `DeveloperCard.tsx`: remove dual-load CORS logic, read `logo_bg_color` from developer data, apply as container background style |
| 4 | Frontend | Update developer type/query to include `logo_bg_color` field |
| 5 | Run | Call the backend function once to populate all 539 developers |

### How It Works

```text
Before (broken):
  Browser loads logo -> tries CORS copy -> CORS blocked -> white background stays

After (fixed):
  Database already has color -> DeveloperCard reads it -> applies immediately
  No CORS, no canvas, no runtime processing
```

### Result

- Every logo box will have its background matching the logo's own background color
- Emaar: black box, Noob: red box, Omniyat: dark box, etc.
- Azizi and Emtiaz will remain unchanged (already look good)
- Binghatti logo will be visible with proper background color
- Zero CORS errors in console
- Zero runtime performance cost (colors are pre-computed)

