-- Drop types if they exist from partial migration
DROP TYPE IF EXISTS public.hunt_target_type CASCADE;
DROP TYPE IF EXISTS public.hunt_campaign_status CASCADE;
DROP TYPE IF EXISTS public.hunt_prospect_status CASCADE;

-- Hunt Campaign Types
CREATE TYPE public.hunt_target_type AS ENUM ('investor', 'broker', 'employee');
CREATE TYPE public.hunt_campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');
CREATE TYPE public.hunt_prospect_status AS ENUM ('new', 'contacted', 'responded', 'qualified', 'negotiating', 'converted', 'rejected', 'not_interested');

-- Hunt Campaigns Table
CREATE TABLE public.hunt_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    target_type hunt_target_type NOT NULL,
    status hunt_campaign_status DEFAULT 'draft',
    target_criteria JSONB DEFAULT '{}',
    message_template TEXT,
    follow_up_template TEXT,
    auto_follow_up BOOLEAN DEFAULT false,
    follow_up_days INTEGER DEFAULT 3,
    total_prospects INTEGER DEFAULT 0,
    contacted_count INTEGER DEFAULT 0,
    response_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Hunt Prospects Table
CREATE TABLE public.hunt_prospects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.hunt_campaigns(id) ON DELETE CASCADE,
    target_type hunt_target_type NOT NULL,
    status hunt_prospect_status DEFAULT 'new',
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    linkedin_url TEXT,
    company TEXT,
    job_title TEXT,
    location TEXT,
    experience_years INTEGER,
    specializations TEXT[],
    investment_capacity TEXT,
    languages TEXT[],
    notes TEXT,
    ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
    ai_analysis TEXT,
    qualification_notes TEXT,
    source TEXT,
    last_contacted_at TIMESTAMPTZ,
    last_response_at TIMESTAMPTZ,
    follow_up_date TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Hunt Outreach Messages
CREATE TABLE public.hunt_outreach (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID REFERENCES public.hunt_prospects(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.hunt_campaigns(id) ON DELETE CASCADE,
    sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    channel TEXT DEFAULT 'email',
    message_type TEXT DEFAULT 'initial',
    subject TEXT,
    content TEXT NOT NULL,
    ai_generated BOOLEAN DEFAULT false,
    ai_personalization TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    response_content TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Hunt Message Templates
CREATE TABLE public.hunt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    target_type hunt_target_type NOT NULL,
    template_type TEXT DEFAULT 'initial',
    subject TEXT,
    content TEXT NOT NULL,
    variables TEXT[],
    is_active BOOLEAN DEFAULT true,
    use_count INTEGER DEFAULT 0,
    response_rate NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hunt_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hunt_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hunt_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hunt_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hunt_campaigns
CREATE POLICY "hunt_campaigns_select" ON public.hunt_campaigns FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner') OR created_by = auth.uid());

CREATE POLICY "hunt_campaigns_insert" ON public.hunt_campaigns FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "hunt_campaigns_update" ON public.hunt_campaigns FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner') OR created_by = auth.uid());

CREATE POLICY "hunt_campaigns_delete" ON public.hunt_campaigns FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner') OR created_by = auth.uid());

-- RLS Policies for hunt_prospects
CREATE POLICY "hunt_prospects_select" ON public.hunt_prospects FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner') OR 
       EXISTS (SELECT 1 FROM public.hunt_campaigns WHERE id = campaign_id AND created_by = auth.uid()));

CREATE POLICY "hunt_prospects_insert" ON public.hunt_prospects FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "hunt_prospects_update" ON public.hunt_prospects FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner') OR
       EXISTS (SELECT 1 FROM public.hunt_campaigns WHERE id = campaign_id AND created_by = auth.uid()));

CREATE POLICY "hunt_prospects_delete" ON public.hunt_prospects FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- RLS Policies for hunt_outreach
CREATE POLICY "hunt_outreach_select" ON public.hunt_outreach FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner') OR sent_by = auth.uid());

CREATE POLICY "hunt_outreach_insert" ON public.hunt_outreach FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "hunt_outreach_update" ON public.hunt_outreach FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner') OR sent_by = auth.uid());

-- RLS Policies for hunt_templates
CREATE POLICY "hunt_templates_select" ON public.hunt_templates FOR SELECT TO authenticated
USING (is_active = true OR created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "hunt_templates_insert" ON public.hunt_templates FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "hunt_templates_update" ON public.hunt_templates FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner') OR created_by = auth.uid());

CREATE POLICY "hunt_templates_delete" ON public.hunt_templates FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner') OR created_by = auth.uid());

-- Indexes
CREATE INDEX idx_hunt_campaigns_status ON public.hunt_campaigns(status);
CREATE INDEX idx_hunt_campaigns_target_type ON public.hunt_campaigns(target_type);
CREATE INDEX idx_hunt_prospects_campaign ON public.hunt_prospects(campaign_id);
CREATE INDEX idx_hunt_prospects_status ON public.hunt_prospects(status);
CREATE INDEX idx_hunt_outreach_prospect ON public.hunt_outreach(prospect_id);

-- Function to update campaign stats
CREATE OR REPLACE FUNCTION public.update_hunt_campaign_stats()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE hunt_campaigns SET 
        total_prospects = (SELECT COUNT(*) FROM hunt_prospects WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)),
        contacted_count = (SELECT COUNT(*) FROM hunt_prospects WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id) AND status != 'new'),
        response_count = (SELECT COUNT(*) FROM hunt_prospects WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id) AND status IN ('responded', 'qualified', 'negotiating', 'converted')),
        conversion_count = (SELECT COUNT(*) FROM hunt_prospects WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id) AND status = 'converted'),
        updated_at = now()
    WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id);
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_hunt_campaign_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.hunt_prospects
FOR EACH ROW EXECUTE FUNCTION public.update_hunt_campaign_stats();

-- Insert default templates
INSERT INTO public.hunt_templates (name, target_type, template_type, subject, content, variables) VALUES
('Broker Partnership', 'broker', 'initial', 'Partnership Opportunity - JBJ Global Real Estate', 
'Hi {{name}},

I noticed your work at {{company}} and wanted to discuss a partnership opportunity. At JBJ Global, we offer:
• Competitive commissions
• Exclusive off-plan projects
• Full marketing support

Interested in a quick call?

Best, JBJ Global Team', ARRAY['name', 'company']),

('Investor Outreach', 'investor', 'initial', 'Exclusive Dubai Investment Opportunities',
'Dear {{name}},

Reaching out about exclusive Dubai real estate investments:
• Off-plan with guaranteed ROI
• Premium locations
• Flexible payment plans

Would you like our investment portfolio?

Warm regards, JBJ Global Real Estate', ARRAY['name', 'investment_capacity']),

('Employee Recruitment', 'employee', 'initial', 'Career at JBJ Global Real Estate',
'Hi {{name}},

Your profile caught our attention for a {{role}} position.

We offer:
• Competitive salary + commission
• Career growth
• Modern Dubai office

Open to discussing?

HR Team, JBJ Global Real Estate', ARRAY['name', 'role', 'experience']);