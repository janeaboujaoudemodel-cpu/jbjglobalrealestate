-- Update brokerage outreach templates to reflect new branded sender CitiDevelopers@jbj.ae
UPDATE public.crm_email_templates
SET html = regexp_replace(html, 'jane@citideveloper\.com', 'CitiDevelopers@jbj.ae', 'gi'),
    updated_at = now()
WHERE variant IN ('brokerage_partnership_intro', 'brokerage_breakfast_invite');