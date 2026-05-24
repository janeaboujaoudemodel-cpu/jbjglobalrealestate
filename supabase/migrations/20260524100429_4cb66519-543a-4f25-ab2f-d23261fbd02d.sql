create table if not exists public.project_images_purge_log (
  id uuid primary key default gen_random_uuid(),
  original_id uuid,
  project_id uuid,
  image_url text,
  display_order int,
  alt_text text,
  purged_at timestamptz not null default now(),
  reason text
);

alter table public.project_images_purge_log enable row level security;

drop policy if exists "owners read purge log" on public.project_images_purge_log;
create policy "owners read purge log"
on public.project_images_purge_log
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'::app_role) or public.has_role(auth.uid(), 'owner'::app_role));

insert into public.project_images_purge_log (original_id, project_id, image_url, display_order, alt_text, reason)
select id, project_id, image_url, display_order, alt_text,
  case
    when image_url is null or image_url = '' then 'empty'
    when image_url ilike '%Base64-Image-Removed%' then 'base64_placeholder'
    when image_url not ilike 'http%' then 'bare_filename'
    else 'other'
  end
from public.project_images
where image_url is null
   or image_url = ''
   or image_url ilike '%Base64-Image-Removed%'
   or image_url not ilike 'http%';

delete from public.project_images
where image_url is null
   or image_url = ''
   or image_url ilike '%Base64-Image-Removed%'
   or image_url not ilike 'http%';

create or replace function public.enforce_project_image_url_is_http()
returns trigger
language plpgsql
as $$
begin
  if new.image_url is null
     or btrim(new.image_url) = ''
     or new.image_url ilike '%Base64-Image-Removed%'
     or (new.image_url not ilike 'http://%' and new.image_url not ilike 'https://%')
  then
    raise exception 'project_images.image_url must be a full http(s) URL (got: %)', new.image_url
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_project_image_url_is_http on public.project_images;
create trigger trg_enforce_project_image_url_is_http
before insert or update of image_url on public.project_images
for each row execute function public.enforce_project_image_url_is_http();