import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML Email template for daily report
function generateReportHtml(brokerStats: any[], date: string): string {
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
      (stat) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #333; color: #fff;">${stat.broker_name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #333; color: #fff; text-align: center;">${stat.leads_contacted || 0}</td>
        <td style="padding: 12px; border-bottom: 1px solid #333; color: #22c55e; text-align: center;">${stat.messages_sent || 0}</td>
        <td style="padding: 12px; border-bottom: 1px solid #333; color: #3b82f6; text-align: center;">${stat.emails_sent || 0}</td>
        <td style="padding: 12px; border-bottom: 1px solid #333; color: #a855f7; text-align: center;">${stat.calls_made || 0}</td>
        <td style="padding: 12px; border-bottom: 1px solid #333; color: #D4AF37; text-align: center; font-weight: bold;">${stat.leads_converted || 0}</td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Daily Broker Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000; font-family: 'Inter', Arial, sans-serif;">
  <div style="max-width: 700px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #D4AF37; font-size: 28px; margin: 0; letter-spacing: 2px;">JBJ GLOBAL REAL ESTATE</h1>
      <p style="color: #888; margin-top: 10px; font-size: 14px;">Daily AI Broker Performance Report</p>
    </div>

    <!-- Date Banner -->
    <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8962E 100%); border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
      <p style="color: #000; font-size: 18px; margin: 0; font-weight: 600;">${date}</p>
    </div>

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
            <th style="padding: 12px; text-align: center; color: #888; font-size: 12px; font-weight: 500;">LEADS</th>
            <th style="padding: 12px; text-align: center; color: #888; font-size: 12px; font-weight: 500;">MESSAGES</th>
            <th style="padding: 12px; text-align: center; color: #888; font-size: 12px; font-weight: 500;">EMAILS</th>
            <th style="padding: 12px; text-align: center; color: #888; font-size: 12px; font-weight: 500;">CALLS</th>
            <th style="padding: 12px; text-align: center; color: #888; font-size: 12px; font-weight: 500;">CONVERSIONS</th>
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
        This is an automated report from JBJ Global Real Estate AI Broker System.
      </p>
      <p style="color: #888; font-size: 12px; margin: 10px 0 0 0;">
        <a href="mailto:contact@jbj.ae" style="color: #D4AF37; text-decoration: none;">contact@jbj.ae</a> | 
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

    // Get all active brokers
    const { data: brokers, error: brokersError } = await supabase
      .from("ai_brokers")
      .select("id, name, email, status")
      .in("status", ["active", "paused"]);

    if (brokersError) throw brokersError;

    if (!brokers || brokers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No brokers found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get daily stats for all brokers
    const { data: dailyStats, error: statsError } = await supabase
      .from("broker_daily_stats")
      .select("*")
      .eq("stat_date", today)
      .in("broker_id", brokers.map((b) => b.id));

    if (statsError) throw statsError;

    // Merge broker info with stats
    const brokerStats = brokers.map((broker) => {
      const stats = dailyStats?.find((s) => s.broker_id === broker.id);
      return {
        broker_name: broker.name,
        broker_email: broker.email,
        leads_contacted: stats?.leads_contacted || 0,
        messages_sent: stats?.messages_sent || 0,
        emails_sent: stats?.emails_sent || 0,
        calls_made: stats?.calls_made || 0,
        leads_converted: stats?.leads_converted || 0,
        avg_response_time_seconds: stats?.avg_response_time_seconds || null,
      };
    });

    // Generate HTML report
    const reportHtml = generateReportHtml(brokerStats, formattedDate);

    // Get admin emails from CRM users with admin roles
    const { data: admins } = await supabase
      .from("crm_users_profile")
      .select("email")
      .in("crm_role", ["owner_admin", "founder", "admin"])
      .eq("is_active", true);

    // Default recipients if no admins found
    const adminEmails = admins?.map((a) => a.email).filter(Boolean) || [];
    const recipients = adminEmails.length > 0 
      ? adminEmails 
      : ["admin@jbj.ae"]; // Fallback email

    console.log(`Sending daily report to ${recipients.length} recipients:`, recipients);

    // Send the email
    const emailResult = await sendEmail(resendApiKey, {
      from: "JBJ Broker Reports <reports@jbj.ae>",
      to: recipients,
      subject: `AI Broker Daily Report - ${formattedDate}`,
      html: reportHtml,
    });

    if (emailResult.error) {
      console.error("Failed to send report email:", emailResult.error);
      throw emailResult.error;
    }

    console.log("Daily report sent successfully:", emailResult.data?.id);

    // Reset daily interaction counts for all brokers (for next day)
    // This is typically called at end of day / beginning of new day
    await supabase
      .from("ai_brokers")
      .update({ current_daily_interactions: 0 })
      .in("id", brokers.map((b) => b.id));

    return new Response(
      JSON.stringify({
        success: true,
        email_id: emailResult.data?.id,
        recipients: recipients.length,
        brokers_reported: brokerStats.length,
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
