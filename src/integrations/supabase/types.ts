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
          created_at: string
          created_by_user_id: string | null
          current_location_city: string | null
          current_location_country: string | null
          email_lower: string | null
          full_name: string
          gender: string | null
          id: string
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
          created_at?: string
          created_by_user_id?: string | null
          current_location_city?: string | null
          current_location_country?: string | null
          email_lower?: string | null
          full_name: string
          gender?: string | null
          id?: string
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
          created_at?: string
          created_by_user_id?: string | null
          current_location_city?: string | null
          current_location_country?: string | null
          email_lower?: string | null
          full_name?: string
          gender?: string | null
          id?: string
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
      leads: {
        Row: {
          age_range: string | null
          consent_accurate: boolean | null
          consent_privacy: boolean | null
          created_at: string
          current_location: string | null
          email: string
          full_name: string | null
          id: string
          language: string | null
          nationality: string | null
          page_source: string | null
          phone: string | null
          source: string
          status: string | null
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          consent_accurate?: boolean | null
          consent_privacy?: boolean | null
          created_at?: string
          current_location?: string | null
          email: string
          full_name?: string | null
          id?: string
          language?: string | null
          nationality?: string | null
          page_source?: string | null
          phone?: string | null
          source: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          consent_accurate?: boolean | null
          consent_privacy?: boolean | null
          created_at?: string
          current_location?: string | null
          email?: string
          full_name?: string | null
          id?: string
          language?: string | null
          nationality?: string | null
          page_source?: string | null
          phone?: string | null
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
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_crm_lead: {
        Args: { _lead_id: string; _user_id: string }
        Returns: boolean
      }
      get_hr_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["hr_role"]
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
    }
    Enums: {
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
      crm_role: "owner_admin" | "broker_member"
      hr_application_status: "pending" | "approved" | "rejected"
      hr_module_track: "company_knowledge" | "real_estate_basics"
      hr_question_type: "mcq" | "true_false" | "short_answer"
      hr_role: "broker_candidate" | "broker_member"
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
      crm_role: ["owner_admin", "broker_member"],
      hr_application_status: ["pending", "approved", "rejected"],
      hr_module_track: ["company_knowledge", "real_estate_basics"],
      hr_question_type: ["mcq", "true_false", "short_answer"],
      hr_role: ["broker_candidate", "broker_member"],
    },
  },
} as const
