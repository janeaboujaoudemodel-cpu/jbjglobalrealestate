-- Phase 3: Unify Contracts & Templates — add template_type so a single
-- canonical module (JobOfferManager → renamed visually to "Templates") can host
-- job offers, employment contracts, NDAs, warning letters, etc.
ALTER TABLE public.hr_job_offers
  ADD COLUMN IF NOT EXISTS template_type text NOT NULL DEFAULT 'job_offer';

CREATE INDEX IF NOT EXISTS idx_hr_job_offers_template_type
  ON public.hr_job_offers (template_type);