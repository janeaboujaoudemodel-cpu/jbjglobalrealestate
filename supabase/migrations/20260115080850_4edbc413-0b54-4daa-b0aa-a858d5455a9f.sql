-- Create employee chat messages table
CREATE TABLE public.employee_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'employee')),
  recipient_id TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee status table
CREATE TABLE public.employee_status (
  id TEXT PRIMARY KEY,
  employee_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'busy', 'away', 'offline')),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_typing BOOLEAN DEFAULT false,
  current_activity TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create employee notifications table
CREATE TABLE public.employee_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('message', 'mention', 'task', 'alert')),
  title TEXT NOT NULL,
  content TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_chat_messages
CREATE POLICY "Authenticated users can view chat messages" 
ON public.employee_chat_messages 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert chat messages" 
ON public.employee_chat_messages 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update chat messages" 
ON public.employee_chat_messages 
FOR UPDATE 
TO authenticated
USING (true);

-- RLS Policies for employee_status
CREATE POLICY "Anyone can view employee status" 
ON public.employee_status 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can update employee status" 
ON public.employee_status 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert employee status" 
ON public.employee_status 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- RLS Policies for employee_notifications
CREATE POLICY "Authenticated users can view notifications" 
ON public.employee_notifications 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert notifications" 
ON public.employee_notifications 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update notifications" 
ON public.employee_notifications 
FOR UPDATE 
TO authenticated
USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_status;