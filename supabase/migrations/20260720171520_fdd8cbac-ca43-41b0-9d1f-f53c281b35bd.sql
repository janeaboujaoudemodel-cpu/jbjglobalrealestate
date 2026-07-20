REVOKE SELECT ON public.developers FROM anon;
GRANT SELECT (
  id, name, slug, logo_url, description, rank, created_at, updated_at,
  founded_year, completed_projects, offplan_projects, portfolio_worth,
  headquarters, feature_image_url, logo_url_processed, logo_url_dark,
  website_url, ceo_name, total_units_delivered, upcoming_units,
  expected_completion_year, parent_company, license_number, specialization,
  logo_bg_color, is_hidden, logo_verified, logo_locked, logo_source,
  logo_verified_at, instagram_url, linkedin_url, whatsapp_group_url,
  telegram_group_url, registration_status, approved_at, last_auto_publish_at,
  has_active_rep, logo_status, description_languages, public_fields,
  needs_review, is_manually_verified, manually_verified_at,
  google_drive_url, drive_enrichment_status, drive_last_synced_at,
  group_status, focus_project_id, focus_project_label, excel_order,
  excel_imported_at, excel_import_marker, confirmation_source,
  last_confirmed_at, logo_candidates, logo_last_attempt_at
) ON public.developers TO anon;