I’ll fix this in separate passes and validate each pass before moving to the next.

1. Hero search + horizontal header emerald segmentation
- Rework the hero search bar so the input segment, Search button, and Free Consultation button use the same emerald/black premium system with clean internal separation.
- Apply the same visual language to the horizontal header controls: emerald accents instead of gold, no random mixed greens, no messy split colors.
- Remove the unwanted light-green underline/active mark under “Buy Property” and keep only deliberate active styling.
- Validation: desktop screenshot of the top hero/header showing aligned emerald styling and no light-green underline.

2. Explore Our Services + JBJ Tools + Get Verified button style
- Make Explore Our Services use the same segmented emerald-metallic style as the hero/search/header.
- Upgrade “Explore JBJ Tools” to a metallic emerald CTA so it stands out without gold fill or black text.
- Keep “Get Verified” consistent with this metallic emerald CTA family.
- Validation: screenshot of Explore Our Services, JBJ Tools, and Get Verified areas showing consistent premium CTA treatment.

3. Email / Call / Chat / Explore contrast lock
- Fix the root contrast issue by updating the actual card CTA markup/CSS so Email, Call, Chat, and area “Explore” buttons render white text and white icons on emerald at rest, hover, focus, and active.
- Add `data-no-contrast-guard` / `allow-white` where needed so global guards can no longer flip them to black.
- Validation: manually inspect computed styles and take screenshots of both Handpicked For You cards and Top Areas cards at rest and hover.

4. Sidebar collapse/expand button green lock
- Replace the remaining gold collapse/expand styles with emerald: label, icon, border, hover glow, collapsed rail divider, and pulse.
- Keep the sidebar champagne shell, but all interactive accents become emerald instead of gold.
- Validation: screenshot expanded and collapsed sidebar showing no gold collapse button.

5. Ready to Get Started background layer removal
- Remove the extra lighter layer behind the Ready to Get Started card and the beginning of the Emirates/area card area.
- Keep the actual CTA card intact, only remove the unwanted background band/layer.
- Validation: screenshot around Top Areas → Ready to Get Started showing no stray light layer behind the card.

6. Stay in the Loop typewriter restore
- Restore the animated placeholder in the Stay in the Loop email field.
- Preserve the click/focus behavior: typing stops when the user focuses or enters text; it resumes only when the field is empty and not focused.
- Validation: interact with the email input manually, confirm placeholder animates when empty, stops on focus/typing, and resumes after blur when empty.

7. Final regression pass
- Review desktop homepage sections in order: header/sidebar, hero search, Explore Services, verification/portal, Handpicked cards, Tools, Top Areas, Ready CTA, newsletter.
- Capture final screenshots proving each corrected area before reporting completion.