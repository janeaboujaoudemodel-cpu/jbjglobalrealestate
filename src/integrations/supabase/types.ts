export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      addon_tools: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          included_in_tiers: string[] | null
          is_active: boolean | null
          name: string
          price_aed: number
          price_usd: number
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id: string
          included_in_tiers?: string[] | null
          is_active?: boolean | null
          name: string
          price_aed?: number
          price_usd?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          included_in_tiers?: string[] | null
          is_active?: boolean | null
          name?: string
          price_aed?: number
          price_usd?: number
        }
        Relationships: []
      }
      admin_tasks: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          client_ip_hash: string | null
          completion_tokens: number | null
          created_at: string
          error_type: string | null
          function_name: string
          id: string
          model: string
          prompt_tokens: number | null
          response_time_ms: number | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          client_ip_hash?: string | null
          completion_tokens?: number | null
          created_at?: string
          error_type?: string | null
          function_name: string
          id?: string
          model?: string
          prompt_tokens?: number | null
          response_time_ms?: number | null
          success?: boolean
          user_id?: string | null
        }
        Update: {
          client_ip_hash?: string | null
          completion_tokens?: number | null
          created_at?: string
          error_type?: string | null
          function_name?: string
          id?: string
          model?: string
          prompt_tokens?: number | null
          response_time_ms?: number | null
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      assistant_ai_logs: {
        Row: {
          action_taken: string
          communication_id: string | null
          confidence_score: number | null
          correction_notes: string | null
          created_at: string
          id: string
          learned_response_id: string | null
          reasoning: string
          user_id: string
          was_correct: boolean | null
        }
        Insert: {
          action_taken: string
          communication_id?: string | null
          confidence_score?: number | null
          correction_notes?: string | null
          created_at?: string
          id?: string
          learned_response_id?: string | null
          reasoning: string
          user_id: string
          was_correct?: boolean | null
        }
        Update: {
          action_taken?: string
          communication_id?: string | null
          confidence_score?: number | null
          correction_notes?: string | null
          created_at?: string
          id?: string
          learned_response_id?: string | null
          reasoning?: string
          user_id?: string
          was_correct?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "assistant_ai_logs_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "assistant_communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_ai_logs_learned_response_id_fkey"
            columns: ["learned_response_id"]
            isOneToOne: false
            referencedRelation: "assistant_learned_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_communications: {
        Row: {
          ai_confidence_score: number | null
          ai_reasoning: string | null
          ai_response: string | null
          ai_status: Database["public"]["Enums"]["ai_action_status"]
          category: Database["public"]["Enums"]["comm_category"]
          channel: Database["public"]["Enums"]["comm_channel"]
          content: string
          created_at: string
          human_response: string | null
          human_reviewed_at: string | null
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          metadata: Json | null
          received_at: string
          sender_identifier: string
          sender_name: string | null
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_reasoning?: string | null
          ai_response?: string | null
          ai_status?: Database["public"]["Enums"]["ai_action_status"]
          category?: Database["public"]["Enums"]["comm_category"]
          channel: Database["public"]["Enums"]["comm_channel"]
          content: string
          created_at?: string
          human_response?: string | null
          human_reviewed_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          received_at?: string
          sender_identifier: string
          sender_name?: string | null
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence_score?: number | null
          ai_reasoning?: string | null
          ai_response?: string | null
          ai_status?: Database["public"]["Enums"]["ai_action_status"]
          category?: Database["public"]["Enums"]["comm_category"]
          channel?: Database["public"]["Enums"]["comm_channel"]
          content?: string
          created_at?: string
          human_response?: string | null
          human_reviewed_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          received_at?: string
          sender_identifier?: string
          sender_name?: string | null
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assistant_contacts: {
        Row: {
          ai_summary: string | null
          company: string | null
          created_at: string
          email: string | null
          facebook: string | null
          full_name: string
          id: string
          importance_level: number | null
          instagram: string | null
          last_contact_at: string | null
          linkedin: string | null
          notes: string | null
          phone: string | null
          relationship: string | null
          role: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          ai_summary?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          facebook?: string | null
          full_name: string
          id?: string
          importance_level?: number | null
          instagram?: string | null
          last_contact_at?: string | null
          linkedin?: string | null
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          ai_summary?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          facebook?: string | null
          full_name?: string
          id?: string
          importance_level?: number | null
          instagram?: string | null
          last_contact_at?: string | null
          linkedin?: string | null
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      assistant_ignore_rules: {
        Row: {
          action: string
          created_at: string
          id: string
          is_active: boolean | null
          match_count: number | null
          rule_name: string
          rule_type: string
          rule_value: string
          target_category: Database["public"]["Enums"]["comm_category"] | null
          user_id: string
        }
        Insert: {
          action?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          match_count?: number | null
          rule_name: string
          rule_type: string
          rule_value: string
          target_category?: Database["public"]["Enums"]["comm_category"] | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          match_count?: number | null
          rule_name?: string
          rule_type?: string
          rule_value?: string
          target_category?: Database["public"]["Enums"]["comm_category"] | null
          user_id?: string
        }
        Relationships: []
      }
      assistant_integrations: {
        Row: {
          channel: Database["public"]["Enums"]["comm_channel"]
          config: Json | null
          created_at: string
          error_message: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          sync_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["comm_channel"]
          config?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["comm_channel"]
          config?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assistant_learned_responses: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          is_auto_respond: boolean | null
          last_used_at: string | null
          priority: number | null
          response_template: string
          trigger_category: Database["public"]["Enums"]["comm_category"] | null
          trigger_channel: Database["public"]["Enums"]["comm_channel"] | null
          trigger_keywords: string[]
          updated_at: string
          use_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_auto_respond?: boolean | null
          last_used_at?: string | null
          priority?: number | null
          response_template: string
          trigger_category?: Database["public"]["Enums"]["comm_category"] | null
          trigger_channel?: Database["public"]["Enums"]["comm_channel"] | null
          trigger_keywords: string[]
          updated_at?: string
          use_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_auto_respond?: boolean | null
          last_used_at?: string | null
          priority?: number | null
          response_template?: string
          trigger_category?: Database["public"]["Enums"]["comm_category"] | null
          trigger_channel?: Database["public"]["Enums"]["comm_channel"] | null
          trigger_keywords?: string[]
          updated_at?: string
          use_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      assistant_tasks: {
        Row: {
          ai_created: boolean | null
          assigned_to_contact_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          source_communication_id: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_created?: boolean | null
          assigned_to_contact_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          source_communication_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_created?: boolean | null
          assigned_to_contact_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          source_communication_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_tasks_assigned_to_contact_id_fkey"
            columns: ["assigned_to_contact_id"]
            isOneToOne: false
            referencedRelation: "assistant_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_tasks_source_communication_id_fkey"
            columns: ["source_communication_id"]
            isOneToOne: false
            referencedRelation: "assistant_communications"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: Database["public"]["Enums"]["audit_action_type"]
          created_at: string
          description: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: Database["public"]["Enums"]["audit_resource_type"]
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["audit_action_type"]
          created_at?: string
          description: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type: Database["public"]["Enums"]["audit_resource_type"]
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["audit_action_type"]
          created_at?: string
          description?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: Database["public"]["Enums"]["audit_resource_type"]
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blocked_email_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id?: string
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      broker_activity_stats: {
        Row: {
          calls_made: number | null
          chats_sent: number | null
          created_at: string | null
          date: string
          deals_closed: number | null
          emails_sent: number | null
          id: string
          leads_contacted: number | null
          points_earned: number | null
          updated_at: string | null
          user_id: string
          visits_completed: number | null
        }
        Insert: {
          calls_made?: number | null
          chats_sent?: number | null
          created_at?: string | null
          date?: string
          deals_closed?: number | null
          emails_sent?: number | null
          id?: string
          leads_contacted?: number | null
          points_earned?: number | null
          updated_at?: string | null
          user_id: string
          visits_completed?: number | null
        }
        Update: {
          calls_made?: number | null
          chats_sent?: number | null
          created_at?: string | null
          date?: string
          deals_closed?: number | null
          emails_sent?: number | null
          id?: string
          leads_contacted?: number | null
          points_earned?: number | null
          updated_at?: string | null
          user_id?: string
          visits_completed?: number | null
        }
        Relationships: []
      }
      broker_call_logs: {
        Row: {
          call_status: string | null
          call_type: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          lead_id: string | null
          notes: string | null
          phone_number: string
          recording_url: string | null
          user_id: string
        }
        Insert: {
          call_status?: string | null
          call_type?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          phone_number: string
          recording_url?: string | null
          user_id: string
        }
        Update: {
          call_status?: string | null
          call_type?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          phone_number?: string
          recording_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_chat_logs: {
        Row: {
          contact_number: string | null
          created_at: string | null
          id: string
          last_message_at: string | null
          lead_id: string | null
          message_count: number | null
          notes: string | null
          platform: string | null
          user_id: string
        }
        Insert: {
          contact_number?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          message_count?: number | null
          notes?: string | null
          platform?: string | null
          user_id: string
        }
        Update: {
          contact_number?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          message_count?: number | null
          notes?: string | null
          platform?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_chat_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_contracts: {
        Row: {
          contract_content: string | null
          contract_type: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          is_signed: boolean | null
          signature_data: string | null
          signed_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          contract_content?: string | null
          contract_type?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          is_signed?: boolean | null
          signature_data?: string | null
          signed_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          contract_content?: string | null
          contract_type?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          is_signed?: boolean | null
          signature_data?: string | null
          signed_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      broker_course_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          module_id: string
          progress_percent: number | null
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          module_id: string
          progress_percent?: number | null
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          module_id?: string
          progress_percent?: number | null
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_course_progress_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "broker_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_onboarding_progress: {
        Row: {
          company_training_completed: boolean | null
          contract_signed: boolean | null
          created_at: string
          current_step: number | null
          hr_intro_completed: boolean | null
          id: string
          onboarding_complete: boolean | null
          points_earned: number | null
          profile_completed: boolean | null
          rewards_claimed: string[] | null
          role_confirmed: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_training_completed?: boolean | null
          contract_signed?: boolean | null
          created_at?: string
          current_step?: number | null
          hr_intro_completed?: boolean | null
          id?: string
          onboarding_complete?: boolean | null
          points_earned?: number | null
          profile_completed?: boolean | null
          rewards_claimed?: string[] | null
          role_confirmed?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_training_completed?: boolean | null
          contract_signed?: boolean | null
          created_at?: string
          current_step?: number | null
          hr_intro_completed?: boolean | null
          id?: string
          onboarding_complete?: boolean | null
          points_earned?: number | null
          profile_completed?: boolean | null
          rewards_claimed?: string[] | null
          role_confirmed?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      broker_pdf_exports: {
        Row: {
          ai_recommendation: string | null
          broker_company: string | null
          broker_email: string | null
          broker_logo_url: string | null
          broker_name: string | null
          broker_phone: string | null
          broker_photo_url: string | null
          created_at: string
          custom_branding: Json | null
          hide_prices: boolean | null
          id: string
          pdf_url: string | null
          project_ids: string[]
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          ai_recommendation?: string | null
          broker_company?: string | null
          broker_email?: string | null
          broker_logo_url?: string | null
          broker_name?: string | null
          broker_phone?: string | null
          broker_photo_url?: string | null
          created_at?: string
          custom_branding?: Json | null
          hide_prices?: boolean | null
          id?: string
          pdf_url?: string | null
          project_ids: string[]
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          ai_recommendation?: string | null
          broker_company?: string | null
          broker_email?: string | null
          broker_logo_url?: string | null
          broker_name?: string | null
          broker_phone?: string | null
          broker_photo_url?: string | null
          created_at?: string
          custom_branding?: Json | null
          hide_prices?: boolean | null
          id?: string
          pdf_url?: string | null
          project_ids?: string[]
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_pdf_exports_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "broker_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_points: {
        Row: {
          created_at: string | null
          id: string
          level: number | null
          points: number | null
          total_points_earned: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: number | null
          points?: number | null
          total_points_earned?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: number | null
          points?: number | null
          total_points_earned?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      broker_profiles: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string
          email: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          languages: string[] | null
          phone: string | null
          photo_url: string | null
          specializations: string[] | null
          title: string | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          languages?: string[] | null
          phone?: string | null
          photo_url?: string | null
          specializations?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          languages?: string[] | null
          phone?: string | null
          photo_url?: string | null
          specializations?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      broker_subscriptions: {
        Row: {
          ai_credits_limit: number | null
          ai_credits_used: number
          company_name: string | null
          created_at: string
          currency: string
          device_fingerprints: string[] | null
          email: string
          expires_at: string | null
          full_name: string | null
          id: string
          last_device_fingerprint: string | null
          payment_method: string | null
          payment_reference: string | null
          pdf_downloads: number
          phone: string | null
          price_usd: number
          registered_ips: string[] | null
          rera_number: string | null
          selected_addons: string[] | null
          starts_at: string | null
          status: string
          terms_accepted_at: string | null
          tier: string
          trial_ends_at: string | null
          updated_at: string
          user_id: string
          user_role: string | null
        }
        Insert: {
          ai_credits_limit?: number | null
          ai_credits_used?: number
          company_name?: string | null
          created_at?: string
          currency?: string
          device_fingerprints?: string[] | null
          email: string
          expires_at?: string | null
          full_name?: string | null
          id?: string
          last_device_fingerprint?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          pdf_downloads?: number
          phone?: string | null
          price_usd?: number
          registered_ips?: string[] | null
          rera_number?: string | null
          selected_addons?: string[] | null
          starts_at?: string | null
          status?: string
          terms_accepted_at?: string | null
          tier?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
          user_role?: string | null
        }
        Update: {
          ai_credits_limit?: number | null
          ai_credits_used?: number
          company_name?: string | null
          created_at?: string
          currency?: string
          device_fingerprints?: string[] | null
          email?: string
          expires_at?: string | null
          full_name?: string | null
          id?: string
          last_device_fingerprint?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          pdf_downloads?: number
          phone?: string | null
          price_usd?: number
          registered_ips?: string[] | null
          rera_number?: string | null
          selected_addons?: string[] | null
          starts_at?: string | null
          status?: string
          terms_accepted_at?: string | null
          tier?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
          user_role?: string | null
        }
        Relationships: []
      }
      broker_tasks: {
        Row: {
          assigned_by: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          developer_id: string | null
          due_date: string | null
          id: string
          points_reward: number | null
          scheduled_time: string | null
          status: Database["public"]["Enums"]["broker_task_status"] | null
          task_type: Database["public"]["Enums"]["broker_task_type"]
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          developer_id?: string | null
          due_date?: string | null
          id?: string
          points_reward?: number | null
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["broker_task_status"] | null
          task_type: Database["public"]["Enums"]["broker_task_type"]
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          developer_id?: string | null
          due_date?: string | null
          id?: string
          points_reward?: number | null
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["broker_task_status"] | null
          task_type?: Database["public"]["Enums"]["broker_task_type"]
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_tasks_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "uae_developers"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_training_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          module_id: string
          quiz_score: number | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          module_id: string
          quiz_score?: number | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          module_id?: string
          quiz_score?: number | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_training_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "hr_training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          page_source: string | null
          rating: number | null
          rating_feedback: string | null
          service_type: string | null
          status: string
          updated_at: string
          user_email: string
          user_name: string | null
          user_phone: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          page_source?: string | null
          rating?: number | null
          rating_feedback?: string | null
          service_type?: string | null
          status?: string
          updated_at?: string
          user_email: string
          user_name?: string | null
          user_phone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          page_source?: string | null
          rating?: number | null
          rating_feedback?: string | null
          service_type?: string | null
          status?: string
          updated_at?: string
          user_email?: string
          user_name?: string | null
          user_phone?: string | null
        }
        Relationships: []
      }
      claimed_rewards: {
        Row: {
          claimed_at: string | null
          fulfilled_at: string | null
          id: string
          points_spent: number
          reward_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          fulfilled_at?: string | null
          id?: string
          points_spent: number
          reward_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          fulfilled_at?: string | null
          id?: string
          points_spent?: number
          reward_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claimed_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_access_logs: {
        Row: {
          accessed_at: string
          completed: boolean | null
          content_id: string
          content_type: string
          device_fingerprint: string | null
          duration_seconds: number | null
          id: string
          ip_address: string | null
          should_delete_at: string | null
          subscription_id: string | null
          user_id: string
          watermark_id: string
        }
        Insert: {
          accessed_at?: string
          completed?: boolean | null
          content_id: string
          content_type: string
          device_fingerprint?: string | null
          duration_seconds?: number | null
          id?: string
          ip_address?: string | null
          should_delete_at?: string | null
          subscription_id?: string | null
          user_id: string
          watermark_id: string
        }
        Update: {
          accessed_at?: string
          completed?: boolean | null
          content_id?: string
          content_type?: string
          device_fingerprint?: string | null
          duration_seconds?: number | null
          id?: string
          ip_address?: string | null
          should_delete_at?: string | null
          subscription_id?: string | null
          user_id?: string
          watermark_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_access_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "broker_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sessions: {
        Row: {
          content_accessed: string[] | null
          created_at: string
          device_fingerprint: string
          expires_at: string
          id: string
          ip_address: string | null
          is_active: boolean
          last_activity_at: string
          session_token: string
          should_delete_at: string | null
          started_at: string
          subscription_id: string | null
          suspicious_activity: boolean | null
          suspicious_reason: string | null
          user_id: string
        }
        Insert: {
          content_accessed?: string[] | null
          created_at?: string
          device_fingerprint: string
          expires_at: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity_at?: string
          session_token: string
          should_delete_at?: string | null
          started_at?: string
          subscription_id?: string | null
          suspicious_activity?: boolean | null
          suspicious_reason?: string | null
          user_id: string
        }
        Update: {
          content_accessed?: string[] | null
          created_at?: string
          device_fingerprint?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity_at?: string
          session_token?: string
          should_delete_at?: string | null
          started_at?: string
          subscription_id?: string | null
          suspicious_activity?: boolean | null
          suspicious_reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sessions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "broker_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["crm_activity_type"]
          created_at: string
          id: string
          lead_id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["crm_activity_type"]
          created_at?: string
          id?: string
          lead_id: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["crm_activity_type"]
          created_at?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      crm_calls: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          lead_id: string
          notes: string | null
          outcome: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          outcome?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          outcome?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_calls_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaign_recipients: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          lead_id: string | null
          opened_at: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaign_recipients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_email_campaigns: {
        Row: {
          created_at: string | null
          failed_count: number | null
          html_content: string
          id: string
          name: string
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number | null
          status: string | null
          subject: string
          target_contact_types:
            | Database["public"]["Enums"]["crm_contact_type"][]
            | null
          target_lead_ids: string[] | null
          target_tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          failed_count?: number | null
          html_content: string
          id?: string
          name: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject: string
          target_contact_types?:
            | Database["public"]["Enums"]["crm_contact_type"][]
            | null
          target_lead_ids?: string[] | null
          target_tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          failed_count?: number | null
          html_content?: string
          id?: string
          name?: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject?: string
          target_contact_types?:
            | Database["public"]["Enums"]["crm_contact_type"][]
            | null
          target_lead_ids?: string[] | null
          target_tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crm_imports: {
        Row: {
          completed_at: string | null
          created_at: string
          duplicates: number | null
          error_report_url: string | null
          failed: number | null
          file_name: string | null
          id: string
          inserted: number | null
          merged: number | null
          source_type: Database["public"]["Enums"]["crm_import_source"]
          status: string
          total_rows: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duplicates?: number | null
          error_report_url?: string | null
          failed?: number | null
          file_name?: string | null
          id?: string
          inserted?: number | null
          merged?: number | null
          source_type?: Database["public"]["Enums"]["crm_import_source"]
          status?: string
          total_rows?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duplicates?: number | null
          error_report_url?: string | null
          failed?: number | null
          file_name?: string | null
          id?: string
          inserted?: number | null
          merged?: number | null
          source_type?: Database["public"]["Enums"]["crm_import_source"]
          status?: string
          total_rows?: number | null
          user_id?: string
        }
        Relationships: []
      }
      crm_lead_assignments: {
        Row: {
          assigned_at: string
          assigned_by_user_id: string | null
          assigned_to_user_id: string
          id: string
          lead_id: string
          unassigned_at: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by_user_id?: string | null
          assigned_to_user_id: string
          id?: string
          lead_id: string
          unassigned_at?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by_user_id?: string | null
          assigned_to_user_id?: string
          id?: string
          lead_id?: string
          unassigned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_state_per_user: {
        Row: {
          created_at: string
          id: string
          is_hidden: boolean
          is_junk: boolean
          junk_reason: string | null
          last_touch_at: string | null
          lead_id: string
          next_followup_at: string | null
          pipeline_status: Database["public"]["Enums"]["crm_pipeline_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_hidden?: boolean
          is_junk?: boolean
          junk_reason?: string | null
          last_touch_at?: string | null
          lead_id: string
          next_followup_at?: string | null
          pipeline_status?: Database["public"]["Enums"]["crm_pipeline_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_hidden?: boolean
          is_junk?: boolean
          junk_reason?: string | null
          last_touch_at?: string | null
          lead_id?: string
          next_followup_at?: string | null
          pipeline_status?: Database["public"]["Enums"]["crm_pipeline_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_state_per_user_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          age_range: string | null
          auto_detected_type: boolean | null
          birthday: string | null
          company_name: string | null
          contact_type: Database["public"]["Enums"]["crm_contact_type"] | null
          created_at: string
          created_by_user_id: string | null
          current_location_city: string | null
          current_location_country: string | null
          detection_keywords: string[] | null
          email_lower: string | null
          full_name: string
          gender: string | null
          id: string
          import_approval_status:
            | Database["public"]["Enums"]["crm_import_approval_status"]
            | null
          lead_source_type: string | null
          nationality: string | null
          owner_type: Database["public"]["Enums"]["crm_lead_owner_type"]
          owner_user_id: string | null
          phone_e164: string | null
          preferred_language: string | null
          source: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          auto_detected_type?: boolean | null
          birthday?: string | null
          company_name?: string | null
          contact_type?: Database["public"]["Enums"]["crm_contact_type"] | null
          created_at?: string
          created_by_user_id?: string | null
          current_location_city?: string | null
          current_location_country?: string | null
          detection_keywords?: string[] | null
          email_lower?: string | null
          full_name: string
          gender?: string | null
          id?: string
          import_approval_status?:
            | Database["public"]["Enums"]["crm_import_approval_status"]
            | null
          lead_source_type?: string | null
          nationality?: string | null
          owner_type?: Database["public"]["Enums"]["crm_lead_owner_type"]
          owner_user_id?: string | null
          phone_e164?: string | null
          preferred_language?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          auto_detected_type?: boolean | null
          birthday?: string | null
          company_name?: string | null
          contact_type?: Database["public"]["Enums"]["crm_contact_type"] | null
          created_at?: string
          created_by_user_id?: string | null
          current_location_city?: string | null
          current_location_country?: string | null
          detection_keywords?: string[] | null
          email_lower?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          import_approval_status?:
            | Database["public"]["Enums"]["crm_import_approval_status"]
            | null
          lead_source_type?: string | null
          nationality?: string | null
          owner_type?: Database["public"]["Enums"]["crm_lead_owner_type"]
          owner_user_id?: string | null
          phone_e164?: string | null
          preferred_language?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      crm_notes: {
        Row: {
          body: string
          created_at: string
          id: string
          lead_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          lead_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          lead_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          lead_id: string | null
          notes: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_users_profile: {
        Row: {
          created_at: string
          crm_role: Database["public"]["Enums"]["crm_role"]
          display_name: string | null
          id: string
          is_active: boolean
          preferred_language: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          crm_role?: Database["public"]["Enums"]["crm_role"]
          display_name?: string | null
          id?: string
          is_active?: boolean
          preferred_language?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          crm_role?: Database["public"]["Enums"]["crm_role"]
          display_name?: string | null
          id?: string
          is_active?: boolean
          preferred_language?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      developer_sales_reps: {
        Row: {
          created_at: string
          developer_id: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          notes: string | null
          phone_e164: string
          title: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          developer_id: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          notes?: string | null
          phone_e164: string
          title?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          developer_id?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          notes?: string | null
          phone_e164?: string
          title?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "developer_sales_reps_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "uae_developers"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_visit_checkins: {
        Row: {
          check_in_latitude: number | null
          check_in_longitude: number | null
          check_in_photo_url: string | null
          check_in_time: string
          check_out_latitude: number | null
          check_out_longitude: number | null
          check_out_photo_url: string | null
          check_out_time: string | null
          confirmation_statement: boolean | null
          created_at: string | null
          developer_id: string
          id: string
          notes: string | null
          signature_data: string | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_photo_url?: string | null
          check_in_time?: string
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_photo_url?: string | null
          check_out_time?: string | null
          confirmation_statement?: boolean | null
          created_at?: string | null
          developer_id: string
          id?: string
          notes?: string | null
          signature_data?: string | null
          task_id?: string | null
          user_id: string
        }
        Update: {
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_photo_url?: string | null
          check_in_time?: string
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_photo_url?: string | null
          check_out_time?: string | null
          confirmation_statement?: boolean | null
          created_at?: string | null
          developer_id?: string
          id?: string
          notes?: string | null
          signature_data?: string | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_visit_checkins_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "uae_developers"
            referencedColumns: ["id"]
          },
        ]
      }
      developers: {
        Row: {
          completed_projects: number | null
          created_at: string
          description: string | null
          founded_year: number | null
          headquarters: string | null
          id: string
          logo_url: string | null
          name: string
          offplan_projects: number | null
          portfolio_worth: number | null
          rank: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          completed_projects?: number | null
          created_at?: string
          description?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          logo_url?: string | null
          name: string
          offplan_projects?: number | null
          portfolio_worth?: number | null
          rank?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          completed_projects?: number | null
          created_at?: string
          description?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          offplan_projects?: number | null
          portfolio_worth?: number | null
          rank?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      discount_code_usages: {
        Row: {
          discount_applied: number
          discount_code_id: string
          final_price: number
          id: string
          original_price: number
          subscription_id: string | null
          used_at: string
          user_email: string
          user_id: string
        }
        Insert: {
          discount_applied: number
          discount_code_id: string
          final_price: number
          id?: string
          original_price: number
          subscription_id?: string | null
          used_at?: string
          user_email: string
          user_id: string
        }
        Update: {
          discount_applied?: number
          discount_code_id?: string
          final_price?: number
          id?: string
          original_price?: number
          subscription_id?: string | null
          used_at?: string
          user_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_code_usages_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_code_usages_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "broker_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          applicable_tiers: string[] | null
          assigned_to_email: string | null
          assigned_to_user_id: string | null
          code: string
          code_hash: string
          created_at: string
          created_by: string
          current_uses: number
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          is_single_use_per_user: boolean | null
          max_uses: number | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_tiers?: string[] | null
          assigned_to_email?: string | null
          assigned_to_user_id?: string | null
          code: string
          code_hash: string
          created_at?: string
          created_by: string
          current_uses?: number
          description?: string | null
          discount_type: string
          discount_value?: number
          id?: string
          is_active?: boolean
          is_single_use_per_user?: boolean | null
          max_uses?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_tiers?: string[] | null
          assigned_to_email?: string | null
          assigned_to_user_id?: string | null
          code?: string
          code_hash?: string
          created_at?: string
          created_by?: string
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          is_single_use_per_user?: boolean | null
          max_uses?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      email_verifications: {
        Row: {
          attempts: number | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          lead_id: string | null
          otp_code: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          lead_id?: string | null
          otp_code: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          lead_id?: string | null
          otp_code?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_verifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_requests: {
        Row: {
          ai_comparison: string | null
          created_at: string
          id: string
          project_ids: string[]
          status: string
          user_email: string
          user_id: string | null
          user_name: string | null
          user_phone: string | null
        }
        Insert: {
          ai_comparison?: string | null
          created_at?: string
          id?: string
          project_ids: string[]
          status?: string
          user_email: string
          user_id?: string | null
          user_name?: string | null
          user_phone?: string | null
        }
        Update: {
          ai_comparison?: string | null
          created_at?: string
          id?: string
          project_ids?: string[]
          status?: string
          user_email?: string
          user_id?: string | null
          user_name?: string | null
          user_phone?: string | null
        }
        Relationships: []
      }
      executive_assistant_settings: {
        Row: {
          assistant_name: string | null
          auto_reply_enabled: boolean | null
          created_at: string | null
          daily_report_time: string | null
          encryption_key_hash: string | null
          id: string
          report_delivery_method: string | null
          response_speed: string | null
          updated_at: string | null
          user_id: string
          voice_style: string | null
        }
        Insert: {
          assistant_name?: string | null
          auto_reply_enabled?: boolean | null
          created_at?: string | null
          daily_report_time?: string | null
          encryption_key_hash?: string | null
          id?: string
          report_delivery_method?: string | null
          response_speed?: string | null
          updated_at?: string | null
          user_id: string
          voice_style?: string | null
        }
        Update: {
          assistant_name?: string | null
          auto_reply_enabled?: boolean | null
          created_at?: string | null
          daily_report_time?: string | null
          encryption_key_hash?: string | null
          id?: string
          report_delivery_method?: string | null
          response_speed?: string | null
          updated_at?: string | null
          user_id?: string
          voice_style?: string | null
        }
        Relationships: []
      }
      executive_audit_logs: {
        Row: {
          action: string
          audit_type: string
          audited_at: string | null
          compliance_status: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          issues_found: string[] | null
          new_state: Json | null
          previous_state: Json | null
          severity: string | null
          user_id: string
        }
        Insert: {
          action: string
          audit_type: string
          audited_at?: string | null
          compliance_status?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          issues_found?: string[] | null
          new_state?: Json | null
          previous_state?: Json | null
          severity?: string | null
          user_id: string
        }
        Update: {
          action?: string
          audit_type?: string
          audited_at?: string | null
          compliance_status?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          issues_found?: string[] | null
          new_state?: Json | null
          previous_state?: Json | null
          severity?: string | null
          user_id?: string
        }
        Relationships: []
      }
      executive_budget_categories: {
        Row: {
          category_name: string
          color_code: string | null
          created_at: string | null
          current_spent: number | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          monthly_limit: number | null
          priority_level: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_name: string
          color_code?: string | null
          created_at?: string | null
          current_spent?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          monthly_limit?: number | null
          priority_level?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_name?: string
          color_code?: string | null
          created_at?: string | null
          current_spent?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          monthly_limit?: number | null
          priority_level?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      executive_communications: {
        Row: {
          ai_response_encrypted: string | null
          channel: string
          confidence_score: number | null
          contact_identifier: string
          contact_name: string | null
          created_at: string | null
          direction: string
          flagged_reason: string | null
          handled_by: string | null
          id: string
          message_content_encrypted: string
          phone_line: string | null
          responded_at: string | null
          status: string | null
          subject: string | null
          user_id: string
        }
        Insert: {
          ai_response_encrypted?: string | null
          channel: string
          confidence_score?: number | null
          contact_identifier: string
          contact_name?: string | null
          created_at?: string | null
          direction: string
          flagged_reason?: string | null
          handled_by?: string | null
          id?: string
          message_content_encrypted: string
          phone_line?: string | null
          responded_at?: string | null
          status?: string | null
          subject?: string | null
          user_id: string
        }
        Update: {
          ai_response_encrypted?: string | null
          channel?: string
          confidence_score?: number | null
          contact_identifier?: string
          contact_name?: string | null
          created_at?: string | null
          direction?: string
          flagged_reason?: string | null
          handled_by?: string | null
          id?: string
          message_content_encrypted?: string
          phone_line?: string | null
          responded_at?: string | null
          status?: string | null
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      executive_daily_reports: {
        Row: {
          broker_summary: Json | null
          communications_flagged: number | null
          communications_handled: number | null
          created_at: string | null
          delivered_at: string | null
          delivered_via: string | null
          department_breakdown: Json | null
          financial_summary: Json | null
          id: string
          marketing_summary: Json | null
          recommendations: string[] | null
          report_date: string
          report_excel_url: string | null
          report_pdf_url: string | null
          summary_text: string
          tasks_completed: number | null
          tasks_in_progress: number | null
          tasks_pending: number | null
          user_id: string
        }
        Insert: {
          broker_summary?: Json | null
          communications_flagged?: number | null
          communications_handled?: number | null
          created_at?: string | null
          delivered_at?: string | null
          delivered_via?: string | null
          department_breakdown?: Json | null
          financial_summary?: Json | null
          id?: string
          marketing_summary?: Json | null
          recommendations?: string[] | null
          report_date: string
          report_excel_url?: string | null
          report_pdf_url?: string | null
          summary_text: string
          tasks_completed?: number | null
          tasks_in_progress?: number | null
          tasks_pending?: number | null
          user_id: string
        }
        Update: {
          broker_summary?: Json | null
          communications_flagged?: number | null
          communications_handled?: number | null
          created_at?: string | null
          delivered_at?: string | null
          delivered_via?: string | null
          department_breakdown?: Json | null
          financial_summary?: Json | null
          id?: string
          marketing_summary?: Json | null
          recommendations?: string[] | null
          report_date?: string
          report_excel_url?: string | null
          report_pdf_url?: string | null
          summary_text?: string
          tasks_completed?: number | null
          tasks_in_progress?: number | null
          tasks_pending?: number | null
          user_id?: string
        }
        Relationships: []
      }
      executive_department_tasks: {
        Row: {
          assigned_ai: string | null
          completed_at: string | null
          created_at: string | null
          department: string
          id: string
          input_data: Json | null
          output_data: Json | null
          parent_task_id: string | null
          priority: string | null
          request_id: string | null
          status: string | null
          task_description: string
          user_id: string
        }
        Insert: {
          assigned_ai?: string | null
          completed_at?: string | null
          created_at?: string | null
          department: string
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          parent_task_id?: string | null
          priority?: string | null
          request_id?: string | null
          status?: string | null
          task_description: string
          user_id: string
        }
        Update: {
          assigned_ai?: string | null
          completed_at?: string | null
          created_at?: string | null
          department?: string
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          parent_task_id?: string | null
          priority?: string | null
          request_id?: string | null
          status?: string | null
          task_description?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "executive_department_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "executive_department_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_financial_transactions: {
        Row: {
          ai_recommendation: string | null
          amount: number
          category: string
          created_at: string | null
          currency: string | null
          description: string
          flag_reason: string | null
          id: string
          is_flagged: boolean | null
          is_recurring: boolean | null
          merchant_name: string | null
          payment_method: string | null
          recurrence_pattern: string | null
          source_file: string | null
          subcategory: string | null
          transaction_date: string
          user_id: string
        }
        Insert: {
          ai_recommendation?: string | null
          amount: number
          category: string
          created_at?: string | null
          currency?: string | null
          description: string
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          is_recurring?: boolean | null
          merchant_name?: string | null
          payment_method?: string | null
          recurrence_pattern?: string | null
          source_file?: string | null
          subcategory?: string | null
          transaction_date: string
          user_id: string
        }
        Update: {
          ai_recommendation?: string | null
          amount?: number
          category?: string
          created_at?: string | null
          currency?: string | null
          description?: string
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          is_recurring?: boolean | null
          merchant_name?: string | null
          payment_method?: string | null
          recurrence_pattern?: string | null
          source_file?: string | null
          subcategory?: string | null
          transaction_date?: string
          user_id?: string
        }
        Relationships: []
      }
      executive_training_samples: {
        Row: {
          context_notes: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          original_message: string
          response_example: string
          sample_type: string
          tone_tags: string[] | null
          user_id: string
        }
        Insert: {
          context_notes?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          original_message: string
          response_example: string
          sample_type: string
          tone_tags?: string[] | null
          user_id: string
        }
        Update: {
          context_notes?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          original_message?: string
          response_example?: string
          sample_type?: string
          tone_tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      function_rate_limits: {
        Row: {
          created_at: string
          function_name: string
          id: string
          rate_key: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          rate_key: string
          request_count?: number
          window_start: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          rate_key?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      hr_agent_conversations: {
        Row: {
          application_id: string | null
          created_at: string
          id: string
          messages: Json
          qualification_data: Json | null
          stage: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          id?: string
          messages?: Json
          qualification_data?: Json | null
          stage?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          id?: string
          messages?: Json
          qualification_data?: Json | null
          stage?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_agent_conversations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "hr_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_applications: {
        Row: {
          consent_accurate: boolean
          consent_terms: boolean
          created_at: string
          current_location_city: string
          current_location_country: string
          cv_url: string | null
          email: string
          full_name: string
          id: string
          nationality: string
          phone_e164: string
          preferred_language: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["hr_application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          consent_accurate?: boolean
          consent_terms?: boolean
          created_at?: string
          current_location_city: string
          current_location_country: string
          cv_url?: string | null
          email: string
          full_name: string
          id?: string
          nationality: string
          phone_e164: string
          preferred_language?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["hr_application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          consent_accurate?: boolean
          consent_terms?: boolean
          created_at?: string
          current_location_city?: string
          current_location_country?: string
          cv_url?: string | null
          email?: string
          full_name?: string
          id?: string
          nationality?: string
          phone_e164?: string
          preferred_language?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["hr_application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hr_audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: []
      }
      hr_certificates: {
        Row: {
          certificate_number: string
          combined_score: number
          company_score: number
          created_at: string
          full_name: string
          id: string
          is_revoked: boolean
          issued_at: string
          real_estate_score: number
          revoked_at: string | null
          revoked_reason: string | null
          track: string
          user_id: string
          verification_token: string
        }
        Insert: {
          certificate_number: string
          combined_score?: number
          company_score?: number
          created_at?: string
          full_name: string
          id?: string
          is_revoked?: boolean
          issued_at?: string
          real_estate_score?: number
          revoked_at?: string | null
          revoked_reason?: string | null
          track: string
          user_id: string
          verification_token: string
        }
        Update: {
          certificate_number?: string
          combined_score?: number
          company_score?: number
          created_at?: string
          full_name?: string
          id?: string
          is_revoked?: boolean
          issued_at?: string
          real_estate_score?: number
          revoked_at?: string | null
          revoked_reason?: string | null
          track?: string
          user_id?: string
          verification_token?: string
        }
        Relationships: []
      }
      hr_interview_assessments: {
        Row: {
          ai_analysis: string | null
          application_id: string | null
          communication_score: number | null
          created_at: string
          cultural_fit_score: number | null
          detailed_feedback: string | null
          experience_score: number | null
          id: string
          interview_id: string | null
          interview_transcript: Json | null
          motivation_score: number | null
          overall_score: number | null
          recommendation: string | null
          strengths: string[] | null
          technical_score: number | null
          updated_at: string
          user_id: string
          weaknesses: string[] | null
        }
        Insert: {
          ai_analysis?: string | null
          application_id?: string | null
          communication_score?: number | null
          created_at?: string
          cultural_fit_score?: number | null
          detailed_feedback?: string | null
          experience_score?: number | null
          id?: string
          interview_id?: string | null
          interview_transcript?: Json | null
          motivation_score?: number | null
          overall_score?: number | null
          recommendation?: string | null
          strengths?: string[] | null
          technical_score?: number | null
          updated_at?: string
          user_id: string
          weaknesses?: string[] | null
        }
        Update: {
          ai_analysis?: string | null
          application_id?: string | null
          communication_score?: number | null
          created_at?: string
          cultural_fit_score?: number | null
          detailed_feedback?: string | null
          experience_score?: number | null
          id?: string
          interview_id?: string | null
          interview_transcript?: Json | null
          motivation_score?: number | null
          overall_score?: number | null
          recommendation?: string | null
          strengths?: string[] | null
          technical_score?: number | null
          updated_at?: string
          user_id?: string
          weaknesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_interview_assessments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "hr_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_interview_assessments_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "hr_interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_interviews: {
        Row: {
          application_id: string | null
          created_at: string
          id: string
          interview_type: string
          meeting_link: string | null
          notes: string | null
          scheduled_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          id?: string
          interview_type?: string
          meeting_link?: string | null
          notes?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          id?: string
          interview_type?: string
          meeting_link?: string | null
          notes?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "hr_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_modules: {
        Row: {
          content: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          key_points: Json | null
          title: string
          track: Database["public"]["Enums"]["hr_module_track"]
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          key_points?: Json | null
          title: string
          track: Database["public"]["Enums"]["hr_module_track"]
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          key_points?: Json | null
          title?: string
          track?: Database["public"]["Enums"]["hr_module_track"]
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      hr_quiz_attempts: {
        Row: {
          answers_json: Json
          attempted_at: string
          id: string
          module_id: string
          passed: boolean
          score: number
          user_id: string
        }
        Insert: {
          answers_json?: Json
          attempted_at?: string
          id?: string
          module_id: string
          passed?: boolean
          score?: number
          user_id: string
        }
        Update: {
          answers_json?: Json
          attempted_at?: string
          id?: string
          module_id?: string
          passed?: boolean
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_quiz_attempts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "hr_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          display_order: number
          explanation: string | null
          id: string
          is_active: boolean
          module_id: string
          options: Json | null
          question: string
          question_type: Database["public"]["Enums"]["hr_question_type"]
        }
        Insert: {
          correct_answer: string
          created_at?: string
          display_order?: number
          explanation?: string | null
          id?: string
          is_active?: boolean
          module_id: string
          options?: Json | null
          question: string
          question_type?: Database["public"]["Enums"]["hr_question_type"]
        }
        Update: {
          correct_answer?: string
          created_at?: string
          display_order?: number
          explanation?: string | null
          id?: string
          is_active?: boolean
          module_id?: string
          options?: Json | null
          question?: string
          question_type?: Database["public"]["Enums"]["hr_question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "hr_quiz_questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "hr_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hr_training_modules: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_minutes: number | null
          id: string
          is_required: boolean | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          is_required?: boolean | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          is_required?: boolean | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      hr_user_roles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["hr_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["hr_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["hr_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ip_blocklist: {
        Row: {
          block_count: number
          blocked_at: string
          blocked_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          ip_address: string
          is_permanent: boolean
          last_attempt_at: string | null
          reason: string | null
        }
        Insert: {
          block_count?: number
          blocked_at?: string
          blocked_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address: string
          is_permanent?: boolean
          last_attempt_at?: string | null
          reason?: string | null
        }
        Update: {
          block_count?: number
          blocked_at?: string
          blocked_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: string
          is_permanent?: boolean
          last_attempt_at?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      jbj_analytics: {
        Row: {
          action_type: string
          created_at: string
          id: string
          metadata: Json | null
          tool_category: string | null
          tool_name: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          tool_category?: string | null
          tool_name: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          tool_category?: string | null
          tool_name?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      jbj_issue_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          issue_category: string | null
          issue_description: string
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          tool_name: string
          updated_at: string
          user_email: string | null
          user_id: string | null
          user_name: string | null
          user_phone: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          issue_category?: string | null
          issue_description: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          tool_name: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          user_phone?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          issue_category?: string | null
          issue_description?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          tool_name?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          user_phone?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          age_range: string | null
          birthday: string | null
          consent_accurate: boolean | null
          consent_privacy: boolean | null
          created_at: string
          current_location: string | null
          email: string
          email_verified: boolean | null
          full_name: string | null
          honeypot: string | null
          id: string
          language: string | null
          nationality: string | null
          page_source: string | null
          phone: string | null
          phone_verified: boolean | null
          source: string
          status: string | null
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          birthday?: string | null
          consent_accurate?: boolean | null
          consent_privacy?: boolean | null
          created_at?: string
          current_location?: string | null
          email: string
          email_verified?: boolean | null
          full_name?: string | null
          honeypot?: string | null
          id?: string
          language?: string | null
          nationality?: string | null
          page_source?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          source: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          birthday?: string | null
          consent_accurate?: boolean | null
          consent_privacy?: boolean | null
          created_at?: string
          current_location?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string | null
          honeypot?: string | null
          id?: string
          language?: string | null
          nationality?: string | null
          page_source?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          source?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string
          currency: string
          email: string
          expires_at: string | null
          full_name: string | null
          id: string
          payment_method: string | null
          payment_reference: string | null
          phone: string | null
          plan_type: string
          price_usd: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          email: string
          expires_at?: string | null
          full_name?: string | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          phone?: string | null
          plan_type?: string
          price_usd?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          email?: string
          expires_at?: string | null
          full_name?: string | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          phone?: string | null
          plan_type?: string
          price_usd?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          joined_at: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          settings: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          settings?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          settings?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      phone_verifications: {
        Row: {
          attempts: number | null
          created_at: string | null
          email: string | null
          expires_at: string
          id: string
          lead_id: string | null
          otp_code: string
          phone_number: string
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          email?: string | null
          expires_at: string
          id?: string
          lead_id?: string | null
          otp_code: string
          phone_number: string
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          lead_id?: string | null
          otp_code?: string
          phone_number?: string
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phone_verifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      points_transactions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          points: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_public: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          consent_timestamp: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          marketing_consent: boolean | null
          phone_number: string | null
          phone_verified: boolean | null
          updated_at: string
          user_role: string | null
        }
        Insert: {
          consent_timestamp?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          marketing_consent?: boolean | null
          phone_number?: string | null
          phone_verified?: boolean | null
          updated_at?: string
          user_role?: string | null
        }
        Update: {
          consent_timestamp?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          marketing_consent?: boolean | null
          phone_number?: string | null
          phone_verified?: boolean | null
          updated_at?: string
          user_role?: string | null
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          project_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          project_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          amenities: string[] | null
          bedrooms_max: number | null
          bedrooms_min: number | null
          community_id: string | null
          created_at: string
          description: string | null
          developer_id: string | null
          emirate: string | null
          facilities: string[] | null
          floors: number | null
          furnished_status: string | null
          handover_date: string | null
          id: string
          is_featured: boolean | null
          location: string | null
          name: string
          payment_plan: string | null
          price_from: number | null
          price_to: number | null
          service_charge: string | null
          size_max: number | null
          size_min: number | null
          slug: string
          status: string | null
          updated_at: string
          views: string[] | null
        }
        Insert: {
          amenities?: string[] | null
          bedrooms_max?: number | null
          bedrooms_min?: number | null
          community_id?: string | null
          created_at?: string
          description?: string | null
          developer_id?: string | null
          emirate?: string | null
          facilities?: string[] | null
          floors?: number | null
          furnished_status?: string | null
          handover_date?: string | null
          id?: string
          is_featured?: boolean | null
          location?: string | null
          name: string
          payment_plan?: string | null
          price_from?: number | null
          price_to?: number | null
          service_charge?: string | null
          size_max?: number | null
          size_min?: number | null
          slug: string
          status?: string | null
          updated_at?: string
          views?: string[] | null
        }
        Update: {
          amenities?: string[] | null
          bedrooms_max?: number | null
          bedrooms_min?: number | null
          community_id?: string | null
          created_at?: string
          description?: string | null
          developer_id?: string | null
          emirate?: string | null
          facilities?: string[] | null
          floors?: number | null
          furnished_status?: string | null
          handover_date?: string | null
          id?: string
          is_featured?: boolean | null
          location?: string | null
          name?: string
          payment_plan?: string | null
          price_from?: number | null
          price_to?: number | null
          service_charge?: string | null
          size_max?: number | null
          size_min?: number | null
          slug?: string
          status?: string | null
          updated_at?: string
          views?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      pwa_analytics: {
        Row: {
          browser: string | null
          created_at: string
          device_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          page_url: string | null
          platform: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          platform?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          platform?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          answers: Json
          created_at: string
          id: string
          recommended_project_ids: string[] | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          answers: Json
          created_at?: string
          id?: string
          recommended_project_ids?: string[] | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          recommended_project_ids?: string[] | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_records: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          identifier: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      referral_commissions: {
        Row: {
          created_at: string
          developer_commission_aed: number
          developer_commission_percent: number
          id: string
          notes: string | null
          payment_date: string | null
          payment_reference: string | null
          property_name: string
          property_value_aed: number
          referral_commission_aed: number
          referral_lead_id: string | null
          referral_partner_id: string
          referral_percent: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          developer_commission_aed: number
          developer_commission_percent: number
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_reference?: string | null
          property_name: string
          property_value_aed: number
          referral_commission_aed: number
          referral_lead_id?: string | null
          referral_partner_id: string
          referral_percent?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          developer_commission_aed?: number
          developer_commission_percent?: number
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_reference?: string | null
          property_name?: string
          property_value_aed?: number
          referral_commission_aed?: number
          referral_lead_id?: string | null
          referral_partner_id?: string
          referral_percent?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_referral_lead_id_fkey"
            columns: ["referral_lead_id"]
            isOneToOne: false
            referencedRelation: "referral_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_referral_partner_id_fkey"
            columns: ["referral_partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_leads: {
        Row: {
          budget_range: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          id: string
          notes: string | null
          property_interest: string | null
          referral_code: string
          referral_partner_id: string
          status: string
          updated_at: string
        }
        Insert: {
          budget_range?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          property_interest?: string | null
          referral_code: string
          referral_partner_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          budget_range?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          property_interest?: string | null
          referral_code?: string
          referral_partner_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_leads_referral_partner_id_fkey"
            columns: ["referral_partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_partners: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bank_account_number: string | null
          bank_iban: string | null
          bank_name: string | null
          commission_rate: number
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          partner_type: string
          phone_e164: string | null
          referral_code: string
          status: string
          total_conversions: number | null
          total_earnings_aed: number | null
          total_referrals: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bank_account_number?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          commission_rate?: number
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          partner_type?: string
          phone_e164?: string | null
          referral_code: string
          status?: string
          total_conversions?: number | null
          total_earnings_aed?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bank_account_number?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          commission_rate?: number
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          partner_type?: string
          phone_e164?: string | null
          referral_code?: string
          status?: string
          total_conversions?: number | null
          total_earnings_aed?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rewards_catalog: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          points_required: number
          quantity_available: number | null
          reward_type: Database["public"]["Enums"]["reward_type"] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          points_required: number
          quantity_available?: number | null
          reward_type?: Database["public"]["Enums"]["reward_type"] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          points_required?: number
          quantity_available?: number | null
          reward_type?: Database["public"]["Enums"]["reward_type"] | null
        }
        Relationships: []
      }
      security_access_logs: {
        Row: {
          action_type: string
          created_at: string | null
          failure_reason: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          success: boolean | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          success?: boolean | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          success?: boolean | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      shortlists: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortlists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_projects: {
        Row: {
          assigned_at: string
          assigned_by: string
          id: string
          project_id: string
          team_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          id?: string
          project_id: string
          team_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          project_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          organization_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          organization_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          organization_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      trending_areas: {
        Row: {
          created_at: string
          emirate: string
          id: string
          image_url: string | null
          is_trending: boolean | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          emirate?: string
          id?: string
          image_url?: string | null
          is_trending?: boolean | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          emirate?: string
          id?: string
          image_url?: string | null
          is_trending?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      uae_developers: {
        Row: {
          created_at: string
          description: string | null
          founded_year: number | null
          headquarters: string | null
          id: string
          is_active: boolean | null
          location_city: string | null
          location_emirate: string | null
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          is_active?: boolean | null
          location_city?: string | null
          location_emirate?: string | null
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          is_active?: boolean | null
          location_city?: string | null
          location_emirate?: string | null
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      user_journey_events: {
        Row: {
          created_at: string | null
          device_type: string | null
          event_data: Json | null
          event_type: string
          id: string
          page_path: string
          referrer: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          page_path: string
          referrer?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          page_path?: string
          referrer?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_role_selections: {
        Row: {
          age_range: string | null
          confirmed_accurate: boolean
          created_at: string
          current_location_city: string | null
          current_location_country: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          id: string
          nationality: string | null
          phone_e164: string | null
          preferred_language: string | null
          selected_role: Database["public"]["Enums"]["visitor_role"]
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          age_range?: string | null
          confirmed_accurate?: boolean
          created_at?: string
          current_location_city?: string | null
          current_location_country?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          nationality?: string | null
          phone_e164?: string | null
          preferred_language?: string | null
          selected_role: Database["public"]["Enums"]["visitor_role"]
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          age_range?: string | null
          confirmed_accurate?: boolean
          created_at?: string
          current_location_city?: string | null
          current_location_country?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          nationality?: string | null
          phone_e164?: string | null
          preferred_language?: string | null
          selected_role?: Database["public"]["Enums"]["visitor_role"]
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          display_preferences: Json | null
          id: string
          notification_preferences: Json | null
          privacy_settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_preferences?: Json | null
          id?: string
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_preferences?: Json | null
          id?: string
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vapi_call_logs: {
        Row: {
          ai_audited_at: string | null
          ai_follow_up_recommended: boolean | null
          ai_highlights: string[] | null
          ai_issues: string[] | null
          ai_lead_quality: string | null
          ai_score: number | null
          ai_sentiment: string | null
          ai_summary: string | null
          assistant_name: string | null
          call_id: string
          call_status: string | null
          caller_name: string | null
          caller_phone: string | null
          created_at: string
          duration_seconds: number | null
          ended_reason: string | null
          extracted_budget: string | null
          extracted_email: string | null
          extracted_interest: string | null
          extracted_name: string | null
          extracted_phone: string | null
          flag_reason: string | null
          id: string
          is_flagged: boolean | null
          lead_id: string | null
          needs_review: boolean | null
          notes: string | null
          recording_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          summary: string | null
          transcript: string | null
          updated_at: string
        }
        Insert: {
          ai_audited_at?: string | null
          ai_follow_up_recommended?: boolean | null
          ai_highlights?: string[] | null
          ai_issues?: string[] | null
          ai_lead_quality?: string | null
          ai_score?: number | null
          ai_sentiment?: string | null
          ai_summary?: string | null
          assistant_name?: string | null
          call_id: string
          call_status?: string | null
          caller_name?: string | null
          caller_phone?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_reason?: string | null
          extracted_budget?: string | null
          extracted_email?: string | null
          extracted_interest?: string | null
          extracted_name?: string | null
          extracted_phone?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          lead_id?: string | null
          needs_review?: boolean | null
          notes?: string | null
          recording_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          summary?: string | null
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          ai_audited_at?: string | null
          ai_follow_up_recommended?: boolean | null
          ai_highlights?: string[] | null
          ai_issues?: string[] | null
          ai_lead_quality?: string | null
          ai_score?: number | null
          ai_sentiment?: string | null
          ai_summary?: string | null
          assistant_name?: string | null
          call_id?: string
          call_status?: string | null
          caller_name?: string | null
          caller_phone?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_reason?: string | null
          extracted_budget?: string | null
          extracted_email?: string | null
          extracted_interest?: string | null
          extracted_name?: string | null
          extracted_phone?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          lead_id?: string | null
          needs_review?: boolean | null
          notes?: string | null
          recording_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          summary?: string | null
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vapi_call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      broker_profiles_public: {
        Row: {
          bio: string | null
          display_name: string | null
          id: string | null
          is_active: boolean | null
          is_public: boolean | null
          languages: string[] | null
          photo_url: string | null
          specializations: string[] | null
          title: string | null
          user_id: string | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          display_name?: string | null
          id?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          languages?: string[] | null
          photo_url?: string | null
          specializations?: string[] | null
          title?: string | null
          user_id?: string | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          display_name?: string | null
          id?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          languages?: string[] | null
          photo_url?: string | null
          specializations?: string[] | null
          title?: string | null
          user_id?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      bulk_assign_leads: {
        Args: {
          p_assigned_by_user_id: string
          p_assignee_user_id: string
          p_lead_ids: string[]
        }
        Returns: number
      }
      can_access_crm_lead: {
        Args: { _lead_id: string; _user_id: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_identifier: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_rate_limit_records: { Args: never; Returns: number }
      generate_referral_code: { Args: never; Returns: string }
      get_hr_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["hr_role"]
      }
      get_lead_stats_by_status: {
        Args: never
        Returns: {
          count: number
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_crm_member: { Args: { _user_id: string }; Returns: boolean }
      is_crm_admin: { Args: { _user_id: string }; Returns: boolean }
      is_email_domain_blocked: {
        Args: { email_address: string }
        Returns: boolean
      }
      is_hr_admin: { Args: { _user_id: string }; Returns: boolean }
      is_hr_member: { Args: { _user_id: string }; Returns: boolean }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_owner_or_admin: { Args: { _user_id: string }; Returns: boolean }
      is_team_admin: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_action_type: string
          p_failure_reason?: string
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type: string
          p_success?: boolean
        }
        Returns: string
      }
    }
    Enums: {
      ai_action_status:
        | "pending"
        | "auto_responded"
        | "flagged_for_review"
        | "human_responded"
        | "ignored"
      app_role: "admin" | "user" | "owner"
      audit_action_type:
        | "create"
        | "read"
        | "update"
        | "delete"
        | "login"
        | "logout"
        | "export"
        | "import"
        | "approve"
        | "reject"
        | "block"
        | "unblock"
      audit_resource_type:
        | "user"
        | "project"
        | "subscription"
        | "lead"
        | "discount_code"
        | "ip_blocklist"
        | "rate_limit"
        | "document"
        | "settings"
        | "role"
      broker_task_status: "pending" | "in_progress" | "completed" | "overdue"
      broker_task_type:
        | "developer_visit"
        | "training"
        | "document"
        | "call"
        | "meeting"
        | "other"
      comm_category:
        | "important"
        | "routine"
        | "recruitment"
        | "flagged"
        | "spam"
      comm_channel:
        | "email"
        | "whatsapp"
        | "instagram"
        | "facebook"
        | "linkedin"
        | "phone"
        | "sms"
      crm_activity_type:
        | "call"
        | "whatsapp_click"
        | "email_click"
        | "note"
        | "status_change"
        | "followup_created"
        | "followup_completed"
        | "meeting"
        | "import"
        | "assignment"
      crm_contact_type:
        | "client"
        | "broker"
        | "developer"
        | "investor"
        | "vendor"
        | "other"
      crm_import_approval_status: "pending" | "approved" | "rejected"
      crm_import_source: "csv" | "vcf" | "manual"
      crm_lead_owner_type: "company_assigned" | "broker_owned"
      crm_pipeline_status:
        | "new"
        | "contacted"
        | "qualified"
        | "viewing"
        | "negotiation"
        | "closed_won"
        | "closed_lost"
        | "no_answer"
        | "junk"
      crm_role: "owner_admin" | "broker_member" | "admin" | "founder"
      hr_application_status: "pending" | "approved" | "rejected"
      hr_module_track: "company_knowledge" | "real_estate_basics"
      hr_question_type: "mcq" | "true_false" | "short_answer"
      hr_role: "broker_candidate" | "broker_member"
      reward_type: "points" | "gift" | "badge" | "certificate"
      visitor_role: "broker" | "referral_partner" | "client" | "visitor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_action_status: [
        "pending",
        "auto_responded",
        "flagged_for_review",
        "human_responded",
        "ignored",
      ],
      app_role: ["admin", "user", "owner"],
      audit_action_type: [
        "create",
        "read",
        "update",
        "delete",
        "login",
        "logout",
        "export",
        "import",
        "approve",
        "reject",
        "block",
        "unblock",
      ],
      audit_resource_type: [
        "user",
        "project",
        "subscription",
        "lead",
        "discount_code",
        "ip_blocklist",
        "rate_limit",
        "document",
        "settings",
        "role",
      ],
      broker_task_status: ["pending", "in_progress", "completed", "overdue"],
      broker_task_type: [
        "developer_visit",
        "training",
        "document",
        "call",
        "meeting",
        "other",
      ],
      comm_category: ["important", "routine", "recruitment", "flagged", "spam"],
      comm_channel: [
        "email",
        "whatsapp",
        "instagram",
        "facebook",
        "linkedin",
        "phone",
        "sms",
      ],
      crm_activity_type: [
        "call",
        "whatsapp_click",
        "email_click",
        "note",
        "status_change",
        "followup_created",
        "followup_completed",
        "meeting",
        "import",
        "assignment",
      ],
      crm_contact_type: [
        "client",
        "broker",
        "developer",
        "investor",
        "vendor",
        "other",
      ],
      crm_import_approval_status: ["pending", "approved", "rejected"],
      crm_import_source: ["csv", "vcf", "manual"],
      crm_lead_owner_type: ["company_assigned", "broker_owned"],
      crm_pipeline_status: [
        "new",
        "contacted",
        "qualified",
        "viewing",
        "negotiation",
        "closed_won",
        "closed_lost",
        "no_answer",
        "junk",
      ],
      crm_role: ["owner_admin", "broker_member", "admin", "founder"],
      hr_application_status: ["pending", "approved", "rejected"],
      hr_module_track: ["company_knowledge", "real_estate_basics"],
      hr_question_type: ["mcq", "true_false", "short_answer"],
      hr_role: ["broker_candidate", "broker_member"],
      reward_type: ["points", "gift", "badge", "certificate"],
      visitor_role: ["broker", "referral_partner", "client", "visitor"],
    },
  },
} as const
