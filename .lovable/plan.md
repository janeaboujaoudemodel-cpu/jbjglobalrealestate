# Hub Hardening Plan — no half-done batches

Each phase ends with a Playwright screenshot before I move to the next.

## Phase 1 — Contrast + layout quick locks (fastest, most visible)
1. `REGISTERED` pill: force `#FFFFFF` text on emerald (kill the black override that's leaking back in).
2. Broker table `STATUS` column: pills like "imported" must be **one line** (whitespace-nowrap, min-width, no wrap).
3. Kill remaining hover-grow on the `+ Add` broker button and the two portal launcher buttons.
4. Audience dropdown rows without logos: fall back to initials-on-emerald tile (no white empty squares).

## Phase 2 — Data integrity (stop fake numbers)
1. Remove the "Updated brokers: 3" stat entirely until a real update event exists — no seeded/fake counts anywhere.
2. Audit stat cards on Brokerage Portal + Developer Portal, remove any counts not backed by a real row-change timestamp.
3. Re-import broker DB fields that are being dropped on ingest: **company name, broker type, broker number** — fix the DLD ingest mapping so nothing is truncated.

## Phase 3 — DLD sync actually working
1. Debug why "Pull now" returns empty (edge function logs + response shape).
2. Wire the daily cron so new brokerages + brokers auto-append without me clicking Pull.
3. Only toast success when `insertedCount > 0` (already partly done — verify).

## Phase 4 — Email templates (developer registration + follow-up)
1. Rewrite **Developer · Registration Follow-up** template:
   - Shorter subject, no giant "Reply to Confirm" button.
   - Ask developer to **share the signed contract**.
   - Remove "please reply with info@jbj.ae on CC" line — keep only `contact@jbj.ae`.
   - Footer website `JBJ.AE` uppercase + clickable `https://jbj.ae`.
2. Match Registration + Follow-up visual structure (same header, same signature block, same footer).
3. Logo rule:
   - Emails **to developers** → JBJ logo in header.
   - Emails **to brokerages** (Citi outreach) → Citi Developers logo in header.
4. Verify with a real test send to `infoo.jane@gmail.com` for both templates.

## Phase 5 — Right-side detail drawer
1. Clicking a row in the broker table (name / brokerage / contact) opens a **right-side Sheet** with full details.
2. Actions in drawer: Call, WhatsApp, Email, "Draft email with AI" (uses existing gateway).
3. No page navigation, no reload.

## Phase 6 — Broker intake form (replace "coming next time")
1. Real form on `+ Add broker` with fields:
   - Name, phone (country code), email, brokerage
   - Specialty: Off-plan / Secondary / Both
   - RERA certified: yes/no + RERA card upload (Supabase storage)
   - RERA expiry date → auto-flag broker as `license_expired` when past
2. Nightly cron marks brokers with expired RERA as inactive.

---

**Question for you before I start:** should I run Phases 1 → 6 in order and screenshot each before moving on, or do you want me to jump straight to Phase 3 (DLD sync) and Phase 4 (email templates) first since those are the ones blocking real work today?
