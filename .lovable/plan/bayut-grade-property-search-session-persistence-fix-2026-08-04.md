# Bayut-grade Property Search + Session Persistence Fix

## 1. Stop the unexpected logouts

Two mechanisms can currently drop a signed-in user:

- The broker heartbeat (`crm-broker-session-track`) force-signs-out on repeated 403s. A device-fingerprint change (new window size, browser update, private mode) can produce a permanent 403 loop, which ends in `signOut()` + hard redirect to `/auth`.
- Session recovery: when a token refresh fails once (offline, sleeping phone, tab restore), the app can settle on a null session instead of retrying until the refresh token is genuinely rejected.

Fix:
- Never force sign-out on fingerprint mismatch alone. Only sign out when the backend explicitly returns `revoked`/`blocked` for that broker, and require two consecutive explicit revocations.
- Make session recovery resilient: retry `getSession`/`refreshSession` with backoff while a refresh token exists in storage, and only clear auth on a definitive `invalid_refresh_token`.
- Re-validate the session on tab focus and on `online` so returning to a sleeping tab restores rather than logs out.
- Remove the unused 15-minute idle timer path so it cannot regress into a logout later.

## 2. New search model (replaces the buy/rent/off-plan mix-up)

Intent and status become independent axes:

- Purpose (single): Buy, Rent, Sell (Sell switches to a lead form, not a listing grid).
- Project status (multi): Off-plan, Ready, Resale, Distress deal, Nearing completion.
- Completion window: from now to a target year (2026 - 2032+), plus "Ready now".
- Payment: Any, Payment plan, Cash only, Post-handover plan.
- Category: Residential / Commercial tabs with the Bayut-style two-column type grid (Apartment, Villa, Townhouse, Penthouse, Villa Compound, Hotel Apartment, Land, Floor, Building / Office, Shop, Warehouse, Showroom, Labour camp, Bulk unit) with Reset + Done buttons.
- Beds & Baths: multi-select (Studio, 1-7+).
- Price: min/max with currency per country, plus rent period (Yearly / Monthly / Weekly / Daily) when Purpose = Rent.
- Size: min/max sqft.
- Areas with include AND exclude: one searchable dropdown, two tabs - Include and Exclude. Tick areas into either list; chips show `+ Area` in emerald and `- Area` in muted red. Exclusions win over inclusions ("all of Dubai except International City and Deira").
- Furnishing, developer, keyword search stay, all multi-select where applicable.
- Live result count: every filter change fires a debounced count query, shown on the Search button ("Show 1,284 properties") and next to Apply in More Filters.

Bar layout: full-width, aligned to the hero headline width (same max-width container), one row on desktop, two columns on mobile, with a secondary row for chips (Furnished / Unfurnished, status labels, Clear filters, Save search, Create alert).

## 3. Results header (Bayut parity)

Under the bar on `/properties` (and rent / resale / distress routes):

- Breadcrumb + `Properties for {purpose} in {location}` + total count.
- Quick chips: All / Furnished / Unfurnished (rent), All / Off-plan / Ready / Resale / Distress (buy).
- Sort by: Recommended, Newest, Lowest price, Highest price, Largest size, Distress first, Handover soonest.
- View toggle: List / Grid / Map.
- Create alert dialog: name, frequency (instant / daily / weekly), channel (email), saved per user; owner sees all alerts in the back office.

## 4. Listing labels (owner-controlled, visible on cards)

New label set, assignable from the back-office listing form (multi-select, max 2 shown on a card):

| Label | Style |
| --- | --- |
| Distress deal | animated purple gradient, white text |
| Hot | red, white text |
| Trending | orange, white text |
| Featured | emerald pair gradient, white text |
| Signature | champagne/gold with ink text |
| VIP | deep ink with champagne text |
| New launch | emerald pair gradient |

Labels are filterable and sortable, render as badges on the property card, and the distress label uses a slow premium shimmer (respects reduced-motion).

## 5. One filter, everywhere

A single `PropertySearchBar` component + one `usePropertySearch` state hook (URL is the source of truth) is used on:
`/properties`, `/rent`, `/resale`, `/distress`, area pages, developer pages, and the portal inventory. Project pages keep their own dedicated filters.

More Filters opens the exact same full filter screen as the header filter (shared component, sheet on mobile, dialog on desktop) - not the current reduced panel. Apply writes every selection to the URL, and the result set is the closest match to what was selected, with a visible "showing nearest matches" note only when a strict filter had to be relaxed.

## 6. My added recommendations

- Save search + alert in one flow (save implies optional alert).
- Recent searches and one-tap "reset to last search".
- Price-per-sqft display and a "below area average" flag - strong for investors.
- Map-draw search (draw a polygon) as a later phase.
- Shareable filter URLs with a short slug for WhatsApp sharing to clients.
- Handover-timeline chips (2026 / 2027 / 2028+) for off-plan buyers.

## 7. Verification

- Vitest for the URL codec (every field, include/exclude areas, round-trip) and label filtering.
- Playwright end-to-end on desktop and mobile: build a filter (buy + off-plan + distress + 2 beds + Dubai include, exclude International City and Deira + payment plan + 2028 handover), confirm count updates, Apply lands on `/properties` with matching results, More Filters shows the same screen, sort and view toggles work, alert dialog submits.
- Screenshots for the bar width against the hero headline, mobile two-column layout, and label styles.

## Technical notes

- `src/data/geography.ts` gains area metadata; no schema change needed for include/exclude (URL params `areas` / `areasExclude`).
- New DB columns on the listing/property table: `labels text[]`, plus indexes for label and status filtering; RLS unchanged (owner/admin write, public read of published rows).
- New table `property_alerts` (user_id, name, filters jsonb, frequency, channel) with owner-only read-all, user read/write own, and GRANTs.
- Count queries use `head: true` + `count: 'exact'` so live counts stay cheap.
