
## What's actually broken

Two separate symptoms, one root cause:

1. **"Registered at Hostinger" parking page** → `jbj.ae` A record at Hostinger still points to Hostinger's parking/hosting IP (something in the `84.32.x` / `145.223.x` range), not to Lovable's `185.158.133.1`.
2. **`ERR_SSL_PROTOCOL_ERROR` on `https://jbj.ae`** → the server answering on port 443 has no valid TLS certificate for `jbj.ae`. That happens when:
   - DNS is proxied through Cloudflare (orange cloud) without a valid edge cert, OR
   - DNS points to a host that doesn't have an SSL cert issued for `jbj.ae` (Hostinger parking), OR
   - Both an old A record and the new Lovable A record exist, and DNS is returning the wrong one.

The Lovable side is fine — `www.jbj.ae` is listed as Active in your project URLs, so the apex (`jbj.ae`) is the one still misconfigured / conflicting.

## Why this happened

- The domain is **registered at Hostinger**, so Hostinger's nameservers (`ns1.dns-parking.com` / `ns2.dns-parking.com`, or `ns1.hostinger.com` family) are authoritative for DNS.
- When you "connected" `jbj.ae` in Lovable, Lovable showed you the records to add (A → `185.158.133.1`, TXT `_lovable`) — but the registrar **didn't actually replace** the original parking A record. Either:
  - The old parking A record was never deleted, so DNS still resolves to Hostinger's parking server, **or**
  - You added the records under a Cloudflare layer (orange-cloud proxy) without disabling proxy mode in Lovable's Advanced settings — Cloudflare then terminates TLS with no cert for `jbj.ae`, producing `ERR_SSL_PROTOCOL_ERROR`.
- Lovable will report the domain as "Verified" as soon as the `_lovable` TXT record is seen once, even if the live A record is still wrong. Verified ≠ Active.

## Fix (action plan — you do this at Hostinger, ~10 minutes + propagation)

### Step 1 — Decide DNS path

Pick **A** (simplest, recommended) or **B** (only if you specifically need Cloudflare):

- **A. Direct DNS at Hostinger → Lovable** (recommended). No proxy, fastest setup, Lovable manages SSL.
- **B. Cloudflare in front of Lovable**. Requires switching Lovable into "Domain uses Cloudflare or a similar proxy" mode (CNAME-based verification) — and you accept that Cookiebot/region scans will see Cloudflare edges, not Lovable.

### Step 2 — Clean DNS at Hostinger (Path A)

In **hPanel → Domains → jbj.ae → DNS / Nameservers → DNS Zone**:

1. **Delete** every existing record for:
   - Type `A`, Name `@` (and any duplicates)
   - Type `A`, Name `www`
   - Type `CNAME`, Name `www` (if present)
   - Type `AAAA`, Name `@` or `www` (IPv6 parking records cause the same problem)
   - Any old `TXT _lovable` rows with stale values
2. **Add** exactly:
   | Type | Name | Value | TTL |
   |------|------|-------|-----|
   | A | @ | 185.158.133.1 | 3600 |
   | A | www | 185.158.133.1 | 3600 |
   | TXT | _lovable | *(paste the exact `lovable_verify=…` string shown in Project Settings → Domains → jbj.ae → Configure)* | 3600 |
3. **Keep** your MX / SPF / DKIM / DMARC records untouched (those are for email, separate from web hosting).
4. **Confirm nameservers** are Hostinger's defaults (`ns1.dns-parking.com` + `ns2.dns-parking.com`, or `ns1.hostinger.com` + `ns2.hostinger.com`). If they were changed to Cloudflare or anything else, either switch them back **or** manage DNS at that provider instead — never split.

### Step 3 — If Cloudflare is in the path (Path B only)

1. In Cloudflare DNS, set both `@` and `www` records to **DNS-only (grey cloud)**, not proxied (orange cloud), at least until Lovable shows Active.
2. In Lovable → Project Settings → Domains → `jbj.ae` → **Configure → Advanced**, check **"Domain uses Cloudflare or a similar proxy"**. This switches Lovable to CNAME verification, which is what Cloudflare needs.
3. Only after Lovable shows **Active**, you may turn the orange cloud back on. Cloudflare must have "Full (strict)" SSL mode, not "Flexible" (Flexible is what causes `ERR_SSL_PROTOCOL_ERROR` loops).

### Step 4 — Re-verify in Lovable

1. Project Settings → Domains → `jbj.ae` → **⋯ → Verify / Retry**.
2. Wait for status to move: `Verifying` → `Setting up` → **Active**. SSL is provisioned automatically by Lovable once DNS is clean (Let's Encrypt; takes 2–15 min typically, up to 72 h worst case).
3. Set `jbj.ae` (or `www.jbj.ae`, whichever you prefer as canonical) as **Primary** so the other one 301-redirects to it.

### Step 5 — Validate

From any machine:
- `dig jbj.ae +short` → must return **only** `185.158.133.1`
- `dig www.jbj.ae +short` → must return `185.158.133.1`
- `curl -sI https://jbj.ae` → must return `HTTP/2 200` with a Let's Encrypt cert
- Browser hard-refresh (Cmd/Ctrl-Shift-R), clear HSTS for `jbj.ae` if Chrome still cached the SSL error (chrome://net-internals/#hsts → Delete domain).

## Long-term recommendations to prevent recurrence

1. **One DNS authority, always.** Either Hostinger DNS *or* Cloudflare DNS — never both partially. Mixed authority is the #1 cause of "verified but offline" domains.
2. **Add `www` AND apex explicitly** in Lovable. Pick one as Primary; the other redirects. Don't rely on the registrar's "www redirect" toggle — it conflicts with Lovable's own A record.
3. **CAA record (optional, recommended).** Add `CAA @ 0 issue "letsencrypt.org"` so SSL re-issuance never fails. If you have a restrictive CAA from a previous host, Let's Encrypt is blocked silently.
4. **Lower TTL to 300 before any future DNS change**, then raise back to 3600 after. Makes rollbacks instant.
5. **Don't park the domain anywhere else.** Hostinger auto-attaches parking when a domain isn't assigned to a hosting plan — that's what reintroduced the wrong A record. In hPanel, ensure the domain is **not assigned to any Hostinger hosting plan / website builder** (Websites → Remove `jbj.ae` from any plan).
6. **Monitoring.** Set up a free uptime check (UptimeRobot / BetterStack) on `https://jbj.ae` so the next time DNS drifts you get an alert in minutes, not days.
7. **Document the canonical config** somewhere in your team's runbook: registrar = Hostinger, DNS host = Hostinger, web host = Lovable, A `@` and A `www` = `185.158.133.1`, SSL = Lovable-managed Let's Encrypt.

## What I will do in build mode

Nothing in code — this is a registrar-side fix. After you apply Steps 2–4 at Hostinger and Lovable shows the domain as **Active**, ping me and I will:
- Verify both URLs (`https://jbj.ae`, `https://www.jbj.ae`) return the live app from inside the sandbox (curl + Playwright screenshot).
- Confirm the apex/www redirect direction matches your Primary choice.
- Save a project memory note locking the canonical DNS config so future agents don't re-suggest a Cloudflare or Vercel swap.

## Open question before you proceed

Are you currently using **Cloudflare** in front of `jbj.ae` (i.e. did you point Hostinger's nameservers to Cloudflare at any point)? Answer changes Step 2 vs Step 3:
- **No / not sure** → follow Path A (direct Hostinger → Lovable).
- **Yes** → follow Path B (keep Cloudflare, grey-cloud it, enable Lovable's proxy mode).
