-- Fix AI analytics tables RLS policies to restrict write access to admins only
-- This prevents any authenticated user from modifying AI-generated data

-- Drop existing overly permissive write policies
DROP POLICY IF EXISTS "Auth write market_opportunities" ON public.market_opportunities;
DROP POLICY IF EXISTS "Auth write market_alerts" ON public.market_alerts;
DROP POLICY IF EXISTS "Auth write investor_behavior_insights" ON public.investor_behavior_insights;
DROP POLICY IF EXISTS "Auth write project_ai_scores" ON public.project_ai_scores;

-- Create admin-only write policies for market_opportunities
CREATE POLICY "Admin write market_opportunities" 
ON public.market_opportunities 
FOR ALL TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Create admin-only write policies for market_alerts
CREATE POLICY "Admin write market_alerts" 
ON public.market_alerts 
FOR ALL TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Create admin-only write policies for investor_behavior_insights
CREATE POLICY "Admin write investor_behavior_insights" 
ON public.investor_behavior_insights 
FOR ALL TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Create admin-only write policies for project_ai_scores
CREATE POLICY "Admin write project_ai_scores" 
ON public.project_ai_scores 
FOR ALL TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));