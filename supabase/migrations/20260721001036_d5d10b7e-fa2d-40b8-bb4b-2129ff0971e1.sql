UPDATE public.crm_email_templates
SET html = replace(
  replace(
    replace(
      replace(html,
        'CONTACT@JBJ.ae',
        'contact@jbj.ae'
      ),
      '<b>JBJ</b>.AE',
      '<a href="https://jbj.ae" style="color:#0a0a0a;font-weight:700;text-decoration:underline;text-decoration-color:#B89555;" data-no-link-tracking="true">jbj.ae</a>'
    ),
    'style="color:#FFFDF7',
    'style="color:#0a0a0a'
  ),
  'style="color:#ffffff',
  'style="color:#0a0a0a'
),
updated_at = now()
WHERE variant IN ('developer_registration', 'developer_confirm_registered');

UPDATE public.crm_email_templates
SET html = replace(
  replace(
    replace(
      replace(
        replace(html,
          'CitiDevelopers@jbj.ae',
          'info@jbj.ae'
        ),
        'CITIDEVELOPERS@JBJ.AE',
        'info@jbj.ae'
      ),
      'JANE@C</a>ITIDEVELOPER.COM',
      'info@jbj.ae</a>'
    ),
    'Citi Developer',
    'JBJ Global Real Estate'
  ),
  'CITI Developer',
  'JBJ Global Real Estate'
),
updated_at = now()
WHERE variant IN ('brokerage_partnership_intro', 'brokerage_breakfast_invite');