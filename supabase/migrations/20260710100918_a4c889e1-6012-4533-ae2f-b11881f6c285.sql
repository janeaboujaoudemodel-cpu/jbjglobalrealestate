
-- 1) broker_learning_settings: restrict SELECT to authenticated only
DROP POLICY IF EXISTS bls_select_all ON public.broker_learning_settings;
CREATE POLICY bls_select_authenticated
  ON public.broker_learning_settings
  FOR SELECT
  TO authenticated
  USING (true);
REVOKE SELECT ON public.broker_learning_settings FROM anon;

-- 2) developers: keep public catalog access but strip sensitive columns from anon
-- via column-level privileges. Authenticated/admin flows keep full access.
REVOKE SELECT ON public.developers FROM anon;
GRANT SELECT (
  id, name, slug, logo_url, description, rank, created_at, updated_at,
  founded_year, completed_projects, offplan_projects, portfolio_worth,
  headquarters, feature_image_url, logo_url_processed, logo_url_dark,
  website_url, ceo_name, total_units_delivered, upcoming_units,
  expected_completion_year, notable_projects, parent_company, license_number,
  specialization, logo_bg_color, is_hidden, logo_verified, instagram_url,
  linkedin_url, office_phone, whatsapp, office_address, google_maps_url,
  has_active_rep, description_languages, whatsapp_group_url, telegram_group_url,
  public_fields, logo_source, logo_status
) ON public.developers TO anon;
