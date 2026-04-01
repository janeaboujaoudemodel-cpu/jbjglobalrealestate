# Deployment Guide

## GitHub Setup

```bash
# Initialize and push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/jbj-global-realestate.git
git branch -M main
git push -u origin main
```

## Vercel / Netlify

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 20 |
| Install command | `npm install` |

Add these environment variables in your hosting dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## Replit

1. Import from GitHub: **Create Repl → Import from GitHub** → paste repo URL
2. The `.replit` and `replit.nix` files are already configured
3. Add environment variables in Replit's **Secrets** tab (see `.env.example`)
4. Click **Run** — the app starts on port 8080

## Self-Hosted Supabase

To run the full backend independently:

```bash
# 1. Create a new Supabase project at https://supabase.com
# 2. Install Supabase CLI
npm install -g supabase

# 3. Link to your project
supabase link --project-ref <your-project-ref>

# 4. Apply all database migrations
supabase db push

# 5. Deploy all edge functions
supabase functions deploy

# 6. Set edge function secrets
supabase secrets set RESEND_API_KEY=re_xxxx REELLY_API_KEY=xxxx ...
```

See [`database/README.md`](database/README.md) for schema details.

## Docker (Optional)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

```bash
docker build -t jbj-realestate .
docker run -p 80:80 jbj-realestate
```
