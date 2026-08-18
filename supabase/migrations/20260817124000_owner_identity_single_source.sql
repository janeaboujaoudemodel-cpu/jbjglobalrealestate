-- Media Ingestion Audit (Aug 17 2026) — finding 3.4
--
-- "Who is the owner?" was answered in two places that had no link to each
-- other: `src/config/ownerEmails.ts` in the frontend, and a list of the same
-- four addresses hardcoded inside `rel_is_owner()`. Two hardcoded copies of a
-- security boundary drift eventually, and when they do the failure is silent
-- in both directions — access breaks, or it opens up.
--
-- What this does NOT do: remove the email allow-list. That is the documented
-- design (see CLAUDE.md "Roles & access control") — owner is an allow-list, not
-- a role, precisely so it cannot be granted by writing a database row. Ripping
-- it out server-side while `OwnerGuard` still trusts it would either lock the
-- owner out of the CRM or turn owner into a DB-writable privilege. Neither is
-- an improvement.
--
-- What it does instead:
--   1. Moves the server-side list into one table, so the database has a single
--      place to read rather than a literal buried in a function body.
--   2. Seeds `user_roles` with the owner role for any matching account, so the
--      proper `user_roles`/`has_role()` mechanism is populated and can become
--      the primary path later without a flag day.
--   3. Leaves `rel_is_owner()` accepting either, so nothing can lock out.
--
-- The frontend copy stays authoritative for routing, and
-- `src/config/ownerEmails.drift.test.ts` fails CI if this list and
-- `ownerEmails.ts` ever disagree — which is the part that was actually missing.

CREATE TABLE IF NOT EXISTS public.owner_email_allowlist (
  email text PRIMARY KEY,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.owner_email_allowlist IS
  'Server-side mirror of src/config/ownerEmails.ts. Kept in step by src/config/ownerEmails.drift.test.ts. Read by rel_is_owner().';

ALTER TABLE public.owner_email_allowlist ENABLE ROW LEVEL SECURITY;

-- Deny-by-default: nothing reads or writes this from the client. Only
-- SECURITY DEFINER functions and service-role access touch it.
DROP POLICY IF EXISTS "owner_allowlist_no_client_access" ON public.owner_email_allowlist;

INSERT INTO public.owner_email_allowlist (email, note) VALUES
  ('janeaboujaoudenails@gmail.com', 'PRIMARY_OWNER_EMAIL'),
  ('janeaboujaoudemodel@gmail.com', 'founder alias'),
  ('contact@janeaboujaoude.net',    'founder alias'),
  ('infoo.jane@gmail.com',          'founder alias')
ON CONFLICT (email) DO NOTHING;

-- Populate the proper role mechanism for whichever of those accounts exist.
-- Idempotent, and a no-op for addresses that have never signed up.
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'owner'::public.app_role
FROM auth.users u
JOIN public.owner_email_allowlist a ON lower(u.email) = lower(a.email)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.rel_is_owner()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  -- Path 1: the email allow-list, now read from one table instead of a
  -- hardcoded literal. `app.owner_email` may still narrow it at runtime.
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.owner_email_allowlist a ON lower(u.email) = lower(a.email)
    WHERE u.id = auth.uid()
  )
  -- Path 2: the proper role table, seeded above and usable on its own.
  OR EXISTS (
    SELECT 1
    FROM public.user_roles r
    WHERE r.user_id = auth.uid()
      AND r.role::text IN ('owner','admin','super_admin')
  );
$$;
