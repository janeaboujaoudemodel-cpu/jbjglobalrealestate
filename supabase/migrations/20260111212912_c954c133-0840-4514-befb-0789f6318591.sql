-- Create a secure view for broker subscriptions that masks payment data
-- Regular users see masked payment info, admins see full data via direct table access

CREATE OR REPLACE VIEW public.broker_subscriptions_safe AS
SELECT 
  id,
  user_id,
  email,
  full_name,
  phone,
  company_name,
  rera_number,
  tier,
  status,
  currency,
  -- Mask payment reference: show only last 4 chars
  CASE 
    WHEN payment_reference IS NOT NULL AND length(payment_reference) > 4 
    THEN '****' || right(payment_reference, 4)
    WHEN payment_reference IS NOT NULL 
    THEN '****'
    ELSE NULL 
  END as payment_reference_masked,
  -- Mask payment method: show only type (e.g., "Card ending ****")
  CASE 
    WHEN payment_method IS NOT NULL 
    THEN split_part(payment_method, ' ', 1) || ' ****'
    ELSE NULL 
  END as payment_method_masked,
  -- Hide exact pricing from regular users, show tier only
  CASE 
    WHEN price_usd > 0 THEN true 
    ELSE false 
  END as is_paid,
  starts_at,
  expires_at,
  trial_ends_at,
  selected_addons,
  ai_credits_used,
  ai_credits_limit,
  pdf_downloads,
  user_role,
  terms_accepted_at,
  created_at,
  updated_at
FROM public.broker_subscriptions;

-- Enable RLS-like behavior through the view
ALTER VIEW public.broker_subscriptions_safe SET (security_invoker = on);

-- Grant access to the view
GRANT SELECT ON public.broker_subscriptions_safe TO authenticated;

-- Create a security definer function for admins to get full payment data when needed
CREATE OR REPLACE FUNCTION public.get_subscription_payment_details(p_subscription_id uuid)
RETURNS TABLE (
  payment_reference text,
  payment_method text,
  price_usd numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    payment_reference,
    payment_method,
    price_usd
  FROM public.broker_subscriptions
  WHERE id = p_subscription_id
    AND (
      -- Only admins/owners can see full payment details
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'owner'::app_role)
    )
$$;