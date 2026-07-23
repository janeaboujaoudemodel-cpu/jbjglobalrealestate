UPDATE public.crm_owner_settings
SET drive_doc_pack_url = 'https://drive.google.com/open?id=1EsWVmAPv6ljBzWbWNAvv07EQrHwi5drS&usp=drive_fs'
WHERE drive_doc_pack_url IS NULL OR btrim(drive_doc_pack_url) = '';

UPDATE public.crm_email_templates
SET html = replace(
  replace(
    html,
    'Open Document Pack →',
    'Document Hub →'
  ),
  'Open JBJ GLOBAL REAL ESTATE registration documents',
  'JBJ GLOBAL REAL ESTATE Document Hub'
)
WHERE variant IN ('developer_registration', 'developer_confirm_registered');