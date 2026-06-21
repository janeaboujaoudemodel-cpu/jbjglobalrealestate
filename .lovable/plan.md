1. Mortgage compare slider
   - Change the Compare to Bank Rates range input to use the same emerald slider variables/track/thumb treatment as the existing long-term mortgage sliders.
   - Ensure the filled scroller paint and the circular thumb are both emerald, not gold/light/gray.
   - Keep its calculation logic unchanged.

2. Horizontal header sq ft/sq m active state
   - Replace the current white-line shimmer with a true emerald metallic animated shine using emerald-only highlights and depth.
   - Lighten the active emerald surface enough that the white “sq ft” label stays readable.
   - Keep inactive sq m visually different and darker.

3. Global emerald contrast lock
   - Add a final scoped global CSS lock so every emerald surface/class/attribute renders white text and white icons at rest, hover, focus, and active.
   - This includes `.jj-emerald-chip`, `.jj-pill-emerald`, `.jj-emerald-metallic`, `.jj-emerald-rect-pill`, `[data-emerald]`, and `[data-emerald="true"]`.

4. Top Areas section
   - Fix Top Areas / Trending / High Demand chips so they are emerald with white text/icons, not black text on emerald.
   - Make the small Explore buttons on each area card match the emerald CTA style used in Handpicked For You, with white label and arrow.

5. Visual validation only
   - Open the live preview and capture screenshots showing:
     - header sq ft active state,
     - mortgage Compare to Bank Rates slider track + thumb,
     - Top Areas chips and Explore buttons.
   - Verify visually at the current desktop viewport and zoom/close-up where needed before reporting back.