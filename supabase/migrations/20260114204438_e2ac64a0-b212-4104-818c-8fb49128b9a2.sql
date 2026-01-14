-- Create missing tables for market intelligence

-- Market Opportunities table
CREATE TABLE IF NOT EXISTS public.market_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  opportunity_type TEXT NOT NULL,
  location TEXT,
  developer_id UUID,
  project_name TEXT,
  estimated_value_aed NUMERIC,
  expected_roi_percent NUMERIC,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  ai_score NUMERIC CHECK (ai_score >= 0 AND ai_score <= 10),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'evaluated', 'pursued', 'passed', 'converted')),
  source_data JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Market Alerts table
CREATE TABLE IF NOT EXISTS public.market_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT,
  location TEXT,
  impact_assessment TEXT,
  recommended_action TEXT,
  source_url TEXT,
  is_read BOOLEAN DEFAULT false,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Investor Behavior Insights table
CREATE TABLE IF NOT EXISTS public.investor_behavior_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_segment TEXT NOT NULL,
  source_country TEXT,
  preferred_locations TEXT[],
  preferred_property_types TEXT[],
  avg_budget_min_aed NUMERIC,
  avg_budget_max_aed NUMERIC,
  payment_preference TEXT,
  inquiry_trend TEXT CHECK (inquiry_trend IN ('rising', 'falling', 'stable', 'volatile')),
  conversion_rate_percent NUMERIC,
  insight_summary TEXT,
  data_period_start DATE,
  data_period_end DATE,
  sample_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project AI Scores table
CREATE TABLE IF NOT EXISTS public.project_ai_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID,
  project_name TEXT NOT NULL,
  developer_name TEXT,
  location TEXT,
  market_timing_score NUMERIC CHECK (market_timing_score >= 0 AND market_timing_score <= 10),
  developer_reputation_score NUMERIC CHECK (developer_reputation_score >= 0 AND developer_reputation_score <= 10),
  location_growth_score NUMERIC CHECK (location_growth_score >= 0 AND location_growth_score <= 10),
  investor_interest_score NUMERIC CHECK (investor_interest_score >= 0 AND investor_interest_score <= 10),
  overall_score NUMERIC CHECK (overall_score >= 0 AND overall_score <= 10),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  recommendation TEXT,
  analysis_details JSONB,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_behavior_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_ai_scores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Auth read market_opportunities" ON public.market_opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth write market_opportunities" ON public.market_opportunities FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth read market_alerts" ON public.market_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth write market_alerts" ON public.market_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth read investor_behavior_insights" ON public.investor_behavior_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth write investor_behavior_insights" ON public.investor_behavior_insights FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth read project_ai_scores" ON public.project_ai_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth write project_ai_scores" ON public.project_ai_scores FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_market_opportunities_status ON public.market_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_market_alerts_priority ON public.market_alerts(priority);
CREATE INDEX IF NOT EXISTS idx_market_alerts_read ON public.market_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_project_scores_overall ON public.project_ai_scores(overall_score DESC);