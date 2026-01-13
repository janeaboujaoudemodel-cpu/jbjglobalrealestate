import type { Database, Json } from "@/integrations/supabase/types";

export type AIBrokerStatus = Database["public"]["Enums"]["ai_broker_status"];

export interface AIBroker {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  gender: string;
  avatar_url: string | null;
  bio: string | null;
  status: AIBrokerStatus;
  specialization: string[] | null;
  languages: string[] | null;
  personality_prompt: string | null;
  total_leads_handled: number | null;
  total_conversions: number | null;
  average_response_time_seconds: number | null;
  current_daily_interactions: number | null;
  daily_interaction_limit: number | null;
  response_delay_min_seconds: number | null;
  response_delay_max_seconds: number | null;
  working_hours_start: string | null;
  working_hours_end: string | null;
  working_days: number[] | null;
  knowledge_base_updated_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AssignmentRule {
  id: string;
  name: string;
  description: string | null;
  priority: number | null;
  is_active: boolean | null;
  assignment_method: string | null;
  assigned_broker_id: string | null;
  broker_pool: string[] | null;
  max_leads_per_day: number | null;
  current_leads_today: number | null;
  conditions: Json;
  created_at?: string | null;
  updated_at?: string | null;
}
