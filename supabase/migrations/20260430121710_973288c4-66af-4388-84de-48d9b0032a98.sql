
-- 1. New columns on crm_developer_registry -------------------------------
ALTER TABLE public.crm_developer_registry
  ADD COLUMN IF NOT EXISTS office_address text,
  ADD COLUMN IF NOT EXISTS office_map_url text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS catalog_developer_id uuid;

-- 2. Backfill catalog reference + logo + office from public.developers -----
UPDATE public.crm_developer_registry r
SET
  catalog_developer_id = d.id,
  logo_url = COALESCE(r.logo_url, d.logo_url_processed, d.logo_url, d.logo_url_dark),
  website  = COALESCE(r.website, d.website_url),
  emirate  = COALESCE(r.emirate,
              CASE
                WHEN d.headquarters ILIKE '%abu dhabi%'      THEN 'Abu Dhabi'
                WHEN d.headquarters ILIKE '%sharjah%'        THEN 'Sharjah'
                WHEN d.headquarters ILIKE '%ajman%'          THEN 'Ajman'
                WHEN d.headquarters ILIKE '%umm al quwain%'  THEN 'Umm Al Quwain'
                WHEN d.headquarters ILIKE '%ras al khaimah%' THEN 'Ras Al Khaimah'
                WHEN d.headquarters ILIKE '%fujairah%'       THEN 'Fujairah'
                WHEN d.headquarters ILIKE '%dubai%'          THEN 'Dubai'
                ELSE NULL
              END),
  office_address = COALESCE(r.office_address, d.headquarters)
FROM public.developers d
WHERE coalesce(d.is_hidden,false) = false
  AND (
    lower(trim(d.name)) = lower(trim(r.developer_name))
    OR lower(d.slug)    = lower(r.developer_slug)
  );

-- 3. Generate Google Maps URL when we have an office address but no map URL
UPDATE public.crm_developer_registry
SET office_map_url = 'https://www.google.com/maps/search/?api=1&query=' ||
                     replace(replace(trim(office_address), ' ', '+'), ',', '%2C') ||
                     '+' || replace(developer_name, ' ', '+')
WHERE office_map_url IS NULL
  AND office_address IS NOT NULL
  AND length(trim(office_address)) > 3;

-- 4. Reset stuck pending_application developers back to not_started --------
-- (so the user's 24 already-emailed pending devs merge into the queue)
UPDATE public.crm_developer_registry
SET status = 'not_started',
    last_outreach_at = NULL,
    outreach_count = 0
WHERE status = 'pending_application';

-- 5. Deduplicate registry: keep the most complete row per normalized name --
-- Score: registered=100, has email=20, has phone=15, has office=15,
-- has website=10, has logo=10, has emirate=5, plus outreach_count.
WITH scored AS (
  SELECT
    id,
    owner_id,
    developer_name,
    lower(trim(developer_name)) AS norm_name,
    (CASE WHEN status='registered' THEN 100 ELSE 0 END) +
    (CASE WHEN developer_email IS NOT NULL THEN 20 ELSE 0 END) +
    (CASE WHEN phone IS NOT NULL THEN 15 ELSE 0 END) +
    (CASE WHEN office_address IS NOT NULL THEN 15 ELSE 0 END) +
    (CASE WHEN website IS NOT NULL THEN 10 ELSE 0 END) +
    (CASE WHEN logo_url IS NOT NULL THEN 10 ELSE 0 END) +
    (CASE WHEN emirate IS NOT NULL THEN 5 ELSE 0 END) +
    coalesce(outreach_count,0) AS score
  FROM public.crm_developer_registry
),
ranked AS (
  SELECT id, owner_id, norm_name, developer_name,
         row_number() OVER (PARTITION BY owner_id, norm_name ORDER BY score DESC, developer_name) AS rn
  FROM scored
),
keepers AS (
  SELECT owner_id, norm_name, id AS keeper_id
  FROM ranked WHERE rn = 1
),
losers AS (
  SELECT r.id AS loser_id, k.keeper_id
  FROM ranked r
  JOIN keepers k USING (owner_id, norm_name)
  WHERE r.rn > 1
)
UPDATE public.crm_developer_registry kp
SET
  developer_email = COALESCE(kp.developer_email, l.developer_email),
  phone           = COALESCE(kp.phone, l.phone),
  website         = COALESCE(kp.website, l.website),
  emirate         = COALESCE(kp.emirate, l.emirate),
  office_address  = COALESCE(kp.office_address, l.office_address),
  office_map_url  = COALESCE(kp.office_map_url, l.office_map_url),
  logo_url        = COALESCE(kp.logo_url, l.logo_url),
  agency_code     = COALESCE(kp.agency_code, l.agency_code),
  registration_url= COALESCE(kp.registration_url, l.registration_url),
  developer_contact = CASE
    WHEN kp.developer_contact IS NULL OR kp.developer_contact='{}'::jsonb
      THEN coalesce(l.developer_contact, kp.developer_contact)
    ELSE kp.developer_contact
  END,
  notes           = COALESCE(NULLIF(kp.notes,''), l.notes),
  field_sources   = COALESCE(kp.field_sources,'{}'::jsonb) || COALESCE(l.field_sources,'{}'::jsonb)
FROM losers ls
JOIN public.crm_developer_registry l ON l.id = ls.loser_id
WHERE kp.id = ls.keeper_id;

DELETE FROM public.crm_developer_registry r
USING (
  SELECT r2.id
  FROM public.crm_developer_registry r2
  JOIN (
    SELECT id, row_number() OVER (PARTITION BY owner_id, lower(trim(developer_name)) ORDER BY
      (CASE WHEN status='registered' THEN 100 ELSE 0 END) +
      (CASE WHEN developer_email IS NOT NULL THEN 20 ELSE 0 END) +
      (CASE WHEN phone IS NOT NULL THEN 15 ELSE 0 END) +
      (CASE WHEN office_address IS NOT NULL THEN 15 ELSE 0 END) +
      coalesce(outreach_count,0) DESC, developer_name
    ) AS rn
    FROM public.crm_developer_registry
  ) ranked2 ON ranked2.id = r2.id
  WHERE ranked2.rn > 1
) dups
WHERE r.id = dups.id;

-- 6. Brokerage columns and uniqueness --------------------------------------
ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS office_address text,
  ADD COLUMN IF NOT EXISTS office_map_url text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS logo_url text;

CREATE UNIQUE INDEX IF NOT EXISTS crm_brokerages_owner_norm_name_idx
  ON public.crm_brokerages (owner_id, lower(trim(company_name)));

-- 7. Seed brokerages for the existing owner (idempotent) -------------------
DO $$
DECLARE v_owner uuid;
BEGIN
  SELECT id INTO v_owner FROM auth.users WHERE lower(email)='janeaboujaoudenails@gmail.com' LIMIT 1;
  IF v_owner IS NULL THEN RETURN; END IF;

  INSERT INTO public.crm_brokerages (owner_id, company_name, status, emirate, office_location, office_address, office_map_url, phone, email, website)
  VALUES
    -- Dubai
    (v_owner, 'Allsopp & Allsopp', 'prospect', 'Dubai', 'Sheikh Zayed Road, Dubai', 'Allsopp & Allsopp, Sheikh Zayed Road, Dubai',
      'https://www.google.com/maps/search/?api=1&query=Allsopp+%26+Allsopp+Dubai', '+971 4 818 8888', 'info@allsoppandallsopp.com', 'https://www.allsoppandallsopp.com'),
    (v_owner, 'Better Homes', 'prospect', 'Dubai', 'Al Wasl, Dubai', 'Better Homes Head Office, Al Wasl Rd, Dubai',
      'https://www.google.com/maps/search/?api=1&query=Better+Homes+Dubai', '+971 600 522 233', 'info@bhomes.com', 'https://www.bhomes.com'),
    (v_owner, 'Espace Real Estate', 'prospect', 'Dubai', 'Umm Suqeim, Dubai', 'Espace Real Estate, Umm Suqeim, Dubai',
      'https://www.google.com/maps/search/?api=1&query=Espace+Real+Estate+Dubai', '+971 4 306 9999', 'info@espace.ae', 'https://www.espace.ae'),
    (v_owner, 'Haus & Haus', 'prospect', 'Dubai', 'Al Quoz, Dubai', 'Haus & Haus, Al Quoz, Dubai',
      'https://www.google.com/maps/search/?api=1&query=Haus+%26+Haus+Dubai', '+971 4 388 8500', 'info@hausandhaus.com', 'https://www.hausandhaus.com'),
    (v_owner, 'Driven Properties', 'prospect', 'Dubai', 'Business Bay, Dubai', 'Driven Properties, Business Bay, Dubai',
      'https://www.google.com/maps/search/?api=1&query=Driven+Properties+Dubai', '+971 4 437 8888', 'info@drivenproperties.com', 'https://www.drivenproperties.com'),
    (v_owner, 'fäm Properties', 'prospect', 'Dubai', 'Downtown Dubai', 'fäm Properties, Downtown Dubai',
      'https://www.google.com/maps/search/?api=1&query=fam+Properties+Dubai', '+971 800 326 326', 'info@famproperties.com', 'https://www.famproperties.com'),
    (v_owner, 'Provident Real Estate', 'prospect', 'Dubai', 'Business Bay, Dubai', 'Provident Real Estate, Business Bay, Dubai',
      'https://www.google.com/maps/search/?api=1&query=Provident+Real+Estate+Dubai', '+971 4 449 8888', 'info@providentestate.com', 'https://www.providentestate.com'),
    (v_owner, 'Metropolitan Premium Properties', 'prospect', 'Dubai', 'Sheikh Zayed Road, Dubai', 'Metropolitan Premium Properties, Sheikh Zayed Road, Dubai',
      'https://www.google.com/maps/search/?api=1&query=Metropolitan+Premium+Properties+Dubai', '+971 4 553 0000', 'info@metropolitan.realestate', 'https://www.metropolitan.realestate'),
    (v_owner, 'Engel & Völkers Dubai', 'prospect', 'Dubai', 'Jumeirah, Dubai', 'Engel & Völkers, Jumeirah, Dubai',
      'https://www.google.com/maps/search/?api=1&query=Engel+%26+V%C3%B6lkers+Dubai', '+971 4 422 7440', 'dubai@engelvoelkers.com', 'https://www.engelvoelkers.com/dubai'),
    (v_owner, 'Knight Frank UAE', 'prospect', 'Dubai', 'DIFC, Dubai', 'Knight Frank, DIFC, Dubai',
      'https://www.google.com/maps/search/?api=1&query=Knight+Frank+DIFC+Dubai', '+971 4 451 2300', 'info@me.knightfrank.com', 'https://www.knightfrank.ae'),
    (v_owner, 'Savills Middle East', 'prospect', 'Dubai', 'DIFC, Dubai', 'Savills Middle East, DIFC, Dubai',
      'https://www.google.com/maps/search/?api=1&query=Savills+DIFC+Dubai', '+971 4 365 7700', 'info@savills.com', 'https://www.savills.ae'),
    (v_owner, 'CBRE UAE', 'prospect', 'Dubai', 'DIFC, Dubai', 'CBRE, DIFC, Dubai',
      'https://www.google.com/maps/search/?api=1&query=CBRE+DIFC+Dubai', '+971 4 437 7200', 'info@cbre.ae', 'https://www.cbre.ae'),
    (v_owner, 'JLL MENA', 'prospect', 'Dubai', 'DIFC, Dubai', 'JLL MENA, DIFC, Dubai',
      'https://www.google.com/maps/search/?api=1&query=JLL+DIFC+Dubai', '+971 4 426 6999', 'info@me.jll.com', 'https://www.jll-mena.com'),
    (v_owner, 'Asteco', 'prospect', 'Dubai', 'Al Barsha, Dubai', 'Asteco Property Management, Al Barsha, Dubai',
      'https://www.google.com/maps/search/?api=1&query=Asteco+Al+Barsha+Dubai', '+971 4 403 7700', 'enquiries@asteco.com', 'https://www.asteco.com'),
    (v_owner, 'Coldwell Banker UAE', 'prospect', 'Dubai', 'Business Bay, Dubai', 'Coldwell Banker UAE, Business Bay, Dubai',
      'https://www.google.com/maps/search/?api=1&query=Coldwell+Banker+UAE+Dubai', '+971 4 453 9525', 'info@cbuae.ae', 'https://www.coldwellbanker.ae'),
    (v_owner, 'Luxhabitat Sotheby''s International Realty', 'prospect', 'Dubai', 'Al Wasl, Dubai', 'Luxhabitat Sotheby''s International Realty, Al Wasl, Dubai',
      'https://www.google.com/maps/search/?api=1&query=Luxhabitat+Sothebys+Dubai', '+971 4 425 4040', 'info@luxhabitat.ae', 'https://www.luxhabitat.ae'),
    (v_owner, 'D&B Properties', 'prospect', 'Dubai', 'Business Bay, Dubai', 'D&B Properties, Business Bay, Dubai',
      'https://www.google.com/maps/search/?api=1&query=D%26B+Properties+Dubai', '+971 4 295 9994', 'info@dandbproperties.com', 'https://www.dandbproperties.com'),
    (v_owner, 'AX Capital', 'prospect', 'Dubai', 'Business Bay, Dubai', 'AX Capital, Business Bay, Dubai',
      'https://www.google.com/maps/search/?api=1&query=AX+Capital+Dubai', '+971 4 591 9006', 'info@axcapital.ae', 'https://www.axcapital.ae'),
    (v_owner, 'White & Co Real Estate', 'prospect', 'Dubai', 'Business Bay, Dubai', 'White & Co Real Estate, Business Bay, Dubai',
      'https://www.google.com/maps/search/?api=1&query=White+%26+Co+Real+Estate+Dubai', '+971 4 255 8080', 'info@whiteandcorealestate.com', 'https://www.whiteandcorealestate.com'),
    (v_owner, 'McCone Properties', 'prospect', 'Dubai', 'Jumeirah Lake Towers, Dubai', 'McCone Properties, JLT, Dubai',
      'https://www.google.com/maps/search/?api=1&query=McCone+Properties+JLT+Dubai', '+971 4 451 8500', 'info@mcconeproperties.com', 'https://www.mcconeproperties.com'),
    (v_owner, 'BetterHomes (Off-Plan)', 'prospect', 'Dubai', 'Al Wasl, Dubai', 'Better Homes Off-Plan, Al Wasl, Dubai',
      'https://www.google.com/maps/search/?api=1&query=Better+Homes+Off-Plan+Dubai', '+971 600 522 233', 'offplan@bhomes.com', 'https://www.bhomes.com'),
    (v_owner, 'Banke International Properties', 'prospect', 'Dubai', 'Business Bay, Dubai', 'Banke International, Business Bay, Dubai',
      'https://www.google.com/maps/search/?api=1&query=Banke+International+Properties+Dubai', '+971 4 525 7700', 'info@banke.ae', 'https://www.banke.ae'),
    (v_owner, 'Dacha Real Estate', 'prospect', 'Dubai', 'Palm Jumeirah, Dubai', 'Dacha Real Estate, Palm Jumeirah, Dubai',
      'https://www.google.com/maps/search/?api=1&query=Dacha+Real+Estate+Palm+Jumeirah', '+971 4 423 2006', 'info@dacha.ae', 'https://www.dacha-re.com'),
    -- Abu Dhabi
    (v_owner, 'PSI Real Estate', 'prospect', 'Abu Dhabi', 'Khalifa Street, Abu Dhabi', 'PSI Real Estate, Khalifa Street, Abu Dhabi',
      'https://www.google.com/maps/search/?api=1&query=PSI+Real+Estate+Abu+Dhabi', '+971 2 642 7777', 'info@psinv.net', 'https://www.psinv.net'),
    (v_owner, 'Crompton Partners', 'prospect', 'Abu Dhabi', 'Corniche, Abu Dhabi', 'Crompton Partners, Corniche, Abu Dhabi',
      'https://www.google.com/maps/search/?api=1&query=Crompton+Partners+Abu+Dhabi', '+971 2 491 0500', 'info@cpestates.com', 'https://www.cpestates.com'),
    (v_owner, 'Better Homes Abu Dhabi', 'prospect', 'Abu Dhabi', 'Al Bateen, Abu Dhabi', 'Better Homes, Al Bateen, Abu Dhabi',
      'https://www.google.com/maps/search/?api=1&query=Better+Homes+Abu+Dhabi', '+971 600 522 233', 'abudhabi@bhomes.com', 'https://www.bhomes.com'),
    (v_owner, 'Cluttons Abu Dhabi', 'prospect', 'Abu Dhabi', 'Al Bateen, Abu Dhabi', 'Cluttons, Al Bateen, Abu Dhabi',
      'https://www.google.com/maps/search/?api=1&query=Cluttons+Abu+Dhabi', '+971 2 415 2700', 'enquiries@cluttons.ae', 'https://www.cluttons.com'),
    (v_owner, 'LLJ Property', 'prospect', 'Abu Dhabi', 'Al Reem Island, Abu Dhabi', 'LLJ Property, Al Reem Island, Abu Dhabi',
      'https://www.google.com/maps/search/?api=1&query=LLJ+Property+Abu+Dhabi', '+971 2 681 5557', 'info@lljproperty.com', 'https://www.lljproperty.com'),
    (v_owner, 'MetroProperties Abu Dhabi', 'prospect', 'Abu Dhabi', 'Khalidiya, Abu Dhabi', 'Metro Properties, Khalidiya, Abu Dhabi',
      'https://www.google.com/maps/search/?api=1&query=Metro+Properties+Abu+Dhabi', '+971 2 671 1117', 'info@metro.ae', 'https://www.metro.ae'),
    (v_owner, 'Asteco Abu Dhabi', 'prospect', 'Abu Dhabi', 'Al Khalidiya, Abu Dhabi', 'Asteco, Al Khalidiya, Abu Dhabi',
      'https://www.google.com/maps/search/?api=1&query=Asteco+Abu+Dhabi', '+971 2 626 2660', 'enquiries@asteco.com', 'https://www.asteco.com'),
    (v_owner, 'Knight Frank Abu Dhabi', 'prospect', 'Abu Dhabi', 'Al Maryah Island, Abu Dhabi', 'Knight Frank, Al Maryah Island, Abu Dhabi',
      'https://www.google.com/maps/search/?api=1&query=Knight+Frank+Abu+Dhabi', '+971 2 635 0150', 'abu.dhabi@me.knightfrank.com', 'https://www.knightfrank.ae'),
    -- Sharjah
    (v_owner, 'Sun & Sand Sharjah', 'prospect', 'Sharjah', 'Al Majaz, Sharjah', 'Sun & Sand Real Estate, Al Majaz, Sharjah',
      'https://www.google.com/maps/search/?api=1&query=Sun+%26+Sand+Real+Estate+Sharjah', '+971 6 572 9999', 'info@sunandsand.ae', 'https://www.sunandsand.ae'),
    (v_owner, 'Coldwell Banker Sharjah', 'prospect', 'Sharjah', 'Al Khan, Sharjah', 'Coldwell Banker, Al Khan, Sharjah',
      'https://www.google.com/maps/search/?api=1&query=Coldwell+Banker+Sharjah', '+971 6 522 2266', 'sharjah@cbuae.ae', 'https://www.coldwellbanker.ae'),
    (v_owner, 'Sharjah Real Estate Center', 'prospect', 'Sharjah', 'Al Qasimia, Sharjah', 'Sharjah Real Estate Center, Al Qasimia, Sharjah',
      'https://www.google.com/maps/search/?api=1&query=Sharjah+Real+Estate+Center', '+971 6 506 4000', 'info@srec.ae', 'https://www.srec.ae'),
    (v_owner, 'Tilal City Brokers', 'prospect', 'Sharjah', 'Tilal City, Sharjah', 'Tilal City Brokers, Tilal City, Sharjah',
      'https://www.google.com/maps/search/?api=1&query=Tilal+City+Sharjah', '+971 6 525 5111', 'info@tilalproperties.ae', 'https://www.tilalproperties.ae'),
    (v_owner, 'Aljada Brokers', 'prospect', 'Sharjah', 'Aljada, Sharjah', 'Aljada Brokers, Aljada, Sharjah',
      'https://www.google.com/maps/search/?api=1&query=Aljada+Sharjah', '+971 800 27232', 'info@arada.com', 'https://www.arada.com'),
    -- Ajman
    (v_owner, 'Ajman Real Estate Brokers', 'prospect', 'Ajman', 'Ajman Corniche', 'Ajman Real Estate Brokers, Corniche, Ajman',
      'https://www.google.com/maps/search/?api=1&query=Ajman+Real+Estate+Brokers', '+971 6 743 7777', 'info@ajmanrealestate.ae', 'https://www.ajmanrealestate.ae'),
    (v_owner, 'GJ Properties Ajman', 'prospect', 'Ajman', 'Al Nuaimia, Ajman', 'GJ Properties, Al Nuaimia, Ajman',
      'https://www.google.com/maps/search/?api=1&query=GJ+Properties+Ajman', '+971 6 705 6111', 'info@gjproperties.ae', 'https://www.gjproperties.ae'),
    (v_owner, 'City Properties Ajman', 'prospect', 'Ajman', 'Ajman City Center', 'City Properties, Ajman City Center, Ajman',
      'https://www.google.com/maps/search/?api=1&query=City+Properties+Ajman', '+971 6 743 4400', 'info@cityproperties.ae', 'https://www.cityproperties.ae'),
    -- Umm Al Quwain
    (v_owner, 'UAQ Real Estate', 'prospect', 'Umm Al Quwain', 'King Faisal Road, UAQ', 'UAQ Real Estate, King Faisal Road, Umm Al Quwain',
      'https://www.google.com/maps/search/?api=1&query=Umm+Al+Quwain+Real+Estate', '+971 6 765 5555', 'info@uaqrealestate.ae', 'https://www.uaqrealestate.ae'),
    (v_owner, 'Sobha Siniya Island Brokers', 'prospect', 'Umm Al Quwain', 'Siniya Island, UAQ', 'Sobha Siniya Island, UAQ',
      'https://www.google.com/maps/search/?api=1&query=Sobha+Siniya+Island+UAQ', '+971 800 999 999', 'channelpartners@sobharealty.com', 'https://www.sobharealty.com'),
    (v_owner, 'Emaar South UAQ', 'prospect', 'Umm Al Quwain', 'Umm Al Quwain Marina', 'Emaar South UAQ, Marina, Umm Al Quwain',
      'https://www.google.com/maps/search/?api=1&query=Emaar+UAQ', '+971 4 366 1688', 'brokers@emaar.ae', 'https://www.emaar.com'),
    -- Ras Al Khaimah
    (v_owner, 'RAK Properties Brokers', 'prospect', 'Ras Al Khaimah', 'Al Hamra Village, RAK', 'RAK Properties, Al Hamra Village, Ras Al Khaimah',
      'https://www.google.com/maps/search/?api=1&query=RAK+Properties+Al+Hamra', '+971 7 203 9999', 'info@rakproperties.net', 'https://www.rakproperties.net'),
    (v_owner, 'Al Hamra Real Estate', 'prospect', 'Ras Al Khaimah', 'Al Hamra Village, RAK', 'Al Hamra Real Estate, Al Hamra Village, RAK',
      'https://www.google.com/maps/search/?api=1&query=Al+Hamra+Real+Estate+RAK', '+971 7 244 7777', 'info@alhamra.ae', 'https://www.alhamra.ae'),
    (v_owner, 'Marjan Brokers', 'prospect', 'Ras Al Khaimah', 'Al Marjan Island, RAK', 'Marjan Brokers, Al Marjan Island, RAK',
      'https://www.google.com/maps/search/?api=1&query=Al+Marjan+Island+RAK', '+971 7 207 1666', 'info@almarjanisland.ae', 'https://www.almarjanisland.com'),
    -- Fujairah
    (v_owner, 'Fujairah Real Estate', 'prospect', 'Fujairah', 'Hamad Bin Abdullah Road, Fujairah', 'Fujairah Real Estate, Hamad Bin Abdullah Road, Fujairah',
      'https://www.google.com/maps/search/?api=1&query=Fujairah+Real+Estate', '+971 9 222 7777', 'info@fujairahrealestate.ae', 'https://www.fujairahrealestate.ae'),
    (v_owner, 'Coastal Brokers Fujairah', 'prospect', 'Fujairah', 'Corniche Road, Fujairah', 'Coastal Brokers, Corniche Road, Fujairah',
      'https://www.google.com/maps/search/?api=1&query=Fujairah+Brokers', '+971 9 223 4567', 'info@coastalfujairah.ae', NULL)
  ON CONFLICT DO NOTHING;
END $$;

-- 8. Helpful indexes -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_crm_dev_registry_emirate ON public.crm_developer_registry (owner_id, emirate);
CREATE INDEX IF NOT EXISTS idx_crm_brokerages_emirate ON public.crm_brokerages (owner_id, emirate);
