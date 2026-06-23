I will fix this as a global design-system integrity repair, not page-by-page patching.

1. Correct the global contrast rules
- Replace the current broken “light surface wins” override that is forcing black text into dark/emerald areas.
- Add a final global lock so every own-background emerald/dark CTA, hero band, dark photo overlay, dark book cover, and emerald pill renders white text/icons at rest, hover, focus, active, and disabled states.
- Keep champagne/light cards using black text only when the element’s own surface is truly light.

2. Remove black surfaces from hero/CTA areas
- Convert dark/black branded CTA and dark hero surfaces to the official emerald surface instead of black.
- Specifically fix the “Welcome back to your Command Center” band so the background and highlighted words are emerald/white, not black/gold.
- Fix “Complete Broker Success System” and other photo hero overlays so headings, subtitles, and CTA labels are readable and white where they sit on dark/emerald/image overlays.

3. Normalize all CTA pill shapes and text color
- Make primary CTAs use one shape contract matching “Open My Dashboard”: same rectangular rounded pill, official emerald fill, white text/icons.
- Fix secondary filled/outlined CTAs like “See What’s Included” so they do not use a mismatched oval shape or black text on emerald.
- Enforce hover states globally so emerald CTAs never flip to black text.

4. Fix vertical sidebar rules exactly as requested
- Main category titles such as Tools & Workspace, My Account, Properties, Insights & Guides, Services, Broker & Academy, Company & Legal stay black text.
- Sidebar icons remain untouched.
- Remove the emerald highlight fills, green borders, shadows, and framed treatment from the four top shortcut rows: AI Home Finder, List Your Property, Careers, Resale/Research Properties.
- Keep those rows visually plain like normal sidebar entries, with black titles and untouched icon tiles.
- Active sidebar section may still use emerald with white text/icons only when actually active.

5. Fix broker library/book readability
- Repair book cover text so dark/colored book covers use readable white/cream text, not black.
- Ensure book titles such as Broker Training Manual, Broker Certification Guide, Broker FAQ, Market Intelligence Report, and Golden Visa UAE Guide are visible.
- Keep gold only as foil/accent, not as unreadable title text on dark covers.

6. Fix auth and welcome guide emerald consistency
- Update the login/welcome-back screen to use the emerald/champagne system for fields and buttons.
- Make the Welcome Guide label emerald, with white text/icons when it is an emerald pill.
- Ensure “Start the quick tour” uses official emerald with white text/icons.

7. Visual validation only before reporting done
- Run Playwright screenshots at 1280×1800 after implementation.
- Capture proof for: homepage hero/search, /ai-hub command center section, /broker-toolkit hero and library, sidebar expanded state, auth page, and welcome guide modal.
- Check both normal and hover states for representative emerald CTAs.
- I will not claim completion unless the screenshots visibly show white-on-emerald/dark contrast restored and the sidebar highlights removed.