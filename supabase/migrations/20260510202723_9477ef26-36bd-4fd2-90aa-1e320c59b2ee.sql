
-- Signatures preset table (new name to avoid collision with existing email_signatures)
CREATE TABLE IF NOT EXISTS public.email_signature_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role_label text,
  name_line text,
  title_line text,
  company_line text DEFAULT 'JBJ GLOBAL REAL ESTATE',
  address_line text,
  phone text,
  email text,
  website text DEFAULT 'https://www.jbj.ae',
  logo_url text,
  socials jsonb DEFAULT '{}'::jsonb,
  html text,
  is_system boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_signature_presets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "esp_select" ON public.email_signature_presets;
CREATE POLICY "esp_select" ON public.email_signature_presets FOR SELECT TO authenticated
  USING (is_system = true OR owner_user_id = auth.uid());
DROP POLICY IF EXISTS "esp_insert" ON public.email_signature_presets;
CREATE POLICY "esp_insert" ON public.email_signature_presets FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid() AND is_system = false);
DROP POLICY IF EXISTS "esp_update" ON public.email_signature_presets;
CREATE POLICY "esp_update" ON public.email_signature_presets FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
DROP POLICY IF EXISTS "esp_delete" ON public.email_signature_presets;
CREATE POLICY "esp_delete" ON public.email_signature_presets FOR DELETE TO authenticated
  USING (owner_user_id = auth.uid());

-- Templates library
CREATE TABLE IF NOT EXISTS public.email_template_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  audience text NOT NULL DEFAULT 'any',
  subject text NOT NULL,
  body_text text NOT NULL,
  body_html text,
  language text NOT NULL DEFAULT 'en',
  variables jsonb DEFAULT '[]'::jsonb,
  signature_preset_id uuid REFERENCES public.email_signature_presets(id) ON DELETE SET NULL,
  is_system boolean NOT NULL DEFAULT false,
  is_default_for_audience boolean NOT NULL DEFAULT false,
  tags text[] DEFAULT ARRAY[]::text[],
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, slug)
);

CREATE UNIQUE INDEX IF NOT EXISTS etl_system_slug_idx ON public.email_template_library (slug) WHERE is_system = true;
CREATE INDEX IF NOT EXISTS etl_category_idx ON public.email_template_library(category);
CREATE INDEX IF NOT EXISTS etl_audience_idx ON public.email_template_library(audience);

ALTER TABLE public.email_template_library ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "etl_select" ON public.email_template_library;
CREATE POLICY "etl_select" ON public.email_template_library FOR SELECT TO authenticated
  USING (is_system = true OR owner_user_id = auth.uid());
DROP POLICY IF EXISTS "etl_insert" ON public.email_template_library;
CREATE POLICY "etl_insert" ON public.email_template_library FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid() AND is_system = false);
DROP POLICY IF EXISTS "etl_update" ON public.email_template_library;
CREATE POLICY "etl_update" ON public.email_template_library FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
DROP POLICY IF EXISTS "etl_delete" ON public.email_template_library;
CREATE POLICY "etl_delete" ON public.email_template_library FOR DELETE TO authenticated
  USING (owner_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS etl_touch ON public.email_template_library;
CREATE TRIGGER etl_touch BEFORE UPDATE ON public.email_template_library
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS esp_touch ON public.email_signature_presets;
CREATE TRIGGER esp_touch BEFORE UPDATE ON public.email_signature_presets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed system signature presets
INSERT INTO public.email_signature_presets (name, role_label, name_line, title_line, company_line, address_line, phone, email, website, socials, is_system, is_default)
SELECT * FROM (VALUES
  ('Founder / CEO', 'Founder & CEO', 'Jane Bou Jaoude', 'Founder & CEO', 'JBJ GLOBAL REAL ESTATE',
   'Citi Developers Sales & Experience Center, Dubai, UAE', '+971 50 000 0000', 'jane@jbj.ae', 'https://www.jbj.ae',
   jsonb_build_object('linkedin','https://www.linkedin.com/company/jbjglobalrealestate','instagram','https://instagram.com/jbjglobalrealestate'),
   true, true),
  ('JBJ Executive Office', 'Executive Office', 'Executive Office', 'Office of the Founder', 'JBJ GLOBAL REAL ESTATE',
   'Citi Developers Sales & Experience Center, Dubai, UAE', '+971 4 000 0000', 'office@jbj.ae', 'https://www.jbj.ae',
   '{}'::jsonb, true, false),
  ('JBJ HR / Recruitment', 'Human Resources', 'JBJ HR Team', 'Human Resources & Talent', 'JBJ GLOBAL REAL ESTATE',
   'Citi Developers Sales & Experience Center, Dubai, UAE', '+971 4 000 0001', 'careers@jbj.ae', 'https://www.jbj.ae/careers',
   '{}'::jsonb, true, false),
  ('JBJ Front Desk / Help Desk / Support', 'Client Services', 'Client Services', 'Front Desk · Help Desk · Support', 'JBJ GLOBAL REAL ESTATE',
   'Citi Developers Sales & Experience Center, Dubai, UAE', '+971 4 000 0002', 'support@jbj.ae', 'https://www.jbj.ae/support',
   '{}'::jsonb, true, false)
) AS t(name, role_label, name_line, title_line, company_line, address_line, phone, email, website, socials, is_system, is_default)
WHERE NOT EXISTS (SELECT 1 FROM public.email_signature_presets WHERE is_system = true AND email_signature_presets.name = t.name);

-- Seed system templates
INSERT INTO public.email_template_library (slug, name, category, audience, subject, body_text, language, is_system, variables)
SELECT slug, name, category, audience, subject, body_text, 'en', true, variables FROM (VALUES
  ('seller-interest-pitch','Seller — interested buyer pitch','sales_leasing','client',
   'Interested buyer for your {{property_title}}',
   E'Dear {{first_name}},\n\nI hope this note finds you well.\n\nWe currently have a qualified buyer actively looking in {{location}} and your property at {{property_title}} ({{bedrooms}} BR · {{area}}) matches their brief closely. They are pre-qualified up to {{price}}.\n\nIf you would like to explore moving forward, the simplest next step is a short call so I can share their profile and walk you through how we typically handle the listing, valuation, marketing and closing.\n\nIf you are in Dubai this week, I can also meet you in person at our Citi Developers Sales & Experience Center.\n\n{{book_meeting_url}}\n\nWarm regards,\n{{sender_signature}}',
   '["first_name","property_title","location","bedrooms","area","price","book_meeting_url","sender_signature"]'::jsonb),
  ('buyer-offer-introduction','Buyer — offer introduction','sales_leasing','investor',
   'A discreet opportunity in {{location}}',
   E'Dear {{first_name}},\n\nA quiet opportunity has just come to us in {{location}} — {{property_title}}, {{bedrooms}} BR, {{area}}, asking {{price}}.\n\nIt is being shown only to a small group of our investors before going to market. If it is of interest, I will share the full file (floor plan, recent comparables, projected yield).\n\nWould you like the file?\n\n{{sender_signature}}',
   '["first_name","property_title","location","bedrooms","area","price","sender_signature"]'::jsonb),
  ('leasing-offer-to-tenant','Leasing — offer to tenant','sales_leasing','client',
   'Leasing offer — {{property_title}}',
   E'Dear {{first_name}},\n\nThank you for your interest in {{property_title}} ({{location}}).\n\nThe landlord has confirmed the following terms:\n• Annual rent: {{price}}\n• Payments: 1–4 cheques (negotiable)\n• Furnishing: as discussed during the viewing\n• Move-in date: as per mutual convenience\n\nIf the terms work for you, I will draft the tenancy contract for e-signature today.\n\n{{sender_signature}}',
   '["first_name","property_title","location","price","sender_signature"]'::jsonb),
  ('leasing-contract-for-signature','Leasing — contract for signature','sales_leasing','client',
   'Your tenancy contract — ready for signature',
   E'Dear {{first_name}},\n\nLinked in this email is your tenancy contract for {{property_title}}.\n\nPlease review and sign electronically when convenient — the document is legally binding only upon both signatures.\n\nIf you have any question on a clause, just reply to this email and I will walk you through it.\n\n{{sender_signature}}',
   '["first_name","property_title","sender_signature"]'::jsonb),
  ('signed-contract-thank-you','Signed contract — thank you','sales_leasing','client',
   'Thank you for signing — welcome to JBJ',
   E'Dear {{first_name}},\n\nThank you for trusting JBJ GLOBAL REAL ESTATE. Your signed contract is now on file and a copy is on its way to you.\n\nYour dedicated executive assistant will be in touch within 24 hours with next steps. If anything urgent comes up before then, simply reply to this email.\n\nWarm regards,\n{{sender_signature}}',
   '["first_name","sender_signature"]'::jsonb),
  ('viewing-confirmation','Viewing confirmation','sales_leasing','client',
   'Confirmed — your viewing of {{property_title}}',
   E'Dear {{first_name}},\n\nYour viewing of {{property_title}} ({{location}}) is confirmed.\n\nA member of the team will meet you on-site 5 minutes before the scheduled time. If you need to reschedule, you can do so directly here: {{book_meeting_url}}.\n\nLooking forward to seeing you.\n\n{{sender_signature}}',
   '["first_name","property_title","location","book_meeting_url","sender_signature"]'::jsonb),
  ('post-viewing-followup','Post-viewing follow-up','sales_leasing','client',
   'How did you find {{property_title}}?',
   E'Dear {{first_name}},\n\nThank you for taking the time to see {{property_title}} today.\n\nTwo quick questions while it is fresh:\n1. What did you like most?\n2. What, if anything, gave you hesitation?\n\nBased on your answer I can either move forward with an offer, propose a second viewing, or share two alternatives I think you will prefer.\n\n{{sender_signature}}',
   '["first_name","property_title","sender_signature"]'::jsonb),
  ('birthday-client','Birthday — client','birthday_lifecycle','client',
   'Happy birthday, {{first_name}}',
   E'Dear {{first_name}},\n\nWishing you a wonderful birthday and a year filled with joy, health and meaningful milestones.\n\nIt is a privilege to have you in the JBJ family.\n\nWith warm regards,\n{{sender_signature}}',
   '["first_name","sender_signature"]'::jsonb),
  ('birthday-investor','Birthday — investor','birthday_lifecycle','investor',
   'Happy birthday, {{first_name}}',
   E'Dear {{first_name}},\n\nOn behalf of the entire JBJ team, wishing you a very happy birthday. Thank you for the trust you place in us — it is a partnership we value deeply.\n\nMay the year ahead bring strong returns, good health and time with the people you love.\n\nWith warm regards,\n{{sender_signature}}',
   '["first_name","sender_signature"]'::jsonb),
  ('birthday-vip','Birthday — VIP','birthday_lifecycle','vip',
   'A very happy birthday, {{first_name}}',
   E'Dear {{first_name}},\n\nA personal note from our entire team — happy birthday. We are honoured to count you among our most valued clients.\n\nIf you are in Dubai, the doors of our Experience Center are always open for a quiet coffee.\n\nWith warmest regards,\n{{sender_signature}}',
   '["first_name","sender_signature"]'::jsonb),
  ('birthday-broker','Birthday — broker','birthday_lifecycle','broker',
   'Happy birthday, {{first_name}}',
   E'Hi {{first_name}},\n\nWishing you a fantastic birthday and a record-breaking year of deals ahead. Thank you for the deals we have closed together and the ones we are about to.\n\nIf there is anything I can do to support you this quarter, just reply to this note.\n\nBest,\n{{sender_signature}}',
   '["first_name","sender_signature"]'::jsonb),
  ('birthday-developer-rep','Birthday — developer representative','birthday_lifecycle','developer_rep',
   'Happy birthday, {{first_name}}',
   E'Dear {{first_name}},\n\nWishing you a very happy birthday from the entire JBJ team. We deeply value our partnership with you and look forward to another year of bringing exceptional projects to discerning buyers together.\n\nWith warm regards,\n{{sender_signature}}',
   '["first_name","sender_signature"]'::jsonb),
  ('work-anniversary','Work anniversary','birthday_lifecycle','any',
   'Congratulations on your milestone, {{first_name}}',
   E'Dear {{first_name}},\n\nA quick note to acknowledge your work anniversary. Milestones are easy to overlook in a busy schedule — but they are worth pausing for.\n\nThank you for being part of our story.\n\n{{sender_signature}}',
   '["first_name","sender_signature"]'::jsonb),
  ('eid-greeting','Eid greeting','birthday_lifecycle','any',
   'Eid Mubarak from JBJ',
   E'Dear {{first_name}},\n\nOn behalf of everyone at JBJ GLOBAL REAL ESTATE, Eid Mubarak. May this Eid bring you and your loved ones peace, joy and prosperity.\n\nWith warm regards,\n{{sender_signature}}',
   '["first_name","sender_signature"]'::jsonb),
  ('new-year-greeting','New Year greeting','birthday_lifecycle','any',
   'Wishing you a brilliant new year',
   E'Dear {{first_name}},\n\nAs the year closes, a warm thank you for trusting us with your time and your real-estate journey.\n\nMay the new year bring you the right opportunities, the right partners and the right home.\n\n{{sender_signature}}',
   '["first_name","sender_signature"]'::jsonb),
  ('newsletter-welcome','Newsletter — welcome','onboarding','newsletter_subscriber',
   'Welcome to the JBJ ecosystem',
   E'Dear {{first_name}},\n\nThank you for joining the JBJ ecosystem.\n\nA few times a month we will share carefully curated opportunities, market intelligence on Dubai real estate, and access to private events. No spam — only what we would personally want to receive.\n\nIf at any point you wish to step back, an unsubscribe link is at the bottom of every email.\n\nWith warm regards,\n{{sender_signature}}',
   '["first_name","sender_signature"]'::jsonb),
  ('ecosystem-welcome-client','Welcome — new client','onboarding','client',
   'Welcome to JBJ — your dedicated team is on standby',
   E'Dear {{first_name}},\n\nWelcome to JBJ GLOBAL REAL ESTATE.\n\nYou now have a dedicated executive assistant who is reading your brief and preparing a private selection of properties that match your criteria. You will hear from us within 24 hours with a first shortlist.\n\nIn the meantime, feel free to book a 1-on-1 call here: {{book_meeting_url}}.\n\nWith warm regards,\n{{sender_signature}}',
   '["first_name","book_meeting_url","sender_signature"]'::jsonb),
  ('broker-onboarding-welcome','Welcome — broker','onboarding','broker',
   'Welcome aboard, {{first_name}} — your JBJ broker access',
   E'Hi {{first_name}},\n\nWelcome to the JBJ broker network. Your account is being set up and you will receive your access details in the next email.\n\nWhat to expect:\n• Co-broke opportunities pushed directly to your inbox\n• Access to our locked inventory and developer co-broke commissions\n• A dedicated relationship manager you can reach anytime\n\nLooking forward to closing many deals together.\n\n{{sender_signature}}',
   '["first_name","sender_signature"]'::jsonb),
  ('developer-rep-onboarding','Welcome — developer representative','onboarding','developer_rep',
   'Welcome — JBJ partnership',
   E'Dear {{first_name}},\n\nThank you for connecting with JBJ GLOBAL REAL ESTATE.\n\nWe are excited to begin our partnership and to bring your projects in front of our network of qualified, vetted buyers and investors.\n\nA short kickoff call will help us align on inventory, commercial terms and marketing materials — feel free to book a slot here: {{book_meeting_url}}.\n\nWith warm regards,\n{{sender_signature}}',
   '["first_name","book_meeting_url","sender_signature"]'::jsonb),
  ('investor-welcome-vip','Welcome — VIP investor','onboarding','vip',
   'A personal welcome, {{first_name}}',
   E'Dear {{first_name}},\n\nA personal welcome from our team. As a VIP client, you have a direct line to the founder''s office and priority on every off-market opportunity we curate.\n\nYour first private inventory selection will reach you within 48 hours.\n\nWith warm regards,\n{{sender_signature}}',
   '["first_name","sender_signature"]'::jsonb),
  ('meeting-confirmation','Meeting confirmation','operations','any',
   'Your meeting is confirmed',
   E'Dear {{first_name}},\n\nYour meeting is confirmed. The full details:\n\n• Location: {{office_address}}\n• Calendar: {{calendar_link}}\n\nIf anything changes, you can reschedule directly here: {{book_meeting_url}}.\n\nLooking forward to seeing you.\n\n{{sender_signature}}',
   '["first_name","office_address","calendar_link","book_meeting_url","sender_signature"]'::jsonb),
  ('document-for-signature','Document for signature','operations','any',
   'A document is awaiting your signature',
   E'Dear {{first_name}},\n\nA document is awaiting your electronic signature. Please review when you have a quiet moment — the link in this email opens a secure signing room.\n\nIf any clause needs clarification, simply reply to this email.\n\n{{sender_signature}}',
   '["first_name","sender_signature"]'::jsonb),
  ('payment-reminder','Payment reminder (gentle)','operations','any',
   'A gentle reminder',
   E'Dear {{first_name}},\n\nA gentle reminder that a payment on your file is due. If it has already been processed, please ignore this note — we will reconcile shortly.\n\nIf you would like to confirm details or arrange an alternative, simply reply to this email.\n\n{{sender_signature}}',
   '["first_name","sender_signature"]'::jsonb),
  ('kyc-request','KYC request','operations','any',
   'A short compliance step before we proceed',
   E'Dear {{first_name}},\n\nBefore we proceed, our compliance team needs to complete a short KYC step. It is a standard regulatory requirement and usually takes less than 5 minutes.\n\nYou will receive a separate secure link from our compliance officer. Once completed, we move forward immediately.\n\nThank you for your patience.\n\n{{sender_signature}}',
   '["first_name","sender_signature"]'::jsonb),
  ('referral-thank-you','Referral thank you','operations','any',
   'Thank you for the referral, {{first_name}}',
   E'Dear {{first_name}},\n\nThank you for thinking of us. Referrals from clients like you are the highest compliment we can receive.\n\nWe will reach out to {{full_name}} personally and ensure they receive the same level of care you have come to expect from JBJ.\n\nWith warm regards,\n{{sender_signature}}',
   '["first_name","full_name","sender_signature"]'::jsonb),
  ('reactivation-checkin','Reactivation check-in','operations','any',
   'A quiet check-in',
   E'Dear {{first_name}},\n\nA quiet check-in — we have not spoken in a while and I wanted to make sure you are well.\n\nIf your priorities or interests have shifted, I would love to know. And if there is anything we can do for you, a friend or a family member, just reply to this email.\n\nWith warm regards,\n{{sender_signature}}',
   '["first_name","sender_signature"]'::jsonb)
) AS t(slug, name, category, audience, subject, body_text, variables)
WHERE NOT EXISTS (SELECT 1 FROM public.email_template_library WHERE is_system = true AND email_template_library.slug = t.slug);

-- crm_brokers indexes
CREATE INDEX IF NOT EXISTS crm_brokers_email_lower_idx ON public.crm_brokers (email_lower);
CREATE INDEX IF NOT EXISTS crm_brokers_phone_e164_idx ON public.crm_brokers (phone_e164);
CREATE INDEX IF NOT EXISTS crm_brokers_current_brokerage_idx ON public.crm_brokers (current_brokerage_id);
