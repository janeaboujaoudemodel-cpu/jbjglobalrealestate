-- Create IP blocklist table
CREATE TABLE public.ip_blocklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT,
  blocked_by UUID REFERENCES auth.users(id),
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_permanent BOOLEAN NOT NULL DEFAULT true,
  block_count INTEGER NOT NULL DEFAULT 1,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ip_blocklist ENABLE ROW LEVEL SECURITY;

-- Only admins can manage blocklist
CREATE POLICY "Admins can manage IP blocklist"
ON public.ip_blocklist
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for fast IP lookups
CREATE INDEX idx_ip_blocklist_ip ON public.ip_blocklist(ip_address);
CREATE INDEX idx_ip_blocklist_expires ON public.ip_blocklist(expires_at) WHERE expires_at IS NOT NULL;

-- Enable realtime for blocklist
ALTER TABLE public.ip_blocklist REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ip_blocklist;