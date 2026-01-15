import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateEmployeeAuth, unauthorizedResponse, forbiddenResponse, corsHeaders } from "../_shared/auth-utils.ts";

// Resend API helper (no npm import needed)
async function sendEmail(apiKey: string, options: {
  from: string;
  to: string[];
  subject: string;
  html: string;
}): Promise<{ data?: { id: string }; error?: Error }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: new Error(errorText) };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error("Unknown error") };
  }
}

interface SendEmailRequest {
  broker_id: string;
  lead_id?: string;
  to_email: string;
  to_name?: string;
  template_id?: string;
  subject?: string;
  html_content?: string;
  variables?: Record<string, string>;
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const {
      broker_id,
      lead_id,
      to_email,
      to_name,
      template_id,
      subject,
      html_content,
      variables = {},
    }: SendEmailRequest = await req.json();

    if (!broker_id || !to_email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: broker_id, to_email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get broker details
    const { data: broker, error: brokerError } = await supabase
      .from("ai_brokers")
      .select("*")
      .eq("id", broker_id)
      .single();

    if (brokerError || !broker) {
      return new Response(
        JSON.stringify({ error: "Broker not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get template if provided
    let emailSubject = subject || "Message from JBJ Global Real Estate";
    let emailHtml = html_content || "";

    if (template_id) {
      const { data: template, error: templateError } = await supabase
        .from("broker_email_templates")
        .select("*")
        .eq("id", template_id)
        .single();

      if (!templateError && template) {
        emailSubject = template.subject;
        emailHtml = template.html_content;
      }
    }

    // Replace variables in template
    const allVariables = {
      ...variables,
      broker_name: broker.name,
      broker_email: broker.email,
      client_name: to_name || "Valued Client",
    };

    for (const [key, value] of Object.entries(allVariables)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      emailSubject = emailSubject.replace(regex, value);
      emailHtml = emailHtml.replace(regex, value);
    }

    // Check message filters on content
    const { data: filters } = await supabase
      .from("broker_message_filters")
      .select("*")
      .eq("is_active", true);

    let wasFiltered = false;
    let filterReason = "";

    if (filters) {
      for (const filter of filters) {
        const lowerContent = emailHtml.toLowerCase();
        const lowerValue = filter.filter_value.toLowerCase();

        if (lowerContent.includes(lowerValue)) {
          if (filter.severity === "block") {
            return new Response(
              JSON.stringify({
                success: false,
                filtered: true,
                reason: `Email contains restricted content: ${filter.filter_type} "${filter.filter_value}"`,
              }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          wasFiltered = true;
          filterReason = `Contains ${filter.filter_type}: ${filter.filter_value}`;
        }
      }
    }

    // Send email via Resend
    const emailResponse = await sendEmail(resendApiKey, {
      from: `${broker.name} <${broker.email}>`,
      to: [to_email],
      subject: emailSubject,
      html: emailHtml,
    });

    if (emailResponse.error) {
      throw emailResponse.error;
    }

    console.log(`Email sent by employee ${authResult.email} via broker ${broker.name}:`, emailResponse);

    // Get or create conversation
    let conversation;
    const { data: existingConv } = await supabase
      .from("broker_conversations")
      .select("*")
      .eq("broker_id", broker_id)
      .eq("client_identifier", to_email)
      .eq("channel", "email")
      .eq("status", "active")
      .single();

    if (existingConv) {
      conversation = existingConv;
    } else {
      const { data: newConv } = await supabase
        .from("broker_conversations")
        .insert({
          broker_id,
          lead_id,
          channel: "email",
          client_identifier: to_email,
          status: "active",
        })
        .select()
        .single();
      conversation = newConv;
    }

    // Log the message
    if (conversation) {
      await supabase.from("broker_messages").insert({
        conversation_id: conversation.id,
        broker_id,
        direction: "outbound",
        content: emailHtml,
        content_type: "text",
        was_filtered: wasFiltered,
        filter_reason: wasFiltered ? filterReason : null,
        delivery_status: "sent",
        delivered_at: new Date().toISOString(),
      });

      // Update conversation
      await supabase
        .from("broker_conversations")
        .update({
          last_message_at: new Date().toISOString(),
          message_count: (conversation.message_count || 0) + 1,
        })
        .eq("id", conversation.id);
    }

    // Update daily stats
    const today = new Date().toISOString().split("T")[0];
    const { data: existingStats } = await supabase
      .from("broker_daily_stats")
      .select("*")
      .eq("broker_id", broker_id)
      .eq("stat_date", today)
      .single();

    if (existingStats) {
      await supabase
        .from("broker_daily_stats")
        .update({ emails_sent: (existingStats.emails_sent || 0) + 1 })
        .eq("id", existingStats.id);
    } else {
      await supabase.from("broker_daily_stats").insert({
        broker_id,
        stat_date: today,
        emails_sent: 1,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        email_id: emailResponse.data?.id,
        broker_name: broker.name,
        filtered: wasFiltered,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Broker send email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to send email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
