import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_URL = "https://api.resend.com/emails";
const VERIFIED_SENDER = 'noreply@jbj.ae';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmail(payload: { from: string; to: string[]; subject: string; html: string }) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("Resend API error:", JSON.stringify(data));
    return { error: data };
  }
  return { data };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId, newStatus, adminNote } = await req.json();
    
    if (!ticketId || !newStatus) {
      return new Response(JSON.stringify({ error: "Missing ticketId or newStatus" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch ticket
    const { data: ticket, error: fetchError } = await supabaseClient
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (fetchError || !ticket) {
      console.error("Ticket not found:", fetchError);
      return new Response(JSON.stringify({ error: "Ticket not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const surveyLink = `https://jbjglobalrealestate.lovable.app/ticket-survey?ticket=${encodeURIComponent(ticket.ticket_number)}&email=${encodeURIComponent(ticket.email)}`;

    // Status-specific content
    const statusContent: Record<string, { title: string; subtitle: string; step1Active: boolean; step2Active: boolean; step3Active: boolean; extraHtml: string }> = {
      in_progress: {
        title: "Your Ticket Is Being Reviewed",
        subtitle: "Our support team is now actively reviewing your ticket. We'll get back to you shortly.",
        step1Active: true, step2Active: true, step3Active: false,
        extraHtml: adminNote ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin-bottom:24px;"><tr><td style="padding:20px;"><p style="font-weight:bold;color:#1a1a1a;margin:0 0 8px;">Admin Note:</p><p style="color:#555;margin:0;">${adminNote}</p></td></tr></table>` : '',
      },
      resolved: {
        title: "Your Ticket Has Been Resolved",
        subtitle: "We're pleased to let you know that your support ticket has been resolved. If you need further assistance, feel free to reach out.",
        step1Active: true, step2Active: true, step3Active: true,
        extraHtml: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin-bottom:24px;"><tr><td style="padding:24px;text-align:center;"><p style="color:#1a1a1a;font-size:16px;font-weight:bold;margin:0 0 8px;">Rate Your Experience</p><p style="color:#666;font-size:13px;margin:0 0 16px;">Help us improve by sharing your feedback</p><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="padding:0 4px;"><a href="${surveyLink}&rating=1" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td><td style="padding:0 4px;"><a href="${surveyLink}&rating=2" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td><td style="padding:0 4px;"><a href="${surveyLink}&rating=3" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td><td style="padding:0 4px;"><a href="${surveyLink}&rating=4" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td><td style="padding:0 4px;"><a href="${surveyLink}&rating=5" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td></tr></table><p style="margin:12px 0 0;"><a href="${surveyLink}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Complete Survey &amp; Earn 50 Points</a></p></td></tr></table>`,
      },
    };

    const content = statusContent[newStatus];
    if (!content) {
      return new Response(JSON.stringify({ error: "Unsupported status for email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const makeStep = (num: string, label: string, active: boolean) => {
      const bg = active ? 'background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;' : 'background:#e5e5e5;color:#999;';
      const textColor = active ? 'color:#C8A766;font-weight:600;' : 'color:#999;';
      const icon = active ? '&#10003;' : num;
      return `<td width="33%" style="text-align:center;vertical-align:top;padding:0 8px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="width:44px;height:44px;border-radius:50%;${bg}text-align:center;vertical-align:middle;line-height:44px;font-size:18px;font-weight:bold;">${icon}</td></tr></table><p style="font-size:11px;${textColor}text-transform:uppercase;letter-spacing:0.5px;margin:8px 0 0;">${label}</p></td>`;
    };

    // Only show reopen section for resolved tickets
    const reopenHtml = newStatus === 'resolved' ? `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
<tr><td style="background:linear-gradient(135deg,#fff5f5,#fff0f0);border:2px dashed #e74c3c;border-radius:12px;padding:25px;text-align:center;">
<p style="color:#c0392b;margin:0 0 10px;font-size:16px;font-weight:bold;">🔄 Issue Not Resolved?</p>
<p style="color:#666;font-size:13px;margin:0 0 15px;">If your issue persists, you can reopen this ticket anytime.</p>
<a href="https://jbjglobalrealestate.lovable.app/reopen-ticket?ticket=${encodeURIComponent(ticket.ticket_number)}" style="display:inline-block;background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;text-decoration:none;padding:14px 30px;border-radius:8px;font-weight:bold;font-size:14px;">Reopen This Ticket</a>
</td></tr></table>` : '';

    const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>body{margin:0;padding:0;background-color:#F5EBD7;font-family:'Segoe UI',Arial,sans-serif;}
@media only screen and (max-width:620px){.wrapper{width:100%!important;padding:0 8px!important;}.hero-pad{padding:32px 20px!important;}.content-pad{padding:24px 16px!important;}}</style>
</head>
<body style="margin:0;padding:0;background-color:#F5EBD7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5EBD7;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:linear-gradient(180deg,#FFFFFF,#FDFBF7,#F5F0E6);border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(200,167,102,0.15);">
<!-- Header - Full width touching edges -->
<tr><td class="hero-pad" style="background:linear-gradient(135deg,#C8A766,#B8956E,#A07D4A);padding:40px 32px;text-align:center;">
<p style="font-size:28px;font-weight:bold;color:#1a1a1a;margin:0 0 8px;">JBJ Global Real Estate</p>
<p style="font-size:16px;color:#2d2d2d;margin:0;font-weight:500;">${content.title}</p>
</td></tr>
<!-- Content -->
<tr><td class="content-pad" style="padding:32px;">
<p style="font-size:15px;color:#333;margin:0 0 16px;">Dear <strong>${ticket.full_name}</strong>,</p>
<p style="font-size:14px;color:#555;margin:0 0 24px;">${content.subtitle}</p>
<!-- Progress - circles with proper containment -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr>${makeStep('1', 'Received', content.step1Active)}${makeStep('2', 'In Review', content.step2Active)}${makeStep('3', 'Resolved', content.step3Active)}</tr>
</table>
<!-- Ticket Info -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:20px;text-align:center;">
<p style="color:#666;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Ticket Number</p>
<p style="color:#C8A766;font-size:22px;font-weight:bold;margin:0;letter-spacing:2px;font-family:'Courier New',monospace;">${ticket.ticket_number}</p>
</td></tr></table>
${content.extraHtml}
${reopenHtml}
<p style="font-size:14px;color:#333;">Best regards,<br><span style="color:#C8A766;font-weight:600;">JBJ Global Real Estate Support Team</span></p>
</td></tr>
<!-- Footer - Full width touching edges -->
<tr><td style="background:linear-gradient(135deg,#1a1a1a,#2d2d2d);text-align:center;padding:24px;">
<p style="color:#C8A766;font-size:16px;font-weight:bold;margin:0 0 4px;">JBJ Global Real Estate</p>
<p style="color:#888;font-size:11px;margin:0 0 8px;font-style:italic;">The Only Global AI-Powered Real Estate Intelligence Platform</p>
<p style="color:#888;font-size:11px;margin:0;">&copy; 2026 JBJ Global Real Estate. All rights reserved.</p>
</td></tr>
</table></td></tr></table>
</body></html>`;

    const subjectLine = newStatus === 'resolved' 
      ? `[${ticket.ticket_number}] Your Ticket Has Been Resolved`
      : `[${ticket.ticket_number}] Your Ticket Is Being Reviewed`;

    const result = await sendEmail({
      from: `JBJ Support <${VERIFIED_SENDER}>`,
      to: [ticket.email],
      subject: subjectLine,
      html: emailHtml,
    });

    if (result.error) {
      console.error("Status email failed:", result.error);
      return new Response(JSON.stringify({ error: "Email send failed", details: result.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`Status email sent for ${ticket.ticket_number} -> ${newStatus}`);

    // Create user_notification for the ticket owner (server-side, bypasses RLS)
    if (ticket.user_id) {
      const statusLabels: Record<string, string> = {
        in_progress: "is under review",
        resolved: "has been resolved",
      };
      const label = statusLabels[newStatus] || `status changed to ${newStatus}`;

      await supabaseClient.from("user_notifications").insert({
        user_id: ticket.user_id,
        type: "support_ticket",
        title: `Ticket ${ticket.ticket_number} Update`,
        message: `Your ticket "${ticket.subject}" ${label}.`,
        metadata: { ticket_number: ticket.ticket_number, ticket_id: ticketId, action: newStatus },
        is_read: false,
      });
    }

    return new Response(JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: unknown) {
    console.error("Error in send-ticket-status-email:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

serve(handler);
