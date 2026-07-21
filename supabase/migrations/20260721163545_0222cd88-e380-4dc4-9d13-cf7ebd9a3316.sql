UPDATE public.crm_email_templates
SET html = regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            html,
            'https?://(www\.)?citidevelopers\.com', 'https://citideveloper.com', 'gi'
          ),
          '<strong>Jane</strong>\s*&middot;\s*Sales', '<strong>Jane Bou Jaoude</strong> &middot; Sales', 'gi'
        ),
        'background:#064E3B(?!;background-image)',
        'background:#064E3B;background-image:linear-gradient(135deg,#064E3B 0%,#042c1c 70%,#000000 100%)',
        'gi'
      ),
      'Jane Bujold', 'Jane Bou Jaoude', 'gi'
    )
WHERE variant IN ('brokerage_partnership_intro', 'brokerage_breakfast_invite');