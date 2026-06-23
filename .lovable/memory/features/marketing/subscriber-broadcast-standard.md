---
name: Subscriber Broadcast Standard
description: Newsletter subscribers automatically receive emails on new listing publish, new market news publish, and owner-triggered announcements via broadcast-subscribers edge function + DB triggers.
type: feature
---

# Subscriber Broadcast Standard

Anyone subscribing through the home "Get the Edge — Listings Before the Market" pill (`NewsletterBrevo` compact in `CombinedContactNewsletter.tsx`) lands in `public.newsletter_subscribers` with `is_active=true` and a unique `unsubscribe_token`.

## Auto-fanout

Edge function: `supabase/functions/broadcast-subscribers/index.ts`
- AuthZ: either trigger-secret header (`x-broadcast-secret` = `BROADCAST_TRIGGER_SECRET` env) OR owner JWT (`requireOwnerAuth`).
- Self-bootstraps the secret into `public.broadcast_settings` on every call so DB triggers stay in sync.
- Loads active subscribers, sends one email per recipient via shared `sendViaResend` (honors Resend quota), logs every send to `newsletter_events` with `event_type='broadcast'` and `metadata.topic_key`.
- Dedupe: 30-min window per `topic_key`.
- Honors `unsubscribe_token` in `List-Unsubscribe` header + footer link.

## Triggers (Postgres → pg_net)

- `broadcast_on_project_publish` — fires when `projects.is_published` transitions to true with cover image and not sold out; sends `type:'new_listing'` to all subscribers.
- `broadcast_on_news_publish` — fires when `market_news.status` becomes `'published'`; sends `type:'news'`.
- Owner-triggered `announcement` / `new_feature` calls invoke the edge function directly with owner JWT.

## Lock
Do not bypass `sendViaResend` (quota), do not store the trigger secret in client code, do not skip the `is_active` filter, do not drop the `List-Unsubscribe` header.
