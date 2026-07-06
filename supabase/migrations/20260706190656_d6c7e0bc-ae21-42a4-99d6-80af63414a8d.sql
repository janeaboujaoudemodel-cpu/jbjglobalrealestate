
ALTER TABLE public.briefing_requests
  ADD COLUMN IF NOT EXISTS rating smallint CHECK (rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS sales_rep_id uuid REFERENCES public.developer_sales_reps(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rating_notes text;

CREATE INDEX IF NOT EXISTS idx_briefing_requests_sales_rep ON public.briefing_requests(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_briefing_requests_rating ON public.briefing_requests(rating);
