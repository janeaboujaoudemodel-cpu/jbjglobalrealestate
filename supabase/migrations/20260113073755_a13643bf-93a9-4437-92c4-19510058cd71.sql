
-- Fix overly permissive RLS policies on jbj_brokers table
DROP POLICY IF EXISTS "Anyone can view brokers" ON public.jbj_brokers;
CREATE POLICY "Authenticated users can view brokers" ON public.jbj_brokers
  FOR SELECT
  TO authenticated
  USING (true);

-- Fix overly permissive RLS policies on jbj_filters table  
DROP POLICY IF EXISTS "Anyone can view filters" ON public.jbj_filters;
CREATE POLICY "Authenticated users can view filters" ON public.jbj_filters
  FOR SELECT
  TO authenticated
  USING (true);
