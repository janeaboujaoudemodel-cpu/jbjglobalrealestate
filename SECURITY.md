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
