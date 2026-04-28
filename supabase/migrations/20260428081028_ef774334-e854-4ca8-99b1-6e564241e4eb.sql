
-- Add outreach columns
ALTER TABLE public.crm_developer_registry
  ADD COLUMN IF NOT EXISTS developer_email text,
  ADD COLUMN IF NOT EXISTS registration_url text,
  ADD COLUMN IF NOT EXISTS last_outreach_at timestamptz,
  ADD COLUMN IF NOT EXISTS outreach_count integer NOT NULL DEFAULT 0;

-- Owner settings table
CREATE TABLE IF NOT EXISTS public.crm_owner_settings (
  owner_id uuid PRIMARY KEY,
  drive_doc_pack_url text,
  signature_html text,
  cc_jane_enabled boolean NOT NULL DEFAULT true,
  cc_email text NOT NULL DEFAULT 'info.jane@thegmail.com',
  reply_to_email text NOT NULL DEFAULT 'contact@jbj.ae',
  from_name text NOT NULL DEFAULT 'JBJ Global Real Estate',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_owner_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_owner_settings" ON public.crm_owner_settings;
CREATE POLICY "admin_all_owner_settings" ON public.crm_owner_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_crm_owner_settings_upd ON public.crm_owner_settings;
CREATE TRIGGER trg_crm_owner_settings_upd BEFORE UPDATE ON public.crm_owner_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Replace seed function with full UAE developer list + emails
CREATE OR REPLACE FUNCTION public.seed_crm_developer_registry(p_owner_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dev record;
  v_slug text;
BEGIN
  FOR v_dev IN
    SELECT * FROM (VALUES
      ('Emaar Properties', 'brokers@emaar.ae'),
      ('DAMAC Properties', 'brokers@damacproperties.com'),
      ('Nakheel', 'brokers@nakheel.com'),
      ('Sobha Realty', 'channelpartners@sobharealty.com'),
      ('Aldar Properties', 'brokers@aldar.com'),
      ('Meraas', 'brokers@meraas.ae'),
      ('Dubai Properties', 'brokers@dp.ae'),
      ('Select Group', 'brokers@select-group.ae'),
      ('Ellington Properties', 'brokers@ellingtonproperties.ae'),
      ('Danube Properties', 'channelpartners@danubeproperties.ae'),
      ('Azizi Developments', 'channelpartners@azizidevelopments.com'),
      ('Binghatti Developers', 'brokers@binghatti.com'),
      ('MAG Property Development', 'brokers@mag.ae'),
      ('Deyaar Development', 'brokers@deyaar.ae'),
      ('Omniyat', 'brokers@omniyat.com'),
      ('Tiger Properties', 'brokers@tigerproperties.com'),
      ('Samana Developers', 'brokers@samanadevelopers.com'),
      ('Object 1', 'brokers@object1.ae'),
      ('Reportage Properties', 'brokers@reportage.ae'),
      ('Imtiaz Developments', 'brokers@imtiaz.ae'),
      ('Arada', 'brokers@arada.com'),
      ('Bloom Holding', 'brokers@bloomholding.com'),
      ('Eagle Hills', 'brokers@eaglehills.com'),
      ('Iman Developers', 'brokers@imandevelopers.com'),
      ('Mira Developments', 'brokers@miradevelopments.com'),
      ('Beyond by Omniyat', 'brokers@omniyat.com'),
      ('Imkan Properties', 'brokers@imkan.ae'),
      ('Wasl Properties', 'brokers@wasl.ae'),
      ('Meydan Group', 'brokers@meydan.ae'),
      ('Dubai South', 'brokers@dubaisouth.ae'),
      ('Diamondz by Danube', 'channelpartners@danubeproperties.ae'),
      ('ORO24 Developments', 'brokers@oro24.com'),
      ('Sankari Properties', 'brokers@sankari.ae'),
      ('Five Holdings', 'brokers@fivehotelsandresorts.com'),
      ('Sweid & Sweid', 'brokers@sweidsweid.com'),
      ('Almazaya Holding', 'brokers@almazaya.ae'),
      ('Wellington Developments', 'brokers@wellington.ae'),
      ('Q Properties', 'brokers@qproperties.ae'),
      ('Reef Luxury Developments', 'brokers@reefdevelopments.com'),
      ('Vincitore Real Estate', 'brokers@vincitorerealestate.com'),
      ('Symbolic Holdings', 'brokers@symbolic.ae'),
      ('AYS Developers', 'brokers@aysdevelopers.com'),
      ('Tilal Al Ghaf (Majid Al Futtaim)', 'brokers@majidalfuttaim.com'),
      ('GFH Properties', 'brokers@gfh.com'),
      ('Lootah Real Estate', 'brokers@lootahre.ae'),
      ('Esnaad', 'brokers@esnaad.ae'),
      ('AHS Properties', 'brokers@ahsproperties.com'),
      ('AG Properties', 'brokers@agproperties.ae'),
      ('Modon Properties', 'brokers@modon.ae'),
      ('Palma Holding', 'brokers@palmaholding.com'),
      ('Liv Real Estate', 'brokers@livrealestate.ae'),
      ('Prestige One Developments', 'brokers@prestigeone.ae'),
      ('Pantheon Development', 'brokers@pantheondevelopment.ae'),
      ('Time Properties', 'brokers@timeproperties.ae'),
      ('Range Developments', 'brokers@rangedevelopments.com'),
      ('Skai Holdings', 'brokers@skaiholdings.com'),
      ('Mira Real Estate', 'brokers@miragroup.ae'),
      ('Refine Development', 'brokers@refinedev.com'),
      ('Crown Developments', 'brokers@crowndevelopments.ae'),
      ('East & West International', 'brokers@eastandwestinternational.com'),
      ('Damasak Properties', 'brokers@damasakproperties.com'),
      ('One Development', 'brokers@onedevelopment.ae'),
      ('Mered', 'brokers@mered.ae'),
      ('London Gate', 'brokers@londongate.ae'),
      ('Pure Gold Real Estate', 'brokers@puregoldrealestate.ae'),
      ('Rijas Aces Properties', 'brokers@rijasaces.com'),
      ('Roya Lifestyle Developments', 'brokers@roya.ae'),
      ('Burtville Developments', 'brokers@burtville.com'),
      ('Sol Properties', 'brokers@solproperties.ae'),
      ('ANAX Developments', 'brokers@anax.ae'),
      ('Octa Properties', 'brokers@octaproperties.com'),
      ('Peace Homes Development', 'brokers@peacehomesgroup.com'),
      ('Riviera Group', 'brokers@rivieragroup.ae'),
      ('Skyline Builders', 'brokers@skyline.ae'),
      ('Acube Developments', 'brokers@acubedevelopments.com'),
      ('Iraz Developments', 'brokers@iraz.ae'),
      ('Condor Developers', 'brokers@condordevelopers.com'),
      ('Citi Developers', 'brokers@citidevelopers.com'),
      ('Karma Developers', 'brokers@karmadevelopers.com'),
      ('Green Group', 'brokers@greengroup.ae'),
      ('Devmark', 'brokers@devmark.ae'),
      ('Aark Developers', 'brokers@aarkdevelopers.com'),
      ('Algouta Properties', 'brokers@algouta.com'),
      ('AMIS Development', 'brokers@amisdevelopment.com'),
      ('AAA Development', 'brokers@aaadevelopment.ae'),
      ('Al Habtoor Group', 'brokers@alhabtoor.com'),
      ('Bin Ghatti Holdings', 'brokers@binghatti.com'),
      ('Confident Group', 'brokers@confident-group.com'),
      ('Durar Group', 'brokers@durargroup.ae'),
      ('Esnad Management', 'brokers@esnadmanagement.com'),
      ('Forum Real Estate Development', 'brokers@forumrealestate.ae'),
      ('Helio Real Estate', 'brokers@helio.ae'),
      ('Gulf Land Property Developers', 'brokers@glpd.ae')
    ) AS t(name, email)
  LOOP
    v_slug := lower(regexp_replace(regexp_replace(v_dev.name, '[^a-zA-Z0-9 -]', '', 'g'), '\s+', '-', 'g'));

    INSERT INTO public.crm_developer_registry
      (owner_id, developer_name, developer_slug, status, developer_email, uae_developer_id)
    VALUES
      (p_owner_id, v_dev.name, v_slug, 'not_started', v_dev.email,
       (SELECT id FROM public.uae_developers WHERE lower(name) = lower(v_dev.name) LIMIT 1))
    ON CONFLICT (owner_id, developer_slug)
    DO UPDATE SET
      developer_email = COALESCE(public.crm_developer_registry.developer_email, EXCLUDED.developer_email);
  END LOOP;

  RETURN (SELECT count(*)::integer FROM public.crm_developer_registry WHERE owner_id = p_owner_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_crm_developer_registry(uuid) TO authenticated;
