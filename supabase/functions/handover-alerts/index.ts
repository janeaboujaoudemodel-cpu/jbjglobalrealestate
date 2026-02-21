import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date();
    const alertWindows = [
      { days: 30, label: "30 days until handover" },
      { days: 14, label: "2 weeks until handover" },
      { days: 7, label: "1 week until handover" },
      { days: 0, label: "Handover date today" },
    ];

    let totalAlerts = 0;

    for (const window of alertWindows) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + window.days);
      const dateStr = targetDate.toISOString().split("T")[0];

      // Find investors with handover on this date who haven't been alerted yet
      const { data: investors } = await supabase
        .from("client_investors")
        .select("id, client_name, project_name, project_id, unit_number, unit_type, handover_date, email, phone")
        .eq("handover_date", dateStr)
        .eq("handover_alert_sent", false);

      if (!investors?.length) continue;

      // Create alerts
      const alerts = investors.map((inv) => ({
        investor_id: inv.id,
        project_id: inv.project_id,
        alert_type: `handover_${window.days}d`,
        alert_message: `${window.label}: ${inv.client_name} - ${inv.project_name} (Unit ${inv.unit_number || "N/A"})`,
        investor_name: inv.client_name,
        project_name: inv.project_name,
        unit_info: `${inv.unit_type || ""} ${inv.unit_number || ""}`.trim(),
        contact_email: inv.email,
        contact_phone: inv.phone,
        handover_date: inv.handover_date,
        is_read: false,
      }));

      const { error: alertErr } = await supabase
        .from("handover_alerts")
        .insert(alerts);

      if (alertErr) {
        console.error(`Alert insert error for ${window.days}d window:`, alertErr);
        continue;
      }

      // Mark investors as alerted (only for 0-day alerts to avoid re-alerting)
      if (window.days === 0) {
        const investorIds = investors.map((inv) => inv.id);
        await supabase
          .from("client_investors")
          .update({ handover_alert_sent: true })
          .in("id", investorIds);
      }

      totalAlerts += alerts.length;
    }

    return new Response(JSON.stringify({
      success: true,
      alerts_created: totalAlerts,
      checked_at: today.toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Handover alerts error:", e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
