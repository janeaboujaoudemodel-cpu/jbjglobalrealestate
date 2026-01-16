-- Add lead_intent and pipeline_stage columns to crm_leads for PART 4A compliance
-- This enables proper Buy/Sell/Rent classification and pipeline tracking

ALTER TABLE public.crm_leads 
ADD COLUMN IF NOT EXISTS lead_intent TEXT DEFAULT 'buy',
ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS assigned_broker_id UUID REFERENCES public.ai_brokers(id),
ADD COLUMN IF NOT EXISTS rental_renter_type TEXT,
ADD COLUMN IF NOT EXISTS rental_budget_min NUMERIC,
ADD COLUMN IF NOT EXISTS rental_budget_max NUMERIC,
ADD COLUMN IF NOT EXISTS rental_preferred_areas TEXT[],
ADD COLUMN IF NOT EXISTS rental_property_type TEXT,
ADD COLUMN IF NOT EXISTS rental_lease_duration TEXT,
ADD COLUMN IF NOT EXISTS rental_move_in_timeline TEXT,
ADD COLUMN IF NOT EXISTS partner_service_type TEXT;

-- Add check constraint for lead_intent values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_leads_lead_intent_check'
  ) THEN
    ALTER TABLE public.crm_leads 
    ADD CONSTRAINT crm_leads_lead_intent_check 
    CHECK (lead_intent IN ('buy', 'sell', 'rent_lease', 'broker_registration', 'partner_services'));
  END IF;
END $$;

-- Add check constraint for rental_renter_type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_leads_rental_renter_type_check'
  ) THEN
    ALTER TABLE public.crm_leads 
    ADD CONSTRAINT crm_leads_rental_renter_type_check 
    CHECK (rental_renter_type IS NULL OR rental_renter_type IN ('tenant', 'landlord'));
  END IF;
END $$;

-- Create index for pipeline filtering
CREATE INDEX IF NOT EXISTS idx_crm_leads_lead_intent ON public.crm_leads(lead_intent);
CREATE INDEX IF NOT EXISTS idx_crm_leads_pipeline_stage ON public.crm_leads(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned_broker ON public.crm_leads(assigned_broker_id);