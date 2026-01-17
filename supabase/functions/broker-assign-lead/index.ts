import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateEmployeeAuth, unauthorizedResponse, forbiddenResponse, corsHeaders } from "../_shared/auth-utils.ts";

interface AssignLeadRequest {
  lead_id: string;
  broker_id?: string;
  intent?: 'buy' | 'sell' | 'rent_lease' | 'broker_registration' | 'partner_services';
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

// Map intent to required broker specializations
function getRequiredSpecializations(intent?: string): string[] {
  switch (intent) {
    case 'buy':
      return ['sales', 'off_plan', 'secondary', 'investment'];
    case 'sell':
      return ['sales', 'secondary', 'listings'];
    case 'rent_lease':
      return ['rentals', 'property_management'];
    default:
      return []; // Any broker can handle
  }
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
    const { lead_id, broker_id, intent }: AssignLeadRequest = await req.json();

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

    // Use lead's intent or provided intent
    const leadIntent = intent || lead.intent;
    const requiredSpecs = getRequiredSpecializations(leadIntent);

    let selectedBrokerId: string | null = broker_id || null;
    let assignmentReason = "Manual assignment";
    let slaFlag = false;

    // If no broker specified, use auto-assignment
    if (!selectedBrokerId) {
      // Get active assignment rules
      const { data: rules } = await supabase
        .from("broker_assignment_rules")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: true });

      // Get available brokers with specialization filter
      let brokersQuery = supabase
        .from("ai_brokers")
        .select("*")
        .eq("status", "active");

      const { data: brokers } = await brokersQuery;

      if (!brokers || brokers.length === 0) {
        // No brokers available - queue to Ops with SLA flag
        slaFlag = true;
        console.warn(`No active brokers available for lead ${lead_id}. Queuing to Ops.`);
        
        // Log to audit for Ops queue
        await supabase.from("crm_audit_logs").insert({
          entity_type: "lead_assignment",
          entity_id: lead_id,
          action: "queue_to_ops",
          details: {
            reason: "No active brokers available",
            intent: leadIntent,
            required_specializations: requiredSpecs,
            sla_flag: true,
            timestamp: new Date().toISOString()
          }
        });

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "No active brokers available",
            queued_to_ops: true,
            sla_flag: true 
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Filter brokers by required specialization if intent requires it
      let eligibleBrokers = brokers;
      if (requiredSpecs.length > 0) {
        eligibleBrokers = brokers.filter((b: AIBroker) => {
          const brokerSpecs = b.specialization || [];
          return requiredSpecs.some(spec => brokerSpecs.includes(spec));
        });

        // If no specialized brokers, fall back to all brokers but flag for Ops
        if (eligibleBrokers.length === 0) {
          console.warn(`No brokers with ${requiredSpecs.join('/')} specialization. Using fallback.`);
          eligibleBrokers = brokers;
          slaFlag = true;
          assignmentReason = `Fallback assignment - no ${requiredSpecs.join('/')} specialists available`;
        }
      }

      // Find best broker based on rules
      for (const rule of (rules || []) as AssignmentRule[]) {
        const conditions = rule.conditions;
        let matches = true;

        // Check nationality condition
        if (conditions.nationality && lead.nationality) {
          const nationalities = Array.isArray(conditions.nationality)
            ? conditions.nationality
            : [conditions.nationality];
          matches = matches && nationalities.includes(lead.nationality);
        }

        // Check language condition
        if (conditions.language && lead.preferred_language) {
          const languages = Array.isArray(conditions.language)
            ? conditions.language
            : [conditions.language];
          matches = matches && languages.includes(lead.preferred_language);
        }

        // Check lead source condition
        if (conditions.lead_source && lead.source) {
          const sources = Array.isArray(conditions.lead_source)
            ? conditions.lead_source
            : [conditions.lead_source];
          matches = matches && sources.includes(lead.source);
        }

        // Check intent condition (NEW)
        if (conditions.intent && leadIntent) {
          const intents = Array.isArray(conditions.intent)
            ? conditions.intent
            : [conditions.intent];
          matches = matches && intents.includes(leadIntent);
        }

        if (matches) {
          // Check capacity
          if (rule.max_leads_per_day && rule.current_leads_today >= rule.max_leads_per_day) {
            continue;
          }

          if (rule.assigned_broker_id) {
            const broker = eligibleBrokers.find((b: AIBroker) => b.id === rule.assigned_broker_id);
            if (broker && broker.current_daily_interactions < broker.daily_interaction_limit) {
              selectedBrokerId = broker.id;
              assignmentReason = `Matched rule: ${rule.name}`;
              break;
            }
          } else if (rule.broker_pool && rule.broker_pool.length > 0) {
            const poolBrokers = eligibleBrokers.filter((b: AIBroker) =>
              rule.broker_pool!.includes(b.id) &&
              b.current_daily_interactions < b.daily_interaction_limit
            );

            if (poolBrokers.length > 0) {
              if (rule.assignment_method === "load_balanced") {
                poolBrokers.sort((a: AIBroker, b: AIBroker) =>
                  a.current_daily_interactions - b.current_daily_interactions
                );
              }
              selectedBrokerId = poolBrokers[0].id;
              assignmentReason = `Matched rule: ${rule.name} (${rule.assignment_method})`;
              break;
            }
          }
        }
      }

      // Fallback: load-balanced assignment to any available eligible broker
      if (!selectedBrokerId) {
        const availableBrokers = eligibleBrokers.filter(
          (b: AIBroker) => b.current_daily_interactions < b.daily_interaction_limit
        );

        if (availableBrokers.length > 0) {
          availableBrokers.sort((a: AIBroker, b: AIBroker) =>
            a.current_daily_interactions - b.current_daily_interactions
          );
          selectedBrokerId = availableBrokers[0].id;
          assignmentReason = `Auto-assigned (load balanced${requiredSpecs.length > 0 ? `, filtered by: ${requiredSpecs.join('/')}` : ''})`;
        }
      }
    }

    // If still no broker, queue to Ops
    if (!selectedBrokerId) {
      await supabase.from("crm_audit_logs").insert({
        entity_type: "lead_assignment",
        entity_id: lead_id,
        action: "queue_to_ops",
        details: {
          reason: "No available broker with capacity",
          intent: leadIntent,
          required_specializations: requiredSpecs,
          sla_flag: true,
          timestamp: new Date().toISOString()
        }
      });

      return new Response(
        JSON.stringify({ 
          error: "No available broker with capacity",
          queued_to_ops: true,
          sla_flag: true 
        }),
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
      assigned_to_user_id: selectedBrokerId,
      assigned_by_user_id: authResult.userId,
    });

    // Determine pipeline based on intent
    const pipeline = leadIntent === 'buy' ? 'buy_pipeline' :
                     leadIntent === 'sell' ? 'sell_pipeline' :
                     leadIntent === 'rent_lease' ? 'rent_lease_pipeline' :
                     leadIntent === 'broker_registration' ? 'hr_pipeline' :
                     leadIntent === 'partner_services' ? 'partner_services_pipeline' : 'general_pipeline';

    // Update lead with AI broker assignment and pipeline
    await supabase
      .from("crm_leads")
      .update({
        assigned_ai_employee_id: selectedBrokerId,
        owner_type: "company_assigned",
        intent: leadIntent || lead.intent,
        pipeline: pipeline,
        metadata: {
          ...lead.metadata,
          assignment_reason: assignmentReason,
          sla_flag: slaFlag,
          assigned_at: new Date().toISOString()
        }
      })
      .eq("id", lead_id);

    // Update broker stats
    await supabase
      .from("ai_brokers")
      .update({
        total_leads_handled: (selectedBroker?.total_leads_handled || 0) + 1,
      })
      .eq("id", selectedBrokerId);

    // Update daily stats with intent-specific tracking
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("broker_daily_stats").upsert(
      {
        broker_id: selectedBrokerId,
        stat_date: today,
        leads_contacted: 1,
      },
      { onConflict: "broker_id,stat_date" }
    );

    // Log the assignment
    await supabase.from("crm_audit_logs").insert({
      entity_type: "lead_assignment",
      entity_id: lead_id,
      action: "assign",
      details: {
        broker_id: selectedBrokerId,
        broker_name: selectedBroker?.name,
        intent: leadIntent,
        pipeline: pipeline,
        assignment_reason: assignmentReason,
        sla_flag: slaFlag,
        assigned_by: authResult.email,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`Lead ${lead_id} (${leadIntent}) assigned to broker ${selectedBroker?.name} -> ${pipeline}`);

    return new Response(
      JSON.stringify({
        success: true,
        lead_id,
        assigned_broker_id: selectedBrokerId,
        broker_name: selectedBroker?.name,
        broker_specializations: selectedBroker?.specialization,
        intent: leadIntent,
        pipeline: pipeline,
        assignment_reason: assignmentReason,
        sla_flag: slaFlag,
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
