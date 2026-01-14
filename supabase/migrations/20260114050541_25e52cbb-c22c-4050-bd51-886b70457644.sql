-- Create table for AI communication logs
CREATE TABLE IF NOT EXISTS ai_communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_employee_id TEXT NOT NULL,
  ai_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  channel TEXT,
  recipient_type TEXT,
  recipient_id TEXT,
  message_preview TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on ai_communication_logs
ALTER TABLE ai_communication_logs ENABLE ROW LEVEL SECURITY;

-- Create table for daily AI summaries
CREATE TABLE IF NOT EXISTS ai_daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_date DATE NOT NULL,
  ai_employee_id TEXT NOT NULL,
  ai_name TEXT NOT NULL,
  leads_contacted INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  follow_ups_pending INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  summary_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(summary_date, ai_employee_id)
);

-- Enable RLS on ai_daily_summaries
ALTER TABLE ai_daily_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_communication_logs
CREATE POLICY "Allow viewing AI communication logs" ON ai_communication_logs FOR SELECT USING (true);
CREATE POLICY "Allow inserting AI communication logs" ON ai_communication_logs FOR INSERT WITH CHECK (true);

-- Create policies for ai_daily_summaries
CREATE POLICY "Allow viewing AI daily summaries" ON ai_daily_summaries FOR SELECT USING (true);
CREATE POLICY "Allow managing AI daily summaries" ON ai_daily_summaries FOR ALL USING (true) WITH CHECK (true);