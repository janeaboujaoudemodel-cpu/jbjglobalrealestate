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
15. `DONE` Grid / List toggle in the studio (per-page selector still open on other listing pages).
16. `DONE` Inline live edit: the cover thumbnail and the logo plate are both click-to-upload with an inline spinner.
17. `DONE` Uploaded / pasted logos are auto-treated via `process-developer-logos` (emerald plate + white knockout).
18. `DONE` Complete tick per row, row checkboxes, select-all-in-view, bulk publish / archive / re-treat.
19. `DONE` The treated logo renders on its emerald plate in the row before Publish is pressed.
20. `DONE` "Cover link broken" / "Link broken" state for stored URLs that no longer load.
21. `WIP` Duplicate developer rows are flagged ("Duplicate name — merge"); the merge action itself is still open.

## E. One back end only
22. `OPEN` Retire the old champagne back office: move/merge everything still living there into the JBJ Hub (starting with the CRM client panel — AI Lead Score, Log Call, Deal Prediction, AI Tools), remove duplicate surfaces, and repoint every notification deep link (e.g. "new lead received → open CRM") at the new Hub.
