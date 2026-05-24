create table public.user_project_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid not null,
  project_slug text not null,
  viewed_at timestamptz not null default now(),
  unique (user_id, project_id)
);
alter table public.user_project_views enable row level security;
create policy "own views select" on public.user_project_views for select using (auth.uid() = user_id);
create policy "own views insert" on public.user_project_views for insert with check (auth.uid() = user_id);
create policy "own views update" on public.user_project_views for update using (auth.uid() = user_id);
create index user_project_views_user_viewed_idx on public.user_project_views (user_id, viewed_at desc);