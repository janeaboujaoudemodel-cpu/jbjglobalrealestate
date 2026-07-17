// Sends briefing survey emails: owner (rate the developer's sales rep) + brokers who attended
// (rate the briefing/rep). Creates one-time tokens; recipients fill the survey on a public page.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_PUBLIC_URL") || "https://jbj.ae";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function makeToken() {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "JBJ Global <noreply@jbj.ae>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("resend error", res.status, t);
    throw new Error(`Email send failed: ${res.status}`);
  }
  return res.json();
}

function surveyHtml(opts: { name: string; briefing: string; developer: string; repName: string; role: "owner" | "broker"; url: string }) {
  const roleCopy =
    opts.role === "owner"
      ? `Please take 30 seconds to rate ${opts.repName} — the developer's sales representative who ran your ${opts.developer} briefing.`
      : `Thank you for attending the ${opts.developer} briefing. Please rate ${opts.repName} so we keep raising the bar for our brokers.`;
  return `<!doctype html><html><body style="margin:0;padding:0;background:#FDFBF7;font-family:Inter,Arial,sans-serif;color:#1A1A1A">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="border:1px solid #B89555;border-radius:12px;padding:28px;background:#ffffff">
      <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#B89555;margin:0 0 8px">JBJ Global — Briefing survey</p>
      <h1 style="font-family:'Cormorant Garamond',serif;font-weight:600;font-size:26px;margin:0 0 14px;color:#064E3B">Hi ${opts.name || "there"},</h1>
      <p style="font-size:15px;line-height:1.55;margin:0 0 16px">${roleCopy}</p>
      <p style="font-size:14px;line-height:1.55;color:#1A1A1A/.75;margin:0 0 22px"><strong>Briefing:</strong> ${opts.briefing}</p>
      <p style="text-align:center;margin:26px 0">
        <a href="${opts.url}" style="display:inline-block;background:#064E3B;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px">Rate the sales rep</a>
      </p>
      <p style="font-size:12px;color:#1A1A1A/.6;margin:16px 0 0">This link is unique to you and expires in 30 days.</p>
    </div>
  </div></body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { briefing_id } = await req.json();
    if (!briefing_id) throw new Error("briefing_id required");

    const supa = createClient(SUPABASE_URL, SERVICE_KEY);

    // Auth: only owner may trigger
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const { data: userRes } = await supa.auth.getUser(authHeader.replace("Bearer ", ""));
    const uid = userRes?.user?.id;
    if (!uid) throw new Error("Not authenticated");
    const { data: isOwner } = await supa.rpc("has_role", { _user_id: uid, _role: "owner" });
    if (!isOwner) throw new Error("Only owners can send briefing surveys");

    const { data: briefing, error: bErr } = await supa
      .from("briefing_requests")
      .select("id, developer_name, project_name, briefing_date, sales_rep_id, representative_id, requester_email, requester_name, brokers_emails")
      .eq("id", briefing_id)
      .maybeSingle();
    if (bErr || !briefing) throw new Error("Briefing not found");

    // Resolve rep name
    let repName = "the sales rep";
    if (briefing.sales_rep_id) {
      const { data: r } = await supa.from("developer_sales_reps").select("full_name").eq("id", briefing.sales_rep_id).maybeSingle();
      if (r?.full_name) repName = r.full_name;
    } else if (briefing.representative_id) {
      const { data: r } = await supa.from("developer_representatives").select("full_name").eq("id", briefing.representative_id).maybeSingle();
      if (r?.full_name) repName = r.full_name;
    }

    // Resolve developer for FK
    const { data: dev } = await supa.from("developers").select("id").eq("name", briefing.developer_name).maybeSingle();

    // Recipients: owner (from crm_owner_settings admin_email fallback) + brokers list
    const recipients: Array<{ email: string; name: string; role: "owner" | "broker" }> = [];
    const { data: owners } = await supa
      .from("user_roles")
      .select("user_id")
      .eq("role", "owner")
      .limit(1);
    if (owners?.[0]?.user_id) {
      const { data: prof } = await supa.from("profiles").select("email, display_name, full_name").eq("id", owners[0].user_id).maybeSingle();
      if (prof?.email) recipients.push({ email: prof.email, name: prof.display_name || prof.full_name || "Owner", role: "owner" });
    }
    const brokerEmails: string[] = Array.isArray((briefing as any).brokers_emails) ? (briefing as any).brokers_emails : [];
    for (const e of brokerEmails) {
      if (typeof e === "string" && e.includes("@")) recipients.push({ email: e, name: "", role: "broker" });
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, message: "No recipients (add brokers or configure owner email)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create tokens + send emails
    let sent = 0;
    for (const rcp of recipients) {
      const token = makeToken();
      const { error: tErr } = await supa.from("briefing_survey_tokens").insert({
        token,
        briefing_id: briefing.id,
        recipient_role: rcp.role,
        recipient_email: rcp.email,
        recipient_name: rcp.name || null,
        sales_rep_id: briefing.sales_rep_id,
        representative_id: briefing.representative_id,
      });
      if (tErr) {
        console.error("token insert", tErr);
        continue;
      }
      const url = `${APP_URL}/survey/briefing/${token}`;
      try {
        await sendEmail(
          rcp.email,
          `Rate ${repName} — ${briefing.developer_name} briefing`,
          surveyHtml({
            name: rcp.name,
            briefing: `${briefing.project_name || briefing.developer_name} · ${briefing.briefing_date}`,
            developer: briefing.developer_name,
            repName,
            role: rcp.role,
            url,
          }),
        );
        sent++;
      } catch (e) {
        console.error("send fail", rcp.email, e);
      }
    }

    return new Response(JSON.stringify({ ok: true, sent, total: recipients.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("send-briefing-survey", e);
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
