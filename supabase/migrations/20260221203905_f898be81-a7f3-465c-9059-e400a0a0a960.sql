
-- Create ticket_surveys table
CREATE TABLE public.ticket_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.support_tickets(id),
  ticket_number TEXT NOT NULL,
  user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  ease_of_submission INTEGER NOT NULL CHECK (ease_of_submission BETWEEN 1 AND 5),
  response_speed INTEGER NOT NULL CHECK (response_speed BETWEEN 1 AND 5),
  resolution_quality INTEGER NOT NULL CHECK (resolution_quality BETWEEN 1 AND 5),
  website_smartness INTEGER NOT NULL CHECK (website_smartness BETWEEN 1 AND 5),
  would_recommend BOOLEAN NOT NULL DEFAULT true,
  suggestions TEXT,
  points_awarded INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by ticket
CREATE INDEX idx_ticket_surveys_ticket_id ON public.ticket_surveys(ticket_id);
CREATE UNIQUE INDEX idx_ticket_surveys_unique_ticket ON public.ticket_surveys(ticket_number, email);

-- Enable RLS
ALTER TABLE public.ticket_surveys ENABLE ROW LEVEL SECURITY;

-- Owner can read all surveys
CREATE POLICY "Owner can read all surveys"
  ON public.ticket_surveys FOR SELECT
  USING ((SELECT user_role FROM public.profiles WHERE id = auth.uid()) = 'owner');

-- Authenticated users can read their own surveys
CREATE POLICY "Users can read own surveys"
  ON public.ticket_surveys FOR SELECT
  USING (auth.uid() = user_id);

-- Service role handles inserts (via edge function), no public insert policy needed
