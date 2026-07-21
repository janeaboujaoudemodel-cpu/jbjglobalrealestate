UPDATE public.crm_email_templates
SET html = REPLACE(
  html,
  'If your team runs an internal <strong>WhatsApp group</strong> for project updates, kindly add <strong>+971 54 716 7107</strong> so we can keep {{brokerage_name}} informed on launches, inventory and commissions — otherwise we will happily create a dedicated group for your team.',
  'If your team already runs an internal <strong>WhatsApp group</strong> for project updates and briefings, and {{brokerage_name}} is <strong>not currently receiving the latest launches, inventory updates or support</strong> from CITI Developers, we would love to be added — kindly include <strong>+971 54 716 7107</strong>. Otherwise, we will happily create a dedicated group for your team.'
),
updated_at = now()
WHERE html LIKE '%runs an internal <strong>WhatsApp group</strong> for project updates, kindly add%';

UPDATE public.crm_email_templates
SET html = REPLACE(
  html,
  'Any <strong>existing WhatsApp group</strong> your team is in with us — or a number we can add to a new one.',
  'If {{brokerage_name}} is <strong>not receiving latest updates or briefings</strong> from CITI Developers, share the WhatsApp group your team already uses (or a number) so we can join and support directly.'
),
updated_at = now()
WHERE html LIKE '%Any <strong>existing WhatsApp group</strong> your team is in with us%';