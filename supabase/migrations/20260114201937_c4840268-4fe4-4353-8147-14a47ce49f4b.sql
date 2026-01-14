
-- AI Compliance, Ethics & Security Intelligence Layer Schema

-- Security event types enum
CREATE TYPE public.security_event_type AS ENUM (
  'login_attempt', 'login_success', 'login_failure', 
  'unauthorized_access', 'permission_change', 'data_export',
  'file_upload', 'file_download', 'file_modification',
  'suspicious_activity', 'intrusion_detected', 'data_leak_attempt',
  'ethics_violation', 'policy_violation', 'lockdown_triggered'
);

-- Security severity levels
CREATE TYPE public.security_severity AS ENUM ('info', 'low', 'medium', 'high', 'critical');

-- Compliance status
CREATE TYPE public.compliance_status AS ENUM ('compliant', 'warning', 'violation', 'under_review');

-- Security events log table
CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type security_event_type NOT NULL,
  severity security_severity NOT NULL DEFAULT 'info',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ai_agent_id TEXT,
  department TEXT,
  resource_type TEXT,
  resource_id TEXT,
  action_taken TEXT,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance audit logs
CREATE TABLE public.compliance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  policy_reference TEXT,
  compliance_status compliance_status NOT NULL DEFAULT 'compliant',
  findings TEXT[],
  recommendations TEXT[],
  audited_by TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ethics violations tracking
CREATE TABLE public.ethics_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_type TEXT NOT NULL,
  severity security_severity NOT NULL,
  violator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  violator_type TEXT DEFAULT 'human',
  ai_agent_id TEXT,
  department TEXT,
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '{}',
  action_required TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data access governance rules
CREATE TABLE public.data_access_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  department TEXT,
  resource_type TEXT NOT NULL,
  access_level TEXT NOT NULL,
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- File provenance tracking
CREATE TABLE public.file_provenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  department TEXT,
  access_history JSONB DEFAULT '[]',
  modifications JSONB DEFAULT '[]',
  encryption_status TEXT DEFAULT 'encrypted',
  watermark_id TEXT,
  is_tampered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security health metrics
CREATE TABLE public.security_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  security_score INTEGER DEFAULT 100 CHECK (security_score >= 0 AND security_score <= 100),
  unauthorized_attempts INTEGER DEFAULT 0,
  blocked_activities INTEGER DEFAULT 0,
  policy_violations INTEGER DEFAULT 0,
  data_leaks_prevented INTEGER DEFAULT 0,
  ethics_flags INTEGER DEFAULT 0,
  encryption_compliance_percent NUMERIC(5,2) DEFAULT 100.00,
  department_risk_scores JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(metric_date)
);

-- Compliance training records
CREATE TABLE public.compliance_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  training_type TEXT NOT NULL,
  training_content TEXT,
  completed_at TIMESTAMPTZ,
  score INTEGER,
  is_completed BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emergency lockdown log
CREATE TABLE public.emergency_lockdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by TEXT NOT NULL,
  trigger_reason TEXT NOT NULL,
  severity security_severity NOT NULL DEFAULT 'critical',
  affected_departments TEXT[],
  actions_taken TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  deactivated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ethics_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_access_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_lockdowns ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins/owners can access security data
CREATE POLICY "Admins view security events" ON security_events
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "System inserts security events" ON security_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins view compliance audits" ON compliance_audit_logs
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "System inserts compliance audits" ON compliance_audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins view ethics violations" ON ethics_violations
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "Admins manage access rules" ON data_access_rules
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "Admins view file provenance" ON file_provenance
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "Admins view security metrics" ON security_health_metrics
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "Users view own training" ON compliance_training
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins manage training" ON compliance_training
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "Admins manage lockdowns" ON emergency_lockdowns
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );

-- Indexes for performance
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_created ON security_events(created_at DESC);
CREATE INDEX idx_security_events_user ON security_events(user_id);
CREATE INDEX idx_ethics_violations_status ON ethics_violations(status);
CREATE INDEX idx_file_provenance_hash ON file_provenance(file_hash);
CREATE INDEX idx_compliance_training_user ON compliance_training(user_id);

-- Function to log security event
CREATE OR REPLACE FUNCTION public.log_security_event_full(
  p_event_type security_event_type,
  p_severity security_severity,
  p_description TEXT,
  p_user_id UUID DEFAULT NULL,
  p_ai_agent_id TEXT DEFAULT NULL,
  p_department TEXT DEFAULT NULL,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_action_taken TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO security_events (
    event_type, severity, user_id, ai_agent_id, department,
    resource_type, resource_id, action_taken, description, metadata
  ) VALUES (
    p_event_type, p_severity, COALESCE(p_user_id, auth.uid()), p_ai_agent_id,
    p_department, p_resource_type, p_resource_id, p_action_taken, p_description, p_metadata
  ) RETURNING id INTO v_id;
  
  -- Update daily security metrics
  INSERT INTO security_health_metrics (metric_date, unauthorized_attempts)
  VALUES (CURRENT_DATE, CASE WHEN p_event_type = 'unauthorized_access' THEN 1 ELSE 0 END)
  ON CONFLICT (metric_date) DO UPDATE SET
    unauthorized_attempts = security_health_metrics.unauthorized_attempts + 
      CASE WHEN p_event_type = 'unauthorized_access' THEN 1 ELSE 0 END,
    blocked_activities = security_health_metrics.blocked_activities + 
      CASE WHEN p_event_type = 'intrusion_detected' THEN 1 ELSE 0 END,
    policy_violations = security_health_metrics.policy_violations + 
      CASE WHEN p_event_type = 'policy_violation' THEN 1 ELSE 0 END,
    ethics_flags = security_health_metrics.ethics_flags + 
      CASE WHEN p_event_type = 'ethics_violation' THEN 1 ELSE 0 END;
  
  RETURN v_id;
END;
$$;

-- Function to calculate security score
CREATE OR REPLACE FUNCTION public.calculate_security_score()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score INTEGER := 100;
  v_critical_events INTEGER;
  v_high_events INTEGER;
  v_unresolved INTEGER;
BEGIN
  -- Count critical events in last 24h
  SELECT COUNT(*) INTO v_critical_events
  FROM security_events
  WHERE severity = 'critical' AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Count high severity events in last 24h
  SELECT COUNT(*) INTO v_high_events
  FROM security_events
  WHERE severity = 'high' AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Count unresolved events
  SELECT COUNT(*) INTO v_unresolved
  FROM security_events
  WHERE is_resolved = FALSE AND severity IN ('high', 'critical');
  
  -- Calculate score
  v_score := v_score - (v_critical_events * 15);
  v_score := v_score - (v_high_events * 5);
  v_score := v_score - (v_unresolved * 3);
  
  -- Ensure score is between 0 and 100
  v_score := GREATEST(0, LEAST(100, v_score));
  
  -- Update today's metrics
  INSERT INTO security_health_metrics (metric_date, security_score)
  VALUES (CURRENT_DATE, v_score)
  ON CONFLICT (metric_date) DO UPDATE SET security_score = v_score;
  
  RETURN v_score;
END;
$$;

-- Function to trigger emergency lockdown
CREATE OR REPLACE FUNCTION public.trigger_emergency_lockdown(
  p_reason TEXT,
  p_severity security_severity DEFAULT 'critical',
  p_departments TEXT[] DEFAULT ARRAY['all']
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Only allow admins/owners to trigger lockdown
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role)) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can trigger lockdown';
  END IF;
  
  INSERT INTO emergency_lockdowns (
    triggered_by, trigger_reason, severity, affected_departments,
    actions_taken
  ) VALUES (
    'olivia_ai', p_reason, p_severity, p_departments,
    ARRAY['Revoked non-founder access', 'Froze data transfers', 'Notified founder']
  ) RETURNING id INTO v_id;
  
  -- Log the event
  PERFORM log_security_event_full(
    'lockdown_triggered'::security_event_type,
    p_severity,
    'Emergency lockdown triggered: ' || p_reason
  );
  
  RETURN v_id;
END;
$$;
