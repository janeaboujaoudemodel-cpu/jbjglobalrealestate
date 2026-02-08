-- Add customer confirmation email tracking columns to support_tickets
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS customer_confirmation_sent_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS customer_confirmation_status text NULL,
ADD COLUMN IF NOT EXISTS customer_confirmation_error text NULL,
ADD COLUMN IF NOT EXISTS customer_confirmation_message_id text NULL;

-- Create support_ticket_messages table for staff replies and user follow-ups
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'staff')),
  sender_user_id uuid NULL,
  message text NOT NULL,
  attachment_urls text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on support_ticket_messages
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Users can read messages for their own tickets (by user_id or email match)
CREATE POLICY "Users can read messages for their tickets"
ON public.support_ticket_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_id
    AND (
      st.user_id = auth.uid() 
      OR st.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
);

-- RLS: Staff/Owner can read all messages (using crm_users_profile for role check)
CREATE POLICY "Staff can read all messages"
ON public.support_ticket_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile cup
    WHERE cup.user_id = auth.uid()
    AND cup.crm_role IN ('owner_admin', 'admin', 'founder', 'sales_director')
    AND cup.is_active = true
  )
);

-- RLS: Staff can insert messages
CREATE POLICY "Staff can create messages"
ON public.support_ticket_messages
FOR INSERT
WITH CHECK (
  sender_type = 'staff'
  AND EXISTS (
    SELECT 1 FROM public.crm_users_profile cup
    WHERE cup.user_id = auth.uid()
    AND cup.crm_role IN ('owner_admin', 'admin', 'founder', 'sales_director')
    AND cup.is_active = true
  )
);

-- RLS: Users can reply to their own tickets
CREATE POLICY "Users can reply to their tickets"
ON public.support_ticket_messages
FOR INSERT
WITH CHECK (
  sender_type = 'user'
  AND sender_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_id
    AND (
      st.user_id = auth.uid()
      OR st.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON public.support_tickets(email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);