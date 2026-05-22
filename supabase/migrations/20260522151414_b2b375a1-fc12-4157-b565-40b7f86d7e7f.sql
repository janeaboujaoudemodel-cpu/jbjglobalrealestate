
ALTER TABLE public.developer_applications
  ADD CONSTRAINT developer_applications_status_chk
  CHECK (status IN ('pending','approved','rejected','changes_requested'));

CREATE INDEX IF NOT EXISTS idx_dev_apps_status ON public.developer_applications(status);
CREATE INDEX IF NOT EXISTS idx_dev_apps_developer ON public.developer_applications(developer_id);
CREATE INDEX IF NOT EXISTS idx_dev_apps_applicant ON public.developer_applications(applicant_user_id);

CREATE POLICY "dev_apps_applicant_insert" ON public.developer_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = applicant_user_id);
CREATE POLICY "dev_apps_applicant_select" ON public.developer_applications
  FOR SELECT TO authenticated USING (auth.uid() = applicant_user_id);
CREATE POLICY "dev_apps_applicant_update" ON public.developer_applications
  FOR UPDATE TO authenticated
  USING (auth.uid() = applicant_user_id AND status IN ('pending','changes_requested'))
  WITH CHECK (auth.uid() = applicant_user_id);
CREATE POLICY "dev_apps_owner_all" ON public.developer_applications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_dev_apps_updated ON public.developer_applications;
CREATE TRIGGER trg_dev_apps_updated
BEFORE UPDATE ON public.developer_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
