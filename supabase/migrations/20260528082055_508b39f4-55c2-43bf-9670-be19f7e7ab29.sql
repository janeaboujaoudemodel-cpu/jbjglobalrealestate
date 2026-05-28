
ALTER TABLE public.employee_salaries
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS broker_id uuid REFERENCES public.crm_brokers(id) ON DELETE SET NULL;

ALTER TABLE public.employee_commissions
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS broker_id uuid REFERENCES public.crm_brokers(id) ON DELETE SET NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='employee_salaries_subject_present') THEN
    ALTER TABLE public.employee_salaries
      ADD CONSTRAINT employee_salaries_subject_present
      CHECK (user_id IS NOT NULL OR broker_id IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='employee_commissions_subject_present') THEN
    ALTER TABLE public.employee_commissions
      ADD CONSTRAINT employee_commissions_subject_present
      CHECK (user_id IS NOT NULL OR broker_id IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_employee_salaries_broker ON public.employee_salaries(broker_id);
CREATE INDEX IF NOT EXISTS idx_employee_commissions_broker ON public.employee_commissions(broker_id);
