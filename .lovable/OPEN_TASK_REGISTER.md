# Open task register — extracted from the carried-over prompts

Status legend: `DONE` = shipped + proven, `WIP` = in progress this turn, `OPEN` = not started, `BLOCKED` = needs an owner decision.

## A. Performance / CSS
1. `OPEN` De-prefix the ~2051 `html body …` guard rules in `src/index.css` (the descendant-from-body prefix forces whole-document match work on every popper insertion). Needs its own careful rewrite + full visual regression sweep.
2. `OPEN` Moon mode: sidebar section labels still render in dim gold-gradient ink — must be pure white.

## B. Rent / search purpose integrity
3. `OPEN` Rent has zero inventory (1,398 published, 0 leasing). Owner decision: hide Rent vs. rental-desk capture into the Advisory Desk.
4. `OPEN` Rent status chips: **Ready** (direct from developer) and **Resale ready** (first buyer reselling) — the only two statuses under Rent.
5. `OPEN` Headline must follow purpose — `/properties` still shows the "Off-plan…" hero with a "For rent" sub-label.
6. `OPEN` Sort options leak sale logic into Rent ("Handover soonest", "Distress first").
7. `OPEN` Buy / Resale / Distress overlap with `/resale` and `/distress` routes — one canonical path (status chips), routes become presets.
8. `OPEN` Price filter only reads `price_from` (max-price filtering is wrong); size filters mix `size_min`/`size_max`.
9. `OPEN` Rent frequency (Yearly/Monthly/Weekly/Daily) has no backing column — either add the column or remove the filter.

## C. Guest chat / Advisory Desk
10. `DONE` Advisory Desk ticket cards overlapped each other (Hub shell forced `display:flex` on their children) — card layout is now pinned.
11. `OPEN` Guest chat insert fails: `POST /rest/v1/chat_conversations` → 42501, anon has no grant/policy for guest chat inserts.
12. `OPEN` `ai-chat-support` returns 401 (deployed copy out of sync with `verify_jwt = false`); `handleSend`'s catch path never persists the transcript, so the visitor's message is lost.
13. `OPEN` Gated-portal visitors must still be able to open a ticket/chat: collect their details first, and pre-fill automatically when they are signed in.
14. `OPEN` Explain (in-product, not chat): what MEMBER · VERIFIED vs GUEST · UNVERIFIED means, and the mailbox "Sync now" step for contact@jbj.ae / helpdesk@jbj.ae.

## D. Developer Media Studio
15. `OPEN` Grid view + per-page selector on every listing page (front end and back end), matching the developers page.
16. `OPEN` Inline live edit: click the photo to upload, click the logo to upload, see the result immediately.
17. `OPEN` Any uploaded logo is auto-treated into the emerald plate + pure-white knockout before it is stored.
18. `OPEN` Verified/complete tick per row, bulk select, bulk status change, bulk publish.
19. `OPEN` Preview the treated logo before publishing.
20. `OPEN` "Cover link broken" state for stored URLs that no longer load (must not count as published).
21. `OPEN` De-duplicate developer rows (e.g. two "Ab Developers L.L.C").

## E. One back end only
22. `OPEN` Retire the old champagne back office: move/merge everything still living there into the JBJ Hub (starting with the CRM client panel — AI Lead Score, Log Call, Deal Prediction, AI Tools), remove duplicate surfaces, and repoint every notification deep link (e.g. "new lead received → open CRM") at the new Hub.
