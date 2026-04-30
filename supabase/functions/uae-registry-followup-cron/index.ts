// Daily cron: schedules follow-ups (D+2, D+5, D+10) and marks No Response at D+14.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Allow cron (service role) or owner
  const authHeader = req.headers.get("Authorization") ?? "";
  const isService = authHeader.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "__none__");

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: settings } = await supabase.from("uae_registry_settings").select("*").eq("id", 1).maybeSingle();
  const noResp = settings?.no_response_days ?? 14;
  const second = settings?.follow_up_days_second ?? 5;
  const final = settings?.follow_up_days_final ?? 10;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  let promoted = 0, marked = 0;

  for (const table of ["uae_dev_registry", "uae_brk_registry"]) {
    // Records due for follow-up today
    const { data: due } = await supabase.from(table)
      .select("id, first_email_sent_at, number_of_follow_ups_sent, outreach_status, last_reply_received_at")
      .eq("next_follow_up_date", todayStr)
      .in("outreach_status", ["Test Sent", "Contacted", "Follow-up Needed"]);
    for (const r of due ?? []) {
      const sent = r.number_of_follow_ups_sent ?? 0;
      const next = new Date();
      if (sent === 0) next.setDate(today.getDate() + (second - 2));
      else if (sent === 1) next.setDate(today.getDate() + (final - second));
      else next.setDate(today.getDate() + (noResp - final));
      await supabase.from(table).update({
        outreach_status: "Follow-up Needed",
        number_of_follow_ups_sent: sent + 1,
        next_follow_up_date: next.toISOString().slice(0, 10),
      }).eq("id", r.id);
      promoted++;
    }

    // Mark No Response after threshold
    const cutoff = new Date(); cutoff.setDate(today.getDate() - noResp);
    const { data: stale } = await supabase.from(table)
      .select("id")
      .lt("first_email_sent_at", cutoff.toISOString())
      .is("last_reply_received_at", null)
      .in("outreach_status", ["Test Sent", "Contacted", "Follow-up Needed"]);
    for (const r of stale ?? []) {
      await supabase.from(table).update({ outreach_status: "No Response", next_follow_up_date: null }).eq("id", r.id);
      marked++;
    }
  }

  return new Response(JSON.stringify({ ok: true, promoted, marked }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
