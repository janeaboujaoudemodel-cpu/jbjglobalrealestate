

# Export & Deployment Readiness Plan

This is a large, enterprise-grade project (260+ edge functions, 578 migrations, 100+ components) tightly coupled to Lovable Cloud. Here is what needs to happen to make it portable.

---

## Important Context

This project runs on **Lovable Cloud** (Supabase-backed). The frontend is a standard Vite/React app that can run anywhere, but the backend (database, edge functions, auth, storage) is deeply integrated with the cloud platform. Full self-hosting requires a standalone Supabase instance.

---

## Step 1: Clean Up README.md

Replace the current boilerplate README with a comprehensive project document:

- **Project overview**: JBJ Global Real Estate — Dubai property brokerage platform
- **Tech stack**: React 18, Vite 5, TypeScript 5, Tailwind CSS 3, Supabase (PostgreSQL + Edge Functions)
- **Setup instructions**: Clone, install, configure env vars, run
- **Environment variables list** (all 14 secrets + Supabase connection vars)
- **Build/run commands**: `npm install`, `npm run dev`, `npm run build`, `npm run preview`
- **Database setup**: How to apply migrations via `supabase db push`
- **Edge functions**: How to deploy via `supabase functions deploy`
- **Folder structure** explanation

---

## Step 2: Create .env.example

New file listing every required environment variable with placeholder values:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id

# Edge Function Secrets (set via supabase secrets set)
RESEND_API_KEY=re_xxxx
REELLY_API_KEY=xxxx
BREVO_API_KEY=xxxx
BREVO_LIST_ID=xxxx
OWNER_EMAIL=owner@example.com
LEAD_REF_HMAC_KEY=xxxx
PERPLEXITY_API_KEY=pplx-xxxx
VAPI_API_KEY=xxxx
ELEVENLABS_API_KEY=xxxx
ELEVENLABS_AGENT_ID=xxxx
ELEVENLABS_VOICE_ID=xxxx
```

---

## Step 3: Update .gitignore

Add entries to ensure no sensitive or unnecessary files are committed:

```
.env
.env.local
*.local
tmp/
bun.lock
bun.lockb
.lovable/
.workspace/
```

---

## Step 4: Create .replit Configuration

New `.replit` file for Replit compatibility:

```toml
run = "npm install && npm run dev"
entrypoint = "src/main.tsx"

[nix]
channel = "stable-24_05"

[env]
PORT = "8080"

[[ports]]
localPort = 8080
externalPort = 80
```

Also add a `replit.nix` with Node.js 20.

---

## Step 5: Update vite.config.ts for Dynamic Port

Change the server port to read from `process.env.PORT` for Replit/container compatibility:

```typescript
server: {
  host: "0.0.0.0",
  port: parseInt(process.env.PORT || "8080"),
}
```

---

## Step 6: Create Database Schema Export

Generate a consolidated `schema.sql` file in a new `database/` folder by concatenating all 578 migration files in order. Add a header explaining:
- How to create a new Supabase project
- How to apply: `supabase db push` or `psql -f schema.sql`
- That RLS policies are included in migrations

---

## Step 7: Add GitHub Deployment Guide

Add `DEPLOYMENT.md` with:
- GitHub repository setup instructions (`git remote add origin`, push)
- Vercel/Netlify deployment steps (build command: `npm run build`, output: `dist/`)
- Supabase self-hosting: link to Supabase docs, how to apply migrations
- Replit import: fork/import from GitHub, configure secrets in Replit

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `README.md` | Rewrite with full project documentation |
| `.env.example` | Create with all placeholder variables |
| `.gitignore` | Add `.env`, `.lovable/`, `tmp/`, lock files |
| `.replit` | Create for Replit compatibility |
| `replit.nix` | Create with Node.js 20 |
| `vite.config.ts` | Dynamic port from `process.env.PORT` |
| `DEPLOYMENT.md` | GitHub + Replit + Vercel deployment guide |
| `database/README.md` | Database reconnection instructions |

No database migrations or edge function changes needed — these are already portable via the `supabase/` directory.

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

