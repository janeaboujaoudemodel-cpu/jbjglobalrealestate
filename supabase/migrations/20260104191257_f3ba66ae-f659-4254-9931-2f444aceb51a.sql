-- 1) Rate limiting table for edge functions
create table if not exists public.function_rate_limits (
  id uuid primary key default gen_random_uuid(),
  rate_key text not null,
  function_name text not null,
  window_start timestamp with time zone not null,
  request_count integer not null default 0,
  created_at timestamp with time zone not null default now(),
  unique (rate_key, function_name, window_start)
);

create index if not exists idx_function_rate_limits_lookup
  on public.function_rate_limits (rate_key, function_name, window_start);

alter table public.function_rate_limits enable row level security;

-- Only admins can view rate limit rows (edge functions will write using service key)
drop policy if exists "Admins can view function rate limits" on public.function_rate_limits;
create policy "Admins can view function rate limits"
on public.function_rate_limits
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Tighten policies to avoid "public" exposure warnings
-- evaluation_requests
DROP POLICY IF EXISTS "Users can view own evaluation requests" ON public.evaluation_requests;
CREATE POLICY "Users can view own evaluation requests"
ON public.evaluation_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all evaluation requests" ON public.evaluation_requests;
CREATE POLICY "Admins can manage all evaluation requests"
ON public.evaluation_requests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- quiz_responses
DROP POLICY IF EXISTS "Users can view their own quiz responses" ON public.quiz_responses;
CREATE POLICY "Users can view their own quiz responses"
ON public.quiz_responses
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all quiz responses" ON public.quiz_responses;
CREATE POLICY "Admins can view all quiz responses"
ON public.quiz_responses
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can create quiz responses" ON public.quiz_responses;
CREATE POLICY "Anyone can create quiz responses"
ON public.quiz_responses
FOR INSERT
TO public
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
);
