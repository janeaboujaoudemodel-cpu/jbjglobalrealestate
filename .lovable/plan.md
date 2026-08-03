# Fix the FAQ contrast conflict at its source

## Confirmed root cause

The broker FAQ component correctly switches an open item to the emerald background and requests white text in `FAQPageShell.tsx`.

The actual conflict is the broad Insights/Guides contrast guard in `src/index.css` around lines 27023–27026. It matches the outer rounded FAQ section card and then forces every descendant `button` to ink-black with `!important`, including `.jj-faq-trigger` after its own item has opened on emerald. Its selector is more specific and mandatory, so the component’s `data-[state=open]:text-white` cannot win.

## Implementation

1. Scope the broad Insights card descendant ink rule so it does not target FAQ accordion items/triggers in their open emerald state.
2. Preserve the intended black text on closed champagne FAQ rows.
3. Ensure open emerald FAQ rows use white question text, white answer text, and a white chevron through the existing component state styles—not through another broad global override.
4. Apply the correction to the shared FAQ shell so all FAQ pages receive the same behavior without page-specific patches.
5. Add a focused regression check for the cascade contract: closed FAQ = ink on champagne; open FAQ = white on emerald.

## Validation

- Open the exact “Who can join as a broker with JBJ Global Real Estate?” accordion.
- Inspect computed `color`, `-webkit-text-fill-color`, background, and the winning CSS selector before and after opening.
- Capture Playwright screenshots of the closed, hovered, and open states at desktop viewport.
- Confirm representative sibling FAQ pages use the same correct state behavior and that ordinary Insights cards remain ink on champagne.
