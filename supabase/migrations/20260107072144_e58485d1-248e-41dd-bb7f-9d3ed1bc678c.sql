-- Create enum for task status
CREATE TYPE public.broker_task_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue');

-- Create enum for task type
CREATE TYPE public.broker_task_type AS ENUM ('developer_visit', 'training', 'document', 'call', 'meeting', 'other');

-- Create enum for reward type
CREATE TYPE public.reward_type AS ENUM ('points', 'gift', 'badge', 'certificate');

-- HR Training Modules table
CREATE TABLE public.hr_training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  video_url TEXT,
  duration_minutes INTEGER DEFAULT 30,
  display_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Broker Training Progress
CREATE TABLE public.broker_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES public.hr_training_modules(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  quiz_score INTEGER,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Developer Visit Check-ins
CREATE TABLE public.developer_visit_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  developer_id UUID REFERENCES public.uae_developers(id) ON DELETE CASCADE NOT NULL,
  task_id UUID,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out_time TIMESTAMPTZ,
  check_in_photo_url TEXT,
  check_out_photo_url TEXT,
  check_in_latitude DECIMAL(10, 8),
  check_in_longitude DECIMAL(11, 8),
  check_out_latitude DECIMAL(10, 8),
  check_out_longitude DECIMAL(11, 8),
  signature_data TEXT,
  notes TEXT,
  confirmation_statement BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Broker Tasks
CREATE TABLE public.broker_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  task_type broker_task_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  developer_id UUID REFERENCES public.uae_developers(id),
  due_date TIMESTAMPTZ,
  scheduled_time TIMESTAMPTZ,
  status broker_task_status DEFAULT 'pending',
  points_reward INTEGER DEFAULT 10,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Broker Points & Rewards
CREATE TABLE public.broker_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  points INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Points Transactions
CREATE TABLE public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rewards Catalog
CREATE TABLE public.rewards_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  points_required INTEGER NOT NULL,
  reward_type reward_type DEFAULT 'gift',
  quantity_available INTEGER DEFAULT -1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Claimed Rewards
CREATE TABLE public.claimed_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reward_id UUID REFERENCES public.rewards_catalog(id) ON DELETE CASCADE NOT NULL,
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  claimed_at TIMESTAMPTZ DEFAULT now(),
  fulfilled_at TIMESTAMPTZ
);

-- Broker Contracts
CREATE TABLE public.broker_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contract_type TEXT DEFAULT 'standard',
  contract_content TEXT,
  signature_data TEXT,
  signed_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  is_signed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, contract_type)
);

-- Enable RLS on all tables
ALTER TABLE public.hr_training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_visit_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claimed_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hr_training_modules (public read, admin write)
CREATE POLICY "Anyone can view training modules" ON public.hr_training_modules FOR SELECT USING (true);
CREATE POLICY "Admins can manage training modules" ON public.hr_training_modules FOR ALL USING (public.is_owner_or_admin(auth.uid()));

-- RLS Policies for broker_training_progress
CREATE POLICY "Users can view own training progress" ON public.broker_training_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own training progress" ON public.broker_training_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own training progress" ON public.broker_training_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all training progress" ON public.broker_training_progress FOR SELECT USING (public.is_owner_or_admin(auth.uid()));

-- RLS Policies for developer_visit_checkins
CREATE POLICY "Users can view own checkins" ON public.developer_visit_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checkins" ON public.developer_visit_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checkins" ON public.developer_visit_checkins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all checkins" ON public.developer_visit_checkins FOR SELECT USING (public.is_owner_or_admin(auth.uid()));

-- RLS Policies for broker_tasks
CREATE POLICY "Users can view own tasks" ON public.broker_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.broker_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all tasks" ON public.broker_tasks FOR ALL USING (public.is_owner_or_admin(auth.uid()));

-- RLS Policies for broker_points
CREATE POLICY "Users can view own points" ON public.broker_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own points" ON public.broker_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own points" ON public.broker_points FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all points" ON public.broker_points FOR SELECT USING (public.is_owner_or_admin(auth.uid()));

-- RLS Policies for points_transactions
CREATE POLICY "Users can view own transactions" ON public.points_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.points_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.points_transactions FOR SELECT USING (public.is_owner_or_admin(auth.uid()));

-- RLS Policies for rewards_catalog (public read)
CREATE POLICY "Anyone can view active rewards" ON public.rewards_catalog FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage rewards" ON public.rewards_catalog FOR ALL USING (public.is_owner_or_admin(auth.uid()));

-- RLS Policies for claimed_rewards
CREATE POLICY "Users can view own claimed rewards" ON public.claimed_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can claim rewards" ON public.claimed_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage claimed rewards" ON public.claimed_rewards FOR ALL USING (public.is_owner_or_admin(auth.uid()));

-- RLS Policies for broker_contracts
CREATE POLICY "Users can view own contracts" ON public.broker_contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contracts" ON public.broker_contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contracts" ON public.broker_contracts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all contracts" ON public.broker_contracts FOR SELECT USING (public.is_owner_or_admin(auth.uid()));

-- Insert sample training modules
INSERT INTO public.hr_training_modules (title, description, content, category, display_order, duration_minutes) VALUES
('Welcome to JJ Global Capital', 'Introduction to our company culture and values', 'Welcome to JJ Global Capital! In this module, you will learn about our company history, mission, vision, and core values. We are a leading real estate brokerage firm specializing in off-plan properties in the UAE.', 'company', 1, 15),
('Company Structure & Organization', 'Understanding the organizational hierarchy and departments', 'Learn about our organizational structure, key departments, leadership team, and how different teams collaborate. Understanding this will help you navigate the company effectively.', 'company', 2, 20),
('Working Hours & Schedule', 'Office timings, attendance policies, and scheduling', 'Our standard working hours are Sunday to Thursday, 9:00 AM to 6:00 PM. This module covers attendance policies, break times, overtime procedures, and how to request time off.', 'company', 3, 15),
('Real Estate Fundamentals', 'Basic concepts of real estate in the UAE', 'This comprehensive module covers UAE real estate laws, property types, freehold vs leasehold, RERA regulations, and the off-plan market dynamics.', 'training', 4, 45),
('Developer Knowledge', 'Understanding major UAE developers', 'Learn about the top developers in the UAE including Emaar, DAMAC, Nakheel, Meraas, and others. Understand their signature projects, pricing strategies, and unique selling points.', 'training', 5, 40),
('Sales Techniques', 'Effective sales strategies for real estate', 'Master the art of real estate sales with proven techniques for client engagement, objection handling, closing deals, and building long-term relationships.', 'training', 6, 50),
('CRM & Tools Training', 'Using our internal systems effectively', 'Learn how to use our CRM system, AI tools, document management, and other internal platforms to maximize your productivity.', 'tools', 7, 30),
('Compliance & Ethics', 'Legal requirements and ethical standards', 'Understand the legal and ethical requirements for real estate brokers in the UAE, including anti-money laundering procedures and client confidentiality.', 'compliance', 8, 25);

-- Insert sample rewards
INSERT INTO public.rewards_catalog (name, description, points_required, reward_type, quantity_available) VALUES
('Coffee Voucher', 'Free coffee from our partner cafes', 100, 'gift', -1),
('Branded Merchandise', 'JJ Global Capital branded items', 250, 'gift', 50),
('Extra Day Off', 'One additional paid day off', 1000, 'gift', 10),
('iPad Mini', 'Apple iPad Mini for top performers', 5000, 'gift', 5),
('iPhone 15', 'Apple iPhone 15 for exceptional achievers', 10000, 'gift', 2),
('Top Closer Badge', 'Recognition badge for closing deals', 500, 'badge', -1),
('Rising Star Badge', 'Badge for fast learners', 300, 'badge', -1),
('Training Champion', 'Completed all training modules', 200, 'certificate', -1);

-- Create triggers for updated_at
CREATE TRIGGER update_hr_training_modules_updated_at BEFORE UPDATE ON public.hr_training_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_broker_tasks_updated_at BEFORE UPDATE ON public.broker_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_broker_points_updated_at BEFORE UPDATE ON public.broker_points FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();