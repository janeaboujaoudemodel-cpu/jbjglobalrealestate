
ALTER TABLE public.crm_email_templates
  ADD COLUMN IF NOT EXISTS locked_at timestamptz;

-- Subject fixes
UPDATE public.crm_email_templates
   SET subject = 'Private Breakfast for {{brokerage_name}} — {{project_name}}'
 WHERE variant = 'brokerage_partnership_intro';

UPDATE public.crm_email_templates
   SET subject = 'Private Breakfast for {{brokerage_name}}'
 WHERE variant = 'brokerage_breakfast_invite';

-- Body fixes — applied via plain text replace on the stored HTML.
UPDATE public.crm_email_templates
   SET html = replace(
                replace(
                  replace(
                    html,
                    'forward the registration documents',
                    'confirm the required registration documents to complete the registration process'
                  ),
                  '<div style="font-size:12px;color:#1A1A1A;margin-top:6px">Citi Developer &middot; Sales &amp; Experience Center, Dubai</div>',
                  ''
                ),
                '<div><a href="mailto:jane@citideveloper.com"',
                '<div style="font-size:12px;color:#1A1A1A;margin-top:4px">Email: <a href="mailto:jane@citideveloper.com" style="color:#1A1A1A;text-decoration:none;border-bottom:1px solid #B89555">jane@citideveloper.com</a></div><div><a href="mailto:jane@citideveloper.com"'
              )
 WHERE variant IN ('brokerage_partnership_intro', 'brokerage_breakfast_invite');
