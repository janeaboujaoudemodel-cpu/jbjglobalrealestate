

## Update Andaman Riviera Logo Background to White

### Problem
The Andaman Riviera developer card has a logo background color of `rgb(237,235,231)` (off-white/beige), which doesn't look clean. The user wants a proper white background box for this developer.

### Solution
Update the `logo_bg_color` value for Andaman Riviera in the database to `#FFFFFF` (pure white). No code changes needed -- the existing card logic already reads `logo_bg_color` and applies it as the background.

### Technical Details
- Run a single database migration:
  ```sql
  UPDATE developers SET logo_bg_color = '#FFFFFF' WHERE slug = 'andaman-riviera';
  ```
- No component changes required -- DeveloperCard.tsx already wraps logos in a container with `backgroundColor: developer.logo_bg_color || '#FFFFFF'`
