# Sidebar interaction and performance repair

## What will change
- Make the collapsed desktop rail expand on hover and collapse on pointer exit without tooltips. Clicking Expand pins it open; clicking Collapse returns it to automatic hover mode. Persist the user's choice.
- Add a compact Sun/Moon control under the account area in the expanded sidebar and retain the account-menu control with a more premium, skin-aware treatment.
- Correct Sun rail ink to black for sign-in/out, Collapse, Investor Portal icon/arrow, and remove the collapsed expand-pulse/arch artifact.
- Preserve the approved dark tone behind the monogram while slightly lifting the Moon gradient farther down the rail and toward the account side of the horizontal header. Apply the same medium-emerald-to-black surface to the requested homepage emerald bands/cards.
- Tighten sidebar rhythm and remove hard logo-band borders/highlights so the monogram and wordmark merge into the rail surface.

## Performance fixes
- Remove the two-second forced blank-section delay in the shared deferred-section component and mount visible/near-visible homepage content immediately.
- Stop eager downloading every slideshow/tool image; prioritize only the visible card image and warm the next image after first paint.
- Make developer pickers fast by avoiding hundreds of mounted logo components at open, limiting initial rows, and filtering progressively while retaining search and all results.
- Keep card media frames painted immediately and prioritize above-the-fold card photos/logos so the card appears as one stable unit.
- Keep route chunks/query data warm on likely navigation interactions without restoring heavy sitewide prefetches.

## Consent and marquee
- Replace “Okay” with functional Accept and Reject choices, persist either choice, and write both decisions to the existing consent audit trail. Essential cookies remain enabled; analytics/marketing follow the choice.
- Center the developer-marquee heading, remove its small underline/divider, reduce the gap below the heading, and normalize logo plate dimensions and spacing in both skins.

## Validation
- Run focused tests and inspect runtime console/network behavior.
- Capture required screenshot proof with the project QA screenshot script for Sun and Moon, collapsed/hover-expanded/pinned sidebar states, cookie choices, marquee, homepage cards, and an opened developer picker.
- Compare before/after loading timings for the homepage, picker opening, and property-card media.

## Technical notes
- Changes stay in the shared navigation, consent, picker/media, homepage section, and semantic theme CSS layers only.
- No database schema changes are planned; consent uses the existing audit table and agreement pipeline.
