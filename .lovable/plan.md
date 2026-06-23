I will fix the rejected green/black-content violations by making the real-estate UI use only the approved emerald system: dark metallic emerald (#064E3B / gradient-to-black where the existing official primitive requires it) with pure white text/icons inside.

Plan:

1. Lock the official emerald CTA primitive globally
- Update the global CTA contract so `.jj-cta-primary`, `.jj-pill-emerald-metallic`, `.jj-official-emerald`, `data-cta="primary"`, and selected active tabs/chips all render:
  - approved emerald/dark-metallic emerald fill
  - no rejected `#0E8A66` flat fill as the main CTA color
  - pure white text and pure white SVG/icon strokes/fills
- Convert the old `.jj-cta-gold-metallic` primitive usage for action CTAs/forms to the emerald metallic contract, because it is currently still gold/ink and conflicts with this request.
- Strengthen the final cascade guard so hardcoded `bg-[#0E8A66]` and inline emerald-style elements are repainted to approved emerald and descendants become pure white unless explicitly excluded for non-action surfaces.

2. Fix specific project page violations shown in the screenshots
- `Payment Plan (60 / 40)` active segmented button: emerald fill + pure white label/icon.
- `All nearby` and nearby-map active chips: approved emerald fill + pure white count/text; inactive chips stay champagne/ink.
- `Download Brochure`, `Open in Maps`, `View All Projects`, `Report an issue`, `Request a Call Back`, `Request Mortgage Introduction`, `Request Consultation`, and related real-estate CTAs: approved emerald + pure white text/icons.
- `Noticed something incorrect?` warning icon tile: convert the icon tile to emerald fill with pure white icon.
- Recommended Projects header star and `View All` button: emerald fill + pure white content where the element is acting as an accent/action.
- Developer-info action/link area: ensure developer-action buttons use the same emerald metallic treatment with pure white content.

3. Fix forms and picker controls
- Convert active multi-select chips in consultation/register-interest forms from champagne/gold/ink to emerald fill + pure white content.
- Ensure phone/country picker trigger and submit buttons keep pure white text/icons on emerald/dark fill.
- Preserve form fields themselves as champagne/ink; only active choices, icons, and action buttons become emerald.

4. Fix global icon color issues without breaking content readability
- Apply a scoped project/property/forms icon rule so decorative/action icons in cards and sections are emerald by default.
- Any icon inside an emerald-filled tile/button remains pure white.
- Mortgage calculator header/icon tiles and summary card icons will use emerald instead of black/gold, while text remains readable on champagne backgrounds.

5. Fix developer-logo/card consistency
- Keep project card developer logo plates as the existing plain square format matching the Emaar-style square plate.
- Remove rectangular text fallback usage in Recommended Projects and replace with the unified square `DeveloperLogo` fallback/nameplate behavior.
- Keep `DeveloperLink` as the canonical developer-name renderer; adjust only where the user explicitly requested filled emerald action styling, not every inline developer text link.

6. Visual validation only
- Use Playwright at 1280×1800 to inspect and screenshot:
  - `/project/elwood-sobha-realty-dubailand` payment plan section
  - location/nearby map section
  - developer section
  - brochure section
  - mortgage section including Request Mortgage Introduction
  - register-interest/consultation form area
  - recommended projects section
- Save screenshots under `/tmp/browser/emerald-fix/` and visually confirm: no rejected green action fills, no black text/icons on emerald, and no non-white content inside emerald surfaces.