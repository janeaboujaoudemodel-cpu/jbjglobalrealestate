
ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS entry_source text NOT NULL DEFAULT 'owner',
  ADD COLUMN IF NOT EXISTS is_existing_match boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS match_directory_id uuid;

ALTER TABLE public.crm_brokerages
  DROP CONSTRAINT IF EXISTS crm_brokerages_entry_source_check;
ALTER TABLE public.crm_brokerages
  ADD CONSTRAINT crm_brokerages_entry_source_check CHECK (entry_source IN ('owner','directory'));

CREATE INDEX IF NOT EXISTS idx_crm_brokerages_entry_source ON public.crm_brokerages(entry_source);
CREATE INDEX IF NOT EXISTS idx_crm_brokerages_emirate ON public.crm_brokerages(emirate);
CREATE INDEX IF NOT EXISTS idx_crm_brokerages_company_norm
  ON public.crm_brokerages(lower(regexp_replace(company_name, '[^a-zA-Z0-9]+', '', 'g')));

UPDATE public.crm_brokerages
SET entry_source = 'directory'
WHERE entry_source = 'owner'
  AND created_at < now() - interval '5 minutes';

CREATE OR REPLACE FUNCTION public.crm_brokerage_detect_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized text;
  v_match_id uuid;
BEGIN
  IF NEW.entry_source = 'owner' THEN
    v_normalized := lower(regexp_replace(coalesce(NEW.company_name,''), '[^a-zA-Z0-9]+', '', 'g'));
    IF length(v_normalized) > 2 THEN
      SELECT id INTO v_match_id
      FROM public.crm_brokerages
      WHERE entry_source = 'directory'
        AND lower(regexp_replace(company_name, '[^a-zA-Z0-9]+', '', 'g')) = v_normalized
        AND id <> NEW.id
      LIMIT 1;

      IF v_match_id IS NOT NULL THEN
        NEW.is_existing_match := true;
        NEW.match_directory_id := v_match_id;
        UPDATE public.crm_brokerages
          SET is_existing_match = true
          WHERE id = v_match_id;
      ELSE
        NEW.is_existing_match := false;
        NEW.match_directory_id := NULL;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_brokerage_detect_match ON public.crm_brokerages;
CREATE TRIGGER trg_crm_brokerage_detect_match
BEFORE INSERT OR UPDATE OF company_name, entry_source ON public.crm_brokerages
FOR EACH ROW EXECUTE FUNCTION public.crm_brokerage_detect_match();

DO $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT owner_id INTO v_owner FROM public.crm_brokerages WHERE entry_source='directory' LIMIT 1;
  IF v_owner IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.crm_brokerages (owner_id, company_name, emirate, office_location, status, entry_source, primary_contact)
  SELECT v_owner, c.name, c.emirate, c.office, 'prospect'::crm_brokerage_status, 'directory', '{}'::jsonb
  FROM (VALUES
    ('Allsopp & Allsopp','Dubai','Sheikh Zayed Road, Dubai'),
    ('Betterhomes','Dubai','Business Bay, Dubai'),
    ('Espace Real Estate','Dubai','Umm Suqeim, Dubai'),
    ('Driven Properties','Dubai','Business Bay, Dubai'),
    ('Haus & Haus','Dubai','Al Quoz, Dubai'),
    ('Luxhabitat Sotheby''s','Dubai','Al Wasl Road, Dubai'),
    ('Metropolitan Premium Properties','Dubai','Downtown Dubai'),
    ('Provident Real Estate','Dubai','JLT, Dubai'),
    ('Fam Properties','Dubai','Business Bay, Dubai'),
    ('Engel & Völkers Dubai','Dubai','City Walk, Dubai'),
    ('Christie''s International Real Estate Dubai','Dubai','DIFC, Dubai'),
    ('Knight Frank UAE','Dubai','Emaar Square, Dubai'),
    ('Savills Dubai','Dubai','Boulevard Plaza, Dubai'),
    ('CBRE Dubai','Dubai','Emaar Square, Dubai'),
    ('JLL Dubai','Dubai','Emaar Square, Dubai'),
    ('Chestertons MENA','Dubai','Bay Square, Dubai'),
    ('White & Co Real Estate','Dubai','Marina Plaza, Dubai'),
    ('Memaar Properties','Dubai','Business Bay, Dubai'),
    ('Coldwell Banker UAE','Dubai','Sheikh Zayed Road, Dubai'),
    ('Dacha Real Estate','Dubai','Palm Jumeirah, Dubai'),
    ('Edwards & Towers','Dubai','Palm Jumeirah, Dubai'),
    ('Asteco','Dubai','Sheikh Zayed Road, Dubai'),
    ('Cluttons','Dubai','DIFC, Dubai'),
    ('AX Capital','Dubai','Business Bay, Dubai'),
    ('Aldar Estates','Abu Dhabi','Yas Island, Abu Dhabi'),
    ('LLJ Property','Abu Dhabi','Khalifa Park, Abu Dhabi'),
    ('Crompton Partners','Abu Dhabi','Mariah Mall District, Abu Dhabi'),
    ('Pinnacle Real Estate','Abu Dhabi','Al Reem Island, Abu Dhabi'),
    ('Crown Realty','Abu Dhabi','Corniche, Abu Dhabi'),
    ('PSI Property Shop Investment','Abu Dhabi','Sky Tower, Al Reem Island'),
    ('Gulf Sotheby''s International Realty','Abu Dhabi','Corniche Road, Abu Dhabi'),
    ('Sharjah Properties','Sharjah','Al Majaz, Sharjah'),
    ('Lootah Real Estate','Sharjah','Al Khan, Sharjah'),
    ('Tilal Properties','Sharjah','Tilal City, Sharjah'),
    ('Al Hanoo Real Estate','Sharjah','Buhairah Corniche, Sharjah'),
    ('Ajman Real Estate','Ajman','Sheikh Khalifa Street, Ajman'),
    ('GJ Properties','Ajman','Al Nuaimiyah, Ajman'),
    ('Aqaar Ajman','Ajman','Corniche Ajman'),
    ('Al Hamra Real Estate','Ras Al Khaimah','Al Hamra Village, RAK'),
    ('RAK Properties','Ras Al Khaimah','Mina Al Arab, RAK'),
    ('Marjan LLC','Ras Al Khaimah','Al Marjan Island, RAK'),
    ('Fujairah Real Estate','Fujairah','Hamad Bin Abdullah Road, Fujairah'),
    ('Eagle Hills Fujairah','Fujairah','Sheikh Zayed Road, Fujairah'),
    ('UAQ Real Estate','Umm Al Quwain','King Faisal Street, UAQ'),
    ('Emirates Modern Real Estate','Umm Al Quwain','Al Aahad Road, UAQ')
  ) AS c(name, emirate, office)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.crm_brokerages b
    WHERE lower(regexp_replace(b.company_name, '[^a-zA-Z0-9]+', '', 'g')) =
          lower(regexp_replace(c.name, '[^a-zA-Z0-9]+', '', 'g'))
  );
END $$;
