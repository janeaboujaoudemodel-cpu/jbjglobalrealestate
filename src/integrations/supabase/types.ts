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
      activity_points_config: {
        Row: {
          created_at: string
          description: string | null
          event_name: string
          id: string
          is_active: boolean | null
          points: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_name: string
          id?: string
          is_active?: boolean | null
          points?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          event_name?: string
          id?: string
          is_active?: boolean | null
          points?: number
        }
        Relationships: []
      }
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
      admin_edit_log: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string | null
          entity_id: string
          entity_name: string | null
          entity_type: string
          id: string
          summary: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string | null
          entity_id: string
          entity_name?: string | null
          entity_type: string
          id?: string
          summary?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string | null
          entity_id?: string
          entity_name?: string | null
          entity_type?: string
          id?: string
          summary?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_scanned_cards: {
        Row: {
          card_data: Json
          id: string
          original_card_id: string | null
          scan_source: string | null
          scanned_at: string
          user_id: string
        }
        Insert: {
          card_data: Json
          id?: string
          original_card_id?: string | null
          scan_source?: string | null
          scanned_at?: string
          user_id: string
        }
        Update: {
          card_data?: Json
          id?: string
          original_card_id?: string | null
          scan_source?: string | null
          scanned_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_tasks: {
        Row: {
          attachments: Json | null
          category: string | null
          client_contact: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          priority: string | null
          reference_url: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          category?: string | null
          client_contact?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string | null
          reference_url?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          category?: string | null
          client_contact?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string | null
          reference_url?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_brokers: {
        Row: {
          avatar_url: string | null
          average_response_time_seconds: number | null
          bio: string | null
          created_at: string | null
          current_daily_interactions: number | null
          daily_interaction_limit: number | null
          email: string
          gender: string
          id: string
          knowledge_base_updated_at: string | null
          languages: string[] | null
          name: string
          personality_prompt: string | null
          phone: string | null
          response_delay_max_seconds: number | null
          response_delay_min_seconds: number | null
          specialization: string[] | null
          status: Database["public"]["Enums"]["ai_broker_status"] | null
          total_conversions: number | null
          total_leads_handled: number | null
          updated_at: string | null
          working_days: number[] | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          avatar_url?: string | null
          average_response_time_seconds?: number | null
          bio?: string | null
          created_at?: string | null
          current_daily_interactions?: number | null
          daily_interaction_limit?: number | null
          email: string
          gender: string
          id?: string
          knowledge_base_updated_at?: string | null
          languages?: string[] | null
          name: string
          personality_prompt?: string | null
          phone?: string | null
          response_delay_max_seconds?: number | null
          response_delay_min_seconds?: number | null
          specialization?: string[] | null
          status?: Database["public"]["Enums"]["ai_broker_status"] | null
          total_conversions?: number | null
          total_leads_handled?: number | null
          updated_at?: string | null
          working_days?: number[] | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          avatar_url?: string | null
          average_response_time_seconds?: number | null
          bio?: string | null
          created_at?: string | null
          current_daily_interactions?: number | null
          daily_interaction_limit?: number | null
          email?: string
          gender?: string
          id?: string
          knowledge_base_updated_at?: string | null
          languages?: string[] | null
          name?: string
          personality_prompt?: string | null
          phone?: string | null
          response_delay_max_seconds?: number | null
          response_delay_min_seconds?: number | null
          specialization?: string[] | null
          status?: Database["public"]["Enums"]["ai_broker_status"] | null
          total_conversions?: number | null
          total_leads_handled?: number | null
          updated_at?: string | null
          working_days?: number[] | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      ai_communication_logs: {
        Row: {
          action_type: string
          ai_employee_id: string
          ai_name: string
          channel: string | null
          created_at: string | null
          id: string
          message_preview: string | null
          metadata: Json | null
          recipient_id: string | null
          recipient_type: string | null
        }
        Insert: {
          action_type: string
          ai_employee_id: string
          ai_name: string
          channel?: string | null
          created_at?: string | null
          id?: string
          message_preview?: string | null
          metadata?: Json | null
          recipient_id?: string | null
          recipient_type?: string | null
        }
        Update: {
          action_type?: string
          ai_employee_id?: string
          ai_name?: string
          channel?: string | null
          created_at?: string | null
          id?: string
          message_preview?: string | null
          metadata?: Json | null
          recipient_id?: string | null
          recipient_type?: string | null
        }
        Relationships: []
      }
      ai_daily_summaries: {
        Row: {
          ai_employee_id: string
          ai_name: string
          created_at: string | null
          deals_closed: number | null
          follow_ups_pending: number | null
          id: string
          leads_contacted: number | null
          messages_sent: number | null
          summary_date: string
          summary_text: string | null
        }
        Insert: {
          ai_employee_id: string
          ai_name: string
          created_at?: string | null
          deals_closed?: number | null
          follow_ups_pending?: number | null
          id?: string
          leads_contacted?: number | null
          messages_sent?: number | null
          summary_date: string
          summary_text?: string | null
        }
        Update: {
          ai_employee_id?: string
          ai_name?: string
          created_at?: string | null
          deals_closed?: number | null
          follow_ups_pending?: number | null
          id?: string
          leads_contacted?: number | null
          messages_sent?: number | null
          summary_date?: string
          summary_text?: string | null
        }
        Relationships: []
      }
      ai_job_master: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_payload: Json
          intelligence_features: Json | null
          output_payload: Json | null
          processing_time_ms: number | null
          status: string | null
          tool_name: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_payload?: Json
          intelligence_features?: Json | null
          output_payload?: Json | null
          processing_time_ms?: number | null
          status?: string | null
          tool_name: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_payload?: Json
          intelligence_features?: Json | null
          output_payload?: Json | null
          processing_time_ms?: number | null
          status?: string | null
          tool_name?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_notes: {
        Row: {
          ai_action_items: Json | null
          ai_key_points: Json | null
          ai_schedule: Json | null
          ai_summary: string | null
          content: string | null
          created_at: string
          id: string
          is_archived: boolean | null
          project_id: string | null
          source_type: string | null
          source_url: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_action_items?: Json | null
          ai_key_points?: Json | null
          ai_schedule?: Json | null
          ai_summary?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          project_id?: string | null
          source_type?: string | null
          source_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_action_items?: Json | null
          ai_key_points?: Json | null
          ai_schedule?: Json | null
          ai_summary?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          project_id?: string | null
          source_type?: string | null
          source_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_outfit_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          generated_image_url: string | null
          id: string
          metadata: Json | null
          original_image_url: string | null
          prompt: string
          session_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          generated_image_url?: string | null
          id?: string
          metadata?: Json | null
          original_image_url?: string | null
          prompt: string
          session_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          generated_image_url?: string | null
          id?: string
          metadata?: Json | null
          original_image_url?: string | null
          prompt?: string
          session_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          after_preview: string | null
          applied_at: string | null
          before_preview: string | null
          created_at: string | null
          description: string
          id: string
          impact_level: string | null
          metadata: Json | null
          reverted_at: string | null
          side_effects: string | null
          source: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          after_preview?: string | null
          applied_at?: string | null
          before_preview?: string | null
          created_at?: string | null
          description: string
          id?: string
          impact_level?: string | null
          metadata?: Json | null
          reverted_at?: string | null
          side_effects?: string | null
          source: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          after_preview?: string | null
          applied_at?: string | null
          before_preview?: string | null
          created_at?: string | null
          description?: string
          id?: string
          impact_level?: string | null
          metadata?: Json | null
          reverted_at?: string | null
          side_effects?: string | null
          source?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_tool_projects: {
        Row: {
          created_at: string
          id: string
          is_shared: boolean | null
          project_data: Json
          project_name: string
          thumbnail_url: string | null
          tool_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_shared?: boolean | null
          project_data?: Json
          project_name: string
          thumbnail_url?: string | null
          tool_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_shared?: boolean | null
          project_data?: Json
          project_name?: string
          thumbnail_url?: string | null
          tool_type?: string
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
      app_settings: {
        Row: {
          created_at: string | null
          description: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      area_translations: {
        Row: {
          area_id: string
          created_at: string
          description: string | null
          id: string
          language_code: string
          name: string | null
          updated_at: string
        }
        Insert: {
          area_id: string
          created_at?: string
          description?: string | null
          id?: string
          language_code: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          area_id?: string
          created_at?: string
          description?: string | null
          id?: string
          language_code?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "area_translations_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          avg_price_sqft: number | null
          country: string | null
          created_at: string
          description: string | null
          developer_count: number | null
          emirate: string
          hero_image_url: string | null
          id: string
          image_approved: boolean
          image_url: string | null
          is_active: boolean | null
          is_high_demand: boolean | null
          is_trending: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          project_count_sale: number | null
          property_count: number | null
          provident_url: string | null
          reelly_id: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          avg_price_sqft?: number | null
          country?: string | null
          created_at?: string
          description?: string | null
          developer_count?: number | null
          emirate?: string
          hero_image_url?: string | null
          id?: string
          image_approved?: boolean
          image_url?: string | null
          is_active?: boolean | null
          is_high_demand?: boolean | null
          is_trending?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          project_count_sale?: number | null
          property_count?: number | null
          provident_url?: string | null
          reelly_id?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          avg_price_sqft?: number | null
          country?: string | null
          created_at?: string
          description?: string | null
          developer_count?: number | null
          emirate?: string
          hero_image_url?: string | null
          id?: string
          image_approved?: boolean
          image_url?: string | null
          is_active?: boolean | null
          is_high_demand?: boolean | null
          is_trending?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          project_count_sale?: number | null
          property_count?: number | null
          provident_url?: string | null
          reelly_id?: number | null
          slug?: string
          updated_at?: string
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
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
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
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
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
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: Database["public"]["Enums"]["audit_resource_type"]
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bank_vault_access_logs: {
        Row: {
          access_type: string
          accessed_at: string | null
          id: string
          partner_id: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          id?: string
          partner_id?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          id?: string
          partner_id?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      banking_access_audit: {
        Row: {
          access_type: string
          accessed_at: string | null
          id: string
          ip_address: unknown
          partner_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          id?: string
          ip_address?: unknown
          partner_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          id?: string
          ip_address?: unknown
          partner_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      best_idea_submissions: {
        Row: {
          actual_email: string | null
          actual_name: string | null
          actual_phone: string | null
          admin_notes: string | null
          created_at: string
          draw_ticket_number: string | null
          email: string | null
          enter_draw: boolean | null
          expected_benefit: string | null
          full_name: string
          id: string
          idea: string
          idea_category: string | null
          idea_title: string | null
          is_anonymous: boolean
          phone: string | null
          points_awarded: number | null
          points_awarded_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          actual_email?: string | null
          actual_name?: string | null
          actual_phone?: string | null
          admin_notes?: string | null
          created_at?: string
          draw_ticket_number?: string | null
          email?: string | null
          enter_draw?: boolean | null
          expected_benefit?: string | null
          full_name?: string
          id?: string
          idea: string
          idea_category?: string | null
          idea_title?: string | null
          is_anonymous?: boolean
          phone?: string | null
          points_awarded?: number | null
          points_awarded_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          actual_email?: string | null
          actual_name?: string | null
          actual_phone?: string | null
          admin_notes?: string | null
          created_at?: string
          draw_ticket_number?: string | null
          email?: string | null
          enter_draw?: boolean | null
          expected_benefit?: string | null
          full_name?: string
          id?: string
          idea?: string
          idea_category?: string | null
          idea_title?: string | null
          is_anonymous?: boolean
          phone?: string | null
          points_awarded?: number | null
          points_awarded_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
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
      book_downloads: {
        Row: {
          book_slug: string
          book_title: string
          browser: string | null
          created_at: string
          device_type: string | null
          downloader_email: string
          downloader_name: string | null
          id: string
          ip_hash: string | null
          page_source: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          book_slug?: string
          book_title?: string
          browser?: string | null
          created_at?: string
          device_type?: string | null
          downloader_email: string
          downloader_name?: string | null
          id?: string
          ip_hash?: string | null
          page_source?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          book_slug?: string
          book_title?: string
          browser?: string | null
          created_at?: string
          device_type?: string | null
          downloader_email?: string
          downloader_name?: string | null
          id?: string
          ip_hash?: string | null
          page_source?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      books_catalog: {
        Row: {
          access_level: string | null
          chapters_json: Json | null
          cover_asset_url: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_downloadable: boolean | null
          is_readable: boolean | null
          pages_count: number | null
          sort_order: number | null
          synopsis: string | null
          title: string
          updated_at: string
        }
        Insert: {
          access_level?: string | null
          chapters_json?: Json | null
          cover_asset_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_downloadable?: boolean | null
          is_readable?: boolean | null
          pages_count?: number | null
          sort_order?: number | null
          synopsis?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          access_level?: string | null
          chapters_json?: Json | null
          cover_asset_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_downloadable?: boolean | null
          is_readable?: boolean | null
          pages_count?: number | null
          sort_order?: number | null
          synopsis?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      briefing_attendance: {
        Row: {
          briefing_request_id: string
          broker_id: string
          confirmed_at: string | null
          confirmed_attended: boolean | null
          created_at: string | null
          expected_arrival_time: string | null
          gps_address: string | null
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          late_reason: string | null
          points_earned: number | null
          rsvp_status: string | null
          selfie_url: string | null
        }
        Insert: {
          briefing_request_id: string
          broker_id: string
          confirmed_at?: string | null
          confirmed_attended?: boolean | null
          created_at?: string | null
          expected_arrival_time?: string | null
          gps_address?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          late_reason?: string | null
          points_earned?: number | null
          rsvp_status?: string | null
          selfie_url?: string | null
        }
        Update: {
          briefing_request_id?: string
          broker_id?: string
          confirmed_at?: string | null
          confirmed_attended?: boolean | null
          created_at?: string | null
          expected_arrival_time?: string | null
          gps_address?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          late_reason?: string | null
          points_earned?: number | null
          rsvp_status?: string | null
          selfie_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "briefing_attendance_briefing_request_id_fkey"
            columns: ["briefing_request_id"]
            isOneToOne: false
            referencedRelation: "briefing_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      briefing_broker_lists: {
        Row: {
          broker_ids: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          broker_ids?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          broker_ids?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      briefing_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          briefing_date: string
          briefing_time: string
          broker_list_id: string | null
          calendar_locked: boolean | null
          created_at: string | null
          developer_logo_url: string | null
          developer_name: string
          duration_minutes: number
          id: string
          location_address: string | null
          location_type: string | null
          notes: string | null
          project_name: string
          representative_id: string
          status: string
          updated_at: string | null
          uploaded_files: Json | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          briefing_date: string
          briefing_time: string
          broker_list_id?: string | null
          calendar_locked?: boolean | null
          created_at?: string | null
          developer_logo_url?: string | null
          developer_name: string
          duration_minutes?: number
          id?: string
          location_address?: string | null
          location_type?: string | null
          notes?: string | null
          project_name: string
          representative_id: string
          status?: string
          updated_at?: string | null
          uploaded_files?: Json | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          briefing_date?: string
          briefing_time?: string
          broker_list_id?: string | null
          calendar_locked?: boolean | null
          created_at?: string | null
          developer_logo_url?: string | null
          developer_name?: string
          duration_minutes?: number
          id?: string
          location_address?: string | null
          location_type?: string | null
          notes?: string | null
          project_name?: string
          representative_id?: string
          status?: string
          updated_at?: string | null
          uploaded_files?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefing_requests_broker_list_id_fkey"
            columns: ["broker_list_id"]
            isOneToOne: false
            referencedRelation: "briefing_broker_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefing_requests_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "developer_representatives"
            referencedColumns: ["id"]
          },
        ]
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
      broker_assignment_rules: {
        Row: {
          assigned_broker_id: string | null
          assignment_method: string | null
          broker_pool: string[] | null
          conditions: Json
          created_at: string | null
          current_leads_today: number | null
          description: string | null
          id: string
          is_active: boolean | null
          max_leads_per_day: number | null
          name: string
          priority: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_broker_id?: string | null
          assignment_method?: string | null
          broker_pool?: string[] | null
          conditions?: Json
          created_at?: string | null
          current_leads_today?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_leads_per_day?: number | null
          name: string
          priority?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_broker_id?: string | null
          assignment_method?: string | null
          broker_pool?: string[] | null
          conditions?: Json
          created_at?: string | null
          current_leads_today?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_leads_per_day?: number | null
          name?: string
          priority?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_assignment_rules_assigned_broker_id_fkey"
            columns: ["assigned_broker_id"]
            isOneToOne: false
            referencedRelation: "ai_brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_bonus_claims: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bonus_status: string | null
          created_at: string | null
          deal_points_at_claim: number
          id: string
          paid_at: string | null
          rejection_reason: string | null
          threshold_id: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bonus_status?: string | null
          created_at?: string | null
          deal_points_at_claim: number
          id?: string
          paid_at?: string | null
          rejection_reason?: string | null
          threshold_id?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bonus_status?: string | null
          created_at?: string | null
          deal_points_at_claim?: number
          id?: string
          paid_at?: string | null
          rejection_reason?: string | null
          threshold_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_bonus_claims_threshold_id_fkey"
            columns: ["threshold_id"]
            isOneToOne: false
            referencedRelation: "deal_bonus_thresholds"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "broker_call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
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
          {
            foreignKeyName: "broker_chat_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_chat_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
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
      broker_conversations: {
        Row: {
          broker_id: string
          channel: Database["public"]["Enums"]["broker_channel"]
          client_identifier: string | null
          created_at: string | null
          escalated_at: string | null
          escalated_to_user_id: string | null
          escalation_reason: string | null
          external_thread_id: string | null
          id: string
          last_message_at: string | null
          lead_id: string | null
          message_count: number | null
          started_at: string | null
          status:
            | Database["public"]["Enums"]["broker_conversation_status"]
            | null
          updated_at: string | null
        }
        Insert: {
          broker_id: string
          channel: Database["public"]["Enums"]["broker_channel"]
          client_identifier?: string | null
          created_at?: string | null
          escalated_at?: string | null
          escalated_to_user_id?: string | null
          escalation_reason?: string | null
          external_thread_id?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          message_count?: number | null
          started_at?: string | null
          status?:
            | Database["public"]["Enums"]["broker_conversation_status"]
            | null
          updated_at?: string | null
        }
        Update: {
          broker_id?: string
          channel?: Database["public"]["Enums"]["broker_channel"]
          client_identifier?: string | null
          created_at?: string | null
          escalated_at?: string | null
          escalated_to_user_id?: string | null
          escalation_reason?: string | null
          external_thread_id?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          message_count?: number | null
          started_at?: string | null
          status?:
            | Database["public"]["Enums"]["broker_conversation_status"]
            | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_conversations_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "ai_brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "broker_course_progress_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "broker_subscriptions_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_daily_stats: {
        Row: {
          avg_response_time_seconds: number | null
          broker_id: string
          calls_made: number | null
          created_at: string | null
          emails_sent: number | null
          id: string
          leads_contacted: number | null
          leads_converted: number | null
          leads_escalated: number | null
          messages_filtered: number | null
          messages_received: number | null
          messages_sent: number | null
          stat_date: string
        }
        Insert: {
          avg_response_time_seconds?: number | null
          broker_id: string
          calls_made?: number | null
          created_at?: string | null
          emails_sent?: number | null
          id?: string
          leads_contacted?: number | null
          leads_converted?: number | null
          leads_escalated?: number | null
          messages_filtered?: number | null
          messages_received?: number | null
          messages_sent?: number | null
          stat_date?: string
        }
        Update: {
          avg_response_time_seconds?: number | null
          broker_id?: string
          calls_made?: number | null
          created_at?: string | null
          emails_sent?: number | null
          id?: string
          leads_contacted?: number | null
          leads_converted?: number | null
          leads_escalated?: number | null
          messages_filtered?: number | null
          messages_received?: number | null
          messages_sent?: number | null
          stat_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_daily_stats_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "ai_brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_education_books: {
        Row: {
          book_number: number
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_restricted: boolean | null
          learning_objective: string | null
          learning_path: string
          min_tier: Database["public"]["Enums"]["broker_training_tier"] | null
          sort_order: number | null
          title: string
          unlock_requirements: Json | null
          updated_at: string | null
        }
        Insert: {
          book_number: number
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_restricted?: boolean | null
          learning_objective?: string | null
          learning_path: string
          min_tier?: Database["public"]["Enums"]["broker_training_tier"] | null
          sort_order?: number | null
          title: string
          unlock_requirements?: Json | null
          updated_at?: string | null
        }
        Update: {
          book_number?: number
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_restricted?: boolean | null
          learning_objective?: string | null
          learning_path?: string
          min_tier?: Database["public"]["Enums"]["broker_training_tier"] | null
          sort_order?: number | null
          title?: string
          unlock_requirements?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      broker_education_books_translations: {
        Row: {
          book_id: string
          created_at: string | null
          description: string | null
          id: string
          language_code: string
          learning_objective: string | null
          title: string
        }
        Insert: {
          book_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          language_code: string
          learning_objective?: string | null
          title: string
        }
        Update: {
          book_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          language_code?: string
          learning_objective?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_education_books_translations_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "broker_education_books"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_education_modules: {
        Row: {
          book_id: string
          content: string | null
          created_at: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          module_number: number
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          book_id: string
          content?: string | null
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          module_number: number
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          book_id?: string
          content?: string | null
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          module_number?: number
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_education_modules_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "broker_education_books"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_education_progress: {
        Row: {
          book_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          module_id: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          module_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          book_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          module_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_education_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "broker_education_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_education_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "broker_education_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_education_tests: {
        Row: {
          correct_answer: number
          created_at: string | null
          explanation: string | null
          id: string
          module_id: string
          options: Json
          question: string
          sort_order: number | null
        }
        Insert: {
          correct_answer?: number
          created_at?: string | null
          explanation?: string | null
          id?: string
          module_id: string
          options?: Json
          question: string
          sort_order?: number | null
        }
        Update: {
          correct_answer?: number
          created_at?: string | null
          explanation?: string | null
          id?: string
          module_id?: string
          options?: Json
          question?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_education_tests_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "broker_education_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_email_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          template_type: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          template_type: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          template_type?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      broker_message_filters: {
        Row: {
          created_at: string | null
          created_by: string | null
          filter_type: string
          filter_value: string
          id: string
          is_active: boolean | null
          replacement_text: string | null
          severity: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          filter_type: string
          filter_value: string
          id?: string
          is_active?: boolean | null
          replacement_text?: string | null
          severity?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          filter_type?: string
          filter_value?: string
          id?: string
          is_active?: boolean | null
          replacement_text?: string | null
          severity?: string | null
        }
        Relationships: []
      }
      broker_messages: {
        Row: {
          access_count: number | null
          ai_confidence_score: number | null
          ai_intent_detected: string | null
          attachment_urls: string[] | null
          broker_id: string | null
          content: string
          content_encrypted: string | null
          content_type: string | null
          conversation_id: string
          created_at: string | null
          delivered_at: string | null
          delivery_status: string | null
          direction: string
          filter_reason: string | null
          id: string
          is_encrypted: boolean | null
          last_accessed_at: string | null
          last_accessed_by: string | null
          original_content: string | null
          read_at: string | null
          was_filtered: boolean | null
        }
        Insert: {
          access_count?: number | null
          ai_confidence_score?: number | null
          ai_intent_detected?: string | null
          attachment_urls?: string[] | null
          broker_id?: string | null
          content: string
          content_encrypted?: string | null
          content_type?: string | null
          conversation_id: string
          created_at?: string | null
          delivered_at?: string | null
          delivery_status?: string | null
          direction: string
          filter_reason?: string | null
          id?: string
          is_encrypted?: boolean | null
          last_accessed_at?: string | null
          last_accessed_by?: string | null
          original_content?: string | null
          read_at?: string | null
          was_filtered?: boolean | null
        }
        Update: {
          access_count?: number | null
          ai_confidence_score?: number | null
          ai_intent_detected?: string | null
          attachment_urls?: string[] | null
          broker_id?: string | null
          content?: string
          content_encrypted?: string | null
          content_type?: string | null
          conversation_id?: string
          created_at?: string | null
          delivered_at?: string | null
          delivery_status?: string | null
          direction?: string
          filter_reason?: string | null
          id?: string
          is_encrypted?: boolean | null
          last_accessed_at?: string | null
          last_accessed_by?: string | null
          original_content?: string | null
          read_at?: string | null
          was_filtered?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_messages_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "ai_brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "broker_conversations"
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
          {
            foreignKeyName: "broker_pdf_exports_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "broker_subscriptions_safe"
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
          broker_type: string | null
          created_at: string
          current_tier: string | null
          custom_label: string | null
          custom_title: string | null
          display_name: string
          email: string | null
          face_verification_status: string | null
          face_verified: boolean | null
          id: string
          id_document_url: string | null
          id_expiry_date: string | null
          is_active: boolean | null
          is_public: boolean | null
          languages: string[] | null
          performance_rating: string | null
          phone: string | null
          photo_url: string | null
          probation_end: string | null
          probation_months: number | null
          probation_skipped: boolean | null
          probation_start: string | null
          rera_card_url: string | null
          rera_expiry_date: string | null
          show_contact_public: boolean | null
          show_last_name_public: boolean | null
          specializations: string[] | null
          tier_updated_at: string | null
          title: string | null
          total_points: number | null
          updated_at: string
          user_id: string
          verification_status: string | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          broker_type?: string | null
          created_at?: string
          current_tier?: string | null
          custom_label?: string | null
          custom_title?: string | null
          display_name: string
          email?: string | null
          face_verification_status?: string | null
          face_verified?: boolean | null
          id?: string
          id_document_url?: string | null
          id_expiry_date?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          languages?: string[] | null
          performance_rating?: string | null
          phone?: string | null
          photo_url?: string | null
          probation_end?: string | null
          probation_months?: number | null
          probation_skipped?: boolean | null
          probation_start?: string | null
          rera_card_url?: string | null
          rera_expiry_date?: string | null
          show_contact_public?: boolean | null
          show_last_name_public?: boolean | null
          specializations?: string[] | null
          tier_updated_at?: string | null
          title?: string | null
          total_points?: number | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          broker_type?: string | null
          created_at?: string
          current_tier?: string | null
          custom_label?: string | null
          custom_title?: string | null
          display_name?: string
          email?: string | null
          face_verification_status?: string | null
          face_verified?: boolean | null
          id?: string
          id_document_url?: string | null
          id_expiry_date?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          languages?: string[] | null
          performance_rating?: string | null
          phone?: string | null
          photo_url?: string | null
          probation_end?: string | null
          probation_months?: number | null
          probation_skipped?: boolean | null
          probation_start?: string | null
          rera_card_url?: string | null
          rera_expiry_date?: string | null
          show_contact_public?: boolean | null
          show_last_name_public?: boolean | null
          specializations?: string[] | null
          tier_updated_at?: string | null
          title?: string | null
          total_points?: number | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      broker_program_books: {
        Row: {
          book_id: string
          created_at: string | null
          id: string
          is_mandatory: boolean | null
          program_id: string
          sort_order: number | null
        }
        Insert: {
          book_id: string
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          program_id: string
          sort_order?: number | null
        }
        Update: {
          book_id?: string
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          program_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_program_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "broker_education_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_program_books_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "broker_training_programs"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "broker_tasks_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "uae_developers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_training_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          broker_tier: Database["public"]["Enums"]["broker_training_tier"]
          created_at: string | null
          first_deal_closed_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          probation_end_date: string | null
          probation_start_date: string | null
          program_id: string
          promoted_to_elite_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          broker_tier?: Database["public"]["Enums"]["broker_training_tier"]
          created_at?: string | null
          first_deal_closed_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          probation_end_date?: string | null
          probation_start_date?: string | null
          program_id: string
          promoted_to_elite_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          broker_tier?: Database["public"]["Enums"]["broker_training_tier"]
          created_at?: string | null
          first_deal_closed_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          probation_end_date?: string | null
          probation_start_date?: string | null
          program_id?: string
          promoted_to_elite_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_training_assignments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "broker_training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_training_programs: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          tier: Database["public"]["Enums"]["broker_training_tier"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          tier: Database["public"]["Enums"]["broker_training_tier"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          tier?: Database["public"]["Enums"]["broker_training_tier"]
          updated_at?: string | null
        }
        Relationships: []
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
      broker_user_book_access: {
        Row: {
          book_id: string
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          book_id: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          book_id?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_user_book_access_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "broker_education_books"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_verifications: {
        Row: {
          admin_notes: string | null
          company_name: string | null
          created_at: string
          id: string
          id_document_url: string | null
          rera_card_url: string | null
          rera_number: string | null
          status: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          id_document_url?: string | null
          rera_card_url?: string | null
          rera_number?: string | null
          status?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          id_document_url?: string | null
          rera_card_url?: string | null
          rera_number?: string | null
          status?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      broker_whatsapp_templates: {
        Row: {
          approval_status: string | null
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          meta_template_id: string | null
          template_name: string
          template_type: string
          variables: string[] | null
        }
        Insert: {
          approval_status?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_template_id?: string | null
          template_name: string
          template_type: string
          variables?: string[] | null
        }
        Update: {
          approval_status?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_template_id?: string | null
          template_name?: string
          template_type?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      campaign_members: {
        Row: {
          campaign_id: string
          id: string
          match_reason: string | null
          matched_at: string | null
          removed_at: string | null
          send_result: Json | null
          send_status: string | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          id?: string
          match_reason?: string | null
          matched_at?: string | null
          removed_at?: string | null
          send_result?: Json | null
          send_status?: string | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          id?: string
          match_reason?: string | null
          matched_at?: string | null
          removed_at?: string | null
          send_result?: Json | null
          send_status?: string | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_members_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          audience_count: number | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          launched_at: string | null
          name: string
          segment_rules: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          audience_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          launched_at?: string | null
          name: string
          segment_rules?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          audience_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          launched_at?: string | null
          name?: string
          segment_rules?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      card_link_clicks: {
        Row: {
          card_token: string
          clicked_at: string
          id: string
          link_type: string
          link_value: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          card_token: string
          clicked_at?: string
          id?: string
          link_type: string
          link_value?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          card_token?: string
          clicked_at?: string
          id?: string
          link_type?: string
          link_value?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      certification_phases: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          pass_threshold_percent: number | null
          phase_number: number
          required_book_ids: string[] | null
          sort_order: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          pass_threshold_percent?: number | null
          phase_number: number
          required_book_ids?: string[] | null
          sort_order?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          pass_threshold_percent?: number | null
          phase_number?: number
          required_book_ids?: string[] | null
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          agent_behavior_rating: number | null
          created_at: string
          feedback_type: string | null
          how_heard_about_us: string | null
          id: string
          ip_hash: string | null
          is_spam_flagged: boolean | null
          messages: Json
          owner_joined: boolean | null
          owner_joined_at: string | null
          owner_name: string | null
          page_source: string | null
          rating: number | null
          rating_feedback: string | null
          response_speed_rating: number | null
          service_type: string | null
          shortcut_selected: string | null
          spam_reasons: string[] | null
          spam_score: number | null
          status: string
          updated_at: string
          user_email: string
          user_id: string | null
          user_name: string | null
          user_phone: string | null
          was_helpful: boolean | null
          what_didnt_work: string | null
          what_improve: string | null
        }
        Insert: {
          agent_behavior_rating?: number | null
          created_at?: string
          feedback_type?: string | null
          how_heard_about_us?: string | null
          id?: string
          ip_hash?: string | null
          is_spam_flagged?: boolean | null
          messages?: Json
          owner_joined?: boolean | null
          owner_joined_at?: string | null
          owner_name?: string | null
          page_source?: string | null
          rating?: number | null
          rating_feedback?: string | null
          response_speed_rating?: number | null
          service_type?: string | null
          shortcut_selected?: string | null
          spam_reasons?: string[] | null
          spam_score?: number | null
          status?: string
          updated_at?: string
          user_email: string
          user_id?: string | null
          user_name?: string | null
          user_phone?: string | null
          was_helpful?: boolean | null
          what_didnt_work?: string | null
          what_improve?: string | null
        }
        Update: {
          agent_behavior_rating?: number | null
          created_at?: string
          feedback_type?: string | null
          how_heard_about_us?: string | null
          id?: string
          ip_hash?: string | null
          is_spam_flagged?: boolean | null
          messages?: Json
          owner_joined?: boolean | null
          owner_joined_at?: string | null
          owner_name?: string | null
          page_source?: string | null
          rating?: number | null
          rating_feedback?: string | null
          response_speed_rating?: number | null
          service_type?: string | null
          shortcut_selected?: string | null
          spam_reasons?: string[] | null
          spam_score?: number | null
          status?: string
          updated_at?: string
          user_email?: string
          user_id?: string | null
          user_name?: string | null
          user_phone?: string | null
          was_helpful?: boolean | null
          what_didnt_work?: string | null
          what_improve?: string | null
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          created_at: string
          flag_reason: string | null
          flagged_at: string | null
          flagged_by: string | null
          id: string
          is_flagged: boolean | null
          message: string
          metadata: Json | null
          role: string
          session_id: string
          source: string
          source_page: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          user_phone: string | null
        }
        Insert: {
          created_at?: string
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          is_flagged?: boolean | null
          message: string
          metadata?: Json | null
          role?: string
          session_id: string
          source: string
          source_page?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          user_phone?: string | null
        }
        Update: {
          created_at?: string
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          is_flagged?: boolean | null
          message?: string
          metadata?: Json | null
          role?: string
          session_id?: string
          source?: string
          source_page?: string | null
          user_email?: string | null
          user_id?: string | null
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
      client_investors: {
        Row: {
          client_name: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          handover_alert_14d_sent: boolean | null
          handover_alert_1d_sent: boolean | null
          handover_alert_30d_sent: boolean | null
          handover_alert_7d_sent: boolean | null
          handover_alert_sent: boolean | null
          handover_date: string | null
          home_address: string | null
          id: string
          notes: string | null
          payment_plan: string | null
          phone: string | null
          project_id: string | null
          project_name: string | null
          purchase_date: string | null
          purchase_price: number | null
          source_document_type: string | null
          source_listing_id: string | null
          unit_number: string | null
          unit_size_sqft: number | null
          unit_type: string | null
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          handover_alert_14d_sent?: boolean | null
          handover_alert_1d_sent?: boolean | null
          handover_alert_30d_sent?: boolean | null
          handover_alert_7d_sent?: boolean | null
          handover_alert_sent?: boolean | null
          handover_date?: string | null
          home_address?: string | null
          id?: string
          notes?: string | null
          payment_plan?: string | null
          phone?: string | null
          project_id?: string | null
          project_name?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          source_document_type?: string | null
          source_listing_id?: string | null
          unit_number?: string | null
          unit_size_sqft?: number | null
          unit_type?: string | null
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          handover_alert_14d_sent?: boolean | null
          handover_alert_1d_sent?: boolean | null
          handover_alert_30d_sent?: boolean | null
          handover_alert_7d_sent?: boolean | null
          handover_alert_sent?: boolean | null
          handover_date?: string | null
          home_address?: string | null
          id?: string
          notes?: string | null
          payment_plan?: string | null
          phone?: string | null
          project_id?: string | null
          project_name?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          source_document_type?: string | null
          source_listing_id?: string | null
          unit_number?: string | null
          unit_size_sqft?: number | null
          unit_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_investors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_investors_source_listing_id_fkey"
            columns: ["source_listing_id"]
            isOneToOne: false
            referencedRelation: "portal_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rates: {
        Row: {
          created_at: string | null
          id: string
          property_type: string
          rate_percent: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          property_type: string
          rate_percent?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          property_type?: string
          rate_percent?: number
        }
        Relationships: []
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
      compliance_audit_logs: {
        Row: {
          audit_type: string
          audited_by: string
          compliance_status: Database["public"]["Enums"]["compliance_status"]
          created_at: string | null
          findings: string[] | null
          id: string
          metadata: Json | null
          policy_reference: string | null
          recommendations: string[] | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          audit_type: string
          audited_by: string
          compliance_status?: Database["public"]["Enums"]["compliance_status"]
          created_at?: string | null
          findings?: string[] | null
          id?: string
          metadata?: Json | null
          policy_reference?: string | null
          recommendations?: string[] | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          audit_type?: string
          audited_by?: string
          compliance_status?: Database["public"]["Enums"]["compliance_status"]
          created_at?: string | null
          findings?: string[] | null
          id?: string
          metadata?: Json | null
          policy_reference?: string | null
          recommendations?: string[] | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      compliance_training: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          reminder_sent_at: string | null
          score: number | null
          training_content: string | null
          training_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          reminder_sent_at?: string | null
          score?: number | null
          training_content?: string | null
          training_type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          reminder_sent_at?: string | null
          score?: number | null
          training_content?: string | null
          training_type?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_form_submissions: {
        Row: {
          block_reason: string | null
          created_at: string | null
          email: string
          first_submission_at: string | null
          id: string
          ip_address: string | null
          is_blocked: boolean | null
          last_submission_at: string | null
          submission_count: number | null
        }
        Insert: {
          block_reason?: string | null
          created_at?: string | null
          email: string
          first_submission_at?: string | null
          id?: string
          ip_address?: string | null
          is_blocked?: boolean | null
          last_submission_at?: string | null
          submission_count?: number | null
        }
        Update: {
          block_reason?: string | null
          created_at?: string | null
          email?: string
          first_submission_at?: string | null
          id?: string
          ip_address?: string | null
          is_blocked?: boolean | null
          last_submission_at?: string | null
          submission_count?: number | null
        }
        Relationships: []
      }
      contact_gating_access_logs: {
        Row: {
          access_type: string
          accessed_at: string
          id: string
          ip_address: unknown
          submission_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string
          id?: string
          ip_address?: unknown
          submission_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string
          id?: string
          ip_address?: unknown
          submission_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contact_gating_submissions: {
        Row: {
          created_at: string
          email: string
          email_encrypted: string | null
          email_hash: string | null
          email_verified: boolean | null
          full_name: string
          full_name_encrypted: string | null
          honeypot_field: string | null
          id: string
          location: string | null
          nationality: string | null
          phone: string
          phone_encrypted: string | null
          phone_verified: boolean | null
          preferred_language: string | null
          service_interest: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          email: string
          email_encrypted?: string | null
          email_hash?: string | null
          email_verified?: boolean | null
          full_name: string
          full_name_encrypted?: string | null
          honeypot_field?: string | null
          id?: string
          location?: string | null
          nationality?: string | null
          phone: string
          phone_encrypted?: string | null
          phone_verified?: boolean | null
          preferred_language?: string | null
          service_interest?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          email?: string
          email_encrypted?: string | null
          email_hash?: string | null
          email_verified?: boolean | null
          full_name?: string
          full_name_encrypted?: string | null
          honeypot_field?: string | null
          id?: string
          location?: string | null
          nationality?: string | null
          phone?: string
          phone_encrypted?: string | null
          phone_verified?: boolean | null
          preferred_language?: string | null
          service_interest?: string | null
          session_id?: string
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
          {
            foreignKeyName: "content_access_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "broker_subscriptions_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      cookie_consents: {
        Row: {
          consent_status: string
          created_at: string
          id: string
          preferences: Json
          user_agent: string | null
          visitor_id: string
        }
        Insert: {
          consent_status: string
          created_at?: string
          id?: string
          preferences?: Json
          user_agent?: string | null
          visitor_id: string
        }
        Update: {
          consent_status?: string
          created_at?: string
          id?: string
          preferences?: Json
          user_agent?: string | null
          visitor_id?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "course_sessions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "broker_subscriptions_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_action_logs: {
        Row: {
          action_type: string
          created_at: string
          employee_id: string | null
          id: string
          lead_id: string | null
          notes: string | null
          target_contact: string | null
          target_name: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          employee_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          target_contact?: string | null
          target_name?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          employee_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          target_contact?: string | null
          target_name?: string | null
          user_id?: string | null
        }
        Relationships: []
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
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_ai_drafts: {
        Row: {
          ai_employee_id: string | null
          content: string
          created_at: string | null
          draft_type: string
          id: string
          lead_id: string | null
          metadata: Json | null
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          ai_employee_id?: string | null
          content: string
          created_at?: string | null
          draft_type: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          ai_employee_id?: string | null
          content?: string
          created_at?: string | null
          draft_type?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_ai_drafts_ai_employee_id_fkey"
            columns: ["ai_employee_id"]
            isOneToOne: false
            referencedRelation: "crm_ai_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_ai_drafts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_ai_drafts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_ai_drafts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_ai_employees: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          permissions: string[] | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          permissions?: string[] | null
          role: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          permissions?: string[] | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
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
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
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
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
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
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
        }
        Relationships: []
      }
      crm_automation_rules: {
        Row: {
          action_type: string
          config: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          trigger_event: string
          updated_at: string | null
        }
        Insert: {
          action_type: string
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_event: string
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_event?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_brokers: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          display_name: string
          id: string
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          display_name: string
          id?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          display_name?: string
          id?: string
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
          {
            foreignKeyName: "crm_calls_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_calls_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
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
          {
            foreignKeyName: "crm_campaign_recipients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaign_recipients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_chat_messages: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          is_from_current_user: boolean | null
          message: string
          sender_id: string
          sender_name: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          is_from_current_user?: boolean | null
          message: string
          sender_id: string
          sender_name: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          is_from_current_user?: boolean | null
          message?: string
          sender_id?: string
          sender_name?: string
        }
        Relationships: []
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
      crm_lead_access_logs: {
        Row: {
          access_type: string
          accessed_at: string | null
          id: string
          ip_address: string | null
          lead_id: string
          masked_access: boolean | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          id?: string
          ip_address?: string | null
          lead_id: string
          masked_access?: boolean | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          id?: string
          ip_address?: string | null
          lead_id?: string
          masked_access?: boolean | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_access_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_access_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_access_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "crm_lead_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_reports: {
        Row: {
          created_at: string | null
          created_by_user_id: string | null
          id: string
          include_broker_info: boolean | null
          lead_id: string
          pdf_url: string | null
          report_data: Json | null
          report_type: string
          title: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          include_broker_info?: boolean | null
          lead_id: string
          pdf_url?: string | null
          report_data?: Json | null
          report_type: string
          title?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          include_broker_info?: boolean | null
          lead_id?: string
          pdf_url?: string | null
          report_data?: Json | null
          report_type?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_reports_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_reports_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_reports_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_shortlists: {
        Row: {
          added_by_user_id: string | null
          created_at: string | null
          id: string
          lead_id: string
          notes: string | null
          property_data: Json | null
          property_id: string
        }
        Insert: {
          added_by_user_id?: string | null
          created_at?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          property_data?: Json | null
          property_id: string
        }
        Update: {
          added_by_user_id?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          property_data?: Json | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_shortlists_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_shortlists_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_shortlists_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_sources: {
        Row: {
          broker_id: string | null
          broker_name_snapshot: string | null
          created_at: string | null
          created_by_user_id: string | null
          flagged_rows: number | null
          id: string
          source_file_name: string | null
          source_group: string
          source_name: string
          total_rows: number | null
          valid_rows: number | null
        }
        Insert: {
          broker_id?: string | null
          broker_name_snapshot?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          flagged_rows?: number | null
          id?: string
          source_file_name?: string | null
          source_group?: string
          source_name: string
          total_rows?: number | null
          valid_rows?: number | null
        }
        Update: {
          broker_id?: string | null
          broker_name_snapshot?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          flagged_rows?: number | null
          id?: string
          source_file_name?: string | null
          source_group?: string
          source_name?: string
          total_rows?: number | null
          valid_rows?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_sources_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "crm_brokers"
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
          {
            foreignKeyName: "crm_lead_state_per_user_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_state_per_user_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          age_range: string | null
          ai_score: number | null
          ai_score_updated_at: string | null
          assigned_ai_employee_id: string | null
          assigned_broker_id: string | null
          assigned_to_user_id: string | null
          auto_detected_type: boolean | null
          birthday: string | null
          company_name: string | null
          contact_type: Database["public"]["Enums"]["crm_contact_type"] | null
          created_at: string
          created_by_user_id: string | null
          current_location_city: string | null
          current_location_country: string | null
          deleted_at: string | null
          detection_keywords: string[] | null
          duplicate_hash: string | null
          duplicate_of_id: string | null
          email_lower: string | null
          email_normalized: string | null
          flag_reasons: string[] | null
          flagged: boolean | null
          full_name: string
          gender: string | null
          id: string
          import_approval_status:
            | Database["public"]["Enums"]["crm_import_approval_status"]
            | null
          import_batch_id: string | null
          imported_at: string | null
          is_duplicate: boolean | null
          last_contacted_at: string | null
          lead_intent: string | null
          lead_source_type: string | null
          nationality: string | null
          notes: string | null
          owner_type: Database["public"]["Enums"]["crm_lead_owner_type"]
          owner_user_id: string | null
          partner_service_type: string | null
          phone_e164: string | null
          phone_normalized: string | null
          phone_raw: string | null
          pipeline_stage: string | null
          preferred_language: string | null
          priority_score: number | null
          raw_import: Json | null
          rental_budget_max: number | null
          rental_budget_min: number | null
          rental_lease_duration: string | null
          rental_move_in_timeline: string | null
          rental_preferred_areas: string[] | null
          rental_property_type: string | null
          rental_renter_type: string | null
          source: string | null
          source_id: string | null
          source_page: string | null
          source_row_index: number | null
          stale_since: string | null
          tags: string[] | null
          updated_at: string
          vip: boolean | null
          vip_tagged_at: string | null
          vip_tagged_by: string | null
        }
        Insert: {
          age_range?: string | null
          ai_score?: number | null
          ai_score_updated_at?: string | null
          assigned_ai_employee_id?: string | null
          assigned_broker_id?: string | null
          assigned_to_user_id?: string | null
          auto_detected_type?: boolean | null
          birthday?: string | null
          company_name?: string | null
          contact_type?: Database["public"]["Enums"]["crm_contact_type"] | null
          created_at?: string
          created_by_user_id?: string | null
          current_location_city?: string | null
          current_location_country?: string | null
          deleted_at?: string | null
          detection_keywords?: string[] | null
          duplicate_hash?: string | null
          duplicate_of_id?: string | null
          email_lower?: string | null
          email_normalized?: string | null
          flag_reasons?: string[] | null
          flagged?: boolean | null
          full_name: string
          gender?: string | null
          id?: string
          import_approval_status?:
            | Database["public"]["Enums"]["crm_import_approval_status"]
            | null
          import_batch_id?: string | null
          imported_at?: string | null
          is_duplicate?: boolean | null
          last_contacted_at?: string | null
          lead_intent?: string | null
          lead_source_type?: string | null
          nationality?: string | null
          notes?: string | null
          owner_type?: Database["public"]["Enums"]["crm_lead_owner_type"]
          owner_user_id?: string | null
          partner_service_type?: string | null
          phone_e164?: string | null
          phone_normalized?: string | null
          phone_raw?: string | null
          pipeline_stage?: string | null
          preferred_language?: string | null
          priority_score?: number | null
          raw_import?: Json | null
          rental_budget_max?: number | null
          rental_budget_min?: number | null
          rental_lease_duration?: string | null
          rental_move_in_timeline?: string | null
          rental_preferred_areas?: string[] | null
          rental_property_type?: string | null
          rental_renter_type?: string | null
          source?: string | null
          source_id?: string | null
          source_page?: string | null
          source_row_index?: number | null
          stale_since?: string | null
          tags?: string[] | null
          updated_at?: string
          vip?: boolean | null
          vip_tagged_at?: string | null
          vip_tagged_by?: string | null
        }
        Update: {
          age_range?: string | null
          ai_score?: number | null
          ai_score_updated_at?: string | null
          assigned_ai_employee_id?: string | null
          assigned_broker_id?: string | null
          assigned_to_user_id?: string | null
          auto_detected_type?: boolean | null
          birthday?: string | null
          company_name?: string | null
          contact_type?: Database["public"]["Enums"]["crm_contact_type"] | null
          created_at?: string
          created_by_user_id?: string | null
          current_location_city?: string | null
          current_location_country?: string | null
          deleted_at?: string | null
          detection_keywords?: string[] | null
          duplicate_hash?: string | null
          duplicate_of_id?: string | null
          email_lower?: string | null
          email_normalized?: string | null
          flag_reasons?: string[] | null
          flagged?: boolean | null
          full_name?: string
          gender?: string | null
          id?: string
          import_approval_status?:
            | Database["public"]["Enums"]["crm_import_approval_status"]
            | null
          import_batch_id?: string | null
          imported_at?: string | null
          is_duplicate?: boolean | null
          last_contacted_at?: string | null
          lead_intent?: string | null
          lead_source_type?: string | null
          nationality?: string | null
          notes?: string | null
          owner_type?: Database["public"]["Enums"]["crm_lead_owner_type"]
          owner_user_id?: string | null
          partner_service_type?: string | null
          phone_e164?: string | null
          phone_normalized?: string | null
          phone_raw?: string | null
          pipeline_stage?: string | null
          preferred_language?: string | null
          priority_score?: number | null
          raw_import?: Json | null
          rental_budget_max?: number | null
          rental_budget_min?: number | null
          rental_lease_duration?: string | null
          rental_move_in_timeline?: string | null
          rental_preferred_areas?: string[] | null
          rental_property_type?: string | null
          rental_renter_type?: string | null
          source?: string | null
          source_id?: string | null
          source_page?: string | null
          source_row_index?: number | null
          stale_since?: string | null
          tags?: string[] | null
          updated_at?: string
          vip?: boolean | null
          vip_tagged_at?: string | null
          vip_tagged_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_assigned_ai_employee_id_fkey"
            columns: ["assigned_ai_employee_id"]
            isOneToOne: false
            referencedRelation: "crm_ai_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_assigned_broker_id_fkey"
            columns: ["assigned_broker_id"]
            isOneToOne: false
            referencedRelation: "ai_brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_duplicate_of_id_fkey"
            columns: ["duplicate_of_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_duplicate_of_id_fkey"
            columns: ["duplicate_of_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_duplicate_of_id_fkey"
            columns: ["duplicate_of_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "crm_lead_sources"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "crm_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
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
          {
            foreignKeyName: "crm_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_users_profile: {
        Row: {
          company_id: string | null
          created_at: string
          crm_role: Database["public"]["Enums"]["crm_role"]
          department: string | null
          display_name: string | null
          email: string | null
          first_login_at: string | null
          force_password_change: boolean | null
          id: string
          is_active: boolean
          job_title: string | null
          languages: string[] | null
          last_password_change: string | null
          login_count: number | null
          nationality: string | null
          password_changed_at: string | null
          phone: string | null
          photo_url: string | null
          preferred_language: string | null
          team_member_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          crm_role?: Database["public"]["Enums"]["crm_role"]
          department?: string | null
          display_name?: string | null
          email?: string | null
          first_login_at?: string | null
          force_password_change?: boolean | null
          id?: string
          is_active?: boolean
          job_title?: string | null
          languages?: string[] | null
          last_password_change?: string | null
          login_count?: number | null
          nationality?: string | null
          password_changed_at?: string | null
          phone?: string | null
          photo_url?: string | null
          preferred_language?: string | null
          team_member_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          crm_role?: Database["public"]["Enums"]["crm_role"]
          department?: string | null
          display_name?: string | null
          email?: string | null
          first_login_at?: string | null
          force_password_change?: boolean | null
          id?: string
          is_active?: boolean
          job_title?: string | null
          languages?: string[] | null
          last_password_change?: string | null
          login_count?: number | null
          nationality?: string | null
          password_changed_at?: string | null
          phone?: string | null
          photo_url?: string | null
          preferred_language?: string | null
          team_member_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_reviews: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          email: string
          feature_key: string
          full_name: string
          id: string
          improve_text: string | null
          is_anonymous: boolean
          loyalty_points_awarded: number | null
          publish_requested: boolean
          published_at: string | null
          rating: number
          review_text: string
          reviewed_at: string | null
          reviewed_by: string | null
          service_type: string
          status: string
          updated_at: string | null
          user_id: string | null
          would_recommend: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          email: string
          feature_key?: string
          full_name: string
          id?: string
          improve_text?: string | null
          is_anonymous?: boolean
          loyalty_points_awarded?: number | null
          publish_requested?: boolean
          published_at?: string | null
          rating: number
          review_text: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_type: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
          would_recommend: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string
          feature_key?: string
          full_name?: string
          id?: string
          improve_text?: string | null
          is_anonymous?: boolean
          loyalty_points_awarded?: number | null
          publish_requested?: boolean
          published_at?: string | null
          rating?: number
          review_text?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_type?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
          would_recommend?: string
        }
        Relationships: []
      }
      data_access_rules: {
        Row: {
          access_level: string
          conditions: Json | null
          created_at: string | null
          created_by: string | null
          department: string | null
          id: string
          is_active: boolean | null
          resource_type: string
          role: string
          updated_at: string | null
        }
        Insert: {
          access_level: string
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          id?: string
          is_active?: boolean | null
          resource_type: string
          role: string
          updated_at?: string | null
        }
        Update: {
          access_level?: string
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          id?: string
          is_active?: boolean | null
          resource_type?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      db_health_logs: {
        Row: {
          check_type: string
          connection_count: number | null
          created_at: string
          details: Json | null
          id: string
          is_healthy: boolean | null
          latency_ms: number | null
        }
        Insert: {
          check_type?: string
          connection_count?: number | null
          created_at?: string
          details?: Json | null
          id?: string
          is_healthy?: boolean | null
          latency_ms?: number | null
        }
        Update: {
          check_type?: string
          connection_count?: number | null
          created_at?: string
          details?: Json | null
          id?: string
          is_healthy?: boolean | null
          latency_ms?: number | null
        }
        Relationships: []
      }
      deal_bonus_thresholds: {
        Row: {
          bonus_description: string | null
          bonus_type: string
          bonus_value_aed: number | null
          created_at: string | null
          hardware_item: string | null
          id: string
          is_active: boolean | null
          required_deal_points: number
          sort_order: number | null
          threshold_name: string
        }
        Insert: {
          bonus_description?: string | null
          bonus_type: string
          bonus_value_aed?: number | null
          created_at?: string | null
          hardware_item?: string | null
          id?: string
          is_active?: boolean | null
          required_deal_points: number
          sort_order?: number | null
          threshold_name: string
        }
        Update: {
          bonus_description?: string | null
          bonus_type?: string
          bonus_value_aed?: number | null
          created_at?: string | null
          hardware_item?: string | null
          id?: string
          is_active?: boolean | null
          required_deal_points?: number
          sort_order?: number | null
          threshold_name?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          broker_user_id: string
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          deal_status: string | null
          deal_value_aed: number
          developer_id: string | null
          developer_name: string | null
          id: string
          notes: string | null
          points_awarded: number | null
          rejected_reason: string | null
          submitted_at: string
          unit_number: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          broker_user_id: string
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          deal_status?: string | null
          deal_value_aed: number
          developer_id?: string | null
          developer_name?: string | null
          id?: string
          notes?: string | null
          points_awarded?: number | null
          rejected_reason?: string | null
          submitted_at?: string
          unit_number: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          broker_user_id?: string
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          deal_status?: string | null
          deal_value_aed?: number
          developer_id?: string | null
          developer_name?: string | null
          id?: string
          notes?: string | null
          points_awarded?: number | null
          rejected_reason?: string | null
          submitted_at?: string
          unit_number?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_records: {
        Row: {
          audit_log: Json | null
          created_at: string
          created_by_email: string | null
          created_by_role: string
          created_by_user_id: string
          decision_id: string
          decision_type: string
          description: string | null
          finalized_at: string | null
          finalized_by_email: string | null
          finalized_by_role: string | null
          finalized_by_user_id: string | null
          id: string
          inputs: Json
          is_finalized: boolean | null
          outputs: Json | null
          reviews: Json | null
          title: string
          updated_at: string
          workflow_state: string
        }
        Insert: {
          audit_log?: Json | null
          created_at?: string
          created_by_email?: string | null
          created_by_role: string
          created_by_user_id: string
          decision_id: string
          decision_type: string
          description?: string | null
          finalized_at?: string | null
          finalized_by_email?: string | null
          finalized_by_role?: string | null
          finalized_by_user_id?: string | null
          id?: string
          inputs: Json
          is_finalized?: boolean | null
          outputs?: Json | null
          reviews?: Json | null
          title: string
          updated_at?: string
          workflow_state?: string
        }
        Update: {
          audit_log?: Json | null
          created_at?: string
          created_by_email?: string | null
          created_by_role?: string
          created_by_user_id?: string
          decision_id?: string
          decision_type?: string
          description?: string | null
          finalized_at?: string | null
          finalized_by_email?: string | null
          finalized_by_role?: string | null
          finalized_by_user_id?: string | null
          id?: string
          inputs?: Json
          is_finalized?: boolean | null
          outputs?: Json | null
          reviews?: Json | null
          title?: string
          updated_at?: string
          workflow_state?: string
        }
        Relationships: []
      }
      design_assets: {
        Row: {
          asset_type: string
          created_at: string
          file_url: string
          id: string
          metadata: Json | null
          name: string
          project_id: string | null
          thumbnail_url: string | null
          user_id: string
        }
        Insert: {
          asset_type: string
          created_at?: string
          file_url: string
          id?: string
          metadata?: Json | null
          name: string
          project_id?: string | null
          thumbnail_url?: string | null
          user_id: string
        }
        Update: {
          asset_type?: string
          created_at?: string
          file_url?: string
          id?: string
          metadata?: Json | null
          name?: string
          project_id?: string | null
          thumbnail_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "design_studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      design_color_palettes: {
        Row: {
          colors: Json
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          colors?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          colors?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      design_history: {
        Row: {
          changes_description: string | null
          created_at: string
          design_url: string
          id: string
          project_id: string
          prompt_used: string | null
          user_id: string
          version_number: number
        }
        Insert: {
          changes_description?: string | null
          created_at?: string
          design_url: string
          id?: string
          project_id: string
          prompt_used?: string | null
          user_id: string
          version_number?: number
        }
        Update: {
          changes_description?: string | null
          created_at?: string
          design_url?: string
          id?: string
          project_id?: string
          prompt_used?: string | null
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "design_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "design_studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      design_licenses: {
        Row: {
          asset_id: string | null
          asset_type: string
          company_name: string
          created_at: string
          id: string
          license_code: string
          trade_license_url: string | null
          trade_license_verified: boolean
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          asset_type: string
          company_name: string
          created_at?: string
          id?: string
          license_code?: string
          trade_license_url?: string | null
          trade_license_verified?: boolean
          user_id: string
        }
        Update: {
          asset_id?: string | null
          asset_type?: string
          company_name?: string
          created_at?: string
          id?: string
          license_code?: string
          trade_license_url?: string | null
          trade_license_verified?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_licenses_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "design_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      design_project_palettes: {
        Row: {
          created_at: string
          id: string
          palette_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          palette_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          palette_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_project_palettes_palette_id_fkey"
            columns: ["palette_id"]
            isOneToOne: false
            referencedRelation: "design_color_palettes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_project_palettes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "design_studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      design_studio_projects: {
        Row: {
          category: string
          created_at: string
          description: string | null
          final_design_url: string | null
          id: string
          is_archived: boolean
          metadata: Json | null
          name: string
          status: string
          template_size: string | null
          template_type: string | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          final_design_url?: string | null
          id?: string
          is_archived?: boolean
          metadata?: Json | null
          name: string
          status?: string
          template_size?: string | null
          template_type?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          final_design_url?: string | null
          id?: string
          is_archived?: boolean
          metadata?: Json | null
          name?: string
          status?: string
          template_size?: string | null
          template_type?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      design_templates: {
        Row: {
          category: string
          created_at: string
          id: string
          is_public: boolean
          name: string
          preview_url: string | null
          template_data: Json
          updated_at: string
          use_count: number
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_public?: boolean
          name: string
          preview_url?: string | null
          template_data?: Json
          updated_at?: string
          use_count?: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_public?: boolean
          name?: string
          preview_url?: string | null
          template_data?: Json
          updated_at?: string
          use_count?: number
          user_id?: string
        }
        Relationships: []
      }
      design_website_requests: {
        Row: {
          ai_instructions: string | null
          created_at: string
          design_url: string
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          project_id: string | null
          request_type: string
          status: string
          target_page: string | null
          target_section: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_instructions?: string | null
          created_at?: string
          design_url: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          project_id?: string | null
          request_type: string
          status?: string
          target_page?: string | null
          target_section?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_instructions?: string | null
          created_at?: string
          design_url?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          project_id?: string | null
          request_type?: string
          status?: string
          target_page?: string | null
          target_section?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_website_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "design_studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_ai_cache: {
        Row: {
          analysis_text: string
          developer_slug: string
          generated_at: string
          id: string
        }
        Insert: {
          analysis_text: string
          developer_slug: string
          generated_at?: string
          id?: string
        }
        Update: {
          analysis_text?: string
          developer_slug?: string
          generated_at?: string
          id?: string
        }
        Relationships: []
      }
      developer_launch_uploads: {
        Row: {
          auto_approved: boolean
          created_at: string
          developer_email: string
          developer_name: string
          extraction_status: string
          generated_project_id: string | null
          id: string
          launch_date: string | null
          location: string | null
          project_description: string | null
          project_name: string
          status: string
          uploaded_files: Json | null
        }
        Insert: {
          auto_approved?: boolean
          created_at?: string
          developer_email: string
          developer_name: string
          extraction_status?: string
          generated_project_id?: string | null
          id?: string
          launch_date?: string | null
          location?: string | null
          project_description?: string | null
          project_name: string
          status?: string
          uploaded_files?: Json | null
        }
        Update: {
          auto_approved?: boolean
          created_at?: string
          developer_email?: string
          developer_name?: string
          extraction_status?: string
          generated_project_id?: string | null
          id?: string
          launch_date?: string | null
          location?: string | null
          project_description?: string | null
          project_name?: string
          status?: string
          uploaded_files?: Json | null
        }
        Relationships: []
      }
      developer_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          developer_name: string
          id: string
          is_public: boolean | null
          message_type: string
          representative_id: string | null
          status: string
          subject: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          developer_name: string
          id?: string
          is_public?: boolean | null
          message_type?: string
          representative_id?: string | null
          status?: string
          subject?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          developer_name?: string
          id?: string
          is_public?: boolean | null
          message_type?: string
          representative_id?: string | null
          status?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_messages_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "developer_representatives"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_pipeline: {
        Row: {
          ai_score: number | null
          completion_date: string | null
          created_at: string | null
          developer_name: string
          expected_yield: number | null
          id: string
          is_featured: boolean | null
          launch_date: string | null
          location: string
          metadata: Json | null
          opportunity_notes: string | null
          price_range_max: number | null
          price_range_min: number | null
          project_name: string
          project_status: string | null
          property_types: string[] | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          total_units: number | null
          updated_at: string | null
        }
        Insert: {
          ai_score?: number | null
          completion_date?: string | null
          created_at?: string | null
          developer_name: string
          expected_yield?: number | null
          id?: string
          is_featured?: boolean | null
          launch_date?: string | null
          location: string
          metadata?: Json | null
          opportunity_notes?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          project_name: string
          project_status?: string | null
          property_types?: string[] | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          total_units?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_score?: number | null
          completion_date?: string | null
          created_at?: string | null
          developer_name?: string
          expected_yield?: number | null
          id?: string
          is_featured?: boolean | null
          launch_date?: string | null
          location?: string
          metadata?: Json | null
          opportunity_notes?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          project_name?: string
          project_status?: string | null
          property_types?: string[] | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          total_units?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      developer_representatives: {
        Row: {
          activity_score: number | null
          auto_approve_uploads: boolean | null
          created_at: string | null
          date_of_join: string | null
          developer_name: string
          email: string
          full_name: string
          gender: string | null
          id: string
          languages: string[] | null
          last_active_at: string | null
          nationality: string | null
          phone: string | null
          position: string | null
          projects_handled: string[] | null
          response_time_avg_hours: number | null
          role: string
          status: string
          total_briefings_hosted: number | null
          total_updates_submitted: number | null
          updated_at: string | null
          user_id: string | null
          whatsapp_group_number: string | null
          years_in_real_estate: number | null
        }
        Insert: {
          activity_score?: number | null
          auto_approve_uploads?: boolean | null
          created_at?: string | null
          date_of_join?: string | null
          developer_name: string
          email: string
          full_name: string
          gender?: string | null
          id?: string
          languages?: string[] | null
          last_active_at?: string | null
          nationality?: string | null
          phone?: string | null
          position?: string | null
          projects_handled?: string[] | null
          response_time_avg_hours?: number | null
          role?: string
          status?: string
          total_briefings_hosted?: number | null
          total_updates_submitted?: number | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp_group_number?: string | null
          years_in_real_estate?: number | null
        }
        Update: {
          activity_score?: number | null
          auto_approve_uploads?: boolean | null
          created_at?: string | null
          date_of_join?: string | null
          developer_name?: string
          email?: string
          full_name?: string
          gender?: string | null
          id?: string
          languages?: string[] | null
          last_active_at?: string | null
          nationality?: string | null
          phone?: string | null
          position?: string | null
          projects_handled?: string[] | null
          response_time_avg_hours?: number | null
          role?: string
          status?: string
          total_briefings_hosted?: number | null
          total_updates_submitted?: number | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp_group_number?: string | null
          years_in_real_estate?: number | null
        }
        Relationships: []
      }
      developer_sales_contacts: {
        Row: {
          created_at: string
          developer_id: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          developer_id: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          developer_id?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_sales_contacts_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_sales_reps: {
        Row: {
          created_at: string
          developer_id: string
          email: string | null
          full_name: string
          gender: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          languages: string[] | null
          nationality: string | null
          notes: string | null
          phone_e164: string
          title: string | null
          updated_at: string
          whatsapp_number: string | null
          years_in_real_estate: number | null
        }
        Insert: {
          created_at?: string
          developer_id: string
          email?: string | null
          full_name: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          languages?: string[] | null
          nationality?: string | null
          notes?: string | null
          phone_e164: string
          title?: string | null
          updated_at?: string
          whatsapp_number?: string | null
          years_in_real_estate?: number | null
        }
        Update: {
          created_at?: string
          developer_id?: string
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          languages?: string[] | null
          nationality?: string | null
          notes?: string | null
          phone_e164?: string
          title?: string | null
          updated_at?: string
          whatsapp_number?: string | null
          years_in_real_estate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "developer_sales_reps_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "uae_developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_sales_reps_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "uae_developers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_submissions: {
        Row: {
          assigned_broker_id: string | null
          attachments: Json | null
          created_at: string
          developer_email: string
          developer_name: string
          developer_phone: string | null
          event_date: string | null
          event_description: string | null
          event_files: Json | null
          event_location: string | null
          event_title: string | null
          id: string
          is_hidden: boolean | null
          notes: string | null
          reviewed_at: string | null
          status: string
          submission_subtype: string | null
          submission_type: string
        }
        Insert: {
          assigned_broker_id?: string | null
          attachments?: Json | null
          created_at?: string
          developer_email: string
          developer_name: string
          developer_phone?: string | null
          event_date?: string | null
          event_description?: string | null
          event_files?: Json | null
          event_location?: string | null
          event_title?: string | null
          id?: string
          is_hidden?: boolean | null
          notes?: string | null
          reviewed_at?: string | null
          status?: string
          submission_subtype?: string | null
          submission_type?: string
        }
        Update: {
          assigned_broker_id?: string | null
          attachments?: Json | null
          created_at?: string
          developer_email?: string
          developer_name?: string
          developer_phone?: string | null
          event_date?: string | null
          event_description?: string | null
          event_files?: Json | null
          event_location?: string | null
          event_title?: string | null
          id?: string
          is_hidden?: boolean | null
          notes?: string | null
          reviewed_at?: string | null
          status?: string
          submission_subtype?: string | null
          submission_type?: string
        }
        Relationships: []
      }
      developer_sync_status: {
        Row: {
          created_at: string | null
          developer_id: string | null
          flag_reason: string | null
          id: string
          is_flagged_for_review: boolean | null
          last_seen_at: string | null
          source_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          developer_id?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged_for_review?: boolean | null
          last_seen_at?: string | null
          source_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          developer_id?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged_for_review?: boolean | null
          last_seen_at?: string | null
          source_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "developer_sync_status_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
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
          checkin_type: string | null
          confirmation_statement: boolean | null
          created_at: string | null
          developer_id: string
          feedback_json: Json | null
          id: string
          location_accuracy_m: number | null
          notes: string | null
          points_awarded: number | null
          selfie_url: string | null
          signature_data: string | null
          task_id: string | null
          user_id: string
          visit_request_id: string | null
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
          checkin_type?: string | null
          confirmation_statement?: boolean | null
          created_at?: string | null
          developer_id: string
          feedback_json?: Json | null
          id?: string
          location_accuracy_m?: number | null
          notes?: string | null
          points_awarded?: number | null
          selfie_url?: string | null
          signature_data?: string | null
          task_id?: string | null
          user_id: string
          visit_request_id?: string | null
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
          checkin_type?: string | null
          confirmation_statement?: boolean | null
          created_at?: string | null
          developer_id?: string
          feedback_json?: Json | null
          id?: string
          location_accuracy_m?: number | null
          notes?: string | null
          points_awarded?: number | null
          selfie_url?: string | null
          signature_data?: string | null
          task_id?: string | null
          user_id?: string
          visit_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "developer_visit_checkins_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "uae_developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_visit_checkins_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "uae_developers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_visit_checkins_visit_request_id_fkey"
            columns: ["visit_request_id"]
            isOneToOne: false
            referencedRelation: "developer_visit_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_visit_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contact_revealed: boolean | null
          created_at: string
          developer_id: string
          id: string
          notes: string | null
          purpose: string | null
          rejection_reason: string | null
          requested_date: string
          requested_time: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contact_revealed?: boolean | null
          created_at?: string
          developer_id: string
          id?: string
          notes?: string | null
          purpose?: string | null
          rejection_reason?: string | null
          requested_date: string
          requested_time?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contact_revealed?: boolean | null
          created_at?: string
          developer_id?: string
          id?: string
          notes?: string | null
          purpose?: string | null
          rejection_reason?: string | null
          requested_date?: string
          requested_time?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_visit_requests_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      developers: {
        Row: {
          ceo_name: string | null
          completed_projects: number | null
          created_at: string
          description: string | null
          expected_completion_year: number | null
          feature_image_url: string | null
          founded_year: number | null
          headquarters: string | null
          id: string
          is_hidden: boolean | null
          license_number: string | null
          logo_bg_color: string | null
          logo_url: string | null
          logo_url_dark: string | null
          logo_url_processed: string | null
          name: string
          notable_projects: string | null
          offplan_projects: number | null
          parent_company: string | null
          portfolio_worth: number | null
          rank: number | null
          slug: string
          specialization: string | null
          total_units_delivered: number | null
          upcoming_units: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          ceo_name?: string | null
          completed_projects?: number | null
          created_at?: string
          description?: string | null
          expected_completion_year?: number | null
          feature_image_url?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          is_hidden?: boolean | null
          license_number?: string | null
          logo_bg_color?: string | null
          logo_url?: string | null
          logo_url_dark?: string | null
          logo_url_processed?: string | null
          name: string
          notable_projects?: string | null
          offplan_projects?: number | null
          parent_company?: string | null
          portfolio_worth?: number | null
          rank?: number | null
          slug: string
          specialization?: string | null
          total_units_delivered?: number | null
          upcoming_units?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          ceo_name?: string | null
          completed_projects?: number | null
          created_at?: string
          description?: string | null
          expected_completion_year?: number | null
          feature_image_url?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          is_hidden?: boolean | null
          license_number?: string | null
          logo_bg_color?: string | null
          logo_url?: string | null
          logo_url_dark?: string | null
          logo_url_processed?: string | null
          name?: string
          notable_projects?: string | null
          offplan_projects?: number | null
          parent_company?: string | null
          portfolio_worth?: number | null
          rank?: number | null
          slug?: string
          specialization?: string | null
          total_units_delivered?: number | null
          upcoming_units?: number | null
          updated_at?: string
          website_url?: string | null
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
          {
            foreignKeyName: "discount_code_usages_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "broker_subscriptions_safe"
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
      dld_market_data: {
        Row: {
          data_json: Json
          data_key: string
          id: string
          updated_at: string
        }
        Insert: {
          data_json?: Json
          data_key: string
          id?: string
          updated_at?: string
        }
        Update: {
          data_json?: Json
          data_key?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      docusign_envelopes: {
        Row: {
          completed_at: string | null
          created_at: string | null
          document_name: string | null
          envelope_id: string
          id: string
          lead_id: string | null
          metadata: Json | null
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string | null
          template_name: string | null
          updated_at: string | null
          user_id: string
          voided_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          document_name?: string | null
          envelope_id: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string | null
          template_name?: string | null
          updated_at?: string | null
          user_id: string
          voided_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          document_name?: string | null
          envelope_id?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string | null
          template_name?: string | null
          updated_at?: string | null
          user_id?: string
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "docusign_envelopes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "docusign_envelopes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "docusign_envelopes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      draw_entries: {
        Row: {
          activity_points_at_entry: number
          draw_id: string
          entered_at: string | null
          entry_source: string
          id: string
          user_id: string
        }
        Insert: {
          activity_points_at_entry: number
          draw_id: string
          entered_at?: string | null
          entry_source: string
          id?: string
          user_id: string
        }
        Update: {
          activity_points_at_entry?: number
          draw_id?: string
          entered_at?: string | null
          entry_source?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "draw_entries_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "monthly_draws"
            referencedColumns: ["id"]
          },
        ]
      }
      economic_indicators: {
        Row: {
          category: string
          change_percent: number | null
          created_at: string | null
          effective_date: string
          id: string
          impact_on_real_estate: string | null
          indicator_name: string
          metadata: Json | null
          next_update_date: string | null
          previous_value: number | null
          region: string | null
          source: string | null
          unit: string | null
          value: number
        }
        Insert: {
          category: string
          change_percent?: number | null
          created_at?: string | null
          effective_date: string
          id?: string
          impact_on_real_estate?: string | null
          indicator_name: string
          metadata?: Json | null
          next_update_date?: string | null
          previous_value?: number | null
          region?: string | null
          source?: string | null
          unit?: string | null
          value: number
        }
        Update: {
          category?: string
          change_percent?: number | null
          created_at?: string | null
          effective_date?: string
          id?: string
          impact_on_real_estate?: string | null
          indicator_name?: string
          metadata?: Json | null
          next_update_date?: string | null
          previous_value?: number | null
          region?: string | null
          source?: string | null
          unit?: string | null
          value?: number
        }
        Relationships: []
      }
      edge_function_locks: {
        Row: {
          created_at: string
          execution_count: number | null
          expires_at: string
          function_name: string
          id: string
          last_duration_ms: number | null
          locked_at: string
          locked_by: string | null
        }
        Insert: {
          created_at?: string
          execution_count?: number | null
          expires_at?: string
          function_name: string
          id?: string
          last_duration_ms?: number | null
          locked_at?: string
          locked_by?: string | null
        }
        Update: {
          created_at?: string
          execution_count?: number | null
          expires_at?: string
          function_name?: string
          id?: string
          last_duration_ms?: number | null
          locked_at?: string
          locked_by?: string | null
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
          {
            foreignKeyName: "email_verifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_lockdowns: {
        Row: {
          actions_taken: string[] | null
          affected_departments: string[] | null
          created_at: string | null
          deactivated_at: string | null
          deactivated_by: string | null
          id: string
          is_active: boolean | null
          severity: Database["public"]["Enums"]["security_severity"]
          trigger_reason: string
          triggered_by: string
        }
        Insert: {
          actions_taken?: string[] | null
          affected_departments?: string[] | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          id?: string
          is_active?: boolean | null
          severity?: Database["public"]["Enums"]["security_severity"]
          trigger_reason: string
          triggered_by: string
        }
        Update: {
          actions_taken?: string[] | null
          affected_departments?: string[] | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          id?: string
          is_active?: boolean | null
          severity?: Database["public"]["Enums"]["security_severity"]
          trigger_reason?: string
          triggered_by?: string
        }
        Relationships: []
      }
      emirates: {
        Row: {
          country: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          ne_latitude: number | null
          ne_longitude: number | null
          reelly_id: number | null
          slug: string
          sw_latitude: number | null
          sw_longitude: number | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          ne_latitude?: number | null
          ne_longitude?: number | null
          reelly_id?: number | null
          slug: string
          sw_latitude?: number | null
          sw_longitude?: number | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          ne_latitude?: number | null
          ne_longitude?: number | null
          reelly_id?: number | null
          slug?: string
          sw_latitude?: number | null
          sw_longitude?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      employee_activity_audit: {
        Row: {
          actions_performed: Json | null
          activity_score: number | null
          calls_made: number | null
          clicks_count: number | null
          created_at: string
          device_info: string | null
          documents_accessed: number | null
          id: string
          idle_time_minutes: number | null
          ip_address: unknown
          leads_viewed: number | null
          login_at: string | null
          logout_at: string | null
          messages_sent: number | null
          pages_visited: string[] | null
          session_duration_minutes: number | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          actions_performed?: Json | null
          activity_score?: number | null
          calls_made?: number | null
          clicks_count?: number | null
          created_at?: string
          device_info?: string | null
          documents_accessed?: number | null
          id?: string
          idle_time_minutes?: number | null
          ip_address?: unknown
          leads_viewed?: number | null
          login_at?: string | null
          logout_at?: string | null
          messages_sent?: number | null
          pages_visited?: string[] | null
          session_duration_minutes?: number | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          actions_performed?: Json | null
          activity_score?: number | null
          calls_made?: number | null
          clicks_count?: number | null
          created_at?: string
          device_info?: string | null
          documents_accessed?: number | null
          id?: string
          idle_time_minutes?: number | null
          ip_address?: unknown
          leads_viewed?: number | null
          login_at?: string | null
          logout_at?: string | null
          messages_sent?: number | null
          pages_visited?: string[] | null
          session_duration_minutes?: number | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      employee_activity_sessions: {
        Row: {
          actions_performed: Json | null
          created_at: string | null
          duration_minutes: number | null
          employee_id: string | null
          id: string
          ip_address: string | null
          pages_visited: string[] | null
          session_end: string | null
          session_start: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          actions_performed?: Json | null
          created_at?: string | null
          duration_minutes?: number | null
          employee_id?: string | null
          id?: string
          ip_address?: string | null
          pages_visited?: string[] | null
          session_end?: string | null
          session_start?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          actions_performed?: Json | null
          created_at?: string | null
          duration_minutes?: number | null
          employee_id?: string | null
          id?: string
          ip_address?: string | null
          pages_visited?: string[] | null
          session_end?: string | null
          session_start?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      employee_chat_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          recipient_id: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          recipient_id: string
          sender_id: string
          sender_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          recipient_id?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: []
      }
      employee_commissions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          commission_amount: number
          commission_rate: number
          created_at: string | null
          currency: string
          deal_closed_date: string | null
          deal_id: string | null
          deal_reference: string | null
          deal_value: number
          employee_name: string
          id: string
          notes: string | null
          payment_date: string | null
          property_location: string | null
          property_type: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          currency?: string
          deal_closed_date?: string | null
          deal_id?: string | null
          deal_reference?: string | null
          deal_value?: number
          employee_name: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          property_location?: string | null
          property_type?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          currency?: string
          deal_closed_date?: string | null
          deal_id?: string | null
          deal_reference?: string | null
          deal_value?: number
          employee_name?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          property_location?: string | null
          property_type?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      employee_daily_metrics: {
        Row: {
          calls_made: number | null
          chats_handled: number | null
          created_at: string | null
          documents_processed: number | null
          emails_sent: number | null
          employee_id: string | null
          id: string
          leads_contacted: number | null
          meetings_attended: number | null
          metric_date: string | null
          notes: string | null
          performance_score: number | null
          tasks_completed: number | null
          total_hours_worked: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          calls_made?: number | null
          chats_handled?: number | null
          created_at?: string | null
          documents_processed?: number | null
          emails_sent?: number | null
          employee_id?: string | null
          id?: string
          leads_contacted?: number | null
          meetings_attended?: number | null
          metric_date?: string | null
          notes?: string | null
          performance_score?: number | null
          tasks_completed?: number | null
          total_hours_worked?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          calls_made?: number | null
          chats_handled?: number | null
          created_at?: string | null
          documents_processed?: number | null
          emails_sent?: number | null
          employee_id?: string | null
          id?: string
          leads_contacted?: number | null
          meetings_attended?: number | null
          metric_date?: string | null
          notes?: string | null
          performance_score?: number | null
          tasks_completed?: number | null
          total_hours_worked?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      employee_earnings_summary: {
        Row: {
          created_at: string | null
          currency: string | null
          department: string | null
          employee_name: string
          id: string
          month: number
          net_earnings: number | null
          total_bonus: number | null
          total_commission: number | null
          total_deductions: number | null
          total_salary: number | null
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          department?: string | null
          employee_name: string
          id?: string
          month: number
          net_earnings?: number | null
          total_bonus?: number | null
          total_commission?: number | null
          total_deductions?: number | null
          total_salary?: number | null
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          department?: string | null
          employee_name?: string
          id?: string
          month?: number
          net_earnings?: number | null
          total_bonus?: number | null
          total_commission?: number | null
          total_deductions?: number | null
          total_salary?: number | null
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      employee_emails: {
        Row: {
          created_at: string | null
          created_by: string
          department: string | null
          email_address: string
          email_prefix: string
          employee_name: string
          id: string
          notes: string | null
          password_hash: string
          position: string | null
          quota_mb: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          department?: string | null
          email_address: string
          email_prefix: string
          employee_name: string
          id?: string
          notes?: string | null
          password_hash: string
          position?: string | null
          quota_mb?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          department?: string | null
          email_address?: string
          email_prefix?: string
          employee_name?: string
          id?: string
          notes?: string | null
          password_hash?: string
          position?: string | null
          quota_mb?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_journey_logs: {
        Row: {
          created_at: string
          created_by: string | null
          employee_id: string | null
          event_category: string
          event_type: string
          id: string
          new_value: Json | null
          notes: string | null
          previous_value: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          event_category?: string
          event_type: string
          id?: string
          new_value?: Json | null
          notes?: string | null
          previous_value?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          event_category?: string
          event_type?: string
          id?: string
          new_value?: Json | null
          notes?: string | null
          previous_value?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_journey_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "crm_users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_notifications: {
        Row: {
          content: string | null
          created_at: string
          employee_id: string
          id: string
          is_read: boolean | null
          notification_type: string
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          employee_id: string
          id?: string
          is_read?: boolean | null
          notification_type: string
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          is_read?: boolean | null
          notification_type?: string
          title?: string
        }
        Relationships: []
      }
      employee_payment_history: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          description: string | null
          employee_name: string
          id: string
          payment_date: string
          payment_method: string | null
          payment_type: string
          period_end: string | null
          period_start: string | null
          processed_by: string | null
          reference_number: string | null
          related_commission_id: string | null
          related_salary_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          description?: string | null
          employee_name: string
          id?: string
          payment_date: string
          payment_method?: string | null
          payment_type: string
          period_end?: string | null
          period_start?: string | null
          processed_by?: string | null
          reference_number?: string | null
          related_commission_id?: string | null
          related_salary_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          description?: string | null
          employee_name?: string
          id?: string
          payment_date?: string
          payment_method?: string | null
          payment_type?: string
          period_end?: string | null
          period_start?: string | null
          processed_by?: string | null
          reference_number?: string | null
          related_commission_id?: string | null
          related_salary_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_payment_history_related_commission_id_fkey"
            columns: ["related_commission_id"]
            isOneToOne: false
            referencedRelation: "employee_commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_payment_history_related_salary_id_fkey"
            columns: ["related_salary_id"]
            isOneToOne: false
            referencedRelation: "employee_salaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_payment_history_related_salary_id_fkey"
            columns: ["related_salary_id"]
            isOneToOne: false
            referencedRelation: "employee_salaries_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_payment_history_related_salary_id_fkey"
            columns: ["related_salary_id"]
            isOneToOne: false
            referencedRelation: "employee_salaries_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_payment_history_related_salary_id_fkey"
            columns: ["related_salary_id"]
            isOneToOne: false
            referencedRelation: "employee_salaries_self_service"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_performance_summary: {
        Row: {
          achievements: Json | null
          activity_score_avg: number | null
          avg_call_duration_seconds: number | null
          avg_session_duration_minutes: number | null
          calls_made: number | null
          commission_earned: number | null
          conversion_rate: number | null
          created_at: string
          deals_closed: number | null
          id: string
          leads_converted: number | null
          leads_handled: number | null
          messages_sent: number | null
          month: string
          notes: string | null
          response_time_avg_minutes: number | null
          revenue_generated: number | null
          total_active_hours: number | null
          total_logins: number | null
          updated_at: string
          user_id: string
          warnings_received: number | null
        }
        Insert: {
          achievements?: Json | null
          activity_score_avg?: number | null
          avg_call_duration_seconds?: number | null
          avg_session_duration_minutes?: number | null
          calls_made?: number | null
          commission_earned?: number | null
          conversion_rate?: number | null
          created_at?: string
          deals_closed?: number | null
          id?: string
          leads_converted?: number | null
          leads_handled?: number | null
          messages_sent?: number | null
          month: string
          notes?: string | null
          response_time_avg_minutes?: number | null
          revenue_generated?: number | null
          total_active_hours?: number | null
          total_logins?: number | null
          updated_at?: string
          user_id: string
          warnings_received?: number | null
        }
        Update: {
          achievements?: Json | null
          activity_score_avg?: number | null
          avg_call_duration_seconds?: number | null
          avg_session_duration_minutes?: number | null
          calls_made?: number | null
          commission_earned?: number | null
          conversion_rate?: number | null
          created_at?: string
          deals_closed?: number | null
          id?: string
          leads_converted?: number | null
          leads_handled?: number | null
          messages_sent?: number | null
          month?: string
          notes?: string | null
          response_time_avg_minutes?: number | null
          revenue_generated?: number | null
          total_active_hours?: number | null
          total_logins?: number | null
          updated_at?: string
          user_id?: string
          warnings_received?: number | null
        }
        Relationships: []
      }
      employee_reports: {
        Row: {
          action_items: string[] | null
          ceo_notes: string | null
          concerns: string[] | null
          content: Json | null
          created_at: string
          department: string
          flagged_reason: string | null
          highlights: string[] | null
          id: string
          is_flagged: boolean | null
          metrics: Json | null
          report_date: string
          report_type: string
          reporter_id: string
          reporter_name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          action_items?: string[] | null
          ceo_notes?: string | null
          concerns?: string[] | null
          content?: Json | null
          created_at?: string
          department: string
          flagged_reason?: string | null
          highlights?: string[] | null
          id?: string
          is_flagged?: boolean | null
          metrics?: Json | null
          report_date?: string
          report_type?: string
          reporter_id: string
          reporter_name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          action_items?: string[] | null
          ceo_notes?: string | null
          concerns?: string[] | null
          content?: Json | null
          created_at?: string
          department?: string
          flagged_reason?: string | null
          highlights?: string[] | null
          id?: string
          is_flagged?: boolean | null
          metrics?: Json | null
          report_date?: string
          report_type?: string
          reporter_id?: string
          reporter_name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_salaries: {
        Row: {
          bank_account_encrypted: string | null
          bank_iban_encrypted: string | null
          bank_name: string | null
          bank_name_encrypted: string | null
          base_salary: number
          created_at: string | null
          created_by: string | null
          currency: string
          department: string
          effective_date: string
          employee_name: string
          end_date: string | null
          id: string
          notes: string | null
          salary_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bank_account_encrypted?: string | null
          bank_iban_encrypted?: string | null
          bank_name?: string | null
          bank_name_encrypted?: string | null
          base_salary?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string
          department: string
          effective_date?: string
          employee_name: string
          end_date?: string | null
          id?: string
          notes?: string | null
          salary_type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bank_account_encrypted?: string | null
          bank_iban_encrypted?: string | null
          bank_name?: string | null
          bank_name_encrypted?: string | null
          base_salary?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string
          department?: string
          effective_date?: string
          employee_name?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          salary_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      employee_salary_access_audit: {
        Row: {
          access_type: string
          accessed_at: string | null
          employee_salary_id: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          employee_salary_id?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          employee_salary_id?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      employee_status: {
        Row: {
          current_activity: string | null
          employee_name: string
          id: string
          is_typing: boolean | null
          last_active_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          current_activity?: string | null
          employee_name: string
          id: string
          is_typing?: boolean | null
          last_active_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          current_activity?: string | null
          employee_name?: string
          id?: string
          is_typing?: boolean | null
          last_active_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      enrichment_jobs: {
        Row: {
          completed_at: string | null
          created_by: string | null
          docs_added: number | null
          errors: number | null
          fields_updated: number | null
          id: string
          images_added: number | null
          log: Json | null
          processed: number | null
          started_at: string | null
          status: string
          stop_requested: boolean | null
          total_projects: number | null
        }
        Insert: {
          completed_at?: string | null
          created_by?: string | null
          docs_added?: number | null
          errors?: number | null
          fields_updated?: number | null
          id?: string
          images_added?: number | null
          log?: Json | null
          processed?: number | null
          started_at?: string | null
          status?: string
          stop_requested?: boolean | null
          total_projects?: number | null
        }
        Update: {
          completed_at?: string | null
          created_by?: string | null
          docs_added?: number | null
          errors?: number | null
          fields_updated?: number | null
          id?: string
          images_added?: number | null
          log?: Json | null
          processed?: number | null
          started_at?: string | null
          status?: string
          stop_requested?: boolean | null
          total_projects?: number | null
        }
        Relationships: []
      }
      esign_audit_log: {
        Row: {
          action: Database["public"]["Enums"]["esign_audit_action"]
          actor_email: string | null
          actor_id: string | null
          actor_name: string | null
          created_at: string
          description: string
          envelope_id: string
          id: string
          ip_address: unknown
          metadata: Json | null
          recipient_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["esign_audit_action"]
          actor_email?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          description: string
          envelope_id: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          recipient_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["esign_audit_action"]
          actor_email?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          description?: string
          envelope_id?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          recipient_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esign_audit_log_envelope_id_fkey"
            columns: ["envelope_id"]
            isOneToOne: false
            referencedRelation: "esign_envelopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esign_audit_log_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "esign_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      esign_documents: {
        Row: {
          created_at: string | null
          file_name: string | null
          file_url: string | null
          id: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      esign_envelopes: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          document_filename: string
          document_size_bytes: number | null
          document_url: string
          email_message: string | null
          email_subject: string | null
          expires_at: string | null
          id: string
          max_reminders: number | null
          metadata: Json | null
          name: string
          page_count: number | null
          reminder_frequency_days: number | null
          reminders_sent: number | null
          sender_email: string
          sender_id: string
          sender_name: string | null
          signed_document_url: string | null
          status: Database["public"]["Enums"]["esign_envelope_status"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          document_filename: string
          document_size_bytes?: number | null
          document_url: string
          email_message?: string | null
          email_subject?: string | null
          expires_at?: string | null
          id?: string
          max_reminders?: number | null
          metadata?: Json | null
          name: string
          page_count?: number | null
          reminder_frequency_days?: number | null
          reminders_sent?: number | null
          sender_email: string
          sender_id: string
          sender_name?: string | null
          signed_document_url?: string | null
          status?: Database["public"]["Enums"]["esign_envelope_status"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          document_filename?: string
          document_size_bytes?: number | null
          document_url?: string
          email_message?: string | null
          email_subject?: string | null
          expires_at?: string | null
          id?: string
          max_reminders?: number | null
          metadata?: Json | null
          name?: string
          page_count?: number | null
          reminder_frequency_days?: number | null
          reminders_sent?: number | null
          sender_email?: string
          sender_id?: string
          sender_name?: string | null
          signed_document_url?: string | null
          status?: Database["public"]["Enums"]["esign_envelope_status"]
          updated_at?: string
        }
        Relationships: []
      }
      esign_fields: {
        Row: {
          completed_at: string | null
          created_at: string
          envelope_id: string
          field_type: Database["public"]["Enums"]["esign_field_type"]
          field_value: string | null
          height: number
          id: string
          is_completed: boolean
          is_required: boolean
          page_number: number
          placeholder: string | null
          recipient_id: string
          updated_at: string
          width: number
          x_position: number
          y_position: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          envelope_id: string
          field_type?: Database["public"]["Enums"]["esign_field_type"]
          field_value?: string | null
          height?: number
          id?: string
          is_completed?: boolean
          is_required?: boolean
          page_number?: number
          placeholder?: string | null
          recipient_id: string
          updated_at?: string
          width?: number
          x_position: number
          y_position: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          envelope_id?: string
          field_type?: Database["public"]["Enums"]["esign_field_type"]
          field_value?: string | null
          height?: number
          id?: string
          is_completed?: boolean
          is_required?: boolean
          page_number?: number
          placeholder?: string | null
          recipient_id?: string
          updated_at?: string
          width?: number
          x_position?: number
          y_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "esign_fields_envelope_id_fkey"
            columns: ["envelope_id"]
            isOneToOne: false
            referencedRelation: "esign_envelopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esign_fields_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "esign_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      esign_recipients: {
        Row: {
          created_at: string
          decline_reason: string | null
          declined_at: string | null
          email: string
          envelope_id: string
          id: string
          initials_data: string | null
          name: string
          phone: string | null
          sent_at: string | null
          signature_data: string | null
          signed_at: string | null
          signed_ip_address: unknown
          signed_user_agent: string | null
          signing_order: number
          signing_token: string
          status: Database["public"]["Enums"]["esign_recipient_status"]
          token_expires_at: string | null
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          created_at?: string
          decline_reason?: string | null
          declined_at?: string | null
          email: string
          envelope_id: string
          id?: string
          initials_data?: string | null
          name: string
          phone?: string | null
          sent_at?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signed_ip_address?: unknown
          signed_user_agent?: string | null
          signing_order?: number
          signing_token?: string
          status?: Database["public"]["Enums"]["esign_recipient_status"]
          token_expires_at?: string | null
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          created_at?: string
          decline_reason?: string | null
          declined_at?: string | null
          email?: string
          envelope_id?: string
          id?: string
          initials_data?: string | null
          name?: string
          phone?: string | null
          sent_at?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signed_ip_address?: unknown
          signed_user_agent?: string | null
          signing_order?: number
          signing_token?: string
          status?: Database["public"]["Enums"]["esign_recipient_status"]
          token_expires_at?: string | null
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esign_recipients_envelope_id_fkey"
            columns: ["envelope_id"]
            isOneToOne: false
            referencedRelation: "esign_envelopes"
            referencedColumns: ["id"]
          },
        ]
      }
      esign_signed_documents: {
        Row: {
          certificate_data: Json | null
          certificate_url: string | null
          created_at: string
          document_filename: string
          document_hash: string | null
          document_size_bytes: number | null
          document_url: string
          envelope_id: string
          id: string
        }
        Insert: {
          certificate_data?: Json | null
          certificate_url?: string | null
          created_at?: string
          document_filename: string
          document_hash?: string | null
          document_size_bytes?: number | null
          document_url: string
          envelope_id: string
          id?: string
        }
        Update: {
          certificate_data?: Json | null
          certificate_url?: string | null
          created_at?: string
          document_filename?: string
          document_hash?: string | null
          document_size_bytes?: number | null
          document_url?: string
          envelope_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "esign_signed_documents_envelope_id_fkey"
            columns: ["envelope_id"]
            isOneToOne: false
            referencedRelation: "esign_envelopes"
            referencedColumns: ["id"]
          },
        ]
      }
      ethics_violations: {
        Row: {
          action_required: string | null
          ai_agent_id: string | null
          created_at: string | null
          department: string | null
          description: string
          evidence: Json | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          severity: Database["public"]["Enums"]["security_severity"]
          status: string | null
          violation_type: string
          violator_id: string | null
          violator_type: string | null
        }
        Insert: {
          action_required?: string | null
          ai_agent_id?: string | null
          created_at?: string | null
          department?: string | null
          description: string
          evidence?: Json | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity: Database["public"]["Enums"]["security_severity"]
          status?: string | null
          violation_type: string
          violator_id?: string | null
          violator_type?: string | null
        }
        Update: {
          action_required?: string | null
          ai_agent_id?: string | null
          created_at?: string | null
          department?: string | null
          description?: string
          evidence?: Json | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: Database["public"]["Enums"]["security_severity"]
          status?: string | null
          violation_type?: string
          violator_id?: string | null
          violator_type?: string | null
        }
        Relationships: []
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
      executive_automation_rules: {
        Row: {
          action_config: Json
          created_at: string
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          rule_name: string
          rule_type: string
          trigger_conditions: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          action_config?: Json
          created_at?: string
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          rule_name: string
          rule_type: string
          trigger_conditions?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          action_config?: Json
          created_at?: string
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          rule_name?: string
          rule_type?: string
          trigger_conditions?: Json
          updated_at?: string
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
      executive_conversation_memory: {
        Row: {
          confidence_score: number | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_referenced_at: string | null
          memory_key: string
          memory_type: string
          memory_value: string
          reference_count: number | null
          source: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_referenced_at?: string | null
          memory_key: string
          memory_type: string
          memory_value: string
          reference_count?: number | null
          source?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_referenced_at?: string | null
          memory_key?: string
          memory_type?: string
          memory_value?: string
          reference_count?: number | null
          source?: string | null
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
      executive_integrations: {
        Row: {
          config: Json | null
          created_at: string
          credentials_encrypted: string | null
          error_message: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          service_name: string
          service_type: string
          sync_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          credentials_encrypted?: string | null
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          service_name: string
          service_type: string
          sync_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          credentials_encrypted?: string | null
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          service_name?: string
          service_type?: string
          sync_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      executive_knowledge_base: {
        Row: {
          access_count: number | null
          category: string
          content: string
          created_at: string
          id: string
          importance_score: number | null
          is_active: boolean | null
          keywords: string[] | null
          last_accessed_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_count?: number | null
          category: string
          content: string
          created_at?: string
          id?: string
          importance_score?: number | null
          is_active?: boolean | null
          keywords?: string[] | null
          last_accessed_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_count?: number | null
          category?: string
          content?: string
          created_at?: string
          id?: string
          importance_score?: number | null
          is_active?: boolean | null
          keywords?: string[] | null
          last_accessed_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      executive_response_templates: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          priority: number | null
          response_template: string
          tone: string | null
          trigger_patterns: string[]
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          response_template: string
          tone?: string | null
          trigger_patterns?: string[]
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          response_template?: string
          tone?: string | null
          trigger_patterns?: string[]
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
      external_data_sources: {
        Row: {
          auth_config: Json | null
          auth_type: string | null
          base_url: string
          created_at: string | null
          extraction_schedule: string | null
          id: string
          is_active: boolean | null
          last_extraction_at: string | null
          name: string
          source_type: string
          updated_at: string | null
        }
        Insert: {
          auth_config?: Json | null
          auth_type?: string | null
          base_url: string
          created_at?: string | null
          extraction_schedule?: string | null
          id?: string
          is_active?: boolean | null
          last_extraction_at?: string | null
          name: string
          source_type?: string
          updated_at?: string | null
        }
        Update: {
          auth_config?: Json | null
          auth_type?: string | null
          base_url?: string
          created_at?: string | null
          extraction_schedule?: string | null
          id?: string
          is_active?: boolean | null
          last_extraction_at?: string | null
          name?: string
          source_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      extraction_job_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          records_found: number | null
          records_matched: number | null
          records_pending: number | null
          source_id: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          records_found?: number | null
          records_matched?: number | null
          records_pending?: number | null
          source_id?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          records_found?: number | null
          records_matched?: number | null
          records_pending?: number | null
          source_id?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_job_logs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "external_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_unanswered_questions: {
        Row: {
          answer_added: boolean
          created_at: string
          id: string
          is_reviewed: boolean
          matched_category: string | null
          notes: string | null
          question: string
          reviewed_at: string | null
          reviewed_by: string | null
          search_timestamp: string
          updated_at: string
          user_email: string | null
          user_name: string | null
          user_phone: string | null
        }
        Insert: {
          answer_added?: boolean
          created_at?: string
          id?: string
          is_reviewed?: boolean
          matched_category?: string | null
          notes?: string | null
          question: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          search_timestamp?: string
          updated_at?: string
          user_email?: string | null
          user_name?: string | null
          user_phone?: string | null
        }
        Update: {
          answer_added?: boolean
          created_at?: string
          id?: string
          is_reviewed?: boolean
          matched_category?: string | null
          notes?: string | null
          question?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          search_timestamp?: string
          updated_at?: string
          user_email?: string | null
          user_name?: string | null
          user_phone?: string | null
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
      file_provenance: {
        Row: {
          access_history: Json | null
          created_at: string | null
          department: string | null
          encryption_status: string | null
          file_hash: string
          file_id: string
          file_name: string
          id: string
          is_tampered: boolean | null
          modifications: Json | null
          updated_at: string | null
          uploader_id: string | null
          watermark_id: string | null
        }
        Insert: {
          access_history?: Json | null
          created_at?: string | null
          department?: string | null
          encryption_status?: string | null
          file_hash: string
          file_id: string
          file_name: string
          id?: string
          is_tampered?: boolean | null
          modifications?: Json | null
          updated_at?: string | null
          uploader_id?: string | null
          watermark_id?: string | null
        }
        Update: {
          access_history?: Json | null
          created_at?: string | null
          department?: string | null
          encryption_status?: string | null
          file_hash?: string
          file_id?: string
          file_name?: string
          id?: string
          is_tampered?: boolean | null
          modifications?: Json | null
          updated_at?: string | null
          uploader_id?: string | null
          watermark_id?: string | null
        }
        Relationships: []
      }
      forms_submissions: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          email_hash: string | null
          exact_location: Json | null
          form_name: string
          form_type: string
          id: string
          ip_address: string | null
          ip_hash: string | null
          is_processed: boolean | null
          notes: string | null
          page_source: string | null
          phone_hash: string | null
          processed_at: string | null
          processed_by: string | null
          session_id: string | null
          submission_data: Json
          submitter_email: string | null
          submitter_name: string | null
          submitter_phone: string | null
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          email_hash?: string | null
          exact_location?: Json | null
          form_name: string
          form_type: string
          id?: string
          ip_address?: string | null
          ip_hash?: string | null
          is_processed?: boolean | null
          notes?: string | null
          page_source?: string | null
          phone_hash?: string | null
          processed_at?: string | null
          processed_by?: string | null
          session_id?: string | null
          submission_data?: Json
          submitter_email?: string | null
          submitter_name?: string | null
          submitter_phone?: string | null
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          email_hash?: string | null
          exact_location?: Json | null
          form_name?: string
          form_type?: string
          id?: string
          ip_address?: string | null
          ip_hash?: string | null
          is_processed?: boolean | null
          notes?: string | null
          page_source?: string | null
          phone_hash?: string | null
          processed_at?: string | null
          processed_by?: string | null
          session_id?: string | null
          submission_data?: Json
          submitter_email?: string | null
          submitter_name?: string | null
          submitter_phone?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      founder_chat_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          id: string
          mentions: string[] | null
          role: string
          session_id: string
          task_status: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          id?: string
          mentions?: string[] | null
          role: string
          session_id: string
          task_status?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          mentions?: string[] | null
          role?: string
          session_id?: string
          task_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "founder_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "founder_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          message_count: number | null
          summary: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_count?: number | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_count?: number | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      gmail_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          email_address: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          refresh_token: string
          scopes: string[] | null
          token_expires_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          email_address: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          refresh_token: string
          scopes?: string[] | null
          token_expires_at: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          email_address?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string
          scopes?: string[] | null
          token_expires_at?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      handover_alerts: {
        Row: {
          alert_type: string
          client_investor_id: string | null
          client_name: string | null
          created_at: string
          handover_date: string | null
          id: string
          is_read: boolean | null
          project_name: string | null
        }
        Insert: {
          alert_type: string
          client_investor_id?: string | null
          client_name?: string | null
          created_at?: string
          handover_date?: string | null
          id?: string
          is_read?: boolean | null
          project_name?: string | null
        }
        Update: {
          alert_type?: string
          client_investor_id?: string | null
          client_name?: string | null
          created_at?: string
          handover_date?: string | null
          id?: string
          is_read?: boolean | null
          project_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "handover_alerts_client_investor_id_fkey"
            columns: ["client_investor_id"]
            isOneToOne: false
            referencedRelation: "client_investors"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_access_logs: {
        Row: {
          access_type: string
          accessed_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          records_accessed: number | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          records_accessed?: number | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          records_accessed?: number | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
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
          ai_ranking: number | null
          ai_summary: string | null
          consent_accurate: boolean
          consent_terms: boolean
          created_at: string
          current_location_city: string
          current_location_country: string
          cv_url: string | null
          department_category: string | null
          email: string
          experience_years: number | null
          flag_reason: string | null
          full_name: string
          id: string
          is_viewed: boolean
          languages: string[] | null
          nationality: string
          phone_e164: string
          position_applied: string | null
          preferred_language: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          skills: string[] | null
          source: string | null
          status: Database["public"]["Enums"]["hr_application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_ranking?: number | null
          ai_summary?: string | null
          consent_accurate?: boolean
          consent_terms?: boolean
          created_at?: string
          current_location_city: string
          current_location_country: string
          cv_url?: string | null
          department_category?: string | null
          email: string
          experience_years?: number | null
          flag_reason?: string | null
          full_name: string
          id?: string
          is_viewed?: boolean
          languages?: string[] | null
          nationality: string
          phone_e164: string
          position_applied?: string | null
          preferred_language?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills?: string[] | null
          source?: string | null
          status?: Database["public"]["Enums"]["hr_application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_ranking?: number | null
          ai_summary?: string | null
          consent_accurate?: boolean
          consent_terms?: boolean
          created_at?: string
          current_location_city?: string
          current_location_country?: string
          cv_url?: string | null
          department_category?: string | null
          email?: string
          experience_years?: number | null
          flag_reason?: string | null
          full_name?: string
          id?: string
          is_viewed?: boolean
          languages?: string[] | null
          nationality?: string
          phone_e164?: string
          position_applied?: string | null
          preferred_language?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills?: string[] | null
          source?: string | null
          status?: Database["public"]["Enums"]["hr_application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hr_approval_requests: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          current_stage: number | null
          department: string | null
          description: string | null
          id: string
          overall_status: string | null
          reference_id: string | null
          reference_table: string | null
          request_type: Database["public"]["Enums"]["approval_type"]
          requester_id: string
          requester_name: string
          stage1_approver_id: string | null
          stage1_approver_name: string | null
          stage1_decision_at: string | null
          stage1_notes: string | null
          stage1_status: string | null
          stage2_approver_id: string | null
          stage2_approver_name: string | null
          stage2_decision_at: string | null
          stage2_notes: string | null
          stage2_status: string | null
          stage3_approver_id: string | null
          stage3_approver_name: string | null
          stage3_decision_at: string | null
          stage3_notes: string | null
          stage3_status: string | null
          stages: Json | null
          title: string
          total_stages: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          current_stage?: number | null
          department?: string | null
          description?: string | null
          id?: string
          overall_status?: string | null
          reference_id?: string | null
          reference_table?: string | null
          request_type: Database["public"]["Enums"]["approval_type"]
          requester_id: string
          requester_name: string
          stage1_approver_id?: string | null
          stage1_approver_name?: string | null
          stage1_decision_at?: string | null
          stage1_notes?: string | null
          stage1_status?: string | null
          stage2_approver_id?: string | null
          stage2_approver_name?: string | null
          stage2_decision_at?: string | null
          stage2_notes?: string | null
          stage2_status?: string | null
          stage3_approver_id?: string | null
          stage3_approver_name?: string | null
          stage3_decision_at?: string | null
          stage3_notes?: string | null
          stage3_status?: string | null
          stages?: Json | null
          title: string
          total_stages?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          current_stage?: number | null
          department?: string | null
          description?: string | null
          id?: string
          overall_status?: string | null
          reference_id?: string | null
          reference_table?: string | null
          request_type?: Database["public"]["Enums"]["approval_type"]
          requester_id?: string
          requester_name?: string
          stage1_approver_id?: string | null
          stage1_approver_name?: string | null
          stage1_decision_at?: string | null
          stage1_notes?: string | null
          stage1_status?: string | null
          stage2_approver_id?: string | null
          stage2_approver_name?: string | null
          stage2_decision_at?: string | null
          stage2_notes?: string | null
          stage2_status?: string | null
          stage3_approver_id?: string | null
          stage3_approver_name?: string | null
          stage3_decision_at?: string | null
          stage3_notes?: string | null
          stage3_status?: string | null
          stages?: Json | null
          title?: string
          total_stages?: number | null
          updated_at?: string | null
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
      hr_candidates: {
        Row: {
          ai_analysis: Json | null
          ai_ranking: number | null
          ai_score: number | null
          candidate_name: string
          certifications: string[] | null
          cover_letter_url: string | null
          created_at: string
          cv_file_name: string | null
          cv_file_url: string | null
          education_level: string | null
          email: string
          experience_years: number | null
          final_decision: string | null
          final_decision_by: string | null
          final_decision_date: string | null
          final_decision_notes: string | null
          first_interview_date: string | null
          first_interview_notes: string | null
          first_interview_recording_url: string | null
          first_interviewer_decision: string | null
          id: string
          interview_stage: string | null
          phone: string | null
          position_applied: string
          second_interview_date: string | null
          second_interview_notes: string | null
          second_interview_recording_url: string | null
          second_interviewer_decision: string | null
          skills: string[] | null
          source: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          ai_ranking?: number | null
          ai_score?: number | null
          candidate_name: string
          certifications?: string[] | null
          cover_letter_url?: string | null
          created_at?: string
          cv_file_name?: string | null
          cv_file_url?: string | null
          education_level?: string | null
          email: string
          experience_years?: number | null
          final_decision?: string | null
          final_decision_by?: string | null
          final_decision_date?: string | null
          final_decision_notes?: string | null
          first_interview_date?: string | null
          first_interview_notes?: string | null
          first_interview_recording_url?: string | null
          first_interviewer_decision?: string | null
          id?: string
          interview_stage?: string | null
          phone?: string | null
          position_applied: string
          second_interview_date?: string | null
          second_interview_notes?: string | null
          second_interview_recording_url?: string | null
          second_interviewer_decision?: string | null
          skills?: string[] | null
          source?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          ai_ranking?: number | null
          ai_score?: number | null
          candidate_name?: string
          certifications?: string[] | null
          cover_letter_url?: string | null
          created_at?: string
          cv_file_name?: string | null
          cv_file_url?: string | null
          education_level?: string | null
          email?: string
          experience_years?: number | null
          final_decision?: string | null
          final_decision_by?: string | null
          final_decision_date?: string | null
          final_decision_notes?: string | null
          first_interview_date?: string | null
          first_interview_notes?: string | null
          first_interview_recording_url?: string | null
          first_interviewer_decision?: string | null
          id?: string
          interview_stage?: string | null
          phone?: string | null
          position_applied?: string
          second_interview_date?: string | null
          second_interview_notes?: string | null
          second_interview_recording_url?: string | null
          second_interviewer_decision?: string | null
          skills?: string[] | null
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string
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
      hr_competitor_tracking: {
        Row: {
          company_name: string
          created_at: string | null
          employee_count: number | null
          id: string
          instagram_url: string | null
          is_new_company: boolean | null
          last_checked_at: string | null
          linkedin_url: string | null
          notable_achievements: string[] | null
          notes: string | null
          registration_date: string | null
          threat_level: string | null
          top_brokers: string[] | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          employee_count?: number | null
          id?: string
          instagram_url?: string | null
          is_new_company?: boolean | null
          last_checked_at?: string | null
          linkedin_url?: string | null
          notable_achievements?: string[] | null
          notes?: string | null
          registration_date?: string | null
          threat_level?: string | null
          top_brokers?: string[] | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          employee_count?: number | null
          id?: string
          instagram_url?: string | null
          is_new_company?: boolean | null
          last_checked_at?: string | null
          linkedin_url?: string | null
          notable_achievements?: string[] | null
          notes?: string | null
          registration_date?: string | null
          threat_level?: string | null
          top_brokers?: string[] | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      hr_cv_submissions: {
        Row: {
          ai_ranking: number | null
          ai_summary: string | null
          chat_session_id: string | null
          cover_letter: string | null
          created_at: string
          cv_url: string | null
          email: string
          full_name: string
          id: string
          is_viewed: boolean
          notes: string | null
          phone: string | null
          position_applied: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_ranking?: number | null
          ai_summary?: string | null
          chat_session_id?: string | null
          cover_letter?: string | null
          created_at?: string
          cv_url?: string | null
          email: string
          full_name: string
          id?: string
          is_viewed?: boolean
          notes?: string | null
          phone?: string | null
          position_applied?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_ranking?: number | null
          ai_summary?: string | null
          chat_session_id?: string | null
          cover_letter?: string | null
          created_at?: string
          cv_url?: string | null
          email?: string
          full_name?: string
          id?: string
          is_viewed?: boolean
          notes?: string | null
          phone?: string | null
          position_applied?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_cv_submissions_chat_session_id_fkey"
            columns: ["chat_session_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employee_onboarding: {
        Row: {
          completed_at: string | null
          created_at: string | null
          document_urls: string[] | null
          employee_id: string | null
          id: string
          notes: string | null
          status: string | null
          task_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          document_urls?: string[] | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          task_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          document_urls?: string[] | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          task_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_employee_onboarding_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employee_onboarding_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employee_onboarding_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "hr_onboarding_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employees: {
        Row: {
          candidate_id: string | null
          certifications: string[] | null
          created_at: string
          created_by: string
          cv_url_encrypted: string | null
          department: string | null
          email_encrypted: string | null
          email_hash: string | null
          employee_status: string | null
          full_name: string
          id: string
          phone_encrypted: string | null
          phone_hash: string | null
          position: string
          skills: string[] | null
          start_date: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          candidate_id?: string | null
          certifications?: string[] | null
          created_at?: string
          created_by: string
          cv_url_encrypted?: string | null
          department?: string | null
          email_encrypted?: string | null
          email_hash?: string | null
          employee_status?: string | null
          full_name: string
          id?: string
          phone_encrypted?: string | null
          phone_hash?: string | null
          position: string
          skills?: string[] | null
          start_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          candidate_id?: string | null
          certifications?: string[] | null
          created_at?: string
          created_by?: string
          cv_url_encrypted?: string | null
          department?: string | null
          email_encrypted?: string | null
          email_hash?: string | null
          employee_status?: string | null
          full_name?: string
          id?: string
          phone_encrypted?: string | null
          phone_hash?: string | null
          position?: string
          skills?: string[] | null
          start_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employees_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "hr_candidates"
            referencedColumns: ["id"]
          },
        ]
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
      hr_interview_invitations: {
        Row: {
          calendar_added: boolean | null
          calendar_event_id: string | null
          candidate_confirmed: boolean | null
          candidate_confirmed_at: string | null
          candidate_id: string
          created_at: string
          created_by: string
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          interview_stage: string
          interviewer_name: string
          interviewer_title: string
          meeting_link: string | null
          scheduled_date: string
          whatsapp_sent: boolean | null
          whatsapp_sent_at: string | null
        }
        Insert: {
          calendar_added?: boolean | null
          calendar_event_id?: string | null
          candidate_confirmed?: boolean | null
          candidate_confirmed_at?: string | null
          candidate_id: string
          created_at?: string
          created_by: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          interview_stage: string
          interviewer_name: string
          interviewer_title: string
          meeting_link?: string | null
          scheduled_date: string
          whatsapp_sent?: boolean | null
          whatsapp_sent_at?: string | null
        }
        Update: {
          calendar_added?: boolean | null
          calendar_event_id?: string | null
          candidate_confirmed?: boolean | null
          candidate_confirmed_at?: string | null
          candidate_id?: string
          created_at?: string
          created_by?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          interview_stage?: string
          interviewer_name?: string
          interviewer_title?: string
          meeting_link?: string | null
          scheduled_date?: string
          whatsapp_sent?: boolean | null
          whatsapp_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_interview_invitations_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "hr_candidates"
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
      hr_job_applicants: {
        Row: {
          assigned_hr_user_id: string | null
          cover_letter: string | null
          created_at: string | null
          current_salary: number | null
          cv_url: string | null
          department: string
          email: string
          expected_salary: number | null
          experience_years: number | null
          full_name: string
          id: string
          interview_date: string | null
          job_offer_id: string | null
          job_offer_sent_at: string | null
          job_offer_signed_at: string | null
          linkedin_url: string | null
          notes: string | null
          phone: string | null
          portfolio_url: string | null
          signature_data: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_hr_user_id?: string | null
          cover_letter?: string | null
          created_at?: string | null
          current_salary?: number | null
          cv_url?: string | null
          department: string
          email: string
          expected_salary?: number | null
          experience_years?: number | null
          full_name: string
          id?: string
          interview_date?: string | null
          job_offer_id?: string | null
          job_offer_sent_at?: string | null
          job_offer_signed_at?: string | null
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          portfolio_url?: string | null
          signature_data?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_hr_user_id?: string | null
          cover_letter?: string | null
          created_at?: string | null
          current_salary?: number | null
          cv_url?: string | null
          department?: string
          email?: string
          expected_salary?: number | null
          experience_years?: number | null
          full_name?: string
          id?: string
          interview_date?: string | null
          job_offer_id?: string | null
          job_offer_sent_at?: string | null
          job_offer_signed_at?: string | null
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          portfolio_url?: string | null
          signature_data?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_job_applicants_job_offer_id_fkey"
            columns: ["job_offer_id"]
            isOneToOne: false
            referencedRelation: "hr_job_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_job_offers: {
        Row: {
          benefits: string[] | null
          commission_structure: string | null
          created_at: string | null
          created_by: string | null
          department: string
          description: string | null
          document_name: string | null
          document_url: string | null
          id: string
          is_active: boolean | null
          position_title: string
          salary_range_max: number | null
          salary_range_min: number | null
          updated_at: string | null
        }
        Insert: {
          benefits?: string[] | null
          commission_structure?: string | null
          created_at?: string | null
          created_by?: string | null
          department: string
          description?: string | null
          document_name?: string | null
          document_url?: string | null
          id?: string
          is_active?: boolean | null
          position_title: string
          salary_range_max?: number | null
          salary_range_min?: number | null
          updated_at?: string | null
        }
        Update: {
          benefits?: string[] | null
          commission_structure?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string
          description?: string | null
          document_name?: string | null
          document_url?: string | null
          id?: string
          is_active?: boolean | null
          position_title?: string
          salary_range_max?: number | null
          salary_range_min?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hr_leave_balance: {
        Row: {
          accrued_days: number | null
          carried_forward: number | null
          created_at: string | null
          employee_id: string | null
          entitled_days: number | null
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          pending_days: number | null
          remaining_days: number | null
          taken_days: number | null
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          accrued_days?: number | null
          carried_forward?: number | null
          created_at?: string | null
          employee_id?: string | null
          entitled_days?: number | null
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          pending_days?: number | null
          remaining_days?: number | null
          taken_days?: number | null
          updated_at?: string | null
          user_id: string
          year?: number
        }
        Update: {
          accrued_days?: number | null
          carried_forward?: number | null
          created_at?: string | null
          employee_id?: string | null
          entitled_days?: number | null
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          pending_days?: number | null
          remaining_days?: number | null
          taken_days?: number | null
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "hr_leave_balance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_leave_balance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_leave_policy: {
        Row: {
          accrual_rate_per_month: number | null
          carry_forward_days: number | null
          created_at: string | null
          days_per_year: number
          id: string
          is_active: boolean | null
          leave_type: Database["public"]["Enums"]["leave_type"]
          max_consecutive_days: number | null
          min_service_days: number | null
          policy_name: string
          requires_document: boolean | null
          updated_at: string | null
        }
        Insert: {
          accrual_rate_per_month?: number | null
          carry_forward_days?: number | null
          created_at?: string | null
          days_per_year?: number
          id?: string
          is_active?: boolean | null
          leave_type: Database["public"]["Enums"]["leave_type"]
          max_consecutive_days?: number | null
          min_service_days?: number | null
          policy_name: string
          requires_document?: boolean | null
          updated_at?: string | null
        }
        Update: {
          accrual_rate_per_month?: number | null
          carry_forward_days?: number | null
          created_at?: string | null
          days_per_year?: number
          id?: string
          is_active?: boolean | null
          leave_type?: Database["public"]["Enums"]["leave_type"]
          max_consecutive_days?: number | null
          min_service_days?: number | null
          policy_name?: string
          requires_document?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hr_leave_requests: {
        Row: {
          created_at: string | null
          current_stage: string | null
          department: string | null
          employee_id: string | null
          employee_name: string
          end_date: string
          hr_decision: Database["public"]["Enums"]["leave_status"] | null
          hr_decision_at: string | null
          hr_id: string | null
          hr_name: string | null
          hr_notes: string | null
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          manager_decision: Database["public"]["Enums"]["leave_status"] | null
          manager_decision_at: string | null
          manager_id: string | null
          manager_name: string | null
          manager_notes: string | null
          owner_decision: Database["public"]["Enums"]["leave_status"] | null
          owner_decision_at: string | null
          owner_id: string | null
          owner_name: string | null
          owner_notes: string | null
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"] | null
          supporting_document_url: string | null
          total_days: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_stage?: string | null
          department?: string | null
          employee_id?: string | null
          employee_name: string
          end_date: string
          hr_decision?: Database["public"]["Enums"]["leave_status"] | null
          hr_decision_at?: string | null
          hr_id?: string | null
          hr_name?: string | null
          hr_notes?: string | null
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          manager_decision?: Database["public"]["Enums"]["leave_status"] | null
          manager_decision_at?: string | null
          manager_id?: string | null
          manager_name?: string | null
          manager_notes?: string | null
          owner_decision?: Database["public"]["Enums"]["leave_status"] | null
          owner_decision_at?: string | null
          owner_id?: string | null
          owner_name?: string | null
          owner_notes?: string | null
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          supporting_document_url?: string | null
          total_days: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_stage?: string | null
          department?: string | null
          employee_id?: string | null
          employee_name?: string
          end_date?: string
          hr_decision?: Database["public"]["Enums"]["leave_status"] | null
          hr_decision_at?: string | null
          hr_id?: string | null
          hr_name?: string | null
          hr_notes?: string | null
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          manager_decision?: Database["public"]["Enums"]["leave_status"] | null
          manager_decision_at?: string | null
          manager_id?: string | null
          manager_name?: string | null
          manager_notes?: string | null
          owner_decision?: Database["public"]["Enums"]["leave_status"] | null
          owner_decision_at?: string | null
          owner_id?: string | null
          owner_name?: string | null
          owner_notes?: string | null
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          supporting_document_url?: string | null
          total_days?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_linkedin_insights: {
        Row: {
          action_taken: string | null
          action_taken_by: string | null
          company: string | null
          created_at: string | null
          fake_indicators: string[] | null
          id: string
          insight_type: string
          is_fake: boolean | null
          is_verified: boolean | null
          metadata: Json | null
          notes: string | null
          profile_name: string | null
          profile_title: string | null
          relevance_score: number | null
          source_profile_url: string | null
          updated_at: string | null
        }
        Insert: {
          action_taken?: string | null
          action_taken_by?: string | null
          company?: string | null
          created_at?: string | null
          fake_indicators?: string[] | null
          id?: string
          insight_type: string
          is_fake?: boolean | null
          is_verified?: boolean | null
          metadata?: Json | null
          notes?: string | null
          profile_name?: string | null
          profile_title?: string | null
          relevance_score?: number | null
          source_profile_url?: string | null
          updated_at?: string | null
        }
        Update: {
          action_taken?: string | null
          action_taken_by?: string | null
          company?: string | null
          created_at?: string | null
          fake_indicators?: string[] | null
          id?: string
          insight_type?: string
          is_fake?: boolean | null
          is_verified?: boolean | null
          metadata?: Json | null
          notes?: string | null
          profile_name?: string | null
          profile_title?: string | null
          relevance_score?: number | null
          source_profile_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      hr_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          reference_id: string | null
          reference_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      hr_onboarding_tasks: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_mandatory: boolean | null
          order_index: number | null
          required_documents: string[] | null
          task_category: string | null
          task_description: string | null
          task_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          order_index?: number | null
          required_documents?: string[] | null
          task_category?: string | null
          task_description?: string | null
          task_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          order_index?: number | null
          required_documents?: string[] | null
          task_category?: string | null
          task_description?: string | null
          task_name?: string
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
      hr_salary_benchmarks: {
        Row: {
          benefits_standard: string[] | null
          commission_typical: string | null
          created_at: string | null
          data_source: string | null
          department: string
          experience_level: string | null
          id: string
          last_updated: string | null
          market_salary_avg: number | null
          market_salary_max: number | null
          market_salary_min: number | null
          notes: string | null
          position_title: string
          updated_at: string | null
        }
        Insert: {
          benefits_standard?: string[] | null
          commission_typical?: string | null
          created_at?: string | null
          data_source?: string | null
          department: string
          experience_level?: string | null
          id?: string
          last_updated?: string | null
          market_salary_avg?: number | null
          market_salary_max?: number | null
          market_salary_min?: number | null
          notes?: string | null
          position_title: string
          updated_at?: string | null
        }
        Update: {
          benefits_standard?: string[] | null
          commission_typical?: string | null
          created_at?: string | null
          data_source?: string | null
          department?: string
          experience_level?: string | null
          id?: string
          last_updated?: string | null
          market_salary_avg?: number | null
          market_salary_max?: number | null
          market_salary_min?: number | null
          notes?: string | null
          position_title?: string
          updated_at?: string | null
        }
        Relationships: []
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
      hr_warnings: {
        Row: {
          created_at: string | null
          department: string | null
          description: string
          employee_id: string | null
          employee_name: string
          employee_response: string | null
          employee_signature_url: string | null
          employee_signed_at: string | null
          id: string
          incident_date: string | null
          is_active: boolean | null
          issued_at: string | null
          issued_by_id: string | null
          issued_by_name: string | null
          requires_signature: boolean | null
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string
          warning_document_url: string | null
          warning_number: number | null
          warning_type: Database["public"]["Enums"]["warning_severity"]
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          description: string
          employee_id?: string | null
          employee_name: string
          employee_response?: string | null
          employee_signature_url?: string | null
          employee_signed_at?: string | null
          id?: string
          incident_date?: string | null
          is_active?: boolean | null
          issued_at?: string | null
          issued_by_id?: string | null
          issued_by_name?: string | null
          requires_signature?: boolean | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id: string
          warning_document_url?: string | null
          warning_number?: number | null
          warning_type: Database["public"]["Enums"]["warning_severity"]
        }
        Update: {
          created_at?: string | null
          department?: string | null
          description?: string
          employee_id?: string | null
          employee_name?: string
          employee_response?: string | null
          employee_signature_url?: string | null
          employee_signed_at?: string | null
          id?: string
          incident_date?: string | null
          is_active?: boolean | null
          issued_at?: string | null
          issued_by_id?: string | null
          issued_by_name?: string | null
          requires_signature?: boolean | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string
          warning_document_url?: string | null
          warning_number?: number | null
          warning_type?: Database["public"]["Enums"]["warning_severity"]
        }
        Relationships: [
          {
            foreignKeyName: "hr_warnings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_warnings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      hunt_campaigns: {
        Row: {
          auto_follow_up: boolean | null
          contacted_count: number | null
          conversion_count: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          follow_up_days: number | null
          follow_up_template: string | null
          id: string
          message_template: string | null
          name: string
          response_count: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["hunt_campaign_status"] | null
          target_criteria: Json | null
          target_type: Database["public"]["Enums"]["hunt_target_type"]
          total_prospects: number | null
          updated_at: string | null
        }
        Insert: {
          auto_follow_up?: boolean | null
          contacted_count?: number | null
          conversion_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          follow_up_days?: number | null
          follow_up_template?: string | null
          id?: string
          message_template?: string | null
          name: string
          response_count?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["hunt_campaign_status"] | null
          target_criteria?: Json | null
          target_type: Database["public"]["Enums"]["hunt_target_type"]
          total_prospects?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_follow_up?: boolean | null
          contacted_count?: number | null
          conversion_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          follow_up_days?: number | null
          follow_up_template?: string | null
          id?: string
          message_template?: string | null
          name?: string
          response_count?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["hunt_campaign_status"] | null
          target_criteria?: Json | null
          target_type?: Database["public"]["Enums"]["hunt_target_type"]
          total_prospects?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hunt_outreach: {
        Row: {
          ai_generated: boolean | null
          ai_personalization: string | null
          campaign_id: string | null
          channel: string | null
          content: string
          created_at: string | null
          delivered_at: string | null
          id: string
          message_type: string | null
          opened_at: string | null
          prospect_id: string | null
          responded_at: string | null
          response_content: string | null
          sent_at: string | null
          sent_by: string | null
          subject: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          ai_personalization?: string | null
          campaign_id?: string | null
          channel?: string | null
          content: string
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          message_type?: string | null
          opened_at?: string | null
          prospect_id?: string | null
          responded_at?: string | null
          response_content?: string | null
          sent_at?: string | null
          sent_by?: string | null
          subject?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          ai_personalization?: string | null
          campaign_id?: string | null
          channel?: string | null
          content?: string
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          message_type?: string | null
          opened_at?: string | null
          prospect_id?: string | null
          responded_at?: string | null
          response_content?: string | null
          sent_at?: string | null
          sent_by?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hunt_outreach_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "hunt_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hunt_outreach_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "hunt_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      hunt_prospects: {
        Row: {
          ai_analysis: string | null
          ai_score: number | null
          campaign_id: string | null
          company: string | null
          converted_at: string | null
          created_at: string | null
          email: string | null
          experience_years: number | null
          follow_up_date: string | null
          full_name: string
          id: string
          investment_capacity: string | null
          job_title: string | null
          languages: string[] | null
          last_contacted_at: string | null
          last_response_at: string | null
          linkedin_url: string | null
          location: string | null
          notes: string | null
          phone: string | null
          qualification_notes: string | null
          source: string | null
          specializations: string[] | null
          status: Database["public"]["Enums"]["hunt_prospect_status"] | null
          target_type: Database["public"]["Enums"]["hunt_target_type"]
          updated_at: string | null
        }
        Insert: {
          ai_analysis?: string | null
          ai_score?: number | null
          campaign_id?: string | null
          company?: string | null
          converted_at?: string | null
          created_at?: string | null
          email?: string | null
          experience_years?: number | null
          follow_up_date?: string | null
          full_name: string
          id?: string
          investment_capacity?: string | null
          job_title?: string | null
          languages?: string[] | null
          last_contacted_at?: string | null
          last_response_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          qualification_notes?: string | null
          source?: string | null
          specializations?: string[] | null
          status?: Database["public"]["Enums"]["hunt_prospect_status"] | null
          target_type: Database["public"]["Enums"]["hunt_target_type"]
          updated_at?: string | null
        }
        Update: {
          ai_analysis?: string | null
          ai_score?: number | null
          campaign_id?: string | null
          company?: string | null
          converted_at?: string | null
          created_at?: string | null
          email?: string | null
          experience_years?: number | null
          follow_up_date?: string | null
          full_name?: string
          id?: string
          investment_capacity?: string | null
          job_title?: string | null
          languages?: string[] | null
          last_contacted_at?: string | null
          last_response_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          qualification_notes?: string | null
          source?: string | null
          specializations?: string[] | null
          status?: Database["public"]["Enums"]["hunt_prospect_status"] | null
          target_type?: Database["public"]["Enums"]["hunt_target_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hunt_prospects_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "hunt_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      hunt_templates: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          response_rate: number | null
          subject: string | null
          target_type: Database["public"]["Enums"]["hunt_target_type"]
          template_type: string | null
          updated_at: string | null
          use_count: number | null
          variables: string[] | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          response_rate?: number | null
          subject?: string | null
          target_type: Database["public"]["Enums"]["hunt_target_type"]
          template_type?: string | null
          updated_at?: string | null
          use_count?: number | null
          variables?: string[] | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          response_rate?: number | null
          subject?: string | null
          target_type?: Database["public"]["Enums"]["hunt_target_type"]
          template_type?: string | null
          updated_at?: string | null
          use_count?: number | null
          variables?: string[] | null
        }
        Relationships: []
      }
      inbound_email_dead_letters: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          raw_payload: Json | null
          sender_email: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          raw_payload?: Json | null
          sender_email?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          raw_payload?: Json | null
          sender_email?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          admin_notes: string | null
          created_at: string
          crm_lead_id: string | null
          email: string
          full_name: string
          id: string
          inquiry_type: string
          message: string | null
          phone: string | null
          property_name: string | null
          resolved_at: string | null
          source: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string | null
          whatsapp_clicked_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          crm_lead_id?: string | null
          email: string
          full_name: string
          id?: string
          inquiry_type?: string
          message?: string | null
          phone?: string | null
          property_name?: string | null
          resolved_at?: string | null
          source?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
          whatsapp_clicked_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          crm_lead_id?: string | null
          email?: string
          full_name?: string
          id?: string
          inquiry_type?: string
          message?: string | null
          phone?: string | null
          property_name?: string | null
          resolved_at?: string | null
          source?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
          whatsapp_clicked_at?: string | null
        }
        Relationships: []
      }
      instagram_scheduled_posts: {
        Row: {
          access_token: string | null
          account_id: string | null
          caption: string | null
          created_at: string
          error_message: string | null
          id: string
          ig_post_id: string | null
          ig_post_url: string | null
          image_url: string
          scheduled_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          caption?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ig_post_id?: string | null
          ig_post_url?: string | null
          image_url: string
          scheduled_at: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          caption?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ig_post_id?: string | null
          ig_post_url?: string | null
          image_url?: string
          scheduled_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      internal_chat_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          employee_id: string
          employee_name: string
          id: string
          message: string
          role: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          employee_id: string
          employee_name: string
          id?: string
          message: string
          role: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          employee_id?: string
          employee_name?: string
          id?: string
          message?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_opportunities: {
        Row: {
          ai_score: number | null
          avg_price: number | null
          created_at: string | null
          description: string | null
          detected_by: string | null
          developer: string | null
          developer_reputation_score: number | null
          expected_yield: number | null
          expiry_date: string | null
          id: string
          investor_interest_score: number | null
          location: string
          location_growth_index: number | null
          market_timing_score: number | null
          metadata: Json | null
          opportunity_type: string
          property_type: string | null
          recommended_action: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          status: Database["public"]["Enums"]["opportunity_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_score?: number | null
          avg_price?: number | null
          created_at?: string | null
          description?: string | null
          detected_by?: string | null
          developer?: string | null
          developer_reputation_score?: number | null
          expected_yield?: number | null
          expiry_date?: string | null
          id?: string
          investor_interest_score?: number | null
          location: string
          location_growth_index?: number | null
          market_timing_score?: number | null
          metadata?: Json | null
          opportunity_type: string
          property_type?: string | null
          recommended_action?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          status?: Database["public"]["Enums"]["opportunity_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_score?: number | null
          avg_price?: number | null
          created_at?: string | null
          description?: string | null
          detected_by?: string | null
          developer?: string | null
          developer_reputation_score?: number | null
          expected_yield?: number | null
          expiry_date?: string | null
          id?: string
          investor_interest_score?: number | null
          location?: string
          location_growth_index?: number | null
          market_timing_score?: number | null
          metadata?: Json | null
          opportunity_type?: string
          property_type?: string | null
          recommended_action?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          status?: Database["public"]["Enums"]["opportunity_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      investor_analytics: {
        Row: {
          analysis_period_end: string
          analysis_period_start: string
          avg_budget_max: number | null
          avg_budget_min: number | null
          avg_conversion_days: number | null
          conversion_rate: number | null
          created_at: string | null
          id: string
          inquiry_volume: number | null
          insights: string[] | null
          investor_segment: string | null
          metadata: Json | null
          nationality: string | null
          preferred_locations: string[] | null
          preferred_payment_type: string | null
          preferred_property_types: string[] | null
          trend: Database["public"]["Enums"]["market_trend"] | null
        }
        Insert: {
          analysis_period_end: string
          analysis_period_start: string
          avg_budget_max?: number | null
          avg_budget_min?: number | null
          avg_conversion_days?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          inquiry_volume?: number | null
          insights?: string[] | null
          investor_segment?: string | null
          metadata?: Json | null
          nationality?: string | null
          preferred_locations?: string[] | null
          preferred_payment_type?: string | null
          preferred_property_types?: string[] | null
          trend?: Database["public"]["Enums"]["market_trend"] | null
        }
        Update: {
          analysis_period_end?: string
          analysis_period_start?: string
          avg_budget_max?: number | null
          avg_budget_min?: number | null
          avg_conversion_days?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          inquiry_volume?: number | null
          insights?: string[] | null
          investor_segment?: string | null
          metadata?: Json | null
          nationality?: string | null
          preferred_locations?: string[] | null
          preferred_payment_type?: string | null
          preferred_property_types?: string[] | null
          trend?: Database["public"]["Enums"]["market_trend"] | null
        }
        Relationships: []
      }
      investor_behavior_insights: {
        Row: {
          avg_budget_max_aed: number | null
          avg_budget_min_aed: number | null
          conversion_rate_percent: number | null
          created_at: string
          data_period_end: string | null
          data_period_start: string | null
          id: string
          inquiry_trend: string | null
          insight_summary: string | null
          investor_segment: string
          payment_preference: string | null
          preferred_locations: string[] | null
          preferred_property_types: string[] | null
          sample_size: number | null
          source_country: string | null
        }
        Insert: {
          avg_budget_max_aed?: number | null
          avg_budget_min_aed?: number | null
          conversion_rate_percent?: number | null
          created_at?: string
          data_period_end?: string | null
          data_period_start?: string | null
          id?: string
          inquiry_trend?: string | null
          insight_summary?: string | null
          investor_segment: string
          payment_preference?: string | null
          preferred_locations?: string[] | null
          preferred_property_types?: string[] | null
          sample_size?: number | null
          source_country?: string | null
        }
        Update: {
          avg_budget_max_aed?: number | null
          avg_budget_min_aed?: number | null
          conversion_rate_percent?: number | null
          created_at?: string
          data_period_end?: string | null
          data_period_start?: string | null
          id?: string
          inquiry_trend?: string | null
          insight_summary?: string | null
          investor_segment?: string
          payment_preference?: string | null
          preferred_locations?: string[] | null
          preferred_property_types?: string[] | null
          sample_size?: number | null
          source_country?: string | null
        }
        Relationships: []
      }
      investor_documents: {
        Row: {
          created_at: string
          document_name: string
          document_type: string
          expiry_date: string | null
          file_size: number | null
          file_url: string
          id: string
          is_verified: boolean | null
          mime_type: string | null
          updated_at: string
          user_id: string
          verification_notes: string | null
        }
        Insert: {
          created_at?: string
          document_name: string
          document_type: string
          expiry_date?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          is_verified?: boolean | null
          mime_type?: string | null
          updated_at?: string
          user_id: string
          verification_notes?: string | null
        }
        Update: {
          created_at?: string
          document_name?: string
          document_type?: string
          expiry_date?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          is_verified?: boolean | null
          mime_type?: string | null
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
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
      it_department_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          notes: Json | null
          priority: string
          related_application_id: string | null
          requested_by: string | null
          status: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: Json | null
          priority?: string
          related_application_id?: string | null
          requested_by?: string | null
          status?: string
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: Json | null
          priority?: string
          related_application_id?: string | null
          requested_by?: string | null
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "it_department_tasks_related_application_id_fkey"
            columns: ["related_application_id"]
            isOneToOne: false
            referencedRelation: "new_joiner_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      it_provisioning_records: {
        Row: {
          application_id: string | null
          created_at: string
          crm_access_granted: boolean | null
          email_signature_html: string | null
          email_signature_plain: string | null
          employee_email: string
          id: string
          permissions_granted: Json | null
          provisioned_at: string | null
          provisioned_by: string | null
          software_licenses: Json | null
          status: string
          temporary_password: string | null
          tools_access: Json | null
          updated_at: string
          user_id: string | null
          welcome_email_sent: boolean | null
          welcome_email_sent_at: string | null
          workstation_assigned: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          crm_access_granted?: boolean | null
          email_signature_html?: string | null
          email_signature_plain?: string | null
          employee_email: string
          id?: string
          permissions_granted?: Json | null
          provisioned_at?: string | null
          provisioned_by?: string | null
          software_licenses?: Json | null
          status?: string
          temporary_password?: string | null
          tools_access?: Json | null
          updated_at?: string
          user_id?: string | null
          welcome_email_sent?: boolean | null
          welcome_email_sent_at?: string | null
          workstation_assigned?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string
          crm_access_granted?: boolean | null
          email_signature_html?: string | null
          email_signature_plain?: string | null
          employee_email?: string
          id?: string
          permissions_granted?: Json | null
          provisioned_at?: string | null
          provisioned_by?: string | null
          software_licenses?: Json | null
          status?: string
          temporary_password?: string | null
          tools_access?: Json | null
          updated_at?: string
          user_id?: string | null
          welcome_email_sent?: boolean | null
          welcome_email_sent_at?: string | null
          workstation_assigned?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "it_provisioning_records_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "new_joiner_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      jbj_activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
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
      jbj_brokers: {
        Row: {
          active_leads: number | null
          auto_receive_leads: boolean | null
          availability_status: string | null
          availability_updated_at: string | null
          avatar_url: string | null
          capacity: number | null
          created_at: string | null
          email: string
          id: string
          last_lead_assigned_at: string | null
          name: string
          phone: string | null
          specialization: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active_leads?: number | null
          auto_receive_leads?: boolean | null
          availability_status?: string | null
          availability_updated_at?: string | null
          avatar_url?: string | null
          capacity?: number | null
          created_at?: string | null
          email: string
          id?: string
          last_lead_assigned_at?: string | null
          name: string
          phone?: string | null
          specialization?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active_leads?: number | null
          auto_receive_leads?: boolean | null
          availability_status?: string | null
          availability_updated_at?: string | null
          avatar_url?: string | null
          capacity?: number | null
          created_at?: string | null
          email?: string
          id?: string
          last_lead_assigned_at?: string | null
          name?: string
          phone?: string | null
          specialization?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      jbj_compliance_words: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          severity: string | null
          word_pattern: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          severity?: string | null
          word_pattern: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          severity?: string | null
          word_pattern?: string
        }
        Relationships: []
      }
      jbj_daily_reports: {
        Row: {
          avg_response_time_seconds: number | null
          broker_id: string | null
          calls_made: number | null
          conversions: number | null
          created_at: string | null
          emails_sent: number | null
          id: string
          leads_contacted: number | null
          messages_sent: number | null
          report_date: string
        }
        Insert: {
          avg_response_time_seconds?: number | null
          broker_id?: string | null
          calls_made?: number | null
          conversions?: number | null
          created_at?: string | null
          emails_sent?: number | null
          id?: string
          leads_contacted?: number | null
          messages_sent?: number | null
          report_date?: string
        }
        Update: {
          avg_response_time_seconds?: number | null
          broker_id?: string | null
          calls_made?: number | null
          conversions?: number | null
          created_at?: string | null
          emails_sent?: number | null
          id?: string
          leads_contacted?: number | null
          messages_sent?: number | null
          report_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "jbj_daily_reports_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "jbj_brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      jbj_filters: {
        Row: {
          created_at: string | null
          created_by: string | null
          filter_type: string | null
          id: string
          is_active: boolean | null
          keyword: string
          replacement_text: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          filter_type?: string | null
          id?: string
          is_active?: boolean | null
          keyword: string
          replacement_text?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          filter_type?: string | null
          id?: string
          is_active?: boolean | null
          keyword?: string
          replacement_text?: string | null
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
      jbj_lead_access_log: {
        Row: {
          access_type: string
          broker_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          lead_id: string | null
          user_agent: string | null
        }
        Insert: {
          access_type: string
          broker_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          lead_id?: string | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          broker_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          lead_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jbj_lead_access_log_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "jbj_brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jbj_lead_access_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "jbj_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jbj_lead_access_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "jbj_leads_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      jbj_lead_assignment_queue: {
        Row: {
          assigned_at: string | null
          assigned_to_broker_id: string | null
          assignment_order: number
          created_at: string | null
          expires_at: string | null
          id: string
          lead_id: string
          status: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to_broker_id?: string | null
          assignment_order: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          lead_id: string
          status?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to_broker_id?: string | null
          assignment_order?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          lead_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jbj_lead_assignment_queue_assigned_to_broker_id_fkey"
            columns: ["assigned_to_broker_id"]
            isOneToOne: false
            referencedRelation: "jbj_brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jbj_lead_assignment_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "jbj_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jbj_lead_assignment_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "jbj_leads_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      jbj_leads: {
        Row: {
          assigned_broker_id: string | null
          budget_range: string | null
          created_at: string | null
          email: string | null
          id: string
          last_contact: string | null
          name: string
          notes: string | null
          phone: string | null
          property_interest: string | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_broker_id?: string | null
          budget_range?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contact?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          property_interest?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_broker_id?: string | null
          budget_range?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contact?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          property_interest?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jbj_leads_assigned_broker_id_fkey"
            columns: ["assigned_broker_id"]
            isOneToOne: false
            referencedRelation: "jbj_brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      jbj_message_audit: {
        Row: {
          audit_status: string | null
          auto_flagged: boolean | null
          broker_id: string | null
          channel: string
          content: string
          created_at: string | null
          direction: string
          flagged_words: string[] | null
          id: string
          lead_id: string | null
          message_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          violation_details: string | null
          violation_type: string | null
        }
        Insert: {
          audit_status?: string | null
          auto_flagged?: boolean | null
          broker_id?: string | null
          channel: string
          content: string
          created_at?: string | null
          direction: string
          flagged_words?: string[] | null
          id?: string
          lead_id?: string | null
          message_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          violation_details?: string | null
          violation_type?: string | null
        }
        Update: {
          audit_status?: string | null
          auto_flagged?: boolean | null
          broker_id?: string | null
          channel?: string
          content?: string
          created_at?: string | null
          direction?: string
          flagged_words?: string[] | null
          id?: string
          lead_id?: string | null
          message_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          violation_details?: string | null
          violation_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jbj_message_audit_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "jbj_brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jbj_message_audit_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "jbj_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jbj_message_audit_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "jbj_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jbj_message_audit_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "jbj_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      jbj_messages: {
        Row: {
          broker_id: string | null
          call_duration_seconds: number | null
          channel: string
          content: string | null
          created_at: string | null
          direction: string | null
          filter_reason: string | null
          id: string
          lead_id: string
          status: string | null
          was_filtered: boolean | null
        }
        Insert: {
          broker_id?: string | null
          call_duration_seconds?: number | null
          channel: string
          content?: string | null
          created_at?: string | null
          direction?: string | null
          filter_reason?: string | null
          id?: string
          lead_id: string
          status?: string | null
          was_filtered?: boolean | null
        }
        Update: {
          broker_id?: string | null
          call_duration_seconds?: number | null
          channel?: string
          content?: string | null
          created_at?: string | null
          direction?: string | null
          filter_reason?: string | null
          id?: string
          lead_id?: string
          status?: string | null
          was_filtered?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "jbj_messages_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "jbj_brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jbj_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "jbj_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jbj_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "jbj_leads_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          is_rtl: boolean | null
          name: string
          native_name: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_rtl?: boolean | null
          name: string
          native_name?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_rtl?: boolean | null
          name?: string
          native_name?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      launch_interest_registrations: {
        Row: {
          created_at: string
          developer_name: string | null
          event_id: string | null
          event_title: string | null
          id: string
          interest_type: string
          notes: string | null
          user_email: string
          user_id: string
          user_name: string | null
          user_phone: string | null
        }
        Insert: {
          created_at?: string
          developer_name?: string | null
          event_id?: string | null
          event_title?: string | null
          id?: string
          interest_type?: string
          notes?: string | null
          user_email: string
          user_id: string
          user_name?: string | null
          user_phone?: string | null
        }
        Update: {
          created_at?: string
          developer_name?: string | null
          event_id?: string | null
          event_title?: string | null
          id?: string
          interest_type?: string
          notes?: string | null
          user_email?: string
          user_id?: string
          user_name?: string | null
          user_phone?: string | null
        }
        Relationships: []
      }
      launch_notifications: {
        Row: {
          commission_details: string | null
          created_by: string | null
          description: string | null
          developer_name: string
          id: string
          message_id: string | null
          notified_at: string | null
          project_name: string
        }
        Insert: {
          commission_details?: string | null
          created_by?: string | null
          description?: string | null
          developer_name: string
          id?: string
          message_id?: string | null
          notified_at?: string | null
          project_name: string
        }
        Update: {
          commission_details?: string | null
          created_by?: string | null
          description?: string | null
          developer_name?: string
          id?: string
          message_id?: string | null
          notified_at?: string | null
          project_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "launch_notifications_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "developer_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          age_range: string | null
          birthday: string | null
          captcha_verified: boolean | null
          consent_accurate: boolean | null
          consent_privacy: boolean | null
          created_at: string
          current_location: string | null
          email: string
          email_encrypted: string | null
          email_verified: boolean | null
          full_name: string | null
          full_name_encrypted: string | null
          honeypot: string | null
          id: string
          ip_hash: string | null
          language: string | null
          nationality: string | null
          page_source: string | null
          phone: string | null
          phone_encrypted: string | null
          phone_verified: boolean | null
          source: string
          status: string | null
          submission_source: string | null
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          birthday?: string | null
          captcha_verified?: boolean | null
          consent_accurate?: boolean | null
          consent_privacy?: boolean | null
          created_at?: string
          current_location?: string | null
          email: string
          email_encrypted?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          full_name_encrypted?: string | null
          honeypot?: string | null
          id?: string
          ip_hash?: string | null
          language?: string | null
          nationality?: string | null
          page_source?: string | null
          phone?: string | null
          phone_encrypted?: string | null
          phone_verified?: boolean | null
          source: string
          status?: string | null
          submission_source?: string | null
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          birthday?: string | null
          captcha_verified?: boolean | null
          consent_accurate?: boolean | null
          consent_privacy?: boolean | null
          created_at?: string
          current_location?: string | null
          email?: string
          email_encrypted?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          full_name_encrypted?: string | null
          honeypot?: string | null
          id?: string
          ip_hash?: string | null
          language?: string | null
          nationality?: string | null
          page_source?: string | null
          phone?: string | null
          phone_encrypted?: string | null
          phone_verified?: boolean | null
          source?: string
          status?: string | null
          submission_source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      listing_admin_authorized_sources: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_scraped_at: string | null
          scrape_frequency: string | null
          source_name: string
          source_type: string
          source_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          scrape_frequency?: string | null
          source_name: string
          source_type?: string
          source_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          scrape_frequency?: string | null
          source_name?: string
          source_type?: string
          source_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      listing_admin_chat_sessions: {
        Row: {
          created_at: string
          id: string
          messages: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      listing_admin_scraped_data: {
        Row: {
          created_at: string
          error_message: string | null
          extracted_projects: Json | null
          id: string
          processed_at: string | null
          scraped_content: Json | null
          source_id: string | null
          source_url: string
          status: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          extracted_projects?: Json | null
          id?: string
          processed_at?: string | null
          scraped_content?: Json | null
          source_id?: string | null
          source_url: string
          status?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          extracted_projects?: Json | null
          id?: string
          processed_at?: string | null
          scraped_content?: Json | null
          source_id?: string | null
          source_url?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_admin_scraped_data_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "listing_admin_authorized_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_admins: {
        Row: {
          assigned_at: string | null
          assigned_by_user_id: string | null
          created_at: string | null
          display_name: string
          email: string
          id: string
          is_active: boolean | null
          last_active_at: string | null
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by_user_id?: string | null
          created_at?: string | null
          display_name: string
          email: string
          id?: string
          is_active?: boolean | null
          last_active_at?: string | null
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by_user_id?: string | null
          created_at?: string | null
          display_name?: string
          email?: string
          id?: string
          is_active?: boolean | null
          last_active_at?: string | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      listing_approvals: {
        Row: {
          approved_at: string | null
          approver_department: string | null
          approver_email: string | null
          approver_name: string | null
          approver_photo: string | null
          approver_role: string
          approver_title: string | null
          created_at: string | null
          id: string
          listing_id: string
          listing_type: string
          notes: string | null
          status: string
          step_name: string
          step_number: number
        }
        Insert: {
          approved_at?: string | null
          approver_department?: string | null
          approver_email?: string | null
          approver_name?: string | null
          approver_photo?: string | null
          approver_role: string
          approver_title?: string | null
          created_at?: string | null
          id?: string
          listing_id: string
          listing_type: string
          notes?: string | null
          status?: string
          step_name: string
          step_number: number
        }
        Update: {
          approved_at?: string | null
          approver_department?: string | null
          approver_email?: string | null
          approver_name?: string | null
          approver_photo?: string | null
          approver_role?: string
          approver_title?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string
          listing_type?: string
          notes?: string | null
          status?: string
          step_name?: string
          step_number?: number
        }
        Relationships: []
      }
      listing_enrichment_suggestions: {
        Row: {
          after_data: Json | null
          before_data: Json | null
          created_at: string
          id: string
          listing_id: string | null
          project_id: string | null
          project_name: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          suggestion_type: string
        }
        Insert: {
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: string
          listing_id?: string | null
          project_id?: string | null
          project_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggestion_type?: string
        }
        Update: {
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: string
          listing_id?: string | null
          project_id?: string | null
          project_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggestion_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_enrichment_suggestions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "portal_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_enrichment_suggestions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_extraction_queue: {
        Row: {
          auto_approve: boolean | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          files: Json | null
          id: string
          results: Json | null
          status: string | null
          urls: string[] | null
          user_id: string
        }
        Insert: {
          auto_approve?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          files?: Json | null
          id?: string
          results?: Json | null
          status?: string | null
          urls?: string[] | null
          user_id: string
        }
        Update: {
          auto_approve?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          files?: Json | null
          id?: string
          results?: Json | null
          status?: string | null
          urls?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      listing_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          listing_id: string
          listing_type: string
          message: string
          notification_type: string
          step_completed: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          listing_id: string
          listing_type: string
          message: string
          notification_type: string
          step_completed?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          listing_id?: string
          listing_type?: string
          message?: string
          notification_type?: string
          step_completed?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      listing_pending_updates: {
        Row: {
          change_type: string
          confidence_score: number | null
          created_at: string | null
          current_value: string | null
          field_name: string
          id: string
          job_id: string | null
          listing_id: string | null
          listing_table: string
          match_method: string | null
          proposed_value: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_id: string | null
          status: string
        }
        Insert: {
          change_type?: string
          confidence_score?: number | null
          created_at?: string | null
          current_value?: string | null
          field_name: string
          id?: string
          job_id?: string | null
          listing_id?: string | null
          listing_table?: string
          match_method?: string | null
          proposed_value: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id?: string | null
          status?: string
        }
        Update: {
          change_type?: string
          confidence_score?: number | null
          created_at?: string | null
          current_value?: string | null
          field_name?: string
          id?: string
          job_id?: string | null
          listing_id?: string | null
          listing_table?: string
          match_method?: string | null
          proposed_value?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_pending_updates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "extraction_job_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_pending_updates_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "external_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_tiers: {
        Row: {
          description: string | null
          duration_days: number
          id: string
          is_featured: boolean | null
          label: string
          name: string
          price_aed: number
        }
        Insert: {
          description?: string | null
          duration_days: number
          id?: string
          is_featured?: boolean | null
          label: string
          name: string
          price_aed?: number
        }
        Update: {
          description?: string | null
          duration_days?: number
          id?: string
          is_featured?: boolean | null
          label?: string
          name?: string
          price_aed?: number
        }
        Relationships: []
      }
      listing_uploads: {
        Row: {
          completed_at: string | null
          created_at: string
          drive_url: string
          error_message: string | null
          extracted_data: Json | null
          extracted_projects: Json | null
          id: string
          processed_at: string | null
          status: string
          updated_at: string
          url_type: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          drive_url: string
          error_message?: string | null
          extracted_data?: Json | null
          extracted_projects?: Json | null
          id?: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          url_type?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          drive_url?: string
          error_message?: string | null
          extracted_data?: Json | null
          extracted_projects?: Json | null
          id?: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          url_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      market_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          category: string | null
          created_at: string
          expires_at: string | null
          id: string
          impact_assessment: string | null
          is_acknowledged: boolean | null
          is_read: boolean | null
          location: string | null
          message: string
          metadata: Json | null
          priority: string | null
          recommended_action: string | null
          source_url: string | null
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          category?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          impact_assessment?: string | null
          is_acknowledged?: boolean | null
          is_read?: boolean | null
          location?: string | null
          message: string
          metadata?: Json | null
          priority?: string | null
          recommended_action?: string | null
          source_url?: string | null
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          category?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          impact_assessment?: string | null
          is_acknowledged?: boolean | null
          is_read?: boolean | null
          location?: string | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          recommended_action?: string | null
          source_url?: string | null
          title?: string
        }
        Relationships: []
      }
      market_briefings: {
        Row: {
          briefing_date: string
          briefing_type: string
          created_at: string | null
          generated_by: string | null
          global_factors: Json | null
          id: string
          is_sent: boolean | null
          key_metrics: Json
          opportunities: Json | null
          recipient_id: string | null
          recommendations: Json | null
          risks: Json | null
          sent_at: string | null
          sentiment_overview: Json | null
          summary: string
          trends: Json | null
        }
        Insert: {
          briefing_date: string
          briefing_type: string
          created_at?: string | null
          generated_by?: string | null
          global_factors?: Json | null
          id?: string
          is_sent?: boolean | null
          key_metrics: Json
          opportunities?: Json | null
          recipient_id?: string | null
          recommendations?: Json | null
          risks?: Json | null
          sent_at?: string | null
          sentiment_overview?: Json | null
          summary: string
          trends?: Json | null
        }
        Update: {
          briefing_date?: string
          briefing_type?: string
          created_at?: string | null
          generated_by?: string | null
          global_factors?: Json | null
          id?: string
          is_sent?: boolean | null
          key_metrics?: Json
          opportunities?: Json | null
          recipient_id?: string | null
          recommendations?: Json | null
          risks?: Json | null
          sent_at?: string | null
          sentiment_overview?: Json | null
          summary?: string
          trends?: Json | null
        }
        Relationships: []
      }
      market_data_points: {
        Row: {
          created_at: string | null
          data_type: string
          id: string
          location: string | null
          metadata: Json | null
          period_end: string | null
          period_start: string | null
          source_id: string | null
          unit: string | null
          value: number | null
        }
        Insert: {
          created_at?: string | null
          data_type: string
          id?: string
          location?: string | null
          metadata?: Json | null
          period_end?: string | null
          period_start?: string | null
          source_id?: string | null
          unit?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string | null
          data_type?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          period_end?: string | null
          period_start?: string | null
          source_id?: string | null
          unit?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_data_points_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "market_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      market_data_sources: {
        Row: {
          api_endpoint: string | null
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          name: string
          source_type: Database["public"]["Enums"]["data_source_type"]
          update_frequency: string | null
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name: string
          source_type: Database["public"]["Enums"]["data_source_type"]
          update_frequency?: string | null
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name?: string
          source_type?: Database["public"]["Enums"]["data_source_type"]
          update_frequency?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      market_news: {
        Row: {
          ai_analysis: string | null
          ai_generated: boolean | null
          category: string
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_verified: boolean | null
          key_stats: Json | null
          key_takeaways: Json | null
          published_date: string
          source: string
          source_url: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_analysis?: string | null
          ai_generated?: boolean | null
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          key_stats?: Json | null
          key_takeaways?: Json | null
          published_date?: string
          source: string
          source_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_analysis?: string | null
          ai_generated?: boolean | null
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          key_stats?: Json | null
          key_takeaways?: Json | null
          published_date?: string
          source?: string
          source_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_opportunities: {
        Row: {
          ai_score: number | null
          created_at: string
          description: string | null
          developer_id: string | null
          estimated_value_aed: number | null
          expected_roi_percent: number | null
          expires_at: string | null
          id: string
          location: string | null
          opportunity_type: string
          project_name: string | null
          risk_level: string | null
          source_data: Json | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_score?: number | null
          created_at?: string
          description?: string | null
          developer_id?: string | null
          estimated_value_aed?: number | null
          expected_roi_percent?: number | null
          expires_at?: string | null
          id?: string
          location?: string | null
          opportunity_type: string
          project_name?: string | null
          risk_level?: string | null
          source_data?: Json | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_score?: number | null
          created_at?: string
          description?: string | null
          developer_id?: string | null
          estimated_value_aed?: number | null
          expected_roi_percent?: number | null
          expires_at?: string | null
          id?: string
          location?: string | null
          opportunity_type?: string
          project_name?: string | null
          risk_level?: string | null
          source_data?: Json | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_predictions: {
        Row: {
          accuracy_score: number | null
          actual_value: number | null
          confidence: Database["public"]["Enums"]["prediction_confidence"]
          confidence_score: number | null
          created_at: string | null
          id: string
          location: string | null
          model_used: string | null
          predicted_change_percent: number | null
          predicted_value: number | null
          prediction_type: string
          property_type: string | null
          recommended_action: string | null
          supporting_data: Json | null
          time_horizon_days: number
          trend: Database["public"]["Enums"]["market_trend"]
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          accuracy_score?: number | null
          actual_value?: number | null
          confidence: Database["public"]["Enums"]["prediction_confidence"]
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          location?: string | null
          model_used?: string | null
          predicted_change_percent?: number | null
          predicted_value?: number | null
          prediction_type: string
          property_type?: string | null
          recommended_action?: string | null
          supporting_data?: Json | null
          time_horizon_days: number
          trend: Database["public"]["Enums"]["market_trend"]
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          accuracy_score?: number | null
          actual_value?: number | null
          confidence?: Database["public"]["Enums"]["prediction_confidence"]
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          location?: string | null
          model_used?: string | null
          predicted_change_percent?: number | null
          predicted_value?: number | null
          prediction_type?: string
          property_type?: string | null
          recommended_action?: string | null
          supporting_data?: Json | null
          time_horizon_days?: number
          trend?: Database["public"]["Enums"]["market_trend"]
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      market_risk_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          affected_locations: string[] | null
          affected_property_types: string[] | null
          alert_type: string
          created_at: string | null
          data_sources: string[] | null
          description: string
          expires_at: string | null
          id: string
          impact_assessment: string | null
          is_acknowledged: boolean | null
          is_resolved: boolean | null
          metadata: Json | null
          recommended_actions: string[] | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["risk_level"]
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          affected_locations?: string[] | null
          affected_property_types?: string[] | null
          alert_type: string
          created_at?: string | null
          data_sources?: string[] | null
          description: string
          expires_at?: string | null
          id?: string
          impact_assessment?: string | null
          is_acknowledged?: boolean | null
          is_resolved?: boolean | null
          metadata?: Json | null
          recommended_actions?: string[] | null
          resolved_at?: string | null
          severity: Database["public"]["Enums"]["risk_level"]
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          affected_locations?: string[] | null
          affected_property_types?: string[] | null
          alert_type?: string
          created_at?: string | null
          data_sources?: string[] | null
          description?: string
          expires_at?: string | null
          id?: string
          impact_assessment?: string | null
          is_acknowledged?: boolean | null
          is_resolved?: boolean | null
          metadata?: Json | null
          recommended_actions?: string[] | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["risk_level"]
          title?: string
        }
        Relationships: []
      }
      market_sentiment: {
        Row: {
          analysis_date: string
          created_at: string | null
          id: string
          key_drivers: string[] | null
          key_topics: string[] | null
          metadata: Json | null
          sample_text: string | null
          sentiment_label: string | null
          sentiment_score: number | null
          source: string
          source_type: Database["public"]["Enums"]["data_source_type"]
        }
        Insert: {
          analysis_date: string
          created_at?: string | null
          id?: string
          key_drivers?: string[] | null
          key_topics?: string[] | null
          metadata?: Json | null
          sample_text?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          source: string
          source_type: Database["public"]["Enums"]["data_source_type"]
        }
        Update: {
          analysis_date?: string
          created_at?: string | null
          id?: string
          key_drivers?: string[] | null
          key_topics?: string[] | null
          metadata?: Json | null
          sample_text?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          source?: string
          source_type?: Database["public"]["Enums"]["data_source_type"]
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          campaign_type: string
          content: Json | null
          created_at: string | null
          created_by: string | null
          custom_recipients: string[] | null
          description: string | null
          facebook_content: Json | null
          id: string
          instagram_content: Json | null
          linkedin_content: Json | null
          name: string
          preview_text: string | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          subject_line: string | null
          target_audience: string | null
          total_bounced: number | null
          total_clicked: number | null
          total_delivered: number | null
          total_opened: number | null
          total_sent: number | null
          total_unsubscribed: number | null
          updated_at: string | null
        }
        Insert: {
          campaign_type?: string
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_recipients?: string[] | null
          description?: string | null
          facebook_content?: Json | null
          id?: string
          instagram_content?: Json | null
          linkedin_content?: Json | null
          name: string
          preview_text?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject_line?: string | null
          target_audience?: string | null
          total_bounced?: number | null
          total_clicked?: number | null
          total_delivered?: number | null
          total_opened?: number | null
          total_sent?: number | null
          total_unsubscribed?: number | null
          updated_at?: string | null
        }
        Update: {
          campaign_type?: string
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_recipients?: string[] | null
          description?: string | null
          facebook_content?: Json | null
          id?: string
          instagram_content?: Json | null
          linkedin_content?: Json | null
          name?: string
          preview_text?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject_line?: string | null
          target_audience?: string | null
          total_bounced?: number | null
          total_clicked?: number | null
          total_delivered?: number | null
          total_opened?: number | null
          total_sent?: number | null
          total_unsubscribed?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_templates: {
        Row: {
          category: string | null
          content: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_default: boolean | null
          name: string
          preview_image_url: string | null
          subject_line: string | null
          template_type: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          preview_image_url?: string | null
          subject_line?: string | null
          template_type?: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          preview_image_url?: string | null
          subject_line?: string | null
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      meeting_ai_notes: {
        Row: {
          action_items: Json | null
          client_details: Json | null
          created_at: string
          follow_up_plan: Json | null
          generated_pdf_url: string | null
          id: string
          key_decisions: Json | null
          meeting_id: string | null
          property_suggestions: Json | null
          summary: string | null
          transcript: string | null
          user_id: string | null
        }
        Insert: {
          action_items?: Json | null
          client_details?: Json | null
          created_at?: string
          follow_up_plan?: Json | null
          generated_pdf_url?: string | null
          id?: string
          key_decisions?: Json | null
          meeting_id?: string | null
          property_suggestions?: Json | null
          summary?: string | null
          transcript?: string | null
          user_id?: string | null
        }
        Update: {
          action_items?: Json | null
          client_details?: Json | null
          created_at?: string
          follow_up_plan?: Json | null
          generated_pdf_url?: string | null
          id?: string
          key_decisions?: Json | null
          meeting_id?: string | null
          property_suggestions?: Json | null
          summary?: string | null
          transcript?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_ai_notes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "video_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_session_consents: {
        Row: {
          broker_user_id: string
          client_email: string | null
          client_name: string
          client_phone: string | null
          consent_text: string
          created_at: string
          id: string
          id_photo_url: string | null
          session_id: string | null
          session_type: string
          signature_data: string
          signed_at: string
          status: string
        }
        Insert: {
          broker_user_id: string
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          consent_text: string
          created_at?: string
          id?: string
          id_photo_url?: string | null
          session_id?: string | null
          session_type?: string
          signature_data: string
          signed_at?: string
          status?: string
        }
        Update: {
          broker_user_id?: string
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          consent_text?: string
          created_at?: string
          id?: string
          id_photo_url?: string | null
          session_id?: string | null
          session_type?: string
          signature_data?: string
          signed_at?: string
          status?: string
        }
        Relationships: []
      }
      membership_cards: {
        Row: {
          card_number: string
          card_status: string | null
          card_type: string | null
          created_at: string
          id: string
          issued_at: string
          issued_by: string | null
          qr_payload: string
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          card_number: string
          card_status?: string | null
          card_type?: string | null
          created_at?: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          qr_payload: string
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          card_number?: string
          card_status?: string | null
          card_type?: string | null
          created_at?: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          qr_payload?: string
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
          user_id?: string
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
      module_questions: {
        Row: {
          correct_index: number
          created_at: string | null
          explanation: string | null
          id: string
          is_active: boolean | null
          module_id: string
          options: Json
          question_text: string
        }
        Insert: {
          correct_index: number
          created_at?: string | null
          explanation?: string | null
          id?: string
          is_active?: boolean | null
          module_id: string
          options: Json
          question_text: string
        }
        Update: {
          correct_index?: number
          created_at?: string | null
          explanation?: string | null
          id?: string
          is_active?: boolean | null
          module_id?: string
          options?: Json
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "broker_education_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_draws: {
        Row: {
          created_at: string | null
          draw_month: number
          draw_year: number
          drawn_at: string | null
          id: string
          min_activity_points: number | null
          prize_description: string
          status: string | null
          winner_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          draw_month: number
          draw_year: number
          drawn_at?: string | null
          id?: string
          min_activity_points?: number | null
          prize_description: string
          status?: string | null
          winner_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          draw_month?: number
          draw_year?: number
          drawn_at?: string | null
          id?: string
          min_activity_points?: number | null
          prize_description?: string
          status?: string | null
          winner_user_id?: string | null
        }
        Relationships: []
      }
      new_joiner_applications: {
        Row: {
          approved_at: string | null
          assigned_to_it: string | null
          assigned_to_webdev: string | null
          completed_at: string | null
          contract_type: string | null
          created_at: string
          crm_role: string
          crm_user_id: string | null
          department: string
          documents: Json | null
          email: string
          full_name: string
          generated_company_id: string | null
          generated_email: string | null
          hr_approved_at: string | null
          hr_approved_by: string | null
          hr_notes: string | null
          id: string
          it_completed_at: string | null
          it_notes: string | null
          it_started_at: string | null
          job_title: string
          languages: string[] | null
          nationality: string
          onboarding_checklist: Json | null
          phone: string | null
          photo_url: string | null
          probation_end_date: string | null
          rejection_reason: string | null
          reports_to: string | null
          requested_by: string | null
          start_date: string | null
          status: string
          updated_at: string
          webdev_notes: string | null
        }
        Insert: {
          approved_at?: string | null
          assigned_to_it?: string | null
          assigned_to_webdev?: string | null
          completed_at?: string | null
          contract_type?: string | null
          created_at?: string
          crm_role?: string
          crm_user_id?: string | null
          department: string
          documents?: Json | null
          email: string
          full_name: string
          generated_company_id?: string | null
          generated_email?: string | null
          hr_approved_at?: string | null
          hr_approved_by?: string | null
          hr_notes?: string | null
          id?: string
          it_completed_at?: string | null
          it_notes?: string | null
          it_started_at?: string | null
          job_title: string
          languages?: string[] | null
          nationality: string
          onboarding_checklist?: Json | null
          phone?: string | null
          photo_url?: string | null
          probation_end_date?: string | null
          rejection_reason?: string | null
          reports_to?: string | null
          requested_by?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          webdev_notes?: string | null
        }
        Update: {
          approved_at?: string | null
          assigned_to_it?: string | null
          assigned_to_webdev?: string | null
          completed_at?: string | null
          contract_type?: string | null
          created_at?: string
          crm_role?: string
          crm_user_id?: string | null
          department?: string
          documents?: Json | null
          email?: string
          full_name?: string
          generated_company_id?: string | null
          generated_email?: string | null
          hr_approved_at?: string | null
          hr_approved_by?: string | null
          hr_notes?: string | null
          id?: string
          it_completed_at?: string | null
          it_notes?: string | null
          it_started_at?: string | null
          job_title?: string
          languages?: string[] | null
          nationality?: string
          onboarding_checklist?: Json | null
          phone?: string | null
          photo_url?: string | null
          probation_end_date?: string | null
          rejection_reason?: string | null
          reports_to?: string | null
          requested_by?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          webdev_notes?: string | null
        }
        Relationships: []
      }
      new_joiner_status_history: {
        Row: {
          application_id: string
          changed_by: string | null
          created_at: string
          id: string
          notes: string | null
          status: string
        }
        Insert: {
          application_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status: string
        }
        Update: {
          application_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "new_joiner_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "new_joiner_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_events: {
        Row: {
          created_at: string
          email: string
          event_type: string
          id: string
          metadata: Json | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          event_type: string
          id?: string
          metadata?: Json | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          consent_version: string | null
          created_at: string | null
          email: string
          full_name: string | null
          gdpr_consent_at: string | null
          id: string
          is_active: boolean | null
          last_email_sent_at: string | null
          name: string | null
          phone: string | null
          preference_tags: Json | null
          preferences: Json | null
          resend_message_id: string | null
          source: string | null
          source_page: string | null
          subscribed_at: string | null
          unsubscribe_reason: string | null
          unsubscribe_source: string | null
          unsubscribe_token: string | null
          unsubscribed_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          consent_version?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          gdpr_consent_at?: string | null
          id?: string
          is_active?: boolean | null
          last_email_sent_at?: string | null
          name?: string | null
          phone?: string | null
          preference_tags?: Json | null
          preferences?: Json | null
          resend_message_id?: string | null
          source?: string | null
          source_page?: string | null
          subscribed_at?: string | null
          unsubscribe_reason?: string | null
          unsubscribe_source?: string | null
          unsubscribe_token?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          consent_version?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          gdpr_consent_at?: string | null
          id?: string
          is_active?: boolean | null
          last_email_sent_at?: string | null
          name?: string | null
          phone?: string | null
          preference_tags?: Json | null
          preferences?: Json | null
          resend_message_id?: string | null
          source?: string | null
          source_page?: string | null
          subscribed_at?: string | null
          unsubscribe_reason?: string | null
          unsubscribe_source?: string | null
          unsubscribe_token?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      note_projects: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string
          id: string
          is_read: boolean | null
          metadata: Json | null
          notification_type: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          notification_type?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          notification_type?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      open_positions: {
        Row: {
          created_at: string | null
          created_by: string | null
          department: string
          description: string | null
          employment_type: string | null
          id: string
          is_active: boolean | null
          is_broker_role: boolean | null
          location: string | null
          requirements: Json | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          department: string
          description?: string | null
          employment_type?: string | null
          id?: string
          is_active?: boolean | null
          is_broker_role?: boolean | null
          location?: string | null
          requirements?: Json | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          department?: string
          description?: string | null
          employment_type?: string | null
          id?: string
          is_active?: boolean | null
          is_broker_role?: boolean | null
          location?: string | null
          requirements?: Json | null
          title?: string
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
      owner_comm_ai_drafts: {
        Row: {
          ai_confidence: number | null
          ai_model_used: string | null
          ai_reasoning: string | null
          approved_at: string | null
          content: string
          created_at: string
          draft_type: string
          id: string
          is_approved: boolean | null
          sent_message_id: string | null
          subject: string | null
          template_id: string | null
          thread_id: string
          updated_at: string
          user_id: string
          voice_script: string | null
          voice_url: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_model_used?: string | null
          ai_reasoning?: string | null
          approved_at?: string | null
          content: string
          created_at?: string
          draft_type: string
          id?: string
          is_approved?: boolean | null
          sent_message_id?: string | null
          subject?: string | null
          template_id?: string | null
          thread_id: string
          updated_at?: string
          user_id: string
          voice_script?: string | null
          voice_url?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_model_used?: string | null
          ai_reasoning?: string | null
          approved_at?: string | null
          content?: string
          created_at?: string
          draft_type?: string
          id?: string
          is_approved?: boolean | null
          sent_message_id?: string | null
          subject?: string | null
          template_id?: string | null
          thread_id?: string
          updated_at?: string
          user_id?: string
          voice_script?: string | null
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owner_comm_ai_drafts_sent_message_id_fkey"
            columns: ["sent_message_id"]
            isOneToOne: false
            referencedRelation: "owner_comm_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_comm_ai_drafts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "owner_comm_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_comm_ai_drafts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "owner_comm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_comm_ai_learning: {
        Row: {
          applied_count: number | null
          context: string | null
          corrected_content: string | null
          created_at: string
          id: string
          importance_score: number | null
          learning_type: string
          original_content: string | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          applied_count?: number | null
          context?: string | null
          corrected_content?: string | null
          created_at?: string
          id?: string
          importance_score?: number | null
          learning_type: string
          original_content?: string | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          applied_count?: number | null
          context?: string | null
          corrected_content?: string | null
          created_at?: string
          id?: string
          importance_score?: number | null
          learning_type?: string
          original_content?: string | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      owner_comm_channels: {
        Row: {
          assistant_type: Database["public"]["Enums"]["comm_assistant_type"]
          channel_type: string
          created_at: string
          credentials: Json | null
          display_name: string
          id: string
          identifier: string
          is_active: boolean | null
          last_sync_at: string | null
          settings: Json | null
          sync_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assistant_type?: Database["public"]["Enums"]["comm_assistant_type"]
          channel_type: string
          created_at?: string
          credentials?: Json | null
          display_name: string
          id?: string
          identifier: string
          is_active?: boolean | null
          last_sync_at?: string | null
          settings?: Json | null
          sync_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assistant_type?: Database["public"]["Enums"]["comm_assistant_type"]
          channel_type?: string
          created_at?: string
          credentials?: Json | null
          display_name?: string
          id?: string
          identifier?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          settings?: Json | null
          sync_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      owner_comm_messages: {
        Row: {
          ai_model_used: string | null
          ai_template_id: string | null
          attachments: Json | null
          content: string
          content_type: string | null
          created_at: string
          delivered_at: string | null
          direction: Database["public"]["Enums"]["comm_message_direction"]
          error_message: string | null
          external_message_id: string | null
          id: string
          is_ai_generated: boolean | null
          metadata: Json | null
          read_at: string | null
          sender_identifier: string
          sender_name: string | null
          sent_at: string | null
          status: string | null
          thread_id: string
          user_id: string
          voice_duration_seconds: number | null
          voice_url: string | null
        }
        Insert: {
          ai_model_used?: string | null
          ai_template_id?: string | null
          attachments?: Json | null
          content: string
          content_type?: string | null
          created_at?: string
          delivered_at?: string | null
          direction: Database["public"]["Enums"]["comm_message_direction"]
          error_message?: string | null
          external_message_id?: string | null
          id?: string
          is_ai_generated?: boolean | null
          metadata?: Json | null
          read_at?: string | null
          sender_identifier: string
          sender_name?: string | null
          sent_at?: string | null
          status?: string | null
          thread_id: string
          user_id: string
          voice_duration_seconds?: number | null
          voice_url?: string | null
        }
        Update: {
          ai_model_used?: string | null
          ai_template_id?: string | null
          attachments?: Json | null
          content?: string
          content_type?: string | null
          created_at?: string
          delivered_at?: string | null
          direction?: Database["public"]["Enums"]["comm_message_direction"]
          error_message?: string | null
          external_message_id?: string | null
          id?: string
          is_ai_generated?: boolean | null
          metadata?: Json | null
          read_at?: string | null
          sender_identifier?: string
          sender_name?: string | null
          sent_at?: string | null
          status?: string | null
          thread_id?: string
          user_id?: string
          voice_duration_seconds?: number | null
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owner_comm_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "owner_comm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_comm_settings: {
        Row: {
          ai_draft_by_default: boolean | null
          auto_link_leads: boolean | null
          auto_log_to_crm: boolean | null
          auto_send_enabled: boolean | null
          created_at: string
          default_assistant_type:
            | Database["public"]["Enums"]["comm_assistant_type"]
            | null
          id: string
          notification_settings: Json | null
          updated_at: string
          user_id: string
          voice_enabled: boolean | null
        }
        Insert: {
          ai_draft_by_default?: boolean | null
          auto_link_leads?: boolean | null
          auto_log_to_crm?: boolean | null
          auto_send_enabled?: boolean | null
          created_at?: string
          default_assistant_type?:
            | Database["public"]["Enums"]["comm_assistant_type"]
            | null
          id?: string
          notification_settings?: Json | null
          updated_at?: string
          user_id: string
          voice_enabled?: boolean | null
        }
        Update: {
          ai_draft_by_default?: boolean | null
          auto_link_leads?: boolean | null
          auto_log_to_crm?: boolean | null
          auto_send_enabled?: boolean | null
          created_at?: string
          default_assistant_type?:
            | Database["public"]["Enums"]["comm_assistant_type"]
            | null
          id?: string
          notification_settings?: Json | null
          updated_at?: string
          user_id?: string
          voice_enabled?: boolean | null
        }
        Relationships: []
      }
      owner_comm_tasks: {
        Row: {
          ai_reasoning: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          is_ai_suggested: boolean | null
          is_completed: boolean | null
          lead_id: string | null
          priority: string | null
          reminder_at: string | null
          task_type: string | null
          thread_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_reasoning?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          is_ai_suggested?: boolean | null
          is_completed?: boolean | null
          lead_id?: string | null
          priority?: string | null
          reminder_at?: string | null
          task_type?: string | null
          thread_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_reasoning?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          is_ai_suggested?: boolean | null
          is_completed?: boolean | null
          lead_id?: string | null
          priority?: string | null
          reminder_at?: string | null
          task_type?: string | null
          thread_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_comm_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_comm_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_comm_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_comm_tasks_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "owner_comm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_comm_templates: {
        Row: {
          category: string
          channel_types: string[]
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          last_used_at: string | null
          name: string
          subject: string | null
          updated_at: string
          use_count: number | null
          user_id: string
          variables: Json | null
          voice_script: string | null
        }
        Insert: {
          category: string
          channel_types?: string[]
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name: string
          subject?: string | null
          updated_at?: string
          use_count?: number | null
          user_id: string
          variables?: Json | null
          voice_script?: string | null
        }
        Update: {
          category?: string
          channel_types?: string[]
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          subject?: string | null
          updated_at?: string
          use_count?: number | null
          user_id?: string
          variables?: Json | null
          voice_script?: string | null
        }
        Relationships: []
      }
      owner_comm_threads: {
        Row: {
          assistant_type: Database["public"]["Enums"]["comm_assistant_type"]
          channel_id: string | null
          channel_type: string
          contact_avatar_url: string | null
          contact_identifier: string
          contact_name: string | null
          created_at: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          lead_id: string | null
          metadata: Json | null
          status: Database["public"]["Enums"]["comm_thread_status"]
          unread_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assistant_type?: Database["public"]["Enums"]["comm_assistant_type"]
          channel_id?: string | null
          channel_type: string
          contact_avatar_url?: string | null
          contact_identifier: string
          contact_name?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          lead_id?: string | null
          metadata?: Json | null
          status?: Database["public"]["Enums"]["comm_thread_status"]
          unread_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assistant_type?: Database["public"]["Enums"]["comm_assistant_type"]
          channel_id?: string | null
          channel_type?: string
          contact_avatar_url?: string | null
          contact_identifier?: string
          contact_name?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          lead_id?: string | null
          metadata?: Json | null
          status?: Database["public"]["Enums"]["comm_thread_status"]
          unread_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_comm_threads_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "owner_comm_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_comm_threads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_comm_threads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_comm_threads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_comm_tone_profiles: {
        Row: {
          assistant_type: Database["public"]["Enums"]["comm_assistant_type"]
          created_at: string
          disclosure_text: string | null
          emoji_usage: number | null
          formality_level: number | null
          id: string
          is_active: boolean | null
          language_switching: boolean | null
          message_length: string | null
          preferred_languages: string[] | null
          profile_name: string
          sample_messages: string[] | null
          signature: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assistant_type?: Database["public"]["Enums"]["comm_assistant_type"]
          created_at?: string
          disclosure_text?: string | null
          emoji_usage?: number | null
          formality_level?: number | null
          id?: string
          is_active?: boolean | null
          language_switching?: boolean | null
          message_length?: string | null
          preferred_languages?: string[] | null
          profile_name?: string
          sample_messages?: string[] | null
          signature?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assistant_type?: Database["public"]["Enums"]["comm_assistant_type"]
          created_at?: string
          disclosure_text?: string | null
          emoji_usage?: number | null
          formality_level?: number | null
          id?: string
          is_active?: boolean | null
          language_switching?: boolean | null
          message_length?: string | null
          preferred_languages?: string[] | null
          profile_name?: string
          sample_messages?: string[] | null
          signature?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      owner_comm_voice_logs: {
        Row: {
          audio_url: string | null
          characters_used: number | null
          created_at: string
          duration_seconds: number | null
          error_message: string | null
          generation_time_ms: number | null
          id: string
          message_id: string | null
          script: string
          status: string | null
          thread_id: string | null
          user_id: string
          voice_id: string
        }
        Insert: {
          audio_url?: string | null
          characters_used?: number | null
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          generation_time_ms?: number | null
          id?: string
          message_id?: string | null
          script: string
          status?: string | null
          thread_id?: string | null
          user_id: string
          voice_id: string
        }
        Update: {
          audio_url?: string | null
          characters_used?: number | null
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          generation_time_ms?: number | null
          id?: string
          message_id?: string | null
          script?: string
          status?: string | null
          thread_id?: string | null
          user_id?: string
          voice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_comm_voice_logs_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "owner_comm_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_comm_voice_logs_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "owner_comm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_vault_access_logs: {
        Row: {
          access_type: string
          accessed_at: string | null
          id: string
          ip_address: unknown
          partner_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          id?: string
          ip_address?: unknown
          partner_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          id?: string
          ip_address?: unknown
          partner_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_vault_access_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_vault_access_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners_finance_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_vault_access_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_applications: {
        Row: {
          admin_notes: string | null
          admin_reviewed_at: string | null
          ceo_notes: string | null
          ceo_reviewed_at: string | null
          company_name: string
          company_profile: string | null
          compliance_confirmed: boolean
          contact_person: string
          country: string
          created_at: string
          email: string
          id: string
          instagram_url: string | null
          partnership_type: string
          phone: string
          portfolio_size: string | null
          position: string
          proposal: string
          rejection_reason: string | null
          reviewed_by_admin: string | null
          reviewed_by_ceo: string | null
          reviewed_by_senior: string | null
          senior_mgmt_notes: string | null
          senior_reviewed_at: string | null
          stage: Database["public"]["Enums"]["partnership_stage"]
          updated_at: string
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          admin_notes?: string | null
          admin_reviewed_at?: string | null
          ceo_notes?: string | null
          ceo_reviewed_at?: string | null
          company_name: string
          company_profile?: string | null
          compliance_confirmed?: boolean
          contact_person: string
          country: string
          created_at?: string
          email: string
          id?: string
          instagram_url?: string | null
          partnership_type: string
          phone: string
          portfolio_size?: string | null
          position: string
          proposal: string
          rejection_reason?: string | null
          reviewed_by_admin?: string | null
          reviewed_by_ceo?: string | null
          reviewed_by_senior?: string | null
          senior_mgmt_notes?: string | null
          senior_reviewed_at?: string | null
          stage?: Database["public"]["Enums"]["partnership_stage"]
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          admin_notes?: string | null
          admin_reviewed_at?: string | null
          ceo_notes?: string | null
          ceo_reviewed_at?: string | null
          company_name?: string
          company_profile?: string | null
          compliance_confirmed?: boolean
          contact_person?: string
          country?: string
          created_at?: string
          email?: string
          id?: string
          instagram_url?: string | null
          partnership_type?: string
          phone?: string
          portfolio_size?: string | null
          position?: string
          proposal?: string
          rejection_reason?: string | null
          reviewed_by_admin?: string | null
          reviewed_by_ceo?: string | null
          reviewed_by_senior?: string | null
          senior_mgmt_notes?: string | null
          senior_reviewed_at?: string | null
          stage?: Database["public"]["Enums"]["partnership_stage"]
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      payment_history_access_logs: {
        Row: {
          access_type: string
          accessed_at: string | null
          id: string
          ip_address: unknown
          payment_record_id: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          id?: string
          ip_address?: unknown
          payment_record_id?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          id?: string
          ip_address?: unknown
          payment_record_id?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payout_audit_logs: {
        Row: {
          action_type: string
          actor_role: string
          actor_user_id: string
          audit_id: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_status: string | null
          payout_id: string
          previous_status: string | null
          result: string
          result_reason: string | null
        }
        Insert: {
          action_type: string
          actor_role: string
          actor_user_id: string
          audit_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_status?: string | null
          payout_id: string
          previous_status?: string | null
          result: string
          result_reason?: string | null
        }
        Update: {
          action_type?: string
          actor_role?: string
          actor_user_id?: string
          audit_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_status?: string | null
          payout_id?: string
          previous_status?: string | null
          result?: string
          result_reason?: string | null
        }
        Relationships: []
      }
      payout_readiness_records: {
        Row: {
          approval_required: boolean | null
          approval_timestamp: string | null
          approved_by: string | null
          approver_role: string | null
          block_reason: string | null
          blocked_at: string | null
          blocked_by: string | null
          commission_total: number
          created_at: string
          currency: string
          execution_model: string
          id: string
          internal_notes: string | null
          jurisdiction_id: string
          partner_id: string
          partner_type: string
          payout_id: string
          payout_status: string
          related_commission_ids: string[] | null
          related_deal_ids: string[] | null
          settlement_method: string | null
          updated_at: string
        }
        Insert: {
          approval_required?: boolean | null
          approval_timestamp?: string | null
          approved_by?: string | null
          approver_role?: string | null
          block_reason?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          commission_total?: number
          created_at?: string
          currency?: string
          execution_model: string
          id?: string
          internal_notes?: string | null
          jurisdiction_id: string
          partner_id: string
          partner_type: string
          payout_id: string
          payout_status?: string
          related_commission_ids?: string[] | null
          related_deal_ids?: string[] | null
          settlement_method?: string | null
          updated_at?: string
        }
        Update: {
          approval_required?: boolean | null
          approval_timestamp?: string | null
          approved_by?: string | null
          approver_role?: string | null
          block_reason?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          commission_total?: number
          created_at?: string
          currency?: string
          execution_model?: string
          id?: string
          internal_notes?: string | null
          jurisdiction_id?: string
          partner_id?: string
          partner_type?: string
          payout_id?: string
          payout_status?: string
          related_commission_ids?: string[] | null
          related_deal_ids?: string[] | null
          settlement_method?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pending_developer_imports: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          description: string | null
          extracted_at: string | null
          feature_image_url: string | null
          id: string
          logo_url: string | null
          matched_developer_id: string | null
          name: string
          provident_link: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          slug: string
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string | null
          extracted_at?: string | null
          feature_image_url?: string | null
          id?: string
          logo_url?: string | null
          matched_developer_id?: string | null
          name: string
          provident_link?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug: string
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string | null
          extracted_at?: string | null
          feature_image_url?: string | null
          id?: string
          logo_url?: string | null
          matched_developer_id?: string | null
          name?: string
          provident_link?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_developer_imports_matched_developer_id_fkey"
            columns: ["matched_developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_project_imports: {
        Row: {
          amenities: string[] | null
          amenities_list: Json | null
          area_id: string | null
          area_name: string | null
          bedroom_types: Json | null
          bedrooms_max: number | null
          bedrooms_min: number | null
          building_count: number | null
          community_id: string | null
          community_name: string | null
          construction_progress: number | null
          construction_start_date: string | null
          construction_status: string | null
          created_at: string
          description: string | null
          developer_id: string | null
          developer_name: string | null
          documents: Json | null
          emirate: string | null
          enrichment_source: string | null
          faqs: Json | null
          floor_plan_types: Json | null
          floors: number | null
          handover_date: string | null
          handover_display: string | null
          highlights: Json | null
          id: string
          images: Json | null
          is_new_project: boolean | null
          job_id: string | null
          latitude: number | null
          location: string | null
          location_description: string | null
          location_distances: Json | null
          location_headline: string | null
          location_image_url: string | null
          longitude: number | null
          match_confidence: number | null
          matched_project_id: string | null
          name: string
          payment_breakdown: Json | null
          payment_plan: string | null
          price_from: number | null
          price_to: number | null
          property_type_label: string | null
          reelly_id: number | null
          rera_number: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sale_status: string | null
          service_charge: string | null
          short_description: string | null
          size_max: number | null
          size_min: number | null
          slug: string
          source_id: string | null
          source_updated_at: string | null
          source_url: string
          status: string | null
          status_label: string | null
          total_units: number | null
          unit_details: Json | null
          unit_types: Json | null
          updated_at: string
          usp_bullets: Json | null
          usp_headline: string | null
          usp_image_url: string | null
          video_url: string | null
          video_urls: Json | null
        }
        Insert: {
          amenities?: string[] | null
          amenities_list?: Json | null
          area_id?: string | null
          area_name?: string | null
          bedroom_types?: Json | null
          bedrooms_max?: number | null
          bedrooms_min?: number | null
          building_count?: number | null
          community_id?: string | null
          community_name?: string | null
          construction_progress?: number | null
          construction_start_date?: string | null
          construction_status?: string | null
          created_at?: string
          description?: string | null
          developer_id?: string | null
          developer_name?: string | null
          documents?: Json | null
          emirate?: string | null
          enrichment_source?: string | null
          faqs?: Json | null
          floor_plan_types?: Json | null
          floors?: number | null
          handover_date?: string | null
          handover_display?: string | null
          highlights?: Json | null
          id?: string
          images?: Json | null
          is_new_project?: boolean | null
          job_id?: string | null
          latitude?: number | null
          location?: string | null
          location_description?: string | null
          location_distances?: Json | null
          location_headline?: string | null
          location_image_url?: string | null
          longitude?: number | null
          match_confidence?: number | null
          matched_project_id?: string | null
          name: string
          payment_breakdown?: Json | null
          payment_plan?: string | null
          price_from?: number | null
          price_to?: number | null
          property_type_label?: string | null
          reelly_id?: number | null
          rera_number?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sale_status?: string | null
          service_charge?: string | null
          short_description?: string | null
          size_max?: number | null
          size_min?: number | null
          slug: string
          source_id?: string | null
          source_updated_at?: string | null
          source_url: string
          status?: string | null
          status_label?: string | null
          total_units?: number | null
          unit_details?: Json | null
          unit_types?: Json | null
          updated_at?: string
          usp_bullets?: Json | null
          usp_headline?: string | null
          usp_image_url?: string | null
          video_url?: string | null
          video_urls?: Json | null
        }
        Update: {
          amenities?: string[] | null
          amenities_list?: Json | null
          area_id?: string | null
          area_name?: string | null
          bedroom_types?: Json | null
          bedrooms_max?: number | null
          bedrooms_min?: number | null
          building_count?: number | null
          community_id?: string | null
          community_name?: string | null
          construction_progress?: number | null
          construction_start_date?: string | null
          construction_status?: string | null
          created_at?: string
          description?: string | null
          developer_id?: string | null
          developer_name?: string | null
          documents?: Json | null
          emirate?: string | null
          enrichment_source?: string | null
          faqs?: Json | null
          floor_plan_types?: Json | null
          floors?: number | null
          handover_date?: string | null
          handover_display?: string | null
          highlights?: Json | null
          id?: string
          images?: Json | null
          is_new_project?: boolean | null
          job_id?: string | null
          latitude?: number | null
          location?: string | null
          location_description?: string | null
          location_distances?: Json | null
          location_headline?: string | null
          location_image_url?: string | null
          longitude?: number | null
          match_confidence?: number | null
          matched_project_id?: string | null
          name?: string
          payment_breakdown?: Json | null
          payment_plan?: string | null
          price_from?: number | null
          price_to?: number | null
          property_type_label?: string | null
          reelly_id?: number | null
          rera_number?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sale_status?: string | null
          service_charge?: string | null
          short_description?: string | null
          size_max?: number | null
          size_min?: number | null
          slug?: string
          source_id?: string | null
          source_updated_at?: string | null
          source_url?: string
          status?: string | null
          status_label?: string | null
          total_units?: number | null
          unit_details?: Json | null
          unit_types?: Json | null
          updated_at?: string
          usp_bullets?: Json | null
          usp_headline?: string | null
          usp_image_url?: string | null
          video_url?: string | null
          video_urls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_project_imports_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_project_imports_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_project_imports_matched_project_id_fkey"
            columns: ["matched_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_project_imports_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "external_data_sources"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "phone_verifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      podcast_audio_cache: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          episode_id: number
          id: string
          language: string
          segment_index: number
          speaker: string
          storage_path: string
          text_hash: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          episode_id: number
          id?: string
          language?: string
          segment_index: number
          speaker: string
          storage_path: string
          text_hash: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          episode_id?: number
          id?: string
          language?: string
          segment_index?: number
          speaker?: string
          storage_path?: string
          text_hash?: string
        }
        Relationships: []
      }
      points_config: {
        Row: {
          created_at: string
          deal_value_max: number | null
          deal_value_min: number | null
          description: string | null
          event_type: string
          id: string
          is_active: boolean | null
          max_daily: number | null
          max_monthly: number | null
          max_weekly: number | null
          points_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_value_max?: number | null
          deal_value_min?: number | null
          description?: string | null
          event_type: string
          id?: string
          is_active?: boolean | null
          max_daily?: number | null
          max_monthly?: number | null
          max_weekly?: number | null
          points_value: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_value_max?: number | null
          deal_value_min?: number | null
          description?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          max_daily?: number | null
          max_monthly?: number | null
          max_weekly?: number | null
          points_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      points_ledger: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          event_description: string | null
          event_ref_id: string | null
          event_type: string
          id: string
          notes: string | null
          points_balance_after: number
          points_delta: number
          role: string | null
          running_total: number | null
          source_name: string | null
          user_id: string
          user_mode: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          event_description?: string | null
          event_ref_id?: string | null
          event_type: string
          id?: string
          notes?: string | null
          points_balance_after: number
          points_delta: number
          role?: string | null
          running_total?: number | null
          source_name?: string | null
          user_id: string
          user_mode?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          event_description?: string | null
          event_ref_id?: string | null
          event_type?: string
          id?: string
          notes?: string | null
          points_balance_after?: number
          points_delta?: number
          role?: string | null
          running_total?: number | null
          source_name?: string | null
          user_id?: string
          user_mode?: string | null
        }
        Relationships: []
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
      portal_listings: {
        Row: {
          admin_notes: string | null
          ai_extracted_data: Json | null
          ai_quality_score: number | null
          amenities: Json | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          area: string | null
          area_sqft: number | null
          bathrooms: number | null
          bedrooms: number | null
          cheques: number | null
          contact_email: string | null
          contact_mode: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          currency: string | null
          deleted_at: string | null
          description: string | null
          developer_name: string | null
          edit_count: number | null
          emirate: string | null
          expires_at: string | null
          featured_until: string | null
          floor_plan_images: Json | null
          furnishing: string | null
          gallery_images: Json | null
          handover_date: string | null
          id: string
          images: Json | null
          inquiry_count: number | null
          is_featured: boolean | null
          key_features: Json | null
          listing_category: string | null
          listing_fee: number | null
          listing_type: string
          location: string | null
          passport_copy_url: string | null
          payment_plan: string | null
          price: number | null
          project_name: string | null
          property_type: string | null
          rejection_reason: string | null
          rent_frequency: string | null
          seller_role: string | null
          source_documents: Json | null
          status: string | null
          title: string
          title_deed_url: string | null
          updated_at: string
          use_company_contact: boolean | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          admin_notes?: string | null
          ai_extracted_data?: Json | null
          ai_quality_score?: number | null
          amenities?: Json | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          area?: string | null
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          cheques?: number | null
          contact_email?: string | null
          contact_mode?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          developer_name?: string | null
          edit_count?: number | null
          emirate?: string | null
          expires_at?: string | null
          featured_until?: string | null
          floor_plan_images?: Json | null
          furnishing?: string | null
          gallery_images?: Json | null
          handover_date?: string | null
          id?: string
          images?: Json | null
          inquiry_count?: number | null
          is_featured?: boolean | null
          key_features?: Json | null
          listing_category?: string | null
          listing_fee?: number | null
          listing_type?: string
          location?: string | null
          passport_copy_url?: string | null
          payment_plan?: string | null
          price?: number | null
          project_name?: string | null
          property_type?: string | null
          rejection_reason?: string | null
          rent_frequency?: string | null
          seller_role?: string | null
          source_documents?: Json | null
          status?: string | null
          title: string
          title_deed_url?: string | null
          updated_at?: string
          use_company_contact?: boolean | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          admin_notes?: string | null
          ai_extracted_data?: Json | null
          ai_quality_score?: number | null
          amenities?: Json | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          area?: string | null
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          cheques?: number | null
          contact_email?: string | null
          contact_mode?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          developer_name?: string | null
          edit_count?: number | null
          emirate?: string | null
          expires_at?: string | null
          featured_until?: string | null
          floor_plan_images?: Json | null
          furnishing?: string | null
          gallery_images?: Json | null
          handover_date?: string | null
          id?: string
          images?: Json | null
          inquiry_count?: number | null
          is_featured?: boolean | null
          key_features?: Json | null
          listing_category?: string | null
          listing_fee?: number | null
          listing_type?: string
          location?: string | null
          passport_copy_url?: string | null
          payment_plan?: string | null
          price?: number | null
          project_name?: string | null
          property_type?: string | null
          rejection_reason?: string | null
          rent_frequency?: string | null
          seller_role?: string | null
          source_documents?: Json | null
          status?: string | null
          title?: string
          title_deed_url?: string | null
          updated_at?: string
          use_company_contact?: boolean | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      portal_points: {
        Row: {
          created_at: string
          free_listings_remaining: number | null
          id: string
          points: number | null
          tier: string | null
          total_listings: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          free_listings_remaining?: number | null
          id?: string
          points?: number | null
          tier?: string | null
          total_listings?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          free_listings_remaining?: number | null
          id?: string
          points?: number | null
          tier?: string | null
          total_listings?: number | null
          updated_at?: string
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
          avatar_initials: string | null
          broker_tier: string | null
          client_tier: string | null
          consent_timestamp: string | null
          created_at: string
          email: string | null
          first_deal_verified: boolean | null
          first_deal_verified_at: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_login_at: string | null
          last_name: string | null
          login_streak: number | null
          marketing_consent: boolean | null
          mode_default: string | null
          phone_number: string | null
          phone_verified: boolean | null
          tier_updated_at: string | null
          total_login_days: number | null
          updated_at: string
          user_role: string | null
          user_type: string | null
        }
        Insert: {
          avatar_initials?: string | null
          broker_tier?: string | null
          client_tier?: string | null
          consent_timestamp?: string | null
          created_at?: string
          email?: string | null
          first_deal_verified?: boolean | null
          first_deal_verified_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_login_at?: string | null
          last_name?: string | null
          login_streak?: number | null
          marketing_consent?: boolean | null
          mode_default?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          tier_updated_at?: string | null
          total_login_days?: number | null
          updated_at?: string
          user_role?: string | null
          user_type?: string | null
        }
        Update: {
          avatar_initials?: string | null
          broker_tier?: string | null
          client_tier?: string | null
          consent_timestamp?: string | null
          created_at?: string
          email?: string | null
          first_deal_verified?: boolean | null
          first_deal_verified_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          last_name?: string | null
          login_streak?: number | null
          marketing_consent?: boolean | null
          mode_default?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          tier_updated_at?: string | null
          total_login_days?: number | null
          updated_at?: string
          user_role?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      project_ai_cache: {
        Row: {
          analysis_json: Json
          generated_at: string
          project_slug: string
        }
        Insert: {
          analysis_json: Json
          generated_at?: string
          project_slug: string
        }
        Update: {
          analysis_json?: Json
          generated_at?: string
          project_slug?: string
        }
        Relationships: []
      }
      project_ai_scores: {
        Row: {
          analysis_details: Json | null
          created_at: string
          developer_name: string | null
          developer_reputation_score: number | null
          id: string
          investor_interest_score: number | null
          location: string | null
          location_growth_score: number | null
          market_timing_score: number | null
          overall_score: number | null
          project_id: string | null
          project_name: string
          recommendation: string | null
          risk_level: string | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          analysis_details?: Json | null
          created_at?: string
          developer_name?: string | null
          developer_reputation_score?: number | null
          id?: string
          investor_interest_score?: number | null
          location?: string | null
          location_growth_score?: number | null
          market_timing_score?: number | null
          overall_score?: number | null
          project_id?: string | null
          project_name: string
          recommendation?: string | null
          risk_level?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          analysis_details?: Json | null
          created_at?: string
          developer_name?: string | null
          developer_reputation_score?: number | null
          id?: string
          investor_interest_score?: number | null
          location?: string | null
          location_growth_score?: number | null
          market_timing_score?: number | null
          overall_score?: number | null
          project_id?: string | null
          project_name?: string
          recommendation?: string | null
          risk_level?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          allow_download: boolean
          cover_image_url: string | null
          created_at: string
          data_source: string | null
          display_order: number | null
          display_title: string | null
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          is_visible: boolean
          project_id: string
          storage_path: string | null
        }
        Insert: {
          allow_download?: boolean
          cover_image_url?: string | null
          created_at?: string
          data_source?: string | null
          display_order?: number | null
          display_title?: string | null
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          is_visible?: boolean
          project_id: string
          storage_path?: string | null
        }
        Update: {
          allow_download?: boolean
          cover_image_url?: string | null
          created_at?: string
          data_source?: string | null
          display_order?: number | null
          display_title?: string | null
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          is_visible?: boolean
          project_id?: string
          storage_path?: string | null
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
          data_source: string | null
          display_order: number | null
          id: string
          image_url: string
          project_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          data_source?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          project_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          data_source?: string | null
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
      project_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          issue_type: string
          project_id: string
          reporter_email: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          issue_type: string
          project_id: string
          reporter_email?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          issue_type?: string
          project_id?: string
          reporter_email?: string | null
        }
        Relationships: []
      }
      project_sync_status: {
        Row: {
          created_at: string | null
          flag_reason: string | null
          id: string
          is_flagged_for_review: boolean | null
          last_seen_at: string | null
          project_id: string | null
          source_name: string
          source_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged_for_review?: boolean | null
          last_seen_at?: string | null
          project_id?: string | null
          source_name: string
          source_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged_for_review?: boolean | null
          last_seen_at?: string | null
          project_id?: string | null
          source_name?: string
          source_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_sync_status_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_translations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          language_code: string
          project_id: string
          tagline: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          language_code: string
          project_id: string
          tagline?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          language_code?: string
          project_id?: string
          tagline?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_translations_project_id_fkey"
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
          amenities_list: Json | null
          amenity_images: Json | null
          area_id: string | null
          area_name: string | null
          area_unit: string | null
          availability_status: string | null
          availability_visible: boolean | null
          available_units: number | null
          bedroom_types: Json | null
          bedrooms_max: number | null
          bedrooms_min: number | null
          building_count: number | null
          community_id: string | null
          construction_progress: number | null
          construction_start_date: string | null
          construction_status: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          detail_fetched_at: string | null
          developer_id: string | null
          developer_name: string | null
          down_payment_percent: number | null
          emirate: string | null
          expected_completion: string | null
          external_id: string | null
          facilities: string[] | null
          faqs: Json | null
          floor_plan_types: Json | null
          floors: number | null
          furnished_status: string | null
          handover_date: string | null
          highlights: Json | null
          id: string
          import_source: string | null
          is_developer_direct: boolean | null
          is_featured: boolean | null
          is_offplan: boolean | null
          is_premium: boolean | null
          is_published: boolean | null
          is_sold_out: boolean | null
          latitude: number | null
          location: string | null
          location_description: string | null
          location_distances: Json | null
          location_headline: string | null
          location_image_url: string | null
          longitude: number | null
          name: string
          payment_breakdown: Json | null
          payment_plan: string | null
          price_currency: string | null
          price_from: number | null
          price_to: number | null
          property_type_label: string | null
          provident_enrichments: Json | null
          reelly_developer_id: number | null
          reelly_id: number | null
          reelly_raw_data: Json | null
          rental_yield_estimate: number | null
          roi_estimate: number | null
          sale_status: string | null
          sector: string | null
          service_charge: string | null
          short_description: string | null
          size_max: number | null
          size_min: number | null
          slug: string
          source: string | null
          source_id: string | null
          source_updated_at: string | null
          source_url: string | null
          status: string | null
          status_label: string | null
          total_units: number | null
          unit_types: Json | null
          units_data: Json | null
          updated_at: string
          usp_bullets: Json | null
          usp_headline: string | null
          usp_image_url: string | null
          video_url: string | null
          video_urls: Json | null
          views: string[] | null
          virtual_tour_url: string | null
        }
        Insert: {
          amenities?: string[] | null
          amenities_list?: Json | null
          amenity_images?: Json | null
          area_id?: string | null
          area_name?: string | null
          area_unit?: string | null
          availability_status?: string | null
          availability_visible?: boolean | null
          available_units?: number | null
          bedroom_types?: Json | null
          bedrooms_max?: number | null
          bedrooms_min?: number | null
          building_count?: number | null
          community_id?: string | null
          construction_progress?: number | null
          construction_start_date?: string | null
          construction_status?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          detail_fetched_at?: string | null
          developer_id?: string | null
          developer_name?: string | null
          down_payment_percent?: number | null
          emirate?: string | null
          expected_completion?: string | null
          external_id?: string | null
          facilities?: string[] | null
          faqs?: Json | null
          floor_plan_types?: Json | null
          floors?: number | null
          furnished_status?: string | null
          handover_date?: string | null
          highlights?: Json | null
          id?: string
          import_source?: string | null
          is_developer_direct?: boolean | null
          is_featured?: boolean | null
          is_offplan?: boolean | null
          is_premium?: boolean | null
          is_published?: boolean | null
          is_sold_out?: boolean | null
          latitude?: number | null
          location?: string | null
          location_description?: string | null
          location_distances?: Json | null
          location_headline?: string | null
          location_image_url?: string | null
          longitude?: number | null
          name: string
          payment_breakdown?: Json | null
          payment_plan?: string | null
          price_currency?: string | null
          price_from?: number | null
          price_to?: number | null
          property_type_label?: string | null
          provident_enrichments?: Json | null
          reelly_developer_id?: number | null
          reelly_id?: number | null
          reelly_raw_data?: Json | null
          rental_yield_estimate?: number | null
          roi_estimate?: number | null
          sale_status?: string | null
          sector?: string | null
          service_charge?: string | null
          short_description?: string | null
          size_max?: number | null
          size_min?: number | null
          slug: string
          source?: string | null
          source_id?: string | null
          source_updated_at?: string | null
          source_url?: string | null
          status?: string | null
          status_label?: string | null
          total_units?: number | null
          unit_types?: Json | null
          units_data?: Json | null
          updated_at?: string
          usp_bullets?: Json | null
          usp_headline?: string | null
          usp_image_url?: string | null
          video_url?: string | null
          video_urls?: Json | null
          views?: string[] | null
          virtual_tour_url?: string | null
        }
        Update: {
          amenities?: string[] | null
          amenities_list?: Json | null
          amenity_images?: Json | null
          area_id?: string | null
          area_name?: string | null
          area_unit?: string | null
          availability_status?: string | null
          availability_visible?: boolean | null
          available_units?: number | null
          bedroom_types?: Json | null
          bedrooms_max?: number | null
          bedrooms_min?: number | null
          building_count?: number | null
          community_id?: string | null
          construction_progress?: number | null
          construction_start_date?: string | null
          construction_status?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          detail_fetched_at?: string | null
          developer_id?: string | null
          developer_name?: string | null
          down_payment_percent?: number | null
          emirate?: string | null
          expected_completion?: string | null
          external_id?: string | null
          facilities?: string[] | null
          faqs?: Json | null
          floor_plan_types?: Json | null
          floors?: number | null
          furnished_status?: string | null
          handover_date?: string | null
          highlights?: Json | null
          id?: string
          import_source?: string | null
          is_developer_direct?: boolean | null
          is_featured?: boolean | null
          is_offplan?: boolean | null
          is_premium?: boolean | null
          is_published?: boolean | null
          is_sold_out?: boolean | null
          latitude?: number | null
          location?: string | null
          location_description?: string | null
          location_distances?: Json | null
          location_headline?: string | null
          location_image_url?: string | null
          longitude?: number | null
          name?: string
          payment_breakdown?: Json | null
          payment_plan?: string | null
          price_currency?: string | null
          price_from?: number | null
          price_to?: number | null
          property_type_label?: string | null
          provident_enrichments?: Json | null
          reelly_developer_id?: number | null
          reelly_id?: number | null
          reelly_raw_data?: Json | null
          rental_yield_estimate?: number | null
          roi_estimate?: number | null
          sale_status?: string | null
          sector?: string | null
          service_charge?: string | null
          short_description?: string | null
          size_max?: number | null
          size_min?: number | null
          slug?: string
          source?: string | null
          source_id?: string | null
          source_updated_at?: string | null
          source_url?: string | null
          status?: string | null
          status_label?: string | null
          total_units?: number | null
          unit_types?: Json | null
          units_data?: Json | null
          updated_at?: string
          usp_bullets?: Json | null
          usp_headline?: string | null
          usp_image_url?: string | null
          video_url?: string | null
          video_urls?: Json | null
          views?: string[] | null
          virtual_tour_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
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
      property_analysis_cache: {
        Row: {
          analysis_data: Json
          analysis_type: string
          area_name: string
          confidence_score: number | null
          created_at: string
          expires_at: string
          id: string
          sources_used: string[] | null
          user_id: string | null
        }
        Insert: {
          analysis_data?: Json
          analysis_type?: string
          area_name: string
          confidence_score?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          sources_used?: string[] | null
          user_id?: string | null
        }
        Update: {
          analysis_data?: Json
          analysis_type?: string
          area_name?: string
          confidence_score?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          sources_used?: string[] | null
          user_id?: string | null
        }
        Relationships: []
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
      reelly_dictionaries: {
        Row: {
          dict_type: string
          fetched_at: string
          id: string
          key: string
          label: string
          metadata: Json | null
        }
        Insert: {
          dict_type: string
          fetched_at?: string
          id?: string
          key: string
          label: string
          metadata?: Json | null
        }
        Update: {
          dict_type?: string
          fetched_at?: string
          id?: string
          key?: string
          label?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      reelly_sync_logs: {
        Row: {
          completed_at: string | null
          created_by: string | null
          error_details: Json | null
          errors: Json | null
          id: string
          is_reconciled: boolean | null
          projects_created: number | null
          projects_failed: number | null
          projects_processed: number | null
          projects_skipped: number | null
          projects_updated: number | null
          started_at: string | null
          status: string | null
          sync_type: string
          total_available: number | null
        }
        Insert: {
          completed_at?: string | null
          created_by?: string | null
          error_details?: Json | null
          errors?: Json | null
          id?: string
          is_reconciled?: boolean | null
          projects_created?: number | null
          projects_failed?: number | null
          projects_processed?: number | null
          projects_skipped?: number | null
          projects_updated?: number | null
          started_at?: string | null
          status?: string | null
          sync_type: string
          total_available?: number | null
        }
        Update: {
          completed_at?: string | null
          created_by?: string | null
          error_details?: Json | null
          errors?: Json | null
          id?: string
          is_reconciled?: boolean | null
          projects_created?: number | null
          projects_failed?: number | null
          projects_processed?: number | null
          projects_skipped?: number | null
          projects_updated?: number | null
          started_at?: string | null
          status?: string | null
          sync_type?: string
          total_available?: number | null
        }
        Relationships: []
      }
      referral_code_usages: {
        Row: {
          created_at: string
          id: string
          lead_id: string | null
          notes: string | null
          property_interest: string | null
          referral_code: string
          referral_partner_id: string | null
          source: string
          status: string | null
          updated_at: string
          used_by_email: string
          used_by_name: string
          used_by_phone: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          property_interest?: string | null
          referral_code: string
          referral_partner_id?: string | null
          source?: string
          status?: string | null
          updated_at?: string
          used_by_email: string
          used_by_name: string
          used_by_phone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          property_interest?: string | null
          referral_code?: string
          referral_partner_id?: string | null
          source?: string
          status?: string | null
          updated_at?: string
          used_by_email?: string
          used_by_name?: string
          used_by_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_code_usages_referral_partner_id_fkey"
            columns: ["referral_partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_code_usages_referral_partner_id_fkey"
            columns: ["referral_partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners_finance_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_code_usages_referral_partner_id_fkey"
            columns: ["referral_partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners_safe"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "referral_commissions_referral_partner_id_fkey"
            columns: ["referral_partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners_finance_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_referral_partner_id_fkey"
            columns: ["referral_partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners_safe"
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
          {
            foreignKeyName: "referral_leads_referral_partner_id_fkey"
            columns: ["referral_partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners_finance_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_leads_referral_partner_id_fkey"
            columns: ["referral_partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_partner_bank_vault: {
        Row: {
          bank_account_encrypted: string | null
          bank_iban_encrypted: string | null
          bank_name: string | null
          created_at: string | null
          created_by: string | null
          id: string
          partner_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          bank_account_encrypted?: string | null
          bank_iban_encrypted?: string | null
          bank_name?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          partner_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          bank_account_encrypted?: string | null
          bank_iban_encrypted?: string | null
          bank_name?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          partner_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_partner_bank_vault_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "referral_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_partner_bank_vault_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "referral_partners_finance_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_partner_bank_vault_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "referral_partners_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_partner_banking: {
        Row: {
          bank_account_encrypted: string | null
          bank_iban_encrypted: string | null
          bank_name_encrypted: string | null
          created_at: string | null
          encryption_key_id: string | null
          id: string
          last_accessed_at: string | null
          last_accessed_by: string | null
          partner_id: string
          updated_at: string | null
        }
        Insert: {
          bank_account_encrypted?: string | null
          bank_iban_encrypted?: string | null
          bank_name_encrypted?: string | null
          created_at?: string | null
          encryption_key_id?: string | null
          id?: string
          last_accessed_at?: string | null
          last_accessed_by?: string | null
          partner_id: string
          updated_at?: string | null
        }
        Update: {
          bank_account_encrypted?: string | null
          bank_iban_encrypted?: string | null
          bank_name_encrypted?: string | null
          created_at?: string | null
          encryption_key_id?: string | null
          id?: string
          last_accessed_at?: string | null
          last_accessed_by?: string | null
          partner_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_partner_banking_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "referral_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_partner_banking_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "referral_partners_finance_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_partner_banking_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "referral_partners_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_partner_banking_access_logs: {
        Row: {
          access_type: string
          accessed_at: string | null
          id: string
          ip_address: string | null
          partner_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          id?: string
          ip_address?: string | null
          partner_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          id?: string
          ip_address?: string | null
          partner_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_partner_banking_access_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_partner_banking_access_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners_finance_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_partner_banking_access_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_partners: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          commission_rate: number
          contract_signed_at: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          nationality: string | null
          notes: string | null
          partner_type: string
          passport_number: string | null
          phone_e164: string | null
          referral_code: string
          signature_data_url: string | null
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
          commission_rate?: number
          contract_signed_at?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          nationality?: string | null
          notes?: string | null
          partner_type?: string
          passport_number?: string | null
          phone_e164?: string | null
          referral_code: string
          signature_data_url?: string | null
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
          commission_rate?: number
          contract_signed_at?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          nationality?: string | null
          notes?: string | null
          partner_type?: string
          passport_number?: string | null
          phone_e164?: string | null
          referral_code?: string
          signature_data_url?: string | null
          status?: string
          total_conversions?: number | null
          total_earnings_aed?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      referral_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string | null
          referral_type: string | null
          referred_user_id: string
          referrer_user_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code?: string | null
          referral_type?: string | null
          referred_user_id: string
          referrer_user_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string | null
          referral_type?: string | null
          referred_user_id?: string
          referrer_user_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rental_listing_approvals: {
        Row: {
          approved_at: string | null
          approver_department: string | null
          approver_email: string | null
          approver_name: string | null
          approver_photo: string | null
          approver_role: string
          approver_title: string | null
          created_at: string
          id: string
          listing_id: string
          notes: string | null
          status: string | null
          step_name: string
          step_number: number
        }
        Insert: {
          approved_at?: string | null
          approver_department?: string | null
          approver_email?: string | null
          approver_name?: string | null
          approver_photo?: string | null
          approver_role: string
          approver_title?: string | null
          created_at?: string
          id?: string
          listing_id: string
          notes?: string | null
          status?: string | null
          step_name: string
          step_number: number
        }
        Update: {
          approved_at?: string | null
          approver_department?: string | null
          approver_email?: string | null
          approver_name?: string | null
          approver_photo?: string | null
          approver_role?: string
          approver_title?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          notes?: string | null
          status?: string | null
          step_name?: string
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "rental_listing_approvals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "rental_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_listing_approvals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "rental_listings_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_listing_approvals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_rental_listings_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_listing_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          listing_id: string
          message: string
          notification_type: string
          step_completed: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          listing_id: string
          message: string
          notification_type: string
          step_completed?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          listing_id?: string
          message?: string
          notification_type?: string
          step_completed?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_listing_notifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "rental_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_listing_notifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "rental_listings_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_listing_notifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_rental_listings_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_listings: {
        Row: {
          address: string | null
          admin_approved_at: string | null
          admin_approved_by: string | null
          amenities: string[] | null
          annual_rent: number
          assistant_approved_at: string | null
          assistant_approved_by: string | null
          bathrooms: number | null
          bedrooms: number | null
          building_name: string | null
          community: string | null
          created_at: string
          description: string | null
          documents: string[] | null
          emirate: string
          founder_approved_at: string | null
          founder_approved_by: string | null
          furnished: string | null
          id: string
          images: string[] | null
          landlord_email: string
          landlord_name: string
          landlord_nationality: string | null
          landlord_phone: string
          leadership_approved_at: string | null
          leadership_approved_by: string | null
          ownership_type: string | null
          payment_terms: string | null
          property_title: string
          property_type: string
          rejection_reason: string | null
          security_deposit: number | null
          size_sqft: number | null
          status: string | null
          updated_at: string
          user_id: string
          video_url: string | null
          went_live_at: string | null
        }
        Insert: {
          address?: string | null
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          amenities?: string[] | null
          annual_rent: number
          assistant_approved_at?: string | null
          assistant_approved_by?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_name?: string | null
          community?: string | null
          created_at?: string
          description?: string | null
          documents?: string[] | null
          emirate: string
          founder_approved_at?: string | null
          founder_approved_by?: string | null
          furnished?: string | null
          id?: string
          images?: string[] | null
          landlord_email: string
          landlord_name: string
          landlord_nationality?: string | null
          landlord_phone: string
          leadership_approved_at?: string | null
          leadership_approved_by?: string | null
          ownership_type?: string | null
          payment_terms?: string | null
          property_title: string
          property_type: string
          rejection_reason?: string | null
          security_deposit?: number | null
          size_sqft?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
          went_live_at?: string | null
        }
        Update: {
          address?: string | null
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          amenities?: string[] | null
          annual_rent?: number
          assistant_approved_at?: string | null
          assistant_approved_by?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_name?: string | null
          community?: string | null
          created_at?: string
          description?: string | null
          documents?: string[] | null
          emirate?: string
          founder_approved_at?: string | null
          founder_approved_by?: string | null
          furnished?: string | null
          id?: string
          images?: string[] | null
          landlord_email?: string
          landlord_name?: string
          landlord_nationality?: string | null
          landlord_phone?: string
          leadership_approved_at?: string | null
          leadership_approved_by?: string | null
          ownership_type?: string | null
          payment_terms?: string | null
          property_title?: string
          property_type?: string
          rejection_reason?: string | null
          security_deposit?: number | null
          size_sqft?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
          went_live_at?: string | null
        }
        Relationships: []
      }
      rep_activity_log: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string | null
          id: string
          points_earned: number | null
          representative_id: string
          response_time_minutes: number | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          points_earned?: number | null
          representative_id: string
          response_time_minutes?: number | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          points_earned?: number | null
          representative_id?: string
          response_time_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rep_activity_log_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "developer_representatives"
            referencedColumns: ["id"]
          },
        ]
      }
      report_delivery_logs: {
        Row: {
          error_message: string | null
          id: string
          metadata: Json | null
          pdf_url: string | null
          recipients: string[]
          scheduled_report_id: string
          sent_at: string
          status: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          metadata?: Json | null
          pdf_url?: string | null
          recipients: string[]
          scheduled_report_id: string
          sent_at?: string
          status?: string
        }
        Update: {
          error_message?: string | null
          id?: string
          metadata?: Json | null
          pdf_url?: string | null
          recipients?: string[]
          scheduled_report_id?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_delivery_logs_scheduled_report_id_fkey"
            columns: ["scheduled_report_id"]
            isOneToOne: false
            referencedRelation: "scheduled_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      resale_listings: {
        Row: {
          area_name: string | null
          asking_price: number | null
          bedrooms: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          developer_name: string | null
          emirate: string | null
          handover_status: string | null
          id: string
          images: string[] | null
          investor_email: string | null
          investor_name: string | null
          investor_phone: string | null
          investor_user_id: string | null
          location: string | null
          original_purchase_price: number | null
          project_name: string | null
          property_type: string | null
          size_sqft: number | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          area_name?: string | null
          asking_price?: number | null
          bedrooms?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          developer_name?: string | null
          emirate?: string | null
          handover_status?: string | null
          id?: string
          images?: string[] | null
          investor_email?: string | null
          investor_name?: string | null
          investor_phone?: string | null
          investor_user_id?: string | null
          location?: string | null
          original_purchase_price?: number | null
          project_name?: string | null
          property_type?: string | null
          size_sqft?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          area_name?: string | null
          asking_price?: number | null
          bedrooms?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          developer_name?: string | null
          emirate?: string | null
          handover_status?: string | null
          id?: string
          images?: string[] | null
          investor_email?: string | null
          investor_name?: string | null
          investor_phone?: string | null
          investor_user_id?: string | null
          location?: string | null
          original_purchase_price?: number | null
          project_name?: string | null
          property_type?: string | null
          size_sqft?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
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
      rewards_redemptions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          delivered_at: string | null
          id: string
          notes: string | null
          points_spent: number
          requested_at: string
          reward_id: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          points_spent: number
          requested_at?: string
          reward_id?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          points_spent?: number
          requested_at?: string
          reward_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_access_logs: {
        Row: {
          access_type: string
          accessed_at: string | null
          employee_user_id: string | null
          id: string
          ip_address: string | null
          salary_record_id: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          employee_user_id?: string | null
          id?: string
          ip_address?: string | null
          salary_record_id?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          employee_user_id?: string | null
          id?: string
          ip_address?: string | null
          salary_record_id?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          created_at: string
          frequency: string
          id: string
          is_active: boolean
          last_sent_at: string | null
          next_send_at: string
          recipients: string[]
          report_config: Json | null
          report_name: string
          report_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency: string
          id?: string
          is_active?: boolean
          last_sent_at?: string | null
          next_send_at: string
          recipients?: string[]
          report_config?: Json | null
          report_name: string
          report_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_sent_at?: string | null
          next_send_at?: string
          recipients?: string[]
          report_config?: Json | null
          report_name?: string
          report_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scraping_blocks: {
        Row: {
          block_reason: string
          blocked_at: string
          created_at: string
          expires_at: string
          fingerprint: string
          id: string
          ip_address: string | null
          is_permanent: boolean | null
        }
        Insert: {
          block_reason: string
          blocked_at?: string
          created_at?: string
          expires_at?: string
          fingerprint: string
          id?: string
          ip_address?: string | null
          is_permanent?: boolean | null
        }
        Update: {
          block_reason?: string
          blocked_at?: string
          created_at?: string
          expires_at?: string
          fingerprint?: string
          id?: string
          ip_address?: string | null
          is_permanent?: boolean | null
        }
        Relationships: []
      }
      security_access_audit: {
        Row: {
          action_type: string
          created_at: string
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
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
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          severity: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          severity?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          severity?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          action_taken: string | null
          ai_agent_id: string | null
          created_at: string | null
          department: string | null
          description: string
          event_type: Database["public"]["Enums"]["security_event_type"]
          id: string
          ip_address: unknown
          is_resolved: boolean | null
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          resource_id: string | null
          resource_type: string | null
          severity: Database["public"]["Enums"]["security_severity"]
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_taken?: string | null
          ai_agent_id?: string | null
          created_at?: string | null
          department?: string | null
          description: string
          event_type: Database["public"]["Enums"]["security_event_type"]
          id?: string
          ip_address?: unknown
          is_resolved?: boolean | null
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          resource_id?: string | null
          resource_type?: string | null
          severity?: Database["public"]["Enums"]["security_severity"]
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_taken?: string | null
          ai_agent_id?: string | null
          created_at?: string | null
          department?: string | null
          description?: string
          event_type?: Database["public"]["Enums"]["security_event_type"]
          id?: string
          ip_address?: unknown
          is_resolved?: boolean | null
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          resource_id?: string | null
          resource_type?: string | null
          severity?: Database["public"]["Enums"]["security_severity"]
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_health_metrics: {
        Row: {
          blocked_activities: number | null
          created_at: string | null
          data_leaks_prevented: number | null
          department_risk_scores: Json | null
          encryption_compliance_percent: number | null
          ethics_flags: number | null
          id: string
          metric_date: string
          policy_violations: number | null
          security_score: number | null
          unauthorized_attempts: number | null
        }
        Insert: {
          blocked_activities?: number | null
          created_at?: string | null
          data_leaks_prevented?: number | null
          department_risk_scores?: Json | null
          encryption_compliance_percent?: number | null
          ethics_flags?: number | null
          id?: string
          metric_date?: string
          policy_violations?: number | null
          security_score?: number | null
          unauthorized_attempts?: number | null
        }
        Update: {
          blocked_activities?: number | null
          created_at?: string | null
          data_leaks_prevented?: number | null
          department_risk_scores?: Json | null
          encryption_compliance_percent?: number | null
          ethics_flags?: number | null
          id?: string
          metric_date?: string
          policy_violations?: number | null
          security_score?: number | null
          unauthorized_attempts?: number | null
        }
        Relationships: []
      }
      seller_listings: {
        Row: {
          additional_doc_urls: string[] | null
          admin_approved_at: string | null
          admin_approved_by: string | null
          ai_generated_description: string | null
          ai_score: number | null
          ai_score_data: Json | null
          approval_status: string | null
          assistant_approved_at: string | null
          assistant_approved_by: string | null
          bedrooms: number | null
          community_building: string | null
          contact_mode: string | null
          created_at: string
          estimated_value_range: Json | null
          floor_plan_urls: string[] | null
          founder_approved_at: string | null
          founder_approved_by: string | null
          has_upgrades: boolean | null
          id: string
          is_furnished: boolean | null
          key_highlights: string[] | null
          leadership_approved_at: string | null
          leadership_approved_by: string | null
          listing_description: string | null
          listing_fee: number | null
          minimum_acceptable_price: number | null
          passport_url: string | null
          photo_urls: string[] | null
          poa_url: string | null
          preferred_contact_method: string | null
          preferred_language: string | null
          property_location: string
          property_notes: string | null
          property_size_sqft: number | null
          property_status: string | null
          property_type: string
          purchase_price: number | null
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          seller_email: string
          seller_email_encrypted: string | null
          seller_full_name: string
          seller_name_encrypted: string | null
          seller_phone: string
          seller_phone_encrypted: string | null
          seller_type: string
          selling_urgency: string | null
          status: string
          submission_confirmed: boolean | null
          submitted_at: string | null
          target_selling_price: number
          title_deed_url: string | null
          updated_at: string
          upgrade_details: string | null
          user_id: string
          video_urls: string[] | null
          went_live_at: string | null
        }
        Insert: {
          additional_doc_urls?: string[] | null
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          ai_generated_description?: string | null
          ai_score?: number | null
          ai_score_data?: Json | null
          approval_status?: string | null
          assistant_approved_at?: string | null
          assistant_approved_by?: string | null
          bedrooms?: number | null
          community_building?: string | null
          contact_mode?: string | null
          created_at?: string
          estimated_value_range?: Json | null
          floor_plan_urls?: string[] | null
          founder_approved_at?: string | null
          founder_approved_by?: string | null
          has_upgrades?: boolean | null
          id?: string
          is_furnished?: boolean | null
          key_highlights?: string[] | null
          leadership_approved_at?: string | null
          leadership_approved_by?: string | null
          listing_description?: string | null
          listing_fee?: number | null
          minimum_acceptable_price?: number | null
          passport_url?: string | null
          photo_urls?: string[] | null
          poa_url?: string | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          property_location: string
          property_notes?: string | null
          property_size_sqft?: number | null
          property_status?: string | null
          property_type: string
          purchase_price?: number | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_email: string
          seller_email_encrypted?: string | null
          seller_full_name: string
          seller_name_encrypted?: string | null
          seller_phone: string
          seller_phone_encrypted?: string | null
          seller_type?: string
          selling_urgency?: string | null
          status?: string
          submission_confirmed?: boolean | null
          submitted_at?: string | null
          target_selling_price: number
          title_deed_url?: string | null
          updated_at?: string
          upgrade_details?: string | null
          user_id: string
          video_urls?: string[] | null
          went_live_at?: string | null
        }
        Update: {
          additional_doc_urls?: string[] | null
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          ai_generated_description?: string | null
          ai_score?: number | null
          ai_score_data?: Json | null
          approval_status?: string | null
          assistant_approved_at?: string | null
          assistant_approved_by?: string | null
          bedrooms?: number | null
          community_building?: string | null
          contact_mode?: string | null
          created_at?: string
          estimated_value_range?: Json | null
          floor_plan_urls?: string[] | null
          founder_approved_at?: string | null
          founder_approved_by?: string | null
          has_upgrades?: boolean | null
          id?: string
          is_furnished?: boolean | null
          key_highlights?: string[] | null
          leadership_approved_at?: string | null
          leadership_approved_by?: string | null
          listing_description?: string | null
          listing_fee?: number | null
          minimum_acceptable_price?: number | null
          passport_url?: string | null
          photo_urls?: string[] | null
          poa_url?: string | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          property_location?: string
          property_notes?: string | null
          property_size_sqft?: number | null
          property_status?: string | null
          property_type?: string
          purchase_price?: number | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_email?: string
          seller_email_encrypted?: string | null
          seller_full_name?: string
          seller_name_encrypted?: string | null
          seller_phone?: string
          seller_phone_encrypted?: string | null
          seller_type?: string
          selling_urgency?: string | null
          status?: string
          submission_confirmed?: boolean | null
          submitted_at?: string | null
          target_selling_price?: number
          title_deed_url?: string | null
          updated_at?: string
          upgrade_details?: string | null
          user_id?: string
          video_urls?: string[] | null
          went_live_at?: string | null
        }
        Relationships: []
      }
      shared_business_cards: {
        Row: {
          card_data: Json
          created_at: string
          expires_at: string | null
          id: string
          token: string
          user_id: string
          view_count: number
        }
        Insert: {
          card_data: Json
          created_at?: string
          expires_at?: string | null
          id?: string
          token?: string
          user_id: string
          view_count?: number
        }
        Update: {
          card_data?: Json
          created_at?: string
          expires_at?: string | null
          id?: string
          token?: string
          user_id?: string
          view_count?: number
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
      site_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      stamp_designs: {
        Row: {
          ai_prompt: string | null
          created_at: string
          design_version: number
          id: string
          is_favorite: boolean | null
          preview_png_url: string | null
          project_id: string
          style_snapshot_json: Json | null
          svg_source: string | null
          svg_url: string | null
          template_key: string | null
          user_id: string
        }
        Insert: {
          ai_prompt?: string | null
          created_at?: string
          design_version?: number
          id?: string
          is_favorite?: boolean | null
          preview_png_url?: string | null
          project_id: string
          style_snapshot_json?: Json | null
          svg_source?: string | null
          svg_url?: string | null
          template_key?: string | null
          user_id: string
        }
        Update: {
          ai_prompt?: string | null
          created_at?: string
          design_version?: number
          id?: string
          is_favorite?: boolean | null
          preview_png_url?: string | null
          project_id?: string
          style_snapshot_json?: Json | null
          svg_source?: string | null
          svg_url?: string | null
          template_key?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stamp_designs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "stamp_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      stamp_exports: {
        Row: {
          created_at: string
          design_id: string
          export_bundle_zip_url: string | null
          id: string
          includes: Json | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          design_id: string
          export_bundle_zip_url?: string | null
          id?: string
          includes?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          design_id?: string
          export_bundle_zip_url?: string | null
          id?: string
          includes?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stamp_exports_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "stamp_designs"
            referencedColumns: ["id"]
          },
        ]
      }
      stamp_projects: {
        Row: {
          address_optional: string | null
          approval_status: string
          arabic_city: string | null
          arabic_company_name: string | null
          border_style: string
          business_type: string | null
          city_optional: string | null
          company_name: string
          country_optional: string | null
          created_at: string
          density: number
          email_optional: string | null
          icon_style: string
          id: string
          language_mode: string
          language_reversed: boolean | null
          layout_json: Json | null
          location_text_mode: string | null
          monogram_text: string | null
          phone_optional: string | null
          project_name: string
          registration_number_optional: string | null
          selected_design_id: string | null
          show_license_number: boolean | null
          show_location: boolean | null
          stamp_type: string
          style_theme: string
          trade_name_optional: string | null
          typography_style: string
          updated_at: string
          uploaded_logo_url: string | null
          user_id: string
          website_optional: string | null
        }
        Insert: {
          address_optional?: string | null
          approval_status?: string
          arabic_city?: string | null
          arabic_company_name?: string | null
          border_style?: string
          business_type?: string | null
          city_optional?: string | null
          company_name: string
          country_optional?: string | null
          created_at?: string
          density?: number
          email_optional?: string | null
          icon_style?: string
          id?: string
          language_mode?: string
          language_reversed?: boolean | null
          layout_json?: Json | null
          location_text_mode?: string | null
          monogram_text?: string | null
          phone_optional?: string | null
          project_name?: string
          registration_number_optional?: string | null
          selected_design_id?: string | null
          show_license_number?: boolean | null
          show_location?: boolean | null
          stamp_type?: string
          style_theme?: string
          trade_name_optional?: string | null
          typography_style?: string
          updated_at?: string
          uploaded_logo_url?: string | null
          user_id: string
          website_optional?: string | null
        }
        Update: {
          address_optional?: string | null
          approval_status?: string
          arabic_city?: string | null
          arabic_company_name?: string | null
          border_style?: string
          business_type?: string | null
          city_optional?: string | null
          company_name?: string
          country_optional?: string | null
          created_at?: string
          density?: number
          email_optional?: string | null
          icon_style?: string
          id?: string
          language_mode?: string
          language_reversed?: boolean | null
          layout_json?: Json | null
          location_text_mode?: string | null
          monogram_text?: string | null
          phone_optional?: string | null
          project_name?: string
          registration_number_optional?: string | null
          selected_design_id?: string | null
          show_license_number?: boolean | null
          show_location?: boolean | null
          stamp_type?: string
          style_theme?: string
          trade_name_optional?: string | null
          typography_style?: string
          updated_at?: string
          uploaded_logo_url?: string | null
          user_id?: string
          website_optional?: string | null
        }
        Relationships: []
      }
      studio_ai_sessions: {
        Row: {
          brand_strictness: string | null
          created_at: string
          creativity_level: string | null
          generated_captions: Json | null
          generated_overlays: Json | null
          id: string
          media_context: Json | null
          project_id: string
          prompt: string
          property_context: Json | null
          status: string | null
          storyboard: Json | null
          suggested_clips: Json | null
          target_audience: string | null
        }
        Insert: {
          brand_strictness?: string | null
          created_at?: string
          creativity_level?: string | null
          generated_captions?: Json | null
          generated_overlays?: Json | null
          id?: string
          media_context?: Json | null
          project_id: string
          prompt: string
          property_context?: Json | null
          status?: string | null
          storyboard?: Json | null
          suggested_clips?: Json | null
          target_audience?: string | null
        }
        Update: {
          brand_strictness?: string | null
          created_at?: string
          creativity_level?: string | null
          generated_captions?: Json | null
          generated_overlays?: Json | null
          id?: string
          media_context?: Json | null
          project_id?: string
          prompt?: string
          property_context?: Json | null
          status?: string | null
          storyboard?: Json | null
          suggested_clips?: Json | null
          target_audience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_ai_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_captions: {
        Row: {
          confidence: number | null
          created_at: string
          custom_style: Json | null
          end_time_ms: number
          id: string
          original_language: string | null
          original_text: string
          project_id: string
          source: string | null
          start_time_ms: number
          style_preset: string | null
          translations: Json | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          custom_style?: Json | null
          end_time_ms: number
          id?: string
          original_language?: string | null
          original_text: string
          project_id: string
          source?: string | null
          start_time_ms: number
          style_preset?: string | null
          translations?: Json | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          custom_style?: Json | null
          end_time_ms?: number
          id?: string
          original_language?: string | null
          original_text?: string
          project_id?: string
          source?: string | null
          start_time_ms?: number
          style_preset?: string | null
          translations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_captions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_exports: {
        Row: {
          created_at: string
          expires_at: string | null
          export_type: string
          file_path: string | null
          file_size_bytes: number | null
          format: string
          id: string
          job_id: string | null
          pack_contents: Json | null
          preset: string | null
          project_id: string
          resolution: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          export_type: string
          file_path?: string | null
          file_size_bytes?: number | null
          format: string
          id?: string
          job_id?: string | null
          pack_contents?: Json | null
          preset?: string | null
          project_id: string
          resolution?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          export_type?: string
          file_path?: string | null
          file_size_bytes?: number | null
          format?: string
          id?: string
          job_id?: string | null
          pack_contents?: Json | null
          preset?: string | null
          project_id?: string
          resolution?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_exports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "studio_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_exports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          input_data: Json
          job_type: string
          max_retries: number | null
          output_asset_ids: string[] | null
          output_data: Json | null
          priority: number | null
          progress: number | null
          progress_message: string | null
          project_id: string | null
          retry_count: number | null
          session_id: string | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
          worker_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json
          job_type: string
          max_retries?: number | null
          output_asset_ids?: string[] | null
          output_data?: Json | null
          priority?: number | null
          progress?: number | null
          progress_message?: string | null
          project_id?: string | null
          retry_count?: number | null
          session_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          worker_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json
          job_type?: string
          max_retries?: number | null
          output_asset_ids?: string[] | null
          output_data?: Json | null
          priority?: number | null
          progress?: number | null
          progress_message?: string | null
          project_id?: string | null
          retry_count?: number | null
          session_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          worker_id?: string | null
        }
        Relationships: []
      }
      studio_project_assets: {
        Row: {
          asset_category: string | null
          asset_type: string
          created_at: string
          duration_ms: number | null
          expires_at: string | null
          export_platform: string | null
          export_preset: string | null
          file_size_bytes: number | null
          height: number | null
          id: string
          is_temporary: boolean | null
          mime_type: string | null
          name: string
          processing_job_id: string | null
          processing_status: string | null
          project_id: string
          source_property_id: string | null
          source_type: string | null
          storage_bucket: string | null
          storage_path: string
          thumbnail_path: string | null
          width: number | null
        }
        Insert: {
          asset_category?: string | null
          asset_type: string
          created_at?: string
          duration_ms?: number | null
          expires_at?: string | null
          export_platform?: string | null
          export_preset?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          is_temporary?: boolean | null
          mime_type?: string | null
          name: string
          processing_job_id?: string | null
          processing_status?: string | null
          project_id: string
          source_property_id?: string | null
          source_type?: string | null
          storage_bucket?: string | null
          storage_path: string
          thumbnail_path?: string | null
          width?: number | null
        }
        Update: {
          asset_category?: string | null
          asset_type?: string
          created_at?: string
          duration_ms?: number | null
          expires_at?: string | null
          export_platform?: string | null
          export_preset?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          is_temporary?: boolean | null
          mime_type?: string | null
          name?: string
          processing_job_id?: string | null
          processing_status?: string | null
          project_id?: string
          source_property_id?: string | null
          source_type?: string | null
          storage_bucket?: string | null
          storage_path?: string
          thumbnail_path?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_project_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_projects: {
        Row: {
          ai_prompts_history: Json | null
          ai_settings: Json | null
          autosave_version: number | null
          brand_strictness: string | null
          canvas_settings: Json | null
          created_at: string
          creativity_level: string | null
          description: string | null
          id: string
          is_shared: boolean | null
          last_autosave_at: string | null
          last_edited_at: string | null
          linked_property_id: string | null
          name: string
          project_type: string | null
          property_id: string | null
          property_snapshot: Json | null
          session_id: string | null
          share_mode: string | null
          share_token: string | null
          status: string
          tags: string[] | null
          target_audience: string | null
          thumbnail_url: string | null
          timeline_state: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_prompts_history?: Json | null
          ai_settings?: Json | null
          autosave_version?: number | null
          brand_strictness?: string | null
          canvas_settings?: Json | null
          created_at?: string
          creativity_level?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean | null
          last_autosave_at?: string | null
          last_edited_at?: string | null
          linked_property_id?: string | null
          name?: string
          project_type?: string | null
          property_id?: string | null
          property_snapshot?: Json | null
          session_id?: string | null
          share_mode?: string | null
          share_token?: string | null
          status?: string
          tags?: string[] | null
          target_audience?: string | null
          thumbnail_url?: string | null
          timeline_state?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_prompts_history?: Json | null
          ai_settings?: Json | null
          autosave_version?: number | null
          brand_strictness?: string | null
          canvas_settings?: Json | null
          created_at?: string
          creativity_level?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean | null
          last_autosave_at?: string | null
          last_edited_at?: string | null
          linked_property_id?: string | null
          name?: string
          project_type?: string | null
          property_id?: string | null
          property_snapshot?: Json | null
          session_id?: string | null
          share_mode?: string | null
          share_token?: string | null
          status?: string
          tags?: string[] | null
          target_audience?: string | null
          thumbnail_url?: string | null
          timeline_state?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      studio_publish_presets: {
        Row: {
          caption_template: string | null
          contact_info: Json | null
          created_at: string
          cta_text: string | null
          hashtag_sets: Json | null
          id: string
          is_default: boolean | null
          name: string
          platform: string | null
          tone: string | null
          user_id: string
        }
        Insert: {
          caption_template?: string | null
          contact_info?: Json | null
          created_at?: string
          cta_text?: string | null
          hashtag_sets?: Json | null
          id?: string
          is_default?: boolean | null
          name: string
          platform?: string | null
          tone?: string | null
          user_id: string
        }
        Update: {
          caption_template?: string | null
          contact_info?: Json | null
          created_at?: string
          cta_text?: string | null
          hashtag_sets?: Json | null
          id?: string
          is_default?: boolean | null
          name?: string
          platform?: string | null
          tone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      studio_publish_queue: {
        Row: {
          caption: string | null
          created_at: string
          error_message: string | null
          export_id: string | null
          hashtags: string[] | null
          id: string
          platform: string
          platform_post_id: string | null
          platform_url: string | null
          post_type: string
          project_id: string | null
          published_at: string | null
          scheduled_at: string | null
          social_account_id: string | null
          status: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          error_message?: string | null
          export_id?: string | null
          hashtags?: string[] | null
          id?: string
          platform: string
          platform_post_id?: string | null
          platform_url?: string | null
          post_type: string
          project_id?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          social_account_id?: string | null
          status?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          error_message?: string | null
          export_id?: string | null
          hashtags?: string[] | null
          id?: string
          platform?: string
          platform_post_id?: string | null
          platform_url?: string | null
          post_type?: string
          project_id?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          social_account_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_publish_queue_export_id_fkey"
            columns: ["export_id"]
            isOneToOne: false
            referencedRelation: "studio_exports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_publish_queue_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_publish_queue_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "studio_social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_scheduled_posts: {
        Row: {
          caption: string | null
          content_url: string | null
          created_at: string | null
          error_message: string | null
          hashtags: string[] | null
          id: string
          platform: string
          platform_post_id: string | null
          post_type: string
          posted_at: string | null
          project_id: string | null
          scheduled_for: string
          status: string | null
          timezone: string | null
          user_id: string | null
        }
        Insert: {
          caption?: string | null
          content_url?: string | null
          created_at?: string | null
          error_message?: string | null
          hashtags?: string[] | null
          id?: string
          platform: string
          platform_post_id?: string | null
          post_type: string
          posted_at?: string | null
          project_id?: string | null
          scheduled_for: string
          status?: string | null
          timezone?: string | null
          user_id?: string | null
        }
        Update: {
          caption?: string | null
          content_url?: string | null
          created_at?: string | null
          error_message?: string | null
          hashtags?: string[] | null
          id?: string
          platform?: string
          platform_post_id?: string | null
          post_type?: string
          posted_at?: string | null
          project_id?: string | null
          scheduled_for?: string
          status?: string | null
          timezone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_scheduled_posts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_social_accounts: {
        Row: {
          access_token_encrypted: string | null
          account_id: string | null
          account_name: string | null
          created_at: string
          id: string
          is_connected: boolean | null
          last_used_at: string | null
          platform: string
          refresh_token_encrypted: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_used_at?: string | null
          platform: string
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_used_at?: string | null
          platform?: string
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      studio_stock_library: {
        Row: {
          asset_type: string
          attribution: string | null
          category: string | null
          created_at: string
          description: string | null
          duration_ms: number | null
          file_path: string
          id: string
          is_trending: boolean | null
          license: string | null
          name: string
          platforms: string[] | null
          preview_path: string | null
          tags: string[] | null
          thumbnail_path: string | null
          trend_score: number | null
          usage_count: number | null
        }
        Insert: {
          asset_type: string
          attribution?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration_ms?: number | null
          file_path: string
          id?: string
          is_trending?: boolean | null
          license?: string | null
          name: string
          platforms?: string[] | null
          preview_path?: string | null
          tags?: string[] | null
          thumbnail_path?: string | null
          trend_score?: number | null
          usage_count?: number | null
        }
        Update: {
          asset_type?: string
          attribution?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration_ms?: number | null
          file_path?: string
          id?: string
          is_trending?: boolean | null
          license?: string | null
          name?: string
          platforms?: string[] | null
          preview_path?: string | null
          tags?: string[] | null
          thumbnail_path?: string | null
          trend_score?: number | null
          usage_count?: number | null
        }
        Relationships: []
      }
      studio_timeline_clips: {
        Row: {
          asset_id: string | null
          caption_style: Json | null
          caption_text: string | null
          created_at: string
          duration_ms: number | null
          effects: Json | null
          end_time_ms: number
          id: string
          keyframes: Json | null
          media_end_ms: number | null
          media_start_ms: number | null
          opacity: number | null
          overlay_data: Json | null
          playback_speed: number | null
          position_x: number | null
          position_y: number | null
          project_id: string
          rotation: number | null
          scale: number | null
          start_time_ms: number
          track_index: number
          track_type: string
          transitions: Json | null
          updated_at: string
        }
        Insert: {
          asset_id?: string | null
          caption_style?: Json | null
          caption_text?: string | null
          created_at?: string
          duration_ms?: number | null
          effects?: Json | null
          end_time_ms: number
          id?: string
          keyframes?: Json | null
          media_end_ms?: number | null
          media_start_ms?: number | null
          opacity?: number | null
          overlay_data?: Json | null
          playback_speed?: number | null
          position_x?: number | null
          position_y?: number | null
          project_id: string
          rotation?: number | null
          scale?: number | null
          start_time_ms?: number
          track_index?: number
          track_type: string
          transitions?: Json | null
          updated_at?: string
        }
        Update: {
          asset_id?: string | null
          caption_style?: Json | null
          caption_text?: string | null
          created_at?: string
          duration_ms?: number | null
          effects?: Json | null
          end_time_ms?: number
          id?: string
          keyframes?: Json | null
          media_end_ms?: number | null
          media_start_ms?: number | null
          opacity?: number | null
          overlay_data?: Json | null
          playback_speed?: number | null
          position_x?: number | null
          position_y?: number | null
          project_id?: string
          rotation?: number | null
          scale?: number | null
          start_time_ms?: number
          track_index?: number
          track_type?: string
          transitions?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_timeline_clips_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "studio_project_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_timeline_clips_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_trending_audio: {
        Row: {
          audio_artist: string | null
          audio_title: string
          audio_url: string | null
          category: string | null
          expires_at: string | null
          fetched_at: string | null
          id: string
          metadata: Json | null
          platform: string
          preview_url: string | null
          region: string | null
          trend_score: number | null
          usage_count: number | null
        }
        Insert: {
          audio_artist?: string | null
          audio_title: string
          audio_url?: string | null
          category?: string | null
          expires_at?: string | null
          fetched_at?: string | null
          id?: string
          metadata?: Json | null
          platform: string
          preview_url?: string | null
          region?: string | null
          trend_score?: number | null
          usage_count?: number | null
        }
        Update: {
          audio_artist?: string | null
          audio_title?: string
          audio_url?: string | null
          category?: string | null
          expires_at?: string | null
          fetched_at?: string | null
          id?: string
          metadata?: Json | null
          platform?: string
          preview_url?: string | null
          region?: string | null
          trend_score?: number | null
          usage_count?: number | null
        }
        Relationships: []
      }
      subscription_tiers: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          features: Json | null
          id: string
          is_popular: boolean | null
          name: string
          price_aed: number
          price_usd: number
          tool_access: Json | null
          updated_at: string | null
          yearly_price_aed: number
          yearly_price_usd: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id: string
          is_popular?: boolean | null
          name: string
          price_aed?: number
          price_usd?: number
          tool_access?: Json | null
          updated_at?: string | null
          yearly_price_aed?: number
          yearly_price_usd?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          is_popular?: boolean | null
          name?: string
          price_aed?: number
          price_usd?: number
          tool_access?: Json | null
          updated_at?: string | null
          yearly_price_aed?: number
          yearly_price_usd?: number
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          attachment_urls: string[] | null
          created_at: string
          email_opened_at: string | null
          email_sent_at: string | null
          email_status: string | null
          id: string
          message: string
          sender_type: string
          sender_user_id: string | null
          ticket_id: string
        }
        Insert: {
          attachment_urls?: string[] | null
          created_at?: string
          email_opened_at?: string | null
          email_sent_at?: string | null
          email_status?: string | null
          id?: string
          message: string
          sender_type: string
          sender_user_id?: string | null
          ticket_id: string
        }
        Update: {
          attachment_urls?: string[] | null
          created_at?: string
          email_opened_at?: string | null
          email_sent_at?: string | null
          email_status?: string | null
          id?: string
          message?: string
          sender_type?: string
          sender_user_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          ai_analyzed_priority: string | null
          assigned_to: string | null
          attachment_urls: string[] | null
          created_at: string
          customer_confirmation_error: string | null
          customer_confirmation_message_id: string | null
          customer_confirmation_sent_at: string | null
          customer_confirmation_status: string | null
          description: string
          email: string
          escalate_to_tech: boolean | null
          full_name: string
          id: string
          internal_notes: string | null
          is_reopened: boolean | null
          phone: string | null
          priority: string | null
          reopen_count: number | null
          reopen_token: string | null
          reopened_at: string | null
          resolved_at: string | null
          service_category: string
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string | null
          user_selected_priority: string | null
        }
        Insert: {
          ai_analyzed_priority?: string | null
          assigned_to?: string | null
          attachment_urls?: string[] | null
          created_at?: string
          customer_confirmation_error?: string | null
          customer_confirmation_message_id?: string | null
          customer_confirmation_sent_at?: string | null
          customer_confirmation_status?: string | null
          description: string
          email: string
          escalate_to_tech?: boolean | null
          full_name: string
          id?: string
          internal_notes?: string | null
          is_reopened?: boolean | null
          phone?: string | null
          priority?: string | null
          reopen_count?: number | null
          reopen_token?: string | null
          reopened_at?: string | null
          resolved_at?: string | null
          service_category: string
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
          user_id?: string | null
          user_selected_priority?: string | null
        }
        Update: {
          ai_analyzed_priority?: string | null
          assigned_to?: string | null
          attachment_urls?: string[] | null
          created_at?: string
          customer_confirmation_error?: string | null
          customer_confirmation_message_id?: string | null
          customer_confirmation_sent_at?: string | null
          customer_confirmation_status?: string | null
          description?: string
          email?: string
          escalate_to_tech?: boolean | null
          full_name?: string
          id?: string
          internal_notes?: string | null
          is_reopened?: boolean | null
          phone?: string | null
          priority?: string | null
          reopen_count?: number | null
          reopen_token?: string | null
          reopened_at?: string | null
          resolved_at?: string | null
          service_category?: string
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string | null
          user_selected_priority?: string | null
        }
        Relationships: []
      }
      sync_job_pages: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          job_id: string
          page_number: number
          processed_at: string | null
          stats_created: number | null
          stats_extracted: number | null
          stats_images: number | null
          stats_skipped: number | null
          stats_updated: number | null
          status: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_id: string
          page_number: number
          processed_at?: string | null
          stats_created?: number | null
          stats_extracted?: number | null
          stats_images?: number | null
          stats_skipped?: number | null
          stats_updated?: number | null
          status?: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_id?: string
          page_number?: number
          processed_at?: string | null
          stats_created?: number | null
          stats_extracted?: number | null
          stats_images?: number | null
          stats_skipped?: number | null
          stats_updated?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_job_pages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "sync_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_jobs: {
        Row: {
          batch_size: number | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          current_page: number
          error_log: Json | null
          id: string
          job_type: string
          last_cursor: string | null
          max_duration_ms: number | null
          next_cursor: string | null
          paused_at: string | null
          processed_records: number | null
          source: string | null
          started_at: string | null
          stats_created: number | null
          stats_errors: number | null
          stats_extracted: number | null
          stats_images: number | null
          stats_skipped: number | null
          stats_updated: number | null
          status: string
          total_pages: number
          total_records: number | null
          updated_at: string | null
        }
        Insert: {
          batch_size?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          current_page?: number
          error_log?: Json | null
          id?: string
          job_type?: string
          last_cursor?: string | null
          max_duration_ms?: number | null
          next_cursor?: string | null
          paused_at?: string | null
          processed_records?: number | null
          source?: string | null
          started_at?: string | null
          stats_created?: number | null
          stats_errors?: number | null
          stats_extracted?: number | null
          stats_images?: number | null
          stats_skipped?: number | null
          stats_updated?: number | null
          status?: string
          total_pages?: number
          total_records?: number | null
          updated_at?: string | null
        }
        Update: {
          batch_size?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          current_page?: number
          error_log?: Json | null
          id?: string
          job_type?: string
          last_cursor?: string | null
          max_duration_ms?: number | null
          next_cursor?: string | null
          paused_at?: string | null
          processed_records?: number | null
          source?: string | null
          started_at?: string | null
          stats_created?: number | null
          stats_errors?: number | null
          stats_extracted?: number | null
          stats_images?: number | null
          stats_skipped?: number | null
          stats_updated?: number | null
          status?: string
          total_pages?: number
          total_records?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
      test_attempts: {
        Row: {
          answers_given: Json | null
          attempt_number: number
          completed_at: string | null
          id: string
          module_id: string
          passed: boolean | null
          questions_shown: string[] | null
          score_percent: number | null
          show_answers: boolean | null
          user_id: string
        }
        Insert: {
          answers_given?: Json | null
          attempt_number?: number
          completed_at?: string | null
          id?: string
          module_id: string
          passed?: boolean | null
          questions_shown?: string[] | null
          score_percent?: number | null
          show_answers?: boolean | null
          user_id: string
        }
        Update: {
          answers_given?: Json | null
          attempt_number?: number
          completed_at?: string | null
          id?: string
          module_id?: string
          passed?: boolean | null
          questions_shown?: string[] | null
          score_percent?: number | null
          show_answers?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "broker_education_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_surveys: {
        Row: {
          created_at: string
          ease_of_submission: number
          email: string
          full_name: string
          id: string
          overall_rating: number
          phone: string | null
          points_awarded: number
          resolution_quality: number
          response_speed: number
          suggestions: string | null
          ticket_id: string | null
          ticket_number: string
          user_id: string | null
          website_smartness: number
          would_recommend: boolean
        }
        Insert: {
          created_at?: string
          ease_of_submission: number
          email: string
          full_name: string
          id?: string
          overall_rating: number
          phone?: string | null
          points_awarded?: number
          resolution_quality: number
          response_speed: number
          suggestions?: string | null
          ticket_id?: string | null
          ticket_number: string
          user_id?: string | null
          website_smartness: number
          would_recommend?: boolean
        }
        Update: {
          created_at?: string
          ease_of_submission?: number
          email?: string
          full_name?: string
          id?: string
          overall_rating?: number
          phone?: string | null
          points_awarded?: number
          resolution_quality?: number
          response_speed?: number
          suggestions?: string | null
          ticket_id?: string | null
          ticket_number?: string
          user_id?: string | null
          website_smartness?: number
          would_recommend?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ticket_surveys_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_definitions: {
        Row: {
          badge_color: string | null
          benefits: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          max_points: number | null
          min_points: number
          tier_name: string
          tier_order: number
          tier_type: string
          updated_at: string
        }
        Insert: {
          badge_color?: string | null
          benefits?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_points?: number | null
          min_points?: number
          tier_name: string
          tier_order: number
          tier_type: string
          updated_at?: string
        }
        Update: {
          badge_color?: string | null
          benefits?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_points?: number | null
          min_points?: number
          tier_name?: string
          tier_order?: number
          tier_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      toolkit_jobs: {
        Row: {
          created_at: string
          error_message: string | null
          expires_at: string
          id: string
          input_files: Json
          job_type: string
          output_files: Json | null
          progress: number | null
          session_id: string | null
          settings: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          expires_at?: string
          id?: string
          input_files?: Json
          job_type: string
          output_files?: Json | null
          progress?: number | null
          session_id?: string | null
          settings?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          expires_at?: string
          id?: string
          input_files?: Json
          job_type?: string
          output_files?: Json | null
          progress?: number | null
          session_id?: string | null
          settings?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      toolkit_temp_files: {
        Row: {
          created_at: string
          expires_at: string
          file_path: string
          file_size_bytes: number | null
          file_type: string
          id: string
          job_id: string | null
          original_name: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          file_path: string
          file_size_bytes?: number | null
          file_type: string
          id?: string
          job_id?: string | null
          original_name?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          file_path?: string
          file_size_bytes?: number | null
          file_type?: string
          id?: string
          job_id?: string | null
          original_name?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "toolkit_temp_files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "toolkit_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_completions: {
        Row: {
          completed_at: string
          created_at: string
          evidence_json: Json | null
          id: string
          module_id: string
          points_awarded: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          evidence_json?: Json | null
          id?: string
          module_id: string
          points_awarded?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          evidence_json?: Json | null
          id?: string
          module_id?: string
          points_awarded?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_completions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      training_modules: {
        Row: {
          created_at: string
          description: string | null
          estimated_minutes: number | null
          id: string
          is_active: boolean | null
          learning_path: string | null
          module_order: number
          points_awarded: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean | null
          learning_path?: string | null
          module_order?: number
          points_awarded?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean | null
          learning_path?: string | null
          module_order?: number
          points_awarded?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      translation_cache: {
        Row: {
          created_at: string
          id: string
          source_text: string
          target_lang: string
          translated_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          source_text: string
          target_lang: string
          translated_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          source_text?: string
          target_lang?: string
          translated_text?: string
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
          feature_image_url: string | null
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
          feature_image_url?: string | null
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
          feature_image_url?: string | null
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
      user_activity_log: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          device_info: string | null
          event_type: string | null
          id: string
          lead_email: string | null
          page_path: string | null
          session_id: string | null
          tool_name: string | null
          user_id: string | null
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          device_info?: string | null
          event_type?: string | null
          id?: string
          lead_email?: string | null
          page_path?: string | null
          session_id?: string | null
          tool_name?: string | null
          user_id?: string | null
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          device_info?: string | null
          event_type?: string | null
          id?: string
          lead_email?: string | null
          page_path?: string | null
          session_id?: string | null
          tool_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_activity_sessions: {
        Row: {
          actions_performed: number | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          ip_hash: string | null
          pages_visited: number | null
          session_end: string | null
          session_start: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          actions_performed?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          ip_hash?: string | null
          pages_visited?: number | null
          session_end?: string | null
          session_start?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          actions_performed?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          ip_hash?: string | null
          pages_visited?: number | null
          session_end?: string | null
          session_start?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_agreements: {
        Row: {
          accepted_at: string
          agreement_snapshot: Json
          agreement_type: string
          agreement_version: string
          consent_details: Json | null
          created_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          agreement_snapshot: Json
          agreement_type: string
          agreement_version?: string
          consent_details?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          agreement_snapshot?: Json
          agreement_type?: string
          agreement_version?: string
          consent_details?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_behavior_tracking: {
        Row: {
          action_target: string | null
          action_type: string
          browser: string | null
          building_name: string | null
          city: string | null
          click_count: number | null
          country: string | null
          created_at: string
          device_type: string | null
          element_class: string | null
          element_id: string | null
          element_text: string | null
          exact_location: Json | null
          id: string
          ip_address: string | null
          language_changes: Json | null
          language_used: string | null
          metadata: Json | null
          nationality: string | null
          os: string | null
          page_title: string | null
          page_url: string | null
          referrer: string | null
          screen_resolution: string | null
          scroll_depth: number | null
          session_id: string
          time_spent_seconds: number | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          action_target?: string | null
          action_type: string
          browser?: string | null
          building_name?: string | null
          city?: string | null
          click_count?: number | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          element_class?: string | null
          element_id?: string | null
          element_text?: string | null
          exact_location?: Json | null
          id?: string
          ip_address?: string | null
          language_changes?: Json | null
          language_used?: string | null
          metadata?: Json | null
          nationality?: string | null
          os?: string | null
          page_title?: string | null
          page_url?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          scroll_depth?: number | null
          session_id: string
          time_spent_seconds?: number | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          action_target?: string | null
          action_type?: string
          browser?: string | null
          building_name?: string | null
          city?: string | null
          click_count?: number | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          element_class?: string | null
          element_id?: string | null
          element_text?: string | null
          exact_location?: Json | null
          id?: string
          ip_address?: string | null
          language_changes?: Json | null
          language_used?: string | null
          metadata?: Json | null
          nationality?: string | null
          os?: string | null
          page_title?: string | null
          page_url?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          scroll_depth?: number | null
          session_id?: string
          time_spent_seconds?: number | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      user_certification_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          phase_id: string
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          phase_id: string
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          phase_id?: string
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_certification_progress_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "certification_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_chat_logs: {
        Row: {
          chat_type: string | null
          created_at: string
          id: string
          messages: Json[] | null
          session_id: string | null
          tool_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_type?: string | null
          created_at?: string
          id?: string
          messages?: Json[] | null
          session_id?: string | null
          tool_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_type?: string | null
          created_at?: string
          id?: string
          messages?: Json[] | null
          session_id?: string | null
          tool_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_color_palettes: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          palette: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          palette: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          palette?: Json
          user_id?: string
        }
        Relationships: []
      }
      user_daily_activity: {
        Row: {
          created_at: string
          day_date: string
          first_seen_at: string | null
          id: string
          last_seen_at: string | null
          points_earned: number | null
          sessions_count: number | null
          streak_day_number: number | null
          total_duration_seconds: number | null
          total_events: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_date: string
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          points_earned?: number | null
          sessions_count?: number | null
          streak_day_number?: number | null
          total_duration_seconds?: number | null
          total_events?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_date?: string
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          points_earned?: number | null
          sessions_count?: number | null
          streak_day_number?: number | null
          total_duration_seconds?: number | null
          total_events?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_downloads: {
        Row: {
          created_at: string
          download_source: string | null
          download_type: string
          file_name: string
          file_size_bytes: number | null
          file_url: string | null
          id: string
          ip_address: string | null
          is_user_generated: boolean | null
          metadata: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          download_source?: string | null
          download_type: string
          file_name: string
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          ip_address?: string | null
          is_user_generated?: boolean | null
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          download_source?: string | null
          download_type?: string
          file_name?: string
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          ip_address?: string | null
          is_user_generated?: boolean | null
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_events: {
        Row: {
          created_at: string
          element_id: string | null
          event_name: string
          event_time: string
          id: string
          metadata: Json | null
          page_path: string | null
          points_awarded: number | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          element_id?: string | null
          event_name: string
          event_time?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          points_awarded?: number | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          element_id?: string | null
          event_name?: string
          event_time?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          points_awarded?: number | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          action_ref_id: string | null
          action_type: string
          created_at: string
          feedback_text: string | null
          id: string
          rating: number
          user_id: string | null
        }
        Insert: {
          action_ref_id?: string | null
          action_type: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          rating: number
          user_id?: string | null
        }
        Update: {
          action_ref_id?: string | null
          action_type?: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          rating?: number
          user_id?: string | null
        }
        Relationships: []
      }
      user_interest_profile: {
        Row: {
          age_range: string | null
          avg_budget_estimate: number | null
          city: string | null
          compares_count_30d: number | null
          confidence_score: number | null
          contact_clicks_30d: number | null
          conversion_probability: number | null
          country: string | null
          created_at: string
          current_streak: number | null
          device_mix: Json | null
          engagement_score: number | null
          estimated_ticket_aed: number | null
          feature_diversity: number | null
          id: string
          intent_score: number | null
          last_active_at: string | null
          last_updated_at: string | null
          lead_count_30d: number | null
          login_history: Json | null
          longest_streak: number | null
          nationality: string | null
          page_time_breakdown: Json | null
          preferred_areas: string[] | null
          preferred_bedrooms: number[] | null
          preferred_language: string | null
          preferred_property_types: string[] | null
          revenue_potential: number | null
          saves_count_30d: number | null
          searches_30d: number | null
          sessions_last_7d: number | null
          time_to_conversion_days: number | null
          tools_used: string[] | null
          top_pages: string[] | null
          total_points: number | null
          total_sessions: number | null
          total_time_seconds: number | null
          user_id: string
          vip_override: boolean | null
          vip_override_by: string | null
          vip_tier: string | null
          vip_tier_reason: string | null
        }
        Insert: {
          age_range?: string | null
          avg_budget_estimate?: number | null
          city?: string | null
          compares_count_30d?: number | null
          confidence_score?: number | null
          contact_clicks_30d?: number | null
          conversion_probability?: number | null
          country?: string | null
          created_at?: string
          current_streak?: number | null
          device_mix?: Json | null
          engagement_score?: number | null
          estimated_ticket_aed?: number | null
          feature_diversity?: number | null
          id?: string
          intent_score?: number | null
          last_active_at?: string | null
          last_updated_at?: string | null
          lead_count_30d?: number | null
          login_history?: Json | null
          longest_streak?: number | null
          nationality?: string | null
          page_time_breakdown?: Json | null
          preferred_areas?: string[] | null
          preferred_bedrooms?: number[] | null
          preferred_language?: string | null
          preferred_property_types?: string[] | null
          revenue_potential?: number | null
          saves_count_30d?: number | null
          searches_30d?: number | null
          sessions_last_7d?: number | null
          time_to_conversion_days?: number | null
          tools_used?: string[] | null
          top_pages?: string[] | null
          total_points?: number | null
          total_sessions?: number | null
          total_time_seconds?: number | null
          user_id: string
          vip_override?: boolean | null
          vip_override_by?: string | null
          vip_tier?: string | null
          vip_tier_reason?: string | null
        }
        Update: {
          age_range?: string | null
          avg_budget_estimate?: number | null
          city?: string | null
          compares_count_30d?: number | null
          confidence_score?: number | null
          contact_clicks_30d?: number | null
          conversion_probability?: number | null
          country?: string | null
          created_at?: string
          current_streak?: number | null
          device_mix?: Json | null
          engagement_score?: number | null
          estimated_ticket_aed?: number | null
          feature_diversity?: number | null
          id?: string
          intent_score?: number | null
          last_active_at?: string | null
          last_updated_at?: string | null
          lead_count_30d?: number | null
          login_history?: Json | null
          longest_streak?: number | null
          nationality?: string | null
          page_time_breakdown?: Json | null
          preferred_areas?: string[] | null
          preferred_bedrooms?: number[] | null
          preferred_language?: string | null
          preferred_property_types?: string[] | null
          revenue_potential?: number | null
          saves_count_30d?: number | null
          searches_30d?: number | null
          sessions_last_7d?: number | null
          time_to_conversion_days?: number | null
          tools_used?: string[] | null
          top_pages?: string[] | null
          total_points?: number | null
          total_sessions?: number | null
          total_time_seconds?: number | null
          user_id?: string
          vip_override?: boolean | null
          vip_override_by?: string | null
          vip_tier?: string | null
          vip_tier_reason?: string | null
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
      user_listing_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          listing_id: string | null
          message: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          listing_id?: string | null
          message?: string | null
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          listing_id?: string | null
          message?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_listing_notifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "portal_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_points_ledger: {
        Row: {
          created_at: string
          daily_total: number | null
          event_id: string | null
          id: string
          points: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_total?: number | null
          event_id?: string | null
          id?: string
          points?: number
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_total?: number | null
          event_id?: string | null
          id?: string
          points?: number
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          browser_notifications: boolean | null
          created_at: string
          dashboard_config: Json | null
          email_notifications: boolean | null
          first_deal_unlocked: boolean | null
          first_deal_unlocked_at: string | null
          id: string
          marketing_opt_in: boolean | null
          notification_frequency: string | null
          preferred_books_language: string | null
          preferred_language: string | null
          push_notifications: boolean | null
          selected_mode: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          browser_notifications?: boolean | null
          created_at?: string
          dashboard_config?: Json | null
          email_notifications?: boolean | null
          first_deal_unlocked?: boolean | null
          first_deal_unlocked_at?: string | null
          id?: string
          marketing_opt_in?: boolean | null
          notification_frequency?: string | null
          preferred_books_language?: string | null
          preferred_language?: string | null
          push_notifications?: boolean | null
          selected_mode?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          browser_notifications?: boolean | null
          created_at?: string
          dashboard_config?: Json | null
          email_notifications?: boolean | null
          first_deal_unlocked?: boolean | null
          first_deal_unlocked_at?: string | null
          id?: string
          marketing_opt_in?: boolean | null
          notification_frequency?: string | null
          preferred_books_language?: string | null
          preferred_language?: string | null
          push_notifications?: boolean | null
          selected_mode?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_productivity_scores: {
        Row: {
          calls_made: number | null
          created_at: string | null
          emails_sent: number | null
          id: string
          leads_contacted: number | null
          login_count: number | null
          productivity_score: number | null
          score_date: string
          tasks_completed: number | null
          total_hours: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calls_made?: number | null
          created_at?: string | null
          emails_sent?: number | null
          id?: string
          leads_contacted?: number | null
          login_count?: number | null
          productivity_score?: number | null
          score_date?: string
          tasks_completed?: number | null
          total_hours?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calls_made?: number | null
          created_at?: string | null
          emails_sent?: number | null
          id?: string
          leads_contacted?: number | null
          login_count?: number | null
          productivity_score?: number | null
          score_date?: string
          tasks_completed?: number | null
          total_hours?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profile_summaries: {
        Row: {
          ai_summary: string | null
          avg_budget_estimate: string | null
          avg_time_on_site: number | null
          device_type: string | null
          email: string
          engagement_score: number | null
          full_name: string | null
          id: string
          inquiries_count: number | null
          intent_score: string | null
          last_active_at: string | null
          phone: string | null
          preference_tags: Json | null
          preferred_bedrooms: string | null
          preferred_property_type: string | null
          recommended_campaign_tag: string | null
          saved_count: number | null
          segment_tag: string | null
          sessions_count: number | null
          subscribed: boolean | null
          subscribed_at: string | null
          tools_used: string | null
          top_areas: string | null
          top_projects: string | null
          updated_at: string | null
          user_id: string | null
          viewed_count: number | null
        }
        Insert: {
          ai_summary?: string | null
          avg_budget_estimate?: string | null
          avg_time_on_site?: number | null
          device_type?: string | null
          email: string
          engagement_score?: number | null
          full_name?: string | null
          id?: string
          inquiries_count?: number | null
          intent_score?: string | null
          last_active_at?: string | null
          phone?: string | null
          preference_tags?: Json | null
          preferred_bedrooms?: string | null
          preferred_property_type?: string | null
          recommended_campaign_tag?: string | null
          saved_count?: number | null
          segment_tag?: string | null
          sessions_count?: number | null
          subscribed?: boolean | null
          subscribed_at?: string | null
          tools_used?: string | null
          top_areas?: string | null
          top_projects?: string | null
          updated_at?: string | null
          user_id?: string | null
          viewed_count?: number | null
        }
        Update: {
          ai_summary?: string | null
          avg_budget_estimate?: string | null
          avg_time_on_site?: number | null
          device_type?: string | null
          email?: string
          engagement_score?: number | null
          full_name?: string | null
          id?: string
          inquiries_count?: number | null
          intent_score?: string | null
          last_active_at?: string | null
          phone?: string | null
          preference_tags?: Json | null
          preferred_bedrooms?: string | null
          preferred_property_type?: string | null
          recommended_campaign_tag?: string | null
          saved_count?: number | null
          segment_tag?: string | null
          sessions_count?: number | null
          subscribed?: boolean | null
          subscribed_at?: string | null
          tools_used?: string | null
          top_areas?: string | null
          top_projects?: string | null
          updated_at?: string | null
          user_id?: string | null
          viewed_count?: number | null
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
      user_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          ip_hash: string | null
          is_authenticated: boolean | null
          os: string | null
          pages_visited: number | null
          referrer: string | null
          session_id: string
          started_at: string
          timezone: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          ip_hash?: string | null
          is_authenticated?: boolean | null
          os?: string | null
          pages_visited?: number | null
          referrer?: string | null
          session_id: string
          started_at?: string
          timezone?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          ip_hash?: string | null
          is_authenticated?: boolean | null
          os?: string | null
          pages_visited?: number | null
          referrer?: string | null
          session_id?: string
          started_at?: string
          timezone?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
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
      user_subscriptions: {
        Row: {
          billing_period: string
          created_at: string | null
          currency: string
          expires_at: string
          id: string
          started_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_period: string
          created_at?: string | null
          currency?: string
          expires_at: string
          id?: string
          started_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_period?: string
          created_at?: string | null
          currency?: string
          expires_at?: string
          id?: string
          started_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tier_history: {
        Row: {
          changed_at: string
          id: string
          new_tier: string
          old_tier: string | null
          points_at_change: number
          tier_type: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          id?: string
          new_tier: string
          old_tier?: string | null
          points_at_change: number
          tier_type: string
          user_id: string
        }
        Update: {
          changed_at?: string
          id?: string
          new_tier?: string
          old_tier?: string | null
          points_at_change?: number
          tier_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_uploads: {
        Row: {
          created_at: string
          file_mime_type: string | null
          file_name: string
          file_size_bytes: number | null
          file_url: string | null
          id: string
          is_processed: boolean | null
          metadata: Json | null
          session_id: string | null
          upload_source: string | null
          upload_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          file_mime_type?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          is_processed?: boolean | null
          metadata?: Json | null
          session_id?: string | null
          upload_source?: string | null
          upload_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          file_mime_type?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          is_processed?: boolean | null
          metadata?: Json | null
          session_id?: string | null
          upload_source?: string | null
          upload_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      vapi_call_logs: {
        Row: {
          access_count: number | null
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
          extracted_email_encrypted: string | null
          extracted_interest: string | null
          extracted_name_encrypted: string | null
          extracted_phone_encrypted: string | null
          flag_reason: string | null
          id: string
          is_flagged: boolean | null
          last_accessed_at: string | null
          last_accessed_by: string | null
          lead_id: string | null
          needs_review: boolean | null
          notes: string | null
          recording_url: string | null
          retention_expires_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          summary: string | null
          transcript_encrypted: string | null
          updated_at: string
        }
        Insert: {
          access_count?: number | null
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
          extracted_email_encrypted?: string | null
          extracted_interest?: string | null
          extracted_name_encrypted?: string | null
          extracted_phone_encrypted?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          last_accessed_at?: string | null
          last_accessed_by?: string | null
          lead_id?: string | null
          needs_review?: boolean | null
          notes?: string | null
          recording_url?: string | null
          retention_expires_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          summary?: string | null
          transcript_encrypted?: string | null
          updated_at?: string
        }
        Update: {
          access_count?: number | null
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
          extracted_email_encrypted?: string | null
          extracted_interest?: string | null
          extracted_name_encrypted?: string | null
          extracted_phone_encrypted?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          last_accessed_at?: string | null
          last_accessed_by?: string | null
          lead_id?: string | null
          needs_review?: boolean | null
          notes?: string | null
          recording_url?: string | null
          retention_expires_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          summary?: string | null
          transcript_encrypted?: string | null
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
          {
            foreignKeyName: "vapi_call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vapi_call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      video_editor_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          template_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          template_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          template_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_meeting_messages: {
        Row: {
          created_at: string
          id: string
          is_private: boolean | null
          is_system: boolean | null
          meeting_id: string | null
          message: string
          participant_id: string | null
          recipient_id: string | null
          sender_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_private?: boolean | null
          is_system?: boolean | null
          meeting_id?: string | null
          message: string
          participant_id?: string | null
          recipient_id?: string | null
          sender_name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_private?: boolean | null
          is_system?: boolean | null
          meeting_id?: string | null
          message?: string
          participant_id?: string | null
          recipient_id?: string | null
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_meeting_messages_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "video_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_meeting_messages_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "video_meeting_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      video_meeting_participants: {
        Row: {
          ai_broker_id: string | null
          id: string
          is_admin: boolean | null
          is_ai_broker: boolean | null
          is_host: boolean | null
          joined_at: string
          left_at: string | null
          meeting_id: string | null
          participant_email: string | null
          participant_name: string
          removal_reason: string | null
          role: string | null
          user_id: string | null
          was_removed: boolean | null
        }
        Insert: {
          ai_broker_id?: string | null
          id?: string
          is_admin?: boolean | null
          is_ai_broker?: boolean | null
          is_host?: boolean | null
          joined_at?: string
          left_at?: string | null
          meeting_id?: string | null
          participant_email?: string | null
          participant_name: string
          removal_reason?: string | null
          role?: string | null
          user_id?: string | null
          was_removed?: boolean | null
        }
        Update: {
          ai_broker_id?: string | null
          id?: string
          is_admin?: boolean | null
          is_ai_broker?: boolean | null
          is_host?: boolean | null
          joined_at?: string
          left_at?: string | null
          meeting_id?: string | null
          participant_email?: string | null
          participant_name?: string
          removal_reason?: string | null
          role?: string | null
          user_id?: string | null
          was_removed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "video_meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "video_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      video_meetings: {
        Row: {
          created_at: string
          end_reason: string | null
          ended_at: string | null
          host_name: string | null
          host_user_id: string | null
          id: string
          is_recording: boolean | null
          recording_url: string | null
          room_id: string
          started_at: string
          status: string | null
          termination_message: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          host_name?: string | null
          host_user_id?: string | null
          id?: string
          is_recording?: boolean | null
          recording_url?: string | null
          room_id: string
          started_at?: string
          status?: string | null
          termination_message?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          host_name?: string | null
          host_user_id?: string | null
          id?: string
          is_recording?: boolean | null
          recording_url?: string | null
          room_id?: string
          started_at?: string
          status?: string | null
          termination_message?: string | null
          title?: string | null
        }
        Relationships: []
      }
      video_studio_assets: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          expires_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          height: number | null
          id: string
          metadata: Json | null
          mime_type: string | null
          session_id: string
          thumbnail_path: string | null
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          expires_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          height?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          session_id: string
          thumbnail_path?: string | null
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          expires_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          height?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          session_id?: string
          thumbnail_path?: string | null
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      video_studio_jobs: {
        Row: {
          created_at: string | null
          error: string | null
          expires_at: string | null
          id: string
          output_urls: Json | null
          progress: number | null
          project_data: Json
          project_name: string
          session_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          expires_at?: string | null
          id?: string
          output_urls?: Json | null
          progress?: number | null
          project_data?: Json
          project_name?: string
          session_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error?: string | null
          expires_at?: string | null
          id?: string
          output_urls?: Json | null
          progress?: number | null
          project_data?: Json
          project_name?: string
          session_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      video_studio_projects: {
        Row: {
          created_at: string | null
          id: string
          name: string
          project_data: Json
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string
          project_data?: Json
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          project_data?: Json
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vip_clients: {
        Row: {
          assigned_relationship_manager: string | null
          created_at: string | null
          email: string
          full_name: string
          hide_from_public: boolean | null
          id: string
          id_document_url: string | null
          is_verified: boolean | null
          job_title: string | null
          loyalty_points: number | null
          nationality: string | null
          organization: string | null
          phone: string | null
          profession: string | null
          properties_purchased: number | null
          special_notes: string | null
          total_investment_value: number | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
          verified_by: string | null
          vip_category: Database["public"]["Enums"]["vip_category"]
        }
        Insert: {
          assigned_relationship_manager?: string | null
          created_at?: string | null
          email: string
          full_name: string
          hide_from_public?: boolean | null
          id?: string
          id_document_url?: string | null
          is_verified?: boolean | null
          job_title?: string | null
          loyalty_points?: number | null
          nationality?: string | null
          organization?: string | null
          phone?: string | null
          profession?: string | null
          properties_purchased?: number | null
          special_notes?: string | null
          total_investment_value?: number | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
          vip_category: Database["public"]["Enums"]["vip_category"]
        }
        Update: {
          assigned_relationship_manager?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          hide_from_public?: boolean | null
          id?: string
          id_document_url?: string | null
          is_verified?: boolean | null
          job_title?: string | null
          loyalty_points?: number | null
          nationality?: string | null
          organization?: string | null
          phone?: string | null
          profession?: string | null
          properties_purchased?: number | null
          special_notes?: string | null
          total_investment_value?: number | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
          vip_category?: Database["public"]["Enums"]["vip_category"]
        }
        Relationships: []
      }
      vip_event_invitations: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          notes: string | null
          response_date: string | null
          status: string | null
          vip_client_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          notes?: string | null
          response_date?: string | null
          status?: string | null
          vip_client_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          response_date?: string | null
          status?: string | null
          vip_client_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_event_invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vip_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vip_event_invitations_vip_client_id_fkey"
            columns: ["vip_client_id"]
            isOneToOne: false
            referencedRelation: "vip_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          event_date: string
          event_type: string
          id: string
          is_active: boolean | null
          location: string | null
          max_attendees: number | null
          title: string
          updated_at: string | null
          vip_categories_allowed:
            | Database["public"]["Enums"]["vip_category"][]
            | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date: string
          event_type?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_attendees?: number | null
          title: string
          updated_at?: string | null
          vip_categories_allowed?:
            | Database["public"]["Enums"]["vip_category"][]
            | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_attendees?: number | null
          title?: string
          updated_at?: string | null
          vip_categories_allowed?:
            | Database["public"]["Enums"]["vip_category"][]
            | null
        }
        Relationships: []
      }
      vip_gifts: {
        Row: {
          created_at: string | null
          created_by: string | null
          delivery_date: string | null
          delivery_status: string | null
          gift_description: string | null
          gift_type: string
          gift_value: number | null
          id: string
          notes: string | null
          occasion: string | null
          tracking_number: string | null
          vip_client_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          delivery_date?: string | null
          delivery_status?: string | null
          gift_description?: string | null
          gift_type: string
          gift_value?: number | null
          id?: string
          notes?: string | null
          occasion?: string | null
          tracking_number?: string | null
          vip_client_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          delivery_date?: string | null
          delivery_status?: string | null
          gift_description?: string | null
          gift_type?: string
          gift_value?: number | null
          id?: string
          notes?: string | null
          occasion?: string | null
          tracking_number?: string | null
          vip_client_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_gifts_vip_client_id_fkey"
            columns: ["vip_client_id"]
            isOneToOne: false
            referencedRelation: "vip_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_loyalty_rewards: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          points_required: number
          reward_type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_required: number
          reward_type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_required?: number
          reward_type?: string
        }
        Relationships: []
      }
      vip_reservations: {
        Row: {
          admin_notes: string | null
          assigned_staff_id: string | null
          assigned_staff_name: string | null
          created_at: string | null
          id: string
          notes: string | null
          preferred_date: string | null
          reservation_type: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_staff_id?: string | null
          assigned_staff_name?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          preferred_date?: string | null
          reservation_type: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          assigned_staff_id?: string | null
          assigned_staff_name?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          preferred_date?: string | null
          reservation_type?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vip_tool_access: {
        Row: {
          access_expires_at: string | null
          access_granted_at: string | null
          id: string
          is_active: boolean | null
          tool_name: string
          vip_client_id: string
        }
        Insert: {
          access_expires_at?: string | null
          access_granted_at?: string | null
          id?: string
          is_active?: boolean | null
          tool_name: string
          vip_client_id: string
        }
        Update: {
          access_expires_at?: string | null
          access_granted_at?: string | null
          id?: string
          is_active?: boolean | null
          tool_name?: string
          vip_client_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_tool_access_vip_client_id_fkey"
            columns: ["vip_client_id"]
            isOneToOne: false
            referencedRelation: "vip_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_documents: {
        Row: {
          action: string
          created_at: string
          document_name: string | null
          document_type: string
          document_url: string | null
          file_size: number | null
          id: string
          session_id: string
          storage_path: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          document_name?: string | null
          document_type: string
          document_url?: string | null
          file_size?: number | null
          id?: string
          session_id: string
          storage_path?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          document_name?: string | null
          document_type?: string
          document_url?: string | null
          file_size?: number | null
          id?: string
          session_id?: string
          storage_path?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      visitor_events: {
        Row: {
          created_at: string
          element_class: string | null
          element_id: string | null
          element_text: string | null
          event_data: Json | null
          event_name: string
          event_type: string
          id: string
          page_path: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          element_class?: string | null
          element_id?: string | null
          element_text?: string | null
          event_data?: Json | null
          event_name: string
          event_type: string
          id?: string
          page_path?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          element_class?: string | null
          element_id?: string | null
          element_text?: string | null
          event_data?: Json | null
          event_name?: string
          event_type?: string
          id?: string
          page_path?: string | null
          session_id?: string
        }
        Relationships: []
      }
      visitor_sessions: {
        Row: {
          browser: string | null
          city: string | null
          contact_details: Json | null
          country: string | null
          created_at: string
          device_type: string | null
          first_visit_at: string
          id: string
          ip_address: string | null
          is_bounced: boolean | null
          is_converted: boolean | null
          landing_page: string | null
          last_activity_at: string
          os: string | null
          pages_visited: number | null
          referrer: string | null
          scroll_depth_max: number | null
          session_id: string
          total_time_spent: number | null
          user_agent: string | null
          user_id: string | null
          visitor_fingerprint: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          contact_details?: Json | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          first_visit_at?: string
          id?: string
          ip_address?: string | null
          is_bounced?: boolean | null
          is_converted?: boolean | null
          landing_page?: string | null
          last_activity_at?: string
          os?: string | null
          pages_visited?: number | null
          referrer?: string | null
          scroll_depth_max?: number | null
          session_id: string
          total_time_spent?: number | null
          user_agent?: string | null
          user_id?: string | null
          visitor_fingerprint?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          contact_details?: Json | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          first_visit_at?: string
          id?: string
          ip_address?: string | null
          is_bounced?: boolean | null
          is_converted?: boolean | null
          landing_page?: string | null
          last_activity_at?: string
          os?: string | null
          pages_visited?: number | null
          referrer?: string | null
          scroll_depth_max?: number | null
          session_id?: string
          total_time_spent?: number | null
          user_agent?: string | null
          user_id?: string | null
          visitor_fingerprint?: string | null
        }
        Relationships: []
      }
      voice_call_logs: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          metadata: Json | null
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      voice_scripts: {
        Row: {
          created_at: string
          id: string
          language: string
          project_name: string | null
          script: string
          tags: string[] | null
          title: string
          tone: string
          updated_at: string
          user_id: string
          voice_name: string | null
          word_count: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string
          project_name?: string | null
          script: string
          tags?: string[] | null
          title: string
          tone?: string
          updated_at?: string
          user_id: string
          voice_name?: string | null
          word_count?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          project_name?: string | null
          script?: string
          tags?: string[] | null
          title?: string
          tone?: string
          updated_at?: string
          user_id?: string
          voice_name?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      web_developer_tasks: {
        Row: {
          approved_at: string | null
          approved_by_user_id: string | null
          assigned_by: string
          assigned_by_user_id: string | null
          changes: Json | null
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          status: string
          title: string
          updated_at: string
          version_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          assigned_by: string
          assigned_by_user_id?: string | null
          changes?: Json | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          title: string
          updated_at?: string
          version_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          assigned_by?: string
          assigned_by_user_id?: string | null
          changes?: Json | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          title?: string
          updated_at?: string
          version_id?: string | null
        }
        Relationships: []
      }
      web_developer_versions: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          description: string | null
          id: string
          is_current: boolean | null
          snapshot: Json | null
          version_id: string
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          is_current?: boolean | null
          snapshot?: Json | null
          version_id: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          is_current?: boolean | null
          snapshot?: Json | null
          version_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      best_idea_submissions_safe: {
        Row: {
          actual_email: string | null
          actual_name: string | null
          actual_phone: string | null
          admin_notes: string | null
          created_at: string | null
          draw_ticket_number: string | null
          email: string | null
          full_name: string | null
          id: string | null
          idea: string | null
          is_anonymous: boolean | null
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          actual_email?: never
          actual_name?: never
          actual_phone?: never
          admin_notes?: string | null
          created_at?: string | null
          draw_ticket_number?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          idea?: string | null
          is_anonymous?: boolean | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          actual_email?: never
          actual_name?: never
          actual_phone?: never
          admin_notes?: string | null
          created_at?: string | null
          draw_ticket_number?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          idea?: string | null
          is_anonymous?: boolean | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
          years_experience?: number | null
        }
        Relationships: []
      }
      broker_subscriptions_safe: {
        Row: {
          ai_credits_limit: number | null
          ai_credits_used: number | null
          created_at: string | null
          expires_at: string | null
          id: string | null
          pdf_downloads: number | null
          selected_addons: string[] | null
          starts_at: string | null
          status: string | null
          tier: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_credits_limit?: number | null
          ai_credits_used?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          pdf_downloads?: number | null
          selected_addons?: string[] | null
          starts_at?: string | null
          status?: string | null
          tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_credits_limit?: number | null
          ai_credits_used?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          pdf_downloads?: number | null
          selected_addons?: string[] | null
          starts_at?: string | null
          status?: string | null
          tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contact_gating_submissions_secure: {
        Row: {
          created_at: string | null
          email_masked: string | null
          email_verified: boolean | null
          full_name: string | null
          id: string | null
          location: string | null
          nationality: string | null
          phone_masked: string | null
          phone_verified: boolean | null
          preferred_language: string | null
          service_interest: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_masked?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string | null
          location?: string | null
          nationality?: string | null
          phone_masked?: string | null
          phone_verified?: boolean | null
          preferred_language?: string | null
          service_interest?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_masked?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string | null
          location?: string | null
          nationality?: string | null
          phone_masked?: string | null
          phone_verified?: boolean | null
          preferred_language?: string | null
          service_interest?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
      crm_leads_secure: {
        Row: {
          assigned_broker_id: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          pipeline_stage: string | null
          rental_budget_max: number | null
          rental_budget_min: number | null
          rental_preferred_areas: string[] | null
          rental_property_type: string | null
          source: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          assigned_broker_id?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          pipeline_stage?: string | null
          rental_budget_max?: number | null
          rental_budget_min?: number | null
          rental_preferred_areas?: string[] | null
          rental_property_type?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          assigned_broker_id?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          pipeline_stage?: string | null
          rental_budget_max?: number | null
          rental_budget_min?: number | null
          rental_preferred_areas?: string[] | null
          rental_property_type?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_assigned_broker_id_fkey"
            columns: ["assigned_broker_id"]
            isOneToOne: false
            referencedRelation: "ai_brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_vip_leads: {
        Row: {
          assigned_broker_id: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          pipeline_stage: string | null
          rental_budget_max: number | null
          rental_budget_min: number | null
          rental_preferred_areas: string[] | null
          rental_property_type: string | null
          source: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          assigned_broker_id?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          pipeline_stage?: string | null
          rental_budget_max?: number | null
          rental_budget_min?: number | null
          rental_preferred_areas?: string[] | null
          rental_property_type?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          assigned_broker_id?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          pipeline_stage?: string | null
          rental_budget_max?: number | null
          rental_budget_min?: number | null
          rental_preferred_areas?: string[] | null
          rental_property_type?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_assigned_broker_id_fkey"
            columns: ["assigned_broker_id"]
            isOneToOne: false
            referencedRelation: "ai_brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_sales_reps_public: {
        Row: {
          created_at: string | null
          developer_id: string | null
          email_masked: string | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          is_primary: boolean | null
          phone_masked: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          developer_id?: string | null
          email_masked?: never
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          phone_masked?: never
          title?: string | null
        }
        Update: {
          created_at?: string | null
          developer_id?: string | null
          email_masked?: never
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          phone_masked?: never
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "developer_sales_reps_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "uae_developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_sales_reps_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "uae_developers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_payment_history_safe: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          employee_name: string | null
          id: string | null
          payment_date: string | null
          payment_method: string | null
          payment_type: string | null
          period_end: string | null
          period_start: string | null
          reference_number: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          employee_name?: string | null
          id?: string | null
          payment_date?: string | null
          payment_method?: never
          payment_type?: string | null
          period_end?: string | null
          period_start?: string | null
          reference_number?: never
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          employee_name?: string | null
          id?: string | null
          payment_date?: string | null
          payment_method?: never
          payment_type?: string | null
          period_end?: string | null
          period_start?: string | null
          reference_number?: never
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      employee_salaries_masked: {
        Row: {
          bank_account_masked: string | null
          bank_iban_masked: string | null
          bank_name: string | null
          bank_name_masked: string | null
          base_salary: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          department: string | null
          effective_date: string | null
          employee_name: string | null
          end_date: string | null
          id: string | null
          notes: string | null
          salary_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bank_account_masked?: never
          bank_iban_masked?: never
          bank_name?: string | null
          bank_name_masked?: never
          base_salary?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          department?: string | null
          effective_date?: string | null
          employee_name?: string | null
          end_date?: string | null
          id?: string | null
          notes?: string | null
          salary_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bank_account_masked?: never
          bank_iban_masked?: never
          bank_name?: string | null
          bank_name_masked?: never
          base_salary?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          department?: string | null
          effective_date?: string | null
          employee_name?: string | null
          end_date?: string | null
          id?: string | null
          notes?: string | null
          salary_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      employee_salaries_secure: {
        Row: {
          bank_account: string | null
          bank_iban: string | null
          bank_name: string | null
          base_salary: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          department: string | null
          effective_date: string | null
          employee_name: string | null
          end_date: string | null
          id: string | null
          notes: string | null
          salary_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bank_account?: never
          bank_iban?: never
          bank_name?: never
          base_salary?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          department?: string | null
          effective_date?: string | null
          employee_name?: string | null
          end_date?: string | null
          id?: string | null
          notes?: string | null
          salary_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bank_account?: never
          bank_iban?: never
          bank_name?: never
          base_salary?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          department?: string | null
          effective_date?: string | null
          employee_name?: string | null
          end_date?: string | null
          id?: string | null
          notes?: string | null
          salary_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      employee_salaries_self_service: {
        Row: {
          bank_name_display: string | null
          base_salary: number | null
          created_at: string | null
          currency: string | null
          department: string | null
          effective_date: string | null
          employee_name: string | null
          end_date: string | null
          id: string | null
          notes: string | null
          salary_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bank_name_display?: never
          base_salary?: never
          created_at?: string | null
          currency?: string | null
          department?: string | null
          effective_date?: string | null
          employee_name?: string | null
          end_date?: string | null
          id?: string | null
          notes?: never
          salary_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bank_name_display?: never
          base_salary?: never
          created_at?: string | null
          currency?: string | null
          department?: string | null
          effective_date?: string | null
          employee_name?: string | null
          end_date?: string | null
          id?: string | null
          notes?: never
          salary_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      executive_communications_audit: {
        Row: {
          channel: string | null
          confidence_score: number | null
          contact_identifier: string | null
          contact_name: string | null
          created_at: string | null
          direction: string | null
          flagged_reason: string | null
          handled_by: string | null
          id: string | null
          phone_line: string | null
          responded_at: string | null
          status: string | null
          subject: string | null
          user_id: string | null
        }
        Insert: {
          channel?: string | null
          confidence_score?: number | null
          contact_identifier?: string | null
          contact_name?: string | null
          created_at?: string | null
          direction?: string | null
          flagged_reason?: string | null
          handled_by?: string | null
          id?: string | null
          phone_line?: string | null
          responded_at?: string | null
          status?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          channel?: string | null
          confidence_score?: number | null
          contact_identifier?: string | null
          contact_name?: string | null
          created_at?: string | null
          direction?: string | null
          flagged_reason?: string | null
          handled_by?: string | null
          id?: string | null
          phone_line?: string | null
          responded_at?: string | null
          status?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      hr_employees_secure: {
        Row: {
          candidate_id: string | null
          certifications: string[] | null
          created_at: string | null
          created_by: string | null
          cv_url_encrypted: string | null
          department: string | null
          email_encrypted: string | null
          email_hash: string | null
          employee_status: string | null
          full_name: string | null
          id: string | null
          phone_encrypted: string | null
          phone_hash: string | null
          position: string | null
          skills: string[] | null
          start_date: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          candidate_id?: string | null
          certifications?: string[] | null
          created_at?: string | null
          created_by?: string | null
          cv_url_encrypted?: string | null
          department?: string | null
          email_encrypted?: string | null
          email_hash?: string | null
          employee_status?: string | null
          full_name?: string | null
          id?: string | null
          phone_encrypted?: string | null
          phone_hash?: string | null
          position?: string | null
          skills?: string[] | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          candidate_id?: string | null
          certifications?: string[] | null
          created_at?: string | null
          created_by?: string | null
          cv_url_encrypted?: string | null
          department?: string | null
          email_encrypted?: string | null
          email_hash?: string | null
          employee_status?: string | null
          full_name?: string | null
          id?: string | null
          phone_encrypted?: string | null
          phone_hash?: string | null
          position?: string | null
          skills?: string[] | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employees_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "hr_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      jbj_leads_secure: {
        Row: {
          assigned_broker_id: string | null
          created_at: string | null
          id: string | null
          name: string | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_broker_id?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_broker_id?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jbj_leads_assigned_broker_id_fkey"
            columns: ["assigned_broker_id"]
            isOneToOne: false
            referencedRelation: "jbj_brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_secure: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_bank_vault_masked: {
        Row: {
          account_masked: string | null
          bank_name: string | null
          created_at: string | null
          created_by: string | null
          iban_masked: string | null
          id: string | null
          partner_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          account_masked?: never
          bank_name?: string | null
          created_at?: string | null
          created_by?: string | null
          iban_masked?: never
          id?: string | null
          partner_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          account_masked?: never
          bank_name?: string | null
          created_at?: string | null
          created_by?: string | null
          iban_masked?: never
          id?: string | null
          partner_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_partner_bank_vault_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "referral_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_partner_bank_vault_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "referral_partners_finance_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_partner_bank_vault_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "referral_partners_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_public: {
        Row: {
          full_name: string | null
          id: string | null
          user_role: string | null
        }
        Insert: {
          full_name?: string | null
          id?: string | null
          user_role?: string | null
        }
        Update: {
          full_name?: string | null
          id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      referral_partner_bank_vault_secure: {
        Row: {
          bank_name: string | null
          created_at: string | null
          id: string | null
          partner_id: string | null
          updated_at: string | null
        }
        Insert: {
          bank_name?: string | null
          created_at?: string | null
          id?: string | null
          partner_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bank_name?: string | null
          created_at?: string | null
          id?: string | null
          partner_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_partner_bank_vault_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "referral_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_partner_bank_vault_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "referral_partners_finance_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_partner_bank_vault_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "referral_partners_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_partners_finance_secure: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          commission_rate: number | null
          contract_signed_at: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          nationality: string | null
          notes: string | null
          partner_type: string | null
          passport_number: string | null
          phone_e164: string | null
          referral_code: string | null
          status: string | null
          total_conversions: number | null
          total_earnings_aed: number | null
          total_referrals: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          commission_rate?: never
          contract_signed_at?: string | null
          created_at?: string | null
          email?: never
          full_name?: string | null
          id?: string | null
          nationality?: string | null
          notes?: string | null
          partner_type?: string | null
          passport_number?: never
          phone_e164?: never
          referral_code?: string | null
          status?: string | null
          total_conversions?: number | null
          total_earnings_aed?: never
          total_referrals?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          commission_rate?: never
          contract_signed_at?: string | null
          created_at?: string | null
          email?: never
          full_name?: string | null
          id?: string | null
          nationality?: string | null
          notes?: string | null
          partner_type?: string | null
          passport_number?: never
          phone_e164?: never
          referral_code?: string | null
          status?: string | null
          total_conversions?: number | null
          total_earnings_aed?: never
          total_referrals?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      referral_partners_safe: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string | null
          partner_type: string | null
          status: string | null
          total_conversions: number | null
          total_earnings_aed: number | null
          total_referrals: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          partner_type?: string | null
          status?: string | null
          total_conversions?: number | null
          total_earnings_aed?: number | null
          total_referrals?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          partner_type?: string | null
          status?: string | null
          total_conversions?: number | null
          total_earnings_aed?: number | null
          total_referrals?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      rental_listings_public: {
        Row: {
          address: string | null
          amenities: string[] | null
          annual_rent: number | null
          bathrooms: number | null
          bedrooms: number | null
          building_name: string | null
          community: string | null
          created_at: string | null
          description: string | null
          emirate: string | null
          furnished: string | null
          id: string | null
          images: string[] | null
          landlord_email: string | null
          landlord_name_masked: string | null
          landlord_nationality: string | null
          landlord_phone: string | null
          ownership_type: string | null
          payment_terms: string | null
          property_title: string | null
          property_type: string | null
          security_deposit: number | null
          size_sqft: number | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          annual_rent?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_name?: string | null
          community?: string | null
          created_at?: string | null
          description?: string | null
          emirate?: string | null
          furnished?: string | null
          id?: string | null
          images?: string[] | null
          landlord_email?: never
          landlord_name_masked?: never
          landlord_nationality?: never
          landlord_phone?: never
          ownership_type?: string | null
          payment_terms?: string | null
          property_title?: string | null
          property_type?: string | null
          security_deposit?: number | null
          size_sqft?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          annual_rent?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_name?: string | null
          community?: string | null
          created_at?: string | null
          description?: string | null
          emirate?: string | null
          furnished?: string | null
          id?: string | null
          images?: string[] | null
          landlord_email?: never
          landlord_name_masked?: never
          landlord_nationality?: never
          landlord_phone?: never
          ownership_type?: string | null
          payment_terms?: string | null
          property_title?: string | null
          property_type?: string | null
          security_deposit?: number | null
          size_sqft?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      seller_listings_secure: {
        Row: {
          admin_approved_at: string | null
          assistant_approved_at: string | null
          bedrooms: number | null
          community_building: string | null
          created_at: string | null
          founder_approved_at: string | null
          has_upgrades: boolean | null
          id: string | null
          is_furnished: boolean | null
          leadership_approved_at: string | null
          minimum_acceptable_price: number | null
          photo_urls: string[] | null
          property_location: string | null
          property_size_sqft: number | null
          property_status: string | null
          property_type: string | null
          reviewed_at: string | null
          selling_urgency: string | null
          status: string | null
          submitted_at: string | null
          target_selling_price: number | null
          updated_at: string | null
          user_id: string | null
          went_live_at: string | null
        }
        Insert: {
          admin_approved_at?: string | null
          assistant_approved_at?: string | null
          bedrooms?: number | null
          community_building?: string | null
          created_at?: string | null
          founder_approved_at?: string | null
          has_upgrades?: boolean | null
          id?: string | null
          is_furnished?: boolean | null
          leadership_approved_at?: string | null
          minimum_acceptable_price?: number | null
          photo_urls?: string[] | null
          property_location?: string | null
          property_size_sqft?: number | null
          property_status?: string | null
          property_type?: string | null
          reviewed_at?: string | null
          selling_urgency?: string | null
          status?: string | null
          submitted_at?: string | null
          target_selling_price?: number | null
          updated_at?: string | null
          user_id?: string | null
          went_live_at?: string | null
        }
        Update: {
          admin_approved_at?: string | null
          assistant_approved_at?: string | null
          bedrooms?: number | null
          community_building?: string | null
          created_at?: string | null
          founder_approved_at?: string | null
          has_upgrades?: boolean | null
          id?: string | null
          is_furnished?: boolean | null
          leadership_approved_at?: string | null
          minimum_acceptable_price?: number | null
          photo_urls?: string[] | null
          property_location?: string | null
          property_size_sqft?: number | null
          property_status?: string | null
          property_type?: string | null
          reviewed_at?: string | null
          selling_urgency?: string | null
          status?: string | null
          submitted_at?: string | null
          target_selling_price?: number | null
          updated_at?: string | null
          user_id?: string | null
          went_live_at?: string | null
        }
        Relationships: []
      }
      uae_developers_public: {
        Row: {
          description: string | null
          founded_year: number | null
          headquarters: string | null
          id: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string | null
          slug: string | null
          website_url: string | null
        }
        Insert: {
          description?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
          website_url?: string | null
        }
        Update: {
          description?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      unified_listing_approvals: {
        Row: {
          created_at: string | null
          id: string | null
          listing_type: string | null
          reviewed_at: string | null
          status: string | null
          title: string | null
        }
        Relationships: []
      }
      v_rental_listings_safe: {
        Row: {
          address: string | null
          admin_approved_at: string | null
          admin_approved_by: string | null
          amenities: string[] | null
          annual_rent: number | null
          assistant_approved_at: string | null
          assistant_approved_by: string | null
          bathrooms: number | null
          bedrooms: number | null
          building_name: string | null
          community: string | null
          created_at: string | null
          description: string | null
          documents: string[] | null
          emirate: string | null
          founder_approved_at: string | null
          founder_approved_by: string | null
          furnished: string | null
          id: string | null
          images: string[] | null
          landlord_email: string | null
          landlord_name: string | null
          landlord_nationality: string | null
          landlord_phone: string | null
          leadership_approved_at: string | null
          leadership_approved_by: string | null
          ownership_type: string | null
          payment_terms: string | null
          property_title: string | null
          property_type: string | null
          rejection_reason: string | null
          security_deposit: number | null
          size_sqft: number | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          video_url: string | null
          went_live_at: string | null
        }
        Insert: {
          address?: string | null
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          amenities?: string[] | null
          annual_rent?: number | null
          assistant_approved_at?: string | null
          assistant_approved_by?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_name?: string | null
          community?: string | null
          created_at?: string | null
          description?: string | null
          documents?: string[] | null
          emirate?: string | null
          founder_approved_at?: string | null
          founder_approved_by?: string | null
          furnished?: string | null
          id?: string | null
          images?: string[] | null
          landlord_email?: never
          landlord_name?: never
          landlord_nationality?: never
          landlord_phone?: never
          leadership_approved_at?: string | null
          leadership_approved_by?: string | null
          ownership_type?: string | null
          payment_terms?: string | null
          property_title?: string | null
          property_type?: string | null
          rejection_reason?: string | null
          security_deposit?: number | null
          size_sqft?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
          went_live_at?: string | null
        }
        Update: {
          address?: string | null
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          amenities?: string[] | null
          annual_rent?: number | null
          assistant_approved_at?: string | null
          assistant_approved_by?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_name?: string | null
          community?: string | null
          created_at?: string | null
          description?: string | null
          documents?: string[] | null
          emirate?: string | null
          founder_approved_at?: string | null
          founder_approved_by?: string | null
          furnished?: string | null
          id?: string | null
          images?: string[] | null
          landlord_email?: never
          landlord_name?: never
          landlord_nationality?: never
          landlord_phone?: never
          leadership_approved_at?: string | null
          leadership_approved_by?: string | null
          ownership_type?: string | null
          payment_terms?: string | null
          property_title?: string | null
          property_type?: string | null
          rejection_reason?: string | null
          security_deposit?: number | null
          size_sqft?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
          went_live_at?: string | null
        }
        Relationships: []
      }
      vapi_call_logs_masked: {
        Row: {
          access_count: number | null
          ai_audited_at: string | null
          ai_follow_up_recommended: boolean | null
          ai_highlights: string[] | null
          ai_issues: string[] | null
          ai_lead_quality: string | null
          ai_score: number | null
          ai_sentiment: string | null
          ai_summary: string | null
          assistant_name: string | null
          call_id: string | null
          call_status: string | null
          caller_name_masked: string | null
          caller_phone_masked: string | null
          created_at: string | null
          duration_seconds: number | null
          ended_reason: string | null
          extracted_budget: string | null
          extracted_email_masked: string | null
          extracted_interest: string | null
          extracted_name_masked: string | null
          extracted_phone_masked: string | null
          flag_reason: string | null
          id: string | null
          is_flagged: boolean | null
          lead_id: string | null
          needs_review: boolean | null
          notes: string | null
          recording_url: string | null
          retention_expires_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          summary: string | null
          transcript_masked: string | null
          updated_at: string | null
        }
        Insert: {
          access_count?: number | null
          ai_audited_at?: string | null
          ai_follow_up_recommended?: boolean | null
          ai_highlights?: string[] | null
          ai_issues?: string[] | null
          ai_lead_quality?: string | null
          ai_score?: number | null
          ai_sentiment?: string | null
          ai_summary?: string | null
          assistant_name?: string | null
          call_id?: string | null
          call_status?: string | null
          caller_name_masked?: never
          caller_phone_masked?: never
          created_at?: string | null
          duration_seconds?: number | null
          ended_reason?: string | null
          extracted_budget?: string | null
          extracted_email_masked?: never
          extracted_interest?: string | null
          extracted_name_masked?: never
          extracted_phone_masked?: never
          flag_reason?: string | null
          id?: string | null
          is_flagged?: boolean | null
          lead_id?: string | null
          needs_review?: boolean | null
          notes?: string | null
          recording_url?: never
          retention_expires_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          summary?: string | null
          transcript_masked?: never
          updated_at?: string | null
        }
        Update: {
          access_count?: number | null
          ai_audited_at?: string | null
          ai_follow_up_recommended?: boolean | null
          ai_highlights?: string[] | null
          ai_issues?: string[] | null
          ai_lead_quality?: string | null
          ai_score?: number | null
          ai_sentiment?: string | null
          ai_summary?: string | null
          assistant_name?: string | null
          call_id?: string | null
          call_status?: string | null
          caller_name_masked?: never
          caller_phone_masked?: never
          created_at?: string | null
          duration_seconds?: number | null
          ended_reason?: string | null
          extracted_budget?: string | null
          extracted_email_masked?: never
          extracted_interest?: string | null
          extracted_name_masked?: never
          extracted_phone_masked?: never
          flag_reason?: string | null
          id?: string | null
          is_flagged?: boolean | null
          lead_id?: string | null
          needs_review?: boolean | null
          notes?: string | null
          recording_url?: never
          retention_expires_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          summary?: string | null
          transcript_masked?: never
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vapi_call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vapi_call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vapi_call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_vip_leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      acquire_function_lock: {
        Args: { p_function_name: string; p_timeout_minutes?: number }
        Returns: boolean
      }
      add_points: {
        Args: {
          _created_by?: string
          _event_description?: string
          _event_ref_id?: string
          _event_type: string
          _points_delta: number
          _user_id: string
        }
        Returns: string
      }
      anonymize_old_form_submissions: { Args: never; Returns: number }
      auto_assign_lead_to_available_broker: {
        Args: { p_lead_id: string }
        Returns: string
      }
      award_points: {
        Args: {
          p_description?: string
          p_event_ref_id?: string
          p_event_type: string
          p_user_id: string
        }
        Returns: number
      }
      bulk_assign_leads: {
        Args: {
          p_assigned_by_user_id: string
          p_assignee_user_id: string
          p_lead_ids: string[]
        }
        Returns: number
      }
      calculate_leave_eligibility: {
        Args: {
          p_leave_type: Database["public"]["Enums"]["leave_type"]
          p_user_id: string
        }
        Returns: {
          accrued_days: number
          entitled_days: number
          remaining_days: number
          taken_days: number
        }[]
      }
      calculate_security_score: { Args: never; Returns: number }
      calculate_user_tier: {
        Args: { p_tier_type: string; p_user_id: string }
        Returns: string
      }
      can_access_crm_lead: {
        Args: { _lead_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_partner_vault: { Args: never; Returns: boolean }
      can_access_payment_vault: { Args: { _user_id: string }; Returns: boolean }
      can_access_salary_data: { Args: { _user_id: string }; Returns: boolean }
      can_access_salary_vault: { Args: { _user_id: string }; Returns: boolean }
      can_earn_points: {
        Args: { p_event_type: string; p_user_id: string }
        Returns: boolean
      }
      can_view_landlord_pii: { Args: { _user_id: string }; Returns: boolean }
      check_broker_verification_expiry: { Args: never; Returns: undefined }
      check_chat_rate_limit: {
        Args: { p_session_id: string }
        Returns: boolean
      }
      check_contact_form_rate_limit: {
        Args: { p_email: string; p_ip_address: string }
        Returns: Json
      }
      check_contact_gating_rate_limit: {
        Args: { p_email: string; p_ip_hash?: string }
        Returns: boolean
      }
      check_forms_submission_rate_limit: {
        Args: { p_email: string; p_ip?: string }
        Returns: boolean
      }
      check_hr_application_rate_limit: {
        Args: { p_email: string }
        Returns: boolean
      }
      check_idea_submission_rate_limit: {
        Args: { p_email: string; p_ip?: string }
        Returns: boolean
      }
      check_lead_access_rate: { Args: { p_user_id: string }; Returns: boolean }
      check_lead_rate_limit: {
        Args: {
          p_email: string
          p_max_submissions?: number
          p_window_hours?: number
        }
        Returns: boolean
      }
      check_lead_rate_limit_strict: {
        Args: { p_email: string; p_ip_hash?: string; p_phone?: string }
        Returns: boolean
      }
      check_lead_submission_rate: {
        Args: { p_email: string }
        Returns: boolean
      }
      check_message_compliance: {
        Args: { p_content: string }
        Returns: {
          is_compliant: boolean
          severity: string
          violations: string[]
        }[]
      }
      check_name_available: {
        Args: {
          _asset_type: string
          _company_name: string
          _requesting_user: string
        }
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
      check_verification_rate_limit: {
        Args: {
          p_identifier: string
          p_max_attempts?: number
          p_verification_type: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_device_tracking_data: { Args: never; Returns: number }
      cleanup_expired_toolkit_data: { Args: never; Returns: undefined }
      cleanup_expired_vapi_calls: { Args: never; Returns: number }
      cleanup_expired_vapi_recordings: { Args: never; Returns: number }
      cleanup_expired_verifications: { Args: never; Returns: undefined }
      cleanup_notification_inbox: { Args: never; Returns: undefined }
      cleanup_old_health_logs: { Args: never; Returns: undefined }
      cleanup_rate_limit_records: { Args: never; Returns: number }
      cleanup_temp_video_files: { Args: never; Returns: undefined }
      crm_auto_purge_old_deleted: { Args: never; Returns: number }
      crm_detect_stale_leads: { Args: { p_days?: number }; Returns: number }
      crm_find_duplicates: {
        Args: { p_email?: string; p_phone?: string }
        Returns: {
          created_at: string
          email_lower: string
          full_name: string
          id: string
          phone_e164: string
        }[]
      }
      crm_hard_delete_import: {
        Args: { p_import_batch_id?: string; p_source_id?: string }
        Returns: Json
      }
      crm_hard_delete_leads: { Args: { p_lead_ids: string[] }; Returns: Json }
      crm_purge_deleted_leads: { Args: never; Returns: Json }
      crm_restore_leads: { Args: { p_lead_ids: string[] }; Returns: Json }
      crm_soft_delete_leads: { Args: { p_lead_ids: string[] }; Returns: Json }
      decrypt_bank_field: {
        Args: { encrypted_data: string; salt_id: string }
        Returns: string
      }
      decrypt_contact_gating_pii: {
        Args: { submission_id: string }
        Returns: {
          created_at: string
          email: string
          email_verified: boolean
          full_name: string
          id: string
          location: string
          nationality: string
          phone: string
          phone_verified: boolean
          preferred_language: string
          service_interest: string
        }[]
      }
      decrypt_employee_salary_banking: {
        Args: { salary_id: string }
        Returns: {
          bank_account_number: string
          bank_iban: string
        }[]
      }
      decrypt_hr_employee_pii: {
        Args: { p_employee_id: string }
        Returns: {
          cv_url: string
          email: string
          phone: string
        }[]
      }
      decrypt_lead_pii:
        | { Args: { encrypted_data: string }; Returns: string }
        | {
            Args: { p_lead_id: string }
            Returns: {
              created_at: string
              email: string
              full_name: string
              id: string
              phone: string
              source: string
            }[]
          }
      decrypt_partner_bank_field: {
        Args: { encrypted_data: string; fallback_plaintext?: string }
        Returns: string
      }
      decrypt_salary_bank_data: {
        Args: { encrypted_data: string }
        Returns: string
      }
      decrypt_seller_listing_pii: {
        Args: { listing_id: string }
        Returns: {
          created_at: string
          id: string
          property_location: string
          property_type: string
          seller_email: string
          seller_full_name: string
          seller_phone: string
          status: string
        }[]
      }
      decrypt_vapi_call_pii: {
        Args: { p_call_id: string }
        Returns: {
          created_at: string
          extracted_email: string
          extracted_name: string
          extracted_phone: string
          id: string
          recording_url: string
          transcript: string
        }[]
      }
      encrypt_bank_field: {
        Args: { plain_text: string; salt_id: string }
        Returns: string
      }
      enqueue_pending_cv_task_reminders: { Args: never; Returns: undefined }
      generate_card_number: { Args: never; Returns: string }
      generate_company_id: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      generate_share_token: { Args: never; Returns: string }
      get_all_subscriptions_admin: {
        Args: never
        Returns: {
          ai_credits_limit: number
          ai_credits_used: number
          company_name: string
          created_at: string
          currency: string
          email: string
          expires_at: string
          full_name: string
          id: string
          payment_method: string
          payment_reference: string
          pdf_downloads: number
          phone: string
          price_usd: number
          rera_number: string
          selected_addons: string[]
          starts_at: string
          status: string
          tier: string
          trial_ends_at: string
          updated_at: string
          user_id: string
        }[]
      }
      get_broker_message_decrypted: {
        Args: { p_message_id: string }
        Returns: {
          content: string
          original_content: string
        }[]
      }
      get_employee_full_bank_details: {
        Args: { p_salary_id: string }
        Returns: {
          bank_account_number: string
          bank_iban: string
          bank_name: string
          employee_name: string
        }[]
      }
      get_full_payment_details: {
        Args: { p_payment_id: string }
        Returns: {
          payment_method: string
          reference_number: string
        }[]
      }
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
      get_owner_email: { Args: never; Returns: string }
      get_partner_banking_details: {
        Args: { p_partner_id: string }
        Returns: {
          bank_account_number: string
          bank_iban: string
          bank_name: string
        }[]
      }
      get_referral_partner_full_details: {
        Args: { p_partner_id: string }
        Returns: {
          commission_rate: number
          email: string
          full_name: string
          id: string
          partner_type: string
          phone_e164: string
          status: string
        }[]
      }
      get_salary_with_logging: {
        Args: { p_salary_id: string }
        Returns: {
          base_salary: number
          currency: string
          effective_date: string
          id: string
          notes: string
          user_id: string
        }[]
      }
      get_subscription_payment_details: {
        Args: { p_subscription_id: string }
        Returns: {
          payment_method: string
          payment_reference: string
          price_usd: number
        }[]
      }
      get_user_access_level: { Args: { p_user_id: string }; Returns: string }
      get_user_points_balance: { Args: { _user_id: string }; Returns: number }
      get_user_tier: {
        Args: { _mode?: string; _user_id: string }
        Returns: string
      }
      get_user_total_points: { Args: { p_user_id: string }; Returns: number }
      get_vapi_call_decrypted_pii: {
        Args: { p_call_id: string }
        Returns: {
          created_at: string
          extracted_email: string
          extracted_name: string
          extracted_phone: string
          id: string
          recording_url: string
          transcript: string
        }[]
      }
      has_finance_access: { Args: { user_uuid: string }; Returns: boolean }
      has_finance_hr_access: { Args: { _user_id: string }; Returns: boolean }
      has_first_deal_verified: { Args: { p_user_id: string }; Returns: boolean }
      has_full_lead_pii_access: {
        Args: { _lead_id: string; _user_id: string }
        Returns: boolean
      }
      has_lead_access: { Args: { p_lead_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_verified_first_deal: { Args: { _user_id: string }; Returns: boolean }
      increment_shared_card_views: {
        Args: { card_token: string }
        Returns: undefined
      }
      is_active_crm_member: { Args: { _user_id: string }; Returns: boolean }
      is_authorized_staff: { Args: never; Returns: boolean }
      is_crm_admin: { Args: { _user_id: string }; Returns: boolean }
      is_crm_owner: { Args: { check_user_id: string }; Returns: boolean }
      is_email_domain_blocked: {
        Args: { email_address: string }
        Returns: boolean
      }
      is_fingerprint_blocked: {
        Args: { p_fingerprint: string }
        Returns: boolean
      }
      is_founder_visible: { Args: never; Returns: boolean }
      is_hr_admin: { Args: { _user_id: string }; Returns: boolean }
      is_hr_admin_strict: { Args: { _user_id: string }; Returns: boolean }
      is_hr_manager: { Args: { _user_id: string }; Returns: boolean }
      is_hr_member: { Args: { _user_id: string }; Returns: boolean }
      is_listing_admin: { Args: { _user_id: string }; Returns: boolean }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_owner_or_admin: { Args: { _user_id: string }; Returns: boolean }
      is_partner_owner: { Args: { _partner_id: string }; Returns: boolean }
      is_sales_director: { Args: { _user_id: string }; Returns: boolean }
      is_team_admin: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      log_chat_message: {
        Args: {
          p_message: string
          p_metadata?: Json
          p_role: string
          p_session_id: string
          p_source: string
          p_source_page?: string
          p_user_email?: string
          p_user_name?: string
          p_user_phone?: string
        }
        Returns: string
      }
      log_contact_gating_access: {
        Args: { _access_type: string; _submission_id?: string }
        Returns: undefined
      }
      log_crm_lead_access: {
        Args: { p_access_type?: string; p_lead_id: string; p_user_id: string }
        Returns: undefined
      }
      log_hr_access: {
        Args: {
          _access_type?: string
          _metadata?: Json
          _records_accessed?: number
          _resource_id?: string
          _resource_type: string
        }
        Returns: string
      }
      log_pii_access: {
        Args: {
          p_access_type: string
          p_resource_id: string
          p_resource_type: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_event_type: string
          p_resource_id?: string
          p_resource_type?: string
          p_severity?: string
        }
        Returns: string
      }
      log_security_event_full: {
        Args: {
          p_action_taken?: string
          p_ai_agent_id?: string
          p_department?: string
          p_description: string
          p_event_type: Database["public"]["Enums"]["security_event_type"]
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type?: string
          p_severity: Database["public"]["Enums"]["security_severity"]
          p_user_id?: string
        }
        Returns: string
      }
      log_security_violation: {
        Args: {
          p_details?: Json
          p_fingerprint?: string
          p_ip_address?: string
          p_user_agent?: string
          p_violation_type: string
        }
        Returns: string
      }
      mask_bank_account: { Args: { account: string }; Returns: string }
      mask_email: { Args: { email: string }; Returns: string }
      mask_iban: { Args: { iban: string }; Returns: string }
      mask_phone: { Args: { phone: string }; Returns: string }
      redact_expired_vapi_recordings: { Args: never; Returns: number }
      redact_sensitive_transcript: {
        Args: { p_transcript: string }
        Returns: string
      }
      release_function_lock: {
        Args: { p_duration_ms?: number; p_function_name: string }
        Returns: undefined
      }
      set_founder_visibility: { Args: { p_enabled: boolean }; Returns: boolean }
      set_podcast_visibility: { Args: { p_enabled: boolean }; Returns: boolean }
      trigger_emergency_lockdown: {
        Args: {
          p_departments?: string[]
          p_reason: string
          p_severity?: Database["public"]["Enums"]["security_severity"]
        }
        Returns: string
      }
      update_partner_banking: {
        Args: {
          p_bank_account?: string
          p_bank_iban?: string
          p_bank_name?: string
          p_partner_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ai_action_status:
        | "pending"
        | "auto_responded"
        | "flagged_for_review"
        | "human_responded"
        | "ignored"
      ai_broker_status: "active" | "paused" | "training" | "offline"
      app_role:
        | "admin"
        | "user"
        | "owner"
        | "broker"
        | "listing_admin"
        | "hr_admin"
        | "broker_jbj"
        | "broker_partner"
        | "client"
        | "support_ops"
      approval_type:
        | "leave_request"
        | "expense_claim"
        | "document_request"
        | "salary_advance"
        | "equipment_request"
        | "training_request"
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
      book_access_level:
        | "broker_only"
        | "broker_jbj_only"
        | "locked_until_first_deal"
        | "public"
      broker_channel: "whatsapp" | "email" | "sms" | "call" | "video"
      broker_conversation_status:
        | "active"
        | "pending_response"
        | "waiting_client"
        | "closed"
        | "escalated"
      broker_task_status: "pending" | "in_progress" | "completed" | "overdue"
      broker_task_type:
        | "developer_visit"
        | "training"
        | "document"
        | "call"
        | "meeting"
        | "other"
      broker_tier: "starter" | "rising" | "performer" | "elite" | "legend"
      broker_training_tier: "probation" | "elite"
      card_status: "active" | "suspended" | "expired"
      checkin_type: "gps_selfie" | "manual_register" | "qr_scan"
      client_tier: "bronze" | "silver" | "gold" | "platinum" | "diamond"
      comm_assistant_type: "owner" | "company"
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
      comm_message_direction: "inbound" | "outbound"
      comm_thread_status:
        | "new"
        | "needs_reply"
        | "waiting"
        | "follow_up_due"
        | "closed"
      compliance_status: "compliant" | "warning" | "violation" | "under_review"
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
      crm_role:
        | "owner_admin"
        | "broker_member"
        | "admin"
        | "founder"
        | "sales_director"
      data_source_type:
        | "dld"
        | "dsc"
        | "central_bank"
        | "property_portal"
        | "news"
        | "global"
        | "internal"
      deal_status:
        | "submitted"
        | "pending_verification"
        | "verified"
        | "rejected"
        | "cancelled"
      esign_audit_action:
        | "created"
        | "sent"
        | "viewed"
        | "signed"
        | "declined"
        | "reminder_sent"
        | "downloaded"
        | "voided"
        | "expired"
        | "completed"
      esign_envelope_status:
        | "draft"
        | "sent"
        | "viewed"
        | "partially_signed"
        | "completed"
        | "declined"
        | "expired"
        | "voided"
      esign_field_type:
        | "signature"
        | "initials"
        | "date"
        | "text"
        | "checkbox"
        | "stamp"
      esign_recipient_status:
        | "pending"
        | "sent"
        | "delivered"
        | "viewed"
        | "signed"
        | "declined"
      hr_application_status: "pending" | "approved" | "rejected"
      hr_module_track: "company_knowledge" | "real_estate_basics"
      hr_question_type: "mcq" | "true_false" | "short_answer"
      hr_role: "broker_candidate" | "broker_member"
      hunt_campaign_status: "draft" | "active" | "paused" | "completed"
      hunt_prospect_status:
        | "new"
        | "contacted"
        | "responded"
        | "qualified"
        | "negotiating"
        | "converted"
        | "rejected"
        | "not_interested"
      hunt_target_type: "investor" | "broker" | "employee"
      leave_status:
        | "pending"
        | "manager_approved"
        | "hr_approved"
        | "owner_approved"
        | "rejected"
        | "cancelled"
      leave_type:
        | "annual"
        | "sick"
        | "unpaid"
        | "maternity"
        | "paternity"
        | "emergency"
        | "bereavement"
        | "public_holiday"
      market_trend: "rising" | "falling" | "stable" | "volatile"
      notification_type:
        | "system"
        | "event"
        | "approval"
        | "reminder"
        | "reward"
        | "deal"
        | "visit"
      opportunity_status:
        | "new"
        | "under_review"
        | "approved"
        | "rejected"
        | "expired"
      partnership_stage:
        | "submitted"
        | "admin_review"
        | "senior_management_review"
        | "ceo_approval"
        | "approved"
        | "rejected"
      points_event_type:
        | "training_complete"
        | "daily_checkin"
        | "developer_visit_checkin"
        | "deal_closed"
        | "referral_bonus"
        | "admin_adjustment"
        | "reward_redeem"
        | "module_complete"
        | "login_streak"
        | "first_deal_bonus"
      prediction_confidence: "low" | "medium" | "high" | "very_high"
      redemption_status: "requested" | "approved" | "delivered" | "rejected"
      reward_type: "points" | "gift" | "badge" | "certificate"
      risk_level: "low" | "medium" | "high" | "critical"
      security_event_type:
        | "login_attempt"
        | "login_success"
        | "login_failure"
        | "unauthorized_access"
        | "permission_change"
        | "data_export"
        | "file_upload"
        | "file_download"
        | "file_modification"
        | "suspicious_activity"
        | "intrusion_detected"
        | "data_leak_attempt"
        | "ethics_violation"
        | "policy_violation"
        | "lockdown_triggered"
      security_severity: "info" | "low" | "medium" | "high" | "critical"
      user_mode: "client" | "broker"
      vip_category:
        | "government_official"
        | "doctor"
        | "lawyer"
        | "architect"
        | "engineer"
        | "phd_holder"
        | "masters_holder"
        | "investor"
        | "existing_buyer"
        | "loyal_customer"
      visit_purpose:
        | "briefing"
        | "general_visit"
        | "client_tour"
        | "deal_closing"
      visit_request_status:
        | "submitted"
        | "approved"
        | "rejected"
        | "completed"
        | "cancelled"
      visitor_role:
        | "broker"
        | "referral_partner"
        | "client"
        | "visitor"
        | "investor"
        | "owner"
        | "broker_partner"
      warning_severity: "verbal" | "written" | "final" | "termination"
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
      ai_broker_status: ["active", "paused", "training", "offline"],
      app_role: [
        "admin",
        "user",
        "owner",
        "broker",
        "listing_admin",
        "hr_admin",
        "broker_jbj",
        "broker_partner",
        "client",
        "support_ops",
      ],
      approval_type: [
        "leave_request",
        "expense_claim",
        "document_request",
        "salary_advance",
        "equipment_request",
        "training_request",
      ],
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
      book_access_level: [
        "broker_only",
        "broker_jbj_only",
        "locked_until_first_deal",
        "public",
      ],
      broker_channel: ["whatsapp", "email", "sms", "call", "video"],
      broker_conversation_status: [
        "active",
        "pending_response",
        "waiting_client",
        "closed",
        "escalated",
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
      broker_tier: ["starter", "rising", "performer", "elite", "legend"],
      broker_training_tier: ["probation", "elite"],
      card_status: ["active", "suspended", "expired"],
      checkin_type: ["gps_selfie", "manual_register", "qr_scan"],
      client_tier: ["bronze", "silver", "gold", "platinum", "diamond"],
      comm_assistant_type: ["owner", "company"],
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
      comm_message_direction: ["inbound", "outbound"],
      comm_thread_status: [
        "new",
        "needs_reply",
        "waiting",
        "follow_up_due",
        "closed",
      ],
      compliance_status: ["compliant", "warning", "violation", "under_review"],
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
      crm_role: [
        "owner_admin",
        "broker_member",
        "admin",
        "founder",
        "sales_director",
      ],
      data_source_type: [
        "dld",
        "dsc",
        "central_bank",
        "property_portal",
        "news",
        "global",
        "internal",
      ],
      deal_status: [
        "submitted",
        "pending_verification",
        "verified",
        "rejected",
        "cancelled",
      ],
      esign_audit_action: [
        "created",
        "sent",
        "viewed",
        "signed",
        "declined",
        "reminder_sent",
        "downloaded",
        "voided",
        "expired",
        "completed",
      ],
      esign_envelope_status: [
        "draft",
        "sent",
        "viewed",
        "partially_signed",
        "completed",
        "declined",
        "expired",
        "voided",
      ],
      esign_field_type: [
        "signature",
        "initials",
        "date",
        "text",
        "checkbox",
        "stamp",
      ],
      esign_recipient_status: [
        "pending",
        "sent",
        "delivered",
        "viewed",
        "signed",
        "declined",
      ],
      hr_application_status: ["pending", "approved", "rejected"],
      hr_module_track: ["company_knowledge", "real_estate_basics"],
      hr_question_type: ["mcq", "true_false", "short_answer"],
      hr_role: ["broker_candidate", "broker_member"],
      hunt_campaign_status: ["draft", "active", "paused", "completed"],
      hunt_prospect_status: [
        "new",
        "contacted",
        "responded",
        "qualified",
        "negotiating",
        "converted",
        "rejected",
        "not_interested",
      ],
      hunt_target_type: ["investor", "broker", "employee"],
      leave_status: [
        "pending",
        "manager_approved",
        "hr_approved",
        "owner_approved",
        "rejected",
        "cancelled",
      ],
      leave_type: [
        "annual",
        "sick",
        "unpaid",
        "maternity",
        "paternity",
        "emergency",
        "bereavement",
        "public_holiday",
      ],
      market_trend: ["rising", "falling", "stable", "volatile"],
      notification_type: [
        "system",
        "event",
        "approval",
        "reminder",
        "reward",
        "deal",
        "visit",
      ],
      opportunity_status: [
        "new",
        "under_review",
        "approved",
        "rejected",
        "expired",
      ],
      partnership_stage: [
        "submitted",
        "admin_review",
        "senior_management_review",
        "ceo_approval",
        "approved",
        "rejected",
      ],
      points_event_type: [
        "training_complete",
        "daily_checkin",
        "developer_visit_checkin",
        "deal_closed",
        "referral_bonus",
        "admin_adjustment",
        "reward_redeem",
        "module_complete",
        "login_streak",
        "first_deal_bonus",
      ],
      prediction_confidence: ["low", "medium", "high", "very_high"],
      redemption_status: ["requested", "approved", "delivered", "rejected"],
      reward_type: ["points", "gift", "badge", "certificate"],
      risk_level: ["low", "medium", "high", "critical"],
      security_event_type: [
        "login_attempt",
        "login_success",
        "login_failure",
        "unauthorized_access",
        "permission_change",
        "data_export",
        "file_upload",
        "file_download",
        "file_modification",
        "suspicious_activity",
        "intrusion_detected",
        "data_leak_attempt",
        "ethics_violation",
        "policy_violation",
        "lockdown_triggered",
      ],
      security_severity: ["info", "low", "medium", "high", "critical"],
      user_mode: ["client", "broker"],
      vip_category: [
        "government_official",
        "doctor",
        "lawyer",
        "architect",
        "engineer",
        "phd_holder",
        "masters_holder",
        "investor",
        "existing_buyer",
        "loyal_customer",
      ],
      visit_purpose: [
        "briefing",
        "general_visit",
        "client_tour",
        "deal_closing",
      ],
      visit_request_status: [
        "submitted",
        "approved",
        "rejected",
        "completed",
        "cancelled",
      ],
      visitor_role: [
        "broker",
        "referral_partner",
        "client",
        "visitor",
        "investor",
        "owner",
        "broker_partner",
      ],
      warning_severity: ["verbal", "written", "final", "termination"],
    },
  },
} as const
