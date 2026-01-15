import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateEmployeeAuth, unauthorizedResponse, forbiddenResponse, corsHeaders } from "../_shared/auth-utils.ts";

interface AssignLeadRequest {
  lead_id: string;
  broker_id?: string; // Optional - if not provided, use auto-assignment
}

interface AIBroker {
  id: string;
  name: string;
  status: string;
  daily_interaction_limit: number;
  current_daily_interactions: number;
  languages: string[];
  specialization: string[];
}

interface AssignmentRule {
  id: string;
  name: string;
  priority: number;
  conditions: Record<string, any>;
  assigned_broker_id: string | null;
  broker_pool: string[] | null;
  assignment_method: string;
  max_leads_per_day: number | null;
  current_leads_today: number;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ============ AUTHENTICATION CHECK ============
  const authResult = await validateEmployeeAuth(req);
  
  if (!authResult.authenticated) {
    return unauthorizedResponse(authResult.error);
  }
  
  if (!authResult.isEmployee) {
    return forbiddenResponse(authResult.error);
  }
  // ============ END AUTH CHECK ============

  try {
    const { lead_id, broker_id }: AssignLeadRequest = await req.json();

    if (!lead_id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: lead_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get lead details
    const { data: lead, error: leadError } = await supabase
      .from("crm_leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let selectedBrokerId: string | null = broker_id || null;
    let assignmentReason = "Manual assignment";

    // If no broker specified, use auto-assignment
    if (!selectedBrokerId) {
      // Get active assignment rules
      const { data: rules } = await supabase
        .from("broker_assignment_rules")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: true });

      // Get available brokers
      const { data: brokers } = await supabase
        .from("ai_brokers")
        .select("*")
        .eq("status", "active");

      if (!brokers || brokers.length === 0) {
        return new Response(
          JSON.stringify({ error: "No active brokers available" }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find best broker based on rules
      for (const rule of (rules || []) as AssignmentRule[]) {
        // Check if rule matches lead conditions
        const conditions = rule.conditions;
        let matches = true;

        if (conditions.nationality && lead.nationality) {
          const nationalities = Array.isArray(conditions.nationality)
            ? conditions.nationality
            : [conditions.nationality];
          matches = matches && nationalities.includes(lead.nationality);
        }

        if (conditions.language && lead.preferred_language) {
          const languages = Array.isArray(conditions.language)
            ? conditions.language
            : [conditions.language];
          matches = matches && languages.includes(lead.preferred_language);
        }

        if (conditions.lead_source && lead.source) {
          const sources = Array.isArray(conditions.lead_source)
            ? conditions.lead_source
            : [conditions.lead_source];
          matches = matches && sources.includes(lead.source);
        }

        if (matches) {
          // Check capacity
          if (rule.max_leads_per_day && rule.current_leads_today >= rule.max_leads_per_day) {
            continue;
          }

          if (rule.assigned_broker_id) {
            // Single broker assignment
            const broker = brokers.find((b: AIBroker) => b.id === rule.assigned_broker_id);
            if (broker && broker.current_daily_interactions < broker.daily_interaction_limit) {
              selectedBrokerId = broker.id;
              assignmentReason = `Matched rule: ${rule.name}`;
              break;
            }
          } else if (rule.broker_pool && rule.broker_pool.length > 0) {
            // Pool assignment (round-robin or load-balanced)
            const poolBrokers = brokers.filter((b: AIBroker) =>
              rule.broker_pool!.includes(b.id) &&
              b.current_daily_interactions < b.daily_interaction_limit
            );

            if (poolBrokers.length > 0) {
              if (rule.assignment_method === "load_balanced") {
                // Pick broker with lowest current load
                poolBrokers.sort((a: AIBroker, b: AIBroker) =>
                  a.current_daily_interactions - b.current_daily_interactions
                );
              }
              // Round-robin or load-balanced: pick first available
              selectedBrokerId = poolBrokers[0].id;
              assignmentReason = `Matched rule: ${rule.name} (${rule.assignment_method})`;
              break;
            }
          }
        }
      }

      // Fallback: load-balanced assignment to any available broker
      if (!selectedBrokerId) {
        const availableBrokers = brokers.filter(
          (b: AIBroker) => b.current_daily_interactions < b.daily_interaction_limit
        );

        if (availableBrokers.length > 0) {
          availableBrokers.sort((a: AIBroker, b: AIBroker) =>
            a.current_daily_interactions - b.current_daily_interactions
          );
          selectedBrokerId = availableBrokers[0].id;
          assignmentReason = "Auto-assigned (load balanced)";
        }
      }
    }

    if (!selectedBrokerId) {
      return new Response(
        JSON.stringify({ error: "No available broker with capacity" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get selected broker details
    const { data: selectedBroker } = await supabase
      .from("ai_brokers")
      .select("*")
      .eq("id", selectedBrokerId)
      .single();

    // Create lead assignment record
    await supabase.from("crm_lead_assignments").insert({
      lead_id,
      assigned_to_user_id: selectedBrokerId, // Using broker ID (they act as virtual users)
      assigned_by_user_id: authResult.userId, // Track who made the assignment
    });

    // Update lead with AI broker assignment
    await supabase
      .from("crm_leads")
      .update({
        assigned_ai_employee_id: selectedBrokerId,
        owner_type: "company_assigned",
      })
      .eq("id", lead_id);

    // Update broker stats
    await supabase
      .from("ai_brokers")
      .update({
        total_leads_handled: (selectedBroker?.total_leads_handled || 0) + 1,
      })
      .eq("id", selectedBrokerId);

    // Update daily stats
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("broker_daily_stats").upsert(
      {
        broker_id: selectedBrokerId,
        stat_date: today,
        leads_contacted: 1,
      },
      { onConflict: "broker_id,stat_date" }
    );

    console.log(`Lead ${lead_id} assigned to broker ${selectedBroker?.name} by employee ${authResult.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        lead_id,
        assigned_broker_id: selectedBrokerId,
        broker_name: selectedBroker?.name,
        assignment_reason: assignmentReason,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Broker assign lead error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to assign lead" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
