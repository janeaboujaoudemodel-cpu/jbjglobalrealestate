UPDATE public.crm_email_templates
SET html = regexp_replace(
  html,
  '<a([^>]*href="(?:tel:|mailto:|https://wa\.me/|https://api\.whatsapp\.com/|whatsapp:)[^"]*"[^>]*)>',
  '<a\1 data-no-link-tracking="true">',
  'gi'
)
WHERE variant LIKE 'brokerage%'
  AND html !~* 'data-no-link-tracking';