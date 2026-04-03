

# Updated Export & Deployment Readiness Plan

The existing plan covers Steps 1-7 (README, .env.example, .gitignore, .replit, vite.config, schema export, deployment guide). This update adds **Step 8: Frontend Credentials Audit** and incorporates it into the file manifest.

A previous audit of the codebase confirmed the frontend is already clean — no hardcoded secrets were found. This step formalizes that as a documented, repeatable process.

---

## What changes

### Add Step 8: Audit Frontend for Hardcoded Credentials

Insert after Step 7 in `.lovable/plan.md`:

**Step 8: Audit All API Calls — No Hardcoded Credentials**

Verify and document that no private API keys, tokens, or secrets appear in frontend source code:

- Search all `src/` files for patterns: `sk-`, `sk_live`, `pk_live`, `ghp_`, `xoxb-`, `re_`, `pplx-`, hardcoded JWT strings, and raw email addresses used for auth bypass
- Confirm all edge function calls use one of two safe patterns:
  - **SDK calls** (`supabase.functions.invoke`) — anon key injected automatically
  - **Manual fetch** — uses `session.access_token` from runtime auth, never a stored secret
- Confirm `localStorage` stores only UI preferences (role selection, tour state, drafts), never credentials
- Confirm `VITE_OWNER_EMAIL` has been removed from all client code (previously flagged and deleted)
- Confirm the only `VITE_` env var containing a key is `VITE_SUPABASE_PUBLISHABLE_KEY` (public by design)
- Add a `SECURITY.md` file documenting these audit results and the patterns developers must follow

### Update the Files table

Add to the existing manifest:

| File | Action |
|------|--------|
| `SECURITY.md` | Create — documents audit results and safe API call patterns |

---

## Technical detail

The `SECURITY.md` file will contain:
- Audit date and scope
- Approved API call patterns (SDK vs manual fetch with session token)
- Prohibited patterns (hardcoded keys, localStorage secrets, logging key prefixes)
- Reference to the Secret Rotation Manifest (`secretRotationManifest.ts`)
- Instructions for re-running the audit (grep commands)

No code changes are needed — the audit confirmed the codebase is already compliant.

---

## Step 8: Audit All API Calls — No Hardcoded Credentials

Verify and document that no private API keys, tokens, or secrets appear in frontend source code:

- Search all `src/` files for patterns: `sk-`, `sk_live`, `pk_live`, `ghp_`, `xoxb-`, `re_`, `pplx-`, hardcoded JWT strings, and raw email addresses used for auth bypass
- Confirm all edge function calls use one of two safe patterns:
  - **SDK calls** (`supabase.functions.invoke`) — anon key injected automatically
  - **Manual fetch** — uses `session.access_token` from runtime auth, never a stored secret
- Confirm `localStorage` stores only UI preferences (role selection, tour state, drafts), never credentials
- Confirm `VITE_OWNER_EMAIL` has been removed from all client code (previously flagged and deleted)
- Confirm the only `VITE_` env var containing a key is `VITE_SUPABASE_PUBLISHABLE_KEY` (public by design)
- Create `SECURITY.md` documenting audit results and developer patterns

### Files to Create/Modify (Updated)

| File | Action |
|------|--------|
| `SECURITY.md` | Create — documents audit results and safe API call patterns |

