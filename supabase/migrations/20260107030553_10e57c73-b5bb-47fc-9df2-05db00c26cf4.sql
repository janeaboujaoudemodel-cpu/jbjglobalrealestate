-- Add owner role to app_role enum (must be committed separately before use)
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'owner';