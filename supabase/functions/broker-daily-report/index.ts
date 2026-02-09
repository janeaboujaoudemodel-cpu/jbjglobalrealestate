import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { validateEmployeeAuth, unauthorizedResponse, forbiddenResponse, corsHeaders } from "../_shared/auth-utils.ts";

interface BrokerStats {
  broker_name: string;
  broker_email: string;
  leads_contacted: number;
  messages_sent: number;
  emails_sent: number;
  calls_made: number;
  leads_converted: number;
  capacity: number;
  active_leads: number;
  status: string;
}

// HTML Email template for daily report
function generateReportHtml(brokerStats: BrokerStats[], date: string, capacityAlerts: string[]): string {
  const totalStats = brokerStats.reduce(
    (acc, stat) => ({
      leads_contacted: acc.leads_contacted + (stat.leads_contacted || 0),
      messages_sent: acc.messages_sent + (stat.messages_sent || 0),
      emails_sent: acc.emails_sent + (stat.emails_sent || 0),
      calls_made: acc.calls_made + (stat.calls_made || 0),
      leads_converted: acc.leads_converted + (stat.leads_converted || 0),
    }),
    { leads_contacted: 0, messages_sent: 0, emails_sent: 0, calls_made: 0, leads_converted: 0 }
  );

  const brokerRows = brokerStats
    .map(
      (stat) => {
        const capacityUsage = stat.capacity > 0 ? Math.round((stat.active_leads / stat.capacity) * 100) : 0;
        const capacityColor = capacityUsage > 90 ? "#EF4444" : capacityUsage > 70 ? "#F59E0B" : "#22C55E";
        return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #333; color: #fff;">
          ${stat.broker_name}
          <br><span style="font-size: 11px; color: #888;">${stat.broker_email}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #333; text-align: center;">
          <span style="color: ${stat.status === 'active' ? '#22C55E' : '#F59E0B'}; font-weight: 500;">
            ${stat.status.toUpperCase()}
          </span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #333; color: #fff; text-align: center;">${stat.leads_contacted || 0}</td>
        <td style="padding: 12px; border-bottom: 1px solid #333; color: #22c55e; text-align: center;">${stat.messages_sent || 0}</td>
        <td style="padding: 12px; border-bottom: 1px solid #333; color: #3b82f6; text-align: center;">${stat.emails_sent || 0}</td>
        <td style="padding: 12px; border-bottom: 1px solid #333; color: #a855f7; text-align: center;">${stat.calls_made || 0}</td>
        <td style="padding: 12px; border-bottom: 1px solid #333; color: #D4AF37; text-align: center; font-weight: bold;">${stat.leads_converted || 0}</td>
        <td style="padding: 12px; border-bottom: 1px solid #333; text-align: center;">
          <span style="color: ${capacityColor}; font-weight: 500;">${stat.active_leads}/${stat.capacity}</span>
          <br><span style="font-size: 11px; color: ${capacityColor};">${capacityUsage}%</span>
        </td>
      </tr>
    `;
      }
    )
    .join("");

  const alertsSection = capacityAlerts.length > 0 ? `
    <!-- Capacity Alerts -->
    <div style="background: #7F1D1D; border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid #DC2626;">
      <h3 style="color: #FECACA; font-size: 16px; margin: 0 0 12px 0;">⚠️ Capacity Alerts</h3>
      <ul style="color: #FCA5A5; margin: 0; padding-left: 20px; font-size: 14px;">
        ${capacityAlerts.map(alert => `<li style="margin-bottom: 8px;">${alert}</li>`).join('')}
      </ul>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Daily Broker Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000; font-family: 'Inter', Arial, sans-serif;">
  <div style="max-width: 800px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #D4AF37; font-size: 28px; margin: 0; letter-spacing: 2px;">JBJ GLOBAL REAL ESTATE</h1>
      <p style="color: #888; margin-top: 10px; font-size: 14px;">Daily Broker Performance Report</p>
    </div>

    <!-- Date Banner -->
    <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8962E 100%); border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
      <p style="color: #000; font-size: 18px; margin: 0; font-weight: 600;">${date}</p>
    </div>

    ${alertsSection}

    <!-- Summary Cards -->
    <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 30px;">
      <div style="flex: 1; min-width: 120px; background: #1a1a1a; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #333;">
        <p style="color: #888; font-size: 12px; margin: 0 0 8px 0;">LEADS CONTACTED</p>
        <p style="color: #fff; font-size: 28px; margin: 0; font-weight: bold;">${totalStats.leads_contacted}</p>
      </div>
      <div style="flex: 1; min-width: 120px; background: #1a1a1a; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #333;">
        <p style="color: #888; font-size: 12px; margin: 0 0 8px 0;">MESSAGES SENT</p>
        <p style="color: #22c55e; font-size: 28px; margin: 0; font-weight: bold;">${totalStats.messages_sent}</p>
      </div>
      <div style="flex: 1; min-width: 120px; background: #1a1a1a; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #333;">
        <p style="color: #888; font-size: 12px; margin: 0 0 8px 0;">EMAILS SENT</p>
        <p style="color: #3b82f6; font-size: 28px; margin: 0; font-weight: bold;">${totalStats.emails_sent}</p>
      </div>
      <div style="flex: 1; min-width: 120px; background: #1a1a1a; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #333;">
        <p style="color: #888; font-size: 12px; margin: 0 0 8px 0;">CALLS MADE</p>
        <p style="color: #a855f7; font-size: 28px; margin: 0; font-weight: bold;">${totalStats.calls_made}</p>
      </div>
      <div style="flex: 1; min-width: 120px; background: #1a1a1a; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #D4AF37;">
        <p style="color: #888; font-size: 12px; margin: 0 0 8px 0;">CONVERSIONS</p>
        <p style="color: #D4AF37; font-size: 28px; margin: 0; font-weight: bold;">${totalStats.leads_converted}</p>
      </div>
    </div>

    <!-- Broker Breakdown Table -->
    <div style="background: #1a1a1a; border-radius: 8px; overflow: hidden; border: 1px solid #333;">
      <div style="padding: 16px 20px; border-bottom: 1px solid #333;">
        <h2 style="color: #fff; font-size: 16px; margin: 0;">Broker Performance Breakdown</h2>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #0a0a0a;">
            <th style="padding: 12px; text-align: left; color: #888; font-size: 12px; font-weight: 500;">BROKER</th>
            <th style="padding: 12px; text-align: center; color: #888; font-size: 12px; font-weight: 500;">STATUS</th>
            <th style="padding: 12px; text-align: center; color: #888; font-size: 12px; font-weight: 500;">LEADS</th>
            <th style="padding: 12px; text-align: center; color: #888; font-size: 12px; font-weight: 500;">MESSAGES</th>
            <th style="padding: 12px; text-align: center; color: #888; font-size: 12px; font-weight: 500;">EMAILS</th>
            <th style="padding: 12px; text-align: center; color: #888; font-size: 12px; font-weight: 500;">CALLS</th>
            <th style="padding: 12px; text-align: center; color: #888; font-size: 12px; font-weight: 500;">CONV.</th>
            <th style="padding: 12px; text-align: center; color: #888; font-size: 12px; font-weight: 500;">CAPACITY</th>
          </tr>
        </thead>
        <tbody>
          ${brokerRows}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #333;">
      <p style="color: #666; font-size: 12px; margin: 0;">
        This is an automated report generated at 8:00 PM GST daily.
      </p>
      <p style="color: #888; font-size: 12px; margin: 10px 0 0 0;">
        <a href="mailto:contact@JBJ.ae" style="color: #D4AF37; text-decoration: none;">contact@JBJ.ae</a> | 
        <a href="tel:+971565911000" style="color: #D4AF37; text-decoration: none;">+971 56 591 1000</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

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
      console.error("Resend API error:", errorText);
      return { error: new Error(errorText) };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error("Unknown error") };
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split("T")[0];
    const formattedDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Get JBJ brokers (human brokers)
    const { data: jbjBrokers, error: jbjError } = await supabase
      .from("jbj_brokers")
      .select("id, name, email, avatar_url, capacity, active_leads, status, specialization")
      .order("name");

    if (jbjError) {
      console.error("Error fetching JBJ brokers:", jbjError);
    }

    // Get AI brokers
    const { data: aiBrokers, error: aiError } = await supabase
      .from("ai_brokers")
      .select("id, name, email, status, daily_interaction_limit, current_daily_interactions, total_leads_handled, total_conversions")
      .in("status", ["active", "paused"]);

    if (aiError) {
      console.error("Error fetching AI brokers:", aiError);
    }

    // Get today's messages from jbj_messages
    const { data: jbjMessages } = await supabase
      .from("jbj_messages")
      .select("broker_id, channel")
      .gte("created_at", `${today}T00:00:00`);

    // Get broker daily stats for AI brokers
    const { data: dailyStats } = await supabase
      .from("broker_daily_stats")
      .select("*")
      .eq("stat_date", today);

    // Build broker stats array
    const brokerStats: BrokerStats[] = [];
    const capacityAlerts: string[] = [];

    // Process JBJ brokers
    if (jbjBrokers) {
      for (const broker of jbjBrokers) {
        const brokerMessages = jbjMessages?.filter(m => m.broker_id === broker.id) || [];
        const messagesCount = brokerMessages.filter(m => m.channel === "whatsapp").length;
        const emailsCount = brokerMessages.filter(m => m.channel === "email").length;
        const callsCount = brokerMessages.filter(m => m.channel === "call").length;
        
        const capacityUsage = broker.capacity > 0 ? (broker.active_leads / broker.capacity) * 100 : 0;
        
        if (capacityUsage >= 90) {
          capacityAlerts.push(`${broker.name} has reached ${Math.round(capacityUsage)}% capacity (${broker.active_leads}/${broker.capacity} leads)`);
        }

        brokerStats.push({
          broker_name: broker.name,
          broker_email: broker.email,
          leads_contacted: broker.active_leads,
          messages_sent: messagesCount,
          emails_sent: emailsCount,
          calls_made: callsCount,
          leads_converted: 0,
          capacity: broker.capacity,
          active_leads: broker.active_leads,
          status: broker.status,
        });
      }
    }

    // Process AI brokers
    if (aiBrokers) {
      for (const broker of aiBrokers) {
        const stats = dailyStats?.find(s => s.broker_id === broker.id);
        const capacityUsage = broker.daily_interaction_limit > 0 
          ? (broker.current_daily_interactions / broker.daily_interaction_limit) * 100 
          : 0;

        if (capacityUsage >= 90) {
          capacityAlerts.push(`AI Broker ${broker.name} has reached ${Math.round(capacityUsage)}% daily capacity`);
        }

        brokerStats.push({
          broker_name: `🤖 ${broker.name}`,
          broker_email: broker.email,
          leads_contacted: stats?.leads_contacted || 0,
          messages_sent: stats?.messages_sent || 0,
          emails_sent: stats?.emails_sent || 0,
          calls_made: stats?.calls_made || 0,
          leads_converted: stats?.leads_converted || 0,
          capacity: broker.daily_interaction_limit || 150,
          active_leads: broker.current_daily_interactions || 0,
          status: broker.status,
        });
      }
    }

    if (brokerStats.length === 0) {
      console.log("No brokers found to report on");
      return new Response(
        JSON.stringify({ success: true, message: "No brokers found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate HTML report
    const reportHtml = generateReportHtml(brokerStats, formattedDate, capacityAlerts);

    // Get admin emails
    const { data: admins } = await supabase
      .from("crm_users_profile")
      .select("email")
      .in("crm_role", ["owner_admin", "founder", "admin"])
      .eq("is_active", true);

    const adminEmails = admins?.map(a => a.email).filter(Boolean) || [];
    
    // Fallback recipients including founder
    const recipients = adminEmails.length > 0 
      ? adminEmails 
      : ["admin@JBJ.ae"];

    console.log(`Daily report triggered by ${authResult.email}. Sending to ${recipients.length} recipients:`, recipients);
    console.log(`Report includes ${brokerStats.length} brokers with ${capacityAlerts.length} capacity alerts`);

    // Send the email
    const emailResult = await sendEmail(resendApiKey, {
      from: "JBJ Reports <NOREPLY@JBJ.AE>",
      to: recipients,
      subject: `📊 Daily Broker Report - ${formattedDate}${capacityAlerts.length > 0 ? ' ⚠️' : ''}`,
      html: reportHtml,
    });

    if (emailResult.error) {
      console.error("Failed to send report email:", emailResult.error);
      throw emailResult.error;
    }

    console.log("Daily report sent successfully:", emailResult.data?.id);

    // Reset daily interaction counts for AI brokers
    if (aiBrokers && aiBrokers.length > 0) {
      await supabase
        .from("ai_brokers")
        .update({ current_daily_interactions: 0 })
        .in("id", aiBrokers.map(b => b.id));
    }

    // Log the report in jbj_daily_reports
    await supabase.from("jbj_daily_reports").insert({
      report_date: today,
      report_data: {
        brokerStats,
        capacityAlerts,
        totalLeads: brokerStats.reduce((sum, b) => sum + b.leads_contacted, 0),
        totalMessages: brokerStats.reduce((sum, b) => sum + b.messages_sent, 0),
        totalEmails: brokerStats.reduce((sum, b) => sum + b.emails_sent, 0),
        totalCalls: brokerStats.reduce((sum, b) => sum + b.calls_made, 0),
        totalConversions: brokerStats.reduce((sum, b) => sum + b.leads_converted, 0),
      },
      sent_to: recipients,
      sent_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        email_id: emailResult.data?.id,
        recipients: recipients.length,
        brokers_reported: brokerStats.length,
        capacity_alerts: capacityAlerts.length,
        date: today,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Daily report error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to send daily report" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
