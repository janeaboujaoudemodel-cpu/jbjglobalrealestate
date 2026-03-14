

## Plan: Secrets / Tokens / Environment Isolation Hardening (Security Layer 4D)

### Audit Findings

#### CRITICAL — Secret Leaked in Logs
| Finding | File | Detail |
|---------|------|--------|
| API key prefix logged | `reelly-api-sync/index.ts:106` | `console.log(...key starts: ${apiKey.slice(0,20)}...)` — logs first 20 chars of REELLY_API_KEY |

#### HIGH — Owner Email in Client Bundle
| Finding | File | Detail |
|---------|------|--------|
| `VITE_OWNER_EMAIL` in `.env` | `.env:4` | Baked into Vite client bundle. Any visitor can extract the owner's personal email via browser devtools. Already exists as a runtime secret (`OWNER_EMAIL`). The `VITE_` prefix is unnecessary and exposes PII. |

#### HIGH — API Keys Stored in localStorage
| Finding | File | Detail |
|---------|------|--------|
| `jj_marketing_config` in localStorage | `MarketingSettingsDashboard.tsx` | Stores Brevo API key, Mailchimp API key, Zapier webhook URL in plaintext `localStorage`. Any XSS or browser extension can read these. Should be moved to backend secrets. |

#### HIGH — Error Responses Leak Secret Names
| Finding | Multiple edge functions | Error messages like `"Missing config (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, REELLY_API_KEY)"` returned to callers. Reveals internal secret names. |

#### MEDIUM — Email Responses Returned to Client
| Finding | `send-password-change-confirmation/index.ts:120` | `emailResponse` (Resend API response with internal IDs) returned in JSON body to client. |

#### MEDIUM — Unused/Redundant Secrets
| Finding | Secrets store | `REELLY_EMAIL`, `REELLY_PASSWORD` — not used in any edge function code. `VITE_OWNER_EMAIL` duplicates `OWNER_EMAIL`. `ELEVENLABS_API_KEY` duplicates connector-managed `ELEVENLABS_API_KEY_1`. |

#### LOW — No Secret Rotation Process
No mechanism exists to rotate API keys without downtime.

---

### Implementation

#### 1. Remove API Key Logging

**Update `reelly-api-sync/index.ts`** line 106:
- Change `console.log(\`[fetchPage] URL: ${url}, key starts: ${apiKey.slice(0, 20)}...\`)` → `console.log(\`[fetchPage] URL: ${url}\`)`

#### 2. Remove `VITE_OWNER_EMAIL` from Client Bundle

**Update `.env`**: Remove the `VITE_OWNER_EMAIL` line. The runtime secret `OWNER_EMAIL` already exists and is used by edge functions via `Deno.env.get("OWNER_EMAIL")`.

**Search and update any frontend code** that references `import.meta.env.VITE_OWNER_EMAIL` to instead call `verify-owner` or use the existing `OWNER_EMAIL` runtime secret via edge functions.

#### 3. Move Marketing Config from localStorage to Database

**Database migration**: Create `marketing_config` table (owner-only RLS):
```sql
CREATE TABLE public.marketing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);
-- Owner-only RLS
```

**Update `MarketingSettingsDashboard.tsx`**: Read/write to `marketing_config` table instead of `localStorage`. Remove all `localStorage.getItem('jj_marketing_config')` patterns.

**Update `ZapierWebhook.tsx`**: Fetch webhook URL from DB via edge function instead of localStorage.

**Update `MarketingScripts.tsx`**: Load pixel IDs from DB.

#### 4. Sanitize Error Responses

**Create `supabase/functions/_shared/safe-errors.ts`**: A utility that returns generic error messages without revealing secret names:
```typescript
export function configError(): Response {
  return new Response(JSON.stringify({ error: "Service configuration error" }), { status: 500 });
}
```

**Update edge functions** that return messages containing secret names (e.g., `reelly-bulk-enrich`, `background-enrichment-runner`, `sync-developer-images`, `ai-bulk-enrich`) to use generic messages.

#### 5. Stop Returning Email API Internals to Client

**Update `send-password-change-confirmation/index.ts`**: Return `{ success: true }` only, not the raw Resend `emailResponse`.

Apply same pattern to `welcome-subscriber/index.ts` and any other email functions that echo Resend response data.

#### 6. Create Secret Rotation Readiness Config

**New `src/config/secretRotationManifest.ts`**: A reference document listing all secrets, their purpose, rotation steps, and current status:

```typescript
export const SECRET_MANIFEST = [
  { name: "RESEND_API_KEY", scope: "runtime", rotatable: true, steps: "Generate new key in Resend dashboard → update via Lovable secrets" },
  { name: "REELLY_API_KEY", scope: "runtime", rotatable: true, steps: "Contact Reelly for new key → update via Lovable secrets" },
  { name: "LOVABLE_API_KEY", scope: "runtime", rotatable: false, managed: true },
  // ... all 17 secrets
];
```

#### 7. Flag Unused Secrets for Cleanup

Document in the rotation manifest:
- `REELLY_EMAIL` — not referenced in any code, candidate for removal
- `REELLY_PASSWORD` — not referenced in any code, candidate for removal  
- `VITE_OWNER_EMAIL` — duplicate of `OWNER_EMAIL`, remove after step 2

---

### Files Summary

| File | Change |
|------|--------|
| **Update**: `supabase/functions/reelly-api-sync/index.ts` | Remove API key from log |
| **Update**: `.env` | Remove `VITE_OWNER_EMAIL` |
| **Update**: Frontend files referencing `VITE_OWNER_EMAIL` | Use backend verification instead |
| **New**: `supabase/functions/_shared/safe-errors.ts` | Generic error utility |
| **Update**: ~6 edge functions | Sanitize error messages, stop echoing email API responses |
| **Migration**: Create `marketing_config` table with owner-only RLS |
| **Update**: `MarketingSettingsDashboard.tsx`, `ZapierWebhook.tsx`, `MarketingScripts.tsx` | Move from localStorage to DB |
| **Update**: `send-password-change-confirmation/index.ts`, `welcome-subscriber/index.ts` | Stop returning Resend internals |
| **New**: `src/config/secretRotationManifest.ts` | Rotation readiness reference |

### Implementation Order
1. Remove API key logging (immediate risk)
2. Sanitize error responses + stop echoing email internals
3. Remove `VITE_OWNER_EMAIL` from client bundle
4. Create `marketing_config` table + migrate from localStorage
5. Safe error utility + apply across edge functions
6. Secret rotation manifest

