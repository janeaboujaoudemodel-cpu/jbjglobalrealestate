/**
 * CRM Send Developer Registration Email
 *
 * Sends a branded broker-registration request email to a UAE developer
 * with the owner's Google Drive document pack link.
 *
 * Owner-only. Uses Resend.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAIL = "janeaboujaoudenails@gmail.com";

interface Body {
  developerId: string;
  overrideEmail?: string;
  overrideMessage?: string;
}

const buildEmail = (opts: {
  developerName: string;
  driveUrl: string;
  fromName: string;
  replyTo: string;
  ccEmail: string;
  overrideMessage?: string;
}) => {
  const intro = opts.overrideMessage?.trim() ||
`Dear ${opts.developerName} Broker Relations Team,

We at JBJ GLOBAL REAL ESTATE would like to formally request broker registration with ${opts.developerName}. Our brokerage is fully RERA-licensed in Dubai and actively placing investors across the UAE prime market.`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#FAF7F2;font-family:Inter,Arial,sans-serif;color:#0a0a0a;">
  <div style="max-width:640px;margin:0 auto;padding:32px 24px;background:#ffffff;border:1px solid #eadfcf;border-radius:16px;">
    <div style="border-bottom:1px solid #eadfcf;padding-bottom:20px;margin-bottom:24px;">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7a6748;">JBJ Global Real Estate</div>
      <h1 style="font-size:22px;margin:8px 0 0;color:#0a0a0a;">Broker Registration Request</h1>
    </div>
    <div style="font-size:14px;line-height:1.7;white-space:pre-line;color:#0a0a0a;">${intro.replace(/</g,"&lt;")}</div>
    <p style="font-size:14px;line-height:1.7;color:#0a0a0a;margin:18px 0;">
      Please find our company documents (Trade License, RERA Card, Authorised Signatory ID, MOU draft and broker profile) at the secure link below:
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.driveUrl}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:14px;">Open Document Pack</a>
    </div>
    <div style="background:#FAF7F2;border:1px solid #eadfcf;border-radius:10px;padding:14px 16px;font-size:13px;line-height:1.6;color:#0a0a0a;margin:24px 0;">
      <strong>For any questions,</strong> please reply directly to <a href="mailto:${opts.replyTo}" style="color:#0a0a0a;">${opts.replyTo}</a> and CC <a href="mailto:${opts.ccEmail}" style="color:#0a0a0a;">${opts.ccEmail}</a> so our team can assist you further.
    </div>
    <p style="font-size:13px;line-height:1.6;color:#0a0a0a;margin:18px 0 4px;">Kindly share the registration form, NOC requirements, agency code and commission structure to complete onboarding.</p>
    <p style="font-size:13px;line-height:1.6;color:#0a0a0a;margin:24px 0 0;">Warm regards,<br/><strong>${opts.fromName}</strong><br/>${opts.replyTo}</p>
  </div>
  <div style="text-align:center;font-size:11px;color:#7a6748;padding:14px;">JBJ GLOBAL REAL ESTATE · RERA Licensed Brokerage · Dubai, UAE</div>
</body></html>`;
  return html;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("NO_AUTH");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || user.email !== OWNER_EMAIL) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { developerId, overrideEmail, overrideMessage } = (await req.json()) as Body;

    const { data: dev, error: devErr } = await service
      .from("crm_developer_registry")
      .select("*")
      .eq("id", developerId)
      .single();
    if (devErr || !dev) throw new Error("Developer not found");

    const recipient = (overrideEmail || dev.developer_email || "").trim();
    if (!recipient || !recipient.includes("@")) {
      return new Response(JSON.stringify({ error: "No email on file for this developer. Edit the row to add one." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: settings } = await service
      .from("crm_owner_settings").select("*").eq("owner_id", user.id).maybeSingle();

    if (!settings?.drive_doc_pack_url) {
      return new Response(JSON.stringify({ error: "Add a Google Drive document pack link in the Document Pack panel first." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const fromName = settings.from_name || "JBJ Global Real Estate";
    const replyTo = settings.reply_to_email || "contact@jbj.ae";
    const ccEmail = settings.cc_email || "info.jane@thegmail.com";

    const html = buildEmail({
      developerName: dev.developer_name,
      driveUrl: settings.drive_doc_pack_url,
      fromName, replyTo, ccEmail,
      overrideMessage,
    });

    const cc = settings.cc_jane_enabled ? [ccEmail] : [];

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${replyTo}>`,
        to: [recipient],
        cc,
        reply_to: replyTo,
        subject: `Broker Registration Request — JBJ Global Real Estate`,
        html,
      }),
    });

    const resendJson = await resendRes.json();
    if (!resendRes.ok) {
      return new Response(JSON.stringify({ error: resendJson?.message || "Resend send failed", details: resendJson }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update registry: bump counters, advance status if not started
    const newStatus = dev.status === "not_started" ? "pending_application" : dev.status;
    await service.from("crm_developer_registry").update({
      last_outreach_at: new Date().toISOString(),
      outreach_count: (dev.outreach_count || 0) + 1,
      status: newStatus,
      developer_email: dev.developer_email || recipient,
    }).eq("id", dev.id);

    return new Response(JSON.stringify({ ok: true, recipient, messageId: resendJson?.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("crm-send-developer-registration error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
