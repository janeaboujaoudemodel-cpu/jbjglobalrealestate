ALTER TABLE public.developers ADD COLUMN IF NOT EXISTS excel_order INTEGER;
CREATE INDEX IF NOT EXISTS developers_excel_order_idx ON public.developers(excel_order);