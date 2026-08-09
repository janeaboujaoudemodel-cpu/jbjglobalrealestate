set local app.allow_logo_overwrite = 'true';

update public.developers set logo_locked = false where slug in (
 'dar-al-arkan','ahmed-alansari-real-estate-development','al-fahad-holding','abyaar-real-estate-development',
 'dubai-south-properties','amaya-properties','union-properties','lootah-real-estate-development-l-l-c',
 'deyaar-development','mag-group','mag-property-development','kifata-properties-l-l-c',
 'sobha-realty','sobha-realty-merged'
) or name ilike '%manazil%' or name ilike '%mered%';

with restore(slug_key, file) as (values
 ('dar-al-arkan','dar-al-arkan-tight.png'),
 ('ahmed-alansari-real-estate-development','ahmed-alansari-tight.png'),
 ('al-fahad-holding','al-fahad-holding-tight.png'),
 ('abyaar-real-estate-development','abyaar-real-estate-development-tight.png'),
 ('dubai-south-properties','dubai-south-properties-tight.png'),
 ('amaya-properties','amaya-properties-tight.png'),
 ('union-properties','union-properties-tight.png'),
 ('lootah-real-estate-development-l-l-c','lootah-real-estate-development-l-l-c-tight.png'),
 ('deyaar-development','deyaar-development-tight.png'),
 ('mag-group','mag-group-tight.png'),
 ('mag-property-development','mag-property-development-tight.png'),
 ('kifata-properties-l-l-c','kifata-properties-l-l-c-tight.png')
)
update public.developers d
set logo_url = 'https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/developer-logos/white-v2/' || r.file,
    logo_url_processed = 'https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/developer-logos/white-v2/' || r.file,
    logo_status = 'approved',
    updated_at = now()
from restore r
where d.slug = r.slug_key;

update public.developers
set logo_url = 'https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/developer-logos/white-v2/manazil-global-property-development-l-l-c-2-tight.png',
    logo_url_processed = 'https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/developer-logos/white-v2/manazil-global-property-development-l-l-c-2-tight.png',
    logo_status = 'approved', updated_at = now()
where name ilike '%manazil%';

update public.developers
set logo_url = 'https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/developer-logos/white-v2/mered-tight.png',
    logo_url_processed = 'https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/developer-logos/white-v2/mered-tight.png',
    logo_status = 'approved', updated_at = now()
where name = 'MERED';

update public.developers
set logo_url = 'https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/developer-logos/white-v2/sobha-tight.png',
    logo_url_processed = 'https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/developer-logos/white-v2/sobha-tight.png',
    logo_status = 'approved', updated_at = now()
where name ilike '%sobha%';

update public.developers set logo_locked = true
where logo_url_processed like '%developer-logos/white-v2/%-tight.png';