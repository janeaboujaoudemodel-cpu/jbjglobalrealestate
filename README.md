# JBJ Global Real Estate

Enterprise-grade Dubai real estate brokerage platform with AI-powered tools, CRM, and investor dashboards.

## Tech Stack

- **Frontend**: React 18, TypeScript 5, Vite 5, Tailwind CSS 3, Framer Motion
- **Backend**: Supabase (PostgreSQL + PostGIS), 260+ Deno Edge Functions
- **AI**: Gemini 2.5, GPT-5, ElevenLabs, VAPI, Perplexity
- **Maps**: Leaflet / React Leaflet
- **Charts**: Recharts
- **Mobile**: Capacitor (iOS/Android)

## Quick Start

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Start development server
npm run dev
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (default port 8080) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Environment Variables

### Frontend (required in `.env`)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project reference ID |

### Edge Function Secrets (set via `supabase secrets set`)

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Transactional emails |
| `REELLY_API_KEY` | Property data sync |
| `BREVO_API_KEY` | Email marketing |
| `BREVO_LIST_ID` | Mailing list ID |
| `OWNER_EMAIL` | Admin notifications |
| `LEAD_REF_HMAC_KEY` | Referral token signing |
| `PERPLEXITY_API_KEY` | AI search |
| `VAPI_API_KEY` | Voice AI agents |
| `ELEVENLABS_API_KEY` | Text-to-speech |
| `ELEVENLABS_AGENT_ID` | ElevenLabs agent ID |
| `ELEVENLABS_VOICE_ID` | ElevenLabs voice ID |

## Project Structure

```
src/
├── components/       # React components (100+)
├── pages/            # Route pages
├── hooks/            # Custom React hooks
├── integrations/     # Supabase client & types
├── config/           # App configuration
├── utils/            # Utility functions
├── assets/           # Static assets
└── styles/           # Global styles

supabase/
├── functions/        # 260+ Deno Edge Functions
├── migrations/       # 578 database migrations
└── config.toml       # Supabase configuration
```

## Database Setup

If self-hosting with your own Supabase instance:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref <your-project-ref>

# Apply all migrations
supabase db push

# Deploy edge functions
supabase functions deploy
```

See [`database/README.md`](database/README.md) for detailed instructions.

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for full deployment guides covering:
- Vercel / Netlify
- Replit
- Self-hosted Supabase
- GitHub Actions CI/CD

## Replit Deployment

### Quick Start on Replit

1. **Import from GitHub** — Create a new Replit → Import from GitHub → paste the repo URL
2. **Set Secrets** — In Replit's Secrets tab, add the following:

| Secret | Required | Description |
|--------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | ✅ | Supabase project reference ID |

3. **Run** — Click the Run button. Replit uses `.replit` to execute `npm install && npm run dev`.

### Common Issues

| Problem | Fix |
|---------|-----|
| Port already in use | Vite auto-selects an available port; check the console output for the actual URL |
| Build runs out of memory | In `.replit`, add `[env]` section with `NODE_OPTIONS="--max-old-space-size=2048"` |
| Missing env vars at runtime | Ensure secrets are set in Replit's Secrets tab, not in a `.env` file |
| Blank page after build | Run `npm run build && npm start` to serve the production build |

---

## License

Proprietary — All rights reserved.
