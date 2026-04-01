# Database Setup

## Overview

This project uses PostgreSQL (via Supabase) with PostGIS extensions. The schema is defined across **578 migration files** in `supabase/migrations/`.

## Reconnecting to a New Supabase Instance

### Option A: Supabase CLI (Recommended)

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Create a new project (or use existing)
# Link your local project
supabase link --project-ref <your-project-ref>

# Apply all migrations in order
supabase db push

# Deploy edge functions
supabase functions deploy

# Set required secrets
supabase secrets set \
  RESEND_API_KEY=re_xxxx \
  REELLY_API_KEY=xxxx \
  BREVO_API_KEY=xxxx \
  BREVO_LIST_ID=xxxx \
  OWNER_EMAIL=owner@example.com \
  LEAD_REF_HMAC_KEY=xxxx \
  PERPLEXITY_API_KEY=pplx-xxxx \
  VAPI_API_KEY=xxxx \
  ELEVENLABS_API_KEY=xxxx \
  ELEVENLABS_AGENT_ID=xxxx \
  ELEVENLABS_VOICE_ID=xxxx
```

### Option B: Direct SQL

```bash
# Concatenate all migrations and apply directly
cat supabase/migrations/*.sql | psql "postgresql://postgres:PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"
```

## Key Features

- **Row-Level Security (RLS)**: All tables have RLS policies for data protection
- **PostGIS**: Geospatial queries for property locations
- **Realtime**: Several tables have realtime subscriptions enabled
- **Triggers**: Automatic `updated_at` timestamps, validation triggers

## Schema Highlights

| Area | Tables |
|------|--------|
| Properties | `properties`, `projects`, `developers`, `areas` |
| CRM | `crm_leads`, `crm_interactions`, `crm_pipeline_stages` |
| Users | `profiles`, `user_roles`, `user_preferences` |
| AI Tools | `ai_job_master`, `ai_recommendations`, `ai_usage_logs` |
| Analytics | `page_views`, `activity_points_config`, `audit_logs` |

## Notes

- Migrations must be applied **in order** (they are timestamped)
- Some migrations create storage buckets and policies
- Edge functions are in `supabase/functions/` — deploy separately
