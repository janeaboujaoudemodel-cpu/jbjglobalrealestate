## Goal

Turn the AI Concierge from a vague chat into a guided action engine: it answers with **clickable step-by-step shortcut cards** (e.g. "Marina apartments under 2M" → numbered steps with a "Open this filter now" button that deep-links to `/properties?...`). Add an always-visible launcher (mobile star / desktop edge tag), a lead-capture + 6-digit email OTP gate, a 24/7 free-support badge, and a clickable "Switch channel" popover.

## 1. Smart action-card shortcuts (the Sergino problem)

**Edge function `ai-concierge` upgrade**
- Extend `SYSTEM_PROMPT` with a strict **structured-output contract**: in addition to prose, the model must append a JSON block:
  ````
  ```jbj-actions
  { "steps": ["Open Properties", "Set Beds = 2", "Drag price slider to 2M"], "cta": { "label": "Open this filter", "href": "/properties?area=marina&priceMax=2000000&beds=2" } }
  ```
  ````
- Provide an authoritative **Filter URL Cheat Sheet** in the prompt (uses the existing global filter system: `area`, `priceMin`, `priceMax`, `beds`, `developer`, `handoverFrom`, `propertyType`, `status`).
- Tell the model: when the user asks "how do I find / where can I see / filter for / show me X", ALWAYS emit a `jbj-actions` block with the deep link instead of telling them where to click.

**Frontend `AIConcierge.tsx`**
- New parser extracts the ```jbj-actions``` fence from each streamed assistant message, strips it from the prose, and renders a **`ConciergeActionCard`** under the message:
  - Numbered step list (gold checkmark bullets)
  - Primary CTA button that uses React Router `Link` (gold border, ink text — matches our CTA system) and closes the drawer on click.
- Add 4 new gold-bordered "smart prompt" suggestion chips that reliably trigger action cards (Marina <2M, Beachfront with handover 2026, Studios for short-let, 4BR villas in Emirates Hills).

## 2. Always-visible launcher — Star (mobile) + Edge Tag (desktop)

New component `src/components/support/SupportLauncher.tsx`, mounted once in `MainLayout`:
- **Mobile (`md:hidden`)**: bottom-right 56×56 gold-ringed star button (Sparkles icon). Tap → fans out a quarter-arc of 4 orbs (Concierge, Chat Support, WhatsApp, Call) with tooltips. Tap-away or second tap collapses.
- **Desktop (`hidden md:flex`)**: thin vertical tag pinned to right edge (`fixed right-0 top-1/2 -translate-y-1/2`), gold hairline border, vertical text "Talk to us". Hover/click slides out a 280px panel with the 4 channel cards (same content as concierge welcome).
- Both surfaces dispatch the same events used today (`jbj:open-chat-support`, opens `AIConcierge`, opens external `tel:` / `wa.me`).
- Hidden automatically when `AIConcierge`, `AIChatWidget`, or any modal is open (listen for those flags via a small Zustand store or a `body[data-modal-open]` attr).

## 3. Concierge gate: lead capture + email OTP

The concierge welcome panel becomes a **2-step pre-chat gate** whenever the user is not already verified for support:

**Step A — Details form** (re-uses the existing `AIChatWidget` form styling):
- Full name, family name
- Phone with country-code picker (default +971)
- Working email
- Inline zod validation; 24/7 free-support badge + disclaimer ("We'll text/email you only about your enquiry — JBJ Privacy Policy applies.")
- On submit: insert/update a row in `crm_leads` via the existing `register-mode-lead` edge function (extended to accept `source: 'concierge' | 'chat-support'` and the extra fields), with `account_status='email_pending'`.

**Step B — 6-digit OTP**:
- Call a new edge function `send-concierge-otp` → generates a 6-digit code, stores it hashed in a new table `concierge_otp_codes (email, code_hash, expires_at, attempts)`, and sends it through the existing transactional email pipeline (`send-transactional-email` with a new template `concierge-verification.tsx`).
- UI shows 6 OTP input boxes, 5-min countdown, Resend button (60s cooldown).
- New edge function `verify-concierge-otp` validates the code, marks the lead `account_status='verified'`, and returns a short-lived signed token stored in `localStorage` (`jbj.concierge_verified`).
- Once verified, the gate disappears for that browser; the same token unlocks `AIChatWidget` (mirror the gate there to keep both channels consistent).

If the user is already logged into Lovable Cloud with a verified email, skip the gate entirely.

**No new email domain work is needed** — the project already runs transactional emails through the existing infrastructure; we only add one new template and two thin edge functions.

## 4. Clickable "Switch channel" footer

Replace the static chip row with a single gold-outlined `Switch channel ▾` button. Click opens a Radix `Popover` above the footer with 3 channel cards:
- **Chat Support** (closes concierge, dispatches `jbj:open-chat-support`)
- **WhatsApp** (`tel:` deep link)
- **Call an Agent** (phone + 24/7 badge)

Each card has the channel icon, one-line description, and response-time pill ("Replies in ~2 min", "24/7", "Avg 30s").

## 5. 24/7 Free Support badge

Add a permanent pill in the concierge header and on every channel card:
`● 24/7 Support · Free` — emerald dot, ink text on champagne pill, gold hairline border. Wording is hard-coded; not a runtime feature flag.

## Files

**New**
- `src/components/support/SupportLauncher.tsx` (star + edge tag)
- `src/components/support/SupportLauncherStar.tsx`, `SupportLauncherEdgeTag.tsx` (split)
- `src/components/support/ChannelCard.tsx` (shared card primitive)
- `src/components/concierge/ConciergeActionCard.tsx` (step list + CTA)
- `src/components/concierge/ConciergeGate.tsx` (details + OTP)
- `src/hooks/useConciergeVerification.ts` (localStorage token check)
- `supabase/functions/send-concierge-otp/index.ts`
- `supabase/functions/verify-concierge-otp/index.ts`
- `supabase/functions/_shared/transactional-email-templates/concierge-verification.tsx`
- DB migration: `concierge_otp_codes` table + RLS + cleanup trigger; extend `crm_leads` to allow `source = 'concierge'`.

**Edited**
- `supabase/functions/ai-concierge/index.ts` — new prompt + filter cheat sheet
- `src/components/home/AIConcierge.tsx` — gate, action-card renderer, Switch-channel popover, 24/7 badge
- `src/components/MainLayout.tsx` — mount `SupportLauncher`
- `src/components/AIChatWidget.tsx` — read the same verified-token; skip its own form if already verified
- `supabase/functions/register-mode-lead/index.ts` — accept concierge/chat source + name/phone/email payload
- `supabase/functions/_shared/transactional-email-templates/registry.ts` — register new template

## Unchanged / out of scope

- No changes to hero search, listings, header, footer, mode picker, or any other page.
- WhatsApp/phone numbers continue to come from `CONTACT_INFO`.
- The existing `AIChatWidget` lead form stays as a fallback — only its gate logic shares the verified token.
