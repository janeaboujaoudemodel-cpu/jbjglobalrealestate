UPDATE public.crm_brokerages
SET status = 'blacklisted'
WHERE entry_source = 'directory'
  AND COALESCE(NULLIF(trim(rera_license), ''), NULL) IS NULL
  AND status <> 'blacklisted'
  AND company_name ~* '\m(bank|banking|mortgage|insurance|takaful|reinsurance|financial advisor|wealth management|asset management|law\s|legal|advocates?|attorneys?|notary|consult(ing|ancy|ants?)|freight|logistics|cargo|shipping|customs broker|recruitment|manpower|staffing|facilities management|property management only)\M';