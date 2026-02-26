
-- Fix: Restrict SELECT on market intelligence tables to owner/admin only

-- market_opportunities
DROP POLICY IF EXISTS "Auth read market_opportunities" ON public.market_opportunities;
CREATE POLICY "Owner read market_opportunities"
  ON public.market_opportunities FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- market_alerts
DROP POLICY IF EXISTS "Auth read market_alerts" ON public.market_alerts;
CREATE POLICY "Owner read market_alerts"
  ON public.market_alerts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- investor_behavior_insights
DROP POLICY IF EXISTS "Auth read investor_behavior_insights" ON public.investor_behavior_insights;
CREATE POLICY "Owner read investor_behavior_insights"
  ON public.investor_behavior_insights FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- project_ai_scores
DROP POLICY IF EXISTS "Auth read project_ai_scores" ON public.project_ai_scores;
CREATE POLICY "Owner read project_ai_scores"
  ON public.project_ai_scores FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));
