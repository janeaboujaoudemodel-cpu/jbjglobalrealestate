## Goal
Fix only the regressions visible in the new screenshots. Do not touch already-approved areas (careers/job cards, Services footer, /join navy contact tiles). No new global selectors — remove or scope the **winning** conflicts, then patch the few hand-rolled tiles.

## Confirmed root causes (from code + live DOM inspection)

1. **Icon tiles on /about, /contact, /founder render as solid black squares** even though the inner svg computes to `color/stroke = rgb(255,255,255)`. The pattern in `About.tsx` (and clones in `Contact.tsx`, `Founder.tsx`) is hand-rolled:
   ```
   <div className="w-14 h-14 rounded-lg bg-[#1A1A1A] ...">
     <Icon className="w-7 h-7 text-white" />
   </div>
   ```
   The Lucide stroke is white but at 14×14 tile + 24px default render the icon collapses to a near-invisible hairline on the marketing background blend. We will replace every hand-rolled `bg-[#1A1A1A]` icon tile on these three pages with the locked `<IconTile tone="ink" size="lg" icon={Icon} />` primitive (which already carries `data-surface="ink"`, `text-white` + safe stroke, and is guard-exempt).

2. **/owner/founder-assistant — "Escalations" pill** uses the same hand-rolled white-on-light pattern instead of `.jj-pill-active`. Fix by replacing with the locked pill primitive (champagne fill + ink text + gold hairline).

3. **/contact phone helper "Select your country code, then enter your phone number"** is rendered with `text-white/70` on what is now (after the `[data-marketing-page] section.bg-[#1A1A1A]` champagne remap) a champagne band → invisible. Replace with `text-[#1A1A1A]/70`.

4. **/contact "Create Support Ticket" button** uses raw `bg-[#1A1A1A] text-white` inside a champagne card. The black-CTA→navy guard should repaint it, but the button is wrapped inside `Surface` with `data-no-contrast-guard`. Remove the opt-out from that one button so it gets the standard navy CTA treatment, or switch it to `.jj-cta-dark`.

5. **/ai-hub "All tools in one place…" subcopy + search input** use `text-white/70` and `placeholder:text-white/50` inside a champagne band. Repaint to ink (`text-[#1A1A1A]/70`, `placeholder:text-[#1A1A1A]/45`).

## The winning rule we are NOT touching
`[data-marketing-page] section[class~="bg-[#1A1A1A]"] { background: #F7F2EA !important }` (index.css:1021) is correct and must stay — the bug is that pages still hard-code `text-white` children inside those remapped sections. We fix the children, not the remap.

## Files to edit (surgical, no new CSS rules)

- `src/pages/About.tsx` — replace the `FeatureCard` inline icon tile div with `<IconTile tone="ink" size="lg" icon={Icon} />`. Also replace the 4 hand-rolled overlay tiles in "Market Intelligence" section (lines ~408-420) so they keep navy bg + white icon via the IconTile primitive.
- `src/pages/Contact.tsx` — (a) swap the hero icon tile, "Important Notice" tile, "Appointments" tile, "Need Help?" tile for `<IconTile tone="ink"/>` or `tone="red"` where semantic; (b) repaint the phone-helper microcopy to ink; (c) convert "Create Support Ticket" button to `.jj-cta-dark` (removes the white-on-champagne case).
- `src/pages/Founder.tsx` — replace the 4 leadership card avatar tiles + the 4 governance bullet icon tiles with `<IconTile tone="ink" size="lg" />`.
- `src/pages/OwnerFounderAssistant.tsx` (or the chat header component that renders the Escalations chip) — replace the hand-rolled chip with `<span className="jj-pill-active">…</span>` so it inherits the locked champagne + ink + gold-hairline tokens.
- `src/pages/AiHub.tsx` — (a) repaint the "All tools in one place…" `<p>` and the search input's text + placeholder to ink utilities; (b) leave the dark hero alone.

No new CSS, no new selectors, no new guard layers. We are only removing hand-rolled white-on-light spots and routing through the existing locked primitives.

## Verification (mandatory before claiming done)

For each of the 5 routes — `/about`, `/contact`, `/founder`, `/owner/founder-assistant`, `/ai-hub` — I will:
1. `navigate_to_sandbox` to that route.
2. Take a viewport screenshot at the previously-broken section (scroll into view first).
3. Run `extract` to assert: for every icon-tile container, `bg ∈ {#1A1A1A, #EFE6D6}` and inner svg `color === expected foreground`; for every text node previously broken, `color !== rgba(255,…)` on champagne and `color !== rgba(0..40,…)` on navy.
4. Only after the assertion passes will I mark the change done.

I will NOT touch: careers / job cards, Services footer, /join navy tiles, or any of the global rules approved in earlier turns.