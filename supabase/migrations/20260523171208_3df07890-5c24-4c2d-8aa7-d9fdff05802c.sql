-- Owner delegate access manager: grant per-section access to other users by email
create table if not exists public.owner_delegates (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  delegate_email text not null,
  delegate_user_id uuid,
  scopes jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, delegate_email)
);

create index if not exists idx_owner_delegates_email on public.owner_delegates(lower(delegate_email));
create index if not exists idx_owner_delegates_user on public.owner_delegates(delegate_user_id) where delegate_user_id is not null;

alter table public.owner_delegates enable row level security;

-- Only app owner/admin can read/manage delegates
drop policy if exists "Owner can read delegates" on public.owner_delegates;
create policy "Owner can read delegates" on public.owner_delegates
  for select using (public.has_role(auth.uid(), 'owner') or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Owner can manage delegates" on public.owner_delegates;
create policy "Owner can manage delegates" on public.owner_delegates
  for all using (public.has_role(auth.uid(), 'owner') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'owner') or public.has_role(auth.uid(), 'admin'));

-- A delegate can read their own row (so the client can compute their scopes)
drop policy if exists "Delegate can read own row" on public.owner_delegates;
create policy "Delegate can read own row" on public.owner_delegates
  for select using (delegate_user_id = auth.uid());

-- Helper: returns true if the current user has the given scope ticked
create or replace function public.has_delegate_scope(_user_id uuid, _scope text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.owner_delegates d
    where d.is_active = true
      and d.delegate_user_id = _user_id
      and coalesce((d.scopes ->> _scope)::boolean, false) = true
  )
$$;

-- Auto-link delegate_user_id when a matching auth.user signs up / logs in
create or replace function public.link_owner_delegate_to_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.owner_delegates
  set delegate_user_id = new.id,
      updated_at = now()
  where delegate_user_id is null
    and lower(delegate_email) = lower(new.email);
  return new;
end;
$$;

drop trigger if exists trg_link_owner_delegate on auth.users;
create trigger trg_link_owner_delegate
  after insert on auth.users
  for each row execute function public.link_owner_delegate_to_user();

-- Backfill any already-registered users matching delegate emails
update public.owner_delegates d
set delegate_user_id = u.id, updated_at = now()
from auth.users u
where d.delegate_user_id is null
  and lower(d.delegate_email) = lower(u.email);

-- updated_at trigger
drop trigger if exists trg_owner_delegates_updated on public.owner_delegates;
create trigger trg_owner_delegates_updated
  before update on public.owner_delegates
  for each row execute function public.update_updated_at_column();