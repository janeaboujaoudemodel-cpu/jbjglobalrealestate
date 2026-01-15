-- =====================================================
-- BROKER AVAILABILITY & LEAD SECURITY SYSTEM
-- =====================================================

-- 1. Add availability_status to jbj_brokers table
ALTER TABLE public.jbj_brokers 
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'offline')),
ADD COLUMN IF NOT EXISTS availability_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS auto_receive_leads BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_lead_assigned_at TIMESTAMP WITH TIME ZONE;

-- 2. Create message audit table for compliance tracking
CREATE TABLE IF NOT EXISTS public.jbj_message_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.jbj_messages(id) ON DELETE SET NULL,
  broker_id UUID REFERENCES public.jbj_brokers(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.jbj_leads(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  channel TEXT NOT NULL,
  direction TEXT NOT NULL,
  audit_status TEXT DEFAULT 'pending' CHECK (audit_status IN ('pending', 'approved', 'flagged', 'violation')),
  violation_type TEXT,
  violation_details TEXT,
  flagged_words TEXT[],
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  auto_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create lead contact restrictions view (hides PII from regular brokers)
-- Brokers can only see first name, not full contact details
CREATE OR REPLACE VIEW public.jbj_leads_secure AS
SELECT 
  id,
  SPLIT_PART(name, ' ', 1) AS first_name, -- Only show first name
  CASE WHEN assigned_broker_id IS NOT NULL THEN '***' || RIGHT(phone, 4) ELSE NULL END AS masked_phone,
  CASE WHEN assigned_broker_id IS NOT NULL THEN SPLIT_PART(email, '@', 1) || '@***' ELSE NULL END AS masked_email,
  status,
  assigned_broker_id,
  property_interest,
  budget_range,
  source,
  last_contact,
  created_at,
  updated_at
FROM public.jbj_leads;

-- 4. Create lead assignment queue for round-robin distribution
CREATE TABLE IF NOT EXISTS public.jbj_lead_assignment_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.jbj_leads(id) ON DELETE CASCADE NOT NULL,
  assigned_to_broker_id UUID REFERENCES public.jbj_brokers(id) ON DELETE SET NULL,
  assignment_order INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'rejected', 'expired')),
  assigned_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Create compliance violation words table
CREATE TABLE IF NOT EXISTS public.jbj_compliance_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_pattern TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('contact_request', 'personal_number', 'external_communication', 'unprofessional', 'competitor', 'policy_violation')),
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('warning', 'violation', 'critical')),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Insert default compliance words
INSERT INTO public.jbj_compliance_words (word_pattern, category, severity, description) VALUES
-- Contact request violations
('my personal number', 'personal_number', 'critical', 'Attempting to share personal contact'),
('my number is', 'personal_number', 'critical', 'Sharing personal phone number'),
('call me on', 'personal_number', 'critical', 'Redirecting to personal line'),
('whatsapp me on', 'personal_number', 'critical', 'Redirecting to personal WhatsApp'),
('contact me directly', 'personal_number', 'violation', 'Asking for direct contact'),
('my personal whatsapp', 'personal_number', 'critical', 'Sharing personal WhatsApp'),
('text me at', 'personal_number', 'critical', 'Sharing personal contact'),
('reach me at', 'personal_number', 'violation', 'Sharing personal contact'),
('my email is', 'personal_number', 'violation', 'Sharing personal email'),
('send me your number', 'contact_request', 'critical', 'Requesting client contact info'),
('give me your phone', 'contact_request', 'critical', 'Requesting client phone'),
('what is your number', 'contact_request', 'critical', 'Asking for client number'),
('your email address', 'contact_request', 'violation', 'Requesting client email'),
('your phone number', 'contact_request', 'critical', 'Requesting client phone'),
('send your contact', 'contact_request', 'critical', 'Requesting client contact'),
-- External communication
('lets talk outside', 'external_communication', 'violation', 'Suggesting external communication'),
('better to meet', 'external_communication', 'warning', 'Suggesting in-person meeting'),
('off the record', 'external_communication', 'violation', 'Attempting unmonitored communication'),
-- Competitor mentions
('other agency', 'competitor', 'warning', 'Mentioning competitors'),
('competitor', 'competitor', 'warning', 'Mentioning competitors'),
-- Unprofessional
('guarantee', 'unprofessional', 'warning', 'Making guarantees'),
('100%', 'unprofessional', 'warning', 'Making absolute claims'),
('promise you', 'unprofessional', 'warning', 'Making promises')
ON CONFLICT DO NOTHING;

-- 7. Create broker lead access log (audit who viewed what)
CREATE TABLE IF NOT EXISTS public.jbj_lead_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES public.jbj_brokers(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.jbj_leads(id) ON DELETE SET NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'contact', 'message', 'call', 'email')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Enable RLS on all new tables
ALTER TABLE public.jbj_message_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jbj_lead_assignment_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jbj_compliance_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jbj_lead_access_log ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for message audit (only admins can see all, brokers see their own)
CREATE POLICY "Admins can view all message audits" 
ON public.jbj_message_audit FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.jbj_brokers 
  WHERE user_id = auth.uid() AND status = 'admin'
) OR EXISTS (
  SELECT 1 FROM public.broker_subscriptions 
  WHERE user_id = auth.uid() AND user_role IN ('admin', 'owner')
));

CREATE POLICY "Brokers can view their own message audits"
ON public.jbj_message_audit FOR SELECT
USING (
  broker_id IN (SELECT id FROM public.jbj_brokers WHERE user_id = auth.uid())
);

CREATE POLICY "Brokers can insert their own audits"
ON public.jbj_message_audit FOR INSERT
WITH CHECK (
  broker_id IN (SELECT id FROM public.jbj_brokers WHERE user_id = auth.uid())
);

-- 10. RLS Policies for lead assignment queue
CREATE POLICY "Brokers can view their assignments"
ON public.jbj_lead_assignment_queue FOR SELECT
USING (
  assigned_to_broker_id IN (SELECT id FROM public.jbj_brokers WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage all assignments"
ON public.jbj_lead_assignment_queue FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.broker_subscriptions 
  WHERE user_id = auth.uid() AND user_role IN ('admin', 'owner')
));

-- 11. RLS Policies for compliance words (everyone can read, only admins can modify)
CREATE POLICY "Anyone can read compliance words"
ON public.jbj_compliance_words FOR SELECT
USING (true);

CREATE POLICY "Admins can manage compliance words"
ON public.jbj_compliance_words FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.broker_subscriptions 
  WHERE user_id = auth.uid() AND user_role IN ('admin', 'owner')
));

-- 12. RLS Policies for lead access log
CREATE POLICY "Brokers can insert their access logs"
ON public.jbj_lead_access_log FOR INSERT
WITH CHECK (
  broker_id IN (SELECT id FROM public.jbj_brokers WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all access logs"
ON public.jbj_lead_access_log FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.broker_subscriptions 
  WHERE user_id = auth.uid() AND user_role IN ('admin', 'owner')
));

-- 13. Create function to auto-assign leads to available brokers (round-robin)
CREATE OR REPLACE FUNCTION public.auto_assign_lead_to_available_broker(p_lead_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_broker_id UUID;
BEGIN
  -- Find the next available broker with capacity, using round-robin based on last assignment
  SELECT id INTO v_broker_id
  FROM public.jbj_brokers
  WHERE availability_status = 'available'
    AND auto_receive_leads = true
    AND active_leads < capacity
    AND status = 'active'
  ORDER BY last_lead_assigned_at ASC NULLS FIRST
  LIMIT 1;

  IF v_broker_id IS NOT NULL THEN
    -- Update lead assignment
    UPDATE public.jbj_leads
    SET assigned_broker_id = v_broker_id,
        updated_at = now()
    WHERE id = p_lead_id;

    -- Update broker's last assignment time and active leads count
    UPDATE public.jbj_brokers
    SET last_lead_assigned_at = now(),
        active_leads = active_leads + 1,
        updated_at = now()
    WHERE id = v_broker_id;

    -- Log the assignment
    INSERT INTO public.jbj_lead_assignment_queue (lead_id, assigned_to_broker_id, assignment_order, status, assigned_at)
    VALUES (p_lead_id, v_broker_id, 1, 'assigned', now());
  END IF;

  RETURN v_broker_id;
END;
$$;

-- 14. Create function to check message compliance
CREATE OR REPLACE FUNCTION public.check_message_compliance(p_content TEXT)
RETURNS TABLE(is_compliant BOOLEAN, violations TEXT[], severity TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_violations TEXT[] := '{}';
  v_severity TEXT := 'none';
  v_word RECORD;
BEGIN
  -- Check against all active compliance words
  FOR v_word IN 
    SELECT word_pattern, category, cw.severity as word_severity, description
    FROM public.jbj_compliance_words cw
    WHERE is_active = true
  LOOP
    IF LOWER(p_content) LIKE '%' || LOWER(v_word.word_pattern) || '%' THEN
      v_violations := array_append(v_violations, v_word.word_pattern || ' (' || v_word.category || ')');
      
      -- Set highest severity
      IF v_word.word_severity = 'critical' THEN
        v_severity := 'critical';
      ELSIF v_word.word_severity = 'violation' AND v_severity != 'critical' THEN
        v_severity := 'violation';
      ELSIF v_word.word_severity = 'warning' AND v_severity NOT IN ('critical', 'violation') THEN
        v_severity := 'warning';
      END IF;
    END IF;
  END LOOP;

  RETURN QUERY SELECT 
    array_length(v_violations, 1) IS NULL OR array_length(v_violations, 1) = 0,
    v_violations,
    v_severity;
END;
$$;

-- 15. Create trigger to auto-audit messages
CREATE OR REPLACE FUNCTION public.trigger_audit_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_compliance RECORD;
BEGIN
  -- Check compliance
  SELECT * INTO v_compliance 
  FROM public.check_message_compliance(NEW.content);

  -- Insert audit record
  INSERT INTO public.jbj_message_audit (
    message_id, 
    broker_id, 
    lead_id, 
    content, 
    channel, 
    direction,
    audit_status,
    violation_type,
    flagged_words,
    auto_flagged
  ) VALUES (
    NEW.id,
    NEW.broker_id,
    NEW.lead_id,
    NEW.content,
    NEW.channel,
    NEW.direction,
    CASE 
      WHEN v_compliance.severity = 'critical' THEN 'violation'
      WHEN v_compliance.severity = 'violation' THEN 'flagged'
      WHEN v_compliance.severity = 'warning' THEN 'pending'
      ELSE 'approved'
    END,
    v_compliance.severity,
    v_compliance.violations,
    array_length(v_compliance.violations, 1) > 0
  );

  -- Update message with filter status if violations found
  IF array_length(v_compliance.violations, 1) > 0 THEN
    NEW.was_filtered := true;
    NEW.filter_reason := array_to_string(v_compliance.violations, ', ');
  END IF;

  RETURN NEW;
END;
$$;

-- 16. Attach trigger to jbj_messages
DROP TRIGGER IF EXISTS audit_message_trigger ON public.jbj_messages;
CREATE TRIGGER audit_message_trigger
BEFORE INSERT ON public.jbj_messages
FOR EACH ROW
EXECUTE FUNCTION public.trigger_audit_message();

-- 17. Enable realtime for audit tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.jbj_message_audit;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jbj_lead_assignment_queue;