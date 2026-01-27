-- Add new visitor roles: investor, owner, broker_partner
-- First, we need to add new values to the visitor_role enum

ALTER TYPE public.visitor_role ADD VALUE IF NOT EXISTS 'investor';
ALTER TYPE public.visitor_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.visitor_role ADD VALUE IF NOT EXISTS 'broker_partner';