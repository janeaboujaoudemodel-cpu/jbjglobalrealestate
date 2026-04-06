

# Data Export Plan: Lovable Cloud → Your Supabase Project

## Overview

You have **~190,000 rows** across **51 tables** with data. I'll export all of them as CSV files you can download and then import into your new Supabase project (`akgrgepfliofvluugkje`).

## Tables with Data (sorted by size)

| Table | Rows |
|-------|------|
| visitor_events | 63,609 |
| project_images | 43,556 |
| user_events | 32,425 |
| visitor_sessions | 17,464 |
| security_events | 8,794 |
| user_points_ledger | 4,821 |
| projects | 2,778 |
| user_sessions | 2,643 |
| api_security_events | 2,190 |
| pending_project_imports | 1,944 |
| user_activity_sessions | 1,871 |
| market_news | 1,272 |
| db_health_logs | 699 |
| developers | 633 |
| areas | 194 |
| sync_jobs | 183 |
| + 35 smaller tables | < 100 each |

## Approach

1. **Export all 51 tables** as individual CSV files to `/mnt/documents/db-export/`
2. **Package** them into a single ZIP for easy download
3. **Provide import instructions** for loading into your new Supabase project

## Import Process (on your side)

After downloading the CSVs, you'll import them into your new Supabase using either:
- **Supabase Dashboard** → Table Editor → Import CSV
- **psql CLI**: `\copy table_name FROM 'file.csv' WITH CSV HEADER`

## Important Notes

- The schema (tables, columns, RLS policies) must be applied first via `supabase db push` before importing data
- Tables with foreign key dependencies need to be imported in the correct order (parent tables first)
- Encrypted PII fields will export in their encrypted form — you'll need the same encryption keys on the new instance
- Large tables (60K+ rows) will be exported in batches due to query limits

