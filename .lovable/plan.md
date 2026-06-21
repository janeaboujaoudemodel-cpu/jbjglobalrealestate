Plan to fix this properly without touching the homepage:

1. Restore the project photo in the hero
- Remove the broken global CSS behavior that paints every `[data-surface="dark"]` area emerald.
- Keep emerald only on actual CTA/button/icon boxes, not on full hero/photo layers.
- Use the correct fallback chain for hero imagery: gallery image, cover image, then safe placeholder.

2. Lock emerald CTA styling globally
- Create one final emerald CTA primitive for emerald-filled buttons/boxes.
- Every emerald box will have white text, white icons, and white SVG strokes in normal, hover, focus, active, and disabled states.
- Emerald CTA borders will be white/soft-white, not gold.
- Apply this to: Download Brochure, Register Interest, Download branded presentation, sticky Register Interest, brochure cards, form buttons, document/company-profile controls, and other non-home buttons using this emerald style.

3. Fix brochure download behavior
- Audit the project-detail brochure flow so clicking Download Brochure either opens the required lead-capture modal or downloads after capture, without being blocked by another modal.
- Ensure real brochure URLs pass through the existing download proxy and blob-download fallback.
- Add visible loading/error feedback instead of silent failure.

4. Fix branded presentation download
- Repair the one-click branded presentation button so it actually generates/downloads.
- Add loading state and error toast.
- Use the project photo fallback correctly inside the generated deck.
- Restyle the button to emerald with white text/icon and white border.

5. Fix the broken project-detail layout below the hero
- Replace the oversized `max-w-[1600px]` content shell on project detail with a consistent smaller shell.
- Normalize left/right padding, vertical section spacing, and card widths.
- Make project detail cards slightly smaller and consistent across desktop/tablet/mobile.
- Keep the main champagne layer full edge-to-edge, with cards sitting inside a consistent centered content width.

6. Sweep non-home card/button consistency
- Apply the same card width/padding/section rhythm to shared non-home listing/detail sections where the same broken pattern appears.
- Do not modify the homepage card layout because you said it is already fixed.

7. Validate with screenshots
- Test and screenshot: project hero photo visible, hero CTA borders white, Register Interest emerald, Download Brochure flow, branded presentation flow, below-hero cards/padding, and one non-home listing/detail page for consistency.