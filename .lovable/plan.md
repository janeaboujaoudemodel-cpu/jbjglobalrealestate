## Plan

1. **Clean the Market Intelligence hero**
   - Remove the logo row, “Daily Market Desk”, animated keyword strip, source badge row (`DLD`, `RERA`, `DXB Interact`, `Dubai Statistics`, `JBJ Intelligence`), and founder promo card from the hero.
   - Remove the faded/chalky overlay look by changing the hero to a clean champagne surface with a stronger readable image treatment, no washed translucent text effects.
   - Keep only: `Market Intelligence`, the description, and the two CTAs (`Explore Market Dashboard`, `View Daily Reports`) with proper spacing so the dashboard starts cleanly below.

2. **Fix global white-on-champagne contrast bugs**
   - Tighten the global CSS contrast guard so white text/icons cannot survive on champagne/cream/gold/light surfaces, including nested spans, SVG strokes/fills, hover/focus states, and faded white utilities.
   - Remove/avoid broad opt-outs that allow white to leak into light-surface sections unless the parent surface is truly dark.

3. **Make numbered markers gold globally for Market Intelligence content**
   - Add a reusable Market Intelligence number-marker rule/component style: gold border/fill treatment with ink/gold text, never white/blank circles.
   - Apply it to affected Market Intelligence sections such as Area Intelligence evaluation cards and TOC/section number pills.

4. **Improve Explore Market dashboard spacing and contrast**
   - Reduce excessive top/bottom gaps after the hero and between Market Intelligence sections.
   - Improve dashboard cards with champagne raised surfaces, gold hairlines, ink labels, and semantic data colors only where appropriate.
   - Remove the remaining duplicate “Price by Property Type” static card if it duplicates the live DLD snapshot/content.

5. **Validate visually**
   - Check `/market-intelligence`, `/market-intelligence/overview`, `/market-intelligence/area-intelligence`, and `/market-intelligence/reports` at desktop and tablet widths.
   - Confirm: no source badges/logo/keyword strip in hero, no faded hero wash, no white-on-champagne text/icons, gold visible numbers, cleaner dashboard spacing, and no cropped/blank markers.