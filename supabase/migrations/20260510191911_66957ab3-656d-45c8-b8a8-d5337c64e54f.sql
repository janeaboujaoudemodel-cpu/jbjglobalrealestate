create table if not exists public.branded_email_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  subject text not null default '',
  body_html text not null default '',
  brief text,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_branded_email_templates_owner
  on public.branded_email_templates(owner_id, updated_at desc);

alter table public.branded_email_templates enable row level security;

drop policy if exists "owner_select_branded_email_templates"
  on public.branded_email_templates;
create policy "owner_select_branded_email_templates"
  on public.branded_email_templates
  for select to authenticated
  using (
    owner_id = auth.uid()
    or public.has_role(auth.uid(), 'owner'::public.app_role)
    or public.has_role(auth.uid(), 'admin'::public.app_role)
  );

drop policy if exists "owner_insert_branded_email_templates"
  on public.branded_email_templates;
create policy "owner_insert_branded_email_templates"
  on public.branded_email_templates
  for insert to authenticated
  with check (
    owner_id = auth.uid()
    and (
      public.has_role(auth.uid(), 'owner'::public.app_role)
      or public.has_role(auth.uid(), 'admin'::public.app_role)
    )
  );

drop policy if exists "owner_update_branded_email_templates"
  on public.branded_email_templates;
create policy "owner_update_branded_email_templates"
  on public.branded_email_templates
  for update to authenticated
  using (
    owner_id = auth.uid()
    or public.has_role(auth.uid(), 'owner'::public.app_role)
    or public.has_role(auth.uid(), 'admin'::public.app_role)
  );

drop policy if exists "owner_delete_branded_email_templates"
  on public.branded_email_templates;
create policy "owner_delete_branded_email_templates"
  on public.branded_email_templates
  for delete to authenticated
  using (
    owner_id = auth.uid()
    or public.has_role(auth.uid(), 'owner'::public.app_role)
    or public.has_role(auth.uid(), 'admin'::public.app_role)
  );

create or replace function public.set_branded_email_templates_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_branded_email_templates_updated_at
  on public.branded_email_templates;
create trigger trg_branded_email_templates_updated_at
  before update on public.branded_email_templates
  for each row execute function public.set_branded_email_templates_updated_at();