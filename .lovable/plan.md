1. Update the final global emerald CSS lock so any emerald-fill surface forces white text, white icons, and white SVG strokes across idle, hover, focus, active, disabled, and descendant states.

2. Remove/override winning black-text rules on emerald active tabs, specifically the Owner dashboard active `Overview` tab and any `jj-pill-active`/`tab-trigger-champagne` emerald state that still paints text or icons black.

3. Fix the Owner Pending Tasks popup:
   - Change the black primary `View Tasks` button to the approved emerald ombré fill.
   - Keep its text and arrow icon white.
   - Change the warning icon tile from black/gold to emerald with white icon.
   - Change the inline pending count number to emerald while keeping surrounding sentence readable ink.
   - Keep `Later` as the secondary champagne button.

4. Visually validate only in the live preview:
   - Open `/owner` with the restored session.
   - Capture screenshot proof of the Pending Tasks modal showing emerald button/tile and emerald count.
   - Dismiss modal if needed and capture screenshot proof of the active Owner `Overview` tab showing emerald fill with white label/icon.
   - Inspect computed colors for the highlighted elements to confirm no black text/icon is winning on emerald.