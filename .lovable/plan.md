I verified the current preview and code. The homepage hero search is still a mixed white + emerald + gold-bordered pill, the hero overlay is too dark, newsletter/CTA contrast is being overridden by global guards, and the sidebar/contact surfaces still contain gold/light-green styles. I will fix this in strict batches and validate each batch before moving on.

Plan:

1. Hero video visibility + unified hero search bar
   - Reduce the two dark overlay layers in `src/pages/Index.tsx` so the video is visibly brighter while keeping white headline contrast.
   - Replace the mixed hero search treatment in `src/components/home/HomeHeroSearch.tsx` with one continuous emerald/black ombre search section:
     - no green outline border around the whole pill
     - no gold divider
     - emerald glow border only
     - input area visually belongs to the same search section
     - search button keeps white text/icon
     - Free Consultation segment uses emerald glow border, not gold
   - Add animated type/delete helper text examples:
     - “Find me a property in Downtown”
     - “I want to sell my property”
     - “I want to compare my property”
     - “How much is my property valued for?”
     - “How much is rent in Marina?”
     - “I’m looking for Golden Visa or mortgage”
   - Keep the input fully typable: animation only appears when the user has not typed.
   - Validate with desktop screenshot of the hero.

2. Responsive Contact Us launcher
   - Update `src/components/support/SupportLauncher.tsx`:
     - desktop/tablet landscape may keep compact vertical treatment
     - phone and portrait iPad/tablet should show only a call/support icon, not the large vertical “Contact us” label
     - replace gold border/glow with emerald ombre/glow
   - Validate at desktop, iPad portrait, and phone viewport screenshots.

3. Stay in the Loop and newsletter white-on-emerald lock
   - Fix `src/components/CombinedContactNewsletter.tsx` and `src/components/marketing/NewsletterBrevo.tsx` so:
     - “Stay in the Loop” text is white when on emerald
     - “Enter Your Email”/animated placeholder is white
     - submit button is emerald ombre with white icon/text
     - glow/border matches the same emerald ombre system, not light-green or gold
   - Add a scoped global lock in `src/index.css` so newsletter emerald fields/buttons cannot be forced back to ink/black by contrast guards.
   - Validate with screenshot at the Ready/Get in Touch section.

4. Global emerald CTA/text contrast rule for “Explore” buttons
   - Find the winning CSS rule currently forcing black text on emerald buttons.
   - Add a scoped hard lock for approved emerald CTA primitives (`.jj-emerald-fill`, `.jj-pill-emerald`, and relevant emerald data attributes) so all text/icons remain white on emerald at idle, hover, focus, active, disabled.
   - Apply to visible “Explore” / top area CTA cases without converting champagne-only buttons unnecessarily.
   - Validate by scrolling to the affected area and screenshotting the buttons.

5. Vertical sidebar emerald rules
   - Update `src/components/navigation/GlobalVerticalNav.tsx` and final CSS locks in `src/index.css`:
     - section headers like “MY ACCOUNT” use emerald/black ombre fill with white icons/text
     - section icon boxes use emerald border/glow, no gold
     - subcategory rows like “My Dashboard”, “Billing & Subscriptions”, “Brand Update” stay on white/champagne surfaces
     - subcategory icons use emerald ombre/accent with white icon-tile borders as requested
     - remove remaining gold borders from sidebar contact/support/collapse controls except where project memory strictly requires collapse gold; if conflict appears, I will scope the emerald rule to the requested sidebar menu/category surfaces first.
   - Validate expanded sidebar screenshot showing MY ACCOUNT + Billing & Subscriptions.

6. Contact cards / Ready to Get Started / Get in Touch icons
   - Update `src/components/CombinedContactNewsletter.tsx`, `src/components/ProjectCard.tsx`, and shared emerald CTA CSS so WhatsApp, Call Us, Email, Ready to Get Started, and Get in Touch use the full approved emerald/black ombre with white icons/text.
   - Remove light-green fills and gold borders from those emerald contact controls.
   - Validate with screenshots of project cards and the Ready/Get in Touch section.

7. Final verification pass
   - Manually navigate as a user through:
     - homepage hero
     - sidebar expanded and collapsed
     - contact launcher on desktop/iPad/phone
     - Ready/Get in Touch section
     - Top Areas/Explore buttons
   - Capture proof screenshots for each completed area.
   - Check console for runtime errors after the visual changes.

Implementation will be limited to frontend presentation files and global CSS locks needed to stop the current winning contrast rules from undoing the emerald/white styling.