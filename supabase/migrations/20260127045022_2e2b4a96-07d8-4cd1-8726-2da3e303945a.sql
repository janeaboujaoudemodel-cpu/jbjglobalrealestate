-- Add broker_type to broker_profiles for role-based dashboard access
ALTER TABLE public.broker_profiles 
ADD COLUMN IF NOT EXISTS broker_type text DEFAULT 'external' CHECK (broker_type IN ('internal', 'external'));

COMMENT ON COLUMN public.broker_profiles.broker_type IS 'internal = JBJ employee broker, external = partner/independent broker';

-- Create education books table for the 9-book library
CREATE TABLE IF NOT EXISTS public.broker_education_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_number integer NOT NULL,
  learning_path text NOT NULL,
  title text NOT NULL,
  description text,
  cover_image_url text,
  learning_objective text,
  sort_order integer DEFAULT 0,
  is_restricted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broker_education_books ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read books
CREATE POLICY "Authenticated users can view books" 
ON public.broker_education_books 
FOR SELECT 
TO authenticated
USING (true);

-- Create modules within books
CREATE TABLE IF NOT EXISTS public.broker_education_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES public.broker_education_books(id) ON DELETE CASCADE NOT NULL,
  module_number integer NOT NULL,
  title text NOT NULL,
  description text,
  estimated_minutes integer DEFAULT 15,
  content text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broker_education_modules ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view modules
CREATE POLICY "Authenticated users can view modules" 
ON public.broker_education_modules 
FOR SELECT 
TO authenticated
USING (true);

-- Create progress tracking table
CREATE TABLE IF NOT EXISTS public.broker_education_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  book_id uuid REFERENCES public.broker_education_books(id) ON DELETE CASCADE NOT NULL,
  module_id uuid REFERENCES public.broker_education_modules(id) ON DELETE CASCADE,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book_id, module_id)
);

-- Enable RLS
ALTER TABLE public.broker_education_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own progress
CREATE POLICY "Users can view own progress" 
ON public.broker_education_progress 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert own progress
CREATE POLICY "Users can insert own progress" 
ON public.broker_education_progress 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update own progress
CREATE POLICY "Users can update own progress" 
ON public.broker_education_progress 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Insert the 9 books
INSERT INTO public.broker_education_books (book_number, learning_path, title, description, learning_objective, is_restricted, sort_order) VALUES
(1, 'Foundations', 'UAE Real Estate Framework', 'Understanding the legal, regulatory, and structural foundations of UAE real estate markets.', 'Gain comprehensive understanding of UAE real estate laws, RERA regulations, and market structure.', false, 1),
(2, 'Foundations', 'Brokerage Ethics & Professional Conduct', 'Principles of ethical practice and professional standards in real estate brokerage.', 'Master the ethical framework and professional conduct standards required for UAE brokers.', false, 2),
(3, 'Buyer & Investor Advisory', 'Buyer Representation & Advisory', 'Comprehensive guide to representing buyers in residential and commercial transactions.', 'Learn to effectively represent and advise buyers through the entire purchase journey.', false, 3),
(4, 'Buyer & Investor Advisory', 'Investor Advisory & Capital Strategy', 'Advanced strategies for advising real estate investors on portfolio and capital decisions.', 'Develop expertise in investor advisory, ROI analysis, and capital deployment strategies.', false, 4),
(5, 'Seller & Landlord Advisory', 'Seller Representation & Pricing', 'Expert techniques for representing sellers and establishing optimal pricing strategies.', 'Master seller representation, competitive pricing, and negotiation techniques.', false, 5),
(6, 'Seller & Landlord Advisory', 'Landlord & Rental Advisory', 'Complete framework for advising landlords on rental strategies and tenant management.', 'Learn rental market dynamics, tenant screening, and landlord advisory best practices.', false, 6),
(7, 'Market Intelligence', 'Market Interpretation for Brokers', 'Data-driven approaches to understanding and communicating market conditions.', 'Develop skills in market analysis, trend interpretation, and data-backed client communication.', false, 7),
(8, 'Market Intelligence', 'Advisory Communication Standards', 'Professional communication frameworks for broker-client interactions.', 'Master professional communication, presentation, and advisory dialogue techniques.', false, 8),
(9, 'Advanced (Restricted)', 'Complex & High-Value Transactions', 'Advanced strategies for managing complex, high-value, and multi-party transactions.', 'Acquire expertise in handling complex deals, high-net-worth clients, and intricate negotiations.', true, 9)
ON CONFLICT DO NOTHING;

-- Insert modules for each book (5-7 modules per book)
-- Book 1: UAE Real Estate Framework
INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 1, 'Introduction to UAE Real Estate Law', 'Overview of property ownership laws and regulations in the UAE.', 20, 1
FROM public.broker_education_books WHERE book_number = 1;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 2, 'RERA Guidelines & Compliance', 'Understanding RERA requirements and broker licensing.', 25, 2
FROM public.broker_education_books WHERE book_number = 1;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 3, 'Freehold vs Leasehold Ownership', 'Distinguishing ownership types and their implications.', 15, 3
FROM public.broker_education_books WHERE book_number = 1;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 4, 'Developer Registration & Escrow', 'Understanding developer obligations and escrow requirements.', 20, 4
FROM public.broker_education_books WHERE book_number = 1;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 5, 'Transaction Registration Process', 'Step-by-step guide to registering property transactions.', 25, 5
FROM public.broker_education_books WHERE book_number = 1;

-- Book 2: Brokerage Ethics
INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 1, 'Professional Standards Overview', 'Core ethical principles for real estate professionals.', 20, 1
FROM public.broker_education_books WHERE book_number = 2;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 2, 'Client Confidentiality & Trust', 'Managing sensitive client information appropriately.', 15, 2
FROM public.broker_education_books WHERE book_number = 2;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 3, 'Conflict of Interest Management', 'Identifying and handling conflicts of interest.', 20, 3
FROM public.broker_education_books WHERE book_number = 2;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 4, 'Transparent Communication', 'Building trust through honest client communication.', 15, 4
FROM public.broker_education_books WHERE book_number = 2;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 5, 'JBJ Code of Conduct', 'Understanding and applying the JBJ ethical framework.', 20, 5
FROM public.broker_education_books WHERE book_number = 2;

-- Book 3: Buyer Representation
INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 1, 'Understanding Buyer Needs', 'Effective needs assessment and qualification.', 20, 1
FROM public.broker_education_books WHERE book_number = 3;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 2, 'Property Search Strategy', 'Systematic approaches to property matching.', 25, 2
FROM public.broker_education_books WHERE book_number = 3;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 3, 'Viewing Preparation & Execution', 'Maximizing the impact of property viewings.', 20, 3
FROM public.broker_education_books WHERE book_number = 3;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 4, 'Negotiation on Behalf of Buyers', 'Techniques for securing favorable terms.', 30, 4
FROM public.broker_education_books WHERE book_number = 3;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 5, 'Purchase Process Management', 'Guiding buyers through the transaction process.', 25, 5
FROM public.broker_education_books WHERE book_number = 3;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 6, 'Post-Purchase Support', 'Providing value after transaction completion.', 15, 6
FROM public.broker_education_books WHERE book_number = 3;

-- Book 4: Investor Advisory
INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 1, 'Understanding Investor Profiles', 'Categorizing and understanding investor motivations.', 25, 1
FROM public.broker_education_books WHERE book_number = 4;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 2, 'ROI Analysis Fundamentals', 'Calculating and presenting investment returns.', 30, 2
FROM public.broker_education_books WHERE book_number = 4;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 3, 'Risk Assessment Communication', 'Transparently discussing investment risks.', 20, 3
FROM public.broker_education_books WHERE book_number = 4;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 4, 'Portfolio Diversification Guidance', 'Advising on property portfolio strategies.', 25, 4
FROM public.broker_education_books WHERE book_number = 4;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 5, 'Off-Plan Investment Advisory', 'Special considerations for off-plan investments.', 25, 5
FROM public.broker_education_books WHERE book_number = 4;

-- Book 5: Seller Representation
INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 1, 'Seller Needs Assessment', 'Understanding seller motivations and timelines.', 20, 1
FROM public.broker_education_books WHERE book_number = 5;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 2, 'Comparative Market Analysis', 'Creating accurate property valuations.', 30, 2
FROM public.broker_education_books WHERE book_number = 5;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 3, 'Pricing Strategy Development', 'Setting optimal listing prices.', 25, 3
FROM public.broker_education_books WHERE book_number = 5;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 4, 'Property Marketing Excellence', 'Creating compelling property presentations.', 25, 4
FROM public.broker_education_books WHERE book_number = 5;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 5, 'Offer Management & Negotiation', 'Handling offers and negotiating for sellers.', 30, 5
FROM public.broker_education_books WHERE book_number = 5;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 6, 'Closing Process for Sellers', 'Completing seller transactions smoothly.', 20, 6
FROM public.broker_education_books WHERE book_number = 5;

-- Book 6: Landlord Advisory
INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 1, 'Rental Market Dynamics', 'Understanding rental market forces and trends.', 25, 1
FROM public.broker_education_books WHERE book_number = 6;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 2, 'Rental Pricing Strategies', 'Setting competitive rental rates.', 20, 2
FROM public.broker_education_books WHERE book_number = 6;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 3, 'Tenant Screening Best Practices', 'Qualifying reliable tenants.', 25, 3
FROM public.broker_education_books WHERE book_number = 6;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 4, 'Lease Agreement Essentials', 'Key terms and legal requirements.', 20, 4
FROM public.broker_education_books WHERE book_number = 6;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 5, 'Property Management Coordination', 'Working with property managers effectively.', 15, 5
FROM public.broker_education_books WHERE book_number = 6;

-- Book 7: Market Interpretation
INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 1, 'Market Data Sources', 'Identifying reliable market information sources.', 20, 1
FROM public.broker_education_books WHERE book_number = 7;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 2, 'Trend Analysis Techniques', 'Interpreting market trends accurately.', 25, 2
FROM public.broker_education_books WHERE book_number = 7;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 3, 'Area-Level Market Assessment', 'Evaluating specific neighborhood markets.', 25, 3
FROM public.broker_education_books WHERE book_number = 7;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 4, 'Supply & Demand Indicators', 'Understanding market balance factors.', 20, 4
FROM public.broker_education_books WHERE book_number = 7;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 5, 'Communicating Market Insights', 'Presenting data to clients effectively.', 20, 5
FROM public.broker_education_books WHERE book_number = 7;

-- Book 8: Communication Standards
INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 1, 'Professional Communication Principles', 'Foundations of effective broker communication.', 20, 1
FROM public.broker_education_books WHERE book_number = 8;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 2, 'Active Listening Techniques', 'Understanding client needs through listening.', 15, 2
FROM public.broker_education_books WHERE book_number = 8;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 3, 'Written Communication Excellence', 'Professional email and document standards.', 20, 3
FROM public.broker_education_books WHERE book_number = 8;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 4, 'Presentation Skills for Brokers', 'Delivering compelling property presentations.', 25, 4
FROM public.broker_education_books WHERE book_number = 8;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 5, 'Handling Difficult Conversations', 'Managing objections and concerns professionally.', 20, 5
FROM public.broker_education_books WHERE book_number = 8;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 6, 'Cross-Cultural Communication', 'Working with diverse international clients.', 20, 6
FROM public.broker_education_books WHERE book_number = 8;

-- Book 9: Complex Transactions (Restricted)
INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 1, 'High-Value Transaction Fundamentals', 'Special considerations for premium properties.', 30, 1
FROM public.broker_education_books WHERE book_number = 9;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 2, 'Multi-Party Deal Structures', 'Managing transactions with multiple stakeholders.', 35, 2
FROM public.broker_education_books WHERE book_number = 9;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 3, 'HNWI Client Management', 'Working with high-net-worth individuals.', 30, 3
FROM public.broker_education_books WHERE book_number = 9;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 4, 'Complex Negotiation Strategies', 'Advanced negotiation for complex deals.', 35, 4
FROM public.broker_education_books WHERE book_number = 9;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 5, 'Legal & Compliance Considerations', 'Navigating complex legal requirements.', 30, 5
FROM public.broker_education_books WHERE book_number = 9;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 6, 'Portfolio Transactions', 'Handling bulk property transactions.', 30, 6
FROM public.broker_education_books WHERE book_number = 9;

INSERT INTO public.broker_education_modules (book_id, module_number, title, description, estimated_minutes, sort_order) 
SELECT id, 7, 'Deal Closing Excellence', 'Ensuring successful complex deal closings.', 25, 7
FROM public.broker_education_books WHERE book_number = 9;