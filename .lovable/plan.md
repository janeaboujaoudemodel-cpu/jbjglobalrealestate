## Goal
On the "Ready to Get Started" / "Get the Edge" block (`src/components/CombinedContactNewsletter.tsx`): restore the metallic animated sheen on the three contact cards, refine the newsletter header, ensure the typewriter placeholder is visible in the email input, and ensure every subscriber automatically receives news (new listings / features / announcements) via automated emails.

## 1. WhatsApp / Call Us / Email — metallic animated cards
- Replace the static `jj-emerald-rect-pill` styling on the three contact anchors with the locked emerald metallic primitive (`jj-pill-emerald-metallic`, same animated sheen used elsewhere in the brand system — emerald ombré + sweeping white shine on hover, white icons + white text at rest+hover).
- Keep two-line layout (label small caps + value bold), white icon + white text locked (`data-no-contrast-guard`, inline `color:#FFFFFF`).
- No layout / grid changes; same 3-column responsive grid.

## 2. "Get the Edge" newsletter section
- Keep the main title `GET THE EDGE — LISTINGS BEFORE THE MARKET` (clear, premium).
- Add a small uppercase eyebrow chip above the title: **"Stay in the Loop"** — matched style to the existing `GET IN TOUCH` chip at the top (1px white/15 border, white text, tracking-[0.22em]).
- Keep the subtitle line unchanged.

## 3. Email input — typewriter effect
- `NewsletterBrevo` (compact variant) already uses `useTypewriter` with rotating phrases (`Enter your email address`, `Get new listings first`, …) — same engine the hero search uses.
- Visually verify it animates inside the emerald pill on `/` and matches the hero look. If suppressed by an overflow/z-index regression, fix only the offending CSS so the animated phrases are visible at rest and pause on focus/typing. No new phrases needed unless the user wants them changed later.

## 4. Automated subscriber broadcasts (backend wiring)
Subscribers already land in `public.newsletter_subscribers` via the existing `newsletter-subscribe` edge function (Brevo + Resend). Today there is **no automatic fan-out** when a new listing / feature / news item is published. Add it.

### New edge function: `broadcast-subscribers`
- Inputs: `{ type: 'new_listing' | 'new_feature' | 'news' | 'announcement', subject, preheader, html, cta_url, cta_label, audience_filter? }`.
- Loads all `newsletter_subscribers` where `is_active = true`, batches (Resend 100/req), injects per-recipient unsubscribe token, throttles per the existing Resend quota standard.
- Logs every send into `newsletter_events` (already exists) for analytics + dedupe.
- Uses the locked premium newsletter template (per `mem://features/marketing/premium-newsletter-standard`) — champagne/emerald brand, JBJ monogram, footer with unsubscribe + company NAP.

### Auto-triggers (server-side, no UI required)
Hook the broadcast into existing publishing flows so it fires automatically:
- **New listing published**: when a project transitions to `is_published = true` AND passes the publish gate (photo + developer logo), enqueue a `new_listing` broadcast (subject, hero image, price pill, location, CTA → `/project/:slug`).
- **New news article / market intel post**: when a row in the news / market-intelligence tables is set live, enqueue a `news` broadcast.
- **New feature announcement**: manual trigger from owner dashboard (single button "Announce to subscribers") that calls the same edge function.

Implementation: Postgres trigger → `pg_net` POST to the edge function with the relevant payload + `x-broadcast-secret` (stored in Supabase secrets, validated inside the function). Soft rate-limit: max 1 broadcast per topic per 30 min to prevent runaway sends.

### Safety
- Owner-only invocation outside of the trigger path (requireOwnerAuth).
- All HTML sanitized via `contentSanitizer`.
- Honors `is_active=false` and `unsubscribed_at` — never mails opted-out users.
- Respects the existing Resend quota standard.

## Files touched
- `src/components/CombinedContactNewsletter.tsx` — metallic contact cards, eyebrow chip.
- `src/components/marketing/NewsletterBrevo.tsx` (only if typewriter visibility regression confirmed).
- `src/index.css` — minor style for eyebrow chip if a primitive doesn't already exist.
- `supabase/functions/broadcast-subscribers/index.ts` (new).
- `supabase/migrations/<ts>_subscriber_broadcast_triggers.sql` — DB triggers + secret + helper RPC.
- Owner dashboard: small "Announce to subscribers" button (existing marketing hub surface).

## Validation
- Playwright screenshots of the CTA block: rest + hover on each metallic card; eyebrow visible; typewriter animating in the input.
- Manual trigger of `broadcast-subscribers` against the test address `infoo.jane@gmail.com` with three variants (new_listing / news / announcement) for visual comparison.
- DB check: a test project flipped to published produces a `newsletter_events` row and a queued send.
