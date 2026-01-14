-- First migration: Add sales_director to crm_role enum
ALTER TYPE public.crm_role ADD VALUE IF NOT EXISTS 'sales_director';