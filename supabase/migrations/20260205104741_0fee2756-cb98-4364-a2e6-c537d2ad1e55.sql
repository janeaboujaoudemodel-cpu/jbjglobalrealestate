-- Fix function search_path security warnings

-- Fix generate_card_number function
CREATE OR REPLACE FUNCTION public.generate_card_number()
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _card_number text;
  _exists boolean;
BEGIN
  LOOP
    -- Generate format: JBJ-XXXX-XXXX-XXXX
    _card_number := 'JBJ-' || 
      LPAD(floor(random() * 10000)::text, 4, '0') || '-' ||
      LPAD(floor(random() * 10000)::text, 4, '0') || '-' ||
      LPAD(floor(random() * 10000)::text, 4, '0');
    
    SELECT EXISTS (
      SELECT 1 FROM public.membership_cards WHERE card_number = _card_number
    ) INTO _exists;
    
    EXIT WHEN NOT _exists;
  END LOOP;
  
  RETURN _card_number;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;