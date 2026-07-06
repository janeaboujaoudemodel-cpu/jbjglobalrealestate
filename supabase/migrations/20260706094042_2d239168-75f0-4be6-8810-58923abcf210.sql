
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS built_up_area text,
  ADD COLUMN IF NOT EXISTS plot_area text,
  ADD COLUMN IF NOT EXISTS launch_date date,
  ADD COLUMN IF NOT EXISTS is_serviced boolean,
  ADD COLUMN IF NOT EXISTS is_managed boolean,
  ADD COLUMN IF NOT EXISTS management_type text,
  ADD COLUMN IF NOT EXISTS owner_can_use boolean,
  ADD COLUMN IF NOT EXISTS number_of_stories integer;
