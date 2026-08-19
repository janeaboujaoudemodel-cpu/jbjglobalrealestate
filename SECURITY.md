# Security Audit — Frontend Credentials

**Last audited**: 2026-04-03
**Scope**: All files under `src/`

---

## Audit Results: PASS ✅

No hardcoded private API keys, tokens, or secrets were found in frontend source code.

---

## Approved API Call Patterns

### Pattern A: Supabase SDK (automatic anon key)

```typescript
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.functions.invoke("function-name", {
  body: payload,
});
```

The SDK injects `VITE_SUPABASE_PUBLISHABLE_KEY` (public anon key) automatically. No manual auth header needed.

### Pattern B: Manual fetch with session token

```typescript
const { data: { session } } = await supabase.auth.getSession();

const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/function-name`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  },
  body: JSON.stringify(payload),
});
```

Auth token comes from the runtime session — never stored or hardcoded.

---

## Prohibited Patterns

| Pattern | Reason |
|---------|--------|
| Hardcoded `sk-`, `sk_live`, `ghp_`, `xoxb-`, `re_`, `pplx-` strings | Private API keys must never appear in frontend code |
| `VITE_OWNER_EMAIL` in client code | Removed — was leaking owner identity in bundle |
| Storing API keys in `localStorage` | Only UI preferences (role, tour state, drafts) may be stored |
| Logging API key prefixes in edge functions | Prevents accidental exposure in logs |
| Hardcoded JWT strings | Tokens must come from runtime auth sessions |
| Committing `.env` / `.env.*` | Gitignored since Aug 2026 — only `.env.example` is tracked |
| `dangerouslySetInnerHTML` without a `safeHtml.ts` profile | Every sink must go through `sanitizeRichHtml` / `sanitizeSvgMarkup` / `sanitizeDocumentHtml` |
| `document.write` into a popup | Use `openPrintWindow()` (`src/utils/printWindow.ts`) — it sanitizes and never runs the HTML parser on the input |
| `window.open(x)` / `location.href = x` with a dynamic `x` | Use `safeOpen` / `safeNavigate` (`src/utils/safeUrl.ts`) — scheme allowlist |
| `fetch(userUrl)` in an edge function | Use `safeFetch` / `assertPublicHttpUrl` (`_shared/ssrf-guard.ts`) |
| Storage keys built from raw `file.name` or `split('.').pop()` | Use `safeStorageFileName` / `safeFileExtension` (`src/utils/storagePath.ts`) |
| Unpinned third-party GitHub Actions | Pin to a commit SHA with a `# vX.Y.Z` comment |

### The Supabase anon key is not a secret

`VITE_SUPABASE_PUBLISHABLE_KEY` is Supabase's *publishable* key. It is compiled
into every production bundle and sent to every visitor; its `role` claim is
`anon`, so it grants exactly what RLS grants an unauthenticated session. Secret
scanners flag it because it is shaped like a JWT — that is a false positive, and
it does not need rotating. The security boundary is the RLS policies.

It lives in exactly one place, `src/config/backendDefaults.ts`, and in the
database behind `public.edge_function_anon_key()`. Do not paste new copies of it
into source files, and do not treat a scanner hit on it as an incident.

Genuinely secret values — `service_role`, `RESEND_API_KEY`, `LEAD_REF_HMAC_KEY`,
and everything else under "Edge Function Secrets" in `.env.example` — go through
`supabase secrets set` and must never appear in this repo.

---

## Environment Variables in Frontend

Only these `VITE_` variables are permitted in the client bundle:

| Variable | Type | Safe? |
|----------|------|-------|
| `VITE_SUPABASE_URL` | Public endpoint URL | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public anon key | ✅ |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier | ✅ |

All private keys (Resend, Reelly, Brevo, ElevenLabs, Perplexity, VAPI, etc.) are stored as backend secrets and accessed only by edge functions.

---

## Re-Running This Audit

```bash
# Search for hardcoded secret patterns
grep -rn "sk-\|sk_live\|pk_live\|ghp_\|xoxb-\|re_\|pplx-" src/

# Any JWT literal outside the one place the anon key is allowed to live
grep -rn -o "eyJ[A-Za-z0-9_-]\{10,\}\.eyJ[A-Za-z0-9_-]\{10,\}\.[A-Za-z0-9_-]\{5,\}" \
  --exclude-dir=node_modules --exclude=package-lock.json --exclude=bun.lock .

# Unsanitized HTML sinks and popup writers
grep -rn "dangerouslySetInnerHTML" src/ | grep -v "safeHtml\|DOMPurify\|sanitize"
grep -rn "document\.write" src/

# Outbound fetches in edge functions that skip the SSRF guard
grep -rn "await fetch(" supabase/functions --include=index.ts | grep -v "safeFetch"

# GitHub Actions that are not SHA-pinned
grep -rn "uses: .*@v[0-9]" .github/workflows/

# Search for VITE_OWNER_EMAIL references
grep -rn "VITE_OWNER_EMAIL" src/

# Check localStorage usage
grep -rn "localStorage" src/ | grep -v node_modules

# List all VITE_ env var usage
grep -rn "import.meta.env.VITE_" src/
```

---

## Reference

- Secret Rotation Manifest: [`src/config/secretRotationManifest.ts`](src/config/secretRotationManifest.ts)
- Deployment Guide: [`DEPLOYMENT.md`](DEPLOYMENT.md)
