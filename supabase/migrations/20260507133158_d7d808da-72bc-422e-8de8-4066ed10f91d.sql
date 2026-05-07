UPDATE public.crm_email_templates
SET subject = 'You Are Invited! Book Your Exclusive Breakfast Briefing for {{brokerage_name}}'
WHERE variant = 'brokerage_breakfast_invite';

-- Invalidate locked payloads for this variant (stored under metadata.variant)
DELETE FROM public.outreach_locked_payloads
WHERE surface = 'brokerage_outreach'
  AND metadata->>'variant' = 'brokerage_breakfast_invite'
  AND status = 'locked';